import type { SlateElementProps } from 'platejs';

import { ChevronRight } from 'lucide-react';
import { SlateElement } from 'platejs';

import { BlockInnerContainer } from '@plone/plate/components/ui/block-inner-container';
import { useToggleVisibility } from '../context/ToggleVisibilityContext';

export function VoltoToggleElementStatic(props: SlateElementProps) {
  const { openIds, toggleId } = useToggleVisibility();
  const id = props.element.id as string;
  const open = openIds.has(id);

  return (
    <SlateElement {...props}>
      <BlockInnerContainer className="relative pl-6">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          className={`
            absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md
            p-px text-muted-foreground transition-colors select-none
            hover:bg-accent
            [&_svg]:size-4
          `}
          contentEditable={false}
          onClick={() => toggleId(id)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            event.preventDefault();
            toggleId(id);
          }}
        >
          <ChevronRight
            className={
              open
                ? 'rotate-90 transition-transform duration-75'
                : 'rotate-0 transition-transform duration-75'
            }
          />
        </div>
        {props.children}
      </BlockInnerContainer>
    </SlateElement>
  );
}
