from plone import api
from plone.restapi.interfaces import IBlockFieldSerializationTransformer
from plone.restapi.services.users.get import getPortraitUrl
from plone.restapi.services.users.get import isDefaultPortrait
from zope.interface import implementer
from zope.publisher.interfaces.browser import IBrowserRequest
from zope.component import adapter
from zope.interface import Interface


@adapter(Interface, IBrowserRequest)
@implementer(IBlockFieldSerializationTransformer)
class CommentsSerializer:
    """Handle comments during block serialization (fetching).

    Includes stored discussions and user details if the user has permission.
    """

    order = 100
    block_type = "__somersault__"
    disabled = False

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, block):
        """Process comments during block serialization.

        Includes discussions and user details if the user has permission
        to discuss content.
        """
        if api.user.has_permission(
            "kitconcept.plate: Discuss content", obj=self.context
        ):
            # Add user details
            users = {}
            for discussion in block.get("discussions", {}).values():
                for comment in discussion.get("comments", []):
                    user_id = comment.get("userId")
                    if user_id and user_id not in users:
                        user = api.user.get(userid=user_id)
                        if user:
                            users[user_id] = {
                                "id": user_id,
                                "fullname": user.getProperty("fullname")
                                or user.getId(),
                                "portrait": get_portrait_url(user_id),
                            }
            block["users"] = users
        else:
            # User doesn't have permission - remove discussions
            block.pop("discussions", None)

        return block


def get_portrait_url(user_id) -> str | None:
    portal_membership = api.portal.get_tool("portal_membership")
    image = portal_membership.getPersonalPortrait(user_id)
    if image and not isDefaultPortrait(image):
        user = portal_membership.getMemberById(user_id)
        return getPortraitUrl(user)
