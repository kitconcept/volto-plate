import { createWikiPage } from './content';
import { login } from './login';
import { expect, test } from './test';
import { editable, focusBlockEnd } from '../fixtures/editor';
import {
  getStoredContent,
  openInEditor,
  openInView,
  savePage,
} from '../fixtures/pages';

// Content stored before the page body became the `main` region keeps the
// Plate document in a `__somersault__` block, sometimes listed in
// `blocks_layout`, until the backend upgrade step renames it. The add-on
// still reads it, and the first save stores it as `main`, see
// https://github.com/plone/aurora/issues/379.
function withLegacySomersaultBody(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title : '';

  return {
    ...body,
    blocks: {
      ...((body.blocks as Record<string, unknown> | undefined) ?? {}),
      __somersault__: {
        '@type': '__somersault__',
        value: [
          { type: 'title', children: [{ text: title }] },
          {
            type: 'p',
            children: [
              { text: 'Discuss', comment_discussion1: true, comment: true },
              { text: ' the legacy body' },
            ],
          },
        ],
        discussions: {
          discussion1: {
            id: 'discussion1',
            comments: [
              {
                id: 'comment1',
                contentRich: [
                  { type: 'p', children: [{ text: 'Legacy comment' }] },
                ],
                createdAt: '2026-04-17T09:00:00+00:00',
                discussionId: 'discussion1',
                isEdited: false,
                userId: 'admin',
              },
            ],
            createdAt: '2026-04-17T09:00:00+00:00',
            documentContent: 'Discuss',
            isResolved: false,
            userId: 'admin',
          },
        },
        users: { admin: { id: 'admin', fullname: 'Admin' } },
      },
    },
    blocks_layout: {
      items: [
        ...((body.blocks_layout as { items?: string[] } | undefined)?.items ??
          []),
        '__somersault__',
      ],
    },
  };
}

test.describe('Legacy __somersault__ content', () => {
  test('is read, and the first save stores it as the main region', async ({
    page,
  }) => {
    await login(page);
    const { contentPath } = await createWikiPage(page, {
      contentId: 'legacy-somersault',
      contentTitle: 'Legacy somersault',
      transition: 'publish',
      bodyModifier: withLegacySomersaultBody,
    });

    const view = await openInView(page, contentPath);
    await expect(view).toContainText('Discuss the legacy body');

    const editorHandle = await openInEditor(page, contentPath);
    await expect(editable(page)).toContainText('Discuss the legacy body');

    await focusBlockEnd(page, editorHandle, 1);
    await page.keyboard.type(' was migrated');
    await savePage(page, contentPath);

    const stored = await getStoredContent(page, contentPath);
    expect(stored.blocks).not.toHaveProperty('__somersault__');
    expect(stored.blocks_layout?.items ?? []).not.toContain('__somersault__');
    expect(stored.blocks.main['@type']).toBe('plate');
    expect(JSON.stringify(stored.blocks.main.value)).toContain(
      ' the legacy body was migrated',
    );
    expect(stored.blocks.main.discussions).toHaveProperty('discussion1');

    const migratedView = await openInView(page, contentPath);
    await expect(migratedView).toContainText(
      'Discuss the legacy body was migrated',
    );
  });
});
