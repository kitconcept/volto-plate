import type { ConfigType } from '@plone/registry';
import TextBlockInfo from '../components/blocks/Text';

// Backport Seven's typings
declare module '@plone/types' {
  export interface PlateBlocksConfigData {
    [key: string]: PlateBlockConfigBase;
  }
  export interface PlateBlockConfigBase {
    blockWidth?: BlockWidthConfig;
  }
  export interface BlockWidthConfig {
    defaultWidth?: string;
    widths?: readonly string[];
  }
  export interface plateBlocksConfig {
    plateBlocksConfig: PlateBlocksConfigData;
  }
  export interface BlocksConfig {
    plateBlocksConfig: PlateBlocksConfigData;
  }
}

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

  if (!config.blocks.plateBlocksConfig) {
    config.blocks.plateBlocksConfig = {};
  }
  config.blocks.plateBlocksConfig.title = {
    ...config.blocks.plateBlocksConfig.title,
    blockWidth: {
      defaultWidth: 'default',
      widths: ['default'],
    },
  };

  config.blocks.plateBlocksConfig.p = {
    ...config.blocks.plateBlocksConfig.p,
    blockWidth: {
      defaultWidth: 'default',
      widths: ['default'],
    },
  };

  return config;
}
