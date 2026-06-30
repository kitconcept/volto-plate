import type { ConfigType } from '@plone/registry';
import { NavigationTreePortal } from '../components/NavigationTree/NavigationTreePortal';

export default function installSlots(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveContent',
    name: 'NavigationTree',
    component: NavigationTreePortal,
  });

  return config;
}
