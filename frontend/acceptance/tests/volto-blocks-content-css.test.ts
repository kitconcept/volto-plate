import type { Page } from '@playwright/test';

import { createContent } from './content';
import { login } from './login';
import { expect, test } from './test';

// The content styles of @plone/plate (`plone-content` layer) select Plate's
// class names. Volto uses two of them for its own elements: `slate-editor`
// wraps volto-slate's text editor and `slate-table` wraps the view of its
// table block. Those elements must look as if the layer wasn't loaded: its
// `overflow: hidden` clipped the slash menu of Volto's text blocks.

const TEXT = 'A Volto text block.';

const cell = (key: string) => ({
  key,
  type: 'data',
  value: [{ type: 'p', children: [{ text: key }] }],
});

function withVoltoBlocks(body: Record<string, unknown>) {
  return {
    ...body,
    blocks: {
      title: { '@type': 'title' },
      text: {
        '@type': 'slate',
        plaintext: TEXT,
        value: [
          {
            type: 'p',
            children: [
              { text: 'A ' },
              { type: 'strong', children: [{ text: 'Volto' }] },
              { text: ' text block.' },
            ],
          },
        ],
      },
      list: {
        '@type': 'slate',
        value: [
          {
            type: 'ul',
            children: [
              { type: 'li', children: [{ text: 'One' }] },
              { type: 'li', children: [{ text: 'Two' }] },
            ],
          },
        ],
      },
      table: {
        '@type': 'slateTable',
        table: {
          rows: [
            { key: 'row-1', cells: [cell('A'), cell('B')] },
            { key: 'row-2', cells: [cell('C'), cell('D')] },
          ],
        },
      },
    },
    blocks_layout: { items: ['title', 'text', 'list', 'table'] },
  };
}

/** The computed styles of the elements under `selector`, keyed by position. */
async function computedStyles(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const styles: Record<string, Record<string, string>> = {};
    const roots = Array.from(document.querySelectorAll(selector));
    const elements = roots.flatMap((root) => [
      root,
      ...Array.from(root.querySelectorAll('*')),
    ]);
    elements.forEach((element, index) => {
      const computed = getComputedStyle(element);
      const values: Record<string, string> = {};
      for (const property of Array.from(computed)) {
        values[property] = computed.getPropertyValue(property);
      }
      styles[`${index} ${element.tagName} ${element.className}`] = values;
    });
    return styles;
  }, selector);
}

/** Removes the `plone-content` layer from the page's style sheets. */
async function removeContentLayer(page: Page) {
  const removed = await page.evaluate(() => {
    let count = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (let index = rules.length - 1; index >= 0; index--) {
        const rule = rules[index];
        if (
          rule instanceof CSSLayerBlockRule &&
          rule.name === 'plone-content'
        ) {
          sheet.deleteRule(index);
          count++;
        }
      }
    }
    return count;
  });
  expect(removed).toBeGreaterThan(0);
}

/** The styles under `selector` don't change when the layer is removed. */
async function expectUntouchedByContentLayer(page: Page, selector: string) {
  await expect(page.locator(selector).first()).toBeVisible();
  const withLayer = await computedStyles(page, selector);
  await removeContentLayer(page);
  const withoutLayer = await computedStyles(page, selector);
  expect(Object.keys(withLayer).length).toBeGreaterThan(1);
  expect(withLayer).toEqual(withoutLayer);
}

test.describe('Volto blocks and the Plate content styles', () => {
  let contentPath: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    await createContent(page, {
      contentType: 'Document',
      contentId: 'volto-blocks',
      contentTitle: 'Volto blocks',
      transition: 'publish',
      bodyModifier: withVoltoBlocks,
    });
    contentPath = '/volto-blocks';
  });

  test('the text editor keeps Volto styles', async ({ page }) => {
    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await expectUntouchedByContentLayer(
      page,
      '#page-edit .block-editor-slate .slate-editor',
    );
  });

  test('the table block view keeps Volto styles', async ({ page }) => {
    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await expectUntouchedByContentLayer(page, '.block.slate-table');
  });

  test('the slash menu of a text block shows', async ({ page }) => {
    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    const editor = page
      .locator('#page-edit .block-editor-slate [contenteditable="true"]')
      .filter({ hasText: TEXT });
    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('/');

    const menu = page.locator('.power-user-menu');
    await expect(menu).toBeVisible();
    // The menu is laid out even when clipped: check it's the element painted
    // on top of its first entry.
    const item = menu.locator('.item').first();
    await expect(item).toBeVisible();
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    const onTop = await page.evaluate(
      ({ x, y }) =>
        Boolean(document.elementFromPoint(x, y)?.closest('.power-user-menu')),
      { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
    );
    expect(onTop).toBe(true);
  });
});
