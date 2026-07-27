"""Content lifecycle subscribers for Plate mentions."""

from kitconcept.plate import logger
from kitconcept.plate.mentions import mentions_utility
from plone.dexterity.content import DexterityContent
from zope.lifecycleevent import ObjectAddedEvent
from zope.lifecycleevent import ObjectModifiedEvent


def send_pending_notifications(
    context: DexterityContent, event: ObjectAddedEvent | ObjectModifiedEvent
) -> None:
    """Deliver request-scoped mentions after content is added or modified."""
    utility = mentions_utility()
    if total := utility.send_pending_notifications(context):
        logger.info(
            "Sent %d Plate mention notifications for %s", total, context.absolute_url()
        )
