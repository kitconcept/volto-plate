/*
 * The parts of the `@blocks-schema` endpoint that describe the content of a
 * Plate editor content type (`config.settings.PlateEditorContentTypes`), used
 * by the endpoint's shadow. A page of such a type stores its content in one
 * block, `__somersault__`, whose `value` is a Plate document. Its nodes are
 * native elements, like paragraphs or tables, or Plone blocks, stored as
 * `ploneBlock` nodes. The format is the same as the one of Aurora's
 * `@blocks-schema`.
 */
import { SOMERSAULT_KEY } from '../constants';

/**
 * A `*.block.md` file, as collected by the `load-blocks-docs` loader.
 */
export type BlockDocsFile = {
  block?: string;
  variation?: string;
  /** A native element of the page document, like a Plate `callout`. */
  element?: string;
  title?: string;
  markdown: string;
};

export type ElementDetail = {
  '@id'?: string;
  id: string;
  title: string;
  kind: 'element';
  docs: string;
};

export type ItemSummary = {
  '@id': string;
  id: string;
  title: string;
  kind?: 'block' | 'element';
  description?: string;
  restricted?: boolean | 'context';
};

/**
 * What `blockToMarkdown` gets: a block's details, as the endpoint builds
 * them, or an element.
 */
type MarkdownDetail = {
  id: string;
  title: string;
  kind?: 'block' | 'element';
};

/**
 * The block ID whose docs describe the format of the page document, instead
 * of a block.
 */
export const DOCUMENT_DOCS_ID = SOMERSAULT_KEY;

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
const PLACEHOLDER = /(\\?)\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}/g;

/**
 * Whether the content type is edited with the Plate editor.
 */
export function isPlateContentType(
  contentType: string | undefined,
  plateContentTypes: readonly string[] = [],
): boolean {
  return Boolean(contentType && plateContentTypes.includes(contentType));
}

/**
 * Replaces `{{key}}` in the docs with that key of the configuration, as the
 * endpoint does for blocks. `\{{key}}` is literal.
 */
function fillPlaceholders(
  markdown: string,
  values: Record<string, unknown>,
  name: string,
): string {
  return markdown.replace(PLACEHOLDER, (match, escaped, key) => {
    if (escaped) return match.slice(1);
    const value = values[key];
    if (Array.isArray(value)) {
      return value.map((item) => `\`${item}\``).join(', ');
    }
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      return String(value);
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[blocks-schema] The docs of '${name}' use {{${key}}}, which the element configuration doesn't have as a value.`,
    );
    return '';
  });
}

/**
 * The first paragraph of the docs is the summary.
 */
function getSummary(markdown: string): string {
  const [first = ''] = markdown.split(/\n\s*\n/);
  return first.replace(/\s*\n\s*/g, ' ').trim();
}

/**
 * The docs of the page document format, from the `*.block.md` file that
 * names `__somersault__`.
 */
export function getDocumentDocs(docsFiles: BlockDocsFile[]): string {
  const file = docsFiles.find(
    (item) => item.block === DOCUMENT_DOCS_ID && !item.variation,
  );
  return file ? file.markdown.replace(FRONTMATTER, '').trim() : '';
}

/**
 * The documented elements that the editor supports, which are the ones in
 * `plateBlocksConfig`, in the order of their docs files. Their placeholders
 * are filled from their `plateBlocksConfig` entry.
 */
export function getElements(
  docsFiles: BlockDocsFile[],
  plateBlocksConfig: Record<string, object> = {},
): ElementDetail[] {
  return docsFiles
    .filter(
      (file): file is BlockDocsFile & { element: string } =>
        Boolean(file.element) && file.element! in plateBlocksConfig,
    )
    .map(({ element, title, markdown }) => ({
      id: element,
      title: title || element,
      kind: 'element' as const,
      docs: fillPlaceholders(
        markdown.replace(FRONTMATTER, ''),
        { id: element, ...plateBlocksConfig[element] },
        element,
      ).trim(),
    }));
}

export function elementSummary(
  { docs, ...element }: ElementDetail,
  url: string,
): ItemSummary {
  const item: ItemSummary = { '@id': url, ...element };
  const description = getSummary(docs);
  return description ? { ...item, description } : item;
}

/**
 * The line that says how an item is stored in the page document.
 */
export function nodeKindLine(detail: MarkdownDetail): string {
  return detail.kind === 'element'
    ? `_An element of the document: a node with \`"type": "${detail.id}"\`._`
    : `_A Plone block: a \`ploneBlock\` node with \`"@type": "${detail.id}"\`._`;
}

function summaryLine(item: ItemSummary): string {
  let line = `- [${item.title}](${item['@id']}) (\`${item.id}\`)`;
  if (item.description) line += `: ${item.description}`;
  return line;
}

/**
 * The list for a Plate content type as one Markdown document: an
 * introduction, the format of the page document, and a line per element and
 * per block that links to its documentation.
 */
export function plateBlocksToMarkdown(
  items: ItemSummary[],
  documentDocs = '',
): string {
  const elements = items.filter((item) => item.kind === 'element');
  const blocks = items.filter((item) => item.kind !== 'element');
  return (
    [
      '# Blocks',
      "The elements and blocks available to build a page of this content type. Follow an item's link for its documentation and, for a block, the schema of its settings.",
      ...(documentDocs ? ['## Document format', documentDocs] : []),
      ...(elements.length
        ? ['## Elements', elements.map(summaryLine).join('\n')]
        : []),
      ...(blocks.length
        ? ['## Blocks', blocks.map(summaryLine).join('\n')]
        : []),
    ].join('\n\n') + '\n'
  );
}

/**
 * The note of the list of all blocks about the content types that store a
 * Plate document instead.
 */
export function plateContentTypesNote(
  plateContentTypes: readonly string[],
): string {
  if (!plateContentTypes.length) return '';
  const types = plateContentTypes.map((type) => `\`${type}\``).join(', ');
  return `These content types don't use \`blocks_layout\`: ${types}. They store a Plate document in the \`${DOCUMENT_DOCS_ID}\` block, made of other elements and blocks. Ask \`/<path>/@blocks-schema\` for a content item of one of them, or \`/@blocks-schema?type=<type>\` before you create one.`;
}
