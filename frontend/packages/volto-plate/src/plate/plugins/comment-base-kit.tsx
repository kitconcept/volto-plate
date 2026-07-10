import * as React from 'react';

import type { RenderNodeWrapper } from 'platejs/react';

import { flushSync } from 'react-dom';
import {
  type AnyPluginConfig,
  type NodeEntry,
  type Path,
  type TCommentText,
  PathApi,
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
import { Comment } from '@plone/plate/components/ui/comment';
import { usePlatePlugins } from '@plone/plate/components/editor/plate-plugins-context';
import { commentPlugin } from '@plone/plate/components/editor/plugins/comment-kit';
import type { TDiscussion } from '@plone/plate/components/editor/plugins/discussion-kit';

const ReadOnlyBlockDiscussion: RenderNodeWrapper<AnyPluginConfig> = (props) => {
  const { editor, element } = props;
  const blockPath = editor.api.findPath(element);

  if (!blockPath || blockPath.length > 1) return;

  const commentNodes = [
    ...editor.getApi(commentPlugin).comment.nodes({ at: blockPath }),
  ];

  if (commentNodes.length === 0) return;

  // eslint-disable-next-line react/display-name
  return (props) => (
    <ReadOnlyBlockCommentContent
      blockPath={blockPath}
      commentNodes={commentNodes}
      {...props}
    />
  );
};

export const readOnlyDiscussionPlugin = createPlatePlugin({
  key: 'readOnlyDiscussion',
}).configure({
  render: { belowNodes: ReadOnlyBlockDiscussion },
});

export const BaseCommentKit = [readOnlyDiscussionPlugin, commentPlugin];

const ReadOnlyBlockCommentContent = ({
  blockPath,
  children,
  commentNodes,
}: React.PropsWithChildren<{
  blockPath: Path;
  commentNodes: NodeEntry<TCommentText>[];
}>) => {
  const editor = useEditorRef();
  const { api, setOption } = useEditorPlugin(commentPlugin);
  const resolvedDiscussions = useResolvedDiscussion(commentNodes, blockPath);
  const discussionButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const activeCommentId = usePluginOption(commentPlugin, 'activeId');
  const activeDiscussion =
    activeCommentId &&
    resolvedDiscussions.find((discussion) => discussion.id === activeCommentId);
  const selected = resolvedDiscussions.some(
    (discussion) => discussion.id === activeCommentId,
  );
  const [_open, setOpen] = React.useState(selected);
  const [clickedAnchorElement, setClickedAnchorElement] =
    React.useState<HTMLElement | null>(null);
  const [triggerAnchorElement, setTriggerAnchorElement] =
    React.useState<HTMLElement | null>(null);
  const open = _open || selected;
  const discussions = activeDiscussion
    ? [activeDiscussion]
    : [...resolvedDiscussions].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

  const activeAnchorElement = React.useMemo(() => {
    if (!activeCommentId) return null;

    const activeNode = commentNodes.find(
      ([node]) =>
        editor.getApi(commentPlugin).comment.nodeId(node) === activeCommentId,
    );

    if (!activeNode) return null;

    return editor.api.toDOMNode(activeNode[0])!;
  }, [activeCommentId, commentNodes, editor]);
  const anchorElement =
    clickedAnchorElement ?? activeAnchorElement ?? triggerAnchorElement;

  if (resolvedDiscussions.length === 0) {
    return <div className="w-full">{children}</div>;
  }

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const commentElement = target.closest('.slate-comment');

    if (!(commentElement instanceof HTMLElement)) return;

    const matchingNode =
      commentNodes.find(([node]) => {
        const domNode = editor.api.toDOMNode(node);

        return domNode?.contains(commentElement);
      }) ??
      commentNodes.find(([node]) => {
        const id = api.comment.nodeId(node);

        return (
          !!id && resolvedDiscussions.some((discussion) => discussion.id === id)
        );
      });

    if (!matchingNode) return;

    const [node] = matchingNode;
    const id = api.comment.nodeId(node);

    flushSync(() => {
      setClickedAnchorElement(commentElement);
      setTriggerAnchorElement(null);
      setOpen(!!id);
    });
    setOption('activeId', id ?? null);
  };

  const closePopover = () => {
    setOpen(false);
    setClickedAnchorElement(null);
    setTriggerAnchorElement(null);
    setOption('activeId', null);
  };

  const popoverContent = (
    <React.Fragment>
      <DiscussionPopoverHeader
        count={
          activeDiscussion
            ? activeDiscussion.comments.length
            : resolvedDiscussions.length
        }
        onClose={closePopover}
        title="Comments"
      />
      {discussions.map((discussion, index) => (
        <React.Fragment key={discussion.id}>
          <ReadOnlyBlockComment discussion={discussion} />
          {index < discussions.length - 1 && (
            <div className="h-px w-full bg-muted" />
          )}
        </React.Fragment>
      ))}
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
          setOption('activeId', null);
        }
      }}
      open={open}
      trigger={
        <DiscussionTriggerButton
          ref={discussionButtonRef}
          active={open}
          count={resolvedDiscussions.length}
          kind="comments"
          onClick={() => {
            setClickedAnchorElement(null);
            setTriggerAnchorElement(discussionButtonRef.current);
            setOption('activeId', null);
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
    <div className="px-6 pb-5">
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
