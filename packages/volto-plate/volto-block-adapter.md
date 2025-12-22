# Volto block adapter

The `createVoltoBlockAdapter` helper lets you wrap an existing Volto block (its `Edit` and `View` components) and surface it as a Plate plugin without touching the original block implementation. It maps Plate node data to Volto block props and writes block updates back into the Plate document via `setNodes`.

## When to use

- You want to reuse a Volto block inside a Plate-based editor (e.g. Plate-powered rich text) without forking the block.
- You need Plate selection/void handling but prefer to keep Volto’s sidebar/forms, behaviors, and rendering logic untouched.

## How it works

1. You provide Volto’s `Edit` and `View` components plus two mapping functions:
   - `toBlockData(element)`: convert a Plate element into the block data shape the Volto component expects.
   - `fromBlockData(data, previousElement)`: convert updated block data back to partial Plate element props.
2. The adapter renders `View` when Plate is read-only and `Edit` when editable. It passes `onChangeBlock` and `onSelectBlock` that update/select the Plate node.
3. Optional `getEditProps` / `getViewProps` let you inject extra props (e.g. `blocksConfig`, `navRoot`).

## Example: wrap the Volto Image block

```ts
import { ImagePlugin } from '@platejs/media/react';
import ImageEdit from '@plone/volto/components/manage/Blocks/Image/Edit';
import ImageView from '@plone/volto/components/manage/Blocks/Image/View';
import config from '@plone/volto/registry';

import { createVoltoBlockAdapter } from '@kitconcept/volto-plate/plate/plugins/volto-block-adapter';

type VoltoImageElement = {
  url?: string;
  alt?: string;
  image_field?: string;
  image_scales?: Record<string, any>;
  align?: string;
  size?: string;
  href?: any;
  openLinkInNewTab?: boolean;
  placeholder?: string;
  id?: string;
};

const DEFAULTS = { '@type': 'image', align: 'center', size: 'l' } as const;

const toBlockData = (element: VoltoImageElement) => ({
  ...DEFAULTS,
  ...element,
  '@type': 'image',
});

const fromBlockData = (data: any) => {
  const { '@type': _ignored, ...rest } = data;
  return rest;
};

export const VoltoImageBlockElement = createVoltoBlockAdapter({
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
```

Add the plugin to your Plate kit (e.g. `MediaKit`) and use it like any other Plate plugin:

```ts
export const MediaKit = [
  VoltoImageBlockPlugin,
  // …other media plugins
];
```

## Notes

- The adapter uses the Plate node path to keep Volto block selection and updates in sync. If no path can be resolved, it returns `null`.
- It derives a stable `block` id from the Plate path unless the element already carries an `id`.
- Because the Volto block handles its own toolbar/sidebar, the adapter is marked `contentEditable={false}` to avoid nested editing issues.
