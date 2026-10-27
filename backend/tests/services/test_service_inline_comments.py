"""Functional tests for the view-mode inline comments REST service."""

from copy import deepcopy
from plone import api
from plone.locking.interfaces import ILockable

import pytest
import transaction


CONTENT_RICH = [{"type": "p", "children": [{"text": "Looks good"}]}]


def make_block():
    return {
        "@type": "__somersault__",
        "value": [
            {
                "type": "p",
                "id": "paragraph-1",
                "children": [{"text": "Alpha beta gamma"}],
            }
        ],
        "discussions": {},
    }


def make_anchor(text="beta", start=6, end=10):
    return {
        "blockId": "paragraph-1",
        "start": {"path": [0, 0], "offset": start},
        "end": {"path": [0, 0], "offset": end},
        "text": text,
    }


@pytest.mark.portal(
    content=[
        {
            "_container": "/",
            "type": "Workspace",
            "id": "comments-workspace",
            "title": "Comments Workspace",
        },
        {
            "_container": "/comments-workspace",
            "type": "WikiPage",
            "id": "comments-page",
            "title": "Comments Page",
        },
    ],
    roles=["Manager"],
)
class TestInlineCommentsService:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, manager_request):
        self.portal = functional_portal
        self.page = self.portal["comments-workspace"]["comments-page"]
        self.page.blocks = {"__somersault__": make_block()}
        self.session = manager_request
        self.content_path = "/comments-workspace/comments-page"
        self.path = f"{self.content_path}/@inline-comments"
        self.portal.MailHost.reset()
        transaction.commit()
        yield
        transaction.begin()
        lockable = ILockable(self.page, None)
        if lockable is not None:
            lockable.clear_locks()
        transaction.commit()

    def content_block(self):
        response = self.session.get(self.content_path)
        assert response.status_code == 200, response.text
        return response.json()["blocks"]["__somersault__"]

    def create_thread(self, content_rich=None, anchor=None):
        response = self.session.post(
            self.path,
            json={
                "anchor": anchor or make_anchor(),
                "contentRich": content_rich or deepcopy(CONTENT_RICH),
            },
        )
        assert response.status_code == 201, response.text
        assert "block" not in response.json()
        block = self.content_block()
        discussion = next(iter(block["discussions"].values()))
        return block, discussion

    def test_get_exposes_capability_and_lock_without_duplicate_content(self):
        response = self.session.get(self.path)
        assert response.status_code == 200, response.text
        data = response.json()
        assert response.headers["Cache-Control"] == "no-store"
        assert data["canComment"] is True
        assert data["lock"]["locked"] is False
        assert "block" not in data

    def test_mutation_content_is_refetched_through_normal_serialization(self):
        workspace = self.portal["comments-workspace"]
        with api.env.adopt_roles(["Manager"]):
            image = api.content.create(
                container=workspace,
                type="Image",
                id="inline-comments-image",
                title="Inline comments image",
            )
        self.page.blocks = {
            "__somersault__": {
                "@type": "__somersault__",
                "value": [
                    {
                        "type": "ploneBlock",
                        "@type": "plateimage",
                        "id": "image-1",
                        "url": f"../resolveuid/{image.UID()}",
                        "image_field": "image",
                        "children": [{"text": ""}],
                    },
                    {
                        "type": "p",
                        "id": "paragraph-1",
                        "children": [{"text": "Alpha beta gamma"}],
                    },
                ],
                "discussions": {},
            }
        }
        transaction.commit()

        response = self.session.post(
            self.path,
            json={
                "anchor": {
                    "blockId": "paragraph-1",
                    "start": {"path": [1, 0], "offset": 6},
                    "end": {"path": [1, 0], "offset": 10},
                    "text": "beta",
                },
                "contentRich": deepcopy(CONTENT_RICH),
            },
        )

        assert response.status_code == 201, response.text
        assert "block" not in response.json()
        image_node = self.content_block()["value"][0]
        assert "resolveuid" not in image_node["url"]
        assert image_node["url"].endswith("/comments-workspace/inline-comments-image")

    def test_create_marks_the_selection_and_stamps_server_fields(self):
        block, discussion = self.create_thread()
        comment = discussion["comments"][0]
        assert discussion["documentContent"] == "beta"
        assert discussion["userId"] == "admin"
        assert comment["userId"] == "admin"
        assert comment["contentRich"] == CONTENT_RICH
        assert comment["createdAt"]

        children = block["value"][0]["children"]
        assert [leaf["text"] for leaf in children] == ["Alpha ", "beta", " gamma"]
        assert children[1]["comment"] is True
        assert children[1][f"comment_{discussion['id']}"] is True

    def test_create_uses_javascript_utf16_offsets(self):
        # "🎉" is one Python code point but two JavaScript UTF-16 code units.
        block = make_block()
        block["value"][0]["children"][0]["text"] = "🎉 Alpha beta"
        self.page.blocks = {"__somersault__": block}
        transaction.commit()

        block, _discussion = self.create_thread(
            anchor=make_anchor(text="beta", start=9, end=13)
        )
        children = block["value"][0]["children"]
        assert [leaf["text"] for leaf in children] == ["🎉 Alpha ", "beta"]

    def test_create_spans_several_top_level_blocks(self):
        block = make_block()
        block["value"].append({
            "type": "p",
            "id": "paragraph-2",
            "children": [{"text": "Delta epsilon"}],
        })
        self.page.blocks = {"__somersault__": block}
        transaction.commit()

        anchor = {
            "blockId": "paragraph-1",
            "start": {"path": [0, 0], "offset": 11},
            "end": {"path": [1, 0], "offset": 5},
            # Slate joins the text of several blocks without a separator.
            "text": "gammaDelta",
        }
        block, discussion = self.create_thread(anchor=anchor)
        key = f"comment_{discussion['id']}"
        first, second = block["value"][0]["children"], block["value"][1]["children"]
        assert [leaf["text"] for leaf in first] == ["Alpha beta ", "gamma"]
        assert [leaf["text"] for leaf in second] == ["Delta", " epsilon"]
        assert first[1][key] is True
        assert second[0][key] is True
        assert key not in first[0]
        assert key not in second[1]
        assert discussion["documentContent"] == "gammaDelta"

    def test_anchor_offset_inside_surrogate_pair_is_stale(self):
        block = make_block()
        block["value"][0]["children"][0]["text"] = "🎉 Alpha beta"
        self.page.blocks = {"__somersault__": block}
        transaction.commit()

        response = self.session.post(
            self.path,
            json={
                "anchor": make_anchor(text="\ud83c", start=1, end=3),
                "contentRich": deepcopy(CONTENT_RICH),
            },
        )
        assert response.status_code == 409
        assert response.json()["error"]["type"] == "StaleAnchor"

    def test_rich_comment_preserves_and_notifies_mentions(
        self, make_plate_mention, get_messages, get_msg_body
    ):
        content_rich = [
            {
                "type": "p",
                "children": [
                    {"text": "Please ask "},
                    make_plate_mention("mention-from-view", "mentioned-user"),
                    {"text": " about this."},
                ],
            }
        ]
        block, discussion = self.create_thread(content_rich=content_rich)
        stored = discussion["comments"][0]["contentRich"]
        assert stored == content_rich
        assert block["users"]["admin"]["id"] == "admin"
        messages = get_messages()
        assert len(messages) == 1
        assert messages[0]["To"] == "mentioned-user@example.com"
        assert "plateMention=mention-from-view" in get_msg_body(
            messages[0], "text/plain"
        )

    def test_reply_edit_resolve_reopen_and_delete(self):
        _block, discussion = self.create_thread()
        discussion_id = discussion["id"]
        first_comment_id = discussion["comments"][0]["id"]

        response = self.session.post(
            f"{self.path}/{discussion_id}",
            json={"contentRich": [{"type": "p", "children": [{"text": "Reply"}]}]},
        )
        assert response.status_code == 200, response.text
        second_comment = self.content_block()["discussions"][discussion_id]["comments"][
            1
        ]

        response = self.session.patch(
            f"{self.path}/{discussion_id}/{second_comment['id']}",
            json={
                "contentRich": [{"type": "p", "children": [{"text": "Edited reply"}]}]
            },
        )
        edited = self.content_block()["discussions"][discussion_id]["comments"][1]
        assert edited["isEdited"] is True
        assert edited["updatedAt"]

        response = self.session.patch(
            f"{self.path}/{discussion_id}", json={"isResolved": True}
        )
        resolved = self.content_block()["discussions"][discussion_id]
        assert resolved["isResolved"] is True
        assert resolved["resolvedBy"] == "admin"

        response = self.session.post(
            f"{self.path}/{discussion_id}",
            json={"contentRich": deepcopy(CONTENT_RICH)},
        )
        assert response.status_code == 400

        response = self.session.patch(
            f"{self.path}/{discussion_id}", json={"isResolved": False}
        )
        reopened = self.content_block()["discussions"][discussion_id]
        assert reopened["isResolved"] is False
        assert "resolvedBy" not in reopened

        response = self.session.delete(
            f"{self.path}/{discussion_id}/{second_comment['id']}"
        )
        remaining = self.content_block()["discussions"][discussion_id]["comments"]
        assert [item["id"] for item in remaining] == [first_comment_id]

        response = self.session.delete(
            f"{self.path}/{discussion_id}/{first_comment_id}"
        )
        block = self.content_block()
        assert block["discussions"] == {}
        leaf = block["value"][0]["children"][1]
        assert "comment" not in leaf
        assert f"comment_{discussion_id}" not in leaf

    def test_stale_anchor_returns_conflict_without_mutating_content(self):
        response = self.session.post(
            self.path,
            json={
                "anchor": make_anchor(text="not beta"),
                "contentRich": deepcopy(CONTENT_RICH),
            },
        )
        assert response.status_code == 409
        assert response.json()["error"]["type"] == "StaleAnchor"

        transaction.begin()
        page = self.portal["comments-workspace"]["comments-page"]
        assert page.blocks["__somersault__"]["discussions"] == {}

    def test_every_mutation_is_rejected_while_locked(self):
        _block, discussion = self.create_thread()
        discussion_id = discussion["id"]
        comment_id = discussion["comments"][0]["id"]
        lock_response = self.session.post(
            "/comments-workspace/comments-page/@lock", json={}
        )
        assert lock_response.status_code == 200
        capabilities = self.session.get(self.path).json()
        assert "block" not in capabilities
        assert capabilities["lock"]["locked"] is True
        assert capabilities["lock"]["creator"] == "admin"
        assert capabilities["lock"]["creator_name"] == "admin"
        assert capabilities["lock"]["created"]

        responses = [
            self.session.post(
                self.path,
                json={
                    "anchor": make_anchor(),
                    "contentRich": deepcopy(CONTENT_RICH),
                },
            ),
            self.session.post(
                f"{self.path}/{discussion_id}",
                json={"contentRich": deepcopy(CONTENT_RICH)},
            ),
            self.session.patch(
                f"{self.path}/{discussion_id}/{comment_id}",
                json={"contentRich": deepcopy(CONTENT_RICH)},
            ),
            self.session.patch(
                f"{self.path}/{discussion_id}", json={"isResolved": True}
            ),
            self.session.delete(f"{self.path}/{discussion_id}/{comment_id}"),
        ]
        for response in responses:
            assert response.status_code == 403
            assert response.json()["error"]["type"] == "ResourceLocked"

    def test_content_rich_rejects_malformed_mentions(self):
        response = self.session.post(
            self.path,
            json={
                "anchor": make_anchor(),
                "contentRich": [
                    {
                        "type": "p",
                        "children": [
                            {
                                "type": "mention",
                                "key": "mentioned-user",
                                "value": "Mentioned User",
                                "children": [{"text": ""}],
                            }
                        ],
                    }
                ],
            },
        )
        assert response.status_code == 400
