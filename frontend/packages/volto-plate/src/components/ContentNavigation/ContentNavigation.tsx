import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Tree, TreeItem, Link } from '@plone/components';
import { ArrowleftIcon } from '@plone/components/Icons';
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
  available?: boolean;
  has_custom_name?: boolean;
  items?: NavItem[];
  title?: string;
  url?: string;
}

interface ContentNavigationBaseProps {
  navigation?: Navigation;
  onClose?: () => void;
}

function collectInPathIds(items: NavItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.is_in_path ? [item['@id']] : []),
    ...collectInPathIds(item.items ?? []),
  ]);
}

function renderNavItem(item: NavItem): React.ReactNode {
  return (
    <TreeItem
      key={item['@id']}
      id={item['@id']}
      title={item.title}
      href={flattenToAppURL(item.href)}
      className={
        item.is_current
          ? ({ defaultClassName }) =>
              `${defaultClassName ?? ''} is-current`.trim()
          : undefined
      }
    >
      {item.items?.map((child) => renderNavItem(child))}
    </TreeItem>
  );
}

function ContentNavigationBase({
  navigation = {},
  onClose,
}: ContentNavigationBaseProps) {
  const { items = [] } = navigation;
  const rootItem = items[0];
  const childItems = rootItem?.items ?? [];
  const title = rootItem?.title ?? '';
  const navigationId = navigation['@id'];

  const lastItemsRef = useRef<NavItem[]>(childItems);
  if (childItems.length > 0) lastItemsRef.current = childItems;
  const displayItems =
    childItems.length > 0 ? childItems : lastItemsRef.current;

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(collectInPathIds(childItems)),
  );

  useEffect(() => {
    setExpandedKeys(new Set(collectInPathIds(childItems)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationId]);

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
          <ArrowleftIcon />
        </button>
        <h1 className="content-navigation-title">
          <Link
            className="content-navigation-title-link"
            href={flattenToAppURL(rootItem?.href ?? '')}
          >
            {title}
          </Link>
        </h1>
      </div>

      {displayItems.length > 0 && (
        <nav className="content-navigation">
          <Tree
            aria-label={title}
            expandedKeys={expandedKeys}
            onExpandedChange={(keys) =>
              setExpandedKeys(new Set(keys as Set<string>))
            }
          >
            {displayItems.map((item) => renderNavItem(item))}
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

export function ContentNavigation(props: Record<string, unknown>) {
  const location = useLocation();
  return <ContentNavigationWithNav {...props} location={location} />;
}

export default ContentNavigation;
