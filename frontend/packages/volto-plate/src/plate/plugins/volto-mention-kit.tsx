import * as React from 'react';

import type {
  SlateElementProps,
  TComboboxInputElement,
  TMentionElement,
} from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { BaseMentionPlugin } from '@platejs/mention';
import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react';
import Api from '@plone/volto/helpers/Api/Api';
import { getBaseUrl } from '@plone/volto/helpers/Url/Url';
import { SlateElement } from 'platejs';
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import { useSelector } from 'react-redux';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from '@plone/plate/components/ui/inline-combobox';
import { cn } from '@plone/plate/lib/utils';

import PersonPill from '../../components/PersonPill/PersonPill';

type Mentionable = {
  id: string;
  fullname: string;
  portrait?: string | null;
};

const portraits = new Map<string, string | null>();
const RECENT_MENTIONS_KEY = '@plone/plate:recent-mentions';
const RECENT_MENTIONS_LIMIT = 5;

function getCurrentUserId(token?: string | null) {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload =
      normalizedPayload + '='.repeat((4 - (normalizedPayload.length % 4)) % 4);
    return (JSON.parse(atob(paddedPayload)) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

function getRecentMentionsKey(userId: string | null) {
  if (typeof window === 'undefined' || !userId) return null;

  return `${RECENT_MENTIONS_KEY}:${window.location.origin}:${userId}`;
}

function readRecentMentionIds(key: string | null) {
  if (!key || typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!Array.isArray(stored)) return [];

    return [
      ...new Set(stored.filter((id): id is string => typeof id === 'string')),
    ].slice(0, RECENT_MENTIONS_LIMIT);
  } catch {
    return [];
  }
}

function saveRecentMentionId(key: string | null, userId: string) {
  if (!key || typeof window === 'undefined') return;

  try {
    const ids = readRecentMentionIds(key);
    localStorage.setItem(
      key,
      JSON.stringify(
        [userId, ...ids.filter((id) => id !== userId)].slice(
          0,
          RECENT_MENTIONS_LIMIT,
        ),
      ),
    );
  } catch {
    // Private browsing or quota limits should not prevent mentioning users.
  }
}

const makeMentionId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function MentionPill({
  children,
  portrait,
  prefix,
  resolvePortrait = true,
  userId,
  value,
}: React.PropsWithChildren<{
  portrait?: string | null;
  prefix?: string;
  resolvePortrait?: boolean;
  userId?: string;
  value: string;
}>) {
  const [currentPortrait, setCurrentPortrait] = React.useState(portrait);

  React.useEffect(() => {
    if (!resolvePortrait || !userId) return;

    const cachedPortrait = portraits.get(userId);
    if (cachedPortrait !== undefined) {
      setCurrentPortrait(cachedPortrait);
      return;
    }

    const contextPath = getBaseUrl(window.location.pathname) || '/';
    const api = new Api() as any;
    api
      .get(`${contextPath}/@mentions`, { params: { id: userId } })
      .then((response) => {
        const resolvedPortrait = response.items?.[0]?.portrait ?? null;
        portraits.set(userId, resolvedPortrait);
        setCurrentPortrait(resolvedPortrait);
      })
      // Keep the persisted value if the current user cannot resolve it.
      .catch(() => setCurrentPortrait(portrait));
  }, [portrait, resolvePortrait, userId]);

  return (
    <>
      <PersonPill
        compact
        fullname={`${prefix ?? ''}${value}`}
        id={userId ?? ''}
        portrait={currentPortrait ?? undefined}
      />
      {children}
    </>
  );
}

export function VoltoMentionElement(
  props: PlateElementProps<TMentionElement> & { prefix?: string },
) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-2 pl-0.5 align-baseline text-sm font-medium',
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-2 ring-ring',
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-plate-mention-id': element.mentionId,
        'data-slate-value': element.value,
        draggable: true,
        id: element.mentionId
          ? `plate-mention-${element.mentionId}`
          : undefined,
      }}
    >
      <MentionPill
        portrait={element.portrait}
        prefix={props.prefix}
        userId={element.key}
        value={element.value}
      >
        {props.children}
      </MentionPill>
    </PlateElement>
  );
}

