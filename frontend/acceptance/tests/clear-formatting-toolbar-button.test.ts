import type { Page } from '@playwright/test';
import { createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { selectParagraphText, withSomersaultBody } from './helpers';
import { expect, test } from './test';

const BODY_TEXT = 'Hello toolbar text';

function toolbarButton(page: Page, lucideClass: string) {
  return page.locator(`button:has(.${lucideClass})`);
}

async function openToolbarTestPage(
  page: Page,
  {
    contentId,
    contentTitle,
    bodyText = BODY_TEXT,
  }: {
    contentId: string;
    contentTitle: string;
    bodyText?: string;
  },
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

test.describe('Plate toolbar — clear formatting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('clicking Clear formatting removes bold, italic and strikethrough marks', async ({
    page,
  }) => {
    await openToolbarTestPage(page, {
      contentId: 'toolbar-clear-formatting-test',
      contentTitle: 'Toolbar clear formatting test',
    });

    await selectParagraphText(page, { start: 0, end: 5 });

    const editable = page.locator('.slate-editor[data-slate-editor]');

    // Apply bold, italic and strikethrough through the floating toolbar buttons.
    await toolbarButton(page, 'lucide-bold').click();
    await toolbarButton(page, 'lucide-italic').click();
    await toolbarButton(page, 'lucide-strikethrough').click();

    await expect(editable.locator('strong')).toContainText('Hello');
    await expect(editable.locator('em')).toContainText('Hello');
    await expect(editable.locator('s')).toContainText('Hello');

    const clearFormattingBtn = toolbarButton(page, 'lucide-remove-formatting');
    await expect(clearFormattingBtn).toBeVisible();
    await clearFormattingBtn.click();

    await expect(editable.locator('strong')).toHaveCount(0);
    await expect(editable.locator('em')).toHaveCount(0);
    await expect(editable.locator('s')).toHaveCount(0);
    await expect(editable).toContainText(BODY_TEXT);
  });
});
