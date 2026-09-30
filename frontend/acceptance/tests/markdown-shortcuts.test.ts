import type { Page } from '@playwright/test';
import { clickAtPath, getEditorHandle } from '@platejs/playwright';

import { createWikiPage } from './content';
import { withSomersaultBody } from './helpers';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

type EditorHandle = Awaited<ReturnType<typeof getEditorHandle>>;
type EditorNode = {
  type?: string;
  text?: string;
  url?: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  listStyleType?: string;
  children?: EditorNode[];
};

// Since Plate v53, markdown shortcuts are `inputRules` configured on each
// feature kit. They trigger on real keystrokes, so the tests type character
// by character into an empty paragraph.
async function openEmptyParagraph(page: Page, contentId: string) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle: 'Markdown shortcuts',
    transition: 'publish',
    bodyModifier: withSomersaultBody(''),
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);

  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );
  const getSelectedBlockIndex = () =>
    page.evaluate(
      (editor) => editor.selection?.anchor.path[0] ?? null,
      editorHandle,
    );

  // The editor autofocuses the title block on load; wait for it so it does
  // not steal the caret back from the paragraph.
  await expect.poll(getSelectedBlockIndex).toBe(0);
  await clickAtPath(page, editorHandle, [1]);
  await expect.poll(getSelectedBlockIndex).toBe(1);

  return editorHandle;
}

async function getBlock(page: Page, editorHandle: EditorHandle, index = 1) {
  return (await page.evaluate(
    ([editor, i]) => JSON.parse(JSON.stringify(editor.children[i])),
    [editorHandle, index] as const,
  )) as EditorNode;
}

test.describe('Plate markdown shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const level of [2, 3, 4, 5, 6]) {
    test(`typing "${'#'.repeat(level)} " turns the paragraph into an h${level}`, async ({
      page,
    }) => {
      const editorHandle = await openEmptyParagraph(
        page,
        `md-heading-${level}`,
      );
      await page.keyboard.type(`${'#'.repeat(level)} Heading ${level}`);

      await expect
        .poll(async () => (await getBlock(page, editorHandle)).type)
        .toBe(`h${level}`);
      expect((await getBlock(page, editorHandle)).children?.[0]?.text).toBe(
        `Heading ${level}`,
      );
    });
  }

  test('typing "# " does not create an h1 while the title block exists', async ({
    page,
  }) => {
    const editorHandle = await openEmptyParagraph(page, 'md-no-h1');
    await page.keyboard.type('# Not a heading');

    await expect
      .poll(
        async () => (await getBlock(page, editorHandle)).children?.[0]?.text,
      )
      .toBe('# Not a heading');
    expect((await getBlock(page, editorHandle)).type).toBe('p');
  });

  test('typing "# " restores the title block when there is none', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'md-title-restore',
      contentTitle: 'Removed title',
      transition: 'publish',
      bodyModifier: (body) => ({
        ...body,
        blocks: {
          __somersault__: {
            '@type': '__somersault__',
            value: [{ type: 'p', children: [{ text: '' }] }],
          },
        },
      }),
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);
    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );
    await clickAtPath(page, editorHandle, [0]);
    // The title block was removed, but the page keeps its title: restoring the
    // block brings it back, and the caret stays at its end.
    await page.keyboard.type('# ');

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 0)).type)
      .toBe('title');
    await expect
      .poll(async () => (await getBlock(page, editorHandle, 0)).children)
      .toEqual([{ text: 'Removed title' }]);
    await expect
      .poll(() =>
        page.evaluate(
          (editor) => editor.selection?.focus ?? null,
          editorHandle,
        ),
      )
      .toEqual({ path: [0, 0], offset: 'Removed title'.length });
  });

  test('typing "- " and "1. " start bulleted and numbered lists', async ({
    page,
  }) => {
    const editorHandle = await openEmptyParagraph(page, 'md-lists');
    await page.keyboard.type('- bullet');

    await expect
      .poll(async () => (await getBlock(page, editorHandle)).listStyleType)
      .toBe('disc');

    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('1. ordered');

    await expect
      .poll(async () => (await getBlock(page, editorHandle, 2)).listStyleType)
      .toBe('decimal');
  });

  test('typing "> " wraps the paragraph in a blockquote container', async ({
    page,
  }) => {
    const editorHandle = await openEmptyParagraph(page, 'md-blockquote');
    await page.keyboard.type('> quoted');

    await expect
      .poll(async () => (await getBlock(page, editorHandle)).type)
      .toBe('blockquote');
    expect((await getBlock(page, editorHandle)).children).toEqual([
      expect.objectContaining({ type: 'p', children: [{ text: 'quoted' }] }),
    ]);
  });

  test('inline markdown marks are applied while typing', async ({ page }) => {
    const editorHandle = await openEmptyParagraph(page, 'md-marks');
    await page.keyboard.type('**bold** *italic* `code` ');

    await expect
      .poll(async () => (await getBlock(page, editorHandle)).children)
      .toEqual([
        { text: 'bold', bold: true },
        { text: ' ' },
        { text: 'italic', italic: true },
        { text: ' ' },
        { text: 'code', code: true },
        { text: ' ' },
      ]);
  });

  test('typing a URL followed by a space autolinks it', async ({ page }) => {
    const editorHandle = await openEmptyParagraph(page, 'md-autolink');
    await page.keyboard.type('see https://plone.org ');

    await expect
      .poll(async () =>
        (await getBlock(page, editorHandle)).children?.find(
          (child) => child.type === 'a',
        ),
      )
      .toMatchObject({
        type: 'a',
        url: 'https://plone.org',
        children: [{ text: 'https://plone.org' }],
      });
  });
});
