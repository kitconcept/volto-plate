import * as React from 'react';

import type { Range } from 'platejs';
import { LockIcon, MessageSquareTextIcon, XIcon } from 'lucide-react';
import { RangeApi, TextApi } from 'platejs';
import { createPlatePlugin, useEditorRef } from 'platejs/react';
import { useIntl } from 'react-intl';

import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@plone/plate/components/ui/avatar';
import { Button } from '@plone/plate/components/ui/button';
import { CommentCreateForm } from '@plone/plate/components/ui/comment';

import { messages } from '../../index';
import {
  type InlineCommentAnchor,
  useInlineComments,
} from '../context/InlineCommentsProvider';

const findTextWrapper = (
  editorElement: Element,
  container: Node,
  offset: number,
  end: boolean,
): { edge?: 'end' | 'start'; wrapper: Element } | null => {
  const element =
    container instanceof Element ? container : container.parentElement;
  const containingWrapper = element?.closest('[data-slate-node="text"]');
  if (containingWrapper) return { wrapper: containingWrapper };

  // A browser may place a range boundary between Slate text wrappers, for
  // example at the start of the next paragraph when a selection ends at a
  // line break. Use the nearest wrapper on the selected side.
  const boundary = document.createRange();
  try {
    boundary.setStart(container, offset);
  } catch {
    return null;
  }
  const wrappers = [
    ...editorElement.querySelectorAll('[data-slate-node="text"]'),
  ];
  const wrapper = end
    ? wrappers.findLast(
        (candidate) =>
          boundary.comparePoint(candidate, candidate.childNodes.length) <= 0,
      )
    : wrappers.find((candidate) => boundary.comparePoint(candidate, 0) >= 0);

  return wrapper ? { edge: end ? 'end' : 'start', wrapper } : null;
};

const domOffsetInWrapper = (
  wrapper: Element,
  container: Node,
  offset: number,
  edge?: 'end' | 'start',
) => {
  if (edge) return edge === 'end' ? wrapper.textContent?.length || 0 : 0;

  try {
    const prefix = document.createRange();
    prefix.setStart(wrapper, 0);
    prefix.setEnd(container, offset);
    // Slate's zero-width DOM placeholders are not part of its text offsets.
    return prefix.toString().replaceAll('\uFEFF', '').length;
  } catch {
    return null;
  }
};

const mapDomRange = (
  editor: ReturnType<typeof useEditorRef>,
  editorElement: Element,
  domRange: globalThis.Range,
): Range | null => {
  const point = (container: Node, offset: number, end: boolean) => {
    const boundary = findTextWrapper(editorElement, container, offset, end);
    if (!boundary) return null;

    let blockElement = boundary.wrapper.closest('[data-block-id]');
    const blockId = blockElement?.getAttribute('data-block-id');
    let blockEntry = blockId
      ? [
          ...editor.api.nodes({
            at: [],
            match: (node) =>
              !TextApi.isText(node) && (node as { id?: string }).id === blockId,
          }),
        ][0]
      : undefined;

    if (!blockEntry) {
      let topLevelElement: Element | null = boundary.wrapper;
      while (
        topLevelElement?.parentElement &&
        topLevelElement.parentElement !== editorElement
      ) {
        topLevelElement = topLevelElement.parentElement;
      }
      const topLevelElements = [
        ...editorElement.querySelectorAll(
          ':scope > [data-slate-node="element"]',
        ),
      ];
      const topLevelIndex = topLevelElement
        ? topLevelElements.indexOf(topLevelElement)
        : -1;
      if (topLevelIndex >= 0) {
        blockEntry = editor.api.node([topLevelIndex]);
        blockElement = topLevelElement;
      }
    }
    if (!blockElement || !blockEntry) return null;

    // Void nodes (for example images) have stored empty text children but no
    // DOM text wrapper. Match within the selected block so preceding voids do
    // not shift every subsequent text path.
    const textEntries = [
      ...editor.api.nodes({
        at: blockEntry[1],
        match: (node) => TextApi.isText(node),
      }),
    ];
    const wrappers = [
      ...blockElement.querySelectorAll('[data-slate-node="text"]'),
    ];
    const wrapperIndex = wrappers.indexOf(boundary.wrapper);
    const textEntry = wrapperIndex >= 0 ? textEntries[wrapperIndex] : undefined;
    if (!textEntry || !TextApi.isText(textEntry[0])) return null;

    const domOffset = boundary
      ? domOffsetInWrapper(boundary.wrapper, container, offset, boundary.edge)
      : null;

    return domOffset !== null
      ? {
          offset: Math.min(domOffset, textEntry[0].text.length),
          path: [...textEntry[1]],
        }
      : null;
  };
  const start = point(domRange.startContainer, domRange.startOffset, false);
  const end = point(domRange.endContainer, domRange.endOffset, true);

  return start && end ? { anchor: start, focus: end } : null;
};

