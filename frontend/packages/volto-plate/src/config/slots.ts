import type { ConfigType } from '@plone/registry';
import { NavigationTreePortal } from '../components/NavigationTree/NavigationTreePortal';

export default function installSlots(config: ConfigType) {
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
