import type { Page } from '@playwright/test';
import { getEditorHandle, getNodeByPath } from '@platejs/playwright';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';
import { createWikiPage } from './content';
import { login } from './login';
import { makeSomersaultBody, type SlateNode } from './editor-helpers';

const withTocBody = makeSomersaultBody([
  { type: 'p', children: [{ text: '' }] },
  { type: 'h2', children: [{ text: 'Section One' }] },
  { type: 'h3', children: [{ text: 'Section Two' }] },
]);

// 3 depth levels (h1=depth1, h2=depth2, h3=depth3), each depth-1 has 5 depth-2 children,
// each depth-2 has 5 depth-3 grandchildren → 3 + 15 + 75 = 93 headings total
function buildDeepTocNodes(): SlateNode[] {
  const nodes: SlateNode[] = [{ type: 'p', children: [{ text: '' }] }];
  for (let d1 = 1; d1 <= 3; d1++) {
    nodes.push({ type: 'h1', children: [{ text: `Chapter ${d1}` }] });
    for (let d2 = 1; d2 <= 5; d2++) {
      nodes.push({ type: 'h2', children: [{ text: `Chapter ${d1} — Section ${d2}` }] });
      for (let d3 = 1; d3 <= 5; d3++) {
        nodes.push({ type: 'h3', children: [{ text: `Chapter ${d1} — Section ${d2} — Sub ${d3}` }] });
      }
    }
  }
  return nodes;
}

const withDeepTocBody = makeSomersaultBody(buildDeepTocNodes());

async function openTocEditor(page: Page, contentId: string, contentTitle: string) {
  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle,
    wikiId: `wiki-${contentId}`,
    transition: 'publish',
    bodyModifier: withTocBody,
  });

  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
}

async function insertTocViaSlash(page: Page) {
  // Click into the empty paragraph at path [1]
  const editor = page.locator('.slate-editor[data-slate-editor]');
  await editor.click();

  // Type slash to trigger slash menu
  await page.keyboard.type('/');

  // Wait for slash combobox and type toc
  await page.keyboard.type('toc');

  // Select "Table of contents" from cmdk list
  await page.getByRole('option', { name: /table of contents/i }).first().click();
}