type LineBox = { bottom: number; left: number; right: number; top: number };
type Placement = 'bottom' | 'top';

const POPOVER_GAP = 10;
const VIEWPORT_MARGIN = 12;
const ARROW_HALF = 7;

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/**
 * Rectangles of the selected text only. A range's own client rects also
 * include the full boxes of every element it contains, such as whole
 * paragraphs in a selection that spans several of them.
 */
const selectedTextRects = (range: globalThis.Range) => {
  const root = range.commonAncestorContainer;
  const textNodes: Node[] = [];
  if (root.nodeType === Node.TEXT_NODE) {
    textNodes.push(root);
  } else {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (range.intersectsNode(node)) textNodes.push(node);
    }
  }

  return textNodes
    .flatMap((node) => {
      const part = document.createRange();
      part.selectNodeContents(node);
      if (node === range.startContainer) part.setStart(node, range.startOffset);
      if (node === range.endContainer) part.setEnd(node, range.endOffset);
      return [...part.getClientRects()];
    })
    .filter((rect) => rect.width > 0 && rect.height > 0);
};

/** The box of the rendered line that contains `reference`. */
const lineBox = (rects: DOMRect[], reference: DOMRect): LineBox => {
  const line = rects.filter(
    (rect) => rect.top < reference.bottom && rect.bottom > reference.top,
  );
  return {
    bottom: Math.max(...line.map((rect) => rect.bottom)),
    left: Math.min(...line.map((rect) => rect.left)),
    right: Math.max(...line.map((rect) => rect.right)),
    top: Math.min(...line.map((rect) => rect.top)),
  };
};

