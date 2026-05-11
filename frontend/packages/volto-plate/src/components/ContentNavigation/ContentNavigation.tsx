import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Tree, TreeItem } from '@plone/components';
import { ChevrondownIcon } from '@plone/components/Icons';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { withContentNavigation } from '@plone/volto/components/theme/Navigation/withContentNavigation';

interface NavItem {
  '@id': string;
  description: string;
  href: string;
  icon: string;
  is_current: boolean;
  is_folderish: boolean;
  is_in_path: boolean;
  items: NavItem[];
  normalized_id: string;
  review_state: string;
  thumb: string;
  title: string;
  type: string;
}

interface Navigation {
  '@id'?: string;
  items?: NavItem[];
  title?: string;
}

interface ContentNavigationBaseProps {
  navigation?: Navigation;
  onClose?: () => void;
  workspaceTitle?: string;
}

function collectInPathIds(items: NavItem[], currentPath: string): string[] {
  return items.flatMap((item) => {
    const itemPath = flattenToAppURL(item.href);
    const isInPath =
      currentPath === itemPath || currentPath.startsWith(itemPath + '/');
    return [
      ...(isInPath ? [item['@id']] : []),
      ...collectInPathIds(item.items ?? [], currentPath),
    ];
  });
}

function renderNavItem(item: NavItem, currentPath: string): React.ReactNode {
  const itemPath = flattenToAppURL(item.href);
  const isCurrent = currentPath === itemPath;

  return (
    <TreeItem
      key={item['@id']}
      id={item['@id']}
      title={item.title}
      href={itemPath}
      className={
        isCurrent
          ? ({ defaultClassName }) =>
              `${defaultClassName ?? ''} is-current`.trim()
          : undefined
      }
    >
      {item.items?.map((child) => renderNavItem(child, currentPath))}
    </TreeItem>
  );
}

function ContentNavigationBase({
  navigation = {},
  onClose,
  workspaceTitle,
}: ContentNavigationBaseProps) {
  const location = useLocation();
  const currentPath = flattenToAppURL(location.pathname);

  const { items = [] } = navigation;
  const navigationId = navigation['@id'];

  const lastItemsRef = useRef<NavItem[]>(items);
  if (items.length > 0) lastItemsRef.current = items;
  const displayItems = items.length > 0 ? items : lastItemsRef.current;

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(collectInPathIds(items, currentPath)),
  );

  useEffect(() => {
    setExpandedKeys(
      (prev) => new Set([...prev, ...collectInPathIds(items, currentPath)]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationId, currentPath]);

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

  return (
    <div className="content-navigation-wrapper" ref={wrapperRef}>
      <div className="content-navigation-header">
        <button
          className="content-navigation-close"
          onClick={onClose}
          aria-label="Close navigation"
          type="button"
        >
          <ChevrondownIcon />
        </button>
        <h1 className="content-navigation-title">{workspaceTitle}</h1>
      </div>

      {displayItems.length > 0 && (
        <nav className="content-navigation">
          <Tree
            aria-label={workspaceTitle}
            expandedKeys={expandedKeys}
            onExpandedChange={(keys) =>
              setExpandedKeys(new Set(keys as Set<string>))
            }
          >
            {displayItems.map((item) => renderNavItem(item, currentPath))}
          </Tree>
        </nav>
      )}

      <button
        className="content-navigation-resize-handle"
        onMouseDown={onMouseDown}
        aria-label="Resize navigation panel"
        type="button"
      />
    </div>
  );
}

const ContentNavigationWithNav = withContentNavigation(ContentNavigationBase);

interface ContentNavigationProps {
  onClose?: () => void;
  workspacePath: string;
  workspaceTitle?: string;
}

export function ContentNavigation({
  workspacePath,
  workspaceTitle,
  ...rest
}: ContentNavigationProps) {
  const location = useLocation();
  return (
    <ContentNavigationWithNav
      {...rest}
      pathname={workspacePath}
      location={location}
      workspaceTitle={workspaceTitle}
    />
  );
}

export default ContentNavigation;
