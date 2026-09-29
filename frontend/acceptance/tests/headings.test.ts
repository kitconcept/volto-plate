import type { Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

import { createWikiPage } from './content';
import { selectParagraphText, withSomersaultBody } from './helpers';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

// Heading 2 to Heading 6 come from @plone/plate's menus; H1 is reserved for
// the title block.
async function openEditor(page: Page, contentId: string, bodyText: string) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle: 'Headings',
    transition: 'publish',
    bodyModifier: withSomersaultBody(bodyText),
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);

  return getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );
}

test.describe('Plate headings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const level of [5, 6]) {
    test(`the slash menu inserts a Heading ${level}`, async ({ page }) => {
      const editorHandle = await openEditor(page, `slash-h${level}`, '');
      await setSelection(page, editorHandle, {
        anchor: { path: [1, 0], offset: 0 },
        focus: { path: [1, 0], offset: 0 },
      });

      await page.keyboard.type(`/heading ${level}`);
      await expect(
        page.getByRole('option', { name: `Heading ${level}`, exact: true }),
      ).toBeVisible();
      await page.keyboard.press('Enter');

      await expect
        .poll(() =>
          page.evaluate(
            ([editor, type]) =>
              editor.children.some(
                (node: { type?: string }) => node.type === type,
              ),
            [editorHandle, `h${level}`] as const,
          ),
        )
        .toBe(true);
    });
  }

  test('the "Turn into" menu offers Heading 5 and 6, but not Heading 1', async ({
    page,
  }) => {
    await openEditor(page, 'turn-into-headings', 'Turn this into a heading');
    await selectParagraphText(page, { start: 0, end: 4 });

    // A dropdown trigger inside the toolbar, exposed with the `radio` role.
    const turnInto = page.locator('button[aria-label="Turn into"]');
    await expect(turnInto).toBeVisible();
    await turnInto.click();

    for (const label of ['Heading 2', 'Heading 5', 'Heading 6']) {
      await expect(
        page.getByRole('menuitemradio', { name: label, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole('menuitemradio', { name: 'Heading 1', exact: true }),
    ).toHaveCount(0);
  });

  test('typing "###### " turns the paragraph into a Heading 6', async ({
    page,
  }) => {
    const editorHandle = await openEditor(page, 'markdown-h6', '');
    await setSelection(page, editorHandle, {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    });
    await page.keyboard.type('###### Heading 6');

    await expect
      .poll(() =>
        page.evaluate(
          (editor) => (editor.children[1] as { type?: string }).type,
          editorHandle,
        ),
      )
      .toBe('h6');
  });
});
