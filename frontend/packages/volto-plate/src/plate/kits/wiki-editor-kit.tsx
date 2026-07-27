import { KEYS, type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

// import { AIKit } from '@plone/plate/components/editor/plugins/ai-kit';
import { AlignKit } from '@plone/plate/components/editor/plugins/align-kit';
import { AutoformatKit } from '@plone/plate/components/editor/plugins/autoformat-kit';
import { BasicBlocksKit } from '@plone/plate/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@plone/plate/components/editor/plugins/basic-marks-kit';
import { BlockMenuKit } from '@plone/plate/components/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '@plone/plate/components/editor/plugins/block-placeholder-kit';
import { BlockAnatomyKit } from '@plone/plate/components/editor/plugins/block-anatomy-kit';
import { CalloutKit } from '@plone/plate/components/editor/plugins/callout-kit';
import { CodeBlockKit } from '@plone/plate/components/editor/plugins/code-block-kit';
import { ColumnKit } from '@plone/plate/components/editor/plugins/column-kit';
import { CommentKit } from '@plone/plate/components/editor/plugins/comment-kit';
import { CursorOverlayKit } from '@plone/plate/components/editor/plugins/cursor-overlay-kit';
import { DiscussionKit } from '@plone/plate/components/editor/plugins/discussion-kit';
// import { DndKit } from '@plone/plate/components/editor/plugins/dnd-kit';
import { DocxKit } from '@plone/plate/components/editor/plugins/docx-kit';
import { ExitBreakKit } from '@plone/plate/components/editor/plugins/exit-break-kit';
import { FontKit } from '@plone/plate/components/editor/plugins/font-kit';
import { LineHeightKit } from '@plone/plate/components/editor/plugins/line-height-kit';
import { ListKit } from '@plone/plate/components/editor/plugins/list-kit';
import { MarkdownKit } from '@plone/plate/components/editor/plugins/markdown-kit';
import { MentionKit } from '@plone/plate/components/editor/plugins/mention-kit';
import { BlockWidthKit } from '@plone/plate/components/editor/plugins/block-width-kit';
import { StyleFieldsKit } from '@plone/plate/components/editor/plugins/style-fields-kit';
import { createSlashKit } from '@plone/plate/components/editor/plugins/slash-kit';
import { SuggestionKit } from '@plone/plate/components/editor/plugins/suggestion-kit';
import { TableKit } from '@plone/plate/components/editor/plugins/table-kit';
import { TocKit } from '@plone/plate/components/editor/plugins/toc-kit';
import { ToggleKit } from '@plone/plate/components/editor/plugins/toggle-kit';
import { SplitHotkeyPlugin } from '@plone/plate/components/editor/plugins/split-hotkey';

import { VoltoFloatingToolbarKit } from '../plugins/volto-floating-toolbar-kit';
import { VoltoClipboardImagePastePlugin } from '../plugins/volto-clipboard-image-paste';
import { VoltoImageDropPlugin } from '../plugins/volto-image-drop';
import { VoltoLinkKit } from '../plugins/volto-link-kit';
import { SidebarPlugin } from '../plugins/volto-sidebar';
import { DateKit } from '../plugins/date-kit';
import { slashMenu } from '../wiki/slash-menu';
import { WikiSlashInputElement } from '../wiki/date-slash-input';
import { overrideKitPlugin } from './override-kit-plugin';

// Swap in the addon's own slash-input component so typing a second "/" right
// after the slash menu opens (i.e. "//") shows a date picker instead of the
// command list — see wiki/date-slash-input.tsx.
const WikiSlashKit = overrideKitPlugin(
  createSlashKit({ menu: slashMenu }),
  KEYS.slashInput,
  { node: { component: WikiSlashInputElement } },
);

export const WikiEditorKit = [
  // ...AIKit,
  ...BlockMenuKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...CalloutKit,
  ...ColumnKit,
  ...VoltoLinkKit,
  ...MentionKit,
  ...DateKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...BlockAnatomyKit,
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,
  ...StyleFieldsKit,
  ...BlockWidthKit,

  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing
  ...WikiSlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  // ...DndKit,
  ...ExitBreakKit,
  VoltoClipboardImagePastePlugin,
  VoltoImageDropPlugin,
  SidebarPlugin,
  SplitHotkeyPlugin,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...VoltoFloatingToolbarKit,
];

export type MyEditor = TPlateEditor<Value, (typeof WikiEditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();
