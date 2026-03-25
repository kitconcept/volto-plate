from plone import api

from kitconcept.plate.content.wiki_page import IWikiPage


class TestWikiPage:
    def test_wiki_page_fti_registered(self, portal):
        fti = portal.portal_types.get("WikiPage")

        assert fti is not None
        assert fti.Title() == "Wiki Page"
        assert fti.factory == "WikiPage"
        assert fti.schema == "kitconcept.plate.content.wiki_page.IWikiPage"
        assert "volto.blocks" in fti.behaviors

    def test_wiki_page_can_be_created(self, portal):
        with api.env.adopt_roles(["Manager"]):
            page = api.content.create(
                container=portal,
                type="WikiPage",
                title="Team Handbook",
            )

        assert page.portal_type == "WikiPage"
        assert page.Title() == "Team Handbook"
        assert IWikiPage.providedBy(page)
        assert hasattr(page, "blocks")
        assert hasattr(page, "blocks_layout")
