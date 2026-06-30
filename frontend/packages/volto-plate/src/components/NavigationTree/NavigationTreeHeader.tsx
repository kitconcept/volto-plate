import { useIntl } from 'react-intl';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { messages } from './messages';

interface NavigationTreeHeaderProps {
  siteTitle: string;
}

export function NavigationTreeHeader({ siteTitle }: NavigationTreeHeaderProps) {
  const intl = useIntl();
  return (
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
  );
}

export default NavigationTreeHeader;
