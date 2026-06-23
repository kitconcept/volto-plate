import { describe, expect, it, vi } from 'vitest';

vi.mock('@plone/registry', () => ({
  default: {
    blocks: {
      blocksConfig: {
        plateimage: {
          blockSchema: () => ({
            properties: {
              align: {
                default: 'center',
                actions: ['left', 'center', 'right'],
                styleField: true,
              },
              size: {
                default: 'l',
                actions: ['s', 'm', 'l'],
                styleField: true,
              },
            },
          }),
        },
      },
    },
  },
}));

vi.mock('@plone/helpers', async () => {
  return {
    getStyleFieldsFromBlockSchema: (blockConfig: any) =>
      blockConfig?.blockSchema?.().properties
        ? {
            align: {
              defaultValue: 'center',
              values: ['left', 'center', 'right'],
            },
            size: {
              defaultValue: 'l',
              values: ['s', 'm', 'l'],
            },
          }
        : {},
    resolveStyleFields: ({
      data,
      fieldConfigs,
      resolveDefinitions,
    }: {
      data: Record<string, unknown>;
      fieldConfigs: Record<string, { values?: string[] }>;
      resolveDefinitions: (fieldName: string) => Array<{
        name: string;
        style?: Record<string, string>;
      }>;
    }) => {
      const style = Object.keys(fieldConfigs).reduce<Record<string, string>>(
        (acc, fieldName) => {
          const value = data[fieldName];

          if (typeof value !== 'string') return acc;

          const definition = resolveDefinitions(fieldName).find(
            (item) => item.name === value,
          );

          return definition?.style ? { ...acc, ...definition.style } : acc;
        },
        {},
      );

      return { style, values: {} };
    },
    getStyleFieldDefinitionsFromRegistry: (fieldName: string) => {
      if (fieldName === 'align') {
        return [
          {
            name: 'left',
            style: { '--block-alignment': 'var(--align-left)' },
          },
          {
            name: 'center',
            style: { '--block-alignment': 'var(--align-center)' },
          },
          {
            name: 'right',
            style: { '--block-alignment': 'var(--align-right)' },
          },
        ];
      }

      if (fieldName === 'size') {
        return [
          {
            name: 's',
            style: { '--block-size': '220px' },
          },
          {
            name: 'm',
            style: { '--block-size': '300px' },
          },
          {
            name: 'l',
            style: { '--block-size': '460px' },
          },
        ];
      }

      return [];
    },
  };
});

import { resolveAdapterStyleFieldStyles } from './volto-block-adapter';

describe('volto block adapter style fields', () => {
  it('resolves schema-backed style fields for adapted Volto blocks', () => {
    expect(
      resolveAdapterStyleFieldStyles(
        {
          type: 'img',
          '@type': 'plateimage',
          children: [{ text: '' }],
        } as any,
        {
          '@type': 'plateimage',
          align: 'right',
          size: 'm',
        },
      ),
    ).toEqual({
      '--block-alignment': 'var(--align-right)',
      '--block-size': '300px',
    });
  });

  it('skips style resolution when the adapted node has no block type', () => {
    expect(
      resolveAdapterStyleFieldStyles(
        {
          type: 'img',
          children: [{ text: '' }],
        } as any,
        {
          align: 'right',
          size: 'm',
        },
      ),
    ).toEqual({});
  });
});
