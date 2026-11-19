"""Migration of ``blocks.__somersault__`` to ``blocks.main`` (plone/aurora#379)."""

from kitconcept.plate import migration
from kitconcept.plate.upgrades.v20261112001 import migrate_plate_regions
from pathlib import Path
from plone import api

import logging
import pytest


VALUE = [{"type": "p", "id": "p1", "children": [{"text": "Quixotic narwhal"}]}]


def legacy_blocks():
    return {
        "title-1": {"@type": "title"},
        "__somersault__": {"@type": "__somersault__", "value": VALUE},
        "other-1": {"@type": "slate", "plaintext": "other"},
    }


def migrated_blocks():
    return {
        "title-1": {"@type": "title"},
        "main": {"@type": "plate", "value": VALUE},
        "other-1": {"@type": "slate", "plaintext": "other"},
    }


def path_of(obj):
    return "/".join(obj.getPhysicalPath())


@pytest.fixture
def catalog(portal):
    return api.portal.get_tool("portal_catalog")


@pytest.fixture
def content(portal):
    """A legacy WikiPage, a legacy Document and an untouched WikiPage."""
    with api.env.adopt_roles(["Manager"]):
        workspace = api.content.create(
            container=portal, type="Workspace", id="ws", title="Workspace"
        )
        page = api.content.create(
            container=workspace, type="WikiPage", id="page", title="Page"
        )
        document = api.content.create(
            container=portal, type="Document", id="doc", title="Doc"
        )
        current = api.content.create(
            container=workspace, type="WikiPage", id="current", title="Current"
        )
    for obj in (page, document):
        obj.blocks = legacy_blocks()
        obj.blocks_layout = {"items": ["title-1", "other-1"]}
        obj.reindexObject(idxs=["SearchableText", "block_types"])
    current.blocks = migrated_blocks()
    current.reindexObject(idxs=["SearchableText", "block_types"])
    return {"page": page, "document": document, "current": current}


class TestMigrateSomersaultBlocks:
    def test_migrates_and_keeps_modified(self, content, catalog):
        page = content["page"]
        modified = page.modified()
        assert migration.migrate_somersault_blocks(page) is True
        assert page.blocks == migrated_blocks()
        # Key order is kept.
        assert list(page.blocks) == ["title-1", "main", "other-1"]
        assert page.blocks_layout == {"items": ["title-1", "other-1"]}
        assert page.modified() == modified
        brain = catalog.unrestrictedSearchResults(UID=page.UID())[0]
        assert brain.modified == modified

    def test_reindexes_searchable_text_and_block_types(self, content, catalog):
        page = content["page"]
        migration.migrate_somersault_blocks(page)
        uid = page.UID()
        assert catalog.unrestrictedSearchResults(UID=uid, SearchableText="narwhal")
        assert catalog.unrestrictedSearchResults(UID=uid, block_types="plate")
        assert not catalog.unrestrictedSearchResults(
            UID=uid, block_types="__somersault__"
        )

    def test_idempotent(self, content):
        page = content["page"]
        assert migration.migrate_somersault_blocks(page) is True
        assert migration.migrate_somersault_blocks(page) is False
        assert page.blocks == migrated_blocks()

    def test_nothing_to_do(self, content, portal):
        assert migration.migrate_somersault_blocks(content["current"]) is False
        assert content["current"].blocks == migrated_blocks()

    def test_renames_key_in_blocks_layout(self, content):
        page = content["page"]
        page.blocks_layout = {"items": ["title-1", "__somersault__"]}
        migration.migrate_somersault_blocks(page)
        assert page.blocks_layout == {"items": ["title-1", "main"]}

    def test_main_collision_leaves_content_alone(self, content, caplog):
        page = content["page"]
        blocks = {**legacy_blocks(), "main": {"@type": "plate", "value": []}}
        page.blocks = blocks
        with caplog.at_level(logging.WARNING, logger="kitconcept.plate"):
            assert migration.migrate_somersault_blocks(page) is False
        assert page.blocks == blocks
        assert "has both '__somersault__' and 'main'" in caplog.text


