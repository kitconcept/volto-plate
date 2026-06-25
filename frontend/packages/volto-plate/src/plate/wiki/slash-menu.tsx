import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { ImageIcon } from 'lucide-react';
import { PathApi } from 'platejs';
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

        if (group.group === 'Text blocks') {
          return {
            ...group,
            items: group.items.some((item) => item.value === 'block_plateimage')
              ? group.items
              : [
                  ...group.items,
                  {
                    icon: <ImageIcon />,
                    keywords: ['image', 'media', 'photo', 'picture'],
                    label: 'Image',
                    value: 'block_plateimage',
                    onSelect: (editor) => {
                      insertPloneBlock(editor, 'plateimage');
                    },
                  },
                ],
          };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};
