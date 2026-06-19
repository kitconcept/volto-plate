import type { PlateConfig } from '@plone/plate/types';
import { wikiBaseEditorKit } from '../kits/wiki-base-kit';

import { TitleRendererBlock } from '../plugins/volto-title-renderer';

const wikiEditorRenderer: PlateConfig = {
  readOnly: true,
  plugins: [...wikiBaseEditorKit, TitleRendererBlock],
};

export default wikiEditorRenderer;
