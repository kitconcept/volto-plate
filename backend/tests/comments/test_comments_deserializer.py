"""Functional tests for comments in Plate editor blocks."""

from DateTime import DateTime
from plone import api
from zExceptions import BadRequest
from zExceptions import Unauthorized

import pytest


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
class TestCommentsDeserializer:
    """Test the comments deserializer functionality."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal, deserializer, member_user_id):
        self.portal = portal
        self.request = portal.REQUEST
        self.workspace = portal["team-workspace"]
        self.page = self.workspace["test-page"]
        self.deserializer = deserializer
        self.member_user_id = member_user_id

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
        self.deserializer(self.page, {"__somersault__": block_data}, self.request)

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
        with api.env.adopt_user(self.member_user_id), pytest.raises(Unauthorized):
            self.deserializer(self.page, {"__somersault__": block_data}, self.request)

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
            self.deserializer(
                self.page, {"__somersault__": updated_block}, self.request
            )

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
            self.deserializer(self.page, {"__somersault__": block_data}, self.request)
