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

  const align = [
    {
      name: 'left',
      label: 'Left',
      style: { '--block-alignment': 'var(--align-left)' },
    },
    {
      name: 'center',
      label: 'Center',
      style: { '--block-alignment': 'var(--align-center)' },
    },
    {
      name: 'right',
      label: 'Right',
      style: { '--block-alignment': 'var(--align-right)' },
    },
  ];

  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'align',
    method: () => align,
  });

  const size = [
    {
      name: 'l',
      label: 'Large',
      style: { '--block-size': '460px' },
    },
    {
      name: 'm',
      label: 'Medium',
      style: { '--block-size': '300px' },
    },
    {
      name: 's',
      label: 'Small',
      style: { '--block-size': '220px' },
    },
  ];

  config.registerUtility({
    type: 'styleFieldDefinition',
    name: 'size',
    method: () => size,
  });

  // Keep a Volto block registry entry for the adapted Plate image so the
  // sidebar plugin can resolve its blockSchema from `@type: "plateimage"`.
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

  config.blocks.plateBlocksConfig.img = {
    ...config.blocks.plateBlocksConfig.img,
    blockWidth: {
      defaultWidth: 'default',
      ...config.blocks.plateBlocksConfig.img?.blockWidth,
    },
  };

  return config;
}
