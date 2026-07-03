import type { ConfigType } from '@plone/registry';

export default function install(config: ConfigType) {
  config.settings.PlateEditorContentTypes = ['WikiPage'];
  const EXPANDERS_INHERIT_BEHAVIORS = 'kitconcept.plate.workspace';

  config.settings.apiExpanders = [
    ...config.settings.apiExpanders,
    {
      match: '',
      GET_CONTENT: ['inherit'],
      querystring: (config, querystring) => {
        if (querystring['expand.inherit.behaviors']) {
          return {
            'expand.inherit.behaviors': querystring[
              'expand.inherit.behaviors'
            ].concat(',', EXPANDERS_INHERIT_BEHAVIORS),
          };
        } else {
          return {
            'expand.inherit.behaviors': EXPANDERS_INHERIT_BEHAVIORS,
          };
        }
      },
    } as apiExpandersType,
  ];

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
