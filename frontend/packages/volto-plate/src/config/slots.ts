import type { ConfigType } from '@plone/registry';
import { ContentNavigation } from '../components/ContentNavigation/ContentNavigation';

export default function installSlots(config: ConfigType) {
  config.registerSlotComponent({
    slot: 'aboveContent',
    name: 'ContentNavigation',
    component: ContentNavigation,
  });

  return config;
}
