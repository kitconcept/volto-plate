import type { BlocksFormData, JSONSchema } from '@plone/types';

type ImageBlockFormData = BlocksFormData & {
  url?: string;
};

type ImageSchemaArgs = {
  formData?: ImageBlockFormData;
};

export function ImageSchema({ formData = {} }: ImageSchemaArgs): JSONSchema {
  return {
    title: 'Image',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          ...(formData.url
            ? ['url', 'alt', 'blockWidth', 'align', 'size']
            : []),
        ],
      },
      ...(formData.url
        ? [
            {
              id: 'link_settings',
              title: 'Link settings',
              fields: ['href', 'openLinkInNewTab'],
            },
          ]
        : []),
    ],
    properties: {
      url: {
        title: 'Image URL',
        widget: 'image',
      },
      alt: {
        title: 'Alt text',
        description: (
          <>
            <a
              href="https://www.w3.org/WAI/tutorials/images/decision-tree/"
              title="Open in a new tab"
              target="_blank"
              rel="noopener noreferrer"
            >
              Describe the purpose of the image.
            </a>{' '}
            Leave empty if the image is purely decorative.
          </>
        ),
      },
      blockWidth: {
        title: 'Block width',
        widget: 'blockWidth',
        default: 'default',
        actions: ['narrow', 'default', 'layout', 'full'],
        styleField: true,
      },
      align: {
        title: 'Alignment',
        widget: 'align',
        default: 'center',
        actions: ['left', 'right', 'center'],
        styleField: true,
      },
      size: {
        title: 'Image size',
        widget: 'size',
        default: 'l',
        styleField: true,
      },
      href: {
        title: 'Link to',
        widget: 'object_browser',
        mode: 'link',
        selectedItemAttrs: ['Title', 'Description', 'hasPreviewImage'],
        allowExternals: true,
      },
      openLinkInNewTab: {
        title: 'Open in a new tab',
        type: 'boolean',
      },
    },
    required: [],
  };
}
