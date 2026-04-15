from plone import api
from plone.restapi.interfaces import IBlockFieldDeserializationTransformer
from zExceptions import BadRequest, Unauthorized
from zope.interface import implementer
from zope.publisher.interfaces.browser import IBrowserRequest
from zope.component import adapter
from zope.interface import Interface


@adapter(Interface, IBrowserRequest)
@implementer(IBlockFieldDeserializationTransformer)
class CommentsDeserializer:
    """Handle comments in __somersault__ blocks."""

    order = 100
    block_type = "__somersault__"
    disabled = False

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, block):
        """Process comments during block deserialization.

        Validates permissions, prevents unauthorized modification of comments,
        and stores discussions data separately from user details.
        """
        current_user = api.user.get_current()

        # Check if user has permission to discuss content
        has_permission = api.user.has_permission(
            "kitconcept.plate: Discuss content", obj=self.context
        )

        # Get discussions from the request
        incoming_discussions = block.get("discussions", {})
        # Discard user details from the request (they are not stored here)
        incoming_users = block.pop("users", {})

        # Get existing discussions from the block data if it already exists
        existing_discussions = self._get_existing_discussions()

        if not has_permission:
            # User does not have permission to edit comments
            if incoming_discussions or incoming_users:
                # They're trying to modify comments but don't have permission
                raise Unauthorized("You do not have permission to modify comments")
            else:
                # No new comments in request, preserve existing comments
                if existing_discussions:
                    block["discussions"] = existing_discussions
                return block

        # User has permission - validate and store the discussions
        if incoming_discussions:
            # Validate that comments from other users are unchanged
            self._validate_unchanged_comments(
                incoming_discussions, existing_discussions, current_user
            )
            block["discussions"] = incoming_discussions
        elif existing_discussions:
            # Keep existing discussions if none in request
            block["discussions"] = existing_discussions

        return block

    def _get_existing_discussions(self):
        """Get existing discussions from the context if available."""
        # Try to get from blocks if context has blocks
        if hasattr(self.context, "blocks"):
            blocks = self.context.blocks
            if blocks and "__somersault__" in blocks:
                block_data = blocks["__somersault__"]
                if isinstance(block_data, dict):
                    return block_data.get("discussions", {})
        return {}

    def _validate_unchanged_comments(
        self, incoming_discussions, existing_discussions, current_user
    ):
        """Validate that comments from other users are unchanged.

        Raises BadRequest if a comment from another user has been modified.
        """
        if not existing_discussions:
            return  # No existing comments to validate against

        # Check each existing discussion
        for discussion_id, existing_discussion in existing_discussions.items():
            incoming_discussion = incoming_discussions.get(discussion_id)

            if not incoming_discussion:
                # Discussion was removed - not allowed
                raise BadRequest("Cannot delete existing discussion")

            # Check each existing comment
            existing_comments = existing_discussion.get("comments", [])
            incoming_comments = {
                c["id"]: c for c in incoming_discussion.get("comments", [])
            }

            for existing_comment in existing_comments:
                comment_id = existing_comment.get("id")
                user_id = existing_comment.get("userId")

                # If comment is from another user, it must not be modified
                if user_id and user_id != current_user.getId():
                    incoming_comment = incoming_comments.get(comment_id)
                    if not incoming_comment:
                        # Comment was removed - not allowed
                        raise BadRequest(
                            f"Cannot delete comment {comment_id} created by another user"
                        )
                    # Comment still exists - verify it's unchanged
                    if incoming_comment != existing_comment:
                        raise BadRequest(
                            f"Cannot modify comment {comment_id} created by another user"
                        )
