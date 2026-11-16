"""Migrate Plate regions from ``__somersault__`` to ``main``.

The Plate editor used to store the page as one Plate value in
``blocks["__somersault__"]``, with ``"@type": "__somersault__"``. The current
shape stores it in ``blocks["main"]``, with ``"@type": "plate"``
(https://github.com/plone/aurora/issues/379).

The migration runs from:

* the ``20261112001`` upgrade step of the ``kitconcept.plate:default``
  profile, see :mod:`kitconcept.plate.upgrades.v20261112001`;
* the ``scripts/migrate_plate_regions.py`` script in this package, run with
  ``bin/instance run`` or ``zconsole run``, which calls
  :func:`run_from_console`;
* Python code, with :func:`migrate_somersault_blocks` for one object or
  :func:`migrate_site` for a whole site.

It never changes the modification date of the content.
"""

from AccessControl.SecurityManagement import newSecurityManager
from AccessControl.SpecialUsers import system as system_user
from Acquisition import aq_base
from dataclasses import dataclass
from dataclasses import field
from kitconcept.plate import logger
from kitconcept.plate.regions import LEGACY_SOMERSAULT
from kitconcept.plate.regions import MAIN_REGION
from kitconcept.plate.regions import PLATE_TYPE
from plone import api
from Testing.makerequest import makerequest
from zope.component.hooks import setSite

import argparse
import transaction


WIKI_PAGE_TYPE = "WikiPage"

# Catalog indexes fed by the blocks key or ``@type``.
REINDEX_IDXS = ("SearchableText", "block_types")

MIGRATE = "migrate"
COLLISION = "collision"


def migration_status(obj) -> str | None:
    """Return ``MIGRATE``, ``COLLISION`` or ``None`` (nothing to do) for ``obj``.

    ``COLLISION`` means ``obj`` has both ``__somersault__`` and ``main``, which
    the migration doesn't resolve.
    """
    blocks = getattr(aq_base(obj), "blocks", None)
    if not isinstance(blocks, dict) or LEGACY_SOMERSAULT not in blocks:
        return None
    if MAIN_REGION in blocks:
        return COLLISION
    return MIGRATE


def _migrated_blocks(blocks: dict) -> dict:
    """Return a copy of ``blocks`` with the legacy region renamed, in order."""
    new_blocks = {}
    for key, block in blocks.items():
        if key == LEGACY_SOMERSAULT:
            key = MAIN_REGION
            block = {**block, "@type": PLATE_TYPE} if isinstance(block, dict) else block
        new_blocks[key] = block
    return new_blocks


def _migrated_layout(blocks_layout) -> dict | None:
    """Rename ``__somersault__`` in ``blocks_layout["items"]``, if it is there.

    Regions don't belong in the layout, but some content lists it there.
    """
    if not isinstance(blocks_layout, dict):
        return None
    items = blocks_layout.get("items")
    if not isinstance(items, list) or LEGACY_SOMERSAULT not in items:
        return None
    new_items = []
    for item in items:
        item = MAIN_REGION if item == LEGACY_SOMERSAULT else item
        if item not in new_items:
            new_items.append(item)
    return {**blocks_layout, "items": new_items}


def _reindex(obj):
    catalog = api.portal.get_tool("portal_catalog")
    indexes = catalog.indexes()
    idxs = [idx for idx in REINDEX_IDXS if idx in indexes]
    if not idxs:
        return
    # Explicit idxs: CMFCatalogAware.reindexObject only calls notifyModified
    # when idxs is empty, so the modification date stays as it is. No
    # ObjectModifiedEvent either: the links stay the same, so link integrity
    # doesn't need an update.
    obj.reindexObject(idxs=idxs)


def migrate_somersault_blocks(obj, reindex: bool = True) -> bool:
    """Move ``blocks["__somersault__"]`` to ``blocks["main"]`` on ``obj``.

    Sets the region's ``@type`` to ``plate``, renames the key in
    ``blocks_layout`` if it is listed there, and reindexes ``SearchableText``
    (and ``block_types``) without changing the modification date.

    If ``blocks["main"]`` exists too, ``obj`` is left alone and a warning is
    logged. Returns ``True`` if ``obj`` changed.
    """
    status = migration_status(obj)
    if status is None:
        return False
    path = "/".join(obj.getPhysicalPath())
    if status == COLLISION:
        logger.warning(
            f"{path} has both {LEGACY_SOMERSAULT!r} and {MAIN_REGION!r} blocks, "
            "leaving it alone."
        )
        return False
    base = aq_base(obj)
    # Assign new dicts so persistence notices the change.
    obj.blocks = _migrated_blocks(base.blocks)
    new_layout = _migrated_layout(getattr(base, "blocks_layout", None))
    if new_layout is not None:
        obj.blocks_layout = new_layout
    if reindex:
        _reindex(obj)
    logger.info(f"Migrated {LEGACY_SOMERSAULT!r} to {MAIN_REGION!r} in {path}")
    return True


