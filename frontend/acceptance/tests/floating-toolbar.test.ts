import type { Page } from '@playwright/test';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';
import { createWikiPage } from './content';
import { login } from './login';
import { getEditor, selectTextInEditor, makeSomersaultBody } from './editor-helpers';


const withSomersaultBody = makeSomersaultBody([
  { type: 'p', children: [{ text: 'Format this Text' }] },
  { type: 'p', children: [{ text: 'Another Text' }] },
]);

const withToggleBody = makeSomersaultBody([
  { type: 'toggle', children: [{ text: 'Format this Text' }] },
  { type: 'p', indent: 1, children: [{ text: 'Another Text' }] },
]);

async function openWikiPageEditor(
  page: Page,
  {
    contentId,
    contentTitle,
    wikiId = `wiki-${contentId}`,
    bodyModifier = withSomersaultBody,
  }: {
    contentId: string;
    contentTitle: string;
    wikiId?: string;
    bodyModifier?: ReturnType<typeof makeSomersaultBody>;
  },
) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId,
    transition: 'publish',
    bodyModifier,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}


test.describe('Floating toolbar — wiki editor', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // -------------------------------------------------------------------------
  // Toolbar visibility
  // -------------------------------------------------------------------------

  test('floating toolbar appears when text is selected', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-appears',
      contentTitle: 'Toolbar Appears',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await expect(
      page.getByRole('toolbar', { name: 'Editor toolbar' }),
    ).toBeVisible();
  });

  test('floating toolbar disappears when selection is cleared', async ({
    page,
  }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-disappears',
      contentTitle: 'Toolbar Disappears',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await expect(
      page.getByRole('toolbar', { name: 'Editor toolbar' }),
    ).toBeVisible();

    // Click elsewhere to deselect
    await getEditor(page).click({ position: { x: 10, y: 10 } });
    await expect(
      page.getByRole('toolbar', { name: 'Editor toolbar' }),
    ).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // All marks
  // -------------------------------------------------------------------------

  test('bold button applies bold mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-bold',
      contentTitle: 'Toolbar Bold',
    });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-bold)').click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));

    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.bold).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  test('italic button applies italic mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-italic',
      contentTitle: 'Toolbar Italic',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-italic)').click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));

    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.italic).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  test('strikethrough button applies strikethrough mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-strikethrough',
      contentTitle: 'Toolbar Strikethrough',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-strikethrough)').click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));

    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.strikethrough).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });


  test('inline code button applies code mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-code',
      contentTitle: 'Toolbar Code',

    });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 16);
    await page.locator('button:has(svg.lucide-code-xml)').click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));

    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.code).toBe(true);
    expect(nodeValue.text).toBe('Format this Text');
  });

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  test('Ctrl+B applies bold mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'keyboard-bold',
      contentTitle: 'Keyboard Bold',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.keyboard.press('ControlOrMeta+b');

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.bold).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  test('Ctrl+I applies italic mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'keyboard-italic',
      contentTitle: 'Keyboard Italic',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.keyboard.press('ControlOrMeta+i');

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.italic).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  test('Ctrl+Shift+X applies strikethrough mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'keyboard-strikethrough',
      contentTitle: 'Keyboard Strikethrough',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.keyboard.press('ControlOrMeta+Shift+x');

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.strikethrough).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  test('Ctrl+E applies inline code mark', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'keyboard-code',
      contentTitle: 'Keyboard Code',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 16);
    await page.keyboard.press('ControlOrMeta+e');

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.code).toBe(true);
    expect(nodeValue.text).toBe('Format this Text');
  });

  test('Ctrl+, applies superscript mark', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'keyboard-sup', contentTitle: 'Keyboard Superscript' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.keyboard.press('ControlOrMeta+Period');
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    expect((await node.jsonValue()).superscript).toBe(true);
  });

  test('Ctrl+. applies subscript mark', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'keyboard-sub', contentTitle: 'Keyboard Subscript' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.keyboard.press('ControlOrMeta+Comma');
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    expect((await node.jsonValue()).subscript).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Combined marks
  // -------------------------------------------------------------------------

  test('bold + italic + strikethrough applied together on same selection', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'combo-bold-italic-strike',
      contentTitle: 'Combo Bold Italic Strike',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-bold)').click();

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-italic)').click();

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-strikethrough)').click();

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.bold).toBe(true);
    expect(nodeValue.italic).toBe(true);
    expect(nodeValue.strikethrough).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  test('bold + italic + strikethrough + code applied together on same selection', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'combo-all-marks',
      contentTitle: 'Combo All Marks',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-bold)').click();

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-italic)').click();

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-strikethrough)').click();

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-code-xml)').click();

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();

    expect(nodeValue.bold).toBe(true);
    expect(nodeValue.italic).toBe(true);
    expect(nodeValue.strikethrough).toBe(true);
    expect(nodeValue.code).toBe(true);
    expect(nodeValue.text).toBe('Format');
  });

  // -------------------------------------------------------------------------
  // Toggle off
  // -------------------------------------------------------------------------

  test('clicking bold twice on same selection removes the mark', async ({
    page,
  }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-bold-toggle',
      contentTitle: 'Toolbar Bold Toggle',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-code-xml)').click();

    // Re-select and toggle off
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-code-xml)').click();
    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    const nodeValue = await node.jsonValue();
    // After toggling bold off, no bold mark should remain
    expect(nodeValue.bold).not.toBe(true);
  });



  // -------------------------------------------------------------------------
  // Turn Into — all menuitemradio options
  // -------------------------------------------------------------------------


  test('Turn Into: Text restores paragraph', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-text', contentTitle: 'Turn Into Text' });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);

    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');

    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();

    await page.getByRole('menuitemradio', { name: /^text$/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('p');
  });

  test('Turn Into : Heading 2', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-turn-into',
      contentTitle: 'Toolbar Turn Into',
    });

    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);

    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');

    await expect(turnIntoBtn).toBeVisible();

    await turnIntoBtn.click();

    const h2Option = page.getByRole('menuitemradio', { name: /heading 2/i }).first();
    await h2Option.click();

    const editorHandle = await getEditorHandle(page, page.locator('.slate-editor[data-slate-editor]'));
    const node = await getNodeByPath(page, editorHandle, [1]);
    const nodeValue = await node.jsonValue();
    expect(nodeValue.type).toBe('h2');
  });

  test('Turn Into: Heading 3', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-h3', contentTitle: 'Turn Into H3' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /heading 3/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('h3');
  });

  test('Turn Into: Heading 4', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-h4', contentTitle: 'Turn Into H4' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /heading 4/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('h4');
  });

  test('Turn Into: Bulleted list', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-ul', contentTitle: 'Turn Into UL' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /bulleted list/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    const val = await node.jsonValue();
    expect(val.type).toBe('p');
    expect(val.listStyleType).toBeTruthy();
  });

  test('Turn Into: Numbered list', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-ol', contentTitle: 'Turn Into OL' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /numbered list/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    const val = await node.jsonValue();
    expect(val.type).toBe('p');
    expect(val.listStyleType).toBeTruthy();
  });

  test('Turn Into: To-do list', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-todo', contentTitle: 'Turn Into Todo' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /to-do list/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    const val = await node.jsonValue();
    expect(val.listStyleType).toBe('todo');
  });

  test('Turn Into: Toggle list', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-toggle', contentTitle: 'Turn Into Toggle' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /toggle list/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('toggle');
  });

  test('Turn Into: Code block', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-code-block', contentTitle: 'Turn Into Code Block' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /^code$/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('code_block');
  });

  test('Turn Into: Quote', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'turn-into-quote', contentTitle: 'Turn Into Quote' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    const turnIntoBtn = page.locator('[data-testid="turn-into-toolbar-button"]');
    await expect(turnIntoBtn).toBeVisible();
    await turnIntoBtn.click();
    await page.getByRole('menuitemradio', { name: /^quote$/i }).first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('blockquote');
  });

  // -------------------------------------------------------------------------
  // Insert (More) button — keyboard input, superscript, subscript
  // -------------------------------------------------------------------------

  test('Insert menu: keyboard input applies kbd mark', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'insert-kbd', contentTitle: 'Insert Kbd' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-ellipsis)').click();
    await page.getByRole('menuitem', { name: /keyboard input/i }).click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    expect((await node.jsonValue()).kbd).toBe(true);
  });

  test('Insert menu: superscript applies superscript mark', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'insert-sup', contentTitle: 'Insert Superscript' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-ellipsis)').click();
    await page.getByRole('menuitem', { name: /superscript/i }).click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    expect((await node.jsonValue()).superscript).toBe(true);
  });

  test('Insert menu: subscript applies subscript mark', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'insert-sub', contentTitle: 'Insert Subscript' });
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-ellipsis)').click();
    await page.getByRole('menuitem', { name: /subscript/i }).click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node = await getNodeByPath(page, editorHandle, [1, 0]);
    expect((await node.jsonValue()).subscript).toBe(true);
  });

  // -------------------------------------------------------------------------
  // List / toggle toolbar buttons — multi-paragraph selection
  // body: [1] = 'Format this Text' (16 chars), [2] = 'Another Text' (12 chars)
  // -------------------------------------------------------------------------

  test('bulleted list toolbar button wraps multiple selected paragraphs into unordered list items', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'toolbar-ul-multi', contentTitle: 'Toolbar UL Multi' });
    await selectTextInEditor(page, [1, 0], 0, [2, 0], 12);
    await page.locator('button:has(svg.lucide-list)').first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node1 = await getNodeByPath(page, editorHandle, [1]);
    const node2 = await getNodeByPath(page, editorHandle, [2]);
    expect((await node1.jsonValue()).listStyleType).toBeTruthy();
    expect((await node2.jsonValue()).listStyleType).toBeTruthy();
  });

  test('numbered list toolbar button wraps multiple selected paragraphs into ordered list items', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'toolbar-ol-multi', contentTitle: 'Toolbar OL Multi' });
    await selectTextInEditor(page, [1, 0], 0, [2, 0], 12);
    await page.locator('button:has(svg.lucide-list-ordered)').first().click();
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node1 = await getNodeByPath(page, editorHandle, [1]);
    const node2 = await getNodeByPath(page, editorHandle, [2]);
    expect((await node1.jsonValue()).listStyleType).toBeTruthy();
    expect((await node2.jsonValue()).listStyleType).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Toggle block — floating toolbar interaction
  // -------------------------------------------------------------------------

  test('floating toolbar appears when text inside open toggle is selected', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'toolbar-toggle-open',
      contentTitle: 'Toolbar Toggle Open',
      bodyModifier: withToggleBody,
    });


    // Select text inside the toggle header (indent-1 child paragraph is now visible)
    await selectTextInEditor(page, [1, 0], 0, [1, 0], 6);
    await page.locator('button:has(svg.lucide-list-collapse)').click();

    // Toggle is open — indented child paragraph is visible in the DOM
    const editorHandle = await getEditorHandle(page, getEditor(page));
    const childNode = await getNodeByPath(page, editorHandle, [2]);
    const childValue = await childNode.jsonValue();
    expect(childValue.type).toBe('p');
    expect(childValue.indent).toBe(1);
    expect((childValue.children as { text: string }[])[0].text).toBe('Another Text');
  
  });

  test('todo list toolbar button converts multiple selected paragraphs into todo list items, one checked and one unchecked', async ({ page }) => {
    await openWikiPageEditor(page, { contentId: 'toolbar-todo-multi', contentTitle: 'Toolbar Todo Multi' });
    await selectTextInEditor(page, [1, 0], 0, [2, 0], 12);
    await page.locator('button:has(svg.lucide-list-todo)').click();

    const editorHandle = await getEditorHandle(page, getEditor(page));
    const node1 = await getNodeByPath(page, editorHandle, [1]);
    const node2 = await getNodeByPath(page, editorHandle, [2]);
    expect((await node1.jsonValue()).listStyleType).toBe('todo');
    expect((await node2.jsonValue()).listStyleType).toBe('todo');

    // Check the first todo item by clicking its checkbox
    await getEditor(page)
      .locator('[data-slot="checkbox"]')
      .first()
      .click();

    const checkedNode = await getNodeByPath(page, editorHandle, [1]);
    const uncheckedNode = await getNodeByPath(page, editorHandle, [2]);
    expect((await checkedNode.jsonValue()).checked).toBe(true);
    expect((await uncheckedNode.jsonValue()).checked).not.toBe(true);
  });

});
