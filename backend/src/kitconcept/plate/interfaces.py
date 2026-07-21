"""Module where all interfaces, events and exceptions live."""

from zope.interface import Interface
from zope.publisher.interfaces.browser import IDefaultBrowserLayer


class IBrowserLayer(IDefaultBrowserLayer):
    """Marker interface that defines a browser layer."""


class IMentions(Interface):
    """Named utility that extracts and notifies Plate user mentions."""

    def iter_mentions(value):
        """Yield mention nodes from a Plate value or discussion structure."""

    def new_mentions(incoming_block, existing_block):
        """Return mention nodes newly introduced by this save."""

    def queue_notifications(context, mentions, author):
        """Keep newly introduced mentions until the lifecycle event fires."""

    def send_notifications(context, mentions, author):
        """Send one notification per newly mentioned user."""

    def send_pending_notifications(context):
        """Deliver mentions queued for this context by an earlier save."""
