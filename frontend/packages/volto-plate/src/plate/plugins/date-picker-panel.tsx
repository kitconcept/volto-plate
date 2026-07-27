import * as React from 'react';

import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  Heading,
  I18nProvider,
} from 'react-aria-components';

import { cn } from '@plone/plate/lib/utils';

export type DatePickerPanelProps = {
  /** Currently selected date, as an ISO `YYYY-MM-DD` string. */
  value?: string;
  locale?: string;
  translate?: (id: string) => string;
  onSelect: (isoDate: string) => void;
};

const parseIsoDate = (value: string): CalendarDate | undefined => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) return undefined;

  return new CalendarDate(year, month, day);
};

export function DatePickerPanel({
  locale,
  onSelect,
  translate,
  value,
}: DatePickerPanelProps) {
  const t = translate ?? ((id: string) => id);
  const todayDate = today(getLocalTimeZone());
  const selected = value ? parseIsoDate(value) : undefined;

  const quickOptions = [
    { date: todayDate, label: t('Today') },
    { date: todayDate.add({ days: 1 }), label: t('Tomorrow') },
    { date: todayDate.add({ weeks: 1 }), label: t('Next week') },
  ];

  return (
    <I18nProvider locale={locale}>
      <div
        className="w-[300px] rounded-md bg-popover p-3 text-popover-foreground"
        style={{ boxShadow: 'rgb(0, 0, 0,0.1) 0px 0px 20px 10px' }}
        // Selecting a quick-option or calendar day is a mousedown+click on an
        // element outside the slash combobox's hidden text input. Without
        // this, the browser's default focus change fires a blur on that
        // input first, which the combobox treats as a cancel and re-inserts
        // the "//" search text into the document.
        onPointerDownCapture={(event) => event.preventDefault()}
      >
        <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('Insert date')}
        </div>

        <div className="mb-2 flex gap-1.5">
          {quickOptions.map((option) => (
            <button
              key={option.label}
              className={cn(
                'rounded-full bg-muted px-2.5 py-1 text-xs font-medium',
                'hover:bg-accent hover:text-accent-foreground',
              )}
              onClick={() => onSelect(option.date.toString())}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <Calendar
          aria-label={t('Insert date')}
          onChange={(date) => date && onSelect(date.toString())}
          value={selected ?? null}
        >
          {/*
            A plain div, not a semantic <header>: Volto's global theme reset
            (reset.overrides) sets `header { display: block }` as unlayered
            CSS, and Tailwind v4's utilities are emitted inside `@layer` —
            unlayered CSS always wins over layered CSS regardless of
            specificity, so `flex` on a <header> here is silently overridden
            and the row stacks vertically instead.
          */}
          <div className="mb-1.5 flex items-center justify-between px-1">
            <Button
              className={cn(
                'flex size-6 items-center justify-center rounded-sm text-muted-foreground',
                'hover:bg-accent hover:text-accent-foreground',
              )}
              slot="previous"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Heading
              className="text-sm font-medium"
              // react-aria always renders this as an <h1>-<h6>; Volto's
              // global theme sets a large font-size/margin/line-height on
              // heading elements as unlayered CSS, which (like the <header>
              // issue above) silently overrides Tailwind's layered `text-sm`
              // class here regardless of specificity — that's what was
              // stretching this row to ~155px tall. Inline styles always
              // win over any stylesheet rule, layered or not, so set the
              // properties Volto's theme touches directly.
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.25,
                margin: 0,
              }}
            />
            <Button
              className={cn(
                'flex size-6 items-center justify-center rounded-sm text-muted-foreground',
                'hover:bg-accent hover:text-accent-foreground',
              )}
              slot="next"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>

          <CalendarGrid
            className="w-full"
            // Plain <table> elements default to `border-spacing: 2px`,
            // which shows up as visible gaps around the weeks/cells.
            // Setting this inline (rather than a Tailwind class) sidesteps
            // the cascade-layer issue found elsewhere in this file, where
            // Volto's global (unlayered) reset CSS can override Tailwind's
            // (layered) utility classes regardless of specificity.
            style={{ borderCollapse: 'collapse', borderSpacing: 0 }}
            weekdayStyle="short"
          >
            {(date) => (
              <CalendarCell
                className={cn(
                  'flex size-8 cursor-pointer items-center justify-center rounded-full text-sm outline-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  'data-[selected]:bg-blue-600 data-[selected]:text-white',
                  'data-[today]:font-semibold',
                  'data-[outside-month]:text-muted-foreground/50',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
                )}
                date={date}
              />
            )}
          </CalendarGrid>
        </Calendar>
      </div>
    </I18nProvider>
  );
}
