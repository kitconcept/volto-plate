from plone.restapi.interfaces import IJSONSummarySerializerMetadata
from zope.interface import implementer


@implementer(IJSONSummarySerializerMetadata)
class JSONSummarySerializerMetadata:
    """Additional metadata to be exposed on listings."""

    def default_metadata_fields(self):
        return {"image_field", "image_scales", "effective", "Subject"}

    def non_metadata_attributes(self):
        """Allow requested task source titles to resolve from the live task object."""
        return {"task_source_title"}
