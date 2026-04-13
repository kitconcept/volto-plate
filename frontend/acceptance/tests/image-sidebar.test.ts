import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';
import { waitForPlateEditorReady } from './plate';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';

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
  return page.evaluate((variableName) => {
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
            type: 'img',
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
  }: {
    contentId?: string;
    contentTitle?: string;
  } = {},
) {
  await login(page);
  await createContent(page, {
    contentType: 'WikiPage',
    contentId,
    contentTitle,
    transition: 'publish',
    bodyModifier: withSomersaultImageBody,
  });

  await page.goto(`/${contentId}/edit`, { waitUntil: 'networkidle' });
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

  expect(imageNode.type).toBe('img');
  expect(imageNode['@type']).toBe('plateimage');

  const editorImage = page.locator(
    '.slate-editor img[alt="Inline test image"]',
  );
  await expect(editorImage).toBeVisible();
  await editorImage.dispatchEvent('click');
  await page.getByRole('button', { name: 'Block' }).click();

  return {
    editorImage,
    imageBlock: page.locator('.slate-img').first(),
  };
}

test('Selecting a Volto-adapted Plate image shows the sidebar form', async ({
  page,
}) => {
  await openImageSidebarPage(page);
  await expect(page.getByLabel('Alt text')).toHaveCount(0);
  await openSelectedImageBlockSidebar(page);

  const debugInfo = await page.evaluate(() => {
    const editable = document.querySelector(
      '.slate-editor[data-slate-editor]',
    ) as HTMLElement | null;
    const adapter = window.platePlaywrightAdapter;
    const editor = editable ? adapter?.EDITABLE_TO_EDITOR?.get(editable) : null;
    const nodeAt2 = editor?.api?.node?.([2])?.[0];
    const nodeAt20 = editor?.api?.node?.([2, 0])?.[0];

    return {
      selection: editor?.selection ?? null,
      nodeAt2: nodeAt2
        ? {
            type: nodeAt2.type,
            blockType: nodeAt2['@type'],
            keys: Object.keys(nodeAt2),
          }
        : null,
      nodeAt20: nodeAt20
        ? {
            text: nodeAt20.text,
            keys: Object.keys(nodeAt20),
          }
        : null,
      hasImageSchema: Boolean(
        (globalThis as any).__CLIENT_CONFIG__?.blocks?.blocksConfig?.plateimage
          ?.blockSchema,
      ),
      sidebarPropertiesChildren:
        document.getElementById('sidebar-properties')?.children.length ?? null,
    };
  });

  console.log('image-sidebar debug', JSON.stringify(debugInfo));
  await expect(page.getByLabel('Alt text')).toHaveValue('Inline test image');
});

test('Changing Block width in the sidebar updates the rendered image width', async ({
  page,
}) => {
  await openImageSidebarPage(page, {
    contentId: 'image-sidebar-block-width-page',
    contentTitle: 'Image sidebar block width page',
  });

  const { imageBlock } = await openSelectedImageBlockSidebar(page);

  await expect(imageBlock).toBeVisible();
  const blockWidthField = page.getByRole('radiogroup', { name: 'Block width' });
  await expect(blockWidthField).toBeVisible();

  await blockWidthField
    .getByRole('radio', { name: 'Narrow' })
    .check({ force: true });

  const expectedWidth = await getRootVariable(page, '--narrow-container-width');

  await expect(imageBlock).toHaveAttribute(
    'style',
    /--block-width:\s*var\(--narrow-container-width\)/,
  );
  await expect.poll(async () => getInheritedBlockWidth(imageBlock)).toBe(
    expectedWidth,
  );
});
