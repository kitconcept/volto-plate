import { getEditorHandle } from '@platejs/playwright';

import { createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

// Plate v53 stores blockquotes as containers of blocks. Content saved before
// the upgrade holds flat blockquotes (text children), which the editor
// normalizes on load.
const legacyBlockquoteBody = (body: Record<string, unknown>) => ({
  ...body,
  blocks: {
    __somersault__: {
      '@type': '__somersault__',
      value: [
        { type: 'title', children: [{ text: 'Legacy blockquote' }] },
        { type: 'blockquote', children: [{ text: 'Legacy quote' }] },
      ],
    },
  },
});

test.describe('Plate blockquote', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a legacy flat blockquote is loaded as a blockquote container', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'legacy-blockquote-edit',
      contentTitle: 'Legacy blockquote',
      transition: 'publish',
      bodyModifier: legacyBlockquoteBody,
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);
    const editorHandle = await getEditorHandle(
      page,
      page.locator('.slate-editor[data-slate-editor]'),
    );

    const blockquote = await page.evaluate(
      (editor) => JSON.parse(JSON.stringify(editor.children[1])),
      editorHandle,
    );

    expect(blockquote.type).toBe('blockquote');
    expect(blockquote.children).toEqual([
      expect.objectContaining({
        type: 'p',
        children: [{ text: 'Legacy quote' }],
      }),
    ]);
  });

  test('a legacy flat blockquote still renders in the public view', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'legacy-blockquote-view',
      contentTitle: 'Legacy blockquote',
      transition: 'publish',
      bodyModifier: legacyBlockquoteBody,
    });

    await page.goto(contentPath, { waitUntil: 'networkidle' });

    await expect(
      page.locator('blockquote').filter({ hasText: 'Legacy quote' }),
    ).toBeVisible();
  });
});
