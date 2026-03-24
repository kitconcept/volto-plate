import type { ConfigType } from '@plone/registry';
import TextBlockInfo from '../components/blocks/Text';

export default function install(config: ConfigType) {
  config.blocks.blocksConfig.plate = {
    ...config.blocks.blocksConfig.slate,
    ...TextBlockInfo,
    id: 'plate',
    title: 'Plate',
  };
  delete config.blocks.blocksConfig.plate.blockModel;

  config.blocks.initialBlocks.WikiPage = ['plate'];

  return config;
}

export function asDefault(config: ConfigType) {
  config.blocks.blocksConfig.slate = {
    ...config.blocks.blocksConfig.slate,
    ...TextBlockInfo,
  };

  return config;
}
