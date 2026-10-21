import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { ElementApi, KEYS, type Descendant } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

/** Text styles of the source document: fonts, sizes and colors. */
const TEXT_STYLE_KEYS = [
  'backgroundColor',
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
];

/** Block styles of the source document: layout, spacing and table looks. */
const ELEMENT_STYLE_KEYS = [
  'align',
  'background',
  'borders',
  'colSizes',
  'lineHeight',
  'marginLeft',
  'minHeight',
  'size',
  'textIndent',
];

/**
 * Drops the styling of pasted content, keeping its meaning: headings, lists,
 * tables, quotes, links, images and marks like bold or italic stay, while
 * fonts, sizes, colors, alignment, spacing and table looks go, so the pasted
 * content takes the styles of the wiki page.
 *
 * Image blocks keep their properties: they are set by the paste itself.
 */
export function stripPastedFormatting(nodes: Descendant[]): Descendant[] {
  return nodes.map((node): Descendant => {
    if (!ElementApi.isElement(node)) {
      const text = { ...node };
      for (const key of TEXT_STYLE_KEYS) delete text[key];
      return text;
    }

    if (node.type === PLONE_BLOCK_TYPE) return node;

    const element = { ...node };
    for (const key of ELEMENT_STYLE_KEYS) delete element[key];
    // An indent is a list level; on its own, it is the document's margin.
    if (!element.listStyleType) delete element.indent;

    return { ...element, children: stripPastedFormatting(node.children) };
  });
}

/** Pasted HTML, from Word, LibreOffice or a web page, takes the wiki styles. */
export const VoltoPasteFormattingPlugin = createPlatePlugin({
  key: 'voltoPasteFormatting',
  inject: {
    plugins: {
      [KEYS.html]: {
        parser: {
          transformFragment: ({ fragment }) => stripPastedFormatting(fragment),
        },
      },
    },
  },
});
