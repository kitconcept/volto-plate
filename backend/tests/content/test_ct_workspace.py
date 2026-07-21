from kitconcept.plate.content.workspace import IWorkspace
from plone import api
from plone.dexterity.fti import DexterityFTI

import pytest


class TestWorkspace:
    portal_type: str = "Workspace"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti) -> None:
        self.portal = portal
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Workspace"),
            ("factory", "Workspace"),
            ("description", "A folderish workspace container."),
            ("schema", "kitconcept.plate.content.workspace.IWorkspace"),
            ("allow_discussion", False),
            ("global_allow", True),
            ("filter_content_types", True),
            ("allowed_content_types", ("WikiPage", "File", "Image")),
        ],
    )
    def test_fti(self, attr: str, expected):
        assert isinstance(self.fti, DexterityFTI)
        assert getattr(self.fti, attr) == expected

    @pytest.mark.parametrize(
        "idx,behavior",
        (
            enumerate((
                "plone.basic",
                "volto.preview_image_link",
                "plone.categorization",
                "plone.publication",
                "plone.ownership",
                "plone.relateditems",
                "plone.shortname",
                "volto.navtitle",
                "plone.excludefromnavigation",
                "plone.allowdiscussion",
                "volto.blocks",
                "plone.constraintypes",
                "plone.namefromtitle",
                "plone.versioning",
                "plone.locking",
                "plone.translatable",
                "kitconcept.plate.workspace",
            ))
        ),
    )
    def test_behaviors(self, idx: int, behavior: str):
        assert self.fti.behaviors[idx] == behavior

    def test_workspace_created(self, site_owner_name):
        container = self.portal
        with api.env.adopt_user(site_owner_name):
            page = api.content.create(
                container=container,
                type=self.portal_type,
                title="Engineering Workspace",
            )

        assert page.portal_type == self.portal_type
        assert page.aq_parent == container
        assert IWorkspace.providedBy(page)
