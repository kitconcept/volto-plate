"""Tests for persisted Plate mention detection."""

from contextlib import contextmanager
from kitconcept.plate.deserializers.comments import CommentsDeserializer
from kitconcept.plate.mentions import _context_key
from kitconcept.plate.mentions import Mention
from kitconcept.plate.mentions import new_mentions
from kitconcept.plate.mentions import PENDING_MENTIONS_KEY
from kitconcept.plate.mentions import queue_notifications
from kitconcept.plate.services.mentions import MentionsGet
from plone import api
from plone.restapi.services.content.add import FolderPost
from zope.event import notify
from zope.globalrequest import setRequest
from zope.lifecycleevent import ObjectModifiedEvent

import json
import logging
import os


def mention(mention_id, user_id="mentioned-user"):
    return {
        "type": "mention",
        "key": user_id,
        "mentionId": mention_id,
        "value": "Mentioned User",
        "children": [{"text": ""}],
    }


def mentions_service(context, request):
    service = MentionsGet()
    service.context = context
    service.request = request
    return service


@contextmanager
def portrait_upload():
    """Provide Plone's bundled test image as a member portrait upload."""
    from Products.PlonePAS.tests import dummy

    import Products.PlonePAS as ppas

    path = os.path.join(os.path.dirname(ppas.__file__), "tool.gif")
    with open(path, "rb") as image:
        yield dummy.FileUpload(dummy.FieldStorage(image))


def test_new_mentions_returns_only_new_document_mentions():
    existing = {"value": [{"type": "p", "children": [mention("old")]}]}
    incoming = {"value": [{"type": "p", "children": [mention("old"), mention("new")]}]}

    assert new_mentions(incoming, existing) == [Mention("new", "mentioned-user")]


def test_new_mentions_detects_mentions_in_comment_content():
    incoming = {
        "discussions": {
            "discussion": {
                "comments": [
                    {"contentRich": [{"type": "p", "children": [mention("comment")]}]}
                ]
            }
        }
    }

    assert [item.mention_id for item in new_mentions(incoming, {})] == ["comment"]


def test_new_mentions_ignores_legacy_mentions_without_stable_ids():
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

    assert new_mentions(incoming, {}) == []


def test_deserializer_queues_new_mentions_for_lifecycle_subscriber(
    portal, http_request
):
    with api.env.adopt_roles(["Manager"]):
        api.user.create(
            username="mentioned-user",
            email="mentioned-user@example.com",
            properties={"fullname": "Mentioned User"},
        )
        author = api.user.get_current()
        block = {"value": [{"type": "p", "children": [mention("new")]}]}
        CommentsDeserializer(portal, http_request)(block)

    author_id, mentions = http_request[PENDING_MENTIONS_KEY][_context_key(portal)]
    assert author_id == author.getId()
    assert mentions == (Mention("new", "mentioned-user"),)


def test_mentions_service_returns_only_picker_fields(portal, http_request):
    with api.env.adopt_roles(["Manager"]):
        user = api.user.create(
            username="mentioned-user",
            email="mentioned-user@example.com",
            properties={"fullname": "Mentioned User"},
        )

    http_request["QUERY_STRING"] = "search=Mentioned&limit=1"
    result = mentions_service(portal, http_request).reply()

    assert result == {
        "items": [
            {
                "id": user.getId(),
                "fullname": "Mentioned User",
                "portrait": None,
            }
        ],
        "items_total": 1,
    }


def test_mentions_service_does_not_enumerate_without_a_search(portal, http_request):
    http_request["QUERY_STRING"] = "initial=1&limit=5"

    assert mentions_service(portal, http_request).reply() == {
        "items": [],
        "items_total": 0,
    }


def test_mentions_service_uses_default_limit_for_an_invalid_value(portal, http_request):
    with api.env.adopt_roles(["Manager"]):
        api.user.create(
            username="limit-user",
            email="limit-user@example.com",
            properties={"fullname": "Limit User"},
        )

    http_request["QUERY_STRING"] = "search=Limit&limit=not-a-number"

    result = mentions_service(portal, http_request).reply()

    assert result["items_total"] == 1
    assert result["items"][0]["id"] == "limit-user"


