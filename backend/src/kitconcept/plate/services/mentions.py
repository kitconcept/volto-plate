"""Mentionable Plone users REST service."""

from plone.restapi.services import Service
from plone.restapi.services.users.get import getPortraitUrl
from Products.CMFCore.utils import getToolByName
from Products.CMFPlone.utils import normalizeString
from urllib.parse import parse_qs


DEFAULT_LIMIT = 25
MAX_LIMIT = 50


class MentionsGet(Service):
    """Return the minimum safe user data required by the mention picker."""

    def reply(self):
        query = parse_qs(self.request.get("QUERY_STRING", ""))
        user_id = query.get("id", [""])[0].strip()
        search = query.get("search", [""])[0].strip()
        try:
            limit = int(query.get("limit", [DEFAULT_LIMIT])[0])
        except ValueError:
            limit = DEFAULT_LIMIT
        limit = min(max(limit, 1), MAX_LIMIT)

        # Do not turn this endpoint into a user-directory enumeration API.
        # The picker searches by name, while rendered mentions resolve one
        # already-persisted user id to keep their portrait current.
        if not search and not user_id:
            return {"items": [], "items_total": 0}

        membership = getToolByName(self.context, "portal_membership")
        acl_users = getToolByName(self.context, "acl_users")
        if user_id:
            users = [membership.getMemberById(user_id)]
        else:
            user_ids = set()
            for field in ("name", "fullname"):
                user_ids.update(
                    item["userid"]
                    for item in acl_users.searchUsers(**{field: search})
                    if item.get("userid")
                )
            users = [membership.getMemberById(item) for item in user_ids]

        users = [user for user in users if user is not None]
        users.sort(
            key=lambda user: normalizeString(
                user.getProperty("fullname") or user.getId()
            )
        )

        items = [
            {
                "id": user.getId(),
                "fullname": user.getProperty("fullname") or user.getId(),
                "portrait": getPortraitUrl(user),
            }
            for user in users[:limit]
        ]
        return {"items": items, "items_total": len(items)}
