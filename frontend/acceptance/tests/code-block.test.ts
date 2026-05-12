import type { Page } from '@playwright/test';
import { createWikiPage } from './content';
import { expect, test } from './test';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { insertViaSlashMenu, selectParagraphText, withSomersaultBody } from './helpers';

const CODE_TEXT = 'console.log("hello")';

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
    await expect(pre).toHaveText('some code here');

    await savePage(page, contentPath, 'Code Block Toolbar');

    await expect(page.locator('pre').filter({ hasText: 'some code here' }).first()).toBeVisible();
  });

  test('Autoformat code block with triple backticks', async ({ page }) => {
    const { contentPath: _contentPath } = await openCodeBlockEditor(page, {
      contentId: 'code-block-autoformat',
      contentTitle: 'Code Block Autoformat',
      bodyText: '',
    });

    const editor = page.locator('.slate-editor[data-slate-editor]');
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('```');

    await expect(editor.locator('pre')).toBeVisible();
  });

  test('Select language from combobox', async ({ page }) => {
    const { contentPath } = await openCodeBlockEditor(page, {
      contentId: 'code-block-language',
      contentTitle: 'Code Block Language',
      bodyText: '',
    });

    await insertViaSlashMenu(page, 'Code Block');

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const combobox = editor.locator('button[role="combobox"]');
    await expect(combobox).toHaveText('Plain Text');

    await combobox.click();
    await page.getByPlaceholder('Search language...').fill('JavaScript');
    await page.getByRole('option', { name: 'JavaScript' }).first().click();

    await expect(combobox).toHaveText('JavaScript');

    await savePage(page, contentPath, 'Code Block Language');

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    await expect(editor.locator('button[role="combobox"]')).toHaveText('JavaScript');
  });

  test('Copy Python code and paste into a second code block', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const { contentPath: _contentPath } = await openCodeBlockEditor(page, {
      contentId: 'code-block-copy-paste',
      contentTitle: 'Code Block Copy Paste',
      bodyText: '',
    });

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const PYTHON_CODE = 'print("hello world")';

    // Insert first code block and set language to Python
    await insertViaSlashMenu(page, 'Code Block');
    await editor.locator('button[role="combobox"]').click();
    await page.getByPlaceholder('Search language...').fill('Python');
    await page.getByRole('option', { name: 'Python' }).first().click();

    // Type Python code and copy it
    const firstPre = editor.locator('pre').first();
    await firstPre.click();
    await page.keyboard.type(PYTHON_CODE);
    await expect(firstPre).toHaveText(PYTHON_CODE);

    await page.locator('button:has(.lucide-copy)').click();
    await expect(page.locator('button:has(.lucide-check)')).toBeVisible();


    await insertViaSlashMenu(page, 'Code Block');

    // Set second code block language to Python, paste and verify
    const secondPre = editor.locator('pre').nth(1);
    await editor.locator('button[role="combobox"]').nth(1).click();
    await page.getByPlaceholder('Search language...').fill('Python');
    await page.getByRole('option', { name: 'Python' }).first().click();
    await secondPre.click();
    await page.keyboard.press('ControlOrMeta+v');
    await expect(secondPre).toHaveText(PYTHON_CODE);
  });
});
