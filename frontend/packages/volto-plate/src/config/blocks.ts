import type { ConfigType } from '@plone/registry';
import { ImageSchema } from '../components/Blocks/Image/schema';
import type { BlockConfigBase } from '@plone/types';
import ImageEdit from '../components/Blocks/Image/Edit';

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
    { name: 'center', label: 'Center', style: { '--block-alignment': 'none' } },
    { name: 'left', label: 'Left', style: { '--block-alignment': 'left' } },
    { name: 'right', label: 'Right', style: { '--block-alignment': 'right' } },
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
      style: {},
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

  // Register a dedicated Plone block config for wiki images so we can reuse
  // Aurora's ploneBlock adapter while keeping the custom Volto edit component.
  config.blocks.blocksConfig.plateimage = {
    ...config.blocks.blocksConfig.image,
    ...config.blocks.blocksConfig.plateimage,
    id: 'plateimage',
    blockSchema: ImageSchema,
    edit: ImageEdit,
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
