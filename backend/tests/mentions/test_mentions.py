"""Tests for the Plate mentions utility (kitconcept.plate.mentions)."""

from kitconcept.plate.deserializers.comments import CommentsDeserializer
from kitconcept.plate.mentions import mentions_utility
from kitconcept.plate.mentions.utility import breadcrumbs
from kitconcept.plate.mentions.utility import mention_excerpt
from kitconcept.plate.mentions.utility import PENDING_MENTIONS_KEY
from kitconcept.plate.types import Mention
from plone import api
from zope.globalrequest import setRequest

import pytest


@pytest.fixture
def make_mention():
    """Return a factory that builds a Plate mention node."""

    def _make_mention(mention_id, user_id="mentioned-user"):
        return {
            "type": "mention",
            "key": user_id,
            "mentionId": mention_id,
            "value": "Mentioned User",
            "children": [{"text": ""}],
        }

    return _make_mention


@pytest.fixture
def make_workspace(portal):
    """Return a factory that creates a Workspace inside the portal."""

    def _make_workspace(title="Workspace"):
        with api.env.adopt_roles(["Manager"]):
            return api.content.create(container=portal, type="Workspace", title=title)

    return _make_workspace


@pytest.fixture
def printing_mailhost(monkeypatch):
    """Intercept outgoing mail so notifications are inspectable, not sent."""
    from Products import PrintingMailHost

    monkeypatch.setenv("ENABLE_PRINTING_MAILHOST", "True")
    PrintingMailHost.initialize(None)
    monkeypatch.setattr(api.portal, "PRINTINGMAILHOST_ENABLED", True)

    # Import only after initialize() populates PrintingMailHost.LOG, since
    # importing Patch runs a module-level LOG.warning at import time.
    from Products.PrintingMailHost.Patch import undo_patches

    yield
    undo_patches()


class TestMentionDetection:
    """Detection of newly introduced Plate mentions."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal_class):
        self.portal = portal_class
        self.mentions = mentions_utility()

    def test_returns_only_new_document_mentions(self, make_mention):
        """Only mentions absent from the stored value are returned."""
        existing = {"value": [{"type": "p", "children": [make_mention("old")]}]}
        incoming = {
            "value": [
                {"type": "p", "children": [make_mention("old"), make_mention("new")]}
            ]
        }

        assert self.mentions.new_mentions(incoming, existing) == [
            Mention("new", "mentioned-user")
        ]

    def test_detects_mentions_in_comment_content(self, make_mention):
        """Mentions nested in a comment's rich content are detected."""
        incoming = {
            "discussions": {
                "discussion": {
                    "comments": [
                        {
                            "contentRich": [
                                {"type": "p", "children": [make_mention("comment")]}
                            ]
                        }
                    ]
                }
            }
        }

        assert [
            item.mention_id for item in self.mentions.new_mentions(incoming, {})
        ] == ["comment"]

    def test_ignores_legacy_mentions_without_stable_ids(self):
        """Mentions lacking a stable ``mentionId`` are ignored."""
        incoming = {
            "value": [
                {
                    "type": "p",
                    "children": [
                        {
                            "type": "mention",
                            "key": "mentioned-user",
                            "value": "Mentioned User",
                            "children": [{"text": ""}],
                        }
                    ],
                }
            ]
        }

        assert self.mentions.new_mentions(incoming, {}) == []


class TestQueueNotifications:
    """Queueing of mentions for the content lifecycle subscriber."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal, http_request):
        self.portal = portal
        self.request = http_request
        self.mentions = mentions_utility()
        setRequest(http_request)
        yield
        setRequest(None)

    def test_deserializer_queues_new_mentions_for_lifecycle_subscriber(
        self, make_mention, make_user
    ):
        """The deserializer stores new mentions for the subscriber to deliver."""
        make_user("mentioned-user", "Mentioned User")
        author = api.user.get_current()
        block = {"value": [{"type": "p", "children": [make_mention("new")]}]}

        with api.env.adopt_roles(["Manager"]):
            CommentsDeserializer(self.portal, self.request)(block)

        author_id, mentions = self.request[PENDING_MENTIONS_KEY][
            self.mentions._context_key(self.portal)
        ]
        assert author_id == author.getId()
        assert mentions == (Mention("new", "mentioned-user"),)


@pytest.mark.parametrize("in_comment", [False, True])
def test_mention_excerpt(make_mention, in_comment):
    """Extract only the matching paragraph from documents and comments."""
    value = [
        {
            "type": "p",
            "children": [
                {"text": "Please ask "},
                make_mention("target"),
                {"text": " to review."},
            ],
        }
    ]
    block = {"value": value}
    if in_comment:
        block = {"discussions": {"thread": {"comments": [{"contentRich": value}]}}}
    assert mention_excerpt(block, "target") == "Please ask @Mentioned User to review."
    assert mention_excerpt(block, "missing") == ""


def test_breadcrumbs(portal, make_workspace):
    """Breadcrumbs include the page but exclude the site."""
    workspace = make_workspace("Engineering")
    with api.env.adopt_roles(["Manager"]):
        page = api.content.create(container=workspace, type="WikiPage", title="Notes")
    assert breadcrumbs(page) == "Engineering › Notes"


def test_email_alternatives_escape_html(portal, monkeypatch):
    """Both alternatives preserve Unicode while content remains text in HTML."""
    sent = {}
    monkeypatch.setattr(api.portal, "send_email", lambda **kwargs: sent.update(kwargs))
    text = 'Grüße <script>alert("test")</script> & review\n\nNext line'
    utility = mentions_utility()
    payload = {
        "author": "Anna",
        "page_title": "Notes",
        "breadcrumbs": "Space › Notes",
        "timestamp": "2026-10-29",
        "site_name": "Site",
        "page_url": 'https://example.com/page?x=1&y="two"',
    }
    rendered = utility._render_html(
        payload, text, "https://example.com/page?mention=abc"
    )
    utility._send_email(
        text, "recipient@example.com", "sender@example.com", "Subject", rendered
    )
    msg = sent["body"]
    assert msg.get_content_type() == "multipart/alternative"
    plain, html = msg.get_payload()
    assert plain.get_payload(decode=True).decode("utf-8") == text
    rendered = html.get_payload(decode=True).decode("utf-8")
    assert "Grüße &lt;script&gt;" in rendered
    assert "<script>" not in rendered
    assert "&amp; review" in rendered
    assert "<blockquote " in rendered
    assert "border-left:3px solid" in rendered
    assert "<hr " in rendered
    assert 'href="https://example.com/page?x=1&amp;y=&quot;two&quot;"' in rendered
    assert "Open the mention:" not in rendered
    assert "View page:" not in rendered
