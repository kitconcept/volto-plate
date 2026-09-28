import type { Page } from '@playwright/test';
import { createWikiPage } from './content';
import { expect, test } from './test';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { insertViaSlashMenu, selectParagraphText, withSomersaultBody } from './helpers';

const CODE_TEXT = 'console.log("hello")';
const TOOLBAR_CODE_TEXT = 'some code here';
const AUTOFORMAT_CODE_TEXT = 'const x = 42;';

async function openCodeBlockEditor(
  page: Page,
  { contentId, contentTitle, bodyText }: { contentId: string; contentTitle: string; bodyText: string },
) {
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
  await page.waitForURL(contentPath, { waitUntil: 'load', timeout: 30_000 });
  await expect(page.getByRole('heading', { name: contentTitle })).toBeVisible();
}

test.describe('Code Block', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Add Code Block via slash menu', async ({ page }) => {
    const { contentPath } = await openCodeBlockEditor(page, {
      contentId: 'code-block-slash',
      contentTitle: 'Code Block Slash',
      bodyText: '',
    });

    await insertViaSlashMenu(page, 'Code Block');

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const pre = editor.locator('pre');
    await expect(pre).toBeVisible();

    await pre.click();
    await page.keyboard.type(CODE_TEXT);
    await expect(pre).toHaveText(CODE_TEXT);

    await savePage(page, contentPath, 'Code Block Slash');

    await expect(page.locator('pre').filter({ hasText: CODE_TEXT }).first()).toBeVisible();
  });

  test('Add Code Block via toolbar menu', async ({ page }) => {
    const { contentPath } = await openCodeBlockEditor(page, {
      contentId: 'code-block-toolbar',
      contentTitle: 'Code Block Toolbar',
      bodyText: 'some code here',
    });

    await selectParagraphText(page, { start: 0, end: 4 });

    const turnIntoBtn = page.locator('button:has(.lucide-chevron-down)').nth(0);
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();

    await page.getByRole('menuitemradio', { name: /^code$/i }).first().click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const pre = editor.locator('pre');
    await expect(pre).toBeVisible();
    await expect(pre).toHaveText(TOOLBAR_CODE_TEXT);

    await savePage(page, contentPath, 'Code Block Toolbar');

    await expect(page.locator('pre').filter({ hasText: TOOLBAR_CODE_TEXT }).first()).toBeVisible();
  });

  test('Autoformat code block with triple backticks', async ({ page }) => {
    const contentTitle = 'Code Block Autoformat';
    const { contentPath } = await openCodeBlockEditor(page, {
      contentId: 'code-block-autoformat',
      contentTitle,
      bodyText: '',
    });

    const editor = page.locator('.slate-editor[data-slate-editor]');
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    // Trigger autoformat: typing ``` should convert paragraph to code block
    await page.keyboard.type('```');

    const pre = editor.locator('pre');
    await expect(pre).toBeVisible();

    // Cursor should now be inside the code block — type code
    await page.keyboard.type(AUTOFORMAT_CODE_TEXT);
    await expect(pre).toHaveText(AUTOFORMAT_CODE_TEXT);

    // Save and verify on view page
    await savePage(page, contentPath, contentTitle);

    await expect(
      page.locator('pre').filter({ hasText: AUTOFORMAT_CODE_TEXT }).first(),
    ).toBeVisible();
  });
});
