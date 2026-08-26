/**
 * OVERRIDE block-discussion.tsx
 * REASON: Bulk "Accept all" / "Reject all" actions below the
 *   suggestion list when a block has more than one open suggestion.
 * FILE: https://github.com/plone/aurora/blob/plone-plate-1.0.0-alpha.13/packages/plate/components/ui/block-discussion.tsx
 * FILE VERSION: @plone/plate 1.0.0-alpha.13
 * DATE: 2026-08-25
 * DEVELOPER: @iFlameing
 * PULL REQUEST: https://github.com/kitconcept/volto-plate/pull/58
 * CHANGELOG:
 *  - Add bulk accept/reject suggestion actions (#58) @iFlameing
 *
 */
import * as React from 'react';

import type { PlateElementProps, RenderNodeWrapper } from 'platejs/react';

import { getDraftCommentKey } from '@platejs/comment';
import { CommentPlugin } from '@platejs/comment/react';
import { getTransientSuggestionKey } from '@platejs/suggestion';
import { MessageSquareTextIcon, MessagesSquareIcon, XIcon } from 'lucide-react';
import {
  type AnyPluginConfig,
  type NodeEntry,
  type Path,
  type TCommentText,
  type TElement,
  type TSuggestionText,
  PathApi,
  TextApi,
} from 'platejs';
import { useEditorPlugin, useEditorRef, usePluginOption } from 'platejs/react';

// === START CUSTOMIZATION ===
// Customization of @plone/plate's components/ui/block-discussion.tsx:
// add "Accept all" / "Reject all" bulk actions below the suggestion list,
// shown when the group has more than one open suggestion.
import { acceptSuggestion, rejectSuggestion } from '@platejs/suggestion';
import { CheckIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { messages } from '../../../../../index';
// === END CUSTOMIZATION ===

import { Button } from '@plone/plate/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@plone/plate/components/ui/popover';
import { usePlatePlugins } from '@plone/plate/components/editor/plate-plugins-context';
import { commentPlugin } from '@plone/plate/components/editor/plugins/comment-kit';
import { type TDiscussion } from '@plone/plate/components/editor/plugins/discussion-kit';
import {
  SuggestionPlugin,
  suggestionPlugin,
} from '@plone/plate/components/editor/plugins/suggestion-kit';

import {
  BlockSuggestionCard,
  isResolvedSuggestion,
  useResolveSuggestion,
} from '@plone/plate/components/ui/block-suggestion';
import {
  type CommentCreateFormHandle,
  Comment,
  CommentCreateForm,
} from '@plone/plate/components/ui/comment';
import { cn } from '@plone/plate/lib/utils';

export const discussionPopoverContentClassName = `
  max-h-[min(70dvh,calc(-24px+var(--radix-popper-available-height)))]
  w-[min(320px,calc(100vw-24px))] min-w-[300px] overflow-y-auto
  rounded-[14px] border border-border bg-popover p-0
  shadow-[0_10px_30px_rgba(15,23,42,0.14)]
  data-[state=closed]:opacity-0
`;

export const discussionTriggerClassName = `
  mt-1 flex h-auto min-w-0 items-center gap-1.5 rounded-md border-0
  bg-transparent px-1.5 py-0.5 text-muted-foreground shadow-none
  hover:bg-muted hover:text-muted-foreground
  data-[active=true]:bg-muted
`;

type DiscussionTriggerKind = 'comments' | 'mixed' | 'suggestions';

const DISCUSSION_POPOVER_COLLISION_PADDING = 12;

const getDiscussionPopoverCollisionPadding = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return DISCUSSION_POPOVER_COLLISION_PADDING;
  }

  const toolbarRect = document
    .getElementById('toolbar')
    ?.getBoundingClientRect();
  const sidebarRect = document
    .querySelector<HTMLElement>('.sidebar-container:not(.collapsed)')
    ?.getBoundingClientRect();
  const contentAreaRect = document
    .querySelector<HTMLElement>('.content-area')
    ?.getBoundingClientRect();

  return {
    top: DISCUSSION_POPOVER_COLLISION_PADDING,
    bottom: DISCUSSION_POPOVER_COLLISION_PADDING,
    left: Math.max(
      DISCUSSION_POPOVER_COLLISION_PADDING,
      (toolbarRect?.right ?? 0) + DISCUSSION_POPOVER_COLLISION_PADDING,
      (contentAreaRect?.left ?? 0) + DISCUSSION_POPOVER_COLLISION_PADDING,
    ),
    right: Math.max(
      DISCUSSION_POPOVER_COLLISION_PADDING,
      sidebarRect
        ? window.innerWidth -
            sidebarRect.left +
            DISCUSSION_POPOVER_COLLISION_PADDING
        : DISCUSSION_POPOVER_COLLISION_PADDING,
      contentAreaRect
        ? window.innerWidth -
            contentAreaRect.right +
            DISCUSSION_POPOVER_COLLISION_PADDING
        : DISCUSSION_POPOVER_COLLISION_PADDING,
    ),
  };
};

