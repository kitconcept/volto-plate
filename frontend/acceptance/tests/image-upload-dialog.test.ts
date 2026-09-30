import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { editable, getValue } from '../fixtures/editor';
import { login } from './login';
import { expect, test } from './test';

// Uploading an image through the image block's file dialog.

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=',
  'base64',
);

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('Uploading an image from the file dialog fills the image block', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, [], {
    extra: [
      {
        type: 'ploneBlock',
        '@type': 'plateimage',
        children: [{ text: '' }],
      },
    ],
  });
  const editorHandle = await openInEditor(page, path);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await editable(page)
    .getByRole('button', { name: 'Upload an image from your computer' })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'dialog-image.png',
    mimeType: 'image/png',
    buffer: PNG,
  });

  await expect
    .poll(async () => {
      const node = (await getValue(page, editorHandle)).find(
        (candidate) => candidate['@type'] === 'plateimage',
      );
      return {
        url: node?.url,
        image_field: node?.image_field,
        hasScales: Boolean(node?.image_scales),
      };
    })
    .toEqual({
      url: `${path}/dialog-image.png`,
      image_field: 'image',
      hasScales: true,
    });

  const image = editable(page).locator('img').first();
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});
