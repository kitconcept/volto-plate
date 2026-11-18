"""Move ``blocks.__somersault__`` to ``blocks.main`` with ``"@type": "plate"``.

Migrates the Plate editor content shape in place, without changing the
modification date (https://github.com/plone/aurora/issues/379). The
``20261112001`` upgrade step of ``kitconcept.plate:default`` does the same, so
running this script is optional. Use it to preview the migration, to migrate
other portal types, or to run it again.

Run it with the Zope instance script, for example::

    bin/instance run path/to/migrate_plate_regions.py Plone --dry-run
    bin/instance run path/to/migrate_plate_regions.py Plone

or with ``zconsole``::

    zconsole run instance/etc/zope.conf path/to/migrate_plate_regions.py Plone

Arguments:

``site``
    Path of the Plone site in the database (default: ``Plone``).
``--dry-run``
    Only list the objects that would change, and commit nothing.
``--portal-type PORTAL_TYPE``
    Portal type to migrate, can be repeated (default: ``WikiPage``).
``--all``
    Migrate the site root, every ``WikiPage`` and every object whose
    ``block_types`` index lists ``__somersault__``, like the upgrade step.
``--batch-size N``
    Commit every ``N`` migrated objects (default: 250).

The logic lives in :func:`kitconcept.plate.migration.run_from_console`.
"""

from kitconcept.plate.migration import run_from_console

import sys


if __name__ == "__main__":
    # ``app`` is set by ``bin/instance run`` and ``zconsole run``.
    run_from_console(app, sys.argv[1:])  # noqa: F821
