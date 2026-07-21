from plone import api
from plone.dexterity.content import DexterityContent
from typing import Any
from ZPublisher.HTTPRequest import WSGIRequest

import json
import pytest


@pytest.fixture(scope="class")
def member_user_id() -> str:
    """Fixture to provide a member user ID for testing."""
    return "member"


@pytest.fixture(scope="class")
def http_request(app_class, integration_class):
    """Fixture to provide a Plone portal instance for testing."""
    yield integration_class["request"]


@pytest.fixture(scope="class")
def users(member_user_id) -> list[dict[str, Any]]:
    return [
        {
            "username": member_user_id,
            "email": f"{member_user_id}@example.com",
            "roles": ("Member",),
        }
    ]


@pytest.fixture(scope="class")
def portal(portal_class, users):
    """Fixture to provide a Plone portal instance for testing."""
    with api.env.adopt_roles(["Manager", "Editor", "Owner"]):
        for user_info in users:
            user = api.user.create(
                username=user_info["username"],
                email=user_info["email"],
                roles=("Member",),
                properties=user_info.get("properties", {}),
            )
            api.user.grant_roles(user=user, roles=user_info.get("roles", ()))

    yield portal_class


@pytest.fixture
def deserializer():
    """Return a function that deserializes block data into a context."""
    from plone.restapi.interfaces import IDeserializeFromJson
    from zope.component import getMultiAdapter

    def _func(context: DexterityContent, blocks: dict[str, dict], request: WSGIRequest):
        request["BODY"] = json.dumps({"blocks": blocks})
        deserializer = getMultiAdapter((context, request), IDeserializeFromJson)
        return deserializer(validate_all=False)

    return _func


@pytest.fixture
def serialized_block(site_owner_name):
    """Return a function that deserializes block data into a context."""
    from plone.restapi.interfaces import ISerializeToJson
    from zope.component import getMultiAdapter

    def _func(
        context: DexterityContent, request: WSGIRequest, user_id: str = site_owner_name
    ):
        serializer = getMultiAdapter((context, request), ISerializeToJson)
        if user_id:
            with api.env.adopt_user(user_id):
                result = serializer()
        else:
            result = serializer()
        return result.get("blocks", {}).get("__somersault__", {})

    return _func
