import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import './theme/tailwind.css';

export {
  VoltoImageBlockElement,
  VoltoImageBlockPlugin,
} from './plate/plugins/volto-image-block';
export { createVoltoBlockAdapter } from './plate/plugins/volto-block-adapter';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);

  return config;
}

export default applyConfig;
