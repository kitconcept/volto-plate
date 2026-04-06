import type { SlateElementProps, TLinkElement } from 'platejs';

import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { SlateElement } from 'platejs';

export function VoltoLinkElementStatic(props: SlateElementProps<TLinkElement>) {
  return (
    <SlateElement
      {...props}
      as={UniversalLink}
      className="font-medium text-primary underline decoration-primary underline-offset-4"
      attributes={{
        ...props.attributes,
        href: props.element.url,
        openLinkInNewTab: props.element.target === '_blank',
      }}
    >
      {props.children}
    </SlateElement>
  );
}
