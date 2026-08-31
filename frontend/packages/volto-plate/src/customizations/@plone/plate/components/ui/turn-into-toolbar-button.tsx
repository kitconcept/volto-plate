/**
 * OVERRIDE turn-into-toolbar-button.tsx
 * REASON: Companion to the basic-blocks-kit.tsx override — Aurora's typography
 *   uses the full H1-H6 scale and the H5/H6 plugins are registered, but the
 *   upstream "Turn into" menu only lists Text through Heading 4, so editors
 *   had no way to turn a block into an H5/H6 from the toolbar.
 * FILE: https://github.com/plone/aurora/blob/plone-plate-1.0.0-alpha.13/packages/plate/components/ui/turn-into-toolbar-button.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.13
 * DATE: 2026-08-25
 * DEVELOPER: @sneridagh
 * CHANGELOG:
 *  - Add Heading 5 / Heading 6 entries to the turn-into menu @sneridagh
 *
 */
import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@plone/plate/components/ui/dropdown-menu';
import {
  getBlockType,
  setBlockType,
} from '@plone/plate/components/editor/transforms';

import {
  ToolbarButton,
  ToolbarMenuGroup,
} from '@plone/plate/components/ui/toolbar';

export const turnIntoItems = [
  {
    icon: <PilcrowIcon />,
    keywords: ['paragraph'],
    label: 'Text',
    value: KEYS.p,
  },
  {
    icon: <Heading2Icon />,
    keywords: ['subtitle', 'h2'],
    label: 'Heading 2',
    value: 'h2',
  },
  {
    icon: <Heading3Icon />,
    keywords: ['subtitle', 'h3'],
    label: 'Heading 3',
    value: 'h3',
  },
  {
    icon: <Heading4Icon />,
    keywords: ['subtitle', 'h4'],
    label: 'Heading 4',
    value: 'h4',
  },
  // === START CUSTOMIZATION ===
  // Upstream list stops at Heading 4; add H5/H6 to match Aurora's full scale.
  {
    icon: <Heading5Icon />,
    keywords: ['subtitle', 'h5'],
    label: 'Heading 5',
    value: KEYS.h5,
  },
  {
    icon: <Heading6Icon />,
    keywords: ['subtitle', 'h6'],
    label: 'Heading 6',
    value: KEYS.h6,
  },
  // === END CUSTOMIZATION ===
  {
    icon: <ListIcon />,
    keywords: ['unordered', 'ul', '-'],
    label: 'Bulleted list',
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon />,
    keywords: ['ordered', 'ol', '1'],
    label: 'Numbered list',
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon />,
    keywords: ['checklist', 'task', 'checkbox', '[]'],
    label: 'To-do list',
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRightIcon />,
    keywords: ['collapsible', 'expandable'],
    label: 'Toggle list',
    value: KEYS.toggle,
  },
  {
    icon: <FileCodeIcon />,
    keywords: ['```'],
    label: 'Code',
    value: KEYS.codeBlock,
  },
  {
    icon: <QuoteIcon />,
    keywords: ['citation', 'blockquote', '>'],
    label: 'Quote',
    value: KEYS.blockquote,
  },
  {
    icon: <Columns3Icon />,
    label: '3 columns',
    value: 'action_three_columns',
  },
];

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip="Turn into"
          isDropdown
        >
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label="Turn into"
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className={`
                min-w-[180px] pl-2
                *:first:[span]:hidden
              `}
              value={itemValue}
            >
              <span
                className={`
                  pointer-events-none absolute right-2 flex size-3.5 items-center justify-center
                `}
              >
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
