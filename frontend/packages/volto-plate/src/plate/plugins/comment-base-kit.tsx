import * as React from 'react';

import type { RenderNodeWrapper } from 'platejs/react';

import { flushSync } from 'react-dom';
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
import {
  createPlatePlugin,
  useEditorPlugin,
  useEditorRef,
  usePluginOption,
} from 'platejs/react';

import {
  DiscussionPopover,
  DiscussionPopoverHeader,
  DiscussionTriggerButton,
} from '@plone/plate/components/ui/block-discussion';
import {
  BlockSuggestionCard,
  isResolvedSuggestion,
  useResolveSuggestion,
} from '@plone/plate/components/ui/block-suggestion';
import { Comment } from '@plone/plate/components/ui/comment';
import { usePlatePlugins } from '@plone/plate/components/editor/plate-plugins-context';
import { commentPlugin } from '@plone/plate/components/editor/plugins/comment-kit';
import type { TDiscussion } from '@plone/plate/components/editor/plugins/discussion-kit';
import {
  SuggestionPlugin,
  suggestionPlugin,
} from '@plone/plate/components/editor/plugins/suggestion-kit';

const ReadOnlyBlockDiscussion: RenderNodeWrapper<AnyPluginConfig> = (props) => {
  const { editor, element } = props;
  const blockPath = editor.api.findPath(element);

  if (!blockPath || blockPath.length > 1) return;

  const commentNodes = [
    ...editor.getApi(commentPlugin).comment.nodes({ at: blockPath }),
  ];

  // Persisted view-mode data has no transient (in-progress) suggestions, so the
  // full node list can be used directly.
  const suggestionNodes = [
    ...editor.getApi(SuggestionPlugin).suggestion.nodes({ at: blockPath }),
  ];

  if (commentNodes.length === 0 && suggestionNodes.length === 0) return;

  // eslint-disable-next-line react/display-name
  return (props) => (
    <ReadOnlyBlockDiscussionContent
      blockPath={blockPath}
      commentNodes={commentNodes}
      suggestionNodes={suggestionNodes}
      {...props}
    />
  );
};

export const readOnlyDiscussionPlugin = createPlatePlugin({
  key: 'readOnlyDiscussion',
}).configure({
  render: { belowNodes: ReadOnlyBlockDiscussion },
});

// The renderer registers the interactive comment and suggestion plugins so the
// read-only popover can resolve persisted metadata (comment ids, suggestion
// paths) through the same plugin options the editor uses.
export const BaseCommentKit = [
  readOnlyDiscussionPlugin,
  commentPlugin,
  suggestionPlugin,
];

