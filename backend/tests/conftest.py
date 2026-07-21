from kitconcept.plate.testing import ACCEPTANCE_TESTING
from kitconcept.plate.testing import FUNCTIONAL_TESTING
from kitconcept.plate.testing import INTEGRATION_TESTING
from pathlib import Path
from plone import api
from pytest_plone import fixtures_factory

import pytest


globals().update(
    fixtures_factory((
        (ACCEPTANCE_TESTING, "acceptance"),
        (FUNCTIONAL_TESTING, "functional"),
        (INTEGRATION_TESTING, "integration"),
    ))
)


@pytest.fixture(scope="session")
def portrait_image():
    """Provide Plone's bundled test image as a member portrait upload."""
    from Products.PlonePAS.tests import dummy

    import Products.PlonePAS as ppas

    path = Path(ppas.__file__).parent / "tool.gif"
    with open(path, "rb") as image:
        yield dummy.FileUpload(dummy.FieldStorage(image))


@pytest.fixture(scope="session")
def make_user(portrait_image):
    """Return a factory that creates a Plone member."""

    def _make_user(username, fullname, has_portrait=False):
        with api.env.adopt_roles(["Manager"]):
            user = api.user.create(
                username=username,
                email=f"{username}@example.com",
                properties={"fullname": fullname},
            )
            if has_portrait:
                mt = api.portal.get_tool("portal_membership")
                mt.changeMemberPortrait(portrait_image, user.getId())
            return user

    return _make_user


@pytest.fixture(scope="class")
def mentions_utility():
    from kitconcept.plate.mentions import mentions_utility

    return mentions_utility()


@pytest.fixture(scope="class")
def update_mail_settings():
    """A fixture to update mail settings in the Plone registry for testing."""

    def _update(settings: dict[str, str]):
        for key, value in settings.items():
            api.portal.set_registry_record(f"plone.{key}", value)

    return _update


@pytest.fixture(scope="session")
def make_plate_mention():
    """Return a factory that builds a Plate mention node."""

    def _make_mention(mention_id: str, user_id="mentioned-user"):
        return {
            "type": "mention",
            "key": user_id,
            "mentionId": mention_id,
            "value": "Mentioned User",
            "children": [{"text": ""}],
        }

    return _make_mention
