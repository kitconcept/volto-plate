"""Action-specific REST service for Plate inline comments."""

from copy import deepcopy
from datetime import datetime
from datetime import UTC
from kitconcept.plate.mentions import mentions_utility
from plone import api
from plone.locking.interfaces import ILockable
from plone.restapi.behaviors import IBlocks
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from plone.restapi.services.locking import lock_info
from plone.restapi.services.users.get import getPortraitUrl
from plone.restapi.services.users.get import isDefaultPortrait
from uuid import uuid4
from zExceptions import BadRequest
from zExceptions import NotFound
from zExceptions import Unauthorized
from zope.event import notify
from zope.interface import alsoProvides
from zope.interface import implementer
from zope.lifecycleevent import Attributes
from zope.lifecycleevent import ObjectModifiedEvent
from zope.publisher.interfaces import IPublishTraverse

import json
import plone.protect.interfaces


SOMERSAULT_KEY = "__somersault__"
DISCUSS_PERMISSION = "kitconcept.plate: Discuss content"
MAX_COMMENT_BYTES = 50_000
MAX_COMMENT_NODES = 500


class StaleAnchor(BadRequest):
    """The submitted text selection no longer matches the stored document."""


def utcnow() -> str:
    return datetime.now(UTC).isoformat()


def _error(request, status: int, error_type: str, message: str):
    request.response.setStatus(status)
    return {"error": {"type": error_type, "message": message}}


def _has_permission(context) -> bool:
    return api.user.has_permission(DISCUSS_PERMISSION, obj=context)


def _is_locked(context) -> bool:
    """Return true for every active lock, including one owned by the caller."""
    lockable = ILockable(context, None)
    return bool(lockable is not None and lockable.locked())


def _lock_info(context):
    info = lock_info(context)
    creator = info.get("creator")
    if creator:
        membership = api.portal.get_tool("portal_membership")
        portrait = membership.getPersonalPortrait(creator)
        if portrait and not isDefaultPortrait(portrait):
            user = membership.getMemberById(creator)
            info["creator_portrait"] = getPortraitUrl(user)
    return info


def _current_user_id() -> str:
    user = api.user.get_current()
    user_id = user.getId() if user else None
    if not user_id:
        raise Unauthorized("Authentication is required to modify inline comments")
    return user_id


def _validate_rich_node(node, count):
    count[0] += 1
    if count[0] > MAX_COMMENT_NODES:
        raise BadRequest("contentRich contains too many nodes")
    if not isinstance(node, dict):
        raise BadRequest("Every contentRich node must be an object")

    if "text" in node:
        if not isinstance(node["text"], str):
            raise BadRequest("Text node values must be strings")
        return

    children = node.get("children")
    if not isinstance(children, list):
        raise BadRequest("Element nodes must contain a children array")
    if node.get("type") == "mention":
        for key in ("key", "mentionId", "value"):
            if not isinstance(node.get(key), str) or not node[key]:
                raise BadRequest(f"Mention nodes require a non-empty {key}")
    for child in children:
        _validate_rich_node(child, count)


def _validate_content_rich(value):
    """Validate a bounded Plate value while preserving rich marks and mentions."""
    if not isinstance(value, list) or not value:
        raise BadRequest("contentRich must be a non-empty Plate value")
    try:
        encoded = json.dumps(value).encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise BadRequest("contentRich must contain JSON values") from exc
    if len(encoded) > MAX_COMMENT_BYTES:
        raise BadRequest("contentRich is too large")

    count = [0]
    for root in value:
        _validate_rich_node(root, count)
    return deepcopy(value)


def _text_entries(value):
    entries = []

    # Slate paths contain child indexes only, not the JSON ``children`` key.
    def slate_visit(nodes, prefix=()):
        if not isinstance(nodes, list):
            return
        for index, node in enumerate(nodes):
            if not isinstance(node, dict):
                continue
            path = (*prefix, index)
            if isinstance(node.get("text"), str):
                entries.append((path, node))
            else:
                slate_visit(node.get("children"), path)

    slate_visit(value)
    return entries


def _point(value, data, label):
    if not isinstance(data, dict):
        raise BadRequest(f"anchor.{label} must be an object")
    path = data.get("path")
    offset = data.get("offset")
    if (
        not isinstance(path, list)
        or not path
        or not all(isinstance(item, int) and item >= 0 for item in path)
        or not isinstance(offset, int)
        or offset < 0
    ):
        raise BadRequest(f"anchor.{label} must contain a valid path and offset")

    target = next(
        (node for node_path, node in _text_entries(value) if list(node_path) == path),
        None,
    )
    index = _utf16_to_index(target["text"], offset) if target is not None else None
    if index is None:
        raise StaleAnchor(f"anchor.{label} no longer exists")
    return tuple(path), index


