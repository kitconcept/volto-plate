import React from 'react';

import type { BlockEditProps } from '@plone/types';
import { PlateEditor, type Value } from '@plone/plate/components/editor';
import plateBlockConfig from '@plone/plate/config/presets/block';
import { useStablePlateValue } from '../../../hooks/use-stable-plate-value';
import { BlocksApiProvider } from '../../../plate/context/BlocksApiContext';

const TextBlockEdit = (props: BlockEditProps) => {
  const { data, onChangeBlock, id } = props;
  const stableValue = useStablePlateValue(data.value as Value | undefined);

  return (
    <BlocksApiProvider value={props}>
      <PlateEditor
        editorConfig={plateBlockConfig.editorConfig}
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
