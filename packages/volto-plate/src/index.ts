import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import '@plone/plate/output.css';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);

  return config;
}

export default applyConfig;
