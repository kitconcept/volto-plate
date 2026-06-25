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

export function isClipboardImagePaste(dataTransfer?: DataTransfer | null) {
  if (!dataTransfer) return false;

  const TEXT_HTML = 'text/html';
  const files = Array.from(dataTransfer.files ?? []);

  return (
    files.some((file) => file.type.startsWith('image/')) &&
    !Array.from(dataTransfer.types ?? []).includes(TEXT_HTML)
  );
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
  file: File,
): PlateImageBlockData {
  const rawId = createdItem?.['@id'];

  if (typeof rawId !== 'string' || rawId.length === 0) {
    throw new Error('Image creation did not return a content URL');
  }

  return {
    align: 'center',
    alt: createdItem.title || file.name || 'Pasted image',
    image_field:
      typeof createdItem.image_field === 'string'
        ? createdItem.image_field
        : undefined,
    image_scales:
      createdItem.image_scales &&
      typeof createdItem.image_scales === 'object' &&
      !Array.isArray(createdItem.image_scales)
        ? createdItem.image_scales
        : undefined,
    size: 'l',
    url: flattenToAppURL(rawId),
  };
}
