"""plone.restapi handlers work for Plate regions in both shapes.

Current shape: ``blocks["main"] = {"@type": "plate", ...}``.
Legacy shape: ``blocks["__somersault__"] = {"@type": "__somersault__", ...}``.
"""

from kitconcept.plate import regions
from kitconcept.plate.blocks import PlateRegionVisitor
from plone import api
from plone.app.linkintegrity.interfaces import IRetriever
from plone.restapi.blocks import visit_blocks
from plone.restapi.interfaces import IBlockSearchableText
from plone.restapi.interfaces import IBlockVisitor
from plone.restapi.interfaces import IDeserializeFromJson
from zope.component import getMultiAdapter
from zope.component import queryMultiAdapter
from zope.component import subscribers

import json
import plone.restapi.blocks
import pytest


SHAPES = [
    pytest.param("main", "plate", id="plate"),
    pytest.param("__somersault__", "__somersault__", id="legacy"),
]


def make_region(type_, image_url="", text="Unmistakable zebracorn"):
    return {
        "@type": type_,
        "value": [
            {"type": "p", "id": "p1", "children": [{"text": text}]},
            {
                "type": "callout",
                "id": "c1",
                "children": [
                    {
                        "type": "ploneBlock",
                        "@type": "plateimage",
                        "id": "image-1",
                        "url": image_url,
                        "image_field": "image",
                        "alt": "Okapi caption",
                        "children": [{"text": ""}],
                    }
                ],
            },
        ],
    }


@pytest.fixture
def fixture(portal):
    with api.env.adopt_roles(["Manager"]):
        workspace = api.content.create(
            container=portal, type="Workspace", title="Workspace"
        )
        image = api.content.create(container=workspace, type="Image", title="Img")
        page = api.content.create(container=workspace, type="WikiPage", title="Page")
    return page, image


class TestRegionsHelpers:
    def test_get_plate_region_prefers_main(self):
        blocks = {
            "aboveContent": {"@type": "plate", "value": []},
            "__somersault__": {"@type": "__somersault__", "value": []},
            "main": {"@type": "plate", "value": []},
        }
        assert regions.get_plate_region(blocks)[0] == "main"
        del blocks["main"]
        assert regions.get_plate_region(blocks)[0] == "__somersault__"
        del blocks["__somersault__"]
        assert regions.get_plate_region(blocks)[0] == "aboveContent"

    @pytest.mark.parametrize(
        "blocks", [None, {}, {"abc": {"@type": "slate"}}, {"main": "nope"}]
    )
    def test_get_plate_region_none(self, blocks):
        assert regions.get_plate_region(blocks) == (None, None)

    def test_iter_plate_regions_finds_by_type_not_key(self):
        blocks = {
            "main": {"@type": "plate"},
            "x": {"@type": "__somersault__"},
            "__somersault__": {"@type": "slate"},
        }
        assert [key for key, _ in regions.iter_plate_regions(blocks)] == ["main", "x"]


class TestPlateRegionHandlers:
    def test_own_handlers_only_without_restapi_support(self, fixture):
        """kitconcept.plate registers its ``plate`` handlers only when
        plone.restapi doesn't, that is, when plone.restapi doesn't provide
        the ``plonerestapi-plate-regions`` ZCML feature.

        Registering the ``plate`` indexer twice would be a ZCML conflict.
        """
        page, _ = fixture
        request = page.REQUEST
        restapi_handles_plate = hasattr(plone.restapi.blocks, "PLATE_BLOCK_TYPES")
        visitors = subscribers((page, request), IBlockVisitor)
        own = [v for v in visitors if isinstance(v, PlateRegionVisitor)]
        assert bool(own) is not restapi_handles_plate
        indexer = queryMultiAdapter((page, request), IBlockSearchableText, name="plate")
        assert indexer is not None

    @pytest.mark.parametrize("key,type_", SHAPES)
    def test_nested_blocks_are_visited_once(self, fixture, key, type_):
        page, _ = fixture
        page.blocks = {key: make_region(type_)}
        types = [block.get("@type") for block in visit_blocks(page, page.blocks)]
        assert sorted(types) == sorted([type_, "plateimage"])

    @pytest.mark.parametrize("key,type_", SHAPES)
    def test_searchable_text(self, fixture, key, type_):
        page, _ = fixture
        page.blocks = {key: make_region(type_)}
        page.reindexObject(idxs=["SearchableText", "block_types"])
        catalog = api.portal.get_tool("portal_catalog")
        uid = page.UID()
        assert catalog.unrestrictedSearchResults(UID=uid, SearchableText="zebracorn")
        assert catalog.unrestrictedSearchResults(UID=uid, block_types=type_)
        assert catalog.unrestrictedSearchResults(UID=uid, block_types="plateimage")

    @pytest.mark.parametrize("key,type_", SHAPES)
    def test_link_integrity(self, fixture, key, type_):
        page, image = fixture
        resolveuid = f"../resolveuid/{image.UID()}"
        region = make_region(type_, image_url=resolveuid)
        region["value"][0]["children"].append({
            "type": "a",
            "url": f"../resolveuid/{page.UID()}",
            "children": [{"text": "self link"}],
        })
        page.blocks = {key: region}
        links = IRetriever(page).retrieveLinks()
        assert links == {resolveuid, f"../resolveuid/{page.UID()}"}

    @pytest.mark.parametrize("key,type_", SHAPES)
    def test_resolveuid_deserializer(self, fixture, key, type_):
        page, image = fixture
        request = page.REQUEST
        request["BODY"] = json.dumps({
            "blocks": {key: make_region(type_, image_url=image.absolute_url())}
        })
        deserializer = getMultiAdapter((page, request), IDeserializeFromJson)
        deserializer(validate_all=False)
        node = page.blocks[key]["value"][1]["children"][0]
        assert node["url"].endswith(f"resolveuid/{image.UID()}")
