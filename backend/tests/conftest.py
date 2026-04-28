from kitconcept.plate.testing import ACCEPTANCE_TESTING
from kitconcept.plate.testing import FUNCTIONAL_TESTING
from kitconcept.plate.testing import INTEGRATION_TESTING
from pytest_plone import fixtures_factory

globals().update(
    fixtures_factory((
        (ACCEPTANCE_TESTING, "acceptance"),
        (FUNCTIONAL_TESTING, "functional"),
        (INTEGRATION_TESTING, "integration"),
    ))
)
