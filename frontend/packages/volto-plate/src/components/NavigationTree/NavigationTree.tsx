import React, { useState, useEffect, useCallback, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { Key } from 'react-aria-components';
import { TreeItem } from 'react-aria-components';
import { Tree, TreeItemContent } from '@plone/components';
import { SearchIcon, ColumnbeforeIcon } from '@plone/components/Icons';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { searchContent } from '@plone/volto/actions/search/search';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { getContentIcon } from '@plone/volto/helpers/Content/Content';
import config from '@plone/volto/registry';
import globeSVG from '@plone/volto/icons/globe.svg';

export const messages = defineMessages({
  openNavigation: {
    id: 'navigation_tree_open_navigation',
    defaultMessage: 'Open navigation',
  },
  siteLabel: {
    id: 'navigation_tree_site_label',
    defaultMessage: 'SITE',
  },
  navigationLabel: {
    id: 'navigation_tree_navigation_label',
    defaultMessage: 'NAVIGATION',
  },
  searchPlaceholder: {
    id: 'navigation_tree_search_placeholder',
    defaultMessage: 'Search by title...',
  },
  searchAriaLabel: {
    id: 'navigation_tree_search_aria_label',
    defaultMessage: 'Search navigation by title',
  },
  clearSearch: {
    id: 'navigation_tree_clear_search',
    defaultMessage: 'Clear search',
  },
  closePanel: {
    id: 'navigation_tree_close_panel',
    defaultMessage: 'Close navigation tree',
  },
  siteNavigation: {
    id: 'navigation_tree_site_navigation',
    defaultMessage: 'Site navigation',
  },
  searchResults: {
    id: 'navigation_tree_search_results',
    defaultMessage: 'Search results',
  },
  loading: {
    id: 'navigation_tree_loading',
    defaultMessage: 'Loading…',
  },
  noResults: {
    id: 'navigation_tree_no_results',
    defaultMessage: 'No results found',
  },
  resizePanel: {
    id: 'navigation_tree_resize_panel',
    defaultMessage: 'Resize navigation panel',
  },
});

interface SearchItem {
  '@id': string;
  '@type': string;
  title: string;
  is_folderish: boolean;
  review_state: string;
}

interface NavigationTreeProps {
  siteTitle: string;
  siteUrl: string;
  onClose: () => void;
}

function getStateColor(reviewState: string): string {
  const workflowMapping: Record<string, { color?: string }> =
    config.settings.workflowMapping ?? {};
  if (workflowMapping[reviewState]?.color) {
    return workflowMapping[reviewState].color!;
  }
  switch (reviewState) {
    default:
      return 'grey';
  }
}

const ROOT_ID = '/';

function collectAncestorPaths(currentPath: string): string[] {
  const parts = currentPath.split('/').filter(Boolean);
  const ancestors: string[] = [ROOT_ID];
  let acc = '';
  for (const part of parts) {
    acc += '/' + part;
    ancestors.push(acc);
  }
  return ancestors;
}

export function NavigationTree({
  siteTitle,
  siteUrl,
  onClose,
}: NavigationTreeProps) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = flattenToAppURL(location.pathname);

  // expandedKeys values are item['@id'] strings (full URL) or ROOT_ID for the root
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set([ROOT_ID]),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks which paths have already been dispatched to avoid duplicate fetches
  const fetchedPaths = useRef<Set<string>>(new Set([ROOT_ID]));

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    const container = wrapperRef.current?.parentElement;
    if (!container) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = container.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = moveEvent.clientX - startX.current;
      const newWidth = Math.max(300, startWidth.current + delta);
      if (container) container.style.width = `${newWidth}px`;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const subrequests = useSelector(
    (state: any) => state.search?.subrequests ?? {},
  );

  function getChildrenForPath(path: string): SearchItem[] {
    return subrequests[`nav-tree-${path}`]?.items ?? [];
  }

  function isLoadingForPath(path: string): boolean {
    return subrequests[`nav-tree-${path}`]?.loading ?? false;
  }

  const dispatchFetch = useCallback(
    (path: string) => {
      dispatch(
        searchContent(
          path,
          {
            'path.depth': 1,
            sort_on: 'getObjPositionInParent',
            metadata_fields: ['is_folderish', 'review_state'],
            b_size: 100,
          },
          `nav-tree-${path}`,
        ),
      );
    },
    [dispatch],
  );

  // Fetch root children on mount
  useEffect(() => {
    dispatchFetch(ROOT_ID);
  }, [dispatchFetch]);

  // Auto-expand ancestors of the current page on navigation
  useEffect(() => {
    const ancestors = collectAncestorPaths(currentPath);
    for (const path of ancestors) {
      if (!fetchedPaths.current.has(path)) {
        fetchedPaths.current.add(path);
        dispatchFetch(path);
      }
    }
    setExpandedKeys((prev) => new Set([...prev, ...ancestors]));
  }, [currentPath, dispatchFetch]);

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Dispatch title search when debounced value changes
  useEffect(() => {
    if (!debouncedSearch) return;
    dispatch(
      searchContent(
        '/',
        {
          Title: debouncedSearch,
          metadata_fields: ['is_folderish', 'review_state'],
          b_size: 50,
        },
        'nav-tree-search',
      ),
    );
  }, [debouncedSearch, dispatch]);

  // Called by Tree when user expands or collapses any item
  const handleExpandedChange = useCallback(
    (newKeys: Set<Key>) => {
      for (const key of newKeys) {
        const path = key === ROOT_ID ? ROOT_ID : flattenToAppURL(key as string);
        if (!fetchedPaths.current.has(path)) {
          fetchedPaths.current.add(path);
          dispatchFetch(path);
        }
      }
      setExpandedKeys(new Set(newKeys as Set<string>));
    },
    [dispatchFetch],
  );

  const searchResults: SearchItem[] =
    subrequests['nav-tree-search']?.items ?? [];
  const isSearchLoading = !!subrequests['nav-tree-search']?.loading;

  function renderItem(item: SearchItem): React.ReactNode {
    const itemPath = flattenToAppURL(item['@id']);
    const isCurrent = currentPath === itemPath;
    const children = getChildrenForPath(itemPath);
    const isLoading = isLoadingForPath(itemPath);
    const isFetched = fetchedPaths.current.has(itemPath);
    const showChevron =
      item.is_folderish && (!isFetched || children.length > 0 || isLoading);

    return (
      <TreeItem
        key={item['@id']}
        id={item['@id']}
        textValue={item.title}
        href={itemPath}
        hasChildItems={showChevron}
        className={({ defaultClassName }) =>
          isCurrent
            ? `${defaultClassName ?? ''} is-current`.trim()
            : defaultClassName ?? ''
        }
      >
        <TreeItemContent>
          <Icon
            name={getContentIcon(item['@type'], item.is_folderish)}
            size="16px"
            className="nav-tree-icon"
          />
          <span className="nav-tree-title" title={item.title}>
            {item.title}
          </span>
          <span
            className="nav-tree-state-dot"
            style={{ background: getStateColor(item.review_state) }}
            aria-hidden
          />
        </TreeItemContent>

        {item.is_folderish && isLoading && children.length === 0 && (
          <TreeItem
            id={`${item['@id']}-loading`}
            textValue={intl.formatMessage(messages.loading)}
            isDisabled
          >
            <TreeItemContent>
              <span className="nav-tree-loading-text">
                {intl.formatMessage(messages.loading)}
              </span>
            </TreeItemContent>
          </TreeItem>
        )}

        {children.map((child) => renderItem(child))}
      </TreeItem>
    );
  }

  const rootChildren = getChildrenForPath(ROOT_ID);
  const isRootLoading = isLoadingForPath(ROOT_ID);

  return (
    <div className="navigation-tree-wrapper" ref={wrapperRef}>
      <UniversalLink href="/" className="navigation-tree-header">
        <div className="nav-tree-site-logo" aria-hidden>
          {siteTitle?.[0]?.toUpperCase() ?? 'S'}
        </div>
        <div className="nav-tree-site-info">
          <span className="nav-tree-site-label">
            {intl.formatMessage(messages.siteLabel)}
          </span>
          <span className="nav-tree-site-title">{siteTitle}</span>
        </div>
      </UniversalLink>

      <div className="navigation-tree-search">
        <span className="nav-tree-search-icon" aria-hidden>
          <SearchIcon />
        </span>
        <input
          type="text"
          className="nav-tree-search-input"
          placeholder={intl.formatMessage(messages.searchPlaceholder)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={intl.formatMessage(messages.searchAriaLabel)}
        />
        {searchQuery && (
          <button
            type="button"
            className="nav-tree-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label={intl.formatMessage(messages.clearSearch)}
          >
            ✕
          </button>
        )}
      </div>

      <div className="navigation-tree-nav-label">
        <span>{intl.formatMessage(messages.navigationLabel)}</span>
        <button
          type="button"
          className="nav-tree-close"
          onClick={onClose}
          aria-label={intl.formatMessage(messages.closePanel)}
        >
          <ColumnbeforeIcon />
        </button>
      </div>

      <nav
        className="navigation-tree"
        aria-label={intl.formatMessage(messages.siteNavigation)}
      >
        {debouncedSearch ? (
          <>
            {isSearchLoading && (
              <div className="nav-tree-loading-text nav-tree-search-status">
                {intl.formatMessage(messages.loading)}
              </div>
            )}
            {!isSearchLoading && searchResults.length === 0 && (
              <div className="nav-tree-empty">
                {intl.formatMessage(messages.noResults)}
              </div>
            )}
            {searchResults.length > 0 && (
              <Tree
                aria-label={intl.formatMessage(messages.searchResults)}
                expandedKeys={expandedKeys}
                onExpandedChange={handleExpandedChange}
              >
                {searchResults.map((item) => renderItem(item))}
              </Tree>
            )}
          </>
        ) : (
          <Tree
            aria-label={siteTitle}
            expandedKeys={expandedKeys}
            onExpandedChange={handleExpandedChange}
          >
            <TreeItem
              id={ROOT_ID}
              textValue={siteTitle}
              href={siteUrl}
              hasChildItems
              className={({ defaultClassName }) =>
                currentPath === siteUrl
                  ? `${defaultClassName ?? ''} is-current`.trim()
                  : defaultClassName ?? ''
              }
            >
              <TreeItemContent>
                <Icon name={globeSVG} size="16px" className="nav-tree-icon" />
                <span className="nav-tree-title" title={siteTitle}>
                  {siteTitle}
                </span>
              </TreeItemContent>

              {isRootLoading && rootChildren.length === 0 && (
                <TreeItem
                  id="root-loading"
                  textValue={intl.formatMessage(messages.loading)}
                  isDisabled
                >
                  <TreeItemContent>
                    <span className="nav-tree-loading-text">
                      {intl.formatMessage(messages.loading)}
                    </span>
                  </TreeItemContent>
                </TreeItem>
              )}

              {rootChildren.map((item) => renderItem(item))}
            </TreeItem>
          </Tree>
        )}
      </nav>

      <button
        className="navigation-tree-resize-handle"
        onMouseDown={onMouseDown}
        aria-label={intl.formatMessage(messages.resizePanel)}
        type="button"
      />
    </div>
  );
}

export default NavigationTree;
