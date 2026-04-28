import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.PlateEditorContentTypes = ['Wiki', 'WikiPage'];

  return config;
}
