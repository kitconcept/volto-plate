from kitconcept.plate.content.wiki import IWiki
from kitconcept.plate.content.wiki_page import IWikiPage
from plone import api


class TestWiki:
    def test_wiki_fti_registered(self, portal):
        fti = portal.portal_types.get("Wiki")

        assert fti is not None
        assert fti.Title() == "Wiki"
        assert fti.factory == "Wiki"
        assert fti.schema == "kitconcept.plate.content.wiki.IWiki"
        assert fti.filter_content_types is True
        assert fti.global_allow is True
        assert fti.allowed_content_types == ("WikiPage", "Folder", "Image")
        assert "plone.constraintypes" in fti.behaviors

    def test_wiki_can_be_created(self, portal):
        with api.env.adopt_roles(["Manager"]):
            wiki = api.content.create(
                container=portal,
                type="Wiki",
                title="Engineering Wiki",
            )

        assert wiki.portal_type == "Wiki"
        assert wiki.Title() == "Engineering Wiki"
        assert IWiki.providedBy(wiki)
        assert hasattr(wiki, "blocks")
        assert hasattr(wiki, "blocks_layout")


class TestWikiPage:
    def test_wiki_page_fti_registered(self, portal):
        fti = portal.portal_types.get("WikiPage")

        assert fti is not None
        assert fti.Title() == "Wiki Page"
        assert fti.factory == "WikiPage"
        assert fti.schema == "kitconcept.plate.content.wiki_page.IWikiPage"
        assert fti.filter_content_types is True
        assert fti.global_allow is False
        assert fti.allowed_content_types == ("WikiPage", "Folder", "Image")
        assert "volto.blocks" in fti.behaviors

    def test_wiki_page_can_be_created(self, portal):
        with api.env.adopt_roles(["Manager"]):
            wiki = api.content.create(
                container=portal,
                type="Wiki",
                title="Engineering Wiki",
            )
            page = api.content.create(
                container=wiki,
                type="WikiPage",
                title="Team Handbook",
            )

        assert page.portal_type == "WikiPage"
        assert page.Title() == "Team Handbook"
        assert IWikiPage.providedBy(page)
        assert hasattr(page, "blocks")
        assert hasattr(page, "blocks_layout")
