import pytest


@pytest.fixture(scope="class")
def portal(portal_class):
    """A fixture that provides a Plone portal for testing."""
    yield portal_class
