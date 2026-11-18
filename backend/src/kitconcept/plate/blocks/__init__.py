"""plone.restapi block handlers for Plate regions with ``"@type": "plate"``.

plone.restapi (up to at least 10.0.x) handles Plate values only under the
legacy ``"@type": "__somersault__"``: the nested blocks visitor, the
``SearchableText`` indexer and the link integrity retriever. This module adds
the same handling for ``"@type": "plate"``, reusing plone.restapi's code, so
that both shapes work (https://github.com/plone/aurora/issues/379).

plone.restapi versions that handle ``plate`` themselves provide the
``plonerestapi-plate-regions`` ZCML feature. The registrations in
``configure.zcml`` and ``indexers/configure.zcml`` are skipped then, so
nested blocks are not visited twice and the ``plate`` indexer doesn't clash
with plone.restapi's.
"""

from kitconcept.plate.regions import PLATE_TYPE
from plone.restapi.blocks import NestedBlocksVisitor
from plone.restapi.blocks_linkintegrity import PlateBlockLinksRetriever
from plone.restapi.interfaces import IBlockVisitor
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface
from zope.publisher.interfaces.browser import IBrowserRequest


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
        visitor = NestedBlocksVisitor(self.context, self.request)
        yield from visitor.visit_plate_value(block_value.get("value") or [])


class PlateRegionLinksRetriever(PlateBlockLinksRetriever):
    """Retrieve the links in a ``plate`` region for link integrity."""

    block_type = PLATE_TYPE
