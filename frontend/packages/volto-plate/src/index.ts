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
  resolveDiscussion: {
    id: 'Resolve',
    defaultMessage: 'Resolve',
  },
  resolved: {
    id: 'Resolved',
    defaultMessage: 'Resolved',
  },
  resolvedBy: {
    id: 'Resolved by {name}',
    defaultMessage: 'Resolved by {name}',
  },
  reopenDiscussion: {
    id: 'Reopen',
    defaultMessage: 'Reopen',
  },
  pageLocked: {
    id: 'This page is being edited',
    defaultMessage: 'This page is being edited',
  },
  pageLockedBy: {
    id: '{name} is editing this page',
    defaultMessage: '{name} is editing this page',
  },
  inlineCommentsLocked: {
    id: 'Inline comments are unavailable while this page is being edited. Wait until the editor finishes, or ask a site administrator to remove the lock.',
    defaultMessage:
      'Inline comments are unavailable while this page is being edited. Wait until the editor finishes, or ask a site administrator to remove the lock.',
  },
  lockedSince: {
    id: 'Locked since {date}.',
    defaultMessage: 'Locked since {date}.',
  },
});

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);
  installSlots(config);

  return config;
}

export default applyConfig;
