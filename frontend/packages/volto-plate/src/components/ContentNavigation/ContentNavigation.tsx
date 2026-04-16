import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
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
      className={[
        'content-navigation-item',
        node.is_current ? 'is-current' : '',
        node.is_in_path ? 'in-path' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TreeItemContent>
        <Link to={flattenToAppURL(node.href)} title={node.description}>
          {node.title}
        </Link>
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
        maxWidth: '1440px',
        marginLeft: 'auto',
        marginRight: 'auto',
        zIndex: 11,
      }}
    >
      <nav className="content-navigation" style={{ position: 'absolute' }}>
        {navigation.has_custom_name && navigation.url ? (
          <div className="content-navigation-header">
            <Link to={flattenToAppURL(navigation.url)}>{navigation.title}</Link>
          </div>
        ) : null}
        <Tree aria-label={navigation.title || 'Navigation'}>
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
