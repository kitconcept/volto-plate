import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import installSlots from './config/slots';
import './theme/tailwind.css';
import '@plone/components/dist/basic.css';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);
  installSlots(config);

  return config;
}

export default applyConfig;
