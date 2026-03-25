import type { PlateConfig } from '@plone/plate/types';
import { WikiEditorKit } from '../kits/wiki-editor-kit';
import { BlockFloatingToolbarButtons } from '@plone/plate/components/ui/preset-block-floating-toolbar-buttons';
import { setFloatingToolbarButtons } from '@plone/plate/components/editor/plugins/floating-toolbar-kit';
import { PlaywrightPlugin } from '@platejs/playwright';
import { VoltoTitleBlock } from '../plugins/volto-title';

setFloatingToolbarButtons(BlockFloatingToolbarButtons);

const wikiEditorPreset: PlateConfig = {
  plugins: [
    ...WikiEditorKit,
    VoltoTitleBlock,
    // Include Playwright plugin only during e2e tests
    ...(typeof window !== 'undefined'
      ? [PlaywrightPlugin.configure({ enabled: true })]
      : []),
  ],
  floatingToolbarButtons: BlockFloatingToolbarButtons,
};

export default wikiEditorPreset;
