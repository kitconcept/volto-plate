"""Plate regions stored in the ``blocks`` field.

The Plate editor stores each part of a page as one Plate value in ``blocks``,
keyed by the region's name, with ``"@type": "plate"``::

    {"blocks": {"main": {"@type": "plate", "value": [...]}}}

The key names the region (``main`` for the page body, slot names like
``aboveContent`` later). The ``@type`` names the format. Code finds regions by
their ``@type``, not by their key. Regions are not listed in ``blocks_layout``.

Older content uses the proof-of-concept shape, which is still accepted::

    {"blocks": {"__somersault__": {"@type": "__somersault__", "value": [...]}}}

See https://github.com/plone/aurora/issues/379.
"""

from collections.abc import Iterator


PLATE_TYPE = "plate"
"""``@type`` of a Plate region."""

LEGACY_SOMERSAULT = "__somersault__"
"""Legacy key and ``@type`` of the single Plate region."""

MAIN_REGION = "main"
"""Key of the region that holds the page body."""

PLATE_REGION_TYPES = (PLATE_TYPE, LEGACY_SOMERSAULT)
"""Every ``@type`` that marks a Plate region, current first."""


def is_plate_region(block) -> bool:
    """Return ``True`` if ``block`` is a Plate region, in either shape."""
    return isinstance(block, dict) and block.get("@type") in PLATE_REGION_TYPES


def iter_plate_regions(blocks) -> Iterator[tuple[str, dict]]:
    """Yield ``(key, block)`` for every Plate region in ``blocks``."""
    if not isinstance(blocks, dict):
        return
    for key, block in blocks.items():
        if is_plate_region(block):
            yield key, block


def get_plate_region(blocks) -> tuple[str | None, dict | None]:
    """Return ``(key, block)`` of the page body region, or ``(None, None)``.

    Prefers ``main``, then the legacy ``__somersault__`` key, then the first
    Plate region found.
    """
    regions = dict(iter_plate_regions(blocks))
    for key in (MAIN_REGION, LEGACY_SOMERSAULT):
        if key in regions:
            return key, regions[key]
    for key, block in regions.items():
        return key, block
    return None, None
