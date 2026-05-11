import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.PlateEditorContentTypes = ['WikiPage'];
  const EXPANDERS_INHERIT_BEHAVIORS = 'kitconcept.plate.workspace';

  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    {
      match: '',
      GET_CONTENT: ['inherit'],
      querystring: {
        'expand.inherit.behaviors': EXPANDERS_INHERIT_BEHAVIORS,
      },
    },
  ];

  return config;
}
