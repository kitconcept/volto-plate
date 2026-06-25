import { describe, expect, it, vi } from 'vitest';

import install from './blocks';

vi.mock('../components/Blocks/Image/Edit', () => ({
  default: vi.fn(),
}));

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

  it('registers align and size style field utilities', () => {
    const registerUtility = vi.fn();
    const config = {
      blocks: {
        widths: [],
        blocksConfig: {
          image: {},
        },
        plateBlocksConfig: {},
      },
      registerUtility,
    } as any;

    install(config);

    const alignUtility = registerUtility.mock.calls.find(
      ([value]) =>
        value.type === 'styleFieldDefinition' && value.name === 'align',
    )?.[0];
    const sizeUtility = registerUtility.mock.calls.find(
      ([value]) =>
        value.type === 'styleFieldDefinition' && value.name === 'size',
    )?.[0];

    expect(alignUtility?.method()).toEqual([
      {
        name: 'center',
        label: 'Center',
        style: {
          '--block-alignment': 'none',
        },
      },
      {
        name: 'left',
        label: 'Left',
        style: {
          '--block-alignment': 'left',
        },
      },
      {
        name: 'right',
        label: 'Right',
        style: {
          '--block-alignment': 'right',
        },
      },
    ]);
    expect(sizeUtility?.method()).toEqual([
      {
        name: 'l',
        label: 'Large',
        style: {},
      },
      {
        name: 'm',
        label: 'Medium',
        style: { '--block-size': '300px' },
      },
      {
        name: 's',
        label: 'Small',
        style: { '--block-size': '220px' },
      },
    ]);
  });

  it('registers a dedicated plateimage block config', () => {
    const config = {
      blocks: {
        widths: [],
        blocksConfig: {
          image: {
            id: 'image',
            title: 'Image',
            view: vi.fn(),
          },
        },
        plateBlocksConfig: {},
      },
      registerUtility: vi.fn(),
    } as any;

    install(config);

    expect(config.blocks.blocksConfig.plateimage).toMatchObject({
      id: 'plateimage',
      title: 'Image',
      edit: expect.any(Function),
      blockSchema: expect.any(Function),
      restricted: true,
      schemaEnhancer: undefined,
    });
  });
});
