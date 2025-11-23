import type { BlockEditProps } from '@plone/types';
import { PlateEditor, type Value } from '@plone/plate/components/editor';
import plateBlockConfig from '@plone/plate/config/presets/block';
import { useStablePlateValue } from '@plone/volto-plate';

const TextBlockEdit = (props: BlockEditProps) => {
  const { data, onChangeBlock, id } = props;
  const stableValue = useStablePlateValue(data.value as Value | undefined);

  return (
    <PlateEditor
      editorConfig={plateBlockConfig.editorConfig}
      value={stableValue}
      onChange={(options) => {
        onChangeBlock(id, { ...data, value: options.value });
      }}
    />
  );
};

export default TextBlockEdit;
