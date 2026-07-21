from kitconcept.plate import types as t
from plone import api
from zope.event import notify
from zope.globalrequest import setRequest
from zope.lifecycleevent import ObjectModifiedEvent

import pytest
import transaction


@pytest.mark.portal(
    content=[
        {
            "_container": "/",
            "type": "Workspace",
            "id": "my-workspace",
            "title": "My Workspace",
        }
    ],
    roles=["Manager"],
)
class TestBaseMentionsService:
    """The @mentions REST service exposing picker-safe user data."""

    @pytest.fixture(autouse=True)
    def _setup(
        self,
        functional_portal,
        manager_request,
        mentions_utility,
    ):
        self.portal = functional_portal
        self.workspace = self.portal["my-workspace"]
        self.api_session = manager_request
        self.mentions_utility = mentions_utility
        # Tests here commit (allowed in the functional layer), which defeats
        # the per-test transaction rollback, so committed MockMailHost
        # messages would otherwise leak into the next test. Reset and commit
        # so the WSGI server thread's connection also sees the cleared list.
        self.portal.MailHost.reset()
        transaction.commit()
        # Use the functional portal's own request. The integration-layer
        # ``http_request`` fixture would instantiate a second layer (and a
        # second MailHost), splitting sends from what the test can read.
        setRequest(self.portal.REQUEST)
        yield
        setRequest(None)


class TestMentionsService(TestBaseMentionsService):
    """The @mentions REST service exposing picker-safe user data."""

    def test_returns_only_picker_fields(self):
        """The picker receives id, fullname and portrait only."""
        user = api.user.get(username="mentioned-user")
        response = self.api_session.get(
            "/@mentions", params={"search": "Mentioned", "limit": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items_total"] == 1
        assert data["items"][0] == {
            "id": user.getId(),
            "fullname": "Mentioned User",
            "portrait": None,
        }

    def test_does_not_enumerate_without_a_search(self):
        """Without a search or id the service returns nothing."""
        response = self.api_session.get("/@mentions", params={"initial": 1, "limit": 5})
        assert response.status_code == 200
        assert response.json() == {"items": [], "items_total": 0}

    def test_uses_default_limit_for_an_invalid_value(self):
        """An unparsable limit falls back to the default."""
        response = self.api_session.get(
            "/@mentions", params={"search": "Limit", "limit": "not-a-number"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items_total"] == 1
        assert data["items"][0]["id"] == "limit-user"

    def test_returns_a_user_portrait(self):
        """A stored portrait is resolved to its @portrait URL."""
        response = self.api_session.get("/@mentions", params={"id": "portrait-user"})
        assert response.status_code == 200
        data = response.json()
        portrait = data["items"][0]["portrait"]
        assert portrait is not None
        assert "/@portrait/" in portrait


class TestSendNotifications(TestBaseMentionsService):
    """Delivery of mention notifications on content lifecycle events."""

    def test_modified_event_prints_notification(self, get_messages, get_msg_body):
        """A modified event delivers the queued mention notification."""
        author = api.user.get(username="mentioning-user")
        utility = self.mentions_utility
        utility.queue_notifications(
            self.workspace, [t.Mention("abc", "mentioned-user")], author
        )
        notify(ObjectModifiedEvent(self.workspace))
        # send_email defers delivery to transaction commit, so flush it.
        transaction.commit()
        messages = get_messages()
        assert len(messages) == 1
        msg = messages[0]
        assert msg["To"] == "mentioned-user@example.com"
        body = get_msg_body(msg, "text/plain")
        assert "Mentioning User mentioned you on 'My Workspace'." in body
        assert "plateMention=abc" in body

    def test_wiki_page_creation_sends_notification(
        self, make_plate_mention, get_messages, get_msg_body
    ):
        """REST creation keeps the deserialized mention through ObjectAddedEvent."""
        payload = {
            "@type": "WikiPage",
            "blocks": {
                "__somersault__": {
                    "@type": "__somersault__",
                    "value": [
                        {
                            "type": "p",
                            "children": [make_plate_mention("new", "mentioned-user")],
                        }
                    ],
                }
            },
            "id": "mentioned-page",
            "title": "Mentioned page",
        }
        # Create page
        response = self.api_session.post(f"/{self.workspace.id}", json=payload)
        assert response.status_code == 201
        messages = get_messages()
        assert len(messages) == 1
        msg = messages[0]
        assert msg["To"] == "mentioned-user@example.com"
        body = get_msg_body(msg, "text/plain")
        assert "admin mentioned you on 'Mentioned page'." in body
        assert "plateMention=new" in body
