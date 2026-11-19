import { MAIN_REGION, PLATE_TYPE, SOMERSAULT_KEY } from '../constants';

type Blocks = Record<string, any>;
type BlocksLayout = { items?: string[]; [key: string]: unknown };

/**
 * Returns the Plate document region of the content `blocks`: the `main`
 * region, or the legacy `__somersault__` block of content not migrated yet.
 * If both exist, `main` wins.
 */
export function getPlateRegion<T = Record<string, unknown>>(
  blocks: Blocks | null | undefined,
): T | undefined {
  if (!blocks) return undefined;
  if (Object.hasOwn(blocks, MAIN_REGION)) return blocks[MAIN_REGION] as T;
  if (Object.hasOwn(blocks, SOMERSAULT_KEY)) return blocks[SOMERSAULT_KEY] as T;
  return undefined;
}

/**
 * Whether the content `blocks` hold a Plate document region, in the new or in
 * the legacy shape.
 */
export function hasPlateRegion(blocks: Blocks | null | undefined): boolean {
  return getPlateRegion(blocks) !== undefined;
}

/**
 * Renames the legacy `__somersault__` block to the `main` region with the
 * `plate` type, keeping its other fields, like `discussions`, and drops
 * `__somersault__` from `blocks_layout.items`. If both exist, `main` wins and
 * the legacy block is dropped.
 *
 * It does not mutate its arguments. When there is nothing to migrate, it
 * returns the same `blocks` and `blocksLayout` objects, so callers can tell
 * whether anything changed by identity.
 *
 * Remove once all content is migrated by the backend upgrade step, see
 * https://github.com/plone/aurora/issues/379.
 */
export function migrateSomersaultRegion<
  B extends Blocks | null | undefined,
  L extends BlocksLayout | null | undefined,
>(blocks: B, blocksLayout?: L): { blocks: B; blocksLayout: L | undefined } {
  let nextBlocks = blocks;
  if (blocks && Object.hasOwn(blocks, SOMERSAULT_KEY)) {
    const { [SOMERSAULT_KEY]: legacy, ...rest } = blocks;
    nextBlocks = (
      Object.hasOwn(rest, MAIN_REGION) || !legacy
        ? rest
        : { ...rest, [MAIN_REGION]: { ...legacy, '@type': PLATE_TYPE } }
    ) as B;
  }

  let nextLayout = blocksLayout;
  const items = blocksLayout?.items;
  if (Array.isArray(items) && items.includes(SOMERSAULT_KEY)) {
    nextLayout = {
      ...blocksLayout,
      items: items.filter((id) => id !== SOMERSAULT_KEY),
    } as L;
  }

  return { blocks: nextBlocks, blocksLayout: nextLayout };
}
