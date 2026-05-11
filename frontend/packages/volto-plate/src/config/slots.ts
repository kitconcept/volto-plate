import type { ConfigType } from '@plone/registry';
import { ContentTypeCondition } from '@plone/volto/helpers/Slots';
import { ContentNavigationPortal } from '../components/ContentNavigation/ContentNavigationPortal';

export default function installSlots(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveContent',
    name: 'ContentNavigation',
    component: ContentNavigationPortal,
    predicates: [
      ContentTypeCondition(['WikiPage', 'Workspace']),
      ({ location }) =>
        !location.pathname.endsWith('/edit') &&
        !location.pathname.endsWith('/add'),
    ],
  });

  return config;
}
