import * as React from 'react';

import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
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
        // Base typography for the whole panel (Figma's recurring
        // color/font-family/feature-settings triplet); each text element
        // below only overrides the size/weight/spacing that differs from
        // this. `sans-serif` fallback is load-bearing, not decoration — this
        // repo never loads the Inter webfont, so without it every element
        // here would silently render in the browser's serif default instead
        // of matching the Poppins-based UI around it.
        className={cn(
          'w-[320px] rounded-md bg-popover p-3',
          'text-[var(--Primary-Dark,#000)] font-[Inter,sans-serif]',
          "shadow-[0px_0px_20px_10px_rgba(0,0,0,0.1)] [font-feature-settings:'liga'_off,'clig'_off]",
        )}
        // Selecting a quick-option or calendar day is a mousedown+click on an
        // element outside the slash combobox's hidden text input. Without
        // this, the browser's default focus change fires a blur on that
        // input first, which the combobox treats as a cancel and re-inserts
        // the "//" search text into the document.
        onPointerDownCapture={(event) => event.preventDefault()}
      >
        {/* Head Title/teaser small: text-xs's default 16px line-height already matches the 16px spec */}
        <div className="mb-[20px] text-xs font-bold tracking-[1px] uppercase">
          {t('Insert date')}
        </div>

        <div className="mb-[20px] flex gap-1.5">
          {quickOptions.map((option) => (
            <button
              key={option.label}
              className={cn(
                'flex flex-col items-start justify-center gap-[5px] rounded-full bg-muted px-[10px] text-xs font-medium',
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
          // The design system's `.react-aria-Calendar` rule (Calendar.css)
          // sets `width: fit-content` inside a CSS layer that's declared
          // after Tailwind's utility layer, so it wins over any `w-full`
          // class here regardless of specificity — inline style is what
          // actually overrides it. That same rule also sets `color:
          // var(--text-color)` directly on this element, which cuts off
          // inheritance from the panel's own text color for everything
          // inside (heading, chevrons, day numbers) — own declarations
          // always beat inherited values regardless of layers, so it has
          // to be re-set here too.
          style={{ color: 'var(--Primary-Dark, #000)', width: '100%' }}
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
                'flex size-6 items-center justify-center rounded-sm',
                'hover:bg-accent hover:text-accent-foreground',
              )}
              slot="previous"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Heading
              // react-aria always renders this as an <h1>-<h6>; Volto's
              // global theme sets a large font-size/margin/line-height on
              // heading elements as unlayered CSS, which (like the <header>
              // issue above) silently overrides Tailwind's layered classes
              // here regardless of specificity — that's what was
              // stretching this row to ~155px tall. Inline styles always
              // win over any stylesheet rule, layered or not, so set the
              // properties Volto's theme touches directly.
              // Wiki/Body Text/Bold
              style={{
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: '24px',
                margin: 0,
                textAlign: 'center',
              }}
            />
            <Button
              className={cn(
                'flex size-6 items-center justify-center rounded-sm',
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
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell
                  // <th> cells otherwise size to their text content, which is
                  // what let the abbreviations run together edge-to-edge
                  // ("SunMonTueWedThu..."); a fixed width matching the day
                  // cells below is what gives each one equal, centered space.
                  className="size-8 text-center text-xs font-semibold text-muted-foreground"
                >
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>

            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  // Wiki/Body Text/p: text-base's default 24px line-height
                  // already matches the 24px spec.
                  className="flex h-[35px] w-full cursor-pointer flex-col justify-center text-center text-base font-light outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                  date={date}
                >
                  {({ formattedDate }) => (
                    <span
                      className={cn(
                        'mx-auto flex size-8 items-center justify-center rounded-full',
                        'hover:bg-accent hover:text-accent-foreground',
                        'in-data-[selected]:bg-blue-600 in-data-[selected]:text-white',
                        'in-data-[today]:font-semibold',
                        'in-data-[outside-month]:text-muted-foreground/50',
                      )}
                    >
                      {formattedDate}
                    </span>
                  )}
                </CalendarCell>
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>
      </div>
    </I18nProvider>
  );
}
