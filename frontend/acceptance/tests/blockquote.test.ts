import type { Page } from '@playwright/test';
import { createWikiPage } from './content';
import { expect, test } from './test';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { selectParagraphText, withSomersaultBody, insertViaSlashMenu } from './helpers';


const BODY_TEXT = 'Quote this text';

function toolbarButton(page: Page, lucideClass: string) {
  return page.locator(`button:has(.${lucideClass})`);
}


async function openBlockquoteEditor(page: Page, { contentId, contentTitle, bodyText }: { contentId: string, contentTitle: string, bodyText: string }) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    transition: 'publish',
    bodyModifier: withSomersaultBody(bodyText),
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);

  return { contentPath };
}

async function savePage(page: Page, contentPath: string, contentTitle: string) {
  await page.locator('#toolbar-save').click();
  await page.waitForURL(contentPath, {
    waitUntil: 'load',
    timeout: 30_000,
  });
  await expect(page.getByRole('heading', { name: contentTitle })).toBeVisible();
}


test.describe('Blockquote ', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Add Quote block via toolbar', async ({ page }) => {

    const { contentPath: blockquotePath } = await openBlockquoteEditor(page, { contentId: 'blockquote-toolbar', contentTitle: 'Blockquote Toolbar', bodyText: BODY_TEXT });

    await selectParagraphText(page, { start: 0, end: 5 });

    //const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    const turnIntoBtn = toolbarButton(page, 'lucide-chevron-down').nth(0);
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();

    await page.getByRole('menuitemradio', { name: /^quote$/i }).first().click();

    const editorText = page
      .locator('.slate-editor[data-slate-editor]')
      .locator('blockquote')
      .first();
    await expect(editorText).toBeVisible();
    await expect(editorText).toHaveText('Quote this text');


    await savePage(page, blockquotePath, 'Blockquote Toolbar');

    const viewBlockQuote = page
      .locator('blockquote')
      .filter({ hasText: 'Quote this text' })
      .first();
    await expect(viewBlockQuote).toBeVisible();

  });

  test('Add blockquote via slash command', async ({ page }) => {

    const { contentPath: blockquotePath } = await openBlockquoteEditor(page, { contentId: 'blockquote-slash-command', contentTitle: 'Blockquote Slash Command', bodyText: '' });

    await insertViaSlashMenu(page, 'Quote');

    const blockquote = page.locator('.slate-editor[data-slate-editor]').locator('blockquote.slate-blockquote');
    await expect(blockquote).toBeVisible();
    await blockquote.click();
    
    await page.keyboard.type('Quote this text from the slash menu');
    await expect(blockquote).toHaveText('Quote this text from the slash menu');

    await savePage(page, blockquotePath, 'Blockquote Slash Command');

    const viewBlockQuote = page
      .locator('blockquote')
      .filter({ hasText: 'Quote this text from the slash menu' })
      .first();
    await expect(viewBlockQuote).toBeVisible();
  });
});
