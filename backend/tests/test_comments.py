"""Functional tests for comments in Plate editor blocks."""

import json
from plone import api
from plone.restapi.interfaces import IDeserializeFromJson
from plone.restapi.interfaces import ISerializeToJson
from DateTime import DateTime
from zExceptions import BadRequest
from zExceptions import Unauthorized
from zope.component import getMultiAdapter
import pytest


class TestCommentsDeserializer:
    """Test the comments deserializer functionality."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
        self.request = portal.REQUEST

        with api.env.adopt_roles(["Manager"]):
            # Create a wiki page
            self.page = api.content.create(
                container=self.portal,
                type="WikiPage",
                title="Test page",
            )

            # Create a regular user without permission
            self.member_user_id = "member"
            with api.env.adopt_roles(["Manager"]):
                api.user.create(
                    username=self.member_user_id,
                    email=f"{self.member_user_id}@example.com",
                    roles=("Member",),
                )

    def _deserialize(self, blocks, context):
        self.request["BODY"] = json.dumps({"blocks": blocks})
        deserializer = getMultiAdapter((context, self.request), IDeserializeFromJson)
        return deserializer(validate_all=False)

    def test_deserializer_with_permission_stores_discussions(self):
        """User with permission can add and store discussions."""

        # Use default test user
        user = api.user.get_current()

        # Prepare block data with discussions
        block_data = {
            "@type": "__somersault__",
            "value": [
                {
                    "type": "p",
                    "children": [{"text": "Test content"}],
                    "id": "test-1",
                }
            ],
            "discussions": {
                "discussion1": {
                    "id": "discussion1",
                    "comments": [
                        {
                            "id": "comment1",
                            "contentRich": [
                                {
                                    "type": "p",
                                    "children": [{"text": "Great content!"}],
                                }
                            ],
                            "createdAt": DateTime().ISO8601(),
                            "discussionId": "discussion1",
                            "isEdited": False,
                            "userId": user.getId(),
                        }
                    ],
                    "createdAt": DateTime().ISO8601(),
                    "isResolved": False,
                    "userId": user.getId(),
                }
            },
            "users": {
                user.getId(): {
                    "id": user.getId(),
                    "fullname": user.getProperty("fullname"),
                }
            },
        }
        self._deserialize({"__somersault__": block_data}, self.page)

        # Verify block data is stored
        assert "discussion1" in self.page.blocks["__somersault__"]["discussions"]
        # Verify user details are not stored
        assert "users" not in self.page.blocks["__somersault__"]

    def test_deserializer_without_permission_rejects_new_discussions(self):
        """User without permission cannot add new discussions."""

        # Try to set discussions without permission
        block_data = {
            "@type": "__somersault__",
            "value": [
                {
                    "type": "p",
                    "children": [{"text": "Test content"}],
                    "id": "test-1",
                }
            ],
            "discussions": {
                "discussion1": {
                    "id": "discussion1",
                    "comments": [
                        {
                            "id": "comment1",
                            "contentRich": [
                                {
                                    "type": "p",
                                    "children": [{"text": "Great content!"}],
                                }
                            ],
                            "createdAt": DateTime().ISO8601(),
                            "discussionId": "discussion1",
                            "isEdited": False,
                            "userId": self.member_user_id,
                        }
                    ],
                    "createdAt": DateTime().ISO8601(),
                    "isResolved": False,
                    "userId": self.member_user_id,
                }
            },
        }

        # This should raise Unauthorized during deserialization
        with api.env.adopt_user(self.member_user_id):
            with pytest.raises(Unauthorized):
                self._deserialize({"__somersault__": block_data}, self.page)

    def test_deserializer_without_permission_preserves_existing_comments(self):
        """User without permission preserves existing discussions if not modifying."""

        user = api.user.get_current()
        existing_discussions = {
            "discussion1": {
                "id": "discussion1",
                "comments": [
                    {
                        "id": "comment1",
                        "contentRich": [
                            {
                                "type": "p",
                                "children": [{"text": "Existing comment"}],
                            }
                        ],
                        "createdAt": DateTime().ISO8601(),
                        "discussionId": "discussion1",
                        "isEdited": False,
                        "userId": user.getId(),
                    }
                ],
                "createdAt": DateTime().ISO8601(),
                "isResolved": False,
                "userId": user.getId(),
            }
        }
        block_data = {
            "@type": "__somersault__",
            "value": [
                {
                    "type": "p",
                    "children": [{"text": "Test content"}],
                    "id": "test-1",
                }
            ],
            "discussions": existing_discussions,
        }
        self.page.blocks = {"__somersault__": block_data}

        # Now, update the page without discussions (simulating a user without permission)
        updated_block = {
            "@type": "__somersault__",
            "value": [
                {
                    "type": "p",
                    "children": [{"text": "Updated content"}],
                    "id": "test-1",
                }
            ],
            # No discussions or users
        }
        with api.env.adopt_user(self.member_user_id):
            self._deserialize({"__somersault__": updated_block}, self.page)

        # Discussions should be preserved
        assert self.page.blocks["__somersault__"]["discussions"] == existing_discussions

    def test_deserializer_validates_unchanged_comments_from_other_users(self):
        """Cannot modify comments created by other users."""

        # Establish a discussion with a comment from user 1
        existing_discussions = {
            "discussion1": {
                "id": "discussion1",
                "comments": [
                    {
                        "id": "comment1",
                        "contentRich": [
                            {
                                "type": "p",
                                "children": [{"text": "User 1's comment"}],
                            }
                        ],
                        "createdAt": DateTime().ISO8601(),
                        "discussionId": "discussion1",
                        "isEdited": False,
                        "userId": "user1",
                    }
                ],
                "createdAt": DateTime().ISO8601(),
                "isResolved": False,
                "userId": "user1",
            }
        }
        block_data = {
            "@type": "__somersault__",
            "value": [
                {
                    "type": "p",
                    "children": [{"text": "Test content"}],
                    "id": "test-1",
                }
            ],
            "discussions": existing_discussions,
        }
        self.page.blocks = {"__somersault__": block_data}

        # Current user tries to modify user 1's comment - this should fail
        modified_discussions = {
            "discussion1": {
                "id": "discussion1",
                "comments": [
                    {
                        "id": "comment1",
                        "contentRich": [
                            {
                                "type": "p",
                                "children": [
                                    {"text": "Modified by user 2"}
                                ],  # Modified!
                            }
                        ],
                        "createdAt": DateTime().ISO8601(),
                        "discussionId": "discussion1",
                        "isEdited": False,
                        "userId": "user1",
                    }
                ],
                "createdAt": DateTime().ISO8601(),
                "isResolved": False,
                "userId": "user1",
            }
        }

        # This should raise BadRequest
        with pytest.raises(BadRequest, match="Cannot modify comment"):
            block_data = {
                "@type": "__somersault__",
                "value": [
                    {
                        "type": "p",
                        "children": [{"text": "Test content"}],
                        "id": "test-1",
                    }
                ],
                "discussions": modified_discussions,
            }
            self._deserialize({"__somersault__": block_data}, self.page)


class TestCommentsSerializer:
    """Test the comments serializer functionality."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal
        self.request = portal.REQUEST

        with api.env.adopt_roles(["Manager"]):
            # Create a wiki page with discussions
            self.page = api.content.create(
                container=self.portal,
                type="WikiPage",
                title="Test page with comments",
            )

            # Create users
            self.admin_user_id = "admin"
            self.user1_id = "user1"
            self.user2_id = "user2"
            self.member_user_id = "member"

            user1 = api.user.create(
                username=self.user1_id,
                email=f"{self.user1_id}@example.com",
                properties={"fullname": "User One"},
            )
            api.user.grant_roles(user=user1, roles=["Editor"])
            user2 = api.user.create(
                username=self.user2_id,
                email=f"{self.user2_id}@example.com",
                properties={"fullname": "User Two"},
            )
            api.user.grant_roles(user=user2, roles=["Editor"])
            api.user.create(
                username=self.member_user_id,
                email=f"{self.member_user_id}@example.com",
                roles=("Member",),
            )

            # Create a user object (admin is the default test user)
            admin_user = api.user.get_current()
            self.admin_user_id = admin_user.getId()

            # Set up block with discussions and users
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
                            "createdAt": DateTime().ISO8601(),
                            "discussionId": "discussion1",
                            "isEdited": False,
                            "userId": self.user1_id,
                        },
                        {
                            "id": "comment2",
                            "contentRich": [
                                {
                                    "type": "p",
                                    "children": [{"text": "Comment from user2"}],
                                }
                            ],
                            "createdAt": DateTime().ISO8601(),
                            "discussionId": "discussion1",
                            "isEdited": False,
                            "userId": self.user2_id,
                        },
                    ],
                    "createdAt": DateTime().ISO8601(),
                    "isResolved": False,
                    "userId": self.user1_id,
                }
            }

            self.page.blocks = {
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
            }

    def _get_serialized_block(self, user_id=None):
        """Helper to get serialized block data."""
        serializer = getMultiAdapter((self.page, self.request), ISerializeToJson)
        if user_id:
            with api.env.adopt_user(user_id):
                data = serializer()
        else:
            data = serializer()
        return data.get("blocks", {}).get("__somersault__", {})

    def test_serializer_includes_discussions_with_permission(self):
        """Comments are included in serialization if user has permission."""
        # Admin user (Manager) has permission by default
        serialized_block = self._get_serialized_block()

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
        serialized_block = self._get_serialized_block()

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
        serialized_block = self._get_serialized_block(user_id=self.member_user_id)

        # Verify discussions are NOT included
        assert "discussions" not in serialized_block
        assert "users" not in serialized_block

    def test_serializer_editor_with_permission(self):
        """Editor user with permission sees discussions and users."""
        # Editor users have the permission by default (as set in rolemap.xml)
        serialized_block = self._get_serialized_block(user_id=self.user1_id)

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
        serialized_with_perm = self._get_serialized_block()

        # Get serialized block without permission
        serialized_without_perm = self._get_serialized_block(
            user_id=self.member_user_id
        )

        # Both should have the same value
        assert serialized_with_perm["value"] == serialized_without_perm["value"]
        assert serialized_with_perm["@type"] == serialized_without_perm["@type"]
