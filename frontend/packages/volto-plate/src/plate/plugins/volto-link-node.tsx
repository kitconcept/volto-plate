import type { TLinkElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { PlateElement } from 'platejs/react';

import { cn } from '@plone/plate/lib/utils';

export function VoltoLinkElement(props: PlateElementProps<TLinkElement>) {
  return (
    <PlateElement
      {...props}
      as={UniversalLink}
      className={cn(
        'font-medium text-primary underline decoration-primary underline-offset-4',
      )}
      attributes={{
        ...props.attributes,
        href: props.element.url,
        openLinkInNewTab: props.element.target === '_blank',
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
        },
        onAuxClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
        },
        onMouseOver: (event) => {
          event.stopPropagation();
        },
      }}
    >
      {props.children}
    </PlateElement>
  );
}
