import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { Key } from 'react-aria-components';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { searchContent } from '@plone/volto/actions/search/search';
import { collectAncestorPaths } from './utils';

export interface SearchItem {
  '@id': string;
  '@type': string;
  title: string;
  is_folderish: boolean;
  review_state: string;
}

export const ROOT_ID = '/';

export function useNavigationTree() {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = flattenToAppURL(location.pathname);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set([ROOT_ID]),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedPaths = useRef<Set<string>>(new Set([ROOT_ID]));

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

  useEffect(() => {
    dispatchFetch(ROOT_ID);
  }, [dispatchFetch]);

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

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedSearch) return;
    dispatch(
      searchContent(
        '/',
        {
          Title: `${debouncedSearch}*`,
          metadata_fields: ['is_folderish', 'review_state'],
          b_size: 50,
        },
        'nav-tree-search',
      ),
    );
  }, [debouncedSearch, dispatch]);

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
  const rootChildren = getChildrenForPath(ROOT_ID);
  const isRootLoading = isLoadingForPath(ROOT_ID);

  return {
    currentPath,
    expandedKeys,
    handleExpandedChange,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    searchResults,
    isSearchLoading,
    rootChildren,
    isRootLoading,
    getChildrenForPath,
    isLoadingForPath,
    fetchedPaths,
  };
}
