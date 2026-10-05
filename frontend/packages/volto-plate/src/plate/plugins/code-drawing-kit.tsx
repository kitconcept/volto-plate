import { CodeDrawingPlugin } from '@platejs/code-drawing/react';

import { CodeDrawingElement } from './code-drawing-node';

export const CodeDrawingKit = [
  CodeDrawingPlugin.withComponent(CodeDrawingElement),
];
