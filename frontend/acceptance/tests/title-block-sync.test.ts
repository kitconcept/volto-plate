import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';
import { waitForPlateEditorReady } from './plate';

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

test('Metadata title updates the plate title block', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-metadata',
    contentTitle: 'Original title',
  });

  const metadataTitleInput = page.getByRole('textbox', { name: 'Title' });
  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await expect(editorTitle).toHaveText('Original title');
  await expect(metadataTitleInput).toHaveValue('Original title');

  await metadataTitleInput.fill('Metadata updated title');
  await editorTitle.click();
  await expect(editorTitle).toHaveText('Metadata updated title');
});

test('Plate title block updates the metadata title', async ({ page }) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-editor',
    contentTitle: 'Original title',
  });

  const metadataTitleInput = page.getByRole('textbox', { name: 'Title' });
  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await expect(editorTitle).toHaveText('Original title');
  await expect(metadataTitleInput).toHaveValue('Original title');

  await editorTitle.fill('Editor updated title');
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

  await expect(editorTitle).toHaveAttribute('placeholder', 'Type the title…');
});

test('Title placeholder is visually rendered through the h1 pseudo-element', async ({
  page,
}) => {
  await openTitleSyncPage(page, {
    contentId: 'title-sync-page-placeholder-style',
    contentTitle: 'Original title',
  });

  const editorTitle = page.locator('[data-slate-editor] h1').first();

  await editorTitle.fill('');

  await expect
    .poll(async () => {
      return await editorTitle.evaluate((element) => {
        const before = window.getComputedStyle(element, '::before');

        return {
          className: element.className,
          placeholder: element.getAttribute('placeholder'),
          beforeContent: before.content,
          beforeDisplay: before.display,
          beforePosition: before.position,
        };
      });
    })
    .toEqual({
      className: expect.stringContaining('slate-title'),
      placeholder: 'Type the title…',
      beforeContent: '"Type the title…"',
      beforeDisplay: 'block',
      beforePosition: 'absolute',
    });
});
