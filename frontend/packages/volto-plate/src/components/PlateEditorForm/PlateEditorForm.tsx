import React from 'react';
import { useDispatch } from 'react-redux';

import { PlateEditor, type Value } from '@plone/plate/components/editor';
import { setSidebarTab } from '@plone/volto/actions/sidebar/sidebar';
import { useEditorRef } from 'platejs/react';
import wikiEditorPreset from '../../plate/presets/wiki-editor';
import {
  normalizeDiscussions,
  normalizeUsers,
  serializeDiscussions,
} from '../../plate/discussion-data';
import { PlatePluginsProvider } from '../../plate/context/PlatePluginsProvider';
import {
  TITLE_BLOCK_TYPE,
  TitleMetadataContext,
} from '../../plate/plugins/volto-title';
import { SOMERSAULT_KEY } from '../../constants';
import { ErrorBoundary } from '../Blocks/ErrorBoundary';

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
  const dispatch = useDispatch();
  const somersaultBlock = content?.blocks?.[SOMERSAULT_KEY];
  const metadataTitle = content?.title ?? '';
  const stableInitialValueRef = React.useRef<Value | null>(null);
  const latestValueRef = React.useRef<Value>([]);
  const latestDiscussionsRef = React.useRef(
    normalizeDiscussions(
      somersaultBlock?.discussions as Record<string, unknown> | undefined,
    ),
  );
  const latestContentRef = React.useRef(content);
  const latestOnChangeFormDataRef = React.useRef(onChangeFormData);

  React.useEffect(() => {
    latestContentRef.current = content;
    latestOnChangeFormDataRef.current = onChangeFormData;
  }, [content, onChangeFormData]);

  React.useEffect(() => {
    dispatch(setSidebarTab(1));
  }, [dispatch]);

  if (!stableInitialValueRef.current) {
    const somersaultValue = somersaultBlock?.value;

    stableInitialValueRef.current = somersaultValue?.length
      ? somersaultValue
      : getDefaultSomersaultValue(metadataTitle);
  }

  if (latestValueRef.current.length === 0) {
    latestValueRef.current = stableInitialValueRef.current;
  }

  const initialDiscussions = React.useMemo(
    () =>
      normalizeDiscussions(
        somersaultBlock?.discussions as Record<string, unknown> | undefined,
      ),
    [somersaultBlock?.discussions],
  );
  const initialUsers = React.useMemo(
    () =>
      normalizeUsers(
        somersaultBlock?.users as
          | Record<string, { id: string; fullname?: string; portrait?: string }>
          | undefined,
      ),
    [somersaultBlock?.users],
  );

  const persistSomersaultBlock = React.useCallback(
    ({
      discussions = latestDiscussionsRef.current,
      value = latestValueRef.current,
    }: {
      discussions?: ReturnType<typeof normalizeDiscussions>;
      value?: Value;
    }) => {
      const currentContent = latestContentRef.current;
      const currentSomersaultBlock = currentContent?.blocks?.[SOMERSAULT_KEY];

      latestOnChangeFormDataRef.current?.({
        blocks: {
          ...(currentContent?.blocks ?? {}),
          [SOMERSAULT_KEY]: {
            ...(currentSomersaultBlock ?? {}),
            '@type': SOMERSAULT_KEY,
            discussions: serializeDiscussions(discussions),
            value,
          },
        },
      });
    },
    [],
  );

  React.useEffect(() => {
    latestDiscussionsRef.current = initialDiscussions;
  }, [initialDiscussions]);

  return (
    <ErrorBoundary isEdit type="plate editor">
      <TitleMetadataContext.Provider value={metadataTitle}>
        {/* Hydrate Plate from persisted block discussions/users, then persist
            discussion changes back into the somersault block on edit. */}
        <PlatePluginsProvider
          initialDiscussions={initialDiscussions}
          initialUsers={initialUsers}
          onDiscussionsChange={(discussions) => {
            latestDiscussionsRef.current = discussions;
            persistSomersaultBlock({ discussions });
          }}
        >
          <PlateEditor
            editorConfig={wikiEditorPreset}
            value={stableInitialValueRef.current}
            intl={intl}
            className="typeset"
            onChange={(options) => {
              latestValueRef.current = options.value as Value;
              persistSomersaultBlock({
                discussions: latestDiscussionsRef.current,
                value: options.value as Value,
              });
            }}
          >
            <InitialEditorFocus />
          </PlateEditor>
        </PlatePluginsProvider>
      </TitleMetadataContext.Provider>
    </ErrorBoundary>
  );
};

export default PlateEditorForm;
