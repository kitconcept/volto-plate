"""Comments keep working for regions in the legacy ``__somersault__`` shape."""

from copy import deepcopy
from plone import api
from zExceptions import BadRequest

import pytest


CREATED = "2026-11-12T10:00:00+00:00"


def other_user_discussions():
    return {
        "discussion1": {
            "id": "discussion1",
            "comments": [
                {
                    "id": "comment1",
                    "contentRich": [
                        {"type": "p", "children": [{"text": "User 1's comment"}]}
                    ],
                    "createdAt": CREATED,
                    "discussionId": "discussion1",
                    "isEdited": False,
                    "userId": "user1",
                }
            ],
            "createdAt": CREATED,
            "isResolved": False,
            "userId": "user1",
        }
    }


def make_region(type_: str, discussions=None) -> dict:
    region = {
        "@type": type_,
        "value": [{"type": "p", "children": [{"text": "Test content"}], "id": "t1"}],
    }
    if discussions is not None:
        region["discussions"] = discussions
    return region


def legacy_blocks() -> dict:
    return {"__somersault__": make_region("__somersault__", other_user_discussions())}


@pytest.fixture(scope="class")
def users(member_user_id):
    return [
        {
            "username": "user1",
            "email": "user1@example.com",
            "roles": ("Member", "Editor"),
            "properties": {"fullname": "User One"},
        },
        {
            "username": member_user_id,
            "email": f"{member_user_id}@example.com",
            "roles": ("Member",),
        },
    ]


@pytest.mark.portal(
    content=[
        {
            "_container": "/",
            "type": "Workspace",
            "id": "team-workspace",
            "title": "Team Workspace",
        },
        {
            "_container": "/team-workspace",
            "type": "WikiPage",
            "id": "test-page",
            "title": "Test Page",
        },
    ],
    roles=["Manager"],
)
class TestLegacyComments:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, deserializer, serialized_block, member_user_id):
        self.portal = portal
        self.request = portal.REQUEST
        self.page = portal["team-workspace"]["test-page"]
        self.page.blocks = legacy_blocks()
        self.deserializer = deserializer
        self.serialized_block = serialized_block
        self.member_user_id = member_user_id

    def test_serializer_adds_users_to_legacy_region(self):
        block = self.serialized_block(self.page, self.request)
        assert block["@type"] == "__somersault__"
        assert block["discussions"]["discussion1"]["comments"][0]["id"] == "comment1"
        assert block["users"]["user1"]["fullname"] == "User One"

    def test_serializer_hides_legacy_discussions_without_permission(self):
        block = self.serialized_block(
            self.page, self.request, user_id=self.member_user_id
        )
        assert "discussions" not in block
        assert "users" not in block

    def test_deserializer_validates_legacy_region(self):
        discussions = other_user_discussions()
        discussions["discussion1"]["comments"][0]["contentRich"] = [
            {"type": "p", "children": [{"text": "Changed"}]}
        ]
        with pytest.raises(BadRequest, match="Cannot modify comment"):
            self.deserializer(
                self.page,
                {"__somersault__": make_region("__somersault__", discussions)},
                self.request,
            )

    def test_deserializer_drops_users_from_legacy_region(self):
        region = make_region("__somersault__", other_user_discussions())
        region["users"] = {"user1": {"id": "user1"}}
        self.deserializer(self.page, {"__somersault__": region}, self.request)
        assert "users" not in self.page.blocks["__somersault__"]

    def test_first_save_in_new_shape_validates_against_legacy_region(self):
        """Saving ``main`` over a stored ``__somersault__`` checks its comments."""
        with pytest.raises(BadRequest, match="Cannot delete comment"):
            self.deserializer(
                self.page, {"main": make_region("plate", {})}, self.request
            )

    def test_first_save_in_new_shape_keeps_legacy_discussions(self):
        """A save without discussions keeps the ones of the legacy region."""
        self.deserializer(self.page, {"main": make_region("plate")}, self.request)
        assert list(self.page.blocks) == ["main"]
        assert self.page.blocks["main"]["discussions"] == other_user_discussions()

    def test_first_save_in_new_shape_keeps_legacy_discussions_for_members(self):
        with api.env.adopt_user(self.member_user_id):
            self.deserializer(self.page, {"main": make_region("plate")}, self.request)
        stored = deepcopy(self.page.blocks["main"]["discussions"])
        assert stored == other_user_discussions()
