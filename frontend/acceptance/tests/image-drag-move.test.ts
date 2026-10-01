import { createNativeBlocksPage, openInEditor } from '../fixtures/pages';
import { editable, getValue, nodeText } from '../fixtures/editor';
import { login } from './login';
import { expect, test } from './test';

// Moving an image block inside the editor with native drag and drop.

const DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const image = {
  type: 'ploneBlock',
  '@type': 'plateimage',
  url: DATA_URI,
  alt: 'Draggable image',
  children: [{ text: '' }],
};

const p = (text: string) => ({ type: 'p', children: [{ text }] });

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('Dragging an image block moves it to the drop position', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const path = await createNativeBlocksPage(page, [], {
    extra: [p('First paragraph'), image, p('Second paragraph')],
  });
  const editorHandle = await openInEditor(page, path);

  const img = editable(page).locator('img[alt="Draggable image"]');
  const target = editable(page).getByText('First paragraph');
  await expect(img).toBeVisible();

  // Playwright's mouse emulation stalls inside a real browser drag session,
  // so dispatch the drag events Slate listens to with one shared
  // DataTransfer, as the browser does.
  await page.evaluate(
    ([source, dropTarget]) => {
      const dataTransfer = new DataTransfer();
      const { left, top } = dropTarget.getBoundingClientRect();
      const at = { clientX: left + 1, clientY: top + 1 };
      const fire = (element: Element, type: string, point = {}) =>
        element.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            ...point,
          }),
        );

      fire(source, 'dragstart');
      fire(dropTarget, 'dragover', at);
      fire(dropTarget, 'drop', at);
      fire(source, 'dragend');
    },
    [await img.elementHandle(), await target.elementHandle()] as const,
  );

  await expect
    .poll(async () =>
      (await getValue(page, editorHandle)).map((node) =>
        node.type === 'ploneBlock' ? `[${node['@type']}]` : nodeText(node),
      ),
    )
    .toEqual([
      'Native blocks',
      '[plateimage]',
      'First paragraph',
      'Second paragraph',
    ]);
  expect(errors).toEqual([]);
});
