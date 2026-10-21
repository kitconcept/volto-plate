/**
 * OVERRIDE block-inner-container.tsx
 * REASON: Tables and code blocks render the comment/suggestion discussion
 *   around their inner container instead of inside `<tbody>` / `<code>`.
 * FILE: https://github.com/plone/aurora/blob/plone-plate-1.0.0-alpha.24/packages/plate/components/ui/block-inner-container.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.24
 * DATE: 2026-10-16
 * DEVELOPER: @Tishasoumya-02
 * CHANGELOG:
 *  - Wrap the inner container in the block's discussion slot @Tishasoumya-02
 *
 */
import type { CSSProperties, PropsWithChildren } from 'react';

import { cn } from '@plone/plate/lib/utils';

// START CUSTOMIZATION
import { DiscussionSlot } from '../../../../../plate/discussion-slot';
// END CUSTOMIZATION

type BlockInnerContainerProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

export function BlockInnerContainer({
  children,
  className,
  style,
}: BlockInnerContainerProps) {
  return (
    // START CUSTOMIZATION
    <DiscussionSlot>
      {/* END CUSTOMIZATION */}
      <div className={cn('block-inner-container', className)} style={style}>
        {children}
      </div>
      {/* START CUSTOMIZATION */}
    </DiscussionSlot>
    // END CUSTOMIZATION
  );
}
