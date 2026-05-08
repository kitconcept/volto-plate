import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import { NavigationIcon } from '@plone/components/Icons';
import { ContentNavigation } from './ContentNavigation';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

const STORAGE_KEY = 'content-navigation-open';

function getStoredOpen(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved !== null ? saved === 'true' : true;
}

function setStoredOpen(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(value));
}

export function ContentNavigationPortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(getStoredOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const content = useSelector((state: any) => state.content.data);
  const isWikiPage =
    content?.['@type'] === 'WikiPage' || content?.['@type'] === 'Workspace';
  const workspacePath = flattenToAppURL(
    content?.['@components']?.workspace?.url,
  );

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

  function handleToggle() {
    setOpen((v) => {
      setStoredOpen(!v);
      return !v;
    });
  }

  function handleClose() {
    if (panelRef.current) panelRef.current.style.width = '';
    setStoredOpen(false);
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
        onClick={handleToggle}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        type="button"
      >
        <NavigationIcon />
      </button>
      {open && (
        <ContentNavigation
          onClose={handleClose}
          workspacePath={workspacePath}
        />
      )}
    </div>,
    container,
  );
}

export default ContentNavigationPortal;
