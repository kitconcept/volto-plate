import type { ConfigType } from '@plone/registry';
import { ContentNavigationPortal } from '../components/ContentNavigation/ContentNavigationPortal';

export default function installSlots(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveContent',
    name: 'ContentNavigation',
    component: ContentNavigationPortal,
  });

  return config;
}
