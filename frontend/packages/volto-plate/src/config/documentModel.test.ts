import { describe, expect, it, vi } from 'vitest';

import installBlocks, { NATIVE_BLOCK_TYPES } from './blocks';
import install, { PLATE_DOCUMENT_MODEL } from './documentModel';

vi.mock('../components/Blocks/Image/Edit', () => ({
  default: vi.fn(),
}));

vi.mock('../components/Blocks/Image/View', () => ({
  default: vi.fn(),
}));

function setup() {
  const utilities: Record<string, Record<string, { method: () => any }>> = {};
  const config = {
    settings: { PlateEditorContentTypes: ['WikiPage'] },
    blocks: {
      widths: [],
      blocksConfig: { image: {} },
      plateBlocksConfig: {},
    },
    registerUtility: vi.fn(({ name, type, method }) => {
      utilities[type] = { ...utilities[type], [name]: { method } };
    }),
  } as any;
  installBlocks(config);
  install(config);
  return {
    config,
    documentModel: () => utilities.documentModel[PLATE_DOCUMENT_MODEL].method(),
  };
}

describe('config/documentModel', () => {
  it('registers the plone.plate document model', () => {
    const { config, documentModel } = setup();

    expect(config.registerUtility).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'plone.plate',
        type: 'documentModel',
      }),
    );
    expect(documentModel()).toMatchObject({ id: 'plone.plate', version: 1 });
  });

  it('is used by the PlateEditorContentTypes', () => {
    const { config, documentModel } = setup();

    expect(documentModel().types()).toEqual(['WikiPage']);

    config.settings.PlateEditorContentTypes = ['WikiPage', 'Handbook'];
    expect(documentModel().types()).toEqual(['WikiPage', 'Handbook']);
  });

  it('has the native elements of the wiki editor', () => {
    const { documentModel } = setup();
    const elements = documentModel().elements();

    expect(elements).toEqual([...NATIVE_BLOCK_TYPES]);
    expect(elements).toContain('code_drawing');
    expect(elements).not.toContain('toggle');
  });

  it('holds the plateimage block', () => {
    const { documentModel } = setup();

    expect(documentModel().blocks()).toEqual(['plateimage']);
  });
});
