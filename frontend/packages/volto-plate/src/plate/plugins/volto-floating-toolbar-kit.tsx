import { createPlatePlugin } from 'platejs/react';

import { VoltoFloatingToolbar } from '../wiki/volto-floating-toolbar';
import { FloatingToolbarButtons } from '../wiki/floating-toolbar-buttons';

export const VoltoFloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <VoltoFloatingToolbar>
          <FloatingToolbarButtons />
        </VoltoFloatingToolbar>
      ),
    },
  }),
];
