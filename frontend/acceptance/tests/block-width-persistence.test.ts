import type { Page } from '@playwright/test';

import { login } from './login';
import { expect, test } from './test';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  savePage,
} from '../fixtures/pages';
import {
  focusBlockStart,
  getValue,
  insertWithSlashMenu,
  pasteData,
  type EditorNode,
} from '../fixtures/editor';

// The width of every top-level block is stored in the document, the default
// one too. A width the editor only adds when a page is loaded would show up in
// the history diff as a change between two versions that nobody made.

test.setTimeout(30_000);

const DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const emptyParagraph = { type: 'p', children: [{ text: '' }] };

const topLevelWidths = (value: EditorNode[]) =>
  value.map((node) => [node.type, node.blockWidth]);

/**
 * Saves the page and checks that what is stored has a width on every
 * top-level block and loads back into the editor unchanged.
 */
async function saveAndExpectStableWidths(page: Page, contentPath: string) {
  await savePage(page, contentPath);
  const stored = (await getStoredValue(page, contentPath)) as EditorNode[];

  for (const node of stored) {
    expect(typeof node.blockWidth, `width of "${node.type}"`).toBe('string');
  }

  const editorHandle = await openInEditor(page, contentPath);
  expect(topLevelWidths(await getValue(page, editorHandle))).toEqual(
    topLevelWidths(stored),
  );

  return stored;
}

test.describe('Native blocks', () => {
  for (const label of [
    'Heading 2',
    'Blockquote',
    'Callout',
    'Code Block',
    'Table',
    'Table of contents',
    '3 columns',
  ]) {
    test(`"${label}" from the slash menu stores its default width`, async ({
      page,
    }) => {
      await login(page);
      const contentPath = await createNativeBlocksPage(page, [], {
        extra: [emptyParagraph],
      });
      const editorHandle = await openInEditor(page, contentPath);

      await insertWithSlashMenu(page, editorHandle, 1, label);
      await expect
        .poll(async () =>
          (await getValue(page, editorHandle)).some(
            (node) => node.type !== 'p' && node.type !== 'title',
          ),
        )
        .toBe(true);

      await saveAndExpectStableWidths(page, contentPath);
    });
  }

  test('Typed and pasted blocks store their default width', async ({
    page,
  }) => {
    await login(page);
    const contentPath = await createNativeBlocksPage(page, [], {
      extra: [emptyParagraph, emptyParagraph, emptyParagraph],
    });
    const editorHandle = await openInEditor(page, contentPath);

    await focusBlockStart(page, editorHandle, 1);
    await page.keyboard.type('## Typed heading');
    await focusBlockStart(page, editorHandle, 2);
    await page.keyboard.type('```');
    await page.keyboard.type('typed code');
    await focusBlockStart(page, editorHandle, 3);
    await pasteData(page, editorHandle, {
      'text/html':
        '<h3>Pasted heading</h3><p>Pasted paragraph</p><hr><blockquote>Pasted quote</blockquote>',
    });
    await expect
      .poll(async () =>
        (await getValue(page, editorHandle)).map((node) => node.type),
      )
      .toEqual(
        expect.arrayContaining(['h2', 'code_block', 'h3', 'hr', 'blockquote']),
      );

    await saveAndExpectStableWidths(page, contentPath);
  });

  test('Blocks stored without a width get it on the first save', async ({
    page,
  }) => {
    await login(page);
    const contentPath = await createNativeBlocksPage(page, [
      'headings',
      'blockquote',
      'codeBlock',
      'callout',
      'hr',
    ]);
    await openInEditor(page, contentPath);

    await saveAndExpectStableWidths(page, contentPath);
  });
});

test.describe('Plone blocks', () => {
  const imageBlock = (blockWidth?: string) => ({
    type: 'ploneBlock',
    '@type': 'plateimage',
    url: DATA_URI,
    alt: 'Inline test image',
    ...(blockWidth ? { blockWidth } : {}),
    children: [{ text: '' }],
  });

  test('Image from the slash menu stores its default width', async ({
    page,
  }) => {
    await login(page);
    const contentPath = await createNativeBlocksPage(page, [], {
      extra: [emptyParagraph],
    });
    const editorHandle = await openInEditor(page, contentPath);

    await insertWithSlashMenu(page, editorHandle, 1, 'Image');
    await expect(
      page.getByText('Browse the site, drop an image, or use a URL'),
    ).toBeVisible();

    const stored = await saveAndExpectStableWidths(page, contentPath);

    expect(
      stored.find((node) => node['@type'] === 'plateimage')?.blockWidth,
    ).toBe('default');
  });

  test('Image stored without a width gets it on the first save', async ({
    page,
  }) => {
    await login(page);
    const contentPath = await createNativeBlocksPage(page, [], {
      extra: [imageBlock()],
    });
    await openInEditor(page, contentPath);

    const stored = await saveAndExpectStableWidths(page, contentPath);

    expect(stored[1]).toMatchObject({
      '@type': 'plateimage',
      blockWidth: 'default',
    });
  });

  test('A non-default image width is stored, kept and rendered', async ({
    page,
  }) => {
    await login(page);
    const contentPath = await createNativeBlocksPage(page, [], {
      extra: [imageBlock('default'), emptyParagraph],
    });
    const editorHandle = await openInEditor(page, contentPath);
    const editorImage = page.locator(
      '.slate-editor img[alt="Inline test image"]',
    );

    const narrow = page
      .locator('#sidebar-properties .field-wrapper-blockWidth')
      .getByRole('radio', { name: 'Narrow' });
    await expect(async () => {
      await editorImage.click({ force: true });
      await narrow.click({ force: true, timeout: 2_000 });
    }).toPass();
    await expect
      .poll(async () => (await getValue(page, editorHandle))[1]?.blockWidth)
      .toBe('narrow');

    const stored = await saveAndExpectStableWidths(page, contentPath);
    expect(stored[1]).toMatchObject({
      '@type': 'plateimage',
      blockWidth: 'narrow',
    });

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await expect(
      page
        .locator('img[alt="Inline test image"]')
        .first()
        .locator('xpath=ancestor::*[contains(@style, "--block-width")][1]'),
    ).toHaveAttribute(
      'style',
      /--block-width:\s*var\(--narrow-container-width\)/,
    );
  });
});
