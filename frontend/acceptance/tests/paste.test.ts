import type { Page } from '@playwright/test';
import { getEditorHandle } from '@platejs/playwright';

import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import {
  editable,
  focusBlockStart,
  getValue,
  nodeText,
  pasteData,
  type EditorHandle,
  type EditorNode,
} from '../fixtures/editor';
import {
  BLOCKED_IMAGE_URL,
  DOCX_HTML,
  DOCX_IMAGE_HTML,
  DOCX_IMAGE_RTF,
  H1_HTML,
  LIBREOFFICE_IMAGE_HTML,
  LIBREOFFICE_IMAGE_RTF,
  LIBREOFFICE_TITLE_HTML,
  LIBREOFFICE_TITLE_RTF,
  MARKDOWN_TEXT,
  PNG_BASE64,
  REMOTE_IMAGE_URL,
  STYLED_HTML,
  TABLE_IMAGE_HTML,
  WEB_HTML,
  WEB_IMAGE_HTML,
} from '../fixtures/clipboard';
import { login } from './login';
import { expect, test } from './test';

/**
 * One line per top-level block, so expectations read like the pasted
 * document: `h2 Heading`, `disc/2 Nested item`, `table 2x2`, ...
 */
const outline = (nodes: EditorNode[]) =>
  nodes
    .filter((node) => !(node.type === 'p' && nodeText(node) === ''))
    .map((node) => {
      if (node.type === 'table') {
        const rows = node.children ?? [];
        return `table ${rows.length}x${rows[0]?.children?.length ?? 0}`;
      }
      if (node.listStyleType) {
        return `${node.listStyleType}/${node.indent} ${nodeText(node)}`;
      }
      return `${node.type} ${nodeText(node)}`;
    });

/** Marks and links of the first paragraph that contains a link. */
const inlineFormatting = (nodes: EditorNode[]) => {
  const paragraph = nodes.find((node) =>
    node.children?.some((child) => child.type === 'a'),
  );
  return {
    bold: paragraph?.children?.find((c) => c.bold)?.text,
    italic: paragraph?.children?.find((c) => c.italic)?.text,
    link: paragraph?.children?.find((c) => c.type === 'a')?.url,
  };
};

test.beforeEach(async ({ page }) => {
  await login(page);
});

async function pasteIntoEmptyParagraph(
  page: Page,
  data: Record<string, string>,
) {
  const path = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  const editorHandle = await openInEditor(page, path);
  await focusBlockStart(page, editorHandle, 1);

  await pasteData(page, editorHandle, data);

  // Wait until the paste has produced more than the title and a paragraph.
  await expect
    .poll(async () => (await getValue(page, editorHandle)).length)
    .toBeGreaterThan(3);
  return (await getValue(page, editorHandle)).slice(1);
}

test('Pasting from Word keeps headings, marks, links, lists and tables', async ({
  page,
}) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': DOCX_HTML,
    'text/plain': 'Word content',
  });

  expect(outline(value)).toEqual([
    'h2 Word heading',
    'p Word paragraph with bold, italic and a Word link.',
    'disc/1 Word bullet one',
    'disc/2 Word bullet nested',
    'disc/1 Word bullet two',
    'decimal/1 Word number one',
    'decimal/1 Word number two',
    'table 2x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: 'italic',
    link: 'https://plone.org',
  });
  // Word's markup and inline styles must not leak into the document.
  expect(JSON.stringify(value)).not.toMatch(/mso-|Mso|o:p/);
});

test('Pasting HTML from a web page keeps its structure', async ({ page }) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': WEB_HTML,
    'text/plain': 'Web content',
  });

  expect(outline(value)).toEqual([
    'h2 Web heading',
    'p Web paragraph with bold, italic and a web link.',
    'disc/1 Web bullet one',
    'disc/1 Web bullet two',
    'decimal/1 Web number one',
    'decimal/1 Web number two',
    'blockquote Web quote',
    'code_block const web = true;',
    'table 2x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: 'italic',
    link: 'https://plone.org',
  });
  // v53 blockquotes are containers of paragraphs.
  expect(value.find((n) => n.type === 'blockquote')?.children?.[0]?.type).toBe(
    'p',
  );
});

