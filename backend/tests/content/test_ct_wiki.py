from kitconcept.plate.content.wiki_page import IWikiPage
from plone import api
from plone.api.exc import InvalidParameterError
from plone.dexterity.fti import DexterityFTI

import pytest


@pytest.mark.portal(
    content=[
        {
            "_container": "/",
            "type": "Workspace",
            "id": "team-workspace",
            "title": "Team Workspace",
        }
    ],
    roles=["Manager"],
)
class TestWikiPage:
    portal_type: str = "WikiPage"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti) -> None:
        self.portal = portal
        self.workspace = portal["team-workspace"]
        self.fti: DexterityFTI = get_fti(self.portal_type)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Wiki Page"),
            ("factory", "WikiPage"),
            ("description", "A Plate-powered wiki page."),
            ("schema", "kitconcept.plate.content.wiki_page.IWikiPage"),
            ("allow_discussion", False),
            ("global_allow", False),
            ("filter_content_types", True),
            (
                "allowed_content_types",
                (
                    "WikiPage",
                    "File",
                    "Image",
                ),
            ),
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
            ))
        ),
    )
    def test_behaviors(self, idx: int, behavior: str):
        assert self.fti.behaviors[idx] == behavior

    def test_wikipage_requires_workspace_container(self, site_owner_name):
        with api.env.adopt_user(site_owner_name), pytest.raises(InvalidParameterError):
            api.content.create(
                container=self.portal,
                type=self.portal_type,
                title="Root Wiki Page",
            )

    def test_wikipage_created(self, site_owner_name):
        container = self.workspace
        with api.env.adopt_user(site_owner_name):
            page = api.content.create(
                container=container,
                type=self.portal_type,
                title="Workspace Wiki Page",
            )

        assert page.portal_type == self.portal_type
        assert page.aq_parent == container
        assert IWikiPage.providedBy(page)