const ReadOnlyBlockDiscussionContent = ({
  blockPath,
  children,
  commentNodes,
  suggestionNodes,
}: React.PropsWithChildren<{
  blockPath: Path;
  commentNodes: NodeEntry<TCommentText>[];
  suggestionNodes: NodeEntry<TElement | TSuggestionText>[];
}>) => {
  const editor = useEditorRef();
  const { setOption: setCommentOption } = useEditorPlugin(commentPlugin);
  const { setOption: setSuggestionOption } = useEditorPlugin(suggestionPlugin);
  const resolvedDiscussions = useResolvedDiscussion(commentNodes, blockPath);
  const resolvedSuggestions = useResolveSuggestion(suggestionNodes, blockPath);

  const discussionButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const activeCommentId = usePluginOption(commentPlugin, 'activeId');
  const activeSuggestionId = usePluginOption(suggestionPlugin, 'activeId');

  const activeDiscussion =
    activeCommentId &&
    resolvedDiscussions.find((discussion) => discussion.id === activeCommentId);
  const activeSuggestion =
    activeSuggestionId &&
    resolvedSuggestions.find((s) => s.suggestionId === activeSuggestionId);

  const suggestionsCount = resolvedSuggestions.length;
  const discussionsCount = resolvedDiscussions.length;
  const totalCount = suggestionsCount + discussionsCount;

  const triggerKind =
    suggestionsCount > 0 && discussionsCount === 0
      ? 'suggestions'
      : discussionsCount > 0 && suggestionsCount === 0
        ? 'comments'
        : 'mixed';
  const popoverTitle =
    triggerKind === 'suggestions'
      ? 'Suggestions'
      : triggerKind === 'comments'
        ? 'Comments'
        : 'Comments & Suggestions';

  const noneActive = !activeDiscussion && !activeSuggestion;
  const popoverHeaderCount = noneActive
    ? totalCount
    : activeDiscussion
      ? activeDiscussion.comments.length
      : 1;

  const sortedMergedData = [
    ...resolvedDiscussions,
    ...resolvedSuggestions,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const selected =
    resolvedDiscussions.some((d) => d.id === activeCommentId) ||
    resolvedSuggestions.some((s) => s.suggestionId === activeSuggestionId);
  const [_open, setOpen] = React.useState(selected);
  const [clickedAnchorElement, setClickedAnchorElement] =
    React.useState<HTMLElement | null>(null);
  const [triggerAnchorElement, setTriggerAnchorElement] =
    React.useState<HTMLElement | null>(null);
  const open = _open || selected;

  const activeAnchorElement = React.useMemo(() => {
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
      activeNode = commentNodes.find(
        ([node]) =>
          editor.getApi(commentPlugin).comment.nodeId(node) === activeCommentId,
      );
    }

    if (!activeNode) return null;

    return editor.api.toDOMNode(activeNode[0]) ?? null;
  }, [
    activeCommentId,
    activeSuggestion,
    commentNodes,
    editor,
    suggestionNodes,
  ]);
  const anchorElement =
    clickedAnchorElement ?? activeAnchorElement ?? triggerAnchorElement;

  const resetActive = React.useCallback(() => {
    setCommentOption('activeId', null);
    setSuggestionOption('activeId', null);
  }, [setCommentOption, setSuggestionOption]);

  if (totalCount === 0) {
    return <div className="w-full">{children}</div>;
  }

  // Resolve the id of the mark that was actually clicked. The leaf stamps its
  // id onto the DOM (`data-comment-id` / `data-suggestion-id`), which is the
  // reliable source in read-only render mode where `toDOMNode` cannot map the
  // captured node back to its element (so every mark would otherwise resolve to
  // the first one in the block).
  const findClickedMarkId = (
    markElement: HTMLElement,
    dataAttribute: 'data-comment-id' | 'data-suggestion-id',
    isResolved: (id: string) => boolean,
  ): string | null => {
    const stamped = markElement
      .closest(`[${dataAttribute}]`)
      ?.getAttribute(dataAttribute);

    return stamped && isResolved(stamped) ? stamped : null;
  };

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const commentElement = target.closest('.slate-comment');

    if (commentElement instanceof HTMLElement) {
      const id = findClickedMarkId(commentElement, 'data-comment-id', (value) =>
        resolvedDiscussions.some((discussion) => discussion.id === value),
      );

      flushSync(() => {
        setClickedAnchorElement(commentElement);
        setTriggerAnchorElement(null);
        setOpen(!!id);
      });
      setSuggestionOption('activeId', null);
      setCommentOption('activeId', id);

      return;
    }

    const suggestionElement = target.closest('.slate-suggestion');

    if (suggestionElement instanceof HTMLElement) {
      const id = findClickedMarkId(
        suggestionElement,
        'data-suggestion-id',
        (value) => resolvedSuggestions.some((s) => s.suggestionId === value),
      );

      flushSync(() => {
        setClickedAnchorElement(suggestionElement);
        setTriggerAnchorElement(null);
        setOpen(!!id);
      });
      setCommentOption('activeId', null);
      setSuggestionOption('activeId', id);
    }
  };

  const closePopover = () => {
    setOpen(false);
    setClickedAnchorElement(null);
    setTriggerAnchorElement(null);
    resetActive();
  };

  const renderCard = (
    item: TDiscussion | (typeof resolvedSuggestions)[number],
    index: number,
    isLast: boolean,
  ) =>
    isResolvedSuggestion(item) ? (
      <BlockSuggestionCard
        key={item.suggestionId}
        idx={index}
        isLast={isLast}
        suggestion={item}
      />
    ) : (
      <React.Fragment key={item.id}>
        <ReadOnlyBlockComment discussion={item} />
        {!isLast && <div className="h-px w-full bg-muted" />}
      </React.Fragment>
    );

  const popoverContent = (
    <React.Fragment>
      <DiscussionPopoverHeader
        count={popoverHeaderCount}
        onClose={closePopover}
        title={popoverTitle}
      />
      {noneActive
        ? sortedMergedData.map((item, index) =>
            renderCard(item, index, index === sortedMergedData.length - 1),
          )
        : activeSuggestion
          ? renderCard(activeSuggestion, 0, true)
          : activeDiscussion
            ? renderCard(activeDiscussion, 0, true)
            : null}
    </React.Fragment>
  );

  return (
    <DiscussionPopover
      anchorAsChild={false}
      anchorElement={anchorElement}
      content={popoverContent}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setClickedAnchorElement(null);
          setTriggerAnchorElement(null);
          resetActive();
        }
      }}
      open={open}
      trigger={
        <DiscussionTriggerButton
          ref={discussionButtonRef}
          active={open}
          count={totalCount}
          kind={triggerKind}
          onClick={() => {
            setClickedAnchorElement(null);
            setTriggerAnchorElement(discussionButtonRef.current);
            resetActive();
            setOpen((currentOpen) => !currentOpen);
          }}
        />
      }
      triggerAsPopoverTrigger={false}
      wrapperProps={{ onClickCapture: handleContentClick }}
    >
      {children}
    </DiscussionPopover>
  );
};

function ReadOnlyBlockComment({ discussion }: { discussion: TDiscussion }) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  return (
    <div className="px-4 pt-1 pb-3.5">
      {discussion.comments.map((comment, index) => (
        <Comment
          key={comment.id ?? index}
          comment={comment}
          discussionLength={discussion.comments.length}
          documentContent={discussion.documentContent}
          editingId={editingId}
          index={index}
          setEditingId={setEditingId}
          showDocumentContent
        />
      ))}
    </div>
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

    if (PathApi.isPath(previousPath)) {
      const nodes = api.comment.node({ id, at: previousPath });

      if (!nodes) {
        setOption('uniquePathMap', new Map(map).set(id, blockPath));
      }

      return;
    }

    setOption('uniquePathMap', new Map(map).set(id, blockPath));
  });

  const commentIds = new Set(
    commentNodes.map(([node]) => api.comment.nodeId(node)).filter(Boolean),
  );

  return discussions
    .map((discussion: TDiscussion) => ({
      ...discussion,
      createdAt: new Date(discussion.createdAt),
    }))
    .filter((discussion: TDiscussion) => {
      const commentsPathMap = getOption('uniquePathMap');
      const firstBlockPath = commentsPathMap.get(discussion.id);

      if (!firstBlockPath) return false;
      if (!PathApi.equals(firstBlockPath, blockPath)) return false;

      return (
        api.comment.has({ id: discussion.id }) &&
        commentIds.has(discussion.id) &&
        !discussion.isResolved
      );
    });
};
