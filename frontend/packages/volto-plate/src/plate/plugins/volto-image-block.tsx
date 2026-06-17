import type { TImageElement } from 'platejs';
import { createSlatePlugin } from 'platejs';
import { toPlatePlugin } from 'platejs/react';

import ImageEdit from '../../components/Blocks/Image/Edit';
import ImageView from '@plone/volto/components/manage/Blocks/Image/View';
import config from '@plone/volto/registry';

import { createVoltoBlockAdapter } from './volto-block-adapter';

type VoltoImagePlateElement = TImageElement & {
  '@type'?: string;
  image_field?: string;
  image_scales?: Record<string, any>;
  align?: string;
  size?: string;
  href?: any;
  openLinkInNewTab?: boolean;
  placeholder?: string;
  [key: string]: unknown;
};

type VoltoImageBlockData = VoltoImagePlateElement & { '@type'?: string };

const DEFAULTS: Required<
  Pick<VoltoImageBlockData, '@type' | 'align' | 'size'>
> = {
  '@type': 'plateimage',
  align: 'center',
  size: 'l',
};

const toBlockData = (element: VoltoImagePlateElement): VoltoImageBlockData => ({
  ...DEFAULTS,
  ...element,
  '@type': 'plateimage',
});

const fromBlockData = (
  data: VoltoImageBlockData,
): Partial<VoltoImagePlateElement> => {
  const { '@type': blockType = 'plateimage', ...rest } = data;
  return {
    ...rest,
    type: 'unknown',
    '@type': blockType,
  };
};

export const VoltoImageBlockElement = createVoltoBlockAdapter<
  VoltoImagePlateElement,
  VoltoImageBlockData
>({
  Edit: ImageEdit,
  View: ImageView,
  toBlockData,
  fromBlockData,
  getEditProps: ({ element }) => ({
    blocksConfig: config.blocks.blocksConfig,
    blocksErrors: {},
    navRoot: config.settings?.navRootPath,
    contentType: (element as any)?.['@type'],
  }),
});

export const BaseVoltoImageBlockPlugin = createSlatePlugin({
  key: 'plateimage',
  node: {
    component: VoltoImageBlockElement,
    isVoid: true,
    isElement: true,
    type: 'unknown',
  },
});

export const VoltoImageBlockPlugin = toPlatePlugin(BaseVoltoImageBlockPlugin);
