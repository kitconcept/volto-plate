import type {
  SlashMenuConfig,
  SlashMenuGroup,
  SlashMenuItem,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { insertBlock } from '@plone/plate/components/editor/transforms';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { Heading5Icon, Heading6Icon, ImageIcon } from 'lucide-react';
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

const HEADING_SLASH_ITEMS: SlashMenuItem[] = [
  {
    icon: <Heading5Icon />,
    keywords: ['subtitle', 'h5'],
    label: 'Heading 5',
    value: KEYS.h5,
  },
  {
    icon: <Heading6Icon />,
    keywords: ['subtitle', 'h6'],
    label: 'Heading 6',
    value: KEYS.h6,
  },
].map((item) => ({
  ...item,
  onSelect: (editor: PlateEditor, value: string) => {
    insertBlock(editor, value);
  },
}));

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
          if (
            group.items.some((item) => item.value === IMAGE_SLASH_ITEM.value)
          ) {
            return group;
          }

          const paragraphIndex = group.items.findIndex(
            (item) => item.value === 'p',
          );

          const items =
            paragraphIndex === -1
              ? [...group.items, IMAGE_SLASH_ITEM]
              : [
                  ...group.items.slice(0, paragraphIndex + 1),
                  IMAGE_SLASH_ITEM,
                  ...group.items.slice(paragraphIndex + 1),
                ];

          const lastHeadingIndex = items.findIndex(
            (item) => item.value === KEYS.h4,
          );

          return {
            ...group,
            items: [
              ...items.slice(0, lastHeadingIndex + 1),
              ...HEADING_SLASH_ITEMS,
              ...items.slice(lastHeadingIndex + 1),
            ],
          };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};
