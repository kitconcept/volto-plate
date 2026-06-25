import type { ConfigType } from '@plone/registry';
import { ContentTypeCondition } from '@plone/volto/helpers/Slots';
import { NavigationSidebarPortal } from '../components/NavigationSidebar/NavigationSidebarPortal';
import { NavigationTreePortal } from '../components/NavigationTree/NavigationTreePortal';

export default function installSlots(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveContent',
    name: 'NavigationSidebar',
    component: NavigationSidebarPortal,
    predicates: [
      ContentTypeCondition(['WikiPage', 'Workspace']),
      ({ location }) =>
        !location.pathname.endsWith('/edit') &&
        !location.pathname.endsWith('/add'),
    ],
  });

  config.registerSlotComponent({
    slot: 'aboveContent',
    name: 'NavigationTree',
    component: NavigationTreePortal,
    predicates: [
      ({ location }) =>
        !location.pathname.endsWith('/edit') &&
        !location.pathname.endsWith('/add'),
    ],
  });

  return config;
}
