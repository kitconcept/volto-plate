import React from 'react';
import { useSelector } from 'react-redux';

import { PlatePluginsProvider as BasePlatePluginsProvider } from '@plone/plate/components/editor/plate-plugins-context';
import type {
  TDiscussion,
  TDiscussionUser,
} from '@plone/plate/components/editor/plugins/discussion-kit';

type AuthTokenPayload = {
  fullname?: string;
  sub?: string;
};

type PlatePluginsProviderProps = React.PropsWithChildren<{
  initialDiscussions: TDiscussion[];
  initialUsers: Record<string, TDiscussionUser>;
  onDiscussionsChange?: (discussions: TDiscussion[]) => void;
  readOnly?: boolean;
}>;

export const getCurrentUserFromToken = (
  token?: string | null,
): TDiscussionUser | null => {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');

    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload =
      normalizedPayload + '='.repeat((4 - (normalizedPayload.length % 4)) % 4);
    const decoded = JSON.parse(atob(paddedPayload)) as AuthTokenPayload;
    const id = decoded.sub;

    if (!id) return null;

    return {
      id,
      name: decoded.fullname ?? id,
    };
  } catch {
    return null;
  }
};

export function PlatePluginsProvider({
  children,
  initialDiscussions,
  initialUsers,
  onDiscussionsChange,
  readOnly = false,
}: PlatePluginsProviderProps) {
  const token = useSelector((state: any) => state.userSession?.token);
  const currentUser = React.useMemo(
    () => getCurrentUserFromToken(token),
    [token],
  );
  const [discussions, setDiscussionsState] =
    React.useState<TDiscussion[]>(initialDiscussions);

  React.useEffect(() => {
    setDiscussionsState(initialDiscussions);
  }, [initialDiscussions]);

  const setDiscussions = React.useCallback<
    React.Dispatch<React.SetStateAction<TDiscussion[]>>
  >(
    (value) => {
      setDiscussionsState((previous) => {
        const next = typeof value === 'function' ? value(previous) : value;
        onDiscussionsChange?.(next);
        return next;
      });
    },
    [onDiscussionsChange],
  );
  const resolvedUsers = React.useMemo(() => {
    if (!currentUser) {
      return initialUsers;
    }

    return {
      ...initialUsers,
      [currentUser.id]: {
        ...initialUsers[currentUser.id],
        ...currentUser,
      },
    };
  }, [currentUser, initialUsers]);

  const value = React.useMemo(
    () => ({
      currentUser: readOnly ? null : currentUser,
      currentUserId: readOnly ? null : currentUser?.id ?? null,
      discussions,
      setDiscussions,
      users: resolvedUsers,
    }),
    [currentUser, discussions, readOnly, resolvedUsers, setDiscussions],
  );

  return (
    <BasePlatePluginsProvider value={value}>
      {children}
    </BasePlatePluginsProvider>
  );
}
