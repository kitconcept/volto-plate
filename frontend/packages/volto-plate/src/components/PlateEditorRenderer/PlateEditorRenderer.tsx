import type { Content } from '@plone/types';
import {
  PlateController,
  PlateRenderer,
  type Value,
} from '@plone/plate/components/editor';
import wikiEditorRenderer from '../../plate/presets/wiki-renderer';

const SOMERSAULT_KEY = '__somersault__';

type PlateEditorRendererProps = {
  content: Content;
};

const PlateEditorRenderer = ({ content }: PlateEditorRendererProps) => {
  const somersaultBlock = content.blocks?.[SOMERSAULT_KEY] as
    | { value?: Value }
    | undefined;

  return somersaultBlock?.value ? (
    <PlateController>
      <PlateRenderer
        editorConfig={wikiEditorRenderer}
        value={somersaultBlock.value as Value}
      />
    </PlateController>
  ) : null;
};

export default PlateEditorRenderer;