/**
 * One line per top-level block of a paste with images: `p Text`, or
 * `image <alt>` for an image block.
 */
const imageOutline = (nodes: EditorNode[]) =>
  nodes
    .filter((node) => !(node.type === 'p' && nodeText(node).trim() === ''))
    .map((node) =>
      node.type === 'ploneBlock'
        ? `${node['@type']} ${node.alt}`
        : `${node.type} ${nodeText(node).trim()}`,
    );

/** The image blocks of the editor, once `uploaded` of them are uploaded. */
async function uploadedImages(
  page: Page,
  editorHandle: EditorHandle,
  uploaded: number,
) {
  const images = async () =>
    (await getValue(page, editorHandle)).filter(
      (node) => node['@type'] === 'plateimage',
    );

  await expect
    .poll(
      async () => (await images()).filter((node) => node.image_scales).length,
    )
    .toBe(uploaded);
  return await images();
}

test('Pasting from Word uploads its images as image blocks', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  const editorHandle = await openInEditor(page, path);
  await focusBlockStart(page, editorHandle, 1);

  const upload = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.request().postData()?.includes('"@type":"Image"') === true,
  );
  await pasteData(page, editorHandle, {
    'text/html': DOCX_IMAGE_HTML,
    'text/rtf': DOCX_IMAGE_RTF,
    'text/plain': 'Word content',
  });
  const created = await (await upload).json();

  const [image] = await uploadedImages(page, editorHandle, 1);
  expect(imageOutline((await getValue(page, editorHandle)).slice(1))).toEqual([
    'p Word text before the image',
    'plateimage Word image',
    'p Word text after the image',
  ]);
  expect(image).toMatchObject({
    type: 'ploneBlock',
    url: new URL(created['@id']).pathname,
    image_field: 'image',
  });
  // The image renders in the editor straight away.
  await expect
    .poll(() =>
      editable(page)
        .locator('img[alt="Word image"]')
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(JSON.stringify(await getValue(page, editorHandle))).not.toMatch(
    /file:\/\/|data:image/,
  );
});

test('Pasting from LibreOffice uploads its images as image blocks', async ({
  page,
}) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': LIBREOFFICE_IMAGE_HTML,
    'text/rtf': LIBREOFFICE_IMAGE_RTF,
    'text/plain': 'LibreOffice content',
  });

  expect(imageOutline(value)).toEqual([
    'p LibreOffice text before the image',
    'plateimage LibreOffice image',
    'p LibreOffice text after the image',
  ]);

  const editorHandle = await getEditorHandle(page, editable(page));
  const [image] = await uploadedImages(page, editorHandle, 1);
  expect(image.url).toMatch(/^\/.+/);
  expect(JSON.stringify(await getValue(page, editorHandle))).not.toMatch(
    /file:\/\/|data:image/,
  );
});

test('Undoing and redoing an image paste keeps the uploaded image', async ({
  page,
}) => {
  await pasteIntoEmptyParagraph(page, {
    'text/html': LIBREOFFICE_IMAGE_HTML,
    'text/rtf': LIBREOFFICE_IMAGE_RTF,
    'text/plain': 'LibreOffice content',
  });
  const editorHandle = await getEditorHandle(page, editable(page));
  const [uploaded] = await uploadedImages(page, editorHandle, 1);
  const history = (action: 'undo' | 'redo') =>
    page.evaluate(
      ([editor, action]: [any, 'undo' | 'redo']) => editor[action](),
      [editorHandle, action] as [any, 'undo' | 'redo'],
    );

  // One undo removes the whole paste: the upload is no step of its own.
  await history('undo');
  expect(imageOutline((await getValue(page, editorHandle)).slice(1))).toEqual(
    [],
  );

  await history('redo');
  const images = (await getValue(page, editorHandle)).filter(
    (node) => node['@type'] === 'plateimage',
  );
  expect(images).toEqual([
    expect.objectContaining({
      url: uploaded.url,
      image_scales: uploaded.image_scales,
    }),
  ]);
});

