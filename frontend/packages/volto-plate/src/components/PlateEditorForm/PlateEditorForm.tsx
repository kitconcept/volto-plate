import React from 'react';

import { PlateEditor, type Value } from '@plone/plate/components/editor';
import { useEditorRef } from 'platejs/react';
import wikiEditorPreset from '../../plate/presets/wiki-editor';
import {
  TITLE_BLOCK_TYPE,
  TitleMetadataContext,
} from '../../plate/plugins/volto-title';
import { SOMERSAULT_KEY } from '../../constants';

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

function InitialEditorFocus() {
  const editor = useEditorRef();
  const hasFocusedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasFocusedRef.current) return;

    hasFocusedRef.current = true;

    const frameId = window.requestAnimationFrame(() => {
      editor.tf.focus({ edge: 'start' });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [editor]);

  return null;
}

const PlateEditorForm = (props: PlateEditorFormProps) => {
  const { content, intl, onChangeFormData } = props;
  const somersaultBlock = content?.blocks?.[SOMERSAULT_KEY];
  const metadataTitle = content?.title ?? '';
  const stableInitialValueRef = React.useRef<Value | null>(null);
  const latestContentRef = React.useRef(content);
  const latestOnChangeFormDataRef = React.useRef(onChangeFormData);

  React.useEffect(() => {
    latestContentRef.current = content;
    latestOnChangeFormDataRef.current = onChangeFormData;
  }, [content, onChangeFormData]);

  if (!stableInitialValueRef.current) {
    const somersaultValue = somersaultBlock?.value;

    stableInitialValueRef.current = somersaultValue?.length
      ? somersaultValue
      : getDefaultSomersaultValue(metadataTitle);
  }

  return (
    <TitleMetadataContext.Provider value={metadataTitle}>
      <PlateEditor
        editorConfig={wikiEditorPreset}
        value={stableInitialValueRef.current}
        intl={intl}
        onChange={(options) => {
          const currentContent = latestContentRef.current;
          const currentSomersaultBlock =
            currentContent?.blocks?.[SOMERSAULT_KEY];

          latestOnChangeFormDataRef.current?.({
            blocks: {
              ...(currentContent?.blocks ?? {}),
              [SOMERSAULT_KEY]: {
                ...(currentSomersaultBlock ?? {}),
                '@type': SOMERSAULT_KEY,
                value: options.value as Value,
              },
            },
          });
        }}
      >
        <InitialEditorFocus />
      </PlateEditor>
    </TitleMetadataContext.Provider>
  );
};

export default PlateEditorForm;