const hasMeaningfulRect = (element?: HTMLElement | null) => {
  const rect = element?.getBoundingClientRect();

  return Boolean(rect && rect.width > 0 && rect.height > 0);
};

function useDiscussionPopoverCollisionPadding() {
  const [padding, setPadding] = React.useState(
    getDiscussionPopoverCollisionPadding,
  );

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const updatePadding = () => {
      setPadding(getDiscussionPopoverCollisionPadding());
    };

    updatePadding();
    window.addEventListener('resize', updatePadding);

    const sidebar = document.querySelector<HTMLElement>('.sidebar-container');
    const toolbar = document.getElementById('toolbar');
    const contentArea = document.querySelector<HTMLElement>('.content-area');
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            updatePadding();
          });

    [sidebar, toolbar, contentArea].forEach((element) => {
      if (resizeObserver && element && hasMeaningfulRect(element)) {
        resizeObserver.observe(element);
      }
    });

    const mutationObserver = new MutationObserver(() => {
      updatePadding();
    });

    [sidebar, toolbar, contentArea].forEach((element) => {
      if (element) {
        mutationObserver.observe(element, {
          attributes: true,
          attributeFilter: ['class', 'style'],
        });
      }
    });

    return () => {
      window.removeEventListener('resize', updatePadding);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return padding;
}

export const DiscussionTriggerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    active: boolean;
    count: number;
    kind: DiscussionTriggerKind;
  }
