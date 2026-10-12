from kitconcept.plate.tasks.catalog import synchronize
from plone import api


def install_inline_tasks(context):
    """Install task catalog fields and backfill existing Dexterity page documents."""
    context.runImportStepFromProfile("profile-kitconcept.plate:default", "catalog")
    catalog = api.portal.get_tool("portal_catalog")
    for brain in catalog.unrestrictedSearchResults(
        object_provides="plone.dexterity.interfaces.IDexterityContent"
    ):
        synchronize(brain.getObject(), catalog, legacy=True)
