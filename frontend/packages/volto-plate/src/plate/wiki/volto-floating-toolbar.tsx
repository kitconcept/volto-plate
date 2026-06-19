import * as React from 'react';

import {
  FloatingPortal,
  type FloatingToolbarState,
  flip,
  offset,
  shift,
  useFloatingToolbar,
  useFloatingToolbarState,
} from '@platejs/floating';
import { cn } from '@plone/plate/lib/utils';
import { Toolbar } from '@plone/plate/components/ui/toolbar';
import { KEYS } from 'platejs';
import {
  useEditorId,
  useEventEditorValue,
  usePluginOption,
} from 'platejs/react';

const FLOATING_TOOLBAR_PADDING = 12;

const getViewportPadding = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return FLOATING_TOOLBAR_PADDING;
  }

  const toolbarRect = document
    .getElementById('toolbar')
    ?.getBoundingClientRect();
  const sidebarRect = document
    .querySelector<HTMLElement>('.sidebar-container:not(.collapsed)')
    ?.getBoundingClientRect();
  const contentAreaRect = document
    .querySelector<HTMLElement>('.content-area')
    ?.getBoundingClientRect();

  return {
    top: FLOATING_TOOLBAR_PADDING,
    bottom: FLOATING_TOOLBAR_PADDING,
    left: Math.max(
      FLOATING_TOOLBAR_PADDING,
      (toolbarRect?.right ?? 0) + FLOATING_TOOLBAR_PADDING,
      (contentAreaRect?.left ?? 0) + FLOATING_TOOLBAR_PADDING,
    ),
    right: Math.max(
      FLOATING_TOOLBAR_PADDING,
      sidebarRect
        ? window.innerWidth - sidebarRect.left + FLOATING_TOOLBAR_PADDING
        : FLOATING_TOOLBAR_PADDING,
      contentAreaRect
        ? window.innerWidth - contentAreaRect.right + FLOATING_TOOLBAR_PADDING
        : FLOATING_TOOLBAR_PADDING,
    ),
  };
};

const hasMeaningfulRect = (element?: HTMLElement | null) => {
  const rect = element?.getBoundingClientRect();

  return Boolean(rect && rect.width > 0 && rect.height > 0);
};

function useViewportPadding() {
  const [padding, setPadding] = React.useState(getViewportPadding);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const updatePadding = () => {
      setPadding(getViewportPadding());
    };

    updatePadding();
    window.addEventListener('resize', updatePadding);

    const sidebar = document.querySelector<HTMLElement>('.sidebar-container');
    const toolbar = document.getElementById('toolbar');
    const contentArea = document.querySelector<HTMLElement>('.content-area');
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            updatePadding();
          });

    [sidebar, toolbar, contentArea].forEach((element) => {
      if (resizeObserver && hasMeaningfulRect(element)) {
        resizeObserver.observe(element);
      }
    });

    const mutationObserver = new MutationObserver(() => {
      updatePadding();
    });

    [sidebar, toolbar, contentArea].forEach((element) => {
      if (element) {
        mutationObserver.observe(element, {
          attributes: true,
          attributeFilter: ['class', 'style'],
        });
      }
    });

    return () => {
      window.removeEventListener('resize', updatePadding);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return padding;
}

export function VoltoFloatingToolbar({
  children,
  className,
  state,
  ...props
}: React.ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState;
}) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');
  const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, 'open');
  const viewportPadding = useViewportPadding();

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen || isAIChatOpen,
    ...state,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: ['bottom-start'],
          padding: viewportPadding,
        }),
        shift({
          crossAxis: true,
          padding: viewportPadding,
        }),
      ],
      placement: 'top-start',
      strategy: 'fixed',
      ...state?.floatingOptions,
    },
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const toolbarRef = typeof props.ref === 'string' ? undefined : props.ref;
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      floatingRef(node);

      if (!toolbarRef) return;
      if (typeof toolbarRef === 'function') {
        toolbarRef(node);
        return;
      }

      (toolbarRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
    },
    [floatingRef, toolbarRef],
  );

  if (hidden) return null;

  return (
    <FloatingPortal>
      <div ref={clickOutsideRef}>
        <Toolbar
          {...props}
          {...rootProps}
          aria-label="Editor toolbar"
          ref={ref}
          className={cn(
            `
              scrollbar-hide z-100 overflow-x-auto rounded-md border bg-popover p-1
              whitespace-nowrap opacity-100 shadow-md
              print:hidden
            `,
            'max-w-[80vw]',
            className,
          )}
        >
          {children}
        </Toolbar>
      </div>
    </FloatingPortal>
  );
}
