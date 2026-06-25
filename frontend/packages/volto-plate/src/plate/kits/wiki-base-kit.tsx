import { KEYS } from 'platejs';

import { BaseAlignKit } from '@plone/plate/components/editor/plugins/align-base-kit';
import { BaseBasicBlocksKit } from '@plone/plate/components/editor/plugins/basic-blocks-base-kit';
import { BaseBasicMarksKit } from '@plone/plate/components/editor/plugins/basic-marks-base-kit';
import { BaseBlockAnatomyKit } from '@plone/plate/components/editor/plugins/block-anatomy-base-kit';
import { BaseCalloutKit } from '@plone/plate/components/editor/plugins/callout-base-kit';
import { BaseCodeBlockKit } from '@plone/plate/components/editor/plugins/code-block-base-kit';
import { BaseColumnKit } from '@plone/plate/components/editor/plugins/column-base-kit';
import { BaseCommentKit } from '@plone/plate/components/editor/plugins/comment-base-kit';
import { BaseFontKit } from '@plone/plate/components/editor/plugins/font-base-kit';
import { BaseLineHeightKit } from '@plone/plate/components/editor/plugins/line-height-base-kit';
import { BaseLinkKit } from '@plone/plate/components/editor/plugins/link-base-kit';
import { BaseListKit } from '@plone/plate/components/editor/plugins/list-base-kit';
import { BaseMediaKit } from '@plone/plate/components/editor/plugins/media-base-kit';
import { BaseMentionKit } from '@plone/plate/components/editor/plugins/mention-base-kit';
import { BaseBlockWidthKit } from '@plone/plate/components/editor/plugins/block-width-base-kit';
import { BaseStyleFieldsKit } from '@plone/plate/components/editor/plugins/style-fields-base-kit';
import { BaseSuggestionKit } from '@plone/plate/components/editor/plugins/suggestion-base-kit';
import { BaseTableKit } from '@plone/plate/components/editor/plugins/table-base-kit';
import { BaseTocKit } from '@plone/plate/components/editor/plugins/toc-base-kit';
import { BaseToggleKit } from '@plone/plate/components/editor/plugins/toggle-base-kit';

import { overrideKitPlugin } from './override-kit-plugin';
import { VoltoLinkElementStatic } from '../plugins/volto-link-node-static';

const wikiBaseLinkKit = overrideKitPlugin(BaseLinkKit, KEYS.link, {
  node: {
    component: VoltoLinkElementStatic,
  },
});

export const wikiBaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseTocKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...wikiBaseLinkKit,
  ...BaseMentionKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseBlockAnatomyKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...BaseStyleFieldsKit,
  ...BaseBlockWidthKit,
  ...BaseCommentKit,
  ...BaseSuggestionKit,
];
