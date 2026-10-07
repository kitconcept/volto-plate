import * as React from 'react';

import type { TElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { CalendarIcon } from 'lucide-react';
import { PlateElement, useFocused, useSelected } from 'platejs/react';

import { cn } from '@plone/plate/lib/utils';
import { useTranslation } from '@plone/plate/components/editor/plugins/i18n';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@plone/plate/components/ui/popover';

import { DatePickerPanel } from './date-picker-panel';

export const DATE_ELEMENT_TYPE = 'date';

export type TDateElement = TElement & {
  type: typeof DATE_ELEMENT_TYPE;
  value: string;
};

export const formatDatePillLabel = (value: string, locale?: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export function DateElement(props: PlateElementProps<TDateElement>) {
  const { editor, element } = props;
  const [open, setOpen] = React.useState(false);

  const selected = useSelected();
  const focused = useFocused();

  const { i18n } = useTranslation();

  return (
    <PlateElement
      {...props}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
      }}
      className={cn(
        'mr-1 inline-flex cursor-pointer items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium',
        selected && focused && 'ring-2 ring-ring',
      )}
    >
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverAnchor asChild>
          <button
            className="inline-flex items-center gap-1 border-none bg-transparent p-0"
            contentEditable={false}
            onClick={() => setOpen(true)}
            type="button"
          >
            <CalendarIcon className="size-3.5" />
            {formatDatePillLabel(element.value, i18n.language)}
          </button>
        </PopoverAnchor>

        <PopoverContent align="start" className="w-auto p-0">
          <DatePickerPanel
            onSelect={(isoDate) => {
              const path = editor.api.findPath(element);

              if (path) {
                editor.tf.setNodes({ value: isoDate }, { at: path });
              }

              setOpen(false);
            }}
            value={element.value}
          />
        </PopoverContent>
      </Popover>

      {props.children}
    </PlateElement>
  );
}
