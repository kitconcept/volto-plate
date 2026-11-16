import React from 'react';
import { useDispatch } from 'react-redux';

import { PlateEditor, type Value } from '@plone/plate/components/editor';
import { translationFromIntl } from '@plone/plate/components/editor/plugins/i18n';
import { setSidebarTab } from '@plone/volto/actions/sidebar/sidebar';
import BodyClass from '@plone/volto/helpers/BodyClass/BodyClass';
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
import { MAIN_REGION, PLATE_TYPE } from '../../constants';
import {
  getPlateRegion,
  migrateSomersaultRegion,
} from '../../helpers/plateRegion';
import { ErrorBoundary } from '../Blocks/ErrorBoundary';

const getDefaultPlateValue = (title = ''): Value => [
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
    blocks_layout?: { items?: string[]; [key: string]: unknown };
    [key: string]: unknown;
  };
  intl?: Parameters<typeof translationFromIntl>[0];
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
  // Adapts Volto's react-intl `intl` to Plate's react-i18next style contract.
  const translation = React.useMemo(
    () => (intl ? translationFromIntl(intl) : undefined),
    [intl],
  );
  const dispatch = useDispatch();
  // Reads the `main` region, or the legacy `__somersault__` block of content
  // not migrated yet. The first change saves it as `main`.
  const plateRegion = getPlateRegion<{ value?: Value; [key: string]: unknown }>(
    content?.blocks,
  );
  const metadataTitle = content?.title ?? '';
  const stableInitialValueRef = React.useRef<Value | null>(null);
  const latestValueRef = React.useRef<Value>([]);
  const latestDiscussionsRef = React.useRef(
    normalizeDiscussions(
      plateRegion?.discussions as Record<string, unknown> | undefined,
    ),
  );
  const latestContentRef = React.useRef(content);
  const latestOnChangeFormDataRef = React.useRef(onChangeFormData);

  React.useEffect(() => {
    latestContentRef.current = content;
    latestOnChangeFormDataRef.current = onChangeFormData;
  }, [content, onChangeFormData]);

  // Start on the Document tab; the sidebar plugin then picks the tab for
  // each block the selection moves to.
  React.useEffect(() => {
    dispatch(setSidebarTab(0));
  }, [dispatch]);

  if (!stableInitialValueRef.current) {
    const plateValue = plateRegion?.value;

    stableInitialValueRef.current = plateValue?.length
      ? plateValue
      : getDefaultPlateValue(metadataTitle);
  }

  if (latestValueRef.current.length === 0) {
    latestValueRef.current = stableInitialValueRef.current;
  }

  const initialDiscussions = React.useMemo(
    () =>
      normalizeDiscussions(
        plateRegion?.discussions as Record<string, unknown> | undefined,
      ),
    [plateRegion?.discussions],
  );
  const initialUsers = React.useMemo(
    () =>
      normalizeUsers(
        plateRegion?.users as
          | Record<string, { id: string; fullname?: string; portrait?: string }>
          | undefined,
      ),
    [plateRegion?.users],
  );

  const persistPlateRegion = React.useCallback(
    ({
      discussions = latestDiscussionsRef.current,
      value = latestValueRef.current,
    }: {
      discussions?: ReturnType<typeof normalizeDiscussions>;
      value?: Value;
    }) => {
      const currentContent = latestContentRef.current;
      // Content stored before the `main` region is renamed on the first save.
      const { blocks, blocksLayout } = migrateSomersaultRegion(
        currentContent?.blocks ?? {},
        currentContent?.blocks_layout,
      );

      latestOnChangeFormDataRef.current?.({
        blocks: {
          ...blocks,
          [MAIN_REGION]: {
            ...(blocks[MAIN_REGION] ?? {}),
            '@type': PLATE_TYPE,
            discussions: serializeDiscussions(discussions),
            value,
          },
        },
        ...(blocksLayout !== currentContent?.blocks_layout && {
          blocks_layout: blocksLayout,
        }),
      });
    },
    [],
  );

  React.useEffect(() => {
    latestDiscussionsRef.current = initialDiscussions;
  }, [initialDiscussions]);

  return (
    <ErrorBoundary isEdit type="plate editor">
      <BodyClass className="plate-editor" />
      <TitleMetadataContext.Provider value={metadataTitle}>
        {/* Hydrate Plate from persisted block discussions/users, then persist
            discussion changes back into the `main` region on edit. */}
        <PlatePluginsProvider
          initialDiscussions={initialDiscussions}
          initialUsers={initialUsers}
          onDiscussionsChange={(discussions) => {
            latestDiscussionsRef.current = discussions;
            persistPlateRegion({ discussions });
          }}
        >
          <PlateEditor
            editorConfig={wikiEditorPreset}
            value={stableInitialValueRef.current}
            t={translation?.t}
            language={translation?.language}
            className="typeset"
            onChange={(options) => {
              latestValueRef.current = options.value as Value;
              persistPlateRegion({
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
