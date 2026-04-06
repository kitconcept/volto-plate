import * as React from 'react';

import type { PlateEditor } from 'platejs/react';

import config from '@plone/registry';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import {
  getBlocksApi,
  splitEditorAtCursor,
} from '@plone/plate/components/editor/plugins/split-utils';
import type {
  SlashMenuConfig,
  SlashMenuGroup,
  SlashMenuItem,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { PlusSquareIcon, Square, SquareSplitVertical } from 'lucide-react';

import { TITLE_BLOCK_TYPE } from '../plugins/volto-title';

const filteredBlocksConfig = (blocksConfig: Record<string, any>) =>
  Object.entries(blocksConfig ?? {}).filter(([, block]) => {
    const blockIsWellFormed = Boolean(block?.title && block?.id);
    if (!blockIsWellFormed) return false;
    if (typeof block?.restricted === 'boolean' && block.restricted) {
      return false;
    }
    return true;
  });

const insertItemsAfter = (
  groups: SlashMenuGroup[],
  groupName: string,
  afterValue: string,
  items: SlashMenuItem[],
) =>
  groups.map((group) => {
    if (group.group !== groupName) return group;

    const index = group.items.findIndex((item) => item.value === afterValue);
    if (index === -1) return group;

    const nextItems = items.filter(
      (item) => !group.items.some((existing) => existing.value === item.value),
    );

    return {
      ...group,
      items: [
        ...group.items.slice(0, index + 1),
        ...nextItems,
        ...group.items.slice(index + 1),
      ],
    };
  });

const buildVoltoBlocksGroup = (
  translate?: (id: string) => string,
): SlashMenuGroup[] => {
  const blocksConfig = config?.blocks?.blocksConfig;
  if (!blocksConfig) return [];

  const items = filteredBlocksConfig(blocksConfig).map(([id, block]: any) => {
    const label =
      typeof block.title === 'string'
        ? block.title
        : typeof block.title?.id === 'string'
          ? translate?.(block.title.id) ??
            block.title.defaultMessage ??
            block.title.id
          : String(block.title);
    const icon = block.icon ? (
      <Icon name={block.icon} size="16px" />
    ) : (
      <Square />
    );

    return {
      icon,
      keywords: [id, label?.toString()?.toLowerCase?.()].filter(Boolean),
      label,
      value: `volto_${id}`,
      onSelect: (editor: PlateEditor) => {
        const api = getBlocksApi(editor);
        if (!api?.onInsertBlock) return;

        setTimeout(() => {
          const newId = api.onInsertBlock(api.id, { '@type': id });
          api.onSelectBlock?.(newId ?? api.id);
        }, 0);
      },
    };
  });

  return items.length ? [{ group: 'Volto Blocks', items }] : [];
};

export const slashMenu: SlashMenuConfig = {
  extendGroups: (groups, editor, context) => {
    const nextGroups = groups
      .map((group) => {
        if (group.group === 'Text blocks') {
          return {
            ...group,
            group: 'Basic blocks',
            items: group.items.filter(
              (item) => item.value !== TITLE_BLOCK_TYPE,
            ),
          };
        }

        if (group.group === 'Blocks') {
          return null;
        }

        return group;
      })
      .filter(Boolean) as SlashMenuGroup[];

    const withNewBlock = insertItemsAfter(nextGroups, 'Actions', 'AI', [
      {
        focusEditor: true,
        icon: <PlusSquareIcon />,
        keywords: ['block', 'add', 'insert'],
        label: 'New block',
        value: 'action_new_block',
        onSelect: (nextEditor) => {
          const api = getBlocksApi(nextEditor);
          if (!api?.onInsertBlock) return;

          setTimeout(() => {
            const newId = api.onInsertBlock(api.id, { '@type': 'slate' });
            api.onSelectBlock?.(newId ?? api.id);
          }, 0);
        },
      },
    ]);

    const withSplit = insertItemsAfter(
      withNewBlock,
      'Actions',
      'action_new_block',
      [
        {
          icon: <SquareSplitVertical />,
          keywords: ['split', 'divide', 'new block'],
          label: 'Split editor here',
          value: 'action_split_editor',
          onSelect: () => {
            splitEditorAtCursor(editor);
          },
        },
      ],
    );

    return [...withSplit, ...buildVoltoBlocksGroup(context.translate)];
  },
};