const selectionLines = (range: globalThis.Range) => {
  const rects = selectedTextRects(range);
  if (!rects.length) {
    const box = range.getBoundingClientRect();
    return { first: box, last: box };
  }
  return {
    first: lineBox(rects, rects[0]),
    last: lineBox(rects, rects[rects.length - 1]),
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Center the popover over the first selected line, which for a one-line
 * selection is the selection itself, with the arrow on the line's center.
 * When there is no room above, open below the last selected line instead.
 */
const positionPopover = (
  popover: HTMLElement,
  arrow: HTMLElement | null,
  range: globalThis.Range,
): Placement => {
  const { first, last } = selectionLines(range);
  const { height, width } = popover.getBoundingClientRect();
  const roomAbove = first.top - POPOVER_GAP - VIEWPORT_MARGIN;
  const roomBelow =
    window.innerHeight - last.bottom - POPOVER_GAP - VIEWPORT_MARGIN;
  const placement: Placement =
    roomAbove >= height || roomAbove >= roomBelow ? 'top' : 'bottom';
  const line = placement === 'top' ? first : last;
  const center = (line.left + line.right) / 2;
  const left = clamp(
    center - width / 2,
    VIEWPORT_MARGIN,
    window.innerWidth - width - VIEWPORT_MARGIN,
  );

  popover.style.left = `${left}px`;
  if (placement === 'top') {
    // Anchor the bottom edge so a growing composer expands upwards.
    popover.style.top = 'auto';
    popover.style.bottom = `${window.innerHeight - first.top + POPOVER_GAP}px`;
  } else {
    popover.style.bottom = 'auto';
    popover.style.top = `${last.bottom + POPOVER_GAP}px`;
  }
  if (arrow) {
    arrow.style.left = `${clamp(
      center - left - ARROW_HALF,
      VIEWPORT_MARGIN,
      width - VIEWPORT_MARGIN - 2 * ARROW_HALF,
    )}px`;
  }
  return placement;
};

const SelectionPopoverArrow = React.forwardRef<
  HTMLSpanElement,
  { placement: Placement }
>(function SelectionPopoverArrow({ placement }, ref) {
  return (
    <span
      aria-hidden
      ref={ref}
      className={
        placement === 'top'
          ? `
            absolute bottom-[-7px] size-3.5 rotate-45 border-r border-b
            border-border bg-popover
          `
          : `
            absolute top-[-7px] size-3.5 rotate-45 border-t border-l
            border-border bg-popover
          `
      }
    />
  );
});

const ViewCommentSelection = () => {
  const editor = useEditorRef();
  const inlineComments = useInlineComments();
  const intl = useIntl();
  const [anchor, setAnchor] = React.useState<InlineCommentAnchor | null>(null);
  const [composing, setComposing] = React.useState(false);
  const [placement, setPlacement] = React.useState<Placement>('top');
  const [layoutTick, setLayoutTick] = React.useState(0);
  // The selected DOM range outlives the browser selection, which moves into
  // the composer once it takes focus.
  const rangeRef = React.useRef<globalThis.Range | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const arrowRef = React.useRef<HTMLSpanElement>(null);

  const clearSelection = React.useCallback(() => {
    rangeRef.current = null;
    setAnchor(null);
  }, []);

  React.useEffect(() => {
    if (
      !inlineComments?.canComment ||
      !inlineComments.currentUserId ||
      composing
    )
      return;

    let animationFrame = 0;

    const updateSelection = () => {
      const domSelection = window.getSelection();
      const selectedElement =
        domSelection?.anchorNode instanceof Element
          ? domSelection.anchorNode
          : domSelection?.anchorNode?.parentElement;
      const editorElement = selectedElement?.closest(
        '[data-slate-editor="true"]',
      );
      if (
        !domSelection?.rangeCount ||
        domSelection.isCollapsed ||
        !editorElement?.classList.contains('typeset') ||
        !editorElement.contains(domSelection.focusNode)
      ) {
        clearSelection();
        return;
      }

      const domRange = domSelection.getRangeAt(0);
      const slateRange =
        mapDomRange(editor, editorElement, domRange) ??
        (editor.api.toSlateRange(domRange, {
          exactMatch: false,
          suppressThrow: true,
        }) as Range | null);
      if (!slateRange || RangeApi.isCollapsed(slateRange)) {
        clearSelection();
        return;
      }

      const [start, end] = editor.api.edges(slateRange);
      const text = editor.api.string(slateRange);
      if (!text) {
        clearSelection();
        return;
      }
      const block = editor.api.node([start.path[0]])?.[0] as
        | { id?: string }
        | undefined;

      rangeRef.current = domRange.cloneRange();
      setAnchor({
        blockId: block?.id,
        end: { offset: end.offset, path: [...end.path] },
        start: { offset: start.offset, path: [...start.path] },
        text,
      });
      setLayoutTick((current) => current + 1);
    };

    const scheduleSelectionUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateSelection);
    };

    document.addEventListener('selectionchange', scheduleSelectionUpdate);
    document.addEventListener('pointerup', scheduleSelectionUpdate);
    document.addEventListener('keyup', scheduleSelectionUpdate);
    scheduleSelectionUpdate();

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('selectionchange', scheduleSelectionUpdate);
      document.removeEventListener('pointerup', scheduleSelectionUpdate);
      document.removeEventListener('keyup', scheduleSelectionUpdate);
    };
  }, [
    clearSelection,
    composing,
    editor,
    inlineComments?.canComment,
    inlineComments?.currentUserId,
  ]);

  // Follow the selected text while the page scrolls or resizes, including
  // while the composer is open.
  React.useEffect(() => {
    if (!anchor) return;

    let animationFrame = 0;
    const scheduleLayout = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() =>
        setLayoutTick((current) => current + 1),
      );
    };

    window.addEventListener('resize', scheduleLayout);
    window.addEventListener('scroll', scheduleLayout, true);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', scheduleLayout);
      window.removeEventListener('scroll', scheduleLayout, true);
    };
  }, [anchor]);

  const locked = !!inlineComments?.locked;
  const canMutate = !!inlineComments?.canMutate;
  const error = inlineComments?.error;

  useIsomorphicLayoutEffect(() => {
    const popover = popoverRef.current;
    const range = rangeRef.current;
    if (!popover || !range) return;
    setPlacement(positionPopover(popover, arrowRef.current, range));
  }, [anchor, canMutate, composing, error, layoutTick, locked]);

  if (!inlineComments?.canComment || !inlineComments.currentUserId) return null;
  if (!anchor) return null;

  // Placed by `positionPopover` before paint, so React must not own the
  // offsets.
  const style: React.CSSProperties = {
    left: 0,
    position: 'fixed',
    top: 0,
    zIndex: 1000,
  };

  if (locked) {
    const lock = inlineComments.lock;
    const editorName = lock.creator_name || lock.creator;
    const lockedAt = lock.created ? new Date(lock.created) : null;
    const formattedDate =
      lockedAt && !Number.isNaN(lockedAt.getTime())
        ? intl.formatDate(lockedAt, {
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : null;

    return (
      <div
        className={`
          relative w-[640px] max-w-[calc(100vw-24px)] rounded-[4px] border
          border-border bg-popover p-4 text-foreground shadow-xl
        `}
        data-inline-comment-lock
        role="status"
        ref={popoverRef}
        style={style}
      >
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5 size-10 shrink-0">
            {lock.creator_portrait && (
              <AvatarImage
                alt={editorName || ''}
                src={expandToBackendURL(lock.creator_portrait)}
              />
            )}
            <AvatarFallback>
              {(editorName || '?').slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              <LockIcon aria-hidden className="size-4 shrink-0" />
              <span>
                {editorName
                  ? intl.formatMessage(messages.pageLockedBy, {
                      name: editorName,
                    })
                  : intl.formatMessage(messages.pageLocked)}
              </span>
            </div>
            <p className="mt-1 mb-0 text-sm leading-5 text-muted-foreground">
              {intl.formatMessage(messages.inlineCommentsLocked)}
              {formattedDate && (
                <>
                  {' '}
                  {intl.formatMessage(messages.lockedSince, {
                    date: formattedDate,
                  })}
                </>
              )}
            </p>
          </div>
        </div>
        <SelectionPopoverArrow placement={placement} ref={arrowRef} />
      </div>
    );
  }

  if (!inlineComments.canMutate) return null;

  if (!composing) {
    return (
      <div
        className={`
          relative rounded-[4px] border border-border bg-popover p-1
          text-foreground shadow-xl
        `}
        ref={popoverRef}
        style={style}
      >
        <Button
          aria-label="Comment on selected text"
          className="gap-2"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setComposing(true)}
          type="button"
          variant="ghost"
        >
          <MessageSquareTextIcon className="size-4" />
          Comment
        </Button>
        <SelectionPopoverArrow placement={placement} ref={arrowRef} />
      </div>
    );
  }

  return (
    <div
      className={`
        w-[320px] rounded-[4px] border border-border bg-popover p-3
        text-foreground shadow-xl
      `}
      data-inline-comment-composer
      ref={popoverRef}
      style={style}
    >
      <div className="mb-2 flex justify-end">
        <Button
          aria-label="Cancel comment"
          className="size-7"
          onClick={() => {
            inlineComments.clearError();
            setComposing(false);
            clearSelection();
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      {inlineComments.error && (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {inlineComments.error}
        </p>
      )}
      <CommentCreateForm
        anchor={anchor}
        focusOnMount
        onSubmitted={() => {
          setComposing(false);
          clearSelection();
          window.getSelection()?.removeAllRanges();
        }}
      />
      <SelectionPopoverArrow placement={placement} ref={arrowRef} />
    </div>
  );
};

export const ViewCommentPlugin = createPlatePlugin({
  key: 'viewComment',
}).configure({
  render: { afterEditable: ViewCommentSelection },
});

export const ViewCommentKit = [ViewCommentPlugin];
