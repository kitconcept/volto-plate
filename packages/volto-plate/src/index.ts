import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import '@plone/plate/output.css';
export { useStablePlateValue } from './hooks/use-stable-plate-value';
export {
  VoltoImageElement,
  VoltoImagePlugin,
} from './plate/plugins/volto-media-kit';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);

  return config;
}

export default applyConfig;
