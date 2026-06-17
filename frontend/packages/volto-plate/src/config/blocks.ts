import type { ConfigType } from '@plone/registry';
import { ImageSchema } from '../components/Blocks/Image/schema';
import type { BlockConfigBase } from '@plone/types';

// Backport Seven's typings
declare module '@plone/types' {
  export interface BlocksConfigData {
    plateimage: BlockConfigBase;
  }
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
  if (!config.blocks.plateBlocksConfig) {
    config.blocks.plateBlocksConfig = {};
  }

  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'blockWidth',
    method: () => config.blocks.widths ?? [],
  });

  config.blocks.blocksConfig.plateimage = {
    ...config.blocks.blocksConfig.image,
    ...config.blocks.blocksConfig.plateimage,
    blockSchema: ImageSchema,
    restricted: true,
    schemaEnhancer: undefined,
  };

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
