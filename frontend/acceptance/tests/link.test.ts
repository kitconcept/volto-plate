import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';
import { waitForPlateEditorReady } from './plate';
import type { Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

function withSomersaultBody(bodyText: string) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';

    return {
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            { type: 'p', children: [{ text: bodyText }] },
          ],
        },
      },
    };
  };
}

async function openWikiPageEditor(
  page: Page,
  {
    contentId,
    contentTitle,
    bodyText = 'Link this text',
  }: {
    contentId: string;
    contentTitle: string;
    bodyText?: string;
  },
) {
  await createContent(page, {
    contentType: 'WikiPage',
    contentId,
    contentTitle,
    transition: 'publish',
    bodyModifier: withSomersaultBody(bodyText),
  });

  await page.goto(`/${contentId}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}

async function selectParagraphText(
  page: Page,
  textRange: { start: number; end: number },
) {
  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: textRange.start },
    focus: { path: [1, 0], offset: textRange.end },
  });
}

async function openLinkToolbar(page: Page) {
  await page.keyboard.press('Control+k');
  await expect(
    page.getByPlaceholder('Paste link or search content'),
  ).toBeVisible();
}

async function expectEditorLink(
  page: Page,
  { href, text }: { href: string; text: string },
) {
  const link = page
    .locator('.slate-editor[data-slate-editor]')
    .getByRole('link', { name: text })
    .first();

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', href);
}

test.describe('Plate link features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('adds an external link from the floating link input', async ({
    page,
  }) => {
    await openWikiPageEditor(page, {
      contentId: 'link-source-external',
      contentTitle: 'Link source external',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.fill('https://example.com/path');
    await input.press('Enter');

    await expectEditorLink(page, {
      href: 'https://example.com/path',
      text: 'Link this',
    });
  });

  test('searches content from plain text and inserts the selected result', async ({
    page,
  }) => {
    await createContent(page, {
      contentType: 'WikiPage',
      contentId: 'link-target-search',
      contentTitle: 'LinkTargetSearch',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-search',
      contentTitle: 'Link source search',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    const input = page.getByPlaceholder('Paste link or search content');
    await input.fill('LinkTargetSearch');

    await page.getByRole('button', { name: 'LinkTargetSearch' }).click();

    await expectEditorLink(page, {
      href: '/link-target-search',
      text: 'Link this',
    });
  });

  test('sets the link when selecting a target from the object browser', async ({
    page,
  }) => {
    await createContent(page, {
      contentType: 'WikiPage',
      contentId: 'link-target-browser',
      contentTitle: 'LinkTargetBrowser',
      transition: 'publish',
      bodyModifier: withSomersaultBody('Target body'),
    });

    await openWikiPageEditor(page, {
      contentId: 'link-source-browser',
      contentTitle: 'Link source browser',
    });

    await selectParagraphText(page, { start: 0, end: 9 });
    await openLinkToolbar(page);

    await page.getByRole('button', { name: 'Browse content' }).click();
    const objectBrowser = page.locator('.object-browser');
    await expect(objectBrowser).toBeVisible();
    await expect(
      objectBrowser.getByRole('heading', { name: 'Choose Target' }),
    ).toBeVisible();

    await objectBrowser.getByRole('button', { name: 'Search SVG' }).click();
    const objectBrowserSearch =
      objectBrowser.getByPlaceholder('Search content');
    await objectBrowserSearch.fill('LinkTargetBrowser');

    await objectBrowser.getByText('LinkTargetBrowser').click();

    await expectEditorLink(page, {
      href: '/link-target-browser',
      text: 'Link this',
    });
  });
});
