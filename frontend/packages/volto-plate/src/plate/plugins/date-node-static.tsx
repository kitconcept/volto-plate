import * as React from 'react';

import type { SlateElementProps } from 'platejs';

import { CalendarIcon } from 'lucide-react';
import { SlateElement } from 'platejs';

import { cn } from '@plone/plate/lib/utils';

import { formatDatePillLabel, type TDateElement } from './date-node';

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
  const { element } = props;

  return (
    <SlateElement
      {...props}
      attributes={{
        ...props.attributes,
        'data-slate-value': element.value,
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium',
      )}
    >
      <CalendarIcon className="size-3.5" />
      {formatDatePillLabel(element.value)}
      {props.children}
    </SlateElement>
  );
}
