import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.PlateEditorContentTypes = ['WikiPage'];

  config.settings.cssLayers = [
    'properties',
    'theme',
    'base',
    'components',
    'utilities',
    'plone-components',
  ];

  return config;
}
