import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react';
import { MentionElement } from '@plone/plate/components/ui/mention-node';

import { WikiMentionInputElement } from './wiki-mention-node';

export const WikiMentionKit = [
  MentionPlugin.configure({
    options: { triggerPreviousCharPattern: /^$|^[\s"']$/ },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(WikiMentionInputElement),
];
