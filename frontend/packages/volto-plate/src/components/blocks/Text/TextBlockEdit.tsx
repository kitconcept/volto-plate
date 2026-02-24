import React from 'react';

import type { BlockEditProps } from '@plone/types';
import { PlateEditor, type Value } from '@plone/plate/components/editor';
import plateBlockEditorConfig from '@plone/plate/config/presets/block-editor';
import { useStablePlateValue } from '../../../hooks/use-stable-plate-value';
import { BlocksApiProvider } from '../../../plate/context/BlocksApiContext';

const TextBlockEdit = (props: BlockEditProps) => {
  const { data, onChangeBlock, id } = props;
  const stableValue = useStablePlateValue(data.value as Value | undefined);

  return (
    <BlocksApiProvider value={props}>
      <PlateEditor
        editorConfig={plateBlockEditorConfig}
        value={stableValue}
        blocksApi={props}
        intl={props.intl}
        onChange={(options) => {
          onChangeBlock(id, { ...data, value: options.value });
        }}
      />
    </BlocksApiProvider>
  );
};

export default TextBlockEdit;