export function VoltoMentionElementStatic(
  props: SlateElementProps<TMentionElement> & { prefix?: string },
) {
  const { element } = props;

  return (
    <SlateElement
      {...props}
      className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-2 pl-0.5 align-baseline text-sm font-medium"
      attributes={{
        ...props.attributes,
        'data-plate-mention-id': element.mentionId,
        'data-slate-value': element.value,
        id: element.mentionId
          ? `plate-mention-${element.mentionId}`
          : undefined,
      }}
    >
      <MentionPill
        portrait={element.portrait}
        prefix={props.prefix}
        userId={element.key}
        value={element.value}
      >
        {props.children}
      </MentionPill>
    </SlateElement>
  );
}

export function VoltoMentionInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const token = useSelector((state: any) => state.userSession?.token);
  const currentUserId = React.useMemo(() => getCurrentUserId(token), [token]);
  const recentMentionsKey = React.useMemo(
    () => getRecentMentionsKey(currentUserId),
    [currentUserId],
  );
  const [search, setSearch] = React.useState('');
  const [items, setItems] = React.useState<Mentionable[]>([]);

  React.useEffect(() => {
    const normalizedSearch = search.trim();
    if (!normalizedSearch) {
      const recentIds = readRecentMentionIds(recentMentionsKey);
      if (!recentIds.length) {
        setItems([]);
        return undefined;
      }

      const contextPath = getBaseUrl(window.location.pathname) || '/';
      const api = new Api() as any;
      Promise.all(
        recentIds.map((id) =>
          api
            .get(`${contextPath}/@mentions`, { params: { id } })
            .then((response) => response.items?.[0] ?? null)
            .catch(() => null),
        ),
      ).then((recentItems) =>
        setItems(recentItems.filter((item): item is Mentionable => !!item)),
      );
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const contextPath = getBaseUrl(window.location.pathname) || '/';
      const api = new Api() as any;
      api
        .get(`${contextPath}/@mentions`, {
          params: { search: normalizedSearch, limit: 25 },
        })
        .then((response) => setItems(response.items ?? []))
        .catch(() => setItems([]));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [recentMentionsKey, search]);

  const selectItem = React.useCallback(
    (item: Mentionable) => {
      const mentionId = makeMentionId();
      saveRecentMentionId(recentMentionsKey, item.id);
      (editor.tf as any).insert.mention({
        key: item.id,
        search,
        value: item.fullname,
      } as any);
      const mentionPath = editor.selection?.anchor.path.slice(0, -1);
      if (mentionPath) {
        editor.tf.setNodes(
          { mentionId, portrait: item.portrait ?? undefined } as any,
          { at: mentionPath },
        );
      }
      editor.tf.move({ unit: 'offset' });
    },
    [editor, recentMentionsKey, search],
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        element={element}
        filter={false}
        setValue={setSearch}
        showTrigger
        trigger="@"
        value={search}
      >
        <span className="inline-flex items-baseline align-baseline text-sm">
          <InlineComboboxInput />
        </span>
        <InlineComboboxContent className="my-1.5 w-80 p-2">
          <InlineComboboxEmpty>
            {search.trim() ? 'No matching users' : 'Type to search people'}
          </InlineComboboxEmpty>
          <InlineComboboxGroup>
            <InlineComboboxGroupLabel>
              {search.trim() ? 'Mention people' : 'Recently mentioned'}
            </InlineComboboxGroupLabel>
            {items.map((item) => (
              <InlineComboboxItem
                className="h-auto min-h-9 rounded-full p-0 hover:bg-transparent data-[active-item=true]:bg-transparent"
                key={item.id}
                keywords={[item.id]}
                onClick={() => selectItem(item)}
                value={item.fullname}
              >
                <span className="mention-option flex w-full items-center gap-2 rounded-full bg-muted py-1 pr-3 pl-1 text-sm font-medium data-[active-item=true]:bg-accent">
                  <MentionPill
                    portrait={item.portrait}
                    resolvePortrait={false}
                    userId={item.id}
                    value={item.fullname}
                  />
                </span>
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>
      {props.children}
    </PlateElement>
  );
}

export const VoltoMentionKit = [
  MentionPlugin.configure({
    options: { triggerPreviousCharPattern: /^$|^[\s"']$/ },
  }).withComponent(VoltoMentionElement),
  MentionInputPlugin.withComponent(VoltoMentionInputElement),
];

export const VoltoMentionBaseKit = [
  BaseMentionPlugin.withComponent(VoltoMentionElementStatic),
];
