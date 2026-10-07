import { login } from './login';
import { expect, test } from './test';
import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  openInView,
  savePage,
} from '../fixtures/pages';
import {
  editable,
  getValue,
  insertWithSlashMenu,
  type EditorNode,
} from '../fixtures/editor';

// The Diagram element (Plate's code drawing): the diagram source is stored in
// the document and rendered in the browser, in the editor and the public view.

test.setTimeout(30_000);

const emptyParagraph = { type: 'p', children: [{ text: '' }] };

const MERMAID = 'graph TD\n  A[Start] --> B[Done]';

const diagram = (data: Record<string, string>) => ({
  type: 'code_drawing',
  data,
  children: [{ text: '' }],
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('Slash menu inserts a diagram that renders, saves and shows in the view', async ({
  page,
}) => {
  const contentPath = await createNativeBlocksPage(page, [], {
    title: 'Diagram page',
    extra: [emptyParagraph],
  });
  const editorHandle = await openInEditor(page, contentPath);

  await insertWithSlashMenu(page, editorHandle, 1, 'Diagram');

  const element = editable(page).locator('.slate-code_drawing');
  await expect(element).toBeVisible();

  // The empty paragraph is replaced (the trailing block plugin then adds a new
  // one after it) and the new block has the default width.
  const value = await getValue(page, editorHandle);
  expect(value.map((node) => node.type)).toEqual([
    'title',
    'code_drawing',
    'p',
  ]);
  expect(value[1].blockWidth).toBe('default');

  // Typing in the code area must reach the textarea, not the editor.
  await element.locator('textarea').click();
  await page.keyboard.type('graph TD');
  await page.keyboard.press('Enter');
  await page.keyboard.type('  A[Start] --> B[Done]');

  await expect(element.getByRole('img', { name: 'Diagram' })).toBeVisible();
  await expect
    .poll(async () => (await getValue(page, editorHandle))[1].data)
    .toEqual({ drawingType: 'Mermaid', drawingMode: 'Both', code: MERMAID });

  await savePage(page, contentPath);

  const stored = (await getStoredValue(page, contentPath)) as EditorNode[];
  expect(stored[1]).toMatchObject({
    type: 'code_drawing',
    blockWidth: 'default',
    data: { drawingType: 'Mermaid', code: MERMAID },
  });

  const content = await openInView(page, contentPath);
  const rendered = content.locator('.slate-code_drawing');
  await expect(rendered.getByRole('img', { name: 'Diagram' })).toBeVisible();
  // Rendered at the default block width, like the text around it.
  await expect(rendered.locator('.block-inner-container')).toBeVisible();
});

test('The view shows the source of a diagram in "Code" view mode', async ({
  page,
}) => {
  const contentPath = await createNativeBlocksPage(page, [], {
    title: 'Diagram code page',
    extra: [
      diagram({ drawingType: 'Mermaid', drawingMode: 'Code', code: MERMAID }),
    ],
  });

  const content = await openInView(page, contentPath);
  const rendered = content.locator('.slate-code_drawing');

  await expect(rendered.locator('pre code')).toHaveText(MERMAID);
  await expect(rendered.getByRole('img')).toHaveCount(0);
});

test('PlantUML is not offered and never sent to plantuml.com', async ({
  page,
}) => {
  const plantUmlRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('plantuml.com')) {
      plantUmlRequests.push(request.url());
    }
  });

  const code = '@startuml\nAlice -> Bob: hello\n@enduml';
  const contentPath = await createNativeBlocksPage(page, [], {
    title: 'PlantUML page',
    extra: [diagram({ drawingType: 'PlantUml', drawingMode: 'Both', code })],
  });

  await openInEditor(page, contentPath);
  const element = editable(page).locator('.slate-code_drawing');
  const typeSelect = element.getByRole('combobox', { name: 'Diagram type' });

  // Kept visible as the current value, but it can't be picked.
  await expect(typeSelect).toHaveValue('PlantUml');
  await expect(typeSelect.locator('option:not([disabled])')).toHaveText([
    'Graphviz',
    'Flowchart',
    'Mermaid',
  ]);
  await expect(
    element.getByText('The diagram could not be rendered.'),
  ).toBeVisible();

  // The view falls back to the source.
  const content = await openInView(page, contentPath);
  const rendered = content.locator('.slate-code_drawing');
  await expect(rendered.locator('pre code')).toHaveText(code);
  await expect(rendered.getByRole('img')).toHaveCount(0);

  expect(plantUmlRequests).toEqual([]);
});
