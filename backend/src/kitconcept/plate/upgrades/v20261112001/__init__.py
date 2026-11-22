from kitconcept.plate.migration import migrate_site


def migrate_plate_regions(_context):
    """Move ``blocks.__somersault__`` to ``blocks.main`` with ``@type`` ``plate``.

    Covers the site root, every WikiPage and every object whose
    ``block_types`` index lists ``__somersault__``. The modification date
    doesn't change. See https://github.com/plone/aurora/issues/379.
    """
    migrate_site()
