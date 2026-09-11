/**
 * OVERRIDE basic-blocks-kit.tsx
 * REASON: Aurora's typography design defines a full H1-H6 scale and Heading 5/6
 *   node components already exist, but the upstream kit only wires up H1-H4 into
 *   the editor's basic blocks. Add H5Plugin/H6Plugin so both heading levels are
 *   actually usable from the editor (turn-into menu, shortcuts, markdown).
 * FILE: https://github.com/plone/aurora/blob/plone-plate-1.0.0-alpha.13/packages/plate/components/editor/plugins/basic-blocks-kit.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.13
 * DATE: 2026-08-25
 * DEVELOPER: @sneridagh
 * CHANGELOG:
 *  - Register H5Plugin and H6Plugin alongside H1-H4 @sneridagh
 *
 */
import {
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  // === START CUSTOMIZATION ===
  H5Plugin,
  H6Plugin,
  // === END CUSTOMIZATION ===
  HorizontalRulePlugin,
} from '@platejs/basic-nodes/react';
import { ParagraphPlugin } from 'platejs/react';

import { BlockquoteElement } from '@plone/plate/components/ui/blockquote-node';
import {
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  // === START CUSTOMIZATION ===
  H5Element,
  H6Element,
  // === END CUSTOMIZATION ===
} from '@plone/plate/components/ui/heading-node';
import { HrElement } from '@plone/plate/components/ui/hr-node';
import { ParagraphElement } from '@plone/plate/components/ui/paragraph-node';

export const BasicBlocksKit = [
  ParagraphPlugin.configure({
    node: { component: ParagraphElement },
  }),
  H1Plugin.configure({
    node: {
      component: H1Element,
    },
    rules: {
      break: { empty: 'reset' },
    },
    shortcuts: { toggle: { keys: 'mod+alt+1' } },
  }),
  H2Plugin.configure({
    node: {
      component: H2Element,
    },
    rules: {
      break: { empty: 'reset' },
    },
    shortcuts: { toggle: { keys: 'mod+alt+2' } },
  }),
  H3Plugin.configure({
    node: {
      component: H3Element,
    },
    rules: {
      break: { empty: 'reset' },
    },
    shortcuts: { toggle: { keys: 'mod+alt+3' } },
  }),
  H4Plugin.configure({
    node: {
      component: H4Element,
    },
    rules: {
      break: { empty: 'reset' },
    },
    shortcuts: { toggle: { keys: 'mod+alt+4' } },
  }),
  // === START CUSTOMIZATION ===
  // Upstream stops at H4; add H5/H6 to match Aurora's full heading scale.
  H5Plugin.configure({
    node: {
      component: H5Element,
    },
    rules: {
      break: { empty: 'reset' },
    },
    shortcuts: { toggle: { keys: 'mod+alt+5' } },
  }),
  H6Plugin.configure({
    node: {
      component: H6Element,
    },
    rules: {
      break: { empty: 'reset' },
    },
    shortcuts: { toggle: { keys: 'mod+alt+6' } },
  }),
  // === END CUSTOMIZATION ===
  BlockquotePlugin.configure({
    node: { component: BlockquoteElement },
    shortcuts: { toggle: { keys: 'mod+shift+period' } },
  }),
  HorizontalRulePlugin.withComponent(HrElement),
];
