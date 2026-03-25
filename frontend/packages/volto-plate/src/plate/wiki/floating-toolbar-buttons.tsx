import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  // UnderlineIcon,
  // WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

// import { AIToolbarButton } from '@plone/plate/components/ui/ai-toolbar-button';
import { CommentToolbarButton } from '@plone/plate/components/ui/comment-toolbar-button';
import { LinkToolbarButton } from '@plone/plate/components/ui/link-toolbar-button';
import { MarkToolbarButton } from '@plone/plate/components/ui/mark-toolbar-button';
import { MoreToolbarButton } from '@plone/plate/components/ui/more-toolbar-button';
import { BlockWidthToolbarButton } from '@plone/plate/components/ui/block-width-toolbar-button';
import { SuggestionToolbarButton } from '@plone/plate/components/ui/suggestion-toolbar-button';
import { ToolbarGroup } from '@plone/plate/components/ui/toolbar';
import { TurnIntoToolbarButton } from '@plone/plate/components/ui/turn-into-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '@plone/plate/components/ui/list-toolbar-button';
import { ToggleToolbarButton } from '@plone/plate/components/ui/toggle-toolbar-button';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            {/* <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton> */}

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <LinkToolbarButton />

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <TurnIntoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <BlockWidthToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
