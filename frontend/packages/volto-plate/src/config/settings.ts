import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.PlateEditorContentTypes = ['WikiPage'];

  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    { match: '', GET_CONTENT: ['workspace'] },
  ];

  return config;
}
