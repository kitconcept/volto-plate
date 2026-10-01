import * as React from 'react';

import type { TIndentElement } from 'platejs';
import type { Value } from '@plone/plate/components/editor';

import { findElementIdsHiddenInToggle } from '@platejs/toggle/react';

type ToggleVisibilityContextValue = {
  openIds: Set<string>;
  hiddenIds: Set<string>;
  toggleId: (id: string) => void;
};

const ToggleVisibilityContext =
  React.createContext<ToggleVisibilityContextValue | null>(null);

export function ToggleVisibilityProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: Value }>) {
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set());

  const toggleId = React.useCallback((id: string) => {
    setOpenIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const hiddenIds = React.useMemo(
    () =>
      new Set(findElementIdsHiddenInToggle(openIds, value as TIndentElement[])),
    [openIds, value],
  );

  const contextValue = React.useMemo(
    () => ({ openIds, hiddenIds, toggleId }),
    [openIds, hiddenIds, toggleId],
  );

  return (
    <ToggleVisibilityContext.Provider value={contextValue}>
      {children}
    </ToggleVisibilityContext.Provider>
  );
}

export function useToggleVisibility() {
  const context = React.useContext(ToggleVisibilityContext);

  if (!context) {
    throw new Error(
      'useToggleVisibility must be used within a ToggleVisibilityProvider',
    );
  }

  return context;
}
