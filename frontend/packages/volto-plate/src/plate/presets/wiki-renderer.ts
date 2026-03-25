import type { PlateConfig } from '@plone/plate/types';
import { wikiBaseEditorKit } from '../kits/wiki-base-kit';
import { FloatingToolbarButtons } from '../wiki/floating-toolbar-buttons';
import { setFloatingToolbarButtons } from '@plone/plate/components/editor/plugins/floating-toolbar-kit';

import { TitleRendererBlock } from '../plugins/volto-title-renderer';

setFloatingToolbarButtons(FloatingToolbarButtons);

const wikiEditorRenderer: PlateConfig = {
  readOnly: true,
  plugins: [...wikiBaseEditorKit, TitleRendererBlock],
};

export default wikiEditorRenderer;
