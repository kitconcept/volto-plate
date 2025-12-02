import type { TImageElement } from 'platejs';

import { ImagePlugin } from '@platejs/media/react';
import ImageEdit from '@plone/volto/components/manage/Blocks/Image/Edit';
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
  '@type': 'image',
  align: 'center',
  size: 'l',
};

const toBlockData = (element: VoltoImagePlateElement): VoltoImageBlockData => ({
  ...DEFAULTS,
  ...element,
  '@type': 'image',
});

const fromBlockData = (
  data: VoltoImageBlockData,
): Partial<VoltoImagePlateElement> => {
  const { '@type': _ignored, ...rest } = data;
  return rest;
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

export const VoltoImageBlockPlugin = ImagePlugin.configure({
  options: { disableUploadInsert: true },
  render: { node: VoltoImageBlockElement },
});
