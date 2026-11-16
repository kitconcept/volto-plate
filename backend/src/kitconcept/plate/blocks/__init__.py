"""plone.restapi block handlers for Plate regions with ``"@type": "plate"``.

plone.restapi (up to at least 10.0.x) handles Plate values only under the
legacy ``"@type": "__somersault__"``: the nested blocks visitor, the
``SearchableText`` indexer and the link integrity retriever. This module adds
the same handling for ``"@type": "plate"``, reusing plone.restapi's code, so
that both shapes work (https://github.com/plone/aurora/issues/379).

Once plone.restapi handles ``plate`` itself:

* the visitor below detects it and yields nothing, so nested blocks are not
  visited twice;
* the ``plate`` indexer registered in ``indexers/configure.zcml`` overrides the
  one from plone.restapi (named adapters replace each other, they don't add
  up);
* a second link integrity retriever for ``plate`` is harmless, because
  plone.restapi collects the links in a set.
"""

from functools import cache
from kitconcept.plate.regions import PLATE_TYPE
from plone.restapi.blocks import NestedBlocksVisitor
from plone.restapi.blocks_linkintegrity import PlateBlockLinksRetriever
from plone.restapi.interfaces import IBlockVisitor
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface
from zope.publisher.interfaces.browser import IBrowserRequest


@cache
def restapi_visits_plate_regions() -> bool:
    """Return ``True`` if plone.restapi already visits ``plate`` values."""
    probe = {"@type": PLATE_TYPE, "value": [{"@type": "probe"}]}
    return bool(list(NestedBlocksVisitor(None, None)(probe)))


@implementer(IBlockVisitor)
@adapter(Interface, IBrowserRequest)
class PlateRegionVisitor:
    """Visit the blocks nested in the value of a ``plate`` region."""

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, block_value):
        if block_value.get("@type") != PLATE_TYPE:
            return
        if restapi_visits_plate_regions():
            return
        visitor = NestedBlocksVisitor(self.context, self.request)
        yield from visitor.visit_plate_value(block_value.get("value") or [])


class PlateRegionLinksRetriever(PlateBlockLinksRetriever):
    """Retrieve the links in a ``plate`` region for link integrity."""

    block_type = PLATE_TYPE
