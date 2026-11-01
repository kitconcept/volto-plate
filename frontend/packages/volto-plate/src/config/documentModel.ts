import type { ConfigType } from '@plone/registry';

declare module '@plone/types' {
  export interface SettingsConfig {
    PlateEditorContentTypes?: string[];
  }
}

export const PLATE_DOCUMENT_MODEL = 'plone.plate';

// How the `PlateEditorContentTypes` store their blocks, as Volto's
// `@blocks-schema` endpoint announces it: one Plate document in the
// `__somersault__` block. Its docs and those of its elements come from
// `@plone/plate`, and volto-plate documents `code_drawing`.
export default function install(config: ConfigType) {
  config.registerUtility({
    name: PLATE_DOCUMENT_MODEL,
    type: 'documentModel',
    method: () => ({
      id: PLATE_DOCUMENT_MODEL,
      version: 1,
      types: () => config.settings.PlateEditorContentTypes ?? [],
      // The native elements of the wiki editor, so `@plone/plate`'s
      // `toggle`, which it leaves out, isn't offered.
      elements: () => Object.keys(config.blocks.plateBlocksConfig ?? {}),
      // The Plone blocks a Plate document can hold, as `ploneBlock` nodes.
      blocks: () => ['plateimage'],
    }),
  });

  return config;
}
