import { BaseCodeDrawingPlugin } from '@platejs/code-drawing';

import { CodeDrawingElementStatic } from './code-drawing-node-static';

export const BaseCodeDrawingKit = [
  BaseCodeDrawingPlugin.withComponent(CodeDrawingElementStatic),
];