>(({ active, className, count, kind, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    className={cn(
      discussionTriggerClassName,
      active && (kind === 'suggestions' ? 'text-quanta-emerald' : 'text-brand'),
      className,
    )}
    data-active={active}
    contentEditable={false}
    {...props}
  >
    {kind === 'comments' ? (
      <MessageSquareTextIcon className="size-5 shrink-0" />
    ) : (
      <MessagesSquareIcon className="size-5 shrink-0" />
    )}

    <span className="text-sm leading-none font-normal">{count}</span>
  </Button>
));

DiscussionTriggerButton.displayName = 'DiscussionTriggerButton';

export function DiscussionPopover({
  anchorAsChild = true,
  anchorElement,
  children,
  content,
  contentProps,
  onOpenChange,
  open,
  trigger,
  triggerAsPopoverTrigger = true,
  wrapperProps,
}: React.PropsWithChildren<{
  anchorElement: HTMLElement | null;
  content: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  anchorAsChild?: boolean;
  contentProps?: Omit<React.ComponentProps<typeof PopoverContent>, 'children'>;
  trigger?: React.ReactNode;
  triggerAsPopoverTrigger?: boolean;
  wrapperProps?: React.ComponentProps<'div'>;
}>) {
  const { className: wrapperClassName, ...restWrapperProps } =
    wrapperProps ?? {};
  const { className: contentClassName, ...restContentProps } =
    contentProps ?? {};
  const collisionPadding = useDiscussionPopoverCollisionPadding();

  return (
    <div className="flex w-full justify-between">
      <Popover open={open} onOpenChange={onOpenChange}>
        <div className={cn('w-full', wrapperClassName)} {...restWrapperProps}>
          {children}
        </div>

        {anchorElement && (
          <PopoverAnchor
            asChild={anchorAsChild}
            className="w-full"
            virtualRef={{ current: anchorElement }}
          />
        )}

        <PopoverContent
          className={cn(discussionPopoverContentClassName, contentClassName)}
          collisionPadding={collisionPadding}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
          align="center"
          side="bottom"
          {...restContentProps}
        >
          {content}
        </PopoverContent>

        {trigger && (
          <div className="relative left-0 size-0 select-none">
            {triggerAsPopoverTrigger ? (
              <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            ) : (
              trigger
            )}
          </div>
        )}
      </Popover>
    </div>
  );
}

export function DiscussionPopoverHeader({
  count,
  onClose,
  title,
}: {
  count: number;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
      <div
        aria-level={2}
        className="text-[13px] leading-[1.6] font-bold tracking-[0.06em] text-foreground uppercase"
        role="heading"
      >
        {title} ({count})
      </div>
      <Button
        aria-label="Close"
        className={`
          size-[22px] rounded-md p-0.5 text-muted-foreground
          hover:bg-muted hover:text-foreground
        `}
        onClick={onClose}
        size="icon"
        type="button"
        variant="ghost"
      >
        <XIcon className="size-[18px] stroke-2" />
      </Button>
    </div>
  );
}

export const BlockDiscussion: RenderNodeWrapper<AnyPluginConfig> = (props) => {
  const { editor, element } = props;

  const commentsApi = editor.getApi(CommentPlugin).comment;
  const blockPath = editor.api.findPath(element);

  // avoid duplicate in table or column
  if (!blockPath || blockPath.length > 1) return;

  const draftCommentNode = commentsApi.node({ at: blockPath, isDraft: true });

  const commentNodes = [...commentsApi.nodes({ at: blockPath })];

  const suggestionNodes = [
    ...editor.getApi(SuggestionPlugin).suggestion.nodes({ at: blockPath }),
  ].filter(([node]) => !node[getTransientSuggestionKey()]);

  if (
    commentNodes.length === 0 &&
    suggestionNodes.length === 0 &&
    !draftCommentNode
  ) {
    return;
  }

  // eslint-disable-next-line react/display-name
  return (props) => (
    <BlockCommentContent
      blockPath={blockPath}
      commentNodes={commentNodes}
      draftCommentNode={draftCommentNode}
      suggestionNodes={suggestionNodes}
      {...props}
    />
  );
};

const BlockCommentContent = ({
  blockPath,
  children,
  commentNodes,
  draftCommentNode,
  suggestionNodes,
}: PlateElementProps & {
  blockPath: Path;
  commentNodes: NodeEntry<TCommentText>[];
  draftCommentNode: NodeEntry<TCommentText> | undefined;
  suggestionNodes: NodeEntry<TElement | TSuggestionText>[];
}) => {
  const editor = useEditorRef();

  // === START CUSTOMIZATION ===
  // Customization of @plone/plate's components/ui/block-discussion.tsx:
  // add "Accept all" / "Reject all" bulk actions below the suggestion list
  // when there is more than one open suggestion in the group. `suggestionApi`
  // is needed to bulk-apply the suggestions, and `canManageSuggestion` mirrors
  // the same gate used for the per-suggestion buttons in block-suggestion.tsx.
  const intl = useIntl();
  const { api: suggestionApi } = useEditorPlugin(SuggestionPlugin);
  const { currentUserId } = usePlatePlugins();
  const canManageSuggestion = !!currentUserId;
  // === END CUSTOMIZATION ===

  const resolvedSuggestions = useResolveSuggestion(suggestionNodes, blockPath);
  const resolvedDiscussions = useResolvedDiscussion(commentNodes, blockPath);

  const suggestionsCount = resolvedSuggestions.length;
  const discussionsCount = resolvedDiscussions.length;
  const totalCount = suggestionsCount + discussionsCount;
  const popoverTitle =
    suggestionsCount > 0 && discussionsCount === 0
      ? 'Suggestions'
      : discussionsCount > 0 && suggestionsCount === 0
        ? 'Comments'
        : 'Comments & Suggestions';

  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');
  const activeSuggestion =
    activeSuggestionId &&
    resolvedSuggestions.find((s) => s.suggestionId === activeSuggestionId);

  const commentingBlock = usePluginOption(commentPlugin, 'commentingBlock');
  const activeCommentId = usePluginOption(commentPlugin, 'activeId');
  const isCommenting = activeCommentId === getDraftCommentKey();
  const activeDiscussion =
    activeCommentId &&
    resolvedDiscussions.find((d) => d.id === activeCommentId);

  const noneActive = !activeSuggestion && !activeDiscussion;
  const popoverHeaderCount = noneActive
    ? totalCount
    : activeDiscussion
      ? activeDiscussion.comments.length
      : 1;
  const triggerKind: DiscussionTriggerKind =
    suggestionsCount > 0 && discussionsCount === 0
      ? 'suggestions'
      : suggestionsCount === 0 && discussionsCount > 0
        ? 'comments'
        : 'mixed';

  const sortedMergedData = [
    ...resolvedDiscussions,
    ...resolvedSuggestions,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const selected =
    resolvedDiscussions.some((d) => d.id === activeCommentId) ||
    resolvedSuggestions.some((s) => s.suggestionId === activeSuggestionId);

  const [_open, setOpen] = React.useState(selected);

  // in some cases, we may comment the multiple blocks
  const commentingCurrent =
    !!commentingBlock && PathApi.equals(blockPath, commentingBlock);

  const open =
    _open ||
    selected ||
    (isCommenting && !!draftCommentNode && commentingCurrent);

  const closePopover = React.useCallback(() => {
    if (isCommenting && draftCommentNode) {
      editor.tf.unsetNodes(getDraftCommentKey(), {
        at: [],
        mode: 'lowest',
        match: (n) => n[getDraftCommentKey()],
      });
    }

    setOpen(false);
  }, [draftCommentNode, editor.tf, isCommenting]);

  // === START CUSTOMIZATION ===
  const acceptAllSuggestions = () => {
    suggestionApi.suggestion.withoutSuggestions(() => {
      resolvedSuggestions.forEach((s) => acceptSuggestion(editor, s));
    });
  };

  const rejectAllSuggestions = () => {
    suggestionApi.suggestion.withoutSuggestions(() => {
      resolvedSuggestions.forEach((s) => rejectSuggestion(editor, s));
    });
  };
  // === END CUSTOMIZATION ===

  const anchorElement = React.useMemo(() => {
    let activeNode: NodeEntry | undefined;

    if (activeSuggestion) {
      activeNode = suggestionNodes.find(
        ([node]) =>
          TextApi.isText(node) &&
          editor.getApi(SuggestionPlugin).suggestion.nodeId(node) ===
            activeSuggestion.suggestionId,
      );
    }

    if (activeCommentId) {
      if (activeCommentId === getDraftCommentKey()) {
        activeNode = draftCommentNode;
      } else {
        activeNode = commentNodes.find(
          ([node]) =>
            editor.getApi(commentPlugin).comment.nodeId(node) ===
            activeCommentId,
        );
      }
    }

    if (!activeNode) return null;

    return editor.api.toDOMNode(activeNode[0])!;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    activeSuggestion,
    activeCommentId,
    editor.api,
    suggestionNodes,
    draftCommentNode,
    commentNodes,
  ]);

  if (suggestionsCount + resolvedDiscussions.length === 0 && !draftCommentNode)
    return <div className="w-full">{children}</div>;

  const popoverContent = isCommenting ? (
    <CommentCreateForm className="p-4" focusOnMount />
  ) : (
    <React.Fragment>
      <DiscussionPopoverHeader
        count={popoverHeaderCount}
        onClose={closePopover}
        title={popoverTitle}
      />
      {noneActive ? (
        sortedMergedData.map((item, index) =>
          isResolvedSuggestion(item) ? (
            <BlockSuggestionCard
              key={item.suggestionId}
              idx={index}
              isLast={index === sortedMergedData.length - 1}
              suggestion={item}
            />
          ) : (
            <BlockComment
              key={item.id}
              discussion={item}
              isLast={index === sortedMergedData.length - 1}
            />
          ),
        )
      ) : (
        <React.Fragment>
          {activeSuggestion && (
            <BlockSuggestionCard
              key={activeSuggestion.suggestionId}
              idx={0}
              isLast={true}
              suggestion={activeSuggestion}
            />
          )}

          {activeDiscussion && (
            <BlockComment discussion={activeDiscussion} isLast={true} />
          )}
        </React.Fragment>
      )}
      {/* === START CUSTOMIZATION ===
          Bulk "Accept all" / "Reject all" footer, shown only when viewing the
          full list and there is more than one open suggestion to act on. */}
      {noneActive && suggestionsCount > 1 && canManageSuggestion && (
        <React.Fragment>
          <div className="h-px w-full bg-muted" />
          <div className="flex flex-col gap-3 px-4 pt-3 pb-3.5">
            <div
              className={`
                text-[13px] leading-[1.6] font-bold tracking-[0.06em]
                text-muted-foreground uppercase
              `}
            >
              <FormattedMessage
                {...messages.openSuggestionsCount}
                values={{ count: suggestionsCount }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className={`
                  h-8 flex-1 gap-1.5 rounded-md bg-quanta-emerald text-sm!
                  font-semibold text-white
                  hover:bg-quanta-turtle
                `}
                onClick={acceptAllSuggestions}
              >
                <CheckIcon className="size-3.5 stroke-2" />
                {intl.formatMessage(messages.acceptAllSuggestions)}
              </Button>
              <Button
                className={`
                  h-8 flex-1 gap-1.5 rounded-md border border-border
                  bg-background text-sm! font-semibold text-foreground
                  hover:bg-muted
                `}
                onClick={rejectAllSuggestions}
              >
                <XIcon className="size-3.5 text-muted-foreground" />
                {intl.formatMessage(messages.rejectAllSuggestions)}
              </Button>
            </div>
          </div>
        </React.Fragment>
      )}
      {/* === END CUSTOMIZATION === */}
    </React.Fragment>
  );

  return (
    <DiscussionPopover
      anchorElement={anchorElement}
      content={popoverContent}
      onOpenChange={(_open_) => {
        if (!_open_) {
          closePopover();
          return;
        }

        setOpen(_open_);
      }}
      open={open}
      trigger={
        totalCount > 0 ? (
          <DiscussionTriggerButton
            active={open}
            count={totalCount}
            kind={triggerKind}
          />
        ) : null
      }
    >
      {children}
    </DiscussionPopover>
  );
};

function BlockComment({
  discussion,
  isLast,
}: {
  discussion: TDiscussion;
  isLast: boolean;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const createFormRef = React.useRef<CommentCreateFormHandle>(null);

  return (
    <React.Fragment key={discussion.id}>
      <div className="px-4 pt-1 pb-3.5">
        {discussion.comments.map((comment, index) => (
          <Comment
            key={comment.id ?? index}
            comment={comment}
            discussionLength={discussion.comments.length}
            documentContent={discussion?.documentContent}
            editingId={editingId}
            index={index}
            onReply={
              index === 0 ? () => createFormRef.current?.focus() : undefined
            }
            setEditingId={setEditingId}
            showDocumentContent
          />
        ))}
        <CommentCreateForm ref={createFormRef} discussionId={discussion.id} />
      </div>

      {!isLast && <div className="h-px w-full bg-muted" />}
    </React.Fragment>
  );
}

const useResolvedDiscussion = (
  commentNodes: NodeEntry<TCommentText>[],
  blockPath: Path,
) => {
  const { api, getOption, setOption } = useEditorPlugin(commentPlugin);
  const { discussions } = usePlatePlugins();

  commentNodes.forEach(([node]) => {
    const id = api.comment.nodeId(node);
    const map = getOption('uniquePathMap');

    if (!id) return;

    const previousPath = map.get(id);

    // If there are no comment nodes in the corresponding path in the map, then update it.
    if (PathApi.isPath(previousPath)) {
      const nodes = api.comment.node({ id, at: previousPath });

      if (!nodes) {
        setOption('uniquePathMap', new Map(map).set(id, blockPath));
        return;
      }

      return;
    }
    // TODO: fix throw error
    setOption('uniquePathMap', new Map(map).set(id, blockPath));
  });

  const commentsIds = new Set(
    commentNodes.map(([node]) => api.comment.nodeId(node)).filter(Boolean),
  );

  const resolvedDiscussions = discussions
    .map((d: TDiscussion) => ({
      ...d,
      createdAt: new Date(d.createdAt),
    }))
    .filter((item: TDiscussion) => {
      /** If comment cross blocks just show it in the first block */
      const commentsPathMap = getOption('uniquePathMap');
      const firstBlockPath = commentsPathMap.get(item.id);

      if (!firstBlockPath) return false;
      if (!PathApi.equals(firstBlockPath, blockPath)) return false;

      return (
        api.comment.has({ id: item.id }) &&
        commentsIds.has(item.id) &&
        !item.isResolved
      );
    });

  return resolvedDiscussions;
};
