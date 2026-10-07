import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { CODE_DRAWING_KEY, insertCodeDrawing } from '@platejs/code-drawing';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { ImageIcon, WorkflowIcon } from 'lucide-react';
import { KEYS, PathApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';

const insertPloneBlock = (editor: PlateEditor, blockType: string) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;

    editor.tf.insertNodes(
      editor.api.create.block({
        type: PLONE_BLOCK_TYPE,
        '@type': blockType,
      }),
      {
        at: PathApi.next(block[1]),
        select: true,
      },
    );

    if (block[0].type !== PLONE_BLOCK_TYPE) {
      editor.tf.removeNodes({ previousEmptyBlock: true });
    }
  });
};

const IMAGE_SLASH_ITEM = {
  icon: <ImageIcon />,
  keywords: ['image', 'media', 'photo', 'picture'],
  label: 'Image',
  value: 'block_plateimage',
  onSelect: (editor: PlateEditor) => {
    insertPloneBlock(editor, 'plateimage');
  },
};

const insertDiagram = (editor: PlateEditor) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;

    insertCodeDrawing(
      editor,
      {},
      { at: PathApi.next(block[1]), nextBlock: false, select: true },
    );

    if (block[0].type !== CODE_DRAWING_KEY) {
      editor.tf.removeNodes({ previousEmptyBlock: true });
    }
  });
};

const DIAGRAM_SLASH_ITEM = {
  icon: <WorkflowIcon />,
  keywords: ['diagram', 'drawing', 'mermaid', 'plantuml', 'graphviz', 'chart'],
  label: 'Diagram',
  value: CODE_DRAWING_KEY,
  onSelect: insertDiagram,
};

export const slashMenu: SlashMenuConfig = {
  extendGroups: (groups) =>
    groups
      // The toggle plugin is not part of the wiki editor preset.
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.value !== KEYS.toggle),
      }))
      .map((group) => {
        if (group.group === 'Actions') {
          return {
            ...group,
            items: group.items.filter((item) => item.value !== 'AI'),
          };
        }

        if (group.group === 'Blocks') {
          return null;
        }

        if (group.group === 'Text blocks') {
          if (
            group.items.some((item) => item.value === IMAGE_SLASH_ITEM.value)
          ) {
            return group;
          }

          const paragraphIndex = group.items.findIndex(
            (item) => item.value === 'p',
          );

          return {
            ...group,
            items:
              paragraphIndex === -1
                ? [...group.items, IMAGE_SLASH_ITEM]
                : [
                    ...group.items.slice(0, paragraphIndex + 1),
                    IMAGE_SLASH_ITEM,
                    ...group.items.slice(paragraphIndex + 1),
                  ],
          };
        }

        if (
          group.group === 'Advanced blocks' &&
          !group.items.some((item) => item.value === DIAGRAM_SLASH_ITEM.value)
        ) {
          return { ...group, items: [...group.items, DIAGRAM_SLASH_ITEM] };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};
