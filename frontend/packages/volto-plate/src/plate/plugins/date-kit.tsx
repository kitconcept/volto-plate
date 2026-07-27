import { createSlatePlugin } from 'platejs';
import { toPlatePlugin } from 'platejs/react';

import { DATE_ELEMENT_TYPE, DateElement } from './date-node';

export const BaseDatePlugin = createSlatePlugin({
  key: DATE_ELEMENT_TYPE,
  node: { isElement: true, isInline: true, isVoid: true },
});

export const DatePlugin = toPlatePlugin(BaseDatePlugin).withComponent(
  DateElement,
);

export const DateKit = [DatePlugin];
