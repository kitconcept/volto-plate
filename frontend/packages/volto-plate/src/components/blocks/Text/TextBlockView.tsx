import type { BlockViewProps } from '@plone/types';
import { PlateRenderer, type Value } from '@plone/plate/components/editor';
import plateBlockRendererConfig from '@plone/plate/config/presets/block-renderer';

const TextBlockView = (props: BlockViewProps) => {
  const { data } = props;

  return data?.value ? (
    <PlateRenderer
      editorConfig={plateBlockRendererConfig}
      value={data.value as Value}
      variant="none"
    />
  ) : null;
};

export default TextBlockView;
