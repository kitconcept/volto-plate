import * as React from 'react';

import { unwrapLink } from '@platejs/link';
import { RemoveFormattingIcon } from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from '@plone/plate/components/ui/toolbar';

const MARK_KEYS = [
  KEYS.bold,
  KEYS.italic,
  KEYS.underline,
  KEYS.strikethrough,
  KEYS.code,
  KEYS.highlight,
  KEYS.kbd,
  KEYS.sub,
  KEYS.sup,
  KEYS.color,
  KEYS.backgroundColor,
  KEYS.fontFamily,
  KEYS.fontSize,
  KEYS.fontWeight,
];

export function ClearFormattingToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>,
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        editor.tf.removeMarks(MARK_KEYS);
        unwrapLink(editor);
        editor.tf.focus();
      }}
      onMouseDown={(event) => event.preventDefault()}
      tooltip="Clear formatting"
    >
      <RemoveFormattingIcon />
    </ToolbarButton>
  );
}
