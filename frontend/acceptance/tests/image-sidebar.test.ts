import { expect, test } from './test';
import { login } from './login';
import { createWikiPage } from './content';
import { waitForPlateEditorReady } from './plate';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';
import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { insertWithSlashMenu } from '../fixtures/editor';

const PAGE_ID = 'image-sidebar-page';
const DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

test.setTimeout(30_000);

async function getInheritedBlockWidth(locator: {
  evaluate: (pageFunction: (element: Element) => string) => Promise<string>;
}) {
  return locator.evaluate((element) => {
    let current: HTMLElement | null = element as HTMLElement;

    while (current) {
      const value = getComputedStyle(current).getPropertyValue('--block-width');
      if (value.trim()) return value.trim();
      current = current.parentElement;
    }

    return '';
  });
}

async function getRootVariable(
  page: Parameters<typeof test>[0]['page'],
  name: string,
) {
  return page.evaluate((variableName: string) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  }, name);
}

function withSomersaultImageBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title : '';

  return {
    ...body,
    blocks: {
      __somersault__: {
        '@type': '__somersault__',
        value: [
          { type: 'title', children: [{ text: title }] },
          { type: 'p', children: [{ text: 'Text before image' }] },
          {
            type: 'ploneBlock',
            url: DATA_URI,
            alt: 'Inline test image',
            '@type': 'plateimage',
            children: [{ text: '' }],
          },
          { type: 'p', children: [{ text: 'Text after image' }] },
        ],
      },
    },
  };
}

async function openImageSidebarPage(
  page: Parameters<typeof test>[0]['page'],
  {
    contentId = PAGE_ID,
    contentTitle = 'Image sidebar page',
    wikiId = `wiki-${contentId}`,
  }: {
    contentId?: string;
    contentTitle?: string;
    wikiId?: string;
  } = {},
) {
  await login(page);
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId,
    transition: 'publish',
    bodyModifier: withSomersaultImageBody,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}

async function openSelectedImageBlockSidebar(
  page: Parameters<typeof test>[0]['page'],
) {
  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  const imageNodeHandle = await getNodeByPath(page, editorHandle, [2]);
  const imageNode = (await imageNodeHandle.jsonValue()) as Record<
    string,
    unknown
  >;

  expect(imageNode.type).toBe('ploneBlock');
  expect(imageNode['@type']).toBe('plateimage');

  const editorImage = page.locator(
    '.slate-editor img[alt="Inline test image"]',
  );
  const imageBlock = editorImage.locator(
    'xpath=ancestor::*[@data-slate-node="element"][1]',
  );
  const blockTab = page.locator('#sidebar .formtabs').getByRole('button', {
    name: 'Block',
    exact: true,
  });

  const altTextField = page
    .locator('#sidebar-properties')
    .getByRole('textbox', {
      name: 'Alt text',
    });
  const blockWidthField = page.locator(
    '#sidebar-properties .field-wrapper-blockWidth',
  );

  await expect(editorImage).toBeVisible();
  await expect(imageBlock).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await editorImage.click({ force: true });
    await blockTab.click({ force: true });

    try {
      await expect(altTextField).toBeVisible({ timeout: 3000 });
      await expect(blockWidthField).toBeVisible({ timeout: 3000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  return {
    editorHandle,
    editorImage,
    imageBlock,
  };
}

test('Selecting a Volto-adapted Plate image shows the sidebar form', async ({
  page,
}) => {
  await openImageSidebarPage(page);
  await expect(
    page.locator('#sidebar-properties').getByLabel('Alt text'),
  ).toHaveCount(0);
  await openSelectedImageBlockSidebar(page);
  await expect(
    page.locator('#sidebar-properties').getByLabel('Alt text'),
  ).toHaveValue('Inline test image');
});

test('Changing Block width in the sidebar updates the rendered image width', async ({
  page,
}) => {
  await openImageSidebarPage(page, {
    contentId: 'image-sidebar-block-width-page',
    contentTitle: 'Image sidebar block width page',
  });

  const editorHandle = await getEditorHandle(
    page,
    page.locator('.slate-editor[data-slate-editor]'),
  );

  const editorImage = page.locator(
    '.slate-editor img[alt="Inline test image"]',
  );
  const imageBlock = editorImage.locator(
    'xpath=ancestor::*[@data-slate-node="element"][1]',
  );

  await editorImage.click({ force: true });

  const narrowOption = page
    .locator('#sidebar-properties .field-wrapper-blockWidth')
    .getByRole('radio', { name: 'Narrow' });
  await narrowOption.click({ force: true });
  await expect(imageBlock).toHaveAttribute(
    'style',
    /--block-width:\s*var\(--narrow-container-width\)/,
  );

  await expect
    .poll(async () => {
      const imageNodeHandle = await getNodeByPath(page, editorHandle, [2]);
      const imageNode = (await imageNodeHandle.jsonValue()) as Record<
        string,
        unknown
      >;

      return imageNode.blockWidth;
    })
    .toBe('narrow');

  const expectedWidth = await getRootVariable(page, '--narrow-container-width');
  await expect
    .poll(async () => getInheritedBlockWidth(imageBlock))
    .toBe(expectedWidth);
});

test('Wiki sidebar tabs follow the selected block and hide Order', async ({
  page,
}) => {
  await openImageSidebarPage(page, {
    contentId: 'image-sidebar-tabs-page',
    contentTitle: 'Image sidebar tabs page',
  });

  const tabs = page.locator('#sidebar .formtabs');
  const documentTab = tabs.locator('> .item').first();
  const blockTab = tabs.getByRole('button', { name: 'Block', exact: true });
  const altTextField = page
    .locator('#sidebar-properties')
    .getByRole('textbox', { name: 'Alt text' });

  await expect(documentTab).toHaveClass(/\bactive\b/);
  await expect(blockTab).toBeVisible();
  await expect(tabs.locator('> .item', { hasText: 'Order' })).toBeHidden();

  await page
    .locator('.slate-editor img[alt="Inline test image"]')
    .click({ force: true });
  await expect(blockTab).toHaveClass(/\bactive\b/);
  await expect(altTextField).toBeVisible();

  await page.locator('.slate-editor').getByText('Text after image').click();
  await expect(documentTab).toHaveClass(/\bactive\b/);

  await page
    .locator('.slate-editor img[alt="Inline test image"]')
    .click({ force: true });
  await expect(blockTab).toHaveClass(/\bactive\b/);

  await page.locator('.slate-editor h1').click();
  await expect(documentTab).toHaveClass(/\bactive\b/);
});

test('Inserting an image keeps the selection on it and opens the Block tab', async ({
  page,
}) => {
  await login(page);
  const contentPath = await createNativeBlocksPage(page, [], {
    extra: [{ type: 'p', children: [{ text: '' }] }],
  });
  const editorHandle = await openInEditor(page, contentPath);

  await insertWithSlashMenu(page, editorHandle, 1, 'Image');
  await expect(
    page.getByText('Browse the site, drop an image, or use a URL'),
  ).toBeVisible();

  // The selection used to jump to the start of the title right after the
  // empty paragraph holding the slash command was removed.
  await page.waitForTimeout(500);
  await expect
    .poll(() =>
      editorHandle.evaluate(
        (editor: any) => editor.selection?.anchor.path[0] ?? null,
      ),
    )
    .toBe(1);
  await expect(
    page.locator('#sidebar .formtabs').getByRole('button', {
      name: 'Block',
      exact: true,
    }),
  ).toHaveClass(/\bactive\b/);
});