def test_mentions_service_returns_a_user_portrait(portal, http_request):
    with api.env.adopt_roles(["Manager"]):
        user = api.user.create(
            username="portrait-user",
            email="portrait-user@example.com",
            properties={"fullname": "Portrait User"},
        )
        with portrait_upload() as image:
            api.portal.get_tool("portal_membership").changeMemberPortrait(
                image, user.getId()
            )

    http_request["QUERY_STRING"] = "id=portrait-user"
    result = mentions_service(portal, http_request).reply()

    portrait = result["items"][0]["portrait"]
    assert portrait is not None
    assert portrait.startswith(f"{portal.absolute_url()}/@portrait/")


def test_mention_notification_is_printed_instead_of_sent(
    portal, http_request, caplog, monkeypatch
):
    """Development mail interception prints the actual notification content."""
    from Products import PrintingMailHost

    with api.env.adopt_roles(["Manager"]):
        workspace = api.content.create(
            container=portal,
            type="Workspace",
            title="Mentioned page",
        )
        author = api.user.create(
            username="mentioning-user",
            email="mentioning-user@example.com",
            properties={"fullname": "Mentioning User"},
        )
        api.user.create(
            username="mentioned-user",
            email="mentioned-user@example.com",
            properties={"fullname": "Mentioned User"},
        )
        api.portal.set_registry_record(
            "plone.email_from_address", "noreply@example.com"
        )

    monkeypatch.setenv("ENABLE_PRINTING_MAILHOST", "True")
    PrintingMailHost.initialize(None)
    monkeypatch.setattr(api.portal, "PRINTINGMAILHOST_ENABLED", True)
    from Products.PrintingMailHost.Patch import undo_patches

    try:
        setRequest(http_request)
        with caplog.at_level(logging.INFO, logger="PrintingMailHost"):
            queue_notifications(
                workspace,
                http_request,
                [Mention("abc", "mentioned-user")],
                author,
            )
            notify(ObjectModifiedEvent(workspace))
    finally:
        setRequest(None)
        undo_patches()

    assert "To: mentioned-user@example.com" in caplog.text
    assert "Mentioning User mentioned you on 'Mentioned page'." in caplog.text
    assert "plateMention=3Dabc" in caplog.text


def test_wiki_page_creation_sends_mention_notification(
    portal, http_request, caplog, monkeypatch
):
    """REST creation keeps the deserialized mention through ObjectAddedEvent."""
    from Products import PrintingMailHost

    with api.env.adopt_roles(["Manager"]):
        workspace = api.content.create(
            container=portal,
            type="Workspace",
            title="Workspace",
        )
        api.user.create(
            username="mentioned-user",
            email="mentioned-user@example.com",
            properties={"fullname": "Mentioned User"},
        )
        api.portal.set_registry_record(
            "plone.email_from_address", "noreply@example.com"
        )

    monkeypatch.setenv("ENABLE_PRINTING_MAILHOST", "True")
    PrintingMailHost.initialize(None)
    monkeypatch.setattr(api.portal, "PRINTINGMAILHOST_ENABLED", True)
    from Products.PrintingMailHost.Patch import undo_patches

    http_request["BODY"] = json.dumps({
        "@type": "WikiPage",
        "blocks": {
            "__somersault__": {
                "@type": "__somersault__",
                "value": [{"type": "p", "children": [mention("new")]}],
            }
        },
        "id": "mentioned-page",
        "title": "Mentioned page",
    })
    try:
        with caplog.at_level(logging.INFO, logger="PrintingMailHost"):
            service = FolderPost()
            service.context = workspace
            service.request = http_request
            service.reply()
    finally:
        undo_patches()

    assert "To: mentioned-user@example.com" in caplog.text
    assert "mentioned you on 'Mentioned page'." in caplog.text
    assert "=3Dnew" in caplog.text
