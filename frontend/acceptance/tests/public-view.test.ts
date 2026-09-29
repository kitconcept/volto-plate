import type { Locator } from '@playwright/test';

import { createNativeBlocksPage, openInView } from '../fixtures/pages';
import type { NativeBlockSection } from '../fixtures/native-blocks';
import { login } from './login';
import { expect, test } from './test';

// The native blocks as rendered by the wiki renderer preset in the public
// view of a page.

test.beforeEach(async ({ page }) => {
  await login(page);
});

const cases: {
  section: NativeBlockSection;
  check: (content: Locator) => Promise<void>;
}[] = [
  {
    section: 'headings',
    check: async (content) => {
      for (const [tag, text] of [
        ['h2', 'Heading two'],
        ['h3', 'Heading three'],
        ['h4', 'Heading four'],
        ['h5', 'Heading five'],
        ['h6', 'Heading six'],
      ]) {
        await expect(content.locator(tag, { hasText: text })).toBeVisible();
      }
    },
  },
  {
    section: 'marks',
    check: async (content) => {
      await expect(content.locator('strong')).toHaveText('bold');
      await expect(content.locator('em')).toHaveText('italic');
      await expect(content.locator('s')).toHaveText('strikethrough');
      await expect(content.locator('code')).toHaveText('inline code');
      await expect(content.getByRole('link', { name: 'link' })).toHaveAttribute(
        'href',
        'https://plone.org',
      );
    },
  },
  {
    section: 'lists',
    check: async (content) => {
      await expect(
        content.locator('ul li', { hasText: 'Bulleted nested' }),
      ).toBeVisible();
      await expect(
        content.locator('ol li', { hasText: 'Numbered second' }),
      ).toBeVisible();
      // To-dos are rendered read-only, with their checked state.
      await expect(content.locator('[data-state="checked"]')).toHaveCount(1);
      await expect(content.getByText('To-do done')).toBeVisible();
    },
  },
  {
    section: 'blockquote',
    check: async (content) => {
      const quote = content.locator('blockquote');
      await expect(quote.getByText('First quoted paragraph.')).toBeVisible();
      await expect(quote.getByText('Second quoted paragraph.')).toBeVisible();
    },
  },
  {
    section: 'codeBlock',
    check: async (content) => {
      await expect(content.locator('pre')).toContainText(
        'function greet(name) {',
      );
    },
  },
  {
    section: 'table',
    check: async (content) => {
      const table = content.locator('table');
      await expect(table.locator('th')).toHaveText([
        'Header one',
        'Header two',
      ]);
      await expect(table.locator('td')).toHaveText(['Cell one', 'Cell two']);
    },
  },
  {
    section: 'callout',
    check: async (content) => {
      await expect(content.locator('.slate-callout')).toContainText(
        'Callout with an important note.',
      );
    },
  },
  {
    section: 'columns',
    check: async (content) => {
      const group = content.locator('.slate-column_group');
      await expect(group.locator('.slate-column')).toHaveCount(3);
      await expect(group.getByText('Column three')).toBeVisible();
    },
  },
  {
    section: 'toc',
    check: async (content) => {
      const toc = content.locator('.slate-toc');
      await expect(
        toc.getByRole('button', { name: 'First section' }),
      ).toBeVisible();
      await expect(
        toc.getByRole('button', { name: 'Nested section' }),
      ).toBeVisible();
    },
  },
  {
    section: 'hr',
    check: async (content) => {
      await expect(content.locator('hr')).toHaveCount(1);
      await expect(content.getByText('After the separator.')).toBeVisible();
    },
  },
  {
    section: 'date',
    check: async (content) => {
      await expect(content.locator('[data-slate-type="date"]')).toHaveText(
        'September 29, 2026',
      );
    },
  },
];

for (const { section, check } of cases) {
  test(`Public view renders the "${section}" native block`, async ({
    page,
  }) => {
    const path = await createNativeBlocksPage(page, [section]);
    const content = await openInView(page, path);

    await check(content);
  });
}

test('Public view renders the title block as the page heading', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, [], {
    title: 'Rendered title',
  });
  const content = await openInView(page, path);

  await expect(content.locator('h1')).toHaveText('Rendered title');
});

test('Public view toggle shows and hides its content', async ({ page }) => {
  const path = await createNativeBlocksPage(page, ['toggle']);
  const content = await openInView(page, path);

  const text = content.getByText('Content inside the toggle.');
  const button = content.getByRole('button', { name: 'Toggle content' });

  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(text).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(text).toBeVisible();

  await button.press('Enter');
  await expect(text).toBeHidden();
});

test('Public view table of contents jumps to the headings', async ({
  page,
}) => {
  const filler = Array.from({ length: 40 }, (_, i) => ({
    type: 'p',
    children: [{ text: `Filler paragraph ${i + 1}` }],
  }));
  const path = await createNativeBlocksPage(page, [], {
    extra: [
      { type: 'toc', children: [{ text: '' }] },
      ...filler,
      // Saved content has node ids (the editor assigns them), which the table
      // of contents uses to find the heading.
      {
        type: 'h2',
        id: 'far-away-section',
        children: [{ text: 'Far away section' }],
      },
    ],
  });
  const content = await openInView(page, path);

  const heading = content.locator('h2', { hasText: 'Far away section' });
  await expect(heading).not.toBeInViewport();

  await content.getByRole('button', { name: 'Far away section' }).click();

  await expect(heading).toBeInViewport();
});