def iter_candidates(portal, portal_types=None):
    """Yield the objects that may hold a ``__somersault__`` region.

    With ``portal_types``, those are the catalogued objects of these types.
    Without, they are the site root, every ``WikiPage`` and every object whose
    ``block_types`` index lists ``__somersault__``.
    """
    catalog = api.portal.get_tool("portal_catalog")
    queries = []
    if portal_types:
        queries.append({"portal_type": list(portal_types)})
    else:
        yield portal
        queries.append({"portal_type": WIKI_PAGE_TYPE})
        if "block_types" in catalog.indexes():
            queries.append({"block_types": LEGACY_SOMERSAULT})
    seen = set()
    for query in queries:
        for brain in catalog.unrestrictedSearchResults(**query):
            path = brain.getPath()
            if path in seen:
                continue
            seen.add(path)
            try:
                yield brain._unrestrictedGetObject()
            except (AttributeError, KeyError):
                logger.warning(f"Could not get object at {path}, skipping.")


@dataclass
class MigrationResult:
    """Paths of the objects the migration changed, or would change."""

    migrated: list[str] = field(default_factory=list)
    collisions: list[str] = field(default_factory=list)


def migrate_site(
    portal=None,
    portal_types=None,
    dry_run: bool = False,
    batch_size: int = 250,
    commit: bool = False,
) -> MigrationResult:
    """Migrate the ``__somersault__`` regions of a site.

    See :func:`iter_candidates` for ``portal_types``. With ``dry_run``,
    nothing changes and the result lists what would change. Every
    ``batch_size`` migrated objects, the transaction is committed if
    ``commit`` is true, or else a savepoint is made. The final commit is left
    to the caller.
    """
    if portal is None:
        portal = api.portal.get()
    result = MigrationResult()
    for obj in iter_candidates(portal, portal_types):
        status = migration_status(obj)
        if status is None:
            continue
        path = "/".join(obj.getPhysicalPath())
        if status == COLLISION:
            if not dry_run:
                # Logs the warning.
                migrate_somersault_blocks(obj)
            result.collisions.append(path)
            continue
        if not dry_run:
            migrate_somersault_blocks(obj)
        result.migrated.append(path)
        if not dry_run and len(result.migrated) % batch_size == 0:
            if commit:
                transaction.commit()
            else:
                transaction.savepoint(optimistic=True)
    prefix = "[dry-run] " if dry_run else ""
    logger.info(
        f"{prefix}Migrated {LEGACY_SOMERSAULT!r} to {MAIN_REGION!r} in "
        f"{len(result.migrated)} objects, skipped {len(result.collisions)} "
        f"objects that also have {MAIN_REGION!r}."
    )
    return result


def _parse_console_args(argv):
    parser = argparse.ArgumentParser(
        prog="migrate_plate_regions",
        description=(
            "Move blocks.__somersault__ to blocks.main with @type plate, "
            "without changing the modification date."
        ),
    )
    parser.add_argument(
        "site",
        nargs="?",
        default="Plone",
        help="Path of the Plone site in the database (default: Plone).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List the objects that would change, and commit nothing.",
    )
    parser.add_argument(
        "--portal-type",
        action="append",
        dest="portal_types",
        metavar="PORTAL_TYPE",
        help=(f"Portal type to migrate, can be repeated (default: {WIKI_PAGE_TYPE})."),
    )
    parser.add_argument(
        "--all",
        action="store_true",
        dest="all_types",
        help=(
            "Migrate the site root, every WikiPage and every object whose "
            "block_types index lists __somersault__, like the upgrade step."
        ),
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=250,
        help="Commit every this many migrated objects (default: 250).",
    )
    # ``bin/instance run`` may pass on its own options.
    args, _ = parser.parse_known_args(argv)
    return args


def run_from_console(app, argv, out=print) -> MigrationResult:
    """Run the migration from ``bin/instance run`` or ``zconsole run``.

    ``app`` is the Zope root that the instance script provides. See
    :func:`_parse_console_args` for ``argv``. Commits the transaction, in
    batches, except with ``--dry-run``.
    """
    args = _parse_console_args(argv)
    # ``None`` selects the same objects as the upgrade step.
    default_types = args.portal_types or [WIKI_PAGE_TYPE]
    portal_types = None if args.all_types else default_types
    app = makerequest(app)
    newSecurityManager(None, system_user)
    portal = app.unrestrictedTraverse(args.site)
    setSite(portal)
    result = migrate_site(
        portal,
        portal_types=portal_types,
        dry_run=args.dry_run,
        batch_size=args.batch_size,
        commit=not args.dry_run,
    )
    verb = "Would migrate" if args.dry_run else "Migrated"
    for path in result.migrated:
        out(f"{verb}: {path}")
    for path in result.collisions:
        out(f"Skipped, has both {LEGACY_SOMERSAULT} and {MAIN_REGION}: {path}")
    out(
        f"{verb} {len(result.migrated)} objects, skipped "
        f"{len(result.collisions)} objects."
    )
    if args.dry_run:
        transaction.abort()
        out("Dry run: nothing committed.")
    else:
        transaction.get().note(
            f"kitconcept.plate: migrate {LEGACY_SOMERSAULT} to {MAIN_REGION}"
        )
        transaction.commit()
    return result
