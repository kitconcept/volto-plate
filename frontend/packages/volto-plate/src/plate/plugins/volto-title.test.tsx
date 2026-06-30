import { describe, expect, it, vi } from 'vitest';

import {
  TITLE_BLOCK_TYPE,
  BaseVoltoTitleBlockPlugin,
  VoltoTitleBlockElement,
  getTitleSyncAction,
} from './volto-title';

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: () => ({}),
}));

vi.mock('@plone/volto/actions/form/form', () => ({
  setFormData: (payload: unknown) => payload,
}));

vi.mock('platejs/react', async () => {
  const actual =
    await vi.importActual<typeof import('platejs/react')>('platejs/react');

  return {
    ...actual,
    useEditorRef: () => ({
      api: {
        block: () => null,
        create: {
          block: ({ type, children }: any) => ({ type, children }),
        },
        findPath: () => [0],
        isCollapsed: () => true,
      },
      children: [],
      normalizeNode: vi.fn(),
      tf: {
        insertBreak: vi.fn(),
        insertNodes: vi.fn(),
        removeNodes: vi.fn(),
        replaceNodes: vi.fn(),
      },
    }),
    useEditorSelector: () => null,
  };
});

describe('volto title block plugin', () => {
  it('exposes the expected title block type key', () => {
    expect(TITLE_BLOCK_TYPE).toBe('title');
    expect(BaseVoltoTitleBlockPlugin.key).toBe(TITLE_BLOCK_TYPE);
    expect(BaseVoltoTitleBlockPlugin.options.blockWidth).toBeUndefined();
  });

  describe('sync direction', () => {
    it('returns none when no title block exists in editor', () => {
      expect(
        getTitleSyncAction({
          previousStoreTitle: 'Metadata title',
          previousEditorTitle: null,
          storeTitle: 'Metadata title',
          editorTitle: null,
        }),
      ).toBe('none');
    });

    it('initializes a new empty title block from existing metadata title', () => {
      expect(
        getTitleSyncAction({
          previousStoreTitle: 'Metadata title',
          previousEditorTitle: null,
          storeTitle: 'Metadata title',
          editorTitle: '',
        }),
      ).toBe('store-to-editor');
    });

    it('syncs metadata form updates into the title block', () => {
      expect(
        getTitleSyncAction({
          previousStoreTitle: 'Old metadata title',
          previousEditorTitle: 'Old metadata title',
          storeTitle: 'Updated metadata title',
          editorTitle: 'Old metadata title',
        }),
      ).toBe('store-to-editor');
    });

    it('syncs title block typing back into metadata', () => {
      expect(
        getTitleSyncAction({
          previousStoreTitle: 'Old title',
          previousEditorTitle: 'Old title',
          storeTitle: 'Old title',
          editorTitle: 'Typed in editor',
        }),
      ).toBe('editor-to-store');
    });
  });

  describe('keyboard restrictions', () => {
    it('prevents formatting hotkeys inside the title block', () => {
      const preventDefault = vi.fn();
      const titleNode = {
        type: TITLE_BLOCK_TYPE,
        children: [{ text: 'Existing title' }],
      };
      const editor = {
        api: {
          block: () => [titleNode, [0]],
          isCollapsed: () => false,
        },
        selection: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 5 },
        },
        tf: {
          insertNodes: vi.fn(),
        },
      };

      BaseVoltoTitleBlockPlugin.handlers.onKeyDown?.({
        editor,
        event: {
          key: 'b',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
          preventDefault,
        },
      } as any);

      expect(preventDefault).toHaveBeenCalledOnce();
      expect(editor.tf.insertNodes).not.toHaveBeenCalled();
    });
  });

  describe('placeholder rendering', () => {
    it('renders a local placeholder when the title is empty', () => {
      const element = VoltoTitleBlockElement({
        attributes: {},
        children: null,
        element: {
          type: TITLE_BLOCK_TYPE,
          children: [{ text: '' }],
        } as any,
      } as any);

      expect(element.props.children.type.name).toBe('BlockInnerContainer');

      const children = Array.isArray(element.props.children.props.children)
        ? element.props.children.props.children
        : [element.props.children.props.children];
      const placeholder = children.find(
        (child: any) => child?.props?.['aria-hidden'] === 'true',
      );

      expect(placeholder?.props?.children).toBe('Type the title...');
    });

    it('does not render the local placeholder when the title has content', () => {
      const element = VoltoTitleBlockElement({
        attributes: {},
        children: null,
        element: {
          type: TITLE_BLOCK_TYPE,
          children: [{ text: 'Existing title' }],
        } as any,
      } as any);

      const children = Array.isArray(element.props.children.props.children)
        ? element.props.children.props.children
        : [element.props.children.props.children];
      const placeholder = children.find(
        (child: any) => child?.props?.['aria-hidden'] === 'true',
      );

      expect(placeholder).toBeUndefined();
    });
  });
});
