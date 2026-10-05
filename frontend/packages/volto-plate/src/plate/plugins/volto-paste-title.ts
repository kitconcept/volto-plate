import { ElementApi, KEYS, NodeApi, type Descendant } from 'platejs';
import { createPlatePlugin, type PlateEditor } from 'platejs/react';

import { setTitleBlockText } from './volto-title';

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The index of the brace closing the RTF group opening at `start`. */
function getRtfGroupEnd(rtf: string, start: number) {
  let depth = 0;
  for (let i = start; i < rtf.length; i++) {
    const char = rtf[i];
    if (char === '\\') {
      i++;
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      return i;
    }
  }
  return -1;
}

/** The plain text of an RTF paragraph. */
function getRtfText(rtf: string) {
  let text = rtf;
  let previous;
  // Drop the destinations (`{\*\...}`), like bookmarks and fields' code.
  do {
    previous = text;
    text = text.replace(/\{\\\*[^{}]*\}/g, '');
  } while (text !== previous);

  return normalizeText(
    text
      // Unicode characters, followed by their ANSI fallback.
      .replace(/\\u(-?\d+) ?(?:\\'[0-9a-f]{2}|\?)?/gi, (_, code) =>
        String.fromCharCode(code < 0 ? Number(code) + 65536 : Number(code)),
      )
      .replace(/\\'([0-9a-f]{2})/gi, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      )
      .replace(/\\~/g, ' ')
      .replace(/\\[-_]/g, '')
      .replace(/\\[a-z]+-?\d* ?/gi, '')
      .replace(/\\([\\{}])/g, '$1')
      .replace(/[{}]/g, ''),
  );
}

/**
 * The text of the first paragraph in the "Title" style of an RTF document.
 * Word and LibreOffice put it on the clipboard next to the HTML, which keeps
 * no trace of the style: LibreOffice turns a title into a big, bold
 * paragraph.
 */
export function getRtfDocumentTitle(rtf: string) {
  const stylesheetStart = rtf.search(/\{\\stylesheet(?![a-z])/);
  if (stylesheetStart === -1) return null;

  const stylesheetEnd = getRtfGroupEnd(rtf, stylesheetStart);
  if (stylesheetEnd === -1) return null;

  const style = /\{\\s(\d+)(?!\d)[^{}]*?\sTitle;\}/.exec(
    rtf.slice(stylesheetStart, stylesheetEnd),
  )?.[1];
  if (!style) return null;

  const body = rtf.slice(stylesheetEnd);
  const paragraph = new RegExp(`\\\\s${style}(?!\\d)`).exec(body);
  if (!paragraph) return null;

  const rest = body.slice(paragraph.index);
  const end = rest.search(/\\par(?![a-z])/);
  const title = getRtfText(end === -1 ? rest : rest.slice(0, end));

  return title || null;
}

/**
 * Takes the title of a pasted fragment: the top-level block with the text of
 * the document's title when it is known (`documentTitle`), or else the first
 * top-level H1 with text. The title leaves the fragment, and the H1s left
 * become H2s, the highest heading of the wiki page body.
 */
export function takePastedTitle(
  fragment: Descendant[],
  documentTitle: string | null = null,
) {
  let title: string | null = null;

  const demote = (nodes: Descendant[]): Descendant[] =>
    nodes.map((node) => {
      if (!ElementApi.isElement(node)) return node;
      return {
        ...node,
        ...(node.type === KEYS.h1 ? { type: KEYS.h2 } : {}),
        children: demote(node.children),
      };
    });

  const take = (isTitle: (node: Descendant, text: string) => boolean) =>
    fragment.findIndex((node) => {
      const text = normalizeText(NodeApi.string(node));
      return ElementApi.isElement(node) && text !== '' && isTitle(node, text);
    });

  let index = documentTitle
    ? take((_, text) => text === normalizeText(documentTitle))
    : -1;
  if (index === -1) {
    index = take((node) => ElementApi.isElement(node) && node.type === KEYS.h1);
  }
  if (index !== -1) title = normalizeText(NodeApi.string(fragment[index]));

  return {
    fragment: demote(fragment.filter((_, i) => i !== index)),
    title,
  };
}

const transformFragment = ({
  dataTransfer,
  editor,
  fragment,
}: {
  dataTransfer: DataTransfer;
  editor: unknown;
  fragment: Descendant[];
}) => {
  const rtf = dataTransfer.getData('text/rtf');
  const pasted = takePastedTitle(
    fragment,
    rtf ? getRtfDocumentTitle(rtf) : null,
  );
  if (pasted.title === null) return pasted.fragment;

  setTitleBlockText(editor as PlateEditor, pasted.title);

  // An empty fragment would leave the paste to the plain text one, which
  // would insert the title again.
  return pasted.fragment.length > 0 ? pasted.fragment : [{ text: '' }];
};

/**
 * The title of pasted content becomes the title of the wiki page: the
 * paragraph in the document's Title style for Word and LibreOffice, or else
 * the first H1, from HTML or markdown. The editor has no H1 blocks: the title
 * is the page's H1.
 */
export const VoltoPasteTitlePlugin = createPlatePlugin({
  key: 'voltoPasteTitle',
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        rules: [{ validNodeName: 'H1' }],
        parse: () => ({ type: KEYS.h1 }),
      },
    },
  },
  inject: {
    plugins: {
      [KEYS.html]: { parser: { transformFragment } },
      [KEYS.markdown]: { parser: { transformFragment } },
    },
  },
});
