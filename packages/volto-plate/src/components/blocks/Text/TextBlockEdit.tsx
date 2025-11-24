import React from 'react';

import type { BlockEditProps } from '@plone/types';
import { PlateEditor, type Value } from '@plone/plate/components/editor';
import plateBlockConfig from '@plone/plate/config/presets/block';
import { useStablePlateValue } from '@plone/volto-plate';
import { BlocksApiProvider } from '../../../plate/context/BlocksApiContext';

const TextBlockEdit = (props: BlockEditProps) => {
  const { data, onChangeBlock, onInsertBlock, onSelectBlock, id, type } = props;
  const stableValue = useStablePlateValue(data.value as Value | undefined);

  return (
    <BlocksApiProvider
      value={{
        data,
        id,
        type,
        onChangeBlock,
        onInsertBlock,
        onSelectBlock,
      }}
    >
      <PlateEditor
        editorConfig={plateBlockConfig.editorConfig}
        value={stableValue}
        blocksApi={{
          data,
          id,
          type,
          onChangeBlock,
          onInsertBlock,
          onSelectBlock,
        }}
        onChange={(options) => {
          onChangeBlock(id, { ...data, value: options.value });
        }}
      />
    </BlocksApiProvider>
  );
};

export default TextBlockEdit;
