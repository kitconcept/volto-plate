import type { ConfigType } from '@plone/registry';
import TextBlockInfo from '../components/blocks/Text';

export default function install(config: ConfigType) {
  config.blocks.blocksConfig.slate = {
    ...config.blocks.blocksConfig.slate,
    ...TextBlockInfo,
  };

  return config;
}