test('Pasting HTML from a web page uploads its images as image blocks', async ({
  page,
}) => {
  const png = Buffer.from(PNG_BASE64, 'base64');
  await page.route(REMOTE_IMAGE_URL, (route) =>
    route.fulfill({
      body: png,
      contentType: 'image/png',
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),
  );
  // A site that doesn't allow fetching its images (CORS) fails the fetch
  // like a network error does: the image block links to the image.
  await page.route(BLOCKED_IMAGE_URL, (route) => route.abort());

  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': WEB_IMAGE_HTML,
    'text/plain': 'Web content',
  });

  expect(imageOutline(value)).toEqual([
    'p Web text before',
    'plateimage Embedded image',
    'p web text after',
    'plateimage Remote image',
    'plateimage Blocked image',
  ]);

  const editorHandle = await getEditorHandle(page, editable(page));
  const images = await uploadedImages(page, editorHandle, 2);
  const byAlt = Object.fromEntries(images.map((node) => [node.alt, node]));

  for (const alt of ['Embedded image', 'Remote image']) {
    expect(byAlt[alt].url).toMatch(/^\/.+/);
    expect(byAlt[alt].image_scales).toBeTruthy();
  }
  expect(byAlt['Remote image'].url).toMatch(/remote-photo\.png$/);
  expect(byAlt['Blocked image']).toMatchObject({ url: BLOCKED_IMAGE_URL });
  expect(byAlt['Blocked image'].image_scales).toBeUndefined();
});

test('Pasting a table keeps its images in their cells', async ({ page }) => {
  const path = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  const editorHandle = await openInEditor(page, path);
  await focusBlockStart(page, editorHandle, 1);

  await pasteData(page, editorHandle, {
    'text/html': TABLE_IMAGE_HTML,
    'text/plain': 'Table content',
  });

  const lastCell = async () => {
    const table = (await getValue(page, editorHandle)).find(
      (node) => node.type === 'table',
    );
    return table?.children?.at(-1)?.children?.at(-1);
  };

  await expect
    .poll(async () => (await lastCell())?.children?.[0]?.image_scales)
    .toBeTruthy();
  expect((await lastCell())?.children).toEqual([
    expect.objectContaining({
      type: 'ploneBlock',
      '@type': 'plateimage',
      alt: 'Cell image',
      url: expect.stringMatching(/^\/.+/),
    }),
  ]);
  // Nothing was placed after the table.
  expect(
    imageOutline((await getValue(page, editorHandle)).slice(1)).filter((line) =>
      line.startsWith('plateimage'),
    ),
  ).toEqual([]);
  await expect(
    editable(page).locator('td img[alt="Cell image"]'),
  ).toBeVisible();
});

test('Pasted content takes the styles of the wiki page', async ({ page }) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/html': STYLED_HTML,
    'text/plain': 'Styled content',
  });

  expect(outline(value)).toEqual([
    'h2 Styled heading',
    'p Styled bold and link',
    'decimal/1 Styled item',
    'table 1x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: undefined,
    link: 'https://plone.org',
  });
  // Fonts, sizes, colors, alignment, spacing and cell backgrounds are gone.
  expect(JSON.stringify(value)).not.toMatch(
    /"(color|backgroundColor|fontFamily|fontSize|align|lineHeight|textIndent|background|borders|colSizes)"/,
  );
  expect(
    value.find((node) => nodeText(node) === 'Styled bold and link'),
  ).not.toHaveProperty('indent');
});

