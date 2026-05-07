import type { TDiscussion } from '@plone/plate/components/editor/plugins/discussion-kit';

type DiscussionRecord = Record<string, TDiscussion>;

type RawDiscussionUser = {
  id: string;
  fullname?: string;
  name?: string;
  portrait?: string;
  avatarUrl?: string;
  hue?: number;
};

export type DiscussionUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  hue?: number;
};

export const normalizeDiscussions = (
  discussions:
    | DiscussionRecord
    | Record<string, unknown>
    | TDiscussion[]
    | undefined,
): TDiscussion[] => {
  if (!discussions) return [];

  return Array.isArray(discussions)
    ? discussions
    : (Object.values(discussions) as TDiscussion[]);
};

export const serializeDiscussions = (
  discussions: TDiscussion[] | undefined,
): DiscussionRecord => {
  return (discussions ?? []).reduce<DiscussionRecord>((acc, discussion) => {
    acc[discussion.id] = discussion;
    return acc;
  }, {});
};

export const normalizeUsers = (
  users: Record<string, RawDiscussionUser> | undefined,
): Record<string, DiscussionUser> => {
  if (!users) return {};

  return Object.fromEntries(
    Object.entries(users).map(([id, user]) => [
      id,
      {
        id,
        avatarUrl: user.avatarUrl ?? user.portrait,
        hue: user.hue,
        name: user.name ?? user.fullname ?? id,
      },
    ]),
  );
};
