import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import { NavigationIcon } from '@plone/components/Icons';
import { ContentNavigation } from './ContentNavigation';

export function ContentNavigationPortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const content = useSelector((state: any) => state.content.data);
  const isWikiPage = content?.['@type'] === 'WikiPage';

  useEffect(() => {
    const toolbar = document.getElementById('toolbar');

    if (!toolbar) return;

    const element = document.createElement('div');
    element.id = 'content-navigation';

    toolbar.after(element);

    setContainer(element);

    return () => {
      element.remove();
    };
  }, []);

  function handleClose() {
    if (panelRef.current) panelRef.current.style.width = '';
    setOpen(false);
  }

  if (!container || !isWikiPage) return null;
  return createPortal(
    <div
      ref={panelRef}
      className={cx('content-navigation-panel', { 'is-open': open })}
    >
      <button
        className="content-navigation-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        type="button"
      >
        <NavigationIcon />
      </button>
      {open && <ContentNavigation onClose={handleClose} />}
    </div>,
    container,
  );
}

export default ContentNavigationPortal;
