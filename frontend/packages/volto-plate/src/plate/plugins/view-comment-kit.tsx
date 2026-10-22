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
  container: Node,
  offset: number,
  end: boolean,
): { edge?: 'end' | 'start'; wrapper: Element } | null => {
  const element =
    container instanceof Element ? container : container.parentElement;
  const containingWrapper = element?.closest('[data-slate-node="text"]');
  if (containingWrapper) return { wrapper: containingWrapper };
  if (!(container instanceof Element)) return null;

  // A browser may place a range boundary between Slate text wrappers rather
  // than inside their text node. Use the wrapper on the selected side.
  const child = end
    ? container.childNodes[offset - 1]
    : container.childNodes[offset];
  if (!child) return null;
  const childElement = child instanceof Element ? child : child.parentElement;
  const wrappers = childElement?.matches('[data-slate-node="text"]')
    ? [childElement]
    : [...(childElement?.querySelectorAll('[data-slate-node="text"]') ?? [])];
  const wrapper = end ? wrappers.at(-1) : wrappers[0];

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
    const boundary = findTextWrapper(container, offset, end);
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

const getRangeStartRect = (range: globalThis.Range) =>
  [...range.getClientRects()].find(
    (clientRect) => clientRect.width > 0 || clientRect.height > 0,
  ) ?? range.getBoundingClientRect();

const SelectionPopoverArrow = ({ primary = false }: { primary?: boolean }) => (
  <span
    aria-hidden
    className={
      primary
        ? `
          absolute bottom-[-7px] left-8 size-3.5 rotate-45 border-r border-b
          border-primary bg-primary
        `
        : `
          absolute bottom-[-7px] left-8 size-3.5 rotate-45 border-r border-b
          border-border bg-popover
        `
    }
  />
);

const ViewCommentSelection = () => {
  const editor = useEditorRef();
  const inlineComments = useInlineComments();
  const intl = useIntl();
  const [anchor, setAnchor] = React.useState<InlineCommentAnchor | null>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [composing, setComposing] = React.useState(false);

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
        setAnchor(null);
        setRect(null);
        return;
      }

      const domRange = domSelection.getRangeAt(0);
      const slateRange =
        mapDomRange(editor, editorElement, domRange) ??
        (editor.api.toSlateRange(domRange, {
          exactMatch: false,
          suppressThrow: true,
        }) as Range | null);
      if (!slateRange) {
        setAnchor(null);
        setRect(null);
        return;
      }
      if (RangeApi.isCollapsed(slateRange)) {
        setAnchor(null);
        setRect(null);
        return;
      }

      const [start, end] = editor.api.edges(slateRange);
      if (start.path[0] !== end.path[0]) {
        setAnchor(null);
        setRect(null);
        return;
      }
      const text = editor.api.string(slateRange);
      if (!text) {
        setAnchor(null);
        setRect(null);
        return;
      }
      const block = editor.api.node([start.path[0]])?.[0] as
        | { id?: string }
        | undefined;

      setAnchor({
        blockId: block?.id,
        end: { offset: end.offset, path: [...end.path] },
        start: { offset: start.offset, path: [...start.path] },
        text,
      });
      // A multiline range's bounding box starts at the leftmost selected line,
      // which can be far to the left of the selection's actual starting point.
      // Anchor to the first rendered fragment instead.
      setRect(getRangeStartRect(domRange));
    };

    const scheduleSelectionUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateSelection);
    };

    document.addEventListener('selectionchange', scheduleSelectionUpdate);
    document.addEventListener('pointerup', scheduleSelectionUpdate);
    document.addEventListener('keyup', scheduleSelectionUpdate);
    window.addEventListener('resize', scheduleSelectionUpdate);
    window.addEventListener('scroll', scheduleSelectionUpdate, true);
    scheduleSelectionUpdate();

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('selectionchange', scheduleSelectionUpdate);
      document.removeEventListener('pointerup', scheduleSelectionUpdate);
      document.removeEventListener('keyup', scheduleSelectionUpdate);
      window.removeEventListener('resize', scheduleSelectionUpdate);
      window.removeEventListener('scroll', scheduleSelectionUpdate, true);
    };
  }, [
    composing,
    editor,
    inlineComments?.canComment,
    inlineComments?.currentUserId,
  ]);

  if (!inlineComments?.canComment || !inlineComments.currentUserId) return null;
  if (!anchor || !rect) return null;

  const locked = inlineComments.locked;
  const style: React.CSSProperties = {
    bottom: window.innerHeight - rect.top + 8,
    left: Math.max(
      12,
      Math.min(rect.left, window.innerWidth - (locked ? 652 : 332)),
    ),
    position: 'fixed',
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
        <SelectionPopoverArrow />
      </div>
    );
  }

  if (!inlineComments.canMutate) return null;

  if (!composing) {
    return (
      <div className="relative" style={style}>
        <Button
          aria-label="Comment on selected text"
          className="gap-2 shadow-lg"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setComposing(true)}
          type="button"
        >
          <MessageSquareTextIcon className="size-4" />
          Comment
        </Button>
        <SelectionPopoverArrow primary />
      </div>
    );
  }

  return (
    <div
      className="w-[320px] rounded-[14px] border border-border bg-popover p-3 shadow-xl"
      data-inline-comment-composer
      style={style}
    >
      <div className="mb-2 flex justify-end">
        <Button
          aria-label="Cancel comment"
          className="size-7"
          onClick={() => {
            inlineComments.clearError();
            setComposing(false);
            setAnchor(null);
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
          setAnchor(null);
          window.getSelection()?.removeAllRanges();
        }}
      />
      <SelectionPopoverArrow />
    </div>
  );
};

export const ViewCommentPlugin = createPlatePlugin({
  key: 'viewComment',
}).configure({
  render: { afterEditable: ViewCommentSelection },
});

export const ViewCommentKit = [ViewCommentPlugin];
