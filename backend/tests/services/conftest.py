import pytest
import transaction


SETTINGS = {
    "site_title": "New Site Title",
    "smtp_host": "smtp.example.com",
    "email_from_name": "Site Mail",
    "email_from_address": "noreply@example.com",
}


@pytest.fixture(scope="class")
def functional_portal(functional_portal_class, make_user, update_mail_settings):
    """A fixture that provides a functional Plone portal for testing."""
    _ = [
        make_user("mentioned-user", "Mentioned User"),
        make_user("mentioning-user", "Mentioning User"),
        make_user("limit-user", "Limit User"),
        make_user("portrait-user", "Portrait User", True),
    ]
    update_mail_settings(SETTINGS)
    transaction.commit()  # Commit the users and mail settings to the database
    yield functional_portal_class


@pytest.fixture(scope="class")
def get_messages(functional_portal):
    from email import policy
    from email.message import Message

    import email

    default_policy = policy.default

    def func() -> list[Message]:
        # Sync this (test-thread) ZODB connection to the latest committed
        # state, so mail committed by the WSGI server thread — or flushed by
        # a commit in the test — becomes visible on the MailHost object.
        transaction.begin()
        mailhost = functional_portal.MailHost
        messages = []
        for msg in mailhost.messages:
            message = email.message_from_bytes(msg, policy=default_policy)
            messages.append(message)
        return messages

    return func


@pytest.fixture(scope="session")
def get_msg_body():
    from email.message import Message

    def func(msg: Message, content_type: str = "text/plain") -> str:
        return str(
            next(
                p.get_payload(decode=True)
                for p in msg.walk()
                if p.get_content_type() == content_type
            )
        )

    return func
