import * as React from 'react';
import { useDispatch } from 'react-redux';

import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { getContent } from '@plone/volto/actions/content/content';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import {
  ElementApi,
  KEYS,
  type Path,
  type PluginConfig,
  type TElement,
} from 'platejs';
import {
  createTPlatePlugin,
  type PlateEditor,
  useEditorRef,
} from 'platejs/react';

import {
  toPlateImageBlockData,
  type CreateContentResponse,
  type PlateImageBlockData,
} from './volto-clipboard-image-paste-helpers';
import {
  embedRtfPictures,
  getPastedImageContentPath,
  getPastedImageFileName,
  getPastedImageSourceKind,
  liftPastedImages,
  PASTED_IMAGE_TYPE,
  replacePastedImages,
} from './volto-html-image-paste-helpers';
import {
  VoltoImageUploadBridge,
  type VoltoImageUploadOptions,
} from './volto-image-upload';

const HTML_IMAGE_PASTE_PLUGIN_KEY = 'volto-html-image-paste';

type VoltoHtmlImagePasteOptions = VoltoImageUploadOptions & {
  getVoltoContent: ((path: string) => Promise<CreateContentResponse>) | null;
};

/** `undefined` keeps the image block as pasted, `null` removes it. */
type ImageResolution = Partial<PlateImageBlockData> | null | undefined;

type ImageBlockElement = TElement & PlateImageBlockData & { '@type': string };

function HtmlImagePasteBridge() {
  const dispatch = useDispatch();
  const editor = useEditorRef();

  React.useEffect(() => {
    editor.setOption(
      VoltoHtmlImagePastePlugin,
      'getVoltoContent',
      async (path: string) => {
        const response = await dispatch(
          getContent(path, null, `${HTML_IMAGE_PASTE_PLUGIN_KEY}-${path}`),
        );

        return (response?.data ?? response) as CreateContentResponse;
      },
    );

    return () => {
      editor.setOption(VoltoHtmlImagePastePlugin, 'getVoltoContent', null);
    };
  }, [dispatch, editor]);

  return (
    <VoltoImageUploadBridge
      plugin={VoltoHtmlImagePastePlugin as any}
      requestPrefix={HTML_IMAGE_PASTE_PLUGIN_KEY}
    />
  );
}

/** The URL the image block shows until the pasted image is resolved. */
function getInitialUrl(src: string) {
  return getPastedImageSourceKind(src) === 'internal'
    ? flattenToAppURL(src)
    : src;
}

async function uploadImageSource(editor: PlateEditor, src: string) {
  const uploadVoltoImage = editor.getOption(
    VoltoHtmlImagePastePlugin,
    'uploadVoltoImage',
  );
  if (!uploadVoltoImage) return undefined;

  const blob = await (await fetch(src)).blob();
  if (!blob.type.startsWith('image/')) return undefined;

  const file = new File([blob], getPastedImageFileName(src, blob.type), {
    type: blob.type,
  });

  return await uploadVoltoImage(file);
}

/**
 * Turns a pasted image into the data of its image block: images that travel
 * with the clipboard and images of other sites are uploaded as Image content,
 * images of this site point at their Image content.
 */
async function resolveImageSource(
  editor: PlateEditor,
  src: string,
): Promise<ImageResolution> {
  switch (getPastedImageSourceKind(src)) {
    case 'embedded':
      try {
        // A failed upload has already been reported. Don't keep the image
        // data in the page.
        return await uploadImageSource(editor, src);
      } catch {
        return null;
      }
    case 'external':
      try {
        return await uploadImageSource(editor, src);
      } catch {
        // The site doesn't allow fetching the image (CORS): link to it.
        return undefined;
      }
    case 'internal': {
      const path = getPastedImageContentPath(src);
      const getVoltoContent = editor.getOption(
        VoltoHtmlImagePastePlugin,
        'getVoltoContent',
      );

      try {
        const content = await getVoltoContent?.(path);
        return content?.image
          ? toPlateImageBlockData(content, { name: '' })
          : undefined;
      } catch {
        return undefined;
      }
    }
    default:
      return null;
  }
}

/** Applies the resolution to every pasted image block showing `url`. */
function applyImageResolution(
  editor: PlateEditor,
  url: string,
  resolution: ImageResolution,
) {
  if (resolution === undefined) return;

  const entries = Array.from(
    editor.api.nodes<ImageBlockElement>({
      at: [],
      match: (node) =>
        ElementApi.isElement(node) &&
        node.type === PLONE_BLOCK_TYPE &&
        node['@type'] === 'plateimage' &&
        node.url === url,
    }),
  );

  editor.tf.withoutNormalizing(() => {
    // Last first, so removing a block doesn't move the next ones.
    for (const [node, path] of entries.reverse() as [
      ImageBlockElement,
      Path,
    ][]) {
      if (resolution === null) {
        editor.tf.removeNodes({ at: path });
      } else {
        editor.tf.setNodes(
          { ...resolution, alt: node.alt || resolution.alt || '' },
          { at: path },
        );
      }
    }
  });
}

async function resolvePastedImages(editor: PlateEditor, sources: string[]) {
  await Promise.all(
    [...new Set(sources)].map(async (src) => {
      const resolution = await resolveImageSource(editor, src);
      applyImageResolution(editor, getInitialUrl(src), resolution);
    }),
  );
}

/**
 * Pasted HTML, from a web page, Word or LibreOffice, keeps its images as
 * image blocks. Each `<img>` becomes an inline element while the HTML is
 * deserialized, which is then moved out of its block (to the top level, or
 * to its table cell) and turned into an image block. The images are then uploaded in the background.
 */
export const VoltoHtmlImagePastePlugin = createTPlatePlugin<
  PluginConfig<typeof PASTED_IMAGE_TYPE, VoltoHtmlImagePasteOptions>
>({
  key: PASTED_IMAGE_TYPE,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
  parsers: {
    html: {
      deserializer: {
        rules: [{ validNodeName: 'IMG' }],
        query: ({ element }) => !!element.getAttribute('src'),
        parse: ({ element }) => ({
          type: PASTED_IMAGE_TYPE,
          alt: element.getAttribute('alt') ?? '',
          src: element.getAttribute('src') ?? '',
        }),
      },
    },
  },
  inject: {
    plugins: {
      [KEYS.html]: {
        parser: {
          transformData: ({ data, dataTransfer }) =>
            embedRtfPictures(data, dataTransfer.getData('text/rtf')),
          transformFragment: ({ editor, fragment }) => {
            const sources: string[] = [];
            const lifted = replacePastedImages(
              liftPastedImages(fragment, (element) =>
                editor.api.isVoid(element),
              ),
              (image) => {
                const src = image.src.startsWith('//')
                  ? `${window.location.protocol}${image.src}`
                  : image.src;
                // Images the browser can't load, like Word's `file://` ones
                // without image data on the clipboard, are dropped.
                if (getPastedImageSourceKind(src) === 'unsupported') {
                  return null;
                }
                sources.push(src);

                return editor.api.create.block({
                  type: PLONE_BLOCK_TYPE,
                  '@type': 'plateimage',
                  align: 'center',
                  alt: image.alt,
                  size: 'l',
                  url: getInitialUrl(src),
                });
              },
            );

            if (sources.length > 0) {
              // Runs once the fragment is inserted.
              void resolvePastedImages(editor as PlateEditor, sources);
            }

            return lifted;
          },
        },
      },
    },
  },
  options: {
    getVoltoContent: null,
    uploadVoltoImage: null,
  },
  render: {
    afterEditable: HtmlImagePasteBridge,
  },
});
