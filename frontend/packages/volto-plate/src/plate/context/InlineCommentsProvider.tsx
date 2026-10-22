import * as React from 'react';

import type { Value } from 'platejs';
import Api from '@plone/volto/helpers/Api/Api';
import { useSelector } from 'react-redux';

import { SOMERSAULT_KEY } from '../../constants';
import { getCurrentUserFromToken } from './PlatePluginsProvider';

export type InlineCommentAnchor = {
  blockId?: string;
  end: { offset: number; path: number[] };
  start: { offset: number; path: number[] };
  text: string;
};

export type InlineCommentLock = {
  created?: string;
  creator?: string;
  creator_name?: string;
  creator_portrait?: string;
  creator_url?: string;
  locked?: boolean;
};

type InlineCommentsCapabilities = {
  canComment: boolean;
  lock?: InlineCommentLock;
};

type InlineCommentsContextValue = {
  canComment: boolean;
  canMutate: boolean;
  currentUserId: string | null;
  error: string | null;
  lock: InlineCommentLock;
  locked: boolean;
  pending: boolean;
  clearError: () => void;
  create: (anchor: InlineCommentAnchor, contentRich: Value) => Promise<void>;
  deleteComment: (discussionId: string, commentId: string) => Promise<void>;
  edit: (
    discussionId: string,
    commentId: string,
    contentRich: Value,
  ) => Promise<void>;
  reply: (discussionId: string, contentRich: Value) => Promise<void>;
  setResolved: (discussionId: string, isResolved: boolean) => Promise<void>;
};

const InlineCommentsContext = React.createContext<
  InlineCommentsContextValue | undefined
>(undefined);

const errorMessage = (error: any) =>
  error?.response?.body?.error?.message ??
  error?.response?.body?.message ??
  error?.message ??
  'Unable to save the comment.';

export function InlineCommentsProvider({
  children,
  contentPath,
  initiallyLocked = false,
  onBlockChange,
}: React.PropsWithChildren<{
  contentPath: string;
  initiallyLocked?: boolean;
  onBlockChange: (block: Record<string, unknown>) => void;
}>) {
  const token = useSelector((state: any) => state.userSession?.token);
  const currentUser = React.useMemo(
    () => getCurrentUserFromToken(token),
    [token],
  );
  const [canComment, setCanComment] = React.useState(false);
  const [lock, setLock] = React.useState<InlineCommentLock>({
    locked: initiallyLocked,
  });
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const endpoint = `${contentPath}/@inline-comments`;

  const applyCapabilities = React.useCallback(
    (response: InlineCommentsCapabilities) => {
      setCanComment(!!response.canComment);
      setLock(response.lock ?? { locked: false });
    },
    [],
  );

  React.useEffect(() => {
    let active = true;
    const api = new Api() as any;

    api
      .get(`${endpoint}?_=${Date.now()}`)
      .then((response: InlineCommentsCapabilities) => {
        if (active) applyCapabilities(response);
      })
      .catch(() => {
        // The serialized page remains fully readable if capability discovery
        // fails. Mutations stay disabled until a successful response.
      });

    return () => {
      active = false;
    };
  }, [applyCapabilities, endpoint]);

  const mutate = React.useCallback(
    async (
      method: 'del' | 'patch' | 'post',
      suffix: string,
      data?: Record<string, unknown>,
    ) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      setError(null);
      try {
        const api = new Api() as any;
        const response = (await api[method](`${endpoint}${suffix}`, {
          data,
        })) as InlineCommentsCapabilities;
        applyCapabilities(response);

        const content = (await api.get(contentPath)) as {
          blocks?: Record<string, Record<string, unknown>>;
        };
        const block = content.blocks?.[SOMERSAULT_KEY];
        if (!block)
          throw new Error('The content does not contain a Plate document.');
        onBlockChange(block);
      } catch (requestError: any) {
        if (requestError?.status === 403)
          setLock((current) => ({ ...current, locked: true }));
        const message = errorMessage(requestError);
        setError(message);
        throw requestError;
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    },
    [applyCapabilities, contentPath, endpoint, onBlockChange],
  );

  const value = React.useMemo<InlineCommentsContextValue>(
    () => ({
      canMutate: !!currentUser?.id && canComment && !lock.locked,
      canComment,
      clearError: () => setError(null),
      create: (anchor, contentRich) =>
        mutate('post', '', { anchor, contentRich }),
      currentUserId: currentUser?.id ?? null,
      deleteComment: (discussionId, commentId) =>
        mutate('del', `/${discussionId}/${commentId}`),
      edit: (discussionId, commentId, contentRich) =>
        mutate('patch', `/${discussionId}/${commentId}`, { contentRich }),
      error,
      lock,
      locked: !!lock.locked,
      pending,
      reply: (discussionId, contentRich) =>
        mutate('post', `/${discussionId}`, { contentRich }),
      setResolved: (discussionId, isResolved) =>
        mutate('patch', `/${discussionId}`, { isResolved }),
    }),
    [canComment, currentUser?.id, error, lock, mutate, pending],
  );

  return (
    <InlineCommentsContext.Provider value={value}>
      {children}
    </InlineCommentsContext.Provider>
  );
}

export const useInlineComments = () => React.useContext(InlineCommentsContext);
