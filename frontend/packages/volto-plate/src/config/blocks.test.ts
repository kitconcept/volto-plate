import { describe, expect, it, vi } from 'vitest';

vi.mock('../components/Blocks/Image/Edit', () => ({
  default: vi.fn(),
}));

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
        label: 'Default',
        style: {
          '--block-align': 'none',
          '--block-image-margin-left': 'auto',
          '--block-image-margin-right': 'auto',
        },
      },
      {
        name: 'left',
        label: 'Left',
        style: {
          '--block-align': 'left',
          '--block-image-margin-left': '0',
          '--block-image-margin-right': 'calc(var(--spacing) * 4)',
        },
      },
      {
        name: 'right',
        label: 'Right',
        style: {
          '--block-align': 'right',
          '--block-image-margin-left': 'calc(var(--spacing) * 4)',
          '--block-image-margin-right': '0',
        },
      },
    ]);
    expect(sizeUtility?.method()).toEqual([
      {
        name: 'l',
        label: 'Large',
        style: { '--block-size': '460px' },
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
