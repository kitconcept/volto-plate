import { describe, expect, it, vi } from 'vitest';

import install from './blocks';

describe('config/blocks', () => {
  it('registers the blockWidth style field utility', () => {
    const registerUtility = vi.fn();
    const widths = [
      {
        name: 'default',
        label: 'Default',
        style: {
          '--block-width': 'var(--default-container-width)',
        },
      },
    ];
    const config = {
      blocks: {
        widths,
        blocksConfig: {
          image: {},
        },
        plateBlocksConfig: {},
      },
      registerUtility,
    } as any;

    install(config);

    expect(registerUtility).toHaveBeenCalledWith({
      type: 'styleFieldDefinition',
      name: 'blockWidth',
      method: expect.any(Function),
    });

    const utility = registerUtility.mock.calls.find(
      ([value]) =>
        value.type === 'styleFieldDefinition' && value.name === 'blockWidth',
    )?.[0];

    expect(utility.method()).toBe(widths);
  });

  it('registers native image nodes with a default block width', () => {
    const config = {
      blocks: {
        widths: [],
        blocksConfig: {
          image: {},
        },
        plateBlocksConfig: {},
      },
      registerUtility: vi.fn(),
    } as any;

    install(config);

    expect(config.blocks.plateBlocksConfig.img).toEqual({
      blockWidth: {
        defaultWidth: 'default',
      },
    });
  });
});
