import type { Page } from '@playwright/test';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';
import { createWikiPage } from './content';
import { login } from './login';
import { makeSomersaultBody, selectParagraphText } from './helpers';

const withBlockquoteBody = makeSomersaultBody([
  { type: 'p', children: [{ text: 'Quote this text' }] },
  { type: 'p', children: [{ text: 'Another paragraph' }] },
]);

async function openBlockquoteEditor(page: Page, contentId: string, contentTitle: string) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId: `wiki-${contentId}`,
    transition: 'publish',
    bodyModifier: withBlockquoteBody,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}

test.describe('Blockquote — wiki editor', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Turn Into: Quote converts paragraph to blockquote', async ({ page }) => {
    await openBlockquoteEditor(page, 'blockquote-turn-into', 'Blockquote Turn Into');

    await selectParagraphText(page, { start: 0, end: 5 });
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /^quote$/i }).first().click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('blockquote');
  });

  test('bold + italic + strikethrough inside blockquote', async ({ page }) => {
    await openBlockquoteEditor(page, 'blockquote-combo-marks', 'Blockquote Combo Marks');

    await selectParagraphText(page, { start: 0, end: 5 });
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /^quote$/i }).first().click();

    await selectParagraphText(page, { start: 0, end: 5 });
    await page.locator('button:has(svg.lucide-bold)').click();

    await selectParagraphText(page, { start: 0, end: 5 });
    await page.locator('button:has(svg.lucide-italic)').click();

    await selectParagraphText(page, { start: 0, end: 5 });
    await page.locator('button:has(svg.lucide-strikethrough)').click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));

    const block = await getNodeByPath(page, editorHandle, [1]);
    expect((await block.jsonValue()).type).toBe('blockquote');

    const leaf = await getNodeByPath(page, editorHandle, [1, 0]);
    const leafVal = await leaf.jsonValue();
    expect(leafVal.bold).toBe(true);
    expect(leafVal.italic).toBe(true);
    expect(leafVal.strikethrough).toBe(true);
    expect(leafVal.text).toBe('Quote');
  });
});
