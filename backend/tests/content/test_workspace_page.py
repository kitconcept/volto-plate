from kitconcept.plate.content.wiki_page import IWikiPage
from kitconcept.plate.content.workspace import IWorkspace
from plone import api


class TestWorkspace:
    def test_workspace_fti_registered(self, portal):
        fti = portal.portal_types.get("Workspace")

        assert fti is not None
        assert fti.Title() == "Workspace"
        assert fti.factory == "Workspace"
        assert fti.schema == "kitconcept.plate.content.workspace.IWorkspace"
        assert fti.filter_content_types is True
        assert fti.global_allow is True
        assert fti.allowed_content_types == ("WikiPage", "File", "Image")
        assert "plone.constraintypes" in fti.behaviors

    def test_workspace_can_be_created(self, portal):
        with api.env.adopt_roles(["Manager"]):
            workspace = api.content.create(
                container=portal,
                type="Workspace",
                title="Engineering Workspace",
            )

        assert workspace.portal_type == "Workspace"
        assert workspace.Title() == "Engineering Workspace"
        assert IWorkspace.providedBy(workspace)
        assert hasattr(workspace, "blocks")
        assert hasattr(workspace, "blocks_layout")


class TestWikiPage:
    def test_wiki_page_fti_registered(self, portal):
        fti = portal.portal_types.get("WikiPage")

        assert fti is not None
        assert fti.Title() == "Wiki Page"
        assert fti.factory == "WikiPage"
        assert fti.schema == "kitconcept.plate.content.wiki_page.IWikiPage"
        assert fti.filter_content_types is True
        assert fti.global_allow is False
        assert fti.allowed_content_types == ("WikiPage", "File", "Image")
        assert "volto.blocks" in fti.behaviors

    def test_wiki_page_can_be_created(self, portal):
        with api.env.adopt_roles(["Manager"]):
            workspace = api.content.create(
                container=portal,
                type="Workspace",
                title="Engineering Workspace",
            )
            page = api.content.create(
                container=workspace,
                type="WikiPage",
                title="Team Handbook",
            )

        assert page.portal_type == "WikiPage"
        assert page.Title() == "Team Handbook"
        assert IWikiPage.providedBy(page)
        assert hasattr(page, "blocks")
        assert hasattr(page, "blocks_layout")
