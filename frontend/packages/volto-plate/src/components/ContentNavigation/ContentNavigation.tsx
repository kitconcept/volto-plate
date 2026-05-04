import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Tree, TreeItem } from '@plone/components';
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
}: ContentNavigationBaseProps) {
  const { items = [] } = navigation;
  const navigationId = navigation['@id'];

  const lastItemsRef = useRef<NavItem[]>(items);
  if (items.length > 0) lastItemsRef.current = items;
  const displayItems = items.length > 0 ? items : lastItemsRef.current;

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(collectInPathIds(items)),
  );

  useEffect(() => {
    setExpandedKeys(new Set(collectInPathIds(items)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationId]);

  if (!displayItems.length) {
    return null;
  }

  return (
    <div className="content-navigation-wrapper">
      <nav className="content-navigation">
        <Tree
          aria-label={navigation.title || 'Navigation'}
          expandedKeys={expandedKeys}
          onExpandedChange={(keys) =>
            setExpandedKeys(new Set(keys as Set<string>))
          }
        >
          {displayItems.map((item) => renderNavItem(item))}
        </Tree>
      </nav>
    </div>
  );
}

const ContentNavigationWithNav = withContentNavigation(ContentNavigationBase);

export function ContentNavigation(props: Record<string, unknown>) {
  const location = useLocation();
  return <ContentNavigationWithNav {...props} location={location} />;
}

export default ContentNavigation;
