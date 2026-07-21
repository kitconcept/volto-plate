"""Functional tests for comments in Plate editor blocks."""

from DateTime import DateTime
from typing import Any

import pytest


date_ = DateTime().ISO8601()

discussions = {
    "discussion1": {
        "id": "discussion1",
        "comments": [
            {
                "id": "comment1",
                "contentRich": [
                    {
                        "type": "p",
                        "children": [{"text": "Comment from user1"}],
                    }
                ],
                "createdAt": date_,
                "discussionId": "discussion1",
                "isEdited": False,
                "userId": "user1",
            },
            {
                "id": "comment2",
                "contentRich": [
                    {
                        "type": "p",
                        "children": [{"text": "Comment from user2"}],
                    }
                ],
                "createdAt": date_,
                "discussionId": "discussion1",
                "isEdited": False,
                "userId": "user2",
            },
        ],
        "createdAt": date_,
        "isResolved": False,
        "userId": "user1",
    }
}


@pytest.fixture(scope="class")
def users(member_user_id) -> list[dict[str, Any]]:
    return [
        {
            "username": "user1",
            "email": "user1@example.com",
            "roles": ("Member", "Editor"),
            "properties": {"fullname": "User One"},
        },
        {
            "username": "user2",
            "email": "user2@example.com",
            "roles": ("Member", "Editor"),
            "properties": {"fullname": "User Two"},
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
            "blocks": {
                "__somersault__": {
                    "@type": "__somersault__",
                    "value": [
                        {
                            "type": "p",
                            "children": [{"text": "Test content"}],
                            "id": "test-1",
                        }
                    ],
                    "discussions": discussions,
                }
            },
        },
    ],
)
class TestCommentsSerializer:
    """Test the comments serializer functionality."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal, serialized_block):
        self.portal = portal
        self.request = portal.REQUEST
        self.workspace = self.portal["team-workspace"]
        self.page = self.workspace["test-page"]
        self.serialized_block = serialized_block
        self.admin_user_id = "admin"
        self.user1_id = "user1"
        self.user2_id = "user2"
        self.member_user_id = "member"

    def test_serializer_includes_discussions_with_permission(self):
        """Comments are included in serialization if user has permission."""
        # Admin user (Manager) has permission by default
        serialized_block = self.serialized_block(self.page, self.request)

        # Verify discussions are included
        assert "discussions" in serialized_block
        assert "discussion1" in serialized_block["discussions"]

        discussion = serialized_block["discussions"]["discussion1"]
        assert len(discussion["comments"]) == 2
        assert discussion["comments"][0]["userId"] == self.user1_id
        assert discussion["comments"][1]["userId"] == self.user2_id

    def test_serializer_includes_user_details_with_permission(self):
        """User details are included in serialization if user has permission."""
        # Admin user (Manager) has permission by default
        serialized_block = self.serialized_block(self.page, self.request)

        # Verify users object is included
        assert "users" in serialized_block
        assert self.user1_id in serialized_block["users"]
        assert self.user2_id in serialized_block["users"]

        # Verify user details are complete
        user1_data = serialized_block["users"][self.user1_id]
        assert user1_data["id"] == self.user1_id
        assert user1_data["fullname"] == "User One"
        assert user1_data["portrait"] is None

        user2_data = serialized_block["users"][self.user2_id]
        assert user2_data["id"] == self.user2_id
        assert user2_data["fullname"] == "User Two"
        assert user2_data["portrait"] is None

    def test_serializer_excludes_discussions_without_permission(self):
        """Comments are excluded in serialization if user lacks permission."""
        # Member user does not have "Discuss content" permission
        serialized_block = self.serialized_block(
            self.page, self.request, user_id=self.member_user_id
        )

        # Verify discussions are NOT included
        assert "discussions" not in serialized_block
        assert "users" not in serialized_block

    def test_serializer_editor_with_permission(self):
        """Editor user with permission sees discussions and users."""
        # Editor users have the permission by default (as set in rolemap.xml)
        serialized_block = self.serialized_block(
            self.page, self.request, user_id=self.user1_id
        )

        # Verify discussions are included
        assert "discussions" in serialized_block
        assert "discussion1" in serialized_block["discussions"]

        # Verify users are included
        assert "users" in serialized_block
        assert self.user1_id in serialized_block["users"]
        assert self.user2_id in serialized_block["users"]

    def test_serializer_preserves_block_value(self):
        """Block content (value) is preserved regardless of permissions."""
        # Get serialized block with permission

        serialized_with_perm = self.serialized_block(self.page, self.request)

        # Get serialized block without permission
        serialized_without_perm = self.serialized_block(
            self.page, self.request, self.member_user_id
        )

        # Both should have the same value
        assert serialized_with_perm["value"] == serialized_without_perm["value"]
        assert serialized_with_perm["@type"] == serialized_without_perm["@type"]
