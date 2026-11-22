import * as React from 'react';

import type { TElement } from 'platejs';
import type { RenderNodeWrapper } from 'platejs/react';
import { KEYS } from 'platejs';

type WrapInnerContainer = (children: React.ReactNode) => React.ReactNode;

const DiscussionSlotContext = React.createContext<WrapInnerContainer | null>(
  null,
);

// Tables and code blocks render their children inside `<tbody>` / `<code>`,
// where the discussion wrapper of `belowNodes` breaks the markup. Their
// discussion wraps the block's `BlockInnerContainer` instead.
const isDiscussionSlotNode = (element: TElement) =>
  element.type === KEYS.table || element.type === KEYS.codeBlock;

// Turns a `belowNodes` discussion wrapper into an `aboveNodes` one that hands
// the discussion down to the block's `BlockInnerContainer`.
const withDiscussionSlot =
  (wrapper: RenderNodeWrapper<any>): RenderNodeWrapper<any> =>
  (props) => {
    if (!isDiscussionSlotNode(props.element)) return;

    const hoc = wrapper(props);

    if (!hoc) return;

    // eslint-disable-next-line react/display-name
    return (aboveProps) => (
      <DiscussionSlotContext.Provider
        value={(children) => hoc({ ...aboveProps, children })}
      >
        {aboveProps.children}
      </DiscussionSlotContext.Provider>
    );
  };

// Plugin `render` for a discussion wrapper: tables and code blocks get it
// through the slot, every other block keeps it as `belowNodes`.
export const discussionSlotRender = (wrapper: RenderNodeWrapper<any>) => ({
  aboveNodes: withDiscussionSlot(wrapper),
  belowNodes: ((props) =>
    isDiscussionSlotNode(props.element)
      ? undefined
      : wrapper(props)) as RenderNodeWrapper<any>,
});

export function DiscussionSlot({ children }: React.PropsWithChildren) {
  const wrap = React.useContext(DiscussionSlotContext);

  if (!wrap) return <>{children}</>;

  // Nested inner containers, like the ones of table cells, are left alone.
  // The block element spans the whole editor, so the discussion keeps to the
  // block width to show its trigger next to the content.
  return (
    <DiscussionSlotContext.Provider value={null}>
      <div
        className="mx-auto w-full"
        style={{ maxWidth: 'var(--block-width)' }}
      >
        {wrap(children)}
      </div>
    </DiscussionSlotContext.Provider>
  );
}
