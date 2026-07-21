"""Mention extraction and notification helpers."""

from Acquisition import aq_base
from dataclasses import dataclass
from logging import getLogger
from plone import api
from plone.base.interfaces.controlpanel import IMailSchema
from plone.registry.interfaces import IRegistry
from Products.CMFCore.utils import getToolByName
from urllib.parse import urlencode
from zope.component import getUtility
from zope.globalrequest import getRequest


logger = getLogger(__name__)
PENDING_MENTIONS_KEY = "kitconcept.plate.pending_mention_notifications"


@dataclass(frozen=True)
class Mention:
    """A persisted mention and the link that points at it."""

    mention_id: str
    user_id: str


def iter_mentions(value):
    """Yield mention nodes from a Plate value or discussion structure."""
    if isinstance(value, list):
        for item in value:
            yield from iter_mentions(item)
    elif isinstance(value, dict):
        if value.get("type") == "mention":
            mention_id = value.get("mentionId")
            user_id = value.get("key")
            if isinstance(mention_id, str) and isinstance(user_id, str):
                yield Mention(mention_id=mention_id, user_id=user_id)
        for item in value.values():
            yield from iter_mentions(item)


def new_mentions(incoming_block, existing_block):
    """Return mention nodes newly introduced by this save."""
    old_ids = {mention.mention_id for mention in iter_mentions(existing_block)}
    return [
        mention
        for mention in iter_mentions(incoming_block)
        if mention.mention_id not in old_ids
    ]


def _context_key(context):
    """Return the same request key for acquisition-wrapped content."""
    return id(aq_base(context))


def queue_notifications(context, request, mentions, author):
    """Keep newly introduced mentions until the content lifecycle event fires."""
    if not mentions or not author:
        return

    pending = request.get(PENDING_MENTIONS_KEY, {})
    pending[_context_key(context)] = (author.getId(), tuple(mentions))
    request[PENDING_MENTIONS_KEY] = pending


def send_notifications(context, mentions, author):
    """Send one notification per newly mentioned user."""
    membership = getToolByName(context, "portal_membership")
    recipients = {}
    for mention in mentions:
        if mention.user_id == author.getId() or mention.user_id in recipients:
            continue
        recipient = membership.getMemberById(mention.user_id)
        email = recipient and recipient.getProperty("email")
        if email:
            recipients[mention.user_id] = (email, mention.mention_id)

    if not recipients:
        return

    registry = getUtility(IRegistry)
    mail_settings = registry.forInterface(IMailSchema, prefix="plone")
    payload = {
        "author": author.getProperty("fullname") or author.getId(),
        "from_address": mail_settings.email_from_address,
        "page_title": context.Title(),
        "page_url": context.absolute_url(),
        "recipients": recipients,
        "site_name": registry.get("plone.site_title", "Plone"),
    }
    for _user_id, (recipient, mention_id) in payload["recipients"].items():
        url = f"{payload['page_url']}?{urlencode({'plateMention': mention_id})}"
        message = (
            f"{payload['author']} mentioned you on '{payload['page_title']}'.\n\n"
            f"Open the mention: {url}\n"
        )
        try:
            # Editors can mention users, but normally cannot invoke MailHost.
            # This server-owned action has already validated both recipients and
            # content, so grant the narrow temporary role needed for delivery.
            with api.env.adopt_roles(["Manager"]):
                api.portal.send_email(
                    body=message,
                    recipient=recipient,
                    sender=payload["from_address"],
                    subject=f"You were mentioned on {payload['site_name']}",
                )
        except Exception:
            logger.exception("Unable to send Plate mention notification")


def send_pending_notifications(context, event):
    """Deliver request-scoped mentions after content has been added or modified."""
    request = getRequest()
    if request is None:
        return

    pending = request.get(PENDING_MENTIONS_KEY, {})
    queued = pending.pop(_context_key(context), None)
    if not queued:
        return

    author_id, mentions = queued
    author = getToolByName(context, "portal_membership").getMemberById(author_id)
    if author:
        send_notifications(context, mentions, author)
