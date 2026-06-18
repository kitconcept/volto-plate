import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { insertBlock } from '@plone/plate/components/editor/transforms';
import type { PlateEditor } from 'platejs/react';
import { KEYS } from 'platejs';

const insertPlateImage = (editor: PlateEditor) => {
  insertBlock(editor, KEYS.img);

  const block = editor.api.block();
  if (!block || block[0].type !== KEYS.img) return;

  editor.tf.setNodes({ '@type': 'plateimage' } as any, {
    at: block[1],
  });
};

export const slashMenu: SlashMenuConfig = {
  extendGroups: (groups) =>
    groups
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

        if (group.group === 'Media') {
          return {
            ...group,
            items: group.items.map((item) =>
              item.value === KEYS.img
                ? {
                    ...item,
                    onSelect: (editor) => {
                      insertPlateImage(editor);
                    },
                  }
                : item,
            ),
          };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};
