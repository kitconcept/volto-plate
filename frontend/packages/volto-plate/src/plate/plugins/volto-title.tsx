import { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFormData } from '@plone/volto/actions/form/form';
import { createSlatePlugin, ElementApi, PathApi } from 'platejs';
import {
  PlateElement,
  type PlateElementProps,
  toPlatePlugin,
  useEditorRef,
  useEditorSelector,
} from 'platejs/react';

export const TITLE_BLOCK_TYPE = 'title';
export const TitleMetadataContext = createContext<string | null>(null);

type TitleData = {
  title?: string;
  [key: string]: unknown;
};

const DEFAULT_BLOCK_WIDTH = 'var(--default-container-width)';

const isTitleNode = (node: unknown) =>
  ElementApi.isElement(node) && node.type === TITLE_BLOCK_TYPE;

const getTitleNodeEntry = (nodes: unknown[]) => {
  for (let index = 0; index < nodes.length; index += 1) {
    if (isTitleNode(nodes[index])) {
      return {
        index,
        node: nodes[index],
      };
    }
  }

  return null;
};

const getNodeText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return '';
  if ('text' in node && typeof node.text === 'string') return node.text;
  if (!('children' in node) || !Array.isArray(node.children)) return '';

  return node.children.map((child) => getNodeText(child)).join('');
};

type SyncAction = 'none' | 'store-to-editor' | 'editor-to-store';

export function getTitleSyncAction({
  previousStoreTitle,
  previousEditorTitle,
  storeTitle,
  editorTitle,
}: {
  previousStoreTitle: string;
  previousEditorTitle: string | null;
  storeTitle: string;
  editorTitle: string | null;
}): SyncAction {
  if (editorTitle === null) return 'none';

  const storeChanged = previousStoreTitle !== storeTitle;
  const editorChanged = previousEditorTitle !== editorTitle;
  const titleNodeJustAppeared =
    previousEditorTitle === null && editorTitle !== null;
  const shouldInitializeFromStore =
    titleNodeJustAppeared && editorTitle === '' && storeTitle !== '';

  if (shouldInitializeFromStore) return 'store-to-editor';
  if (storeChanged && editorTitle !== storeTitle) return 'store-to-editor';
  if (editorChanged && !storeChanged && editorTitle !== storeTitle) {
    return 'editor-to-store';
  }

  return 'none';
}

function TitleMetadataSync() {
  const editor = useEditorRef();
  const dispatch = useDispatch();
  const metadataTitle = useContext(TitleMetadataContext);
  const formData = useSelector(
    (state: any) => (state?.form?.global ?? {}) as TitleData,
  );
  const previousEditorTitleRef = useRef<string | null>(null);
  const previousStoreTitleRef = useRef(formData.title ?? '');
  const editorTitle = useEditorSelector((editor) => {
    const titleEntry = getTitleNodeEntry(editor.children as unknown[]);
    return titleEntry ? getNodeText(titleEntry.node) : null;
  }, []);
  const normalizedTitle = metadataTitle ?? formData.title ?? '';

  useEffect(() => {
    const action = getTitleSyncAction({
      previousStoreTitle: previousStoreTitleRef.current,
      previousEditorTitle: previousEditorTitleRef.current,
      storeTitle: normalizedTitle,
      editorTitle,
    });

    if (action === 'store-to-editor') {
      const titleEntry = getTitleNodeEntry(editor.children as unknown[]);
      if (titleEntry) {
        const titlePath = editor.api.findPath(titleEntry.node as any);

        if (!titlePath) {
          previousEditorTitleRef.current = editorTitle;
          previousStoreTitleRef.current = normalizedTitle;
          return;
        }

        editor.tf.replaceNodes(
          {
            ...(titleEntry.node as object),
            children: [{ text: normalizedTitle }],
          },
          { at: titlePath },
        );
      }
    }

    if (action === 'editor-to-store' && editorTitle !== null) {
      dispatch(
        setFormData({
          ...formData,
          title: editorTitle,
        }),
      );
    }

    previousEditorTitleRef.current = editorTitle;
    previousStoreTitleRef.current = normalizedTitle;
  }, [dispatch, editor, editorTitle, formData, normalizedTitle]);

  return null;
}

export function VoltoTitleBlockElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="h1"
      className="documentFirstHeading font-heading mt-[1.6em] pb-1 text-4xl font-bold"
    >
      {props.children}
    </PlateElement>
  );
}

export const BaseVoltoTitleBlockPlugin = createSlatePlugin({
  key: TITLE_BLOCK_TYPE,
  handlers: {
    onKeyDown: ({ editor, event }) => {
      const nativeEvent = (event as any)?.nativeEvent ?? event;
      if (!nativeEvent || nativeEvent.key !== 'Enter') return;
      if (!editor.selection || !editor.api.isCollapsed()) return;

      const currentEntry = editor.api.block({ highest: true });
      if (!currentEntry) return;

      const [currentNode, currentPath] = currentEntry;
      if (
        !ElementApi.isElement(currentNode) ||
        currentNode.type !== TITLE_BLOCK_TYPE
      ) {
        return;
      }

      event.preventDefault();
      editor.tf.insertNodes(
        editor.api.create.block({
          type: 'p',
          children: [{ text: '' }],
        }),
        {
          at: PathApi.next(currentPath as number[]),
          select: true,
        },
      );
    },
  },
  node: {
    component: VoltoTitleBlockElement,
    isElement: true,
    type: TITLE_BLOCK_TYPE,
  },
  options: {
    blockWidth: {
      defaultWidth: DEFAULT_BLOCK_WIDTH,
      widths: [DEFAULT_BLOCK_WIDTH],
    },
  },
  extendEditor: ({ editor }) => {
    const insertBreak = editor.tf.insertBreak;
    const normalizeNode = editor.normalizeNode as (entry: any) => void;

    editor.tf.insertBreak = () => {
      const blockEntry = editor.api.block({ highest: true });
      if (blockEntry) {
        const [node, path] = blockEntry;
        if (ElementApi.isElement(node) && node.type === TITLE_BLOCK_TYPE) {
          editor.tf.insertNodes(
            editor.api.create.block({
              type: 'p',
              children: [{ text: '' }],
            }),
            {
              at: PathApi.next(path),
              select: true,
            },
          );
          return;
        }
      }

      insertBreak();
    };

    editor.normalizeNode = (entry) => {
      const [, path] = entry;

      if (path.length === 0) {
        const titleIndexes = editor.children.reduce<number[]>(
          (acc, child, index) => {
            if (
              ElementApi.isElement(child) &&
              child.type === TITLE_BLOCK_TYPE
            ) {
              acc.push(index);
            }

            return acc;
          },
          [],
        );

        if (titleIndexes.length > 1) {
          titleIndexes
            .slice(1)
            .reverse()
            .forEach((index) => {
              editor.tf.removeNodes({ at: [index] });
            });
          return;
        }
      }

      normalizeNode(entry);
    };

    return editor;
  },
});

export const VoltoTitleBlock = toPlatePlugin(
  BaseVoltoTitleBlockPlugin,
).configure({
  render: {
    afterEditable: TitleMetadataSync,
  },
});
