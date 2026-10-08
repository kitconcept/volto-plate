import { ElementApi, KEYS, TextApi, type Descendant } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

/** Properties a node can carry without being formatted. */
const NEUTRAL_KEYS = new Set(['id', 'text', 'type', 'children']);

const isPlain = (node: Descendant) =>
  Object.keys(node).every((key) => NEUTRAL_KEYS.has(key));

const isPlainText = (node: Descendant) => TextApi.isText(node) && isPlain(node);

const getText = (nodes: Descendant[]) =>
  nodes.map((node) => (node as { text: string }).text).join('');

/**
 * The lines of a fragment made of unformatted text: paragraphs, or bare
 * text, without marks, links or other inline elements. Blank lines are
 * dropped. `null` when the fragment has any structure or formatting of its
 * own, like a heading, a list or bold text.
 */
export function getPlainLines(fragment: Descendant[]): string[] | null {
  let texts: string[];

  if (fragment.every(isPlainText)) {
    texts = [getText(fragment)];
  } else if (
    fragment.every(
      (node) =>
        ElementApi.isElement(node) &&
        node.type === KEYS.p &&
        isPlain(node) &&
        node.children.every(isPlainText),
    )
  ) {
    texts = fragment.map((node) =>
      getText((node as { children: [] }).children),
    );
  } else {
    return null;
  }

  const lines = texts
    .flatMap((text) => text.split(/\r?\n/))
    .filter((line) => line.trim());

  return lines.length ? lines : null;
}

/**
 * Pastes unformatted text as if it was typed, so it takes the styles of
 * where it lands: the heading or list item it goes in, and the marks like
 * bold that are toggled on. Each further line starts a new block, like
 * pressing Enter: in a list, every line becomes a list item.
 *
 * Inserting it as a fragment would replace an empty heading or list item
 * with paragraphs and drop the toggled marks. Pasted content with its own
 * formatting, like a heading from a web page, is inserted as is.
 */
export const VoltoPastePlainTextPlugin = createPlatePlugin({
  key: 'voltoPastePlainText',
}).overrideEditor(({ editor, tf: { insertFragment } }) => ({
  transforms: {
    insertFragment(fragment, options) {
      const lines =
        editor.selection && !options?.at ? getPlainLines(fragment) : null;

      if (!lines) {
        insertFragment(fragment, options);
        return;
      }

      lines.forEach((line, index) => {
        if (index > 0) editor.tf.insertBreak();
        editor.tf.insertText(line);
      });
    },
  },
}));
