import { type Page } from '@playwright/test';
import { createWikiPage } from './content';
import { expect, test } from './test';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { insertViaSlashMenu } from './helpers';

async function openTableEditor(
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

async function insertTable(page: Page) {
  await insertViaSlashMenu(page, 'Table');
  const table = page.locator('.slate-editor[data-slate-editor] table');
  await expect(table).toBeVisible();
  return table;
}

test.describe('Table Block', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Insert Table via slash menu and save', async ({ page }) => {
    const { contentPath } = await openTableEditor(page, {
      contentId: 'table-insert-slash',
      contentTitle: 'Table Insert Slash',
    });

    const table = await insertTable(page);

    await expect(table.locator('tr')).toHaveCount(2);

    await savePage(page, contentPath, 'Table Insert Slash');

    await expect(page.locator('table').first()).toBeVisible();
  });

  test('Insert row after via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-insert-row-after',
      contentTitle: 'Table Insert Row After',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-arrow-down)').click();

    await expect(table.locator('tr')).toHaveCount(3);
  });

  test('Insert row before via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-insert-row-before',
      contentTitle: 'Table Insert Row Before',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-arrow-up)').click();

    await expect(table.locator('tr')).toHaveCount(3);
  });

  test('Delete row via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-delete-row',
      contentTitle: 'Table Delete Row',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    // First .lucide-x = Delete row; second = Delete column
    await floatingToolbar.locator('button:has(.lucide-x)').nth(0).click();

    await expect(table.locator('tr')).toHaveCount(1);
  });

  test('Insert column after via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-insert-col-after',
      contentTitle: 'Table Insert Col After',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-arrow-right)').click();

    const dataCells = table.locator('tr').first().locator('td:has([contenteditable])');
    await expect(dataCells).toHaveCount(3);
  });

  test('Insert column before via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-insert-col-before',
      contentTitle: 'Table Insert Col Before',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-arrow-left)').click();

    const dataCells = table.locator('tr').first().locator('td:has([contenteditable])');
    await expect(dataCells).toHaveCount(3);
  });

  test('Delete column via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-delete-col',
      contentTitle: 'Table Delete Col',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    // Second .lucide-x = Delete column
    await floatingToolbar.locator('button:has(.lucide-x)').nth(1).click();

    const dataCells = table.locator('tr').first().locator('td:has([contenteditable])');
    await expect(dataCells).toHaveCount(1);
  });

  test('Set cell background color via floating toolbar', async ({ page }) => {
    const { contentPath } = await openTableEditor(page, {
      contentId: 'table-bg-color',
      contentTitle: 'Table BG Color',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-paint-bucket)').click();

    const colorMenu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(colorMenu).toBeVisible();
    await page.locator('[data-slot="dropdown-menu-item"][style="background-color: rgb(0, 0, 0);"]').click();



    await savePage(page, contentPath, 'Table BG Color');

    await expect(table.locator('tr').first().locator('td').first()).toHaveAttribute('style', /--cellBackground.*#000000/i);
  });

  test('Clear cell background color via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-clear-bg-color',
      contentTitle: 'Table Clear BG Color',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    // Set a color first
    await floatingToolbar.locator('button:has(.lucide-paint-bucket)').click();

    const colorMenu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(colorMenu).toBeVisible();
    await page.locator('[data-slot="dropdown-menu-item"][style="background-color: rgb(0, 0, 0);"]').click();

    await expect(firstCell).toHaveAttribute('style', /--cellBackground.*#000000/i);

    // Re-open color menu and clear
    await firstCell.click();
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });
    await floatingToolbar.locator('button:has(.lucide-paint-bucket)').click();
    await expect(colorMenu).toBeVisible();
    await page.getByRole('menuitem', { name: 'Clear' }).click();

    await expect(firstCell).not.toHaveAttribute('style', /--cellBackground.*#000000/i);
  });

  test('Toggle No Border via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-border-none',
      contentTitle: 'Table Border None',
    });

    const table = await insertTable(page);

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-grid-2x2)').click();

    const bordersMenu = page.locator('[role="menu"]');
    await expect(bordersMenu).toBeVisible();
    await page.getByRole('menuitemcheckbox', { name: 'No Border' }).click();

    await expect(firstCell).not.toHaveClass(/before:border-b|before:border-r|before:border-l|before:border-t/);
  });

  test('Merge cells via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-merge-cells',
      contentTitle: 'Table Merge Cells',
    });

    const table = await insertTable(page);

    const firstRow = table.locator('tr').first();
    const cells = firstRow.locator('td:has([contenteditable])');

    await cells.nth(0).click();
    await cells.nth(1).click({ modifiers: ['Shift'] });

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    const mergeBtn = floatingToolbar.locator('button:has(.lucide-combine)');
    await expect(mergeBtn).toBeVisible();
    await mergeBtn.click();

    const mergedCell = firstRow.locator('td:has([contenteditable])').first();
    await expect(mergedCell).toHaveAttribute('colspan', '2');
  });

  test('Split merged cell via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-split-cell',
      contentTitle: 'Table Split Cell',
    });

    const table = await insertTable(page);

    const firstRow = table.locator('tr').first();
    const cells = firstRow.locator('td:has([contenteditable])');

    // Merge first
    await cells.nth(0).click();
    await cells.nth(1).click({ modifiers: ['Shift'] });

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });
    await floatingToolbar.locator('button:has(.lucide-combine)').click();

    const mergedCell = firstRow.locator('td:has([contenteditable])').first();
    await expect(mergedCell).toHaveAttribute('colspan', '2');

    // Now split
    await mergedCell.click();
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    const splitBtn = floatingToolbar.locator('button:has(.lucide-square-split-horizontal)');
    await expect(splitBtn).toBeVisible();
    await splitBtn.click();

    await expect(firstRow.locator('td:has([contenteditable])')).toHaveCount(2);
  });

  test('Delete table via floating toolbar', async ({ page }) => {
    await openTableEditor(page, {
      contentId: 'table-delete',
      contentTitle: 'Table Delete',
    });

    const table = await insertTable(page);
    const editor = page.locator('.slate-editor[data-slate-editor]');

    const firstCell = table.locator('tr').first().locator('td:has([contenteditable])').first();
    await firstCell.click();

    const floatingToolbar = page.locator('[data-slot="popover-content"]');
    await expect(floatingToolbar).toBeVisible({ timeout: 5_000 });

    await floatingToolbar.locator('button:has(.lucide-trash-2)').click();

    await expect(editor.locator('table')).toHaveCount(0);
  });



});
