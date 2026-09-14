import type { CSSProperties } from 'react';

import type { PlateElementProps } from 'platejs/react';

import { createPlatePlugin } from 'platejs/react';

import { useToggleVisibility } from '../context/ToggleVisibilityContext';

const hiddenStyle: CSSProperties = {
  height: 0,
  margin: 0,
  overflow: 'hidden',
  visibility: 'hidden',
};

function VoltoToggleAboveNodes({ children, element }: PlateElementProps) {
  const { hiddenIds } = useToggleVisibility();

  if (!hiddenIds.has(element.id as string)) return children;

  return <div style={hiddenStyle}>{children}</div>;
}

export const VoltoToggleVisibilityKit = [
  createPlatePlugin({ key: 'voltoToggleVisibility' }).configure({
    render: { aboveNodes: () => VoltoToggleAboveNodes },
  }),
];
