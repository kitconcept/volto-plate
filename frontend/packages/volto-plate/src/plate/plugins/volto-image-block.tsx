// This is a Plate plugin that adapts the Volto Image block to be used in a native Plate
// block. It keeps the built-in Plate image baseline, and the KEYS.img type, but adds
// the Volto block type, edit, and schema (via the SidebarPlugin) to the element,
// so that it can be used seamlessly.

import type { TImageElement } from 'platejs';
import { ImagePlugin } from '@platejs/media/react';

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

export const VoltoImageBlockPlugin = ImagePlugin.configure({
  options: { disableUploadInsert: true },
  render: { node: VoltoImageBlockElement },
});
