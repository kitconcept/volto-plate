import * as React from 'react';

import type { TCommentText } from 'platejs';
import type { PlateLeafProps } from 'platejs/react';

import {
  getCommentCount,
  getCommentKeyId,
  getCommentKeys,
} from '@platejs/comment';
import { CheckIcon } from 'lucide-react';
import { PlateLeaf, useEditorPlugin, usePluginOption } from 'platejs/react';
import { useIntl } from 'react-intl';

import { Button } from '@plone/plate/components/ui/button';
import { usePlatePlugins } from '@plone/plate/components/editor/plate-plugins-context';
import { commentPlugin } from '@plone/plate/components/editor/plugins/comment-kit';
import type { TDiscussion } from '@plone/plate/components/editor/plugins/discussion-kit';
import { cn } from '@plone/plate/lib/utils';

import { messages } from '../../index';

/**
 * Resolving a discussion archives it: the thread and its text anchor are
 * kept, and the backend stamps who resolved it and when.
 */
export type TArchivableDiscussion = TDiscussion & {
  resolvedAt?: string;
  resolvedBy?: string;
};

export const useDiscussionResolution = () => {
  const { currentUserId, setDiscussions } = usePlatePlugins();

  const setResolved = React.useCallback(
    (id: string, isResolved: boolean) => {
      setDiscussions((discussions) =>
        discussions.map((discussion: TArchivableDiscussion) => {
          if (discussion.id !== id) return discussion;
          const { resolvedAt, resolvedBy, ...rest } = discussion;
          return isResolved
            ? { ...rest, isResolved, resolvedBy: currentUserId ?? undefined }
            : { ...rest, isResolved };
        }),
      );
    },
    [currentUserId, setDiscussions],
  );

  return {
    canResolve: !!currentUserId,
    reopen: (id: string) => setResolved(id, false),
    resolve: (id: string) => setResolved(id, true),
  };
};

export function ResolveDiscussionButton({ onClick }: { onClick: () => void }) {
  const intl = useIntl();

  return (
    <Button
      className={`
        h-[26px] gap-[5px] rounded-[2px] border border-border bg-background
        px-[9px] text-[12.5px]! font-semibold text-foreground shadow-none
        hover:bg-muted
        has-[>svg]:px-[9px]
      `}
      onClick={onClick}
      size="sm"
      type="button"
      variant="outline"
    >
      <CheckIcon aria-hidden className="size-[12px]" strokeWidth={2.6} />
      {intl.formatMessage(messages.resolveDiscussion)}
    </Button>
  );
}

export function ResolvedDiscussionBanner({
  discussion,
  onReopen,
}: {
  discussion: TArchivableDiscussion;
  onReopen?: () => void;
}) {
  const intl = useIntl();
  const { users } = usePlatePlugins();
  const resolverId = discussion.resolvedBy;
  const name = resolverId ? users[resolverId]?.name ?? resolverId : '';

  return (
    <div
      className={`
        mt-[2px] mb-[8px] flex items-center gap-[8px] rounded-[2px]
        bg-muted px-[10px] py-[8px] text-[13px] text-muted-foreground
      `}
      data-testid="resolved-discussion-banner"
    >
      <svg
        aria-hidden="true"
        className="size-[15px] shrink-0 text-quanta-emerald"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.7 2.7L16 9.8" />
      </svg>
      <span className="min-w-0 flex-1">
        {name
          ? intl.formatMessage(messages.resolvedBy, { name })
          : intl.formatMessage(messages.resolved)}
      </span>
      {onReopen && (
        <button
          className={`
            shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[13px]!
            font-semibold text-brand
            hover:underline
          `}
          onClick={onReopen}
          type="button"
        >
          {intl.formatMessage(messages.reopenDiscussion)}
        </button>
      )}
    </div>
  );
}

/**
 * Comment mark that stays in the text after its discussion is resolved, but
 * drops the highlight colour so archived threads don't read as open work.
 */
export function VoltoCommentLeaf(props: PlateLeafProps<TCommentText>) {
  const { children, leaf } = props;

  const { api, setOption } = useEditorPlugin(commentPlugin);
  const { discussions } = usePlatePlugins();
  const hoverId = usePluginOption(commentPlugin, 'hoverId');
  const activeId = usePluginOption(commentPlugin, 'activeId');

  const isOverlapping = getCommentCount(leaf) > 1;
  const currentId = api.comment.nodeId(leaf);
  const isActive = activeId === currentId;
  const isHover = hoverId === currentId;

  const resolvedIds = new Set(
    discussions.filter((d) => d.isResolved).map((d) => d.id),
  );
  const ids = getCommentKeys(leaf).map(getCommentKeyId);
  const isResolved = ids.length > 0 && ids.every((id) => resolvedIds.has(id));

  return (
    <PlateLeaf
      {...props}
      className={cn(
        isResolved
          ? cn(
              'rounded-[2px] bg-quanta-smoke transition-colors duration-200',
              (isHover || isActive) && 'bg-quanta-silver/60',
            )
          : cn(
              'border-b-2 border-b-highlight/[.36] bg-highlight/[.13] transition-colors duration-200',
              (isHover || isActive) && 'border-b-highlight bg-highlight/25',
              isOverlapping &&
                'border-b-2 border-b-highlight/[.7] bg-highlight/25',
              (isHover || isActive) &&
                isOverlapping &&
                'border-b-highlight bg-highlight/45',
            ),
      )}
      attributes={{
        ...props.attributes,
        'data-comment-id': currentId ?? undefined,
        'data-comment-resolved': isResolved || undefined,
        onClick: () => setOption('activeId', currentId ?? null),
        onMouseEnter: () => setOption('hoverId', currentId ?? null),
        onMouseLeave: () => setOption('hoverId', null),
      }}
    >
      {children}
    </PlateLeaf>
  );
}

export const voltoCommentPlugin = commentPlugin.configure({
  node: { component: VoltoCommentLeaf },
});
