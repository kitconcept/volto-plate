from copy import deepcopy
from plone import api


LEGACY_IMAGE_TYPE = "img"
PLONE_BLOCK_TYPE = "ploneBlock"
PLATE_IMAGE_TYPE = "plateimage"
SOMERSAULT_BLOCK = "__somersault__"
WIKI_PAGE_TYPE = "WikiPage"


def _migrate_somersault_node(node):
    changed = False

    if isinstance(node, list):
        for item in node:
            changed = _migrate_somersault_node(item) or changed
        return changed

    if not isinstance(node, dict):
        return False

    if node.get("type") == LEGACY_IMAGE_TYPE and node.get("@type") == PLATE_IMAGE_TYPE:
        node["type"] = PLONE_BLOCK_TYPE
        changed = True

    for value in node.values():
        changed = _migrate_somersault_node(value) or changed

    return changed


def migrate_wiki_page_image_blocks(_context):
    """Migrate legacy wiki image nodes to ploneBlock nodes."""
    for brain in api.content.find(portal_type=WIKI_PAGE_TYPE):
        obj = brain.getObject()
        blocks = getattr(obj, "blocks", None)

        if not isinstance(blocks, dict) or SOMERSAULT_BLOCK not in blocks:
            continue

        somersault_block = blocks.get(SOMERSAULT_BLOCK)
        if not isinstance(somersault_block, dict):
            continue

        next_somersault_block = deepcopy(somersault_block)
        changed = _migrate_somersault_node(next_somersault_block)

        if not changed:
            continue

        next_blocks = dict(blocks)
        next_blocks[SOMERSAULT_BLOCK] = next_somersault_block
        obj.blocks = next_blocks
        obj.reindexObject()
