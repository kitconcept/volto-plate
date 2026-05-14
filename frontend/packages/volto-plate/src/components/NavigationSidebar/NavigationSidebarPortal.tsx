import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import { ChevronrightIcon } from '@plone/components/Icons';
import { NavigationSidebar } from './NavigationSidebar';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

const STORAGE_KEY = 'navigation-sidebar-open';

function loadOpenState(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved !== null ? saved === 'true' : true;
}

function saveOpenState(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(value));
}

export function NavigationSidebarPortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(loadOpenState);
  const panelRef = useRef<HTMLDivElement>(null);
  const content = useSelector((state: any) => state.content.data);
  const workspacePath = flattenToAppURL(
    content?.['@components']?.['inherit']?.['kitconcept.plate.workspace']
      ?.from?.['@id'],
  );
  const workSpaceTitle =
    content?.['@components']?.['inherit']?.['kitconcept.plate.workspace']?.from
      ?.title;

  useEffect(() => {
    const toolbar = document.getElementById('toolbar');

    if (!toolbar) return;

    const element = document.createElement('div');
    element.id = 'navigation-sidebar';

    toolbar.after(element);

    setContainer(element);

    return () => {
      element.remove();
    };
  }, []);

  function handleToggle() {
    setOpen((v) => {
      saveOpenState(!v);
      return !v;
    });
  }

  function handleClose() {
    if (panelRef.current) panelRef.current.style.width = '';
    saveOpenState(false);
    setOpen(false);
  }

  if (!container) return null;
  return createPortal(
    <div
      ref={panelRef}
      className={cx('navigation-sidebar-panel', { 'is-open': open })}
    >
      <button
        className="navigation-sidebar-toggle"
        onClick={handleToggle}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        type="button"
      >
        <ChevronrightIcon />
      </button>
      {open && (
        <NavigationSidebar
          onClose={handleClose}
          workspacePath={workspacePath}
          workspaceTitle={workSpaceTitle}
        />
      )}
    </div>,
    container,
  );
}

export default NavigationSidebarPortal;
