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
