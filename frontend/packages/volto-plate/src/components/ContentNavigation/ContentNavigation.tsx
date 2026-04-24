import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  Button,
  Tree,
  TreeItem as RACTreeItem,
  TreeItemContent,
} from 'react-aria-components';

// import {
//   Tree,
//   TreeItem as RACTreeItem,
//   TreeItemContent,
// } from '@plone/components/src/components/Tree/Tree';
import { flattenToAppURL } from '@plone/volto/helpers';
import { withContentNavigation } from '@plone/volto/components/theme/Navigation/withContentNavigation';

interface NavItem {
  '@id': string;
  href: string;
  title: string;
  description?: string;
  type?: string;
  is_current?: boolean;
  is_in_path?: boolean;
  items?: NavItem[];
}

interface Navigation {
  items?: NavItem[];
  has_custom_name?: boolean;
  title?: string;
  url?: string;
}

interface ContentNavigationBaseProps {
  navigation?: Navigation;
}

function renderNavItem(node: NavItem): React.ReactNode {
  return (
    <RACTreeItem
      key={node['@id']}
      id={node['@id']}
      textValue={node.title}
      aria-current={node.is_current ? 'page' : undefined}
    >
      <TreeItemContent>
        {({ hasChildItems, level }) => (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: `${(level - 1) * 16}px`,
            }}
          >
            {hasChildItems ? (
              <Button
                slot="chevron"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
                  <path d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Button>
            ) : (
              <span
                style={{
                  display: 'inline-block',
                  width: '24px',
                  flexShrink: 0,
                }}
              />
            )}
            <Link to={flattenToAppURL(node.href)} title={node.description}>
              {node.title}
            </Link>
          </span>
        )}
      </TreeItemContent>
      {node.items?.map((child) => renderNavItem(child))}
    </RACTreeItem>
  );
}

function ContentNavigationBase({
  navigation = {},
}: ContentNavigationBaseProps) {
  const { items = [] } = navigation;

  if (!items.length) {
    return null;
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 11,
      }}
    >
      <nav
        className="content-navigation"
        style={{
          position: 'absolute',
          marginTop: '40px',
          left: 0,
          width: 'calc((100% - var(--default-container-width)) / 2)',
        }}
      >
        {navigation.has_custom_name && navigation.url ? (
          <div className="content-navigation-header">
            <Link to={flattenToAppURL(navigation.url)}>{navigation.title}</Link>
          </div>
        ) : null}
        <Tree
          style={{ maxHeight: 'none', border: 'none', width: '100%' }}
          aria-label={navigation.title || 'Navigation'}
        >
          {items.map((node) => renderNavItem(node))}
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
