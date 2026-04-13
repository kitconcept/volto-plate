import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';
import { waitForPlateEditorReady } from './plate';
import { getEditorHandle, getSelection } from '@platejs/playwright';

function withSomersaultBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title : '';

  return {
    ...body,
    blocks: {
      __somersault__: {
        '@type': '__somersault__',
        value: [
          { type: 'title', children: [{ text: title }] },
          { type: 'p', children: [{ text: '' }] },
        ],
      },
    },
  };
}

async function openTitleSyncPage(
  page: Parameters<typeof test>[0]['page'],
  { contentId, contentTitle }: { contentId: string; contentTitle: string },
) {
  await login(page);
  await createContent(page, {
    contentType: 'WikiPage',
    contentId,
    contentTitle,
    transition: 'publish',
    bodyModifier: withSomersaultBody,
  });

  await page.goto(`/${contentId}/edit`);
  await waitForPlateEditorReady(page);
}

async function openMetadataSidebar(
  page: Parameters<typeof test>[0]['page'],
) {
  await page.getByRole('button', { name: 'Wiki Page' }).click();
  await expect(
    page.getByRole('textbox', {
      name: 'Title',
      exact: true,
    }),
  ).toBeVisible();
}

test('Metadata title updates the plate title block', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-metadata',
    contentTitle: 'Original title',
  });

  const metadataTitleInput = page.getByRole('textbox', {
    name: 'Title',
    exact: true,
  });
  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await expect(editorTitle).toHaveText('Original title');
  await openMetadataSidebar(page);
  await expect(metadataTitleInput).toHaveValue('Original title');

  await metadataTitleInput.fill('Metadata updated title');
  await editorTitle.click();
  await expect(editorTitle).toHaveText('Metadata updated title');
});

test('Plate editor autofocuses the title block on load', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-autofocus',
    contentTitle: 'Original title',
  });

  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );
  const selection = await getSelection(page, editorHandle);

  expect(selection).toEqual({
    anchor: { offset: 0, path: [0, 0] },
    focus: { offset: 0, path: [0, 0] },
  });
});

test('Plate title block updates the metadata title', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-editor',
    contentTitle: 'Original title',
  });

  const metadataTitleInput = page.getByRole('textbox', {
    name: 'Title',
    exact: true,
  });
  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await expect(editorTitle).toHaveText('Original title');
  await openMetadataSidebar(page);
  await expect(metadataTitleInput).toHaveValue('Original title');

  await editorTitle.fill('Editor updated title');
  await openMetadataSidebar(page);
  await metadataTitleInput.click();
  await expect(metadataTitleInput).toHaveValue('Editor updated title');
});

test('Empty plate title block shows the translated placeholder', async ({
  page,
}) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-placeholder',
    contentTitle: 'Original title',
  });

  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await editorTitle.fill('');

  await expect(
    editorTitle.locator('.block-inner-container [aria-hidden="true"]').first(),
  ).toHaveText('Type the title...');
});

test('Title placeholder is rendered inside the width-constrained inner container', async ({
  page,
}) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-placeholder-style',
    contentTitle: 'Original title',
  });

  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await editorTitle.fill('');

  const placeholderStyles = await editorTitle.evaluate((element) => {
    const innerContainer = element.querySelector('.block-inner-container');
    const placeholder = innerContainer?.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement | null;
    const contentWrapper =
      innerContainer?.lastElementChild as HTMLElement | null;

    return {
      className: element.className,
      innerContainerClassName: innerContainer?.className,
      innerContainerPosition: innerContainer
        ? window.getComputedStyle(innerContainer).position
        : null,
      placeholderText: placeholder?.textContent,
      placeholderPosition: placeholder
        ? window.getComputedStyle(placeholder).position
        : null,
      placeholderZIndex: placeholder
        ? window.getComputedStyle(placeholder).zIndex
        : null,
      contentWrapperTag: contentWrapper?.tagName,
      contentWrapperPosition: contentWrapper
        ? window.getComputedStyle(contentWrapper).position
        : null,
      contentWrapperZIndex: contentWrapper
        ? window.getComputedStyle(contentWrapper).zIndex
        : null,
    };
  });

  expect(placeholderStyles).toEqual({
    className: expect.stringContaining('documentFirstHeading'),
    innerContainerClassName: expect.stringContaining('block-inner-container'),
    innerContainerPosition: 'relative',
    placeholderText: 'Type the title...',
    placeholderPosition: 'absolute',
    placeholderZIndex: '0',
    contentWrapperTag: 'SPAN',
    contentWrapperPosition: 'relative',
    contentWrapperZIndex: '10',
  });
});
