import type { ConfigType } from '@plone/registry';
import { defineMessages } from 'react-intl';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import installSlots from './config/slots';
import './theme/tailwind.css';
import '@plone/components/dist/basic.css';

export const messages = defineMessages({
  acceptAllSuggestions: {
    id: 'Accept all',
    defaultMessage: 'Accept all',
  },
  rejectAllSuggestions: {
    id: 'Reject all',
    defaultMessage: 'Reject all',
  },
  openSuggestionsCount: {
    id: 'openSuggestionsCount',
    defaultMessage: '{count} open suggestions',
  },
});

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);
  installSlots(config);

  return config;
}

export default applyConfig;