test.describe('TOC block — wiki editor', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('slash command inserts TOC block with correct type', async ({ page }) => {
    await openTocEditor(page, 'toc-insert', 'TOC Insert');

    await insertTocViaSlash(page);

    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );

    // TOC inserted at path [1] — replaces empty paragraph
    const node = await getNodeByPath(page, editorHandle, [1]);
    expect((await node.jsonValue()).type).toBe('toc');
  });

  test('TOC block renders heading links from document headings', async ({ page }) => {
    await openTocEditor(page, 'toc-headings', 'TOC Headings');

    await insertTocViaSlash(page);

    // TocElement renders buttons for each heading
    const tocContainer = page.locator('.slate-editor [data-slate-node="element"]').filter({
      has: page.locator('button[aria-current]'),
    }).first();

    await expect(tocContainer).toBeVisible();
    await expect(tocContainer.getByRole('button', { name: /Section One/i })).toBeVisible();
    await expect(tocContainer.getByRole('button', { name: /Section Two/i })).toBeVisible();
  });

  test('TOC block shows placeholder when no headings exist', async ({ page }) => {
    // Body with only paragraphs — no headings
    const { contentPath } = await createWikiPage(page, {
      contentId: 'toc-no-headings',
      contentTitle: 'TOC No Headings',
      wikiId: 'wiki-toc-no-headings',
      transition: 'publish',
      bodyModifier: makeSomersaultBody([
        { type: 'p', children: [{ text: '' }] },
        { type: 'p', children: [{ text: 'Just a paragraph' }] },
      ]),
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    // Title block syncs to TOC headings — clear it so no headings exist
    const titleBlock = page.locator('.documentFirstHeading');
    await titleBlock.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');

    await insertTocViaSlash(page);

    await expect(
      page.locator('.slate-editor').getByText('Create a heading to display the table of contents.'),
    ).toBeVisible();
  });

  test('TOC block heading links reflect h2 and h3 depth', async ({ page }) => {
    await openTocEditor(page, 'toc-depth', 'TOC Depth');

    await insertTocViaSlash(page);

    // TocElement applies depth-based padding classes (pl-0.5 for h2=depth1, pl-[26px] for h3=depth2)
    const sectionOneBtn = page.locator('.slate-editor button[aria-current]').filter({
      hasText: 'Section One',
    });
    const sectionTwoBtn = page.locator('.slate-editor button[aria-current]').filter({
      hasText: 'Section Two',
    });

    await expect(sectionOneBtn).toBeVisible();
    await expect(sectionTwoBtn).toBeVisible();

    // h2 gets depth=2 → pl-[26px], h3 gets depth=3 → pl-[50px]
    await expect(sectionOneBtn).toHaveClass(/pl-\[26px\]/);
    await expect(sectionTwoBtn).toHaveClass(/pl-\[50px\]/);
  });

  // -------------------------------------------------------------------------
  // Deep TOC: 3 depths × 5 subdepths
  // h1=depth1 (pl-0.5), h2=depth2 (pl-[26px]), h3=depth3 (pl-[50px])
  // Structure: 3 × h1, each with 5 × h2, each with 5 × h3 → 93 headings
  // -------------------------------------------------------------------------

  test('TOC renders all 3 depth levels with 5 subdepths each', async ({ page }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'toc-deep',
      contentTitle: 'TOC Deep',
      wikiId: 'wiki-toc-deep',
      transition: 'publish',
      bodyModifier: withDeepTocBody,
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    await insertTocViaSlash(page);

    const allBtns = page.locator('.slate-editor button[aria-current]');

    // 4 h1 + 15 h2 + 75 h3 = 94 total
    await expect(allBtns).toHaveCount(94);
  });

  test('TOC depth-1 headings (h1) have correct padding class', async ({ page }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'toc-deep-d1',
      contentTitle: 'TOC Deep D1',
      wikiId: 'wiki-toc-deep-d1',
      transition: 'publish',
      bodyModifier: withDeepTocBody,
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    await insertTocViaSlash(page);

    for (let d1 = 1; d1 <= 3; d1++) {
      const btn = page.locator('.slate-editor button[aria-current]').filter({
        hasText: `Chapter ${d1}`,
      }).first();
      await expect(btn).toBeVisible();
      await expect(btn).toHaveClass(/pl-0\.5/);
    }
  });

  test('TOC depth-2 headings (h2) have correct padding class', async ({ page }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'toc-deep-d2',
      contentTitle: 'TOC Deep D2',
      wikiId: 'wiki-toc-deep-d2',
      transition: 'publish',
      bodyModifier: withDeepTocBody,
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    await insertTocViaSlash(page);

    for (let d1 = 1; d1 <= 3; d1++) {
      for (let d2 = 1; d2 <= 5; d2++) {
        const btn = page.locator('.slate-editor button[aria-current]').filter({
          hasText: `Chapter ${d1} — Section ${d2}`,
        }).first();
        await expect(btn).toBeVisible();
        await expect(btn).toHaveClass(/pl-\[26px\]/);
      }
    }
  });

  test('TOC depth-3 headings (h3) have correct padding class', async ({ page }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'toc-deep-d3',
      contentTitle: 'TOC Deep D3',
      wikiId: 'wiki-toc-deep-d3',
      transition: 'publish',
      bodyModifier: withDeepTocBody,
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    await insertTocViaSlash(page);

    for (let d1 = 1; d1 <= 3; d1++) {
      for (let d2 = 1; d2 <= 5; d2++) {
        for (let d3 = 1; d3 <= 5; d3++) {
          const btn = page.locator('.slate-editor button[aria-current]').filter({
            hasText: `Chapter ${d1} — Section ${d2} — Sub ${d3}`,
          }).first();
          await expect(btn).toBeVisible();
          await expect(btn).toHaveClass(/pl-\[50px\]/);
        }
      }
    }
  });
});
