from kitconcept.plate.upgrades.v20260623001 import migrate_wiki_page_image_blocks
from plone import api


class TestSomersaultImageMigration:
    def test_migrates_legacy_plateimage_nodes_in_wiki_pages(self, portal):
        with api.env.adopt_roles(["Manager"]):
            workspace = api.content.create(
                container=portal,
                type="Workspace",
                title="Test workspace",
            )
            page = api.content.create(
                container=workspace,
                type="WikiPage",
                title="Test page",
            )

        page.blocks = {
            "__somersault__": {
                "@type": "__somersault__",
                "value": [
                    {
                        "type": "img",
                        "@type": "plateimage",
                        "id": "image-1",
                        "align": "center",
                        "size": "l",
                        "children": [{"text": ""}],
                        "url": "/resolveuid/example",
                    },
                    {
                        "type": "p",
                        "children": [{"text": "Paragraph"}],
                    },
                    {
                        "type": "callout",
                        "children": [
                            {
                                "type": "img",
                                "@type": "plateimage",
                                "id": "image-2",
                                "align": "left",
                                "size": "m",
                                "children": [{"text": ""}],
                                "url": "/resolveuid/example-2",
                            }
                        ],
                    },
                ],
            }
        }

        migrate_wiki_page_image_blocks(None)

        value = page.blocks["__somersault__"]["value"]
        assert value[0]["type"] == "ploneBlock"
        assert value[0]["@type"] == "plateimage"
        assert value[0]["id"] == "image-1"

        assert value[1]["type"] == "p"

        nested = value[2]["children"][0]
        assert nested["type"] == "ploneBlock"
        assert nested["@type"] == "plateimage"
        assert nested["id"] == "image-2"

    def test_leaves_non_legacy_nodes_untouched(self, portal):
        with api.env.adopt_roles(["Manager"]):
            workspace = api.content.create(
                container=portal,
                type="Workspace",
                title="Test workspace",
            )
            page = api.content.create(
                container=workspace,
                type="WikiPage",
                title="Test page",
            )

        page.blocks = {
            "__somersault__": {
                "@type": "__somersault__",
                "value": [
                    {
                        "type": "ploneBlock",
                        "@type": "plateimage",
                        "id": "already-migrated",
                        "children": [{"text": ""}],
                    },
                    {
                        "type": "img",
                        "@type": "image",
                        "id": "different-block-type",
                        "children": [{"text": ""}],
                    },
                ],
            }
        }

        migrate_wiki_page_image_blocks(None)

        value = page.blocks["__somersault__"]["value"]
        assert value[0]["type"] == "ploneBlock"
        assert value[1]["type"] == "img"
        assert value[1]["@type"] == "image"
