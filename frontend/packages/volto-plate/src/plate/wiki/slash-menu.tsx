import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';

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

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};
