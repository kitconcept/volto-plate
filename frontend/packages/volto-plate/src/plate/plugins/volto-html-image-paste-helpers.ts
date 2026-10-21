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

/**
 * Elements that hold image blocks among their children: the images of a
 * table stay in their cells.
 */
const IMAGE_HOLDER_TYPES = ['td', 'th'];

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};

export const isPastedImage = (node: unknown): node is PastedImageElement =>
  ElementApi.isElement(node) && node.type === PASTED_IMAGE_TYPE;

/**
 * Moves the pasted images of an HTML fragment out of their blocks, where they
 * can become image blocks: to the top level, or to the table cell holding
 * them. Each element holding an image is split around it, and its parts
 * without content are dropped.
 */
export function liftPastedImages(
  nodes: Descendant[],
  isVoid: (element: TElement) => boolean,
): Descendant[] {
  const hasContent = (node: Descendant): boolean =>
    TextApi.isText(node)
      ? node.text.trim() !== ''
      : isVoid(node) || node.children.some(hasContent);

  const split = (node: Descendant): Descendant[] => {
    if (!ElementApi.isElement(node) || isPastedImage(node)) return [node];

    const children = node.children.flatMap(split);
    if (
      IMAGE_HOLDER_TYPES.includes(node.type) ||
      !children.some(isPastedImage)
    ) {
      return [{ ...node, children }];
    }

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

/**
 * Replaces the pasted images of a fragment, at any depth, with what
 * `replace` returns for them: a node, or nothing to drop the image.
 */
export function replacePastedImages(
  nodes: Descendant[],
  replace: (image: PastedImageElement) => Descendant | null,
): Descendant[] {
  return nodes.flatMap((node): Descendant[] => {
    if (isPastedImage(node)) {
      const replacement = replace(node);
      return replacement ? [replacement] : [];
    }
    if (!ElementApi.isElement(node)) return [node];

    const children = replacePastedImages(node.children, replace);
    return [{ ...node, children: children.length ? children : [{ text: '' }] }];
  });
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

export type RtfPicture = {
  dataUrl: string;
  /** `wzName` and `wzDescription` of the picture, when given. */
  names: string[];
};

const RTF_PICTURE_TYPES: Record<string, string> = {
  jpegblip: 'image/jpeg',
  pngblip: 'image/png',
};

function hexToBase64(hex: string) {
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  return btoa(binary);
}

/** The contents of the RTF group opening at `start`, without its braces. */
function getRtfGroup(rtf: string, start: number) {
  let depth = 0;
  for (let i = start; i < rtf.length; i++) {
    const char = rtf[i];
    if (char === '\\') {
      i++;
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      return rtf.slice(start + 1, i);
    }
  }
  return null;
}

/**
 * The PNG and JPEG pictures of an RTF document, in document order. Word's
 * WMF fallbacks (`\nonshppict`) are skipped.
 */
export function getRtfPictures(rtf: string): RtfPicture[] {
  const pictures: RtfPicture[] = [];
  const pictStart = /\{\\pict(?![a-zA-Z])/g;

  for (const match of rtf.matchAll(pictStart)) {
    const group = getRtfGroup(rtf, match.index);
    if (!group) continue;

    const type = /\\(pngblip|jpegblip)(?![a-zA-Z])/.exec(group)?.[1];
    if (!type) continue;

    const names = [
      ...group.matchAll(/\{\\sn (?:wzName|wzDescription)\}\{\\sv ([^}]*)\}/g),
    ].map(([, name]) => name.trim());

    // Drop the nested groups and the control words: the hex data remains.
    let data = group;
    let previous;
    do {
      previous = data;
      data = data.replace(/\{[^{}]*\}/g, ' ');
    } while (data !== previous);
    data = data.replace(/\\[a-zA-Z]+-?\d* ?/g, '').replace(/\s+/g, '');

    if (!/^(?:[0-9a-f]{2})+$/i.test(data)) continue;

    pictures.push({
      dataUrl: `data:${RTF_PICTURE_TYPES[type]};base64,${hexToBase64(data)}`,
      names,
    });
  }

  return pictures;
}

const decodeHtmlAttribute = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/**
 * Points the `file://` images of pasted HTML at their data from the RTF on
 * the clipboard. LibreOffice links its images to temporary files, which the
 * browser can't read, and puts their data in the RTF only. An image takes the
 * picture with its name (`alt`), or the picture at its position when every
 * picture has an image.
 *
 * Word's images are resolved by `DocxPlugin` through their VML shapes.
 */
export function embedRtfPictures(html: string, rtf: string) {
  if (!rtf || !/<img\b[^>]*\bsrc\s*=\s*["']?file:/i.test(html)) return html;

  const pictures = getRtfPictures(rtf);
  if (pictures.length === 0) return html;

  const fileImage = /<img\b[^>]*>/gi;
  const fileImages = [...html.matchAll(fileImage)].filter(([tag]) =>
    /\bsrc\s*=\s*["']?file:/i.test(tag),
  );
  const byPosition = fileImages.length === pictures.length;
  const unused = new Set(pictures);
  let index = 0;

  return html.replace(fileImage, (tag) => {
    const src = /\bsrc\s*=\s*(["'])(file:[^"']*)\1/i.exec(tag);
    if (!src) return tag;

    const position = index++;
    const alt = decodeHtmlAttribute(
      /\balt\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2] ?? '',
    ).trim();
    const picture =
      (alt && [...unused].find((p) => p.names.includes(alt))) ||
      (byPosition ? pictures[position] : undefined);
    if (!picture || !unused.has(picture)) return tag;

    unused.delete(picture);
    return tag.replace(src[0], `src="${picture.dataUrl}"`);
  });
}
