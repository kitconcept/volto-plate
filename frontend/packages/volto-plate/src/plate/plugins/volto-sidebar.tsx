import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  BlockSelectionPlugin,
  createPlatePlugin,
  ElementApi,
  useEditorRef,
  useEditorSelector,
} from '@plone/plate/components/editor';
import { BlockDataForm } from '@plone/volto/components/manage/Form';
import config from '@plone/volto/registry';
import type { BlockConfigBase } from '@plone/types';
import { KEYS } from 'platejs';
import { useEditorSelection } from 'platejs/react';
import { useIntl } from 'react-intl';

type SelectedNativeBlock = {
  key: string;
  path: number[];
  data: Record<string, unknown> & { '@type': string };
};

const getVoltoBlockConfig = (
  blockType: string,
): BlockConfigBase | undefined => {
  const entry = (
    config.blocks.blocksConfig as unknown as Record<string, BlockConfigBase>
  )?.[blockType];
  if (entry?.blockSchema) return entry;

  const plateEntry = (
    config.blocks.plateBlocksConfig as unknown as Record<
      string,
      Partial<BlockConfigBase>
    >
  )?.[blockType];
  if (plateEntry?.blockSchema)
    return { ...entry, ...plateEntry } as BlockConfigBase;

  return entry;
};

const getVoltoBlockType = (node: unknown): string | null => {
  if (!ElementApi.isElement(node)) return null;

  const explicitBlockType = node['@type'];
  if (typeof explicitBlockType === 'string') return explicitBlockType;

  // Volto-backed Plate image nodes still use the native Plate image type.
  if (node.type === KEYS.img) return 'plateimage';

  return null;
};

const isVoltoSidebarElement = (node: unknown) => {
  const blockType = getVoltoBlockType(node);
  if (!blockType) return false;

  const blockConfig = getVoltoBlockConfig(blockType);

  return Boolean(blockConfig?.blockSchema);
};

const getUnknownFromBlockSelection = (editor: any): [any, number[]] | null => {
  const entries =
    editor
      .getApi(BlockSelectionPlugin)
      ?.blockSelection?.getNodes?.({ selectionFallback: true, sort: true }) ??
    [];

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const [node, path] = entries[index];
    if (isVoltoSidebarElement(node)) return [node, path];
  }

  return null;
};

const getUnknownFromActiveElement = (editor: any): [any, number[]] | null => {
  if (typeof document === 'undefined') return null;

  const activeElement = document.activeElement as HTMLElement | null;
  const blockElement = activeElement?.closest?.('[data-slate-node="element"]');
  if (!blockElement) return null;

  try {
    const node = editor.api.toSlateNode(blockElement);
    if (!isVoltoSidebarElement(node)) return null;
    const path = editor.api.findPath(node);
    return path ? [node, path] : null;
  } catch {
    return null;
  }
};

const getVoltoBlockFromSelection = (editor: any): [any, number[]] | null => {
  const selectionPath =
    editor.selection?.anchor?.path ?? editor.selection?.focus?.path;

  if (!Array.isArray(selectionPath) || selectionPath.length === 0) return null;

  for (let depth = selectionPath.length; depth > 0; depth -= 1) {
    const candidatePath = selectionPath.slice(0, depth);
    const candidateEntry = editor.api.node(candidatePath);
    if (!candidateEntry) continue;

    const [node] = candidateEntry;
    if (isVoltoSidebarElement(node)) return [node, candidatePath];
  }

  return null;
};

const getSelectedNativeBlock = (editor: any): SelectedNativeBlock | null => {
  const entry =
    getUnknownFromBlockSelection(editor) ??
    getUnknownFromActiveElement(editor) ??
    getVoltoBlockFromSelection(editor) ??
    editor.api.block({ highest: true });
  if (!entry) return null;

  const [node, path] = entry;
  if (!isVoltoSidebarElement(node)) return null;

  const blockType = getVoltoBlockType(node);
  if (!blockType) return null;

  const blockConfig = getVoltoBlockConfig(blockType);
  if (!blockConfig?.blockSchema) return null;

  const data = { ...node } as Record<string, unknown>;
  delete data.id;
  delete data.type;
  delete data.children;

  return {
    key: path.join('-'),
    path,
    data: {
      ...data,
      '@type': blockType,
    },
  };
};

export function SidebarAfterEditable() {
  const editor = useEditorRef();
  // Keep this component subscribed to editor selection/tree updates even
  // though the actual lookup reads from the mutable editor instance.
  useEditorSelection();
  useEditorSelector((currentEditor) => currentEditor.children, []);
  const intl = useIntl();
  const selectedNativeBlock = getSelectedNativeBlock(editor);
  const blocksConfig = config.blocks.blocksConfig;

  const schema = React.useMemo(() => {
    if (!selectedNativeBlock) return null;

    const blockSchema = getVoltoBlockConfig(
      selectedNativeBlock.data['@type'],
    )?.blockSchema;

    if (!blockSchema) return null;

    return typeof blockSchema === 'function'
      ? blockSchema({
          intl,
          formData: selectedNativeBlock.data,
        })
      : blockSchema;
  }, [intl, selectedNativeBlock]);

  const onFormDataChange = React.useCallback(
    (next: Record<string, unknown>) => {
      if (!selectedNativeBlock) return;
      const patch = { ...next };
      delete patch.id;
      delete patch.type;
      delete patch.children;
      editor.tf.setNodes(patch as any, { at: selectedNativeBlock.path });
    },
    [editor, selectedNativeBlock],
  );

  const sidebar =
    typeof document === 'undefined'
      ? null
      : document.getElementById('sidebar-properties') ??
        document.getElementById('sidebar');
  if (!sidebar) return null;
  if (!selectedNativeBlock) return null;
  if (!schema) return null;

  return createPortal(
    <BlockDataForm
      key={selectedNativeBlock.key}
      block={selectedNativeBlock.key}
      schema={schema}
      title={schema.title}
      formData={selectedNativeBlock.data}
      blocksConfig={blocksConfig}
      onChangeBlock={(_block: string, next: Record<string, unknown>) =>
        onFormDataChange(next)
      }
      onChangeField={(id: string, value: unknown) =>
        onFormDataChange({
          ...selectedNativeBlock.data,
          [id]: value,
        })
      }
    />,
    sidebar,
  );
}

export const SidebarPlugin = createPlatePlugin({
  key: 'cmsui-sidebar',
  render: {
    afterEditable: SidebarAfterEditable,
  },
});
