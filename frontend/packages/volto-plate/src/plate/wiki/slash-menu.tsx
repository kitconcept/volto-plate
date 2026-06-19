import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { insertBlock } from '@plone/plate/components/editor/transforms';
import { ImageIcon } from 'lucide-react';
import { KEYS } from 'platejs';

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
            items: group.items.some((item) => item.value === KEYS.img)
              ? group.items
              : [
                  ...group.items,
                  {
                    icon: <ImageIcon />,
                    keywords: ['image', 'media', 'photo', 'picture'],
                    label: 'Image',
                    value: KEYS.img,
                    onSelect: (editor) => {
                      insertBlock(editor, KEYS.img);
                    },
                  },
                ],
          };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};
