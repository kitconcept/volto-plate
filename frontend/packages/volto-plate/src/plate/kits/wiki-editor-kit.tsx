import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

// import { AIKit } from '@plone/plate/components/editor/plugins/ai-kit';
import { AlignKit } from '@plone/plate/components/editor/plugins/align-kit';
import { AutoformatKit } from '@plone/plate/components/editor/plugins/autoformat-kit';
import { BasicBlocksKit } from '@plone/plate/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@plone/plate/components/editor/plugins/basic-marks-kit';
import { BlockMenuKit } from '@plone/plate/components/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '@plone/plate/components/editor/plugins/block-placeholder-kit';
import { CalloutKit } from '@plone/plate/components/editor/plugins/callout-kit';
import { CodeBlockKit } from '@plone/plate/components/editor/plugins/code-block-kit';
import { ColumnKit } from '@plone/plate/components/editor/plugins/column-kit';
import { CommentKit } from '@plone/plate/components/editor/plugins/comment-kit';
import { CursorOverlayKit } from '@plone/plate/components/editor/plugins/cursor-overlay-kit';
import { DiscussionKit } from '@plone/plate/components/editor/plugins/discussion-kit';
// import { DndKit } from '@plone/plate/components/editor/plugins/dnd-kit';
import { DocxKit } from '@plone/plate/components/editor/plugins/docx-kit';
import { ExitBreakKit } from '@plone/plate/components/editor/plugins/exit-break-kit';
import { FloatingToolbarKit } from '@plone/plate/components/editor/plugins/floating-toolbar-kit';
import { FontKit } from '@plone/plate/components/editor/plugins/font-kit';
import { LineHeightKit } from '@plone/plate/components/editor/plugins/line-height-kit';
import { ListKit } from '@plone/plate/components/editor/plugins/list-kit';
import { MarkdownKit } from '@plone/plate/components/editor/plugins/markdown-kit';
import { MediaKit } from '@plone/plate/components/editor/plugins/media-kit';
import { MentionKit } from '@plone/plate/components/editor/plugins/mention-kit';
import { BlockWidthKit } from '@plone/plate/components/editor/plugins/block-width-kit';
import { StyleFieldsKit } from '@plone/plate/components/editor/plugins/style-fields-kit';
import { createSlashKit } from '@plone/plate/components/editor/plugins/slash-kit';
import { SuggestionKit } from '@plone/plate/components/editor/plugins/suggestion-kit';
import { TableKit } from '@plone/plate/components/editor/plugins/table-kit';
import { TocKit } from '@plone/plate/components/editor/plugins/toc-kit';
import { ToggleKit } from '@plone/plate/components/editor/plugins/toggle-kit';
import { SplitHotkeyPlugin } from '@plone/plate/components/editor/plugins/split-hotkey';

import { VoltoLinkKit } from '../plugins/volto-link-kit';
import { SidebarPlugin } from '../plugins/volto-sidebar';
import { slashMenu } from '../wiki/slash-menu';

const WikiSlashKit = createSlashKit({
  menu: slashMenu,
});

export const WikiEditorKit = [
  // ...AIKit,
  ...BlockMenuKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...VoltoLinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
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
  SidebarPlugin,
  SplitHotkeyPlugin,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...FloatingToolbarKit,
];

export type MyEditor = TPlateEditor<Value, (typeof WikiEditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();