class TestMigrateSite:
    def test_dry_run_changes_nothing(self, portal, content):
        result = migration.migrate_site(portal, dry_run=True)
        assert sorted(result.migrated) == sorted([
            path_of(content["page"]),
            path_of(content["document"]),
        ])
        assert content["page"].blocks == legacy_blocks()
        assert content["document"].blocks == legacy_blocks()

    def test_portal_types_limits_the_migration(self, portal, content):
        result = migration.migrate_site(portal, portal_types=["WikiPage"])
        assert result.migrated == [path_of(content["page"])]
        assert content["document"].blocks == legacy_blocks()

    def test_site_root(self, portal, content):
        portal.blocks = legacy_blocks()
        result = migration.migrate_site(portal)
        assert path_of(portal) in result.migrated
        assert portal.blocks == migrated_blocks()

    def test_collisions_are_reported(self, portal, content):
        page = content["page"]
        page.blocks = {**legacy_blocks(), "main": {"@type": "plate", "value": []}}
        result = migration.migrate_site(portal)
        assert result.collisions == [path_of(page)]
        assert path_of(page) not in result.migrated


class TestUpgradeStep:
    def test_upgrade_step_migrates(self, portal, content, catalog):
        modified = {key: obj.modified() for key, obj in content.items()}
        migrate_plate_regions(None)
        for key in ("page", "document"):
            assert content[key].blocks == migrated_blocks()
        assert content["current"].blocks == migrated_blocks()
        for key, obj in content.items():
            assert obj.modified() == modified[key]
        assert len(catalog.unrestrictedSearchResults(SearchableText="narwhal")) == len(
            content
        )

    def test_upgrade_step_is_idempotent(self, portal, content):
        migrate_plate_regions(None)
        assert migration.migrate_site(portal).migrated == []

    def test_upgrade_step_is_registered(self, portal, content):
        setup_tool = api.portal.get_tool("portal_setup")
        profile = "kitconcept.plate:default"
        setup_tool.setLastVersionForProfile(profile, "20260623001")
        setup_tool.upgradeProfile(profile)
        assert setup_tool.getLastVersionForProfile(profile) == ("20261112001",)
        assert content["page"].blocks == migrated_blocks()


@pytest.fixture
def console(monkeypatch):
    """Keep the console runner from switching users or ending the transaction."""
    calls = []
    monkeypatch.setattr(migration, "newSecurityManager", lambda *args: None)
    monkeypatch.setattr(migration.transaction, "commit", lambda: calls.append("commit"))
    monkeypatch.setattr(migration.transaction, "abort", lambda: calls.append("abort"))
    return calls


class TestScript:
    def test_dry_run(self, app, portal, content, console):
        output = []
        result = migration.run_from_console(
            app, [portal.getId(), "--dry-run"], out=output.append
        )
        assert result.migrated == [path_of(content["page"])]
        assert content["page"].blocks == legacy_blocks()
        assert console == ["abort"]
        assert f"Would migrate: {path_of(content['page'])}" in output
        assert "Dry run: nothing committed." in output

    def test_portal_type_option(self, app, portal, content, console):
        result = migration.run_from_console(
            app,
            [portal.getId(), "--portal-type", "Document"],
            out=lambda *args: None,
        )
        assert result.migrated == [path_of(content["document"])]
        assert content["document"].blocks == migrated_blocks()
        assert content["page"].blocks == legacy_blocks()
        assert console == ["commit"]

    def test_all_option(self, app, portal, content, console):
        result = migration.run_from_console(
            app, [portal.getId(), "--all"], out=lambda *args: None
        )
        assert len(result.migrated) == 2

    def test_script_file(self, app, portal, content, console, monkeypatch):
        """The script runs like ``bin/instance run`` runs it."""
        import kitconcept.plate
        import runpy
        import sys

        script = (
            Path(kitconcept.plate.__file__).parent
            / "scripts"
            / "migrate_plate_regions.py"
        )
        monkeypatch.setattr(sys, "argv", [str(script), portal.getId()])
        runpy.run_path(str(script), init_globals={"app": app}, run_name="__main__")
        assert content["page"].blocks == migrated_blocks()
        assert console == ["commit"]
