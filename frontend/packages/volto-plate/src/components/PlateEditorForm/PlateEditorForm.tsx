import React from 'react';

import { PlateEditor, type Value } from '@plone/plate/components/editor';
import wikiEditorPreset from '../../plate/presets/wiki-editor';
import { TITLE_BLOCK_TYPE } from '../../plate/plugins/volto-title';

const SOMERSAULT_KEY = '__somersault__';

const getDefaultSomersaultValue = (title = ''): Value => [
  {
    type: TITLE_BLOCK_TYPE,
    children: [{ text: title }],
  },
  {
    type: 'p',
    children: [{ text: '' }],
  },
];

type PlateEditorFormProps = {
  content?: {
    title?: string;
    blocks?: Record<string, { value?: Value; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  intl?: unknown;
  onChangeFormData?: (data: Record<string, unknown>) => void;
};

const PlateEditorForm = (props: PlateEditorFormProps) => {
  const { content, intl, onChangeFormData } = props;
  const somersaultBlock = content?.blocks?.[SOMERSAULT_KEY];
  const metadataTitle = content?.title ?? '';
  const stableInitialValueRef = React.useRef<Value | null>(null);

  if (!stableInitialValueRef.current) {
    stableInitialValueRef.current =
      (((somersaultBlock as any)?.value as Value | undefined) ?? []).length > 0
        ? ((somersaultBlock as any).value as Value)
        : getDefaultSomersaultValue(metadataTitle);
  }

  return (
    <PlateEditor
      editorConfig={wikiEditorPreset}
      value={stableInitialValueRef.current}
      intl={intl}
      onChange={(options) => {
        onChangeFormData?.({
          blocks: {
            ...(content?.blocks ?? {}),
            [SOMERSAULT_KEY]: {
              ...(somersaultBlock ?? {}),
              '@type': SOMERSAULT_KEY,
              value: options.value as Value,
            },
          },
        });
      }}
    />
  );
};

export default PlateEditorForm;
