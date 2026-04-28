from plone import api
from plone.base.utils import base_hasattr


def rename_wiki_to_workspace(context):
    """Rename the Wiki container type to Workspace on existing sites."""
    portal = api.portal.get()
    portal_types = api.portal.get_tool("portal_types")

    for brain in api.content.find(portal_type="Wiki"):
        obj = brain.getObject()
        obj.portal_type = "Workspace"
        if base_hasattr(obj, "reindexObject"):
            obj.reindexObject(idxs=["portal_type"])

    if base_hasattr(portal_types, "Wiki"):
        portal_types.manage_delObjects(["Wiki"])
