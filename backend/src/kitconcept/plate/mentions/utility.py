"""Named utility for Plate mention extraction and notification."""

from Acquisition import aq_base
from collections.abc import Iterator
from kitconcept.plate import logger
from kitconcept.plate import types as t
from kitconcept.plate.interfaces import IMentions
from kitconcept.plate.utils import mail as mail_utils
from plone import api
from plone.dexterity.content import DexterityContent
from Products.PlonePAS.tools.memberdata import MemberData
from urllib.parse import urlencode
from zope.globalrequest import getRequest
from zope.interface import implementer
from ZPublisher.HTTPRequest import HTTPRequest


PENDING_MENTIONS_KEY = "kitconcept.plate.pending_mention_notifications"


@implementer(IMentions)
class Mentions:
    """Extract Plate mentions and notify newly mentioned users."""

    def _context_key(self, context: DexterityContent) -> int:
        """Return the same request key for acquisition-wrapped content.

        :param context: The content object being keyed.
        :returns: The identity of the unwrapped context.
        """
        return id(aq_base(context))

    def get_request(self) -> HTTPRequest | None:
        """Return the current request, if any."""
        return getRequest()

    def iter_mentions(self, value) -> Iterator[t.Mention]:
        """Yield mention nodes from a Plate value or discussion structure.

        :param value: A Plate value, discussion structure, or any nested
            list/dict fragment thereof.
        :returns: An iterator over the :class:`Mention` nodes found.
        """
        if isinstance(value, list):
            for item in value:
                yield from self.iter_mentions(item)
        elif isinstance(value, dict):
            if value.get("type") == "mention":
                mention_id = value.get("mentionId")
                user_id = value.get("key")
                if isinstance(mention_id, str) and isinstance(user_id, str):
                    yield t.Mention(mention_id=mention_id, user_id=user_id)
            for item in value.values():
                yield from self.iter_mentions(item)

    def new_mentions(self, incoming_block, existing_block) -> t.Mentions:
        """Return mention nodes newly introduced by this save.

        :param incoming_block: The block value being persisted.
        :param existing_block: The block value already stored, if any.
        :returns: The mentions in ``incoming_block`` whose stable id is not
            already present in ``existing_block``.
        """
        old_ids = {mention.mention_id for mention in self.iter_mentions(existing_block)}
        return [
            mention
            for mention in self.iter_mentions(incoming_block)
            if mention.mention_id not in old_ids
        ]

    def queue_notifications(
        self,
        context: DexterityContent,
        mentions: t.Mentions,
        author: MemberData,
    ) -> None:
        """Keep newly introduced mentions until the lifecycle event fires.

        :param context: The content object being saved.
        :param mentions: The newly introduced mentions to notify about.
        :param author: The member who authored the mentions.
        """
        request = self.get_request()
        if not (mentions and author and request):
            return

        pending = request.get(PENDING_MENTIONS_KEY, {})
        pending[self._context_key(context)] = (author.getId(), tuple(mentions))
        request[PENDING_MENTIONS_KEY] = pending

    def send_pending_notifications(self, context: DexterityContent) -> int:
        """Deliver mentions queued for this context by an earlier save.

        :param context: The content object whose queued mentions should be
            delivered, once the content lifecycle event has fired.
        :returns: The number of notifications sent.
        """
        total = 0
        if (request := self.get_request()) is None:
            return total

        pending = request.get(PENDING_MENTIONS_KEY, {})
        if not (queued := pending.pop(self._context_key(context), None)):
            return 0

        author_id, mentions = queued
        if author := api.user.get(userid=author_id):
            total = self.send_notifications(context, mentions, author)
        return total

    def _get_recipients(
        self, mentions: t.Mentions, author: MemberData
    ) -> dict[str, tuple[str, str]]:
        """Map each notifiable user to their email and triggering mention.

        The author is never a recipient of their own mentions, duplicate
        users are collapsed, and users without an email are skipped.

        :param mentions: The mentions to resolve to recipients.
        :param author: The member who authored the mentions.
        :returns: A mapping of user id to a ``(email, mention_id)`` pair.
        """
        recipients: dict[str, tuple[str, str]] = {}
        for mention in mentions:
            if mention.user_id == author.getId() or mention.user_id in recipients:
                continue
            recipient = api.user.get(userid=mention.user_id)
            if recipient and (email := recipient.getProperty("email")):
                recipients[mention.user_id] = (email, mention.mention_id)
        return recipients

    def _send_email(
        self, message: str, recipient: str, sender: str, site_name: str
    ) -> None:
        """Send a single mention notification email.

        :param message: The rendered plain-text body.
        :param recipient: The recipient email address.
        :param sender: The sender email address.
        :param site_name: The site name used in the subject line.
        """
        # Editors can mention users, but normally cannot invoke MailHost.
        # This server-owned action has already validated both recipients
        # and content, so grant the narrow temporary role needed for
        # delivery.
        with api.env.adopt_roles(["Manager"]):
            api.portal.send_email(
                body=message,
                recipient=recipient,
                sender=sender,
                subject=f"You were mentioned on {site_name}",
            )

    def send_notifications(
        self,
        context: DexterityContent,
        mentions: t.Mentions,
        author: MemberData,
    ) -> int:
        """Send one notification per newly mentioned user.

        :param context: The content object the mentions live on.
        :param mentions: The mentions to notify about.
        :param author: The member who authored the mentions; never notified
            about their own mentions.
        :returns: The number of notifications sent.
        """
        total = 0
        if not (recipients := self._get_recipients(mentions, author)):
            return total

        mail_settings = mail_utils.mail_settings()
        payload = {
            "author": author.getProperty("fullname") or author.getId(),
            "from_address": mail_settings.email_from_address,
            "page_title": context.title,
            "page_url": context.absolute_url(),
            "recipients": recipients,
            "site_name": mail_settings.site_title,
        }
        for _user_id, (recipient, mention_id) in payload["recipients"].items():
            url = f"{payload['page_url']}?{urlencode({'plateMention': mention_id})}"
            message = (
                f"{payload['author']} mentioned you on '{payload['page_title']}'.\n\n"
                f"Open the mention: {url}\n"
            )
            try:
                self._send_email(
                    message=message,
                    recipient=recipient,
                    sender=payload["from_address"],
                    site_name=payload["site_name"],
                )
            except ValueError:
                logger.exception("Unable to send Plate mention notification")
            else:
                total += 1
        return total
