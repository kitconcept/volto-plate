import type { Page } from '@playwright/test';
import { createWikiPage } from './content';
import { expect, test } from './test';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { insertViaSlashMenu } from './helpers';

async function openColumnsEditor(
  page: Page,
  { contentId, contentTitle }: { contentId: string; contentTitle: string },
) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    transition: 'publish',
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

test.describe('Columns Block', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Insert 3 columns block via slash menu', async ({ page }) => {
    const { contentPath } = await openColumnsEditor(page, {
      contentId: 'columns-insert',
      contentTitle: 'Columns Insert',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const columns = editor.locator('.slate-column');
    await expect(columns).toHaveCount(3);

    await savePage(page, contentPath, 'Columns Insert');


    const columnGroup = page.locator('.slate-column_group');
    await expect(columnGroup).toBeVisible();
    const viewColumns = columnGroup.locator('.slate-column');
    await expect(viewColumns).toHaveCount(3);
  });

  test('Change to 2 equal columns (50%-50%) via toolbar', async ({ page }) => {
    const { contentPath } = await openColumnsEditor(page, {
      contentId: 'columns-layout-2-equal',
      contentTitle: 'Columns Layout 2 Equal',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // btn[0] = 50% / 50%
    await page.locator('[data-radix-popper-content-wrapper] button').nth(0).click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const columns = editor.locator('.slate-column');
    await expect(columns).toHaveCount(2);
    // width is on the outer wrapper div (parent of .slate-column)
    await expect(columns.nth(0).locator('..')).toHaveAttribute('style', /width.*50%/);
    await expect(columns.nth(1).locator('..')).toHaveAttribute('style', /width.*50%/);


    await savePage(page, contentPath, 'Columns Layout 2 Equal');


    const columnGroup = page.locator('.slate-column_group');
    await expect(columnGroup).toBeVisible();
    const viewColumns = columnGroup.locator('.slate-column');
    await expect(viewColumns).toHaveCount(2);
  });

  test('Change to 3 equal columns (33%-33%-33%) via toolbar', async ({
    page,
  }) => {
    const { contentPath } = await openColumnsEditor(page, {
      contentId: 'columns-layout-3-equal',
      contentTitle: 'Columns Layout 3 Equal',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // Switch to 2 cols first, then back to 3
    await page.locator('[data-radix-popper-content-wrapper] button').nth(0).click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    await expect(editor.locator('.slate-column')).toHaveCount(2);

    // Re-focus to reopen toolbar
    await editor.locator('.slate-column').first().click();
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // btn[1] = 33% / 33% / 33%
    await page.locator('[data-radix-popper-content-wrapper] button').nth(1).click();

    const columns = editor.locator('.slate-column');
    await expect(columns).toHaveCount(3);
    await expect(columns.nth(0).locator('..')).toHaveAttribute('style', /width.*33%/);

    await savePage(page, contentPath, 'Columns Layout 3 Equal');


    const columnGroup = page.locator('.slate-column_group');
    await expect(columnGroup).toBeVisible();
    const viewColumns = columnGroup.locator('.slate-column');
    await expect(viewColumns).toHaveCount(3);
  });

  test('Change to asymmetric layout (70%-30%) via toolbar', async ({
    page,
  }) => {
    await openColumnsEditor(page, {
      contentId: 'columns-layout-70-30',
      contentTitle: 'Columns Layout 70 30',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // btn[2] = 70% / 30%
    await page.locator('[data-radix-popper-content-wrapper] button').nth(2).click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const columns = editor.locator('.slate-column');
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0).locator('..')).toHaveAttribute('style', /width.*70%/);
    await expect(columns.nth(1).locator('..')).toHaveAttribute('style', /width.*30%/);

  });

  test('Change to asymmetric layout (30%-70%) via toolbar', async ({
    page,
  }) => {
    await openColumnsEditor(page, {
      contentId: 'columns-layout-30-70',
      contentTitle: 'Columns Layout 30 70',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // btn[3] = 30% / 70%
    await page.locator('[data-radix-popper-content-wrapper] button').nth(3).click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const columns = editor.locator('.slate-column');
    await expect(columns).toHaveCount(2);
    await expect(columns.nth(0).locator('..')).toHaveAttribute('style', /width.*30%/);
    await expect(columns.nth(1).locator('..')).toHaveAttribute('style', /width.*70%/);
  });

  test('Change to sidebar layout (25%-50%-25%) via toolbar', async ({
    page,
  }) => {
    await openColumnsEditor(page, {
      contentId: 'columns-layout-25-50-25',
      contentTitle: 'Columns Layout 25 50 25',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // btn[4] = 25% / 50% / 25%
    await page.locator('[data-radix-popper-content-wrapper] button').nth(4).click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const columns = editor.locator('.slate-column');
    await expect(columns).toHaveCount(3);
    await expect(columns.nth(0).locator('..')).toHaveAttribute('style', /width.*25%/);
    await expect(columns.nth(1).locator('..')).toHaveAttribute('style', /width.*50%/);
    await expect(columns.nth(2).locator('..')).toHaveAttribute('style', /width.*25%/);
  });

  test('Delete column group via toolbar', async ({ page }) => {
    await openColumnsEditor(page, {
      contentId: 'columns-delete',
      contentTitle: 'Columns Delete',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');
    await expect(
      page.locator('[data-radix-popper-content-wrapper]'),
    ).toBeVisible();

    // btn[5] = Trash (delete)
    await page.locator('[data-radix-popper-content-wrapper] button').nth(5).click();

    const editor = page.locator('.slate-editor[data-slate-editor]');
    await expect(editor.locator('.slate-column_group')).toHaveCount(0);
  });


  test('Delete individual columns via backspace leaving 1 column', async ({ page }) => {
    await openColumnsEditor(page, {
      contentId: 'columns-delete-backspace',
      contentTitle: 'Columns Delete Backspace',
    });

    await insertViaSlashMenu(page, '3 columns', '3 columns');

    const columns = page.locator('.slate-editor[data-slate-editor] .slate-column');


    await columns.nth(2).click();
    await page.keyboard.press('Backspace');
    const columnGroup = page.locator('.slate-column_group');
    await expect(columnGroup).toBeVisible();
    const viewColumns = columnGroup.locator('.slate-column');
    await expect(viewColumns).toHaveCount(2);

  });
});
