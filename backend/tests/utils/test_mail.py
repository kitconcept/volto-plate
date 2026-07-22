from kitconcept.plate.utils import mail

import pytest


SETTINGS = {
    "site_title": "New Site Title",
    "smtp_host": "smtp.example.com",
    "email_from_name": "New From Name",
    "email_from_address": "new-from@example.com",
}


class TestMailUtils:
    """The mail settings helper reading from the Plone registry."""

    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        self.portal = portal

    @pytest.mark.parametrize(
        "attr,expected",
        (
            ("site_title", "Plone site"),
            ("smtp_host", "localhost"),
            ("email_from_name", ""),
            ("email_from_address", ""),
        ),
    )
    def test_default_mail_settings(self, attr: str, expected: str):
        """Test that the mail settings are retrieved correctly."""
        settings = mail.mail_settings()
        assert isinstance(settings, mail.t.MailSettings)
        assert getattr(settings, attr) == expected

    @pytest.mark.parametrize(
        "new_settings, attr,expected",
        (
            (SETTINGS, "site_title", "New Site Title"),
            (SETTINGS, "smtp_host", "smtp.example.com"),
            (SETTINGS, "email_from_name", "New From Name"),
            (SETTINGS, "email_from_address", "new-from@example.com"),
        ),
    )
    def test_mail_settings(
        self,
        update_mail_settings,
        new_settings: dict[str, str],
        attr: str,
        expected: str,
    ):
        """Test that the mail settings are retrieved correctly."""
        update_mail_settings(new_settings)
        settings = mail.mail_settings()
        assert isinstance(settings, mail.t.MailSettings)
        assert getattr(settings, attr) == expected
