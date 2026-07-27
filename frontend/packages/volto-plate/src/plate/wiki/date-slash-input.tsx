import * as React from 'react';

import type { TComboboxInputElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { SlashPlugin } from '@platejs/slash-command/react';
import { ElementApi } from 'platejs';
import { PlateElement } from 'platejs/react';

import { getIntl } from '@plone/plate/components/editor/plugins/split-utils';
import { TITLE_BLOCK_TYPE } from '@plone/plate/components/editor/plugins/title';
import {
  resolveSlashMenuGroups,
  type SlashMenuConfig,
} from '@plone/plate/components/editor/plugins/slash-menu';
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@plone/plate/components/ui/inline-combobox';

import { DATE_ELEMENT_TYPE } from '../plugins/date-node';
import { DatePickerPanel } from '../plugins/date-picker-panel';

// Typing a single "/" already opens this combobox (see SlashPlugin's
// triggerPreviousCharPattern). A second "/" therefore lands as the combobox's
// own live search text rather than reaching the document as plain text, so
// "//" is detected here by branching on that search value instead of
// registering a separate two-character trigger.
const isDateTrigger = (search: string) => search.startsWith('/');

// Some registered blocks (e.g. Volto core's title/description/image/...)
// store their icon as the raw `{ attributes, content }` object produced by
// the SVG loader rather than as a component, meant to be rendered through
// Volto's own `Icon` helper. `resolveSlashMenuGroups`'s built-in "Blocks"
// group renders `icon` directly as a JSX element, which crashes the whole
// editor when that happens. Guard against it here instead of assuming every
// registered block followed the convention this menu expects.
const isRenderableIcon = (node: React.ReactNode) =>
  React.isValidElement(node) &&
  (typeof node.type === 'function' || typeof node.type === 'string');

export function WikiSlashInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState('');

  const menuConfig = (
    editor.getOptions(SlashPlugin as any) as
      | { menu?: SlashMenuConfig }
      | undefined
  )?.menu;

  const intl = getIntl(editor);
  const translate = React.useMemo(() => {
    if (!intl?.formatMessage) {
      return (id: string) => id;
    }

    return (id: string) => intl.formatMessage({ defaultMessage: id, id });
  }, [intl]);

  const hasTitleBlock = editor.children.some(
    (child) => ElementApi.isElement(child) && child.type === TITLE_BLOCK_TYPE,
  );

  const groups = React.useMemo(() => {
    return resolveSlashMenuGroups(editor, menuConfig, {
      hasTitleBlock,
      translate,
    });
  }, [editor, hasTitleBlock, menuConfig, translate]);

  const insertDate = (isoDate: string) => {
    editor.tf.withoutNormalizing(() => {
      const path = editor.api.findPath(element);

      if (!path) return;

      editor.tf.removeNodes({ at: path });
      editor.tf.insertNodes(
        {
          children: [{ text: '' }],
          type: DATE_ELEMENT_TYPE,
          value: isoDate,
        },
        { at: path, select: true },
      );
    });

    editor.tf.move({ unit: 'offset' });
  };

  const showDatePicker = isDateTrigger(search);

  return (
    <PlateElement
      {...props}
      as="span"
      attributes={{
        ...props.attributes,
        // Clicking a calendar day (unlike the quick-select buttons) makes
        // react-aria's CalendarCell programmatically focus itself, which
        // blurs the combobox's hidden input regardless of preventDefault on
        // pointerdown. Plate's combobox treats that blur as a cancel — it
        // removes this input node and re-inserts the literal "//" as plain
        // text — which races ahead of the date being inserted, leaving "//"
        // behind instead of the pill. Stopping the blur here in the capture
        // phase (before it reaches the combobox's own onBlur) keeps the
        // input node alive so the date can still replace it normally.
        onBlurCapture: (event: React.FocusEvent) => {
          if (showDatePicker) {
            event.stopPropagation();
          }
        },
      }}
    >
      <InlineCombobox
        element={element}
        setValue={setSearch}
        trigger="/"
        value={search}
      >
        <InlineComboboxInput />

        {showDatePicker ? (
          <InlineComboboxContent
            // InlineComboboxContent's default classes include
            // `overflow-y-auto`, which clips anything that extends beyond
            // this container's own box — including the date panel's own
            // box-shadow, since the panel fills this container almost
            // exactly with no room for the shadow's blur/spread to bleed
            // outward. `overflow-visible` here is what lets it actually show.
            className="max-h-[500px] w-[300px] overflow-visible bg-transparent shadow-none"
          >
            {/*
              InlineCombobox only opens its floating popover once it has
              combobox items or an "empty" state (see InlineCombobox's `open`
              prop). The date picker doesn't register any ComboboxItem, so
              without this it would stay `display: none` forever — reusing
              InlineComboboxEmpty as the always-rendered (items.length === 0)
              wrapper is what makes the popover actually open.
            */}
            <InlineComboboxEmpty className="m-0 h-auto items-stretch p-0">
              <DatePickerPanel
                locale={intl?.locale}
                onSelect={insertDate}
                translate={translate}
              />
            </InlineComboboxEmpty>
          </InlineComboboxContent>
        ) : (
          <InlineComboboxContent>
            <InlineComboboxEmpty>No results</InlineComboboxEmpty>

            {groups.map(({ group, items }) => (
              <InlineComboboxGroup key={group}>
                <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

                {items.map(
                  ({
                    focusEditor,
                    icon,
                    keywords,
                    label,
                    value,
                    onSelect,
                  }) => (
                    <InlineComboboxItem
                      key={value}
                      value={value}
                      onClick={() => onSelect(editor, value)}
                      label={label}
                      focusEditor={focusEditor}
                      group={group}
                      keywords={keywords}
                    >
                      <div className="mr-2 text-muted-foreground">
                        {isRenderableIcon(icon) ? icon : null}
                      </div>
                      {label ?? value}
                    </InlineComboboxItem>
                  ),
                )}
              </InlineComboboxGroup>
            ))}
          </InlineComboboxContent>
        )}
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
