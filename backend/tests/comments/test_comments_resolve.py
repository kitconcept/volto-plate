"""Resolving and reopening inline discussions archives them, never deletes."""

from copy import deepcopy
from plone import api

import pytest


def make_discussion(user_id: str, text: str = "Raise the deadline", **extra):
    return {
        "id": "discussion1",
        "comments": [
            {
                "id": "comment1",
                "contentRich": [{"type": "p", "children": [{"text": text}]}],
                "createdAt": "2026-08-10T08:12:00Z",
                "discussionId": "discussion1",
                "isEdited": False,
                "userId": user_id,
            }
        ],
        "createdAt": "2026-08-10T08:12:00Z",
        "documentContent": "fünf Arbeitstage",
        "isResolved": False,
        "userId": user_id,
        **extra,
    }


def make_block(discussion: dict) -> dict:
    return {
        "@type": "__somersault__",
        "value": [
            {
                "type": "p",
                "id": "p1",
                "children": [
                    {
                        "text": "fünf Arbeitstage",
                        "comment": True,
                        "comment_discussion1": True,
                    }
                ],
            }
        ],
        "discussions": {discussion["id"]: discussion},
    }


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
class TestResolveDiscussion:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, deserializer, serialized_block):
        self.portal = portal
        self.request = portal.REQUEST
        self.page = portal["team-workspace"]["test-page"]
        self.deserializer = deserializer
        self.serialized_block = serialized_block
        self.user_id = api.user.get_current().getId()

    def save(self, discussion: dict) -> dict:
        self.deserializer(
            self.page,
            {"__somersault__": make_block(deepcopy(discussion))},
            self.request,
        )
        return self.page.blocks["__somersault__"]["discussions"]["discussion1"]

    def test_open_discussion_has_no_resolution_keys(self):
        stored = self.save(make_discussion(self.user_id))
        assert stored["isResolved"] is False
        assert "resolvedBy" not in stored
        assert "resolvedAt" not in stored

    def test_resolve_stamps_resolver_and_keeps_discussion(self):
        self.save(make_discussion(self.user_id))
        stored = self.save(make_discussion(self.user_id, isResolved=True))
        assert stored["isResolved"] is True
        assert stored["resolvedBy"] == self.user_id
        assert stored["resolvedAt"]
        assert stored["comments"][0]["id"] == "comment1"
        # The text anchor is kept, so the thread stays reachable
        leaf = self.page.blocks["__somersault__"]["value"][0]["children"][0]
        assert leaf["comment_discussion1"] is True

    def test_resolution_is_not_restamped_on_later_saves(self):
        self.save(make_discussion(self.user_id))
        first = self.save(make_discussion(self.user_id, isResolved=True))
        second = self.save(
            make_discussion(
                self.user_id,
                isResolved=True,
                resolvedBy="someone-else",
                resolvedAt="2000-01-01T00:00:00+00:00",
            )
        )
        assert second["resolvedBy"] == first["resolvedBy"]
        assert second["resolvedAt"] == first["resolvedAt"]

    def test_client_cannot_spoof_resolver(self):
        self.save(make_discussion(self.user_id))
        stored = self.save(
            make_discussion(self.user_id, isResolved=True, resolvedBy="someone-else")
        )
        assert stored["resolvedBy"] == self.user_id

    def test_reopen_clears_resolution(self):
        self.save(make_discussion(self.user_id))
        resolved = self.save(make_discussion(self.user_id, isResolved=True))
        stored = self.save(
            make_discussion(
                self.user_id,
                isResolved=False,
                resolvedBy=resolved["resolvedBy"],
                resolvedAt=resolved["resolvedAt"],
            )
        )
        assert stored["isResolved"] is False
        assert "resolvedBy" not in stored
        assert "resolvedAt" not in stored

    def test_new_discussion_saved_as_resolved_is_stamped(self):
        stored = self.save(make_discussion(self.user_id, isResolved=True))
        assert stored["resolvedBy"] == self.user_id

    def test_serializer_includes_resolver_in_users(self, make_user, site_owner_name):
        make_user("resolver", "Resolver Person")
        self.save(make_discussion(self.user_id))
        with api.env.adopt_user("resolver"):
            api.user.grant_roles(username="resolver", roles=["Editor"], obj=self.page)
            self.save(make_discussion(self.user_id, isResolved=True))
        block = self.serialized_block(self.page, self.request, site_owner_name)
        assert block["discussions"]["discussion1"]["resolvedBy"] == "resolver"
        assert block["users"]["resolver"]["fullname"] == "Resolver Person"