def _utf16_to_index(text, offset):
    """Convert a Slate (JavaScript UTF-16) offset to a Python string index.

    Characters outside the Basic Multilingual Plane, such as most emoji, take
    two UTF-16 code units but a single Python code point. Return ``None`` when
    the offset is past the end or splits a surrogate pair.
    """
    units = 0
    for index, char in enumerate(text):
        if units == offset:
            return index
        units += 2 if ord(char) > 0xFFFF else 1
        if units > offset:
            return None
    return len(text) if units == offset else None


def _validated_anchor(value, anchor):
    if not isinstance(anchor, dict):
        raise BadRequest("anchor is required")
    expected_text = anchor.get("text")
    if not isinstance(expected_text, str) or not expected_text:
        raise BadRequest("anchor.text must be non-empty")

    start = _point(value, anchor.get("start"), "start")
    end = _point(value, anchor.get("end"), "end")
    if start > end:
        start, end = end, start
    if start == end:
        raise BadRequest("The comment selection must not be collapsed")
    block_id = anchor.get("blockId")
    if block_id is not None:
        start_block = value[start[0][0]] if start[0] else None
        if not isinstance(start_block, dict) or start_block.get("id") != block_id:
            raise StaleAnchor("The selected block no longer matches")
    start_path, start_offset = start
    end_path, end_offset = end
    if start_path[0] != end_path[0]:
        raise BadRequest("Inline comments must stay within one top-level block")
    return expected_text, start_path, start_offset, end_path, end_offset


def _mark_nodes(nodes, start_path, start_offset, end_path, end_offset, key, prefix=()):
    selected = []
    result = []
    for index, node in enumerate(nodes):
        path = (*prefix, index)
        if not isinstance(node, dict):
            result.append(node)
        elif "text" not in node:
            copied = deepcopy(node)
            children, child_selection = _mark_nodes(
                node.get("children", []),
                start_path,
                start_offset,
                end_path,
                end_offset,
                key,
                path,
            )
            copied["children"] = children
            selected.extend(child_selection)
            result.append(copied)
        elif path < start_path or path > end_path:
            result.append(deepcopy(node))
        else:
            text = node["text"]
            left = start_offset if path == start_path else 0
            right = end_offset if path == end_path else len(text)
            if right < left:
                raise StaleAnchor("The selected range is no longer valid")
            before, middle, after = text[:left], text[left:right], text[right:]
            if before:
                result.append({**deepcopy(node), "text": before})
            if middle:
                selected.append(middle)
                result.append({
                    **deepcopy(node),
                    "text": middle,
                    "comment": True,
                    key: True,
                })
            if after:
                result.append({**deepcopy(node), "text": after})
    return result, selected


def _mark_range(value, anchor, discussion_id):
    expected_text, start_path, start_offset, end_path, end_offset = _validated_anchor(
        value, anchor
    )
    key = f"comment_{discussion_id}"
    updated, selected = _mark_nodes(
        value, start_path, start_offset, end_path, end_offset, key
    )
    if "".join(selected) != expected_text:
        raise StaleAnchor("The selected text has changed; reload and try again")
    return updated


def _remove_marks(value, discussion_id):
    key = f"comment_{discussion_id}"

    def visit(node):
        if isinstance(node, list):
            return [visit(item) for item in node]
        if not isinstance(node, dict):
            return node
        copied = {name: visit(item) for name, item in node.items() if name != key}
        if "text" in copied and not any(
            name.startswith("comment_") and item for name, item in copied.items()
        ):
            copied.pop("comment", None)
        return copied

    return visit(value)


class InlineCommentsBase(Service):
    """Shared traversal and mutation helpers."""

    segments = None

    def publishTraverse(self, request, name):
        if name:
            if self.segments is None:
                self.segments = []
            self.segments.append(name)
        return self

    def _ids(self):
        segments = self.segments or []
        if len(segments) > 2:
            raise NotFound("Unknown inline comment path")
        return [*segments, None, None][:2]

    def _block(self):
        blocks = getattr(self.context, "blocks", None) or {}
        block = blocks.get(SOMERSAULT_KEY)
        if not isinstance(block, dict) or not isinstance(block.get("value"), list):
            raise NotFound("This content does not contain a Plate document")
        return deepcopy(block)

    def _discussion(self, block, discussion_id):
        discussion = block.get("discussions", {}).get(discussion_id)
        if not isinstance(discussion, dict):
            raise NotFound("Inline comment thread not found")
        return discussion

    def _comment(self, discussion, comment_id):
        comment = next(
            (
                item
                for item in discussion.get("comments", [])
                if item.get("id") == comment_id
            ),
            None,
        )
        if not isinstance(comment, dict):
            raise NotFound("Inline comment not found")
        return comment

    def _check_mutation(self):
        # REST calls authenticate independently of Plone's browser-form CSRF
        # token, so mark the request exactly like plone.restapi's @comments.
        if "IDisableCSRFProtection" in dir(plone.protect.interfaces):
            alsoProvides(self.request, plone.protect.interfaces.IDisableCSRFProtection)
        if not _has_permission(self.context):
            raise Unauthorized("You do not have permission to modify inline comments")
        if _is_locked(self.context):
            return _error(self.request, 403, "ResourceLocked", "Resource is locked.")
        return None

    def _save(self, previous_block, block):
        user = api.user.get_current()
        utility = mentions_utility()
        utility.queue_notifications(
            self.context,
            utility.new_mentions(block, previous_block),
            user,
        )

        blocks = deepcopy(self.context.blocks or {})
        blocks[SOMERSAULT_KEY] = block
        self.context.blocks = blocks
        notify(ObjectModifiedEvent(self.context, Attributes(IBlocks, "blocks")))
        return self._capabilities()

    def _capabilities(self):
        # Lock state can change in another browser between requests.
        self.request.response.setHeader("Cache-Control", "no-store")
        return {
            "canComment": _has_permission(self.context),
            "lock": _lock_info(self.context),
        }


