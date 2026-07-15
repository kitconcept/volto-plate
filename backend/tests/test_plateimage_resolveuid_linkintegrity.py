"""Integration tests for plate image link handling in Somersault blocks."""

from Acquisition import aq_inner
from plone import api
from plone.app.linkintegrity.handlers import modifiedContent
from plone.app.linkintegrity.interfaces import IRetriever
from plone.app.linkintegrity.utils import referencedRelationship
from plone.restapi.interfaces import IDeserializeFromJson
from zc.relation.interfaces import ICatalog
from zope.component import getMultiAdapter
from zope.component import getUtility
from zope.intid.interfaces import IIntIds

import json


class TestPlateImageResolveuidDeserializer:
    def _deserialize(self, page, blocks):
        request = page.REQUEST
        request["BODY"] = json.dumps({"blocks": blocks})
        deserializer = getMultiAdapter((page, request), IDeserializeFromJson)
        return deserializer(validate_all=False)

    def test_plateimage_url_is_converted_to_resolveuid(self, portal):
        with api.env.adopt_roles(["Manager"]):
            workspace = api.content.create(
                container=portal,
                type="Workspace",
                title="Test workspace",
            )
            image = api.content.create(
                container=workspace,
                type="Image",
                title="Target image",
            )
            page = api.content.create(
                container=workspace,
                type="WikiPage",
                title="Test page",
            )

        result = self._deserialize(
            page,
            {
                "__somersault__": {
                    "@type": "__somersault__",
                    "value": [
                        {
                            "type": "ploneBlock",
                            "@type": "plateimage",
                            "id": "image-1",
                            "url": image.absolute_url(),
                            "image_field": "image",
                            "children": [{"text": ""}],
                        }
                    ],
                }
            },
        )

        image_node = result.blocks["__somersault__"]["value"][0]
        assert image_node["type"] == "ploneBlock"
        assert image_node["@type"] == "plateimage"
        assert "resolveuid" in image_node["url"]
        assert image_node["url"].endswith(image.UID())


class TestPlateImageLinkIntegrity:
    def _create_fixture(self, portal):
        with api.env.adopt_roles(["Manager"]):
            workspace = api.content.create(
                container=portal,
                type="Workspace",
                title="Test workspace",
            )
            image = api.content.create(
                container=workspace,
                type="Image",
                title="Target image",
            )
            page = api.content.create(
                container=workspace,
                type="WikiPage",
                title="Test page",
            )

        return workspace, image, page

    def _get_back_references(self, item):
        catalog = getUtility(ICatalog)
        intids = getUtility(IIntIds)
        result = []

        for rel in catalog.findRelations({
            "to_id": intids.getId(aq_inner(item)),
            "from_attribute": referencedRelationship,
        }):
            obj = intids.queryObject(rel.from_id)
            if obj is not None:
                result.append(obj)

        return result

    def test_plateimage_link_is_retrieved_from_current_stored_shape(self, portal):
        _, image, page = self._create_fixture(portal)
        resolveuid = f"../resolveuid/{image.UID()}"

        page.blocks = {
            "__somersault__": {
                "@type": "__somersault__",
                "value": [
                    {
                        "type": "ploneBlock",
                        "@type": "plateimage",
                        "id": "image-1",
                        "url": resolveuid,
                        "image_field": "image",
                        "children": [{"text": ""}],
                    }
                ],
            }
        }

        links = IRetriever(page).retrieveLinks()

        assert links == {resolveuid}

    def test_plateimage_creates_back_reference_for_links_and_references(self, portal):
        _, image, page = self._create_fixture(portal)
        resolveuid = f"../resolveuid/{image.UID()}"

        assert self._get_back_references(image) == []

        page.blocks = {
            "__somersault__": {
                "@type": "__somersault__",
                "value": [
                    {
                        "type": "ploneBlock",
                        "@type": "plateimage",
                        "id": "image-1",
                        "url": resolveuid,
                        "image_field": "image",
                        "children": [{"text": ""}],
                    }
                ],
            }
        }
        modifiedContent(page, None)

        assert self._get_back_references(image) == [page]

        with api.env.adopt_roles(["Manager"]):
            api.content.rename(obj=image, new_id="target-image-moved")
        modifiedContent(page, None)

        assert page.blocks["__somersault__"]["value"][0]["url"] == resolveuid
        assert self._get_back_references(image) == [page]
