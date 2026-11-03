import type { CSSProperties } from 'react';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { avatarToneClass, getInitials } from '../../helpers/avatar';

type PersonPillProps = {
  id: string;
  fullname?: string;
  name?: string;
  portrait?: string;
  url?: string;
  compact?: boolean;
  background?: string;
  kicker?: string;
  subheading?: string;
};

type SiteState = {
  site?: { data?: { 'kitconcept.clickable_profile_links'?: boolean } };
};

const PersonPill = ({
  id,
  fullname,
  name,
  portrait,
  url,
  compact = false,
  background,
  kicker,
  subheading,
}: PersonPillProps) => {
  const showProfileLinks = useSelector(
    (state: SiteState) =>
      state.site?.data?.['kitconcept.clickable_profile_links'],
  );

  const initials = getInitials(
    [fullname, name, id].map((value) => value?.trim()).find(Boolean),
  );

  const avatar = (
    <>
      {!portrait && (
        <span
          className={`person-pill-avatar person-pill-initials ${avatarToneClass(initials)}`}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
      {portrait && (
        <img
          className="person-pill-portrait"
          src={flattenToAppURL(portrait)}
          alt={fullname || name}
        />
      )}
    </>
  );

  const label =
    kicker || subheading ? (
      <span className="person-pill-labels">
        {kicker ? <span className="person-pill-kicker">{kicker}</span> : null}
        <span className="person-pill-name">{fullname || name}</span>
        {subheading ? (
          <span className="person-pill-subheading">{subheading}</span>
        ) : null}
      </span>
    ) : (
      <span className="person-pill-name">{fullname || name}</span>
    );

  const showLink = Boolean(url) && showProfileLinks;

  return (
    <span
      className={cx('person-pill', {
        'person-pill-compact': compact,
        'person-pill-background': background,
        'person-pill-with-kicker': kicker,
        'person-pill-with-subheading': subheading,
      })}
      style={
        background
          ? ({ '--person-pill-background': background } as CSSProperties)
          : undefined
      }
    >
      {showLink ? (
        <UniversalLink className="person-pill-link" href={url as string}>
          {avatar}
          {label}
        </UniversalLink>
      ) : (
        <>
          {avatar}
          {label}
        </>
      )}
    </span>
  );
};

export default PersonPill;
