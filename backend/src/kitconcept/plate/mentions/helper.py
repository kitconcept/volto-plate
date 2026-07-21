"""Convenience accessor for the Plate mentions named utility."""

from kitconcept.plate.interfaces import IMentions
from kitconcept.plate.mentions.utility import Mentions
from zope.component import getUtility


MENTIONS = "kitconcept.plate.mentions"


def mentions_utility() -> Mentions:
    """Return the named utility for Plate mention extraction and notification."""
    return getUtility(IMentions, name=MENTIONS)
