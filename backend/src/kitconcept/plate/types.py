from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class MailSettings:
    """A simple data class to hold mail settings."""

    site_title: str
    smtp_host: str
    email_from_name: str
    email_from_address: str
    email_charset: str


@dataclass(frozen=True)
class Mention:
    """A persisted mention and the link that points at it."""

    mention_id: str
    user_id: str


Mentions = Sequence[Mention]
