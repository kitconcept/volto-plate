import { ElementApi, TextApi, type Descendant, type TElement } from 'platejs';
import { flattenToAppURL, isInternalURL } from '@plone/volto/helpers/Url/Url';

/**
 * Inline element the HTML paste turns each `<img>` into. It never reaches the
 * document: `liftPastedImages` moves it out to the top level, where it is
 * replaced by an image block.
 */
export const PASTED_IMAGE_TYPE = 'voltoPastedImage';

export type PastedImageElement = TElement & {
  type: typeof PASTED_IMAGE_TYPE;
  alt: string;
  src: string;
};

/**
 * Where a pasted image comes from:
 * - `embedded`: the image travels with the clipboard (`data:` or `blob:`
 *   URL), as in pastes from Word, whose images `DocxPlugin` turns into data
 *   URLs.
 * - `internal`: an image of this site.
 * - `external`: an image of another site.
 * - `unsupported`: a source the browser cannot load, like `file://`.
 */
export type PastedImageSourceKind =
  | 'embedded'
  | 'external'
  | 'internal'
  | 'unsupported';

/** Elements whose children can't be split around an image block. */
const UNSPLITTABLE_TYPES = ['table', 'tr', 'td', 'th'];

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};

export const isPastedImage = (node: unknown): node is PastedImageElement =>
  ElementApi.isElement(node) && node.type === PASTED_IMAGE_TYPE;

/**
 * Moves the pasted images of an HTML fragment out to its top level, where
 * they can become image blocks. Each element holding an image is split around
 * it, and its parts without content are dropped. The images of a table are
 * placed after it.
 */
export function liftPastedImages(
  nodes: Descendant[],
  isVoid: (element: TElement) => boolean,
): Descendant[] {
  const hasContent = (node: Descendant): boolean =>
    TextApi.isText(node)
      ? node.text.trim() !== ''
      : isVoid(node) || node.children.some(hasContent);

  const extractImages = (
    node: Descendant,
    images: PastedImageElement[],
  ): Descendant => {
    if (!ElementApi.isElement(node)) return node;

    const children: Descendant[] = [];
    for (const child of node.children) {
      if (isPastedImage(child)) {
        images.push(child);
      } else {
        children.push(extractImages(child, images));
      }
    }

    return { ...node, children: children.length ? children : [{ text: '' }] };
  };

  const split = (node: Descendant): Descendant[] => {
    if (!ElementApi.isElement(node) || isPastedImage(node)) return [node];

    if (UNSPLITTABLE_TYPES.includes(node.type)) {
      const images: PastedImageElement[] = [];
      return [extractImages(node, images), ...images];
    }

    const children = node.children.flatMap(split);
    if (!children.some(isPastedImage)) return [{ ...node, children }];

    const parts: Descendant[] = [];
    let group: Descendant[] = [];
    const flush = () => {
      if (group.some(hasContent)) parts.push({ ...node, children: group });
      group = [];
    };

    for (const child of children) {
      if (isPastedImage(child)) {
        flush();
        parts.push(child);
      } else {
        group.push(child);
      }
    }
    flush();

    return parts;
  };

  return nodes.flatMap(split);
}

export function getPastedImageSourceKind(src: string): PastedImageSourceKind {
  if (/^(data:image\/|blob:)/i.test(src)) return 'embedded';
  if (/^https?:\/\//i.test(src) || /^\/(?!\/)/.test(src)) {
    return isInternalURL(src) ? 'internal' : 'external';
  }
  return 'unsupported';
}

/**
 * The path of the content an internal image URL points at, without the scale
 * or view part: `/page/photo.png/@@images/image/large` -> `/page/photo.png`.
 */
export function getPastedImageContentPath(src: string) {
  return (
    flattenToAppURL(src.split(/[?#]/)[0])
      .replace(/\/@@(images|download|display-file)(\/.*)?$/, '')
      .replace(/\/(view|image_view_fullscreen)$/, '') || '/'
  );
}

/** A file name for an uploaded pasted image. */
export function getPastedImageFileName(src: string, mimeType: string) {
  if (/^https?:\/\//i.test(src)) {
    try {
      const name = decodeURIComponent(
        new URL(src).pathname.split('/').pop() ?? '',
      );
      if (/\.\w+$/.test(name)) return name;
    } catch {
      // Fall back to a generic name.
    }
  }

  const extension =
    MIME_TYPE_EXTENSIONS[mimeType] ?? mimeType.split('/')[1] ?? 'png';

  return `pasted-image.${extension}`;
}
