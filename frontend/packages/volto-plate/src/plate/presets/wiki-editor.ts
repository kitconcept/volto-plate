import type { PlateConfig } from '@plone/plate/types';
import {
  PloneBlockAdapterPlugin,
  PloneBlockKeyboardPlugin,
} from '@plone/plate/components/editor/plugins/plone-block-adapter';
import { WikiEditorKit } from '../kits/wiki-editor-kit';
import { PlaywrightPlugin } from '@platejs/playwright';
import { VoltoTitleBlock } from '../plugins/volto-title';

const wikiEditorPreset: PlateConfig = {
  plugins: [
    PloneBlockKeyboardPlugin,
    ...WikiEditorKit,
    VoltoTitleBlock,
    PloneBlockAdapterPlugin,
    // Include Playwright plugin only during e2e tests
    ...(typeof window !== 'undefined'
      ? [PlaywrightPlugin.configure({ enabled: true })]
      : []),
  ],
};

export default wikiEditorPreset;