for (const [source, data] of [
  ['HTML', { 'text/html': H1_HTML, 'text/plain': 'H1 content' }],
  [
    'markdown',
    {
      'text/plain':
        'Text before the title\n\n# Pasted **document** title\n\nText after the title\n\n# Second H1\n',
    },
  ],
] as const) {
  test(`The first H1 pasted from ${source} becomes the page title`, async ({
    page,
  }) => {
    const path = await createNativeBlocksPage(page, [], {
      title: 'Old title',
      extra: [{ type: 'p', children: [{ text: '' }] }],
    });
    const editorHandle = await openInEditor(page, path);
    await focusBlockStart(page, editorHandle, 1);

    await pasteData(page, editorHandle, data);

    await expect
      .poll(async () => (await getValue(page, editorHandle))[0])
      .toMatchObject({
        type: 'title',
        children: [{ text: 'Pasted document title' }],
      });
    expect(outline((await getValue(page, editorHandle)).slice(1))).toEqual([
      'p Text before the title',
      'p Text after the title',
      'h2 Second H1',
    ]);
    // The title field of the form follows the title block.
    await expect(page.locator('h1.documentFirstHeading')).toHaveText(
      'Pasted document title',
    );
  });
}

test('The Title paragraph pasted from LibreOffice becomes the page title', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, [], {
    title: 'Old title',
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  const editorHandle = await openInEditor(page, path);
  await focusBlockStart(page, editorHandle, 1);

  await pasteData(page, editorHandle, {
    'text/html': LIBREOFFICE_TITLE_HTML,
    'text/rtf': LIBREOFFICE_TITLE_RTF,
    'text/plain': 'LibreOffice content',
  });

  await expect
    .poll(async () => (await getValue(page, editorHandle))[0])
    .toMatchObject({
      type: 'title',
      children: [{ text: 'LibreOffice document title' }],
    });
  // The H1 is a section of the document: it stays a heading.
  expect(outline((await getValue(page, editorHandle)).slice(1))).toEqual([
    'p LibreOffice intro',
    'h2 LibreOffice section',
  ]);
});

test('Pasting markdown as plain text converts it to blocks', async ({
  page,
}) => {
  const value = await pasteIntoEmptyParagraph(page, {
    'text/plain': MARKDOWN_TEXT,
  });

  expect(outline(value)).toEqual([
    'h2 Markdown heading',
    'p Markdown paragraph with bold, italic and a markdown link.',
    'disc/1 Markdown bullet one',
    'disc/1 Markdown bullet two',
    'decimal/1 Markdown number one',
    'decimal/1 Markdown number two',
    'blockquote Markdown quote',
    'code_block const markdown = true;',
    'table 2x2',
  ]);
  expect(inlineFormatting(value)).toEqual({
    bold: 'bold',
    italic: 'italic',
    link: 'https://plone.org',
  });
  expect(value.find((n) => n.type === 'code_block')?.lang).toBe('js');
  // The markdown table header row becomes header cells.
  expect(
    value.find((n) => n.type === 'table')?.children?.[0]?.children?.[0]?.type,
  ).toBe('th');
});

test('Pasting a plain URL does not run the markdown parser', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: 'See ' }] }],
  });
  const editorHandle = await openInEditor(page, path);
  await editable(page).getByText('See', { exact: true }).click();
  await page.keyboard.press('End');

  await pasteData(page, editorHandle, { 'text/plain': 'https://plone.org' });

  await expect
    .poll(async () => (await getValue(page, editorHandle))[1])
    .toMatchObject({
      type: 'p',
      children: expect.arrayContaining([
        expect.objectContaining({ type: 'a', url: 'https://plone.org' }),
      ]),
    });
  // Still one paragraph: the URL was linked in place, not parsed as blocks.
  expect(
    (await getValue(page, editorHandle)).filter((n) => nodeText(n) !== ''),
  ).toHaveLength(2);
});