@implementer(IPublishTraverse)
class InlineCommentsGet(InlineCommentsBase):
    """Return view-mode commenting capabilities."""

    def reply(self):
        return self._capabilities()


@implementer(IPublishTraverse)
class InlineCommentsAdd(InlineCommentsBase):
    """Create a new thread or reply to an existing one."""

    def reply(self):
        if error := self._check_mutation():
            return error
        body = json_body(self.request)
        content_rich = _validate_content_rich(body.get("contentRich"))
        user_id = _current_user_id()
        discussion_id, comment_id = self._ids()
        if comment_id:
            raise NotFound("Unknown inline comment path")

        previous_block = self._block()
        block = deepcopy(previous_block)
        discussions = block.setdefault("discussions", {})
        now = utcnow()

        if discussion_id:
            discussion = self._discussion(block, discussion_id)
            if discussion.get("isResolved"):
                raise BadRequest("Resolved threads cannot receive replies")
            discussion.setdefault("comments", []).append({
                "id": uuid4().hex,
                "contentRich": content_rich,
                "createdAt": now,
                "discussionId": discussion_id,
                "isEdited": False,
                "userId": user_id,
            })
        else:
            discussion_id = uuid4().hex
            try:
                block["value"] = _mark_range(
                    block["value"], body.get("anchor"), discussion_id
                )
            except StaleAnchor as exc:
                return _error(self.request, 409, "StaleAnchor", str(exc))
            discussions[discussion_id] = {
                "id": discussion_id,
                "comments": [
                    {
                        "id": uuid4().hex,
                        "contentRich": content_rich,
                        "createdAt": now,
                        "discussionId": discussion_id,
                        "isEdited": False,
                        "userId": user_id,
                    }
                ],
                "createdAt": now,
                "documentContent": body["anchor"]["text"],
                "isResolved": False,
                "userId": user_id,
            }
            self.request.response.setStatus(201)

        return self._save(previous_block, block)


@implementer(IPublishTraverse)
class InlineCommentsUpdate(InlineCommentsBase):
    """Resolve/reopen a thread or edit an owned comment."""

    def reply(self):
        if error := self._check_mutation():
            return error
        body = json_body(self.request)
        user_id = _current_user_id()
        discussion_id, comment_id = self._ids()
        if not discussion_id:
            raise BadRequest("A discussion id is required")

        previous_block = self._block()
        block = deepcopy(previous_block)
        discussion = self._discussion(block, discussion_id)

        if comment_id:
            comment = self._comment(discussion, comment_id)
            if comment.get("userId") != user_id:
                raise Unauthorized("You can only edit your own comments")
            comment["contentRich"] = _validate_content_rich(body.get("contentRich"))
            comment["isEdited"] = True
            comment["updatedAt"] = utcnow()
        else:
            is_resolved = body.get("isResolved")
            if not isinstance(is_resolved, bool):
                raise BadRequest("isResolved must be a boolean")
            was_resolved = bool(discussion.get("isResolved"))
            discussion["isResolved"] = is_resolved
            if is_resolved and not was_resolved:
                discussion["resolvedBy"] = user_id
                discussion["resolvedAt"] = utcnow()
            elif not is_resolved:
                discussion.pop("resolvedBy", None)
                discussion.pop("resolvedAt", None)

        return self._save(previous_block, block)


@implementer(IPublishTraverse)
class InlineCommentsDelete(InlineCommentsBase):
    """Delete an owned comment and clean up an empty thread."""

    def reply(self):
        if error := self._check_mutation():
            return error
        user_id = _current_user_id()
        discussion_id, comment_id = self._ids()
        if not discussion_id or not comment_id:
            raise BadRequest("Discussion and comment ids are required")

        previous_block = self._block()
        block = deepcopy(previous_block)
        discussion = self._discussion(block, discussion_id)
        comment = self._comment(discussion, comment_id)
        if comment.get("userId") != user_id:
            raise Unauthorized("You can only delete your own comments")

        discussion["comments"] = [
            item for item in discussion["comments"] if item.get("id") != comment_id
        ]
        if not discussion["comments"]:
            del block["discussions"][discussion_id]
            block["value"] = _remove_marks(block["value"], discussion_id)

        return self._save(previous_block, block)
