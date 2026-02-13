from kitconcept.plate import _
from plone.app.textfield import RichText
from plone.supermodel import model
from zope import schema


class IMeetingNotes(model.Schema):
    """Schema for meeting notes."""
