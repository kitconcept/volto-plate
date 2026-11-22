import { describe, expect, it } from 'vitest';

import { MAIN_REGION, PLATE_TYPE, SOMERSAULT_KEY } from '../constants';
import {
  getPlateRegion,
  hasPlateRegion,
  migrateSomersaultRegion,
} from './plateRegion';

const value = [{ type: 'p', children: [{ text: 'Hello' }] }];
const discussions = { d1: { id: 'd1' } };

describe('getPlateRegion', () => {
  it('returns the main region', () => {
    const main = { '@type': PLATE_TYPE, value };
    expect(getPlateRegion({ [MAIN_REGION]: main })).toBe(main);
  });

  it('returns the legacy block of content not migrated yet', () => {
    const legacy = { '@type': SOMERSAULT_KEY, value };
    expect(getPlateRegion({ [SOMERSAULT_KEY]: legacy })).toBe(legacy);
  });

  it('prefers main when both exist', () => {
    const main = { '@type': PLATE_TYPE, value };
    const legacy = { '@type': SOMERSAULT_KEY, value: [] };
    expect(
      getPlateRegion({ [SOMERSAULT_KEY]: legacy, [MAIN_REGION]: main }),
    ).toBe(main);
  });

  it('returns undefined for content without a Plate region', () => {
    expect(getPlateRegion(undefined)).toBeUndefined();
    expect(getPlateRegion(null)).toBeUndefined();
    expect(getPlateRegion({ abc: { '@type': 'slate' } })).toBeUndefined();
  });
});

describe('hasPlateRegion', () => {
  it('detects both shapes', () => {
    expect(hasPlateRegion({ [MAIN_REGION]: { '@type': PLATE_TYPE } })).toBe(
      true,
    );
    expect(
      hasPlateRegion({ [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY } }),
    ).toBe(true);
    expect(hasPlateRegion({ abc: { '@type': 'slate' } })).toBe(false);
    expect(hasPlateRegion(undefined)).toBe(false);
  });
});

describe('migrateSomersaultRegion', () => {
  it('renames the legacy block to main, keeping its other fields', () => {
    const blocks = {
      [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value, discussions },
      other: { '@type': 'slate' },
    };
    const blocksLayout = { items: [SOMERSAULT_KEY, 'other'] };

    const result = migrateSomersaultRegion(blocks, blocksLayout);

    expect(result.blocks).toEqual({
      [MAIN_REGION]: { '@type': PLATE_TYPE, value, discussions },
      other: { '@type': 'slate' },
    });
    expect(result.blocksLayout).toEqual({ items: ['other'] });
  });

  it('does not mutate its arguments', () => {
    const blocks = { [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value } };
    const blocksLayout = { items: [SOMERSAULT_KEY] };

    migrateSomersaultRegion(blocks, blocksLayout);

    expect(blocks).toEqual({
      [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value },
    });
    expect(blocksLayout).toEqual({ items: [SOMERSAULT_KEY] });
  });

  it('keeps main and drops the legacy block when both exist', () => {
    const main = { '@type': PLATE_TYPE, value };
    const blocks = {
      [SOMERSAULT_KEY]: { '@type': SOMERSAULT_KEY, value: [] },
      [MAIN_REGION]: main,
    };

    expect(migrateSomersaultRegion(blocks).blocks).toEqual({
      [MAIN_REGION]: main,
    });
  });

  it('returns the same objects when there is nothing to migrate', () => {
    const blocks = { [MAIN_REGION]: { '@type': PLATE_TYPE, value } };
    const blocksLayout = { items: [] };

    const result = migrateSomersaultRegion(blocks, blocksLayout);

    expect(result.blocks).toBe(blocks);
    expect(result.blocksLayout).toBe(blocksLayout);
  });

  it('drops a legacy layout entry even without the legacy block', () => {
    const blocks = { [MAIN_REGION]: { '@type': PLATE_TYPE, value } };
    const result = migrateSomersaultRegion(blocks, {
      items: [SOMERSAULT_KEY],
    });

    expect(result.blocks).toBe(blocks);
    expect(result.blocksLayout).toEqual({ items: [] });
  });

  it('handles missing blocks and layout', () => {
    expect(migrateSomersaultRegion(undefined, undefined)).toEqual({
      blocks: undefined,
      blocksLayout: undefined,
    });
  });
});
