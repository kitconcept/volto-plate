import type { PlateConfig } from '@plone/plate/types';
import { WikiEditorKit } from '../kits/wiki-editor-kit';
import { PlaywrightPlugin } from '@platejs/playwright';
import { VoltoTitleBlock } from '../plugins/volto-title';

const wikiEditorPreset: PlateConfig = {
  plugins: [
    ...WikiEditorKit,
    VoltoTitleBlock,
    // Include Playwright plugin only during e2e tests
    ...(typeof window !== 'undefined'
      ? [PlaywrightPlugin.configure({ enabled: true })]
      : []),
  ],
};

export default wikiEditorPreset;
