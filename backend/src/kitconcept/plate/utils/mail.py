from kitconcept.plate import types as t
from plone import api


def mail_settings() -> t.MailSettings:
    """Return the mail settings from the Plone registry."""
    data: dict[str, str] = {}
    settings: tuple[tuple[str, str], ...] = (
        ("site_title", "plone.site_title"),
        ("smtp_host", "plone.smtp_host"),
        ("email_from_name", "plone.email_from_name"),
        ("email_from_address", "plone.email_from_address"),
        ("email_charset", "plone.email_charset"),
    )
    for attr, key in settings:
        data[attr] = str(api.portal.get_registry_record(key) or "")

    return t.MailSettings(**data)
