import {
  flattenToAppURL,
  getBaseUrl,
  getParentUrl,
} from '@plone/volto/helpers/Url/Url';

export type PlateImageBlockData = {
  align: 'center' | 'left' | 'right';
  alt: string;
  image_field?: string;
  image_scales?: Record<string, unknown>;
  size: 'l' | 'm' | 's';
  url: string;
};

export type CreateContentResponse = {
  '@id'?: string;
  image?: Record<string, unknown>;
  image_field?: string;
  image_scales?: Record<string, unknown>;
  title?: string;
};

function stripQueryAndHash(url = '') {
  return url.split('#')[0].split('?')[0];
}

function getContentBaseUrl(url = '') {
  const adjustedUrl = stripQueryAndHash(url)
    .replace(/^\/@@edit(\/|$)/, '/')
    .replace(/\/@@edit(?:\/.*)?$/, '');

  return getBaseUrl(adjustedUrl) || '/';
}

function isAddViewPath(url = '') {
  return stripQueryAndHash(url).endsWith('/add');
}

function getAddViewParentUrl(url = '') {
  const path = stripQueryAndHash(url).replace(/\/add$/, '') || '/';

  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Whether the HTML holds images and no text, like the fragment a browser puts
 * next to the image file on "Copy image".
 */
function isImageOnlyHtml(html: string) {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return text === '' && /<img\b/i.test(html);
}

export function isClipboardImagePaste(dataTransfer?: DataTransfer | null) {
  if (!dataTransfer) return false;

  const TEXT_HTML = 'text/html';
  const files = Array.from(dataTransfer.files ?? []);

  if (!files.some((file) => file.type.startsWith('image/'))) return false;
  if (!Array.from(dataTransfer.types ?? []).includes(TEXT_HTML)) return true;

  // Pasted HTML with content goes through the HTML paste; a lone image copied
  // from a web page is uploaded like any other clipboard image.
  return isImageOnlyHtml(dataTransfer.getData(TEXT_HTML));
}

export function buildImageCreateContentPayload(file: File, dataUrl: string) {
  const fields = dataUrl.match(/^data:(.*);(.*),(.*)$/);

  if (!fields) {
    throw new Error('Could not read clipboard image data');
  }

  return {
    '@type': 'Image',
    title: file.name || 'Pasted image',
    image: {
      data: fields[3],
      encoding: fields[2],
      'content-type': fields[1],
      filename: file.name || 'pasted-image',
    },
  };
}

export function getImageUploadTarget(
  contextUrl?: string,
  isFolderish?: boolean | null,
  pathname?: string,
) {
  const rawContextUrl = stripQueryAndHash(contextUrl || pathname || '/');

  if (isAddViewPath(rawContextUrl)) {
    return getAddViewParentUrl(rawContextUrl);
  }

  const normalizedContextUrl = getContentBaseUrl(rawContextUrl);

  const baseUrl = getContentBaseUrl(normalizedContextUrl || '/');
  const target = isFolderish ? baseUrl : getParentUrl(baseUrl) || '/';

  return target || '/';
}

export function toPlateImageBlockData(
  createdItem: CreateContentResponse,
  file: Pick<File, 'name'>,
): PlateImageBlockData {
  const rawId = createdItem?.['@id'];

  if (typeof rawId !== 'string' || rawId.length === 0) {
    throw new Error('Image creation did not return a content URL');
  }

  const hasImageScales =
    createdItem.image_scales &&
    typeof createdItem.image_scales === 'object' &&
    !Array.isArray(createdItem.image_scales);
  // `@createContent` returns the created content, whose image field holds
  // the scales. Store them the catalog way, as Volto's image widget does, so
  // the editor renders the image before the server enhances the block data
  // on save.
  const hasImage =
    !hasImageScales &&
    createdItem.image &&
    typeof createdItem.image === 'object' &&
    !Array.isArray(createdItem.image);

  return {
    align: 'center',
    alt: createdItem.title || file.name || 'Pasted image',
    image_field: hasImage
      ? 'image'
      : typeof createdItem.image_field === 'string'
        ? createdItem.image_field
        : undefined,
    image_scales: hasImageScales
      ? createdItem.image_scales
      : hasImage
        ? { image: [createdItem.image] }
        : undefined,
    size: 'l',
    url: flattenToAppURL(rawId),
  };
}
