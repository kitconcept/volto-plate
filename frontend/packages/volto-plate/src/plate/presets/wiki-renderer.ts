import type { PlateConfig } from '@plone/plate/types';
import { PloneBlockAdapterRendererPlugin } from '@plone/plate/components/editor/plugins/plone-block-adapter-renderer';
import { wikiBaseEditorKit } from '../kits/wiki-base-kit';

import { TitleRendererBlock } from '../plugins/volto-title-renderer';

const wikiEditorRenderer: PlateConfig = {
  readOnly: true,
  plugins: [
    ...wikiBaseEditorKit,
    TitleRendererBlock,
    PloneBlockAdapterRendererPlugin,
  ],
};

export default wikiEditorRenderer;
