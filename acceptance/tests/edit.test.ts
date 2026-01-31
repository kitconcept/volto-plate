import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';
import { waitForPlateEditorReady } from './plate';
import type { Page } from '@playwright/test';
import type { Path } from 'platejs';
import {
  clickAtPath,
  type EditorHandle,
  getEditorHandle,
  setSelection,
} from '@platejs/playwright';

async function typeAtPath(
  page: Page,
  editorHandle: EditorHandle,
  path: Path,
  text: string,
) {
  await clickAtPath(page, editorHandle, path);
  if (text) {
    await page.keyboard.type(text);
  }
}

test.describe('Basic Plate in Volto Test', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createContent(page, {
      contentType: 'Document',
      contentId: 'page',
      contentTitle: 'A page',
    });
  });

  test('should visit the edit URL and interact with the editor, toolbar is shown', async ({
    page,
  }) => {
    await page.goto('/page/edit', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/page\/edit$/);

    await waitForPlateEditorReady(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );
    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );

    await typeAtPath(page, editorHandle, [0], 'This is the body text');
    await page.keyboard.press('Enter');

    await setSelection(page, editorHandle, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    });

    await expect(page.getByLabel('Editor toolbar')).toBeVisible();
  });

  test('should be able to split the current Plate block in two', async ({
    page,
  }) => {
    await page.goto('/page/edit');
    await expect(page).toHaveURL(/\/page\/edit$/);

    await waitForPlateEditorReady(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );
    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );

    await typeAtPath(page, editorHandle, [0], 'This is the first line');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('This is the second line');

    await typeAtPath(page, editorHandle, [1], '/split');
    await page.keyboard.press('Enter');

    const elements = page.locator(
      '.slate-editor[contenteditable="true"] [data-slate-node="element"]',
    );
    await expect(elements).toHaveCount(2);
    await expect(elements.nth(1)).toHaveText('This is the second line');
  });

  test('should be able to create a Volto block via slash command', async ({
    page,
  }) => {
    await page.goto('/page/edit');
    await expect(page).toHaveURL(/\/page\/edit$/);

    await waitForPlateEditorReady(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );
    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );

    await typeAtPath(page, editorHandle, [0], '/teaser');
    await page.keyboard.press('Enter');

    const elements = page.locator(
      '.slate-editor[contenteditable="true"] [data-slate-node="element"]',
    );
    await expect(elements).toHaveCount(1);
    await expect(page.locator('#sidebar-properties header h2')).toHaveText(
      'Teaser',
    );
  });
});
