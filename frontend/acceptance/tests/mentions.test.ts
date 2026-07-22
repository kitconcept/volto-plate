import { getEditorHandle, setSelection } from '@platejs/playwright';
import type { APIRequestContext } from '@playwright/test';

import { createWikiPage } from './content';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

const apiURL =
  process.env.API_PATH ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:55001/${
    process.env.SITE_ID || 'plone'
  }`;

const adminAuth = `Basic ${Buffer.from('admin:secret').toString('base64')}`;

async function createMentionableUser(request: APIRequestContext) {
  const response = await request.post(`${apiURL}/@users`, {
    data: {
      email: 'mention-target@example.com',
      password: 'secret123',
      username: 'mention-target',
    },
    headers: {
      Accept: 'application/json',
      Authorization: adminAuth,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok()) {
    throw new Error(
      `Unable to create mention target: ${response.status()} ${await response.text()}`,
    );
  }

  const update = await request.patch(`${apiURL}/@users/mention-target`, {
    data: { fullname: 'Mention Target' },
    headers: {
      Accept: 'application/json',
      Authorization: adminAuth,
      'Content-Type': 'application/json',
    },
  });
  if (!update.ok()) {
    throw new Error(`Unable to update mention target: ${update.status()}`);
  }
}

function withSomersaultBody(text: string) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';

    return {
      ...body,
      blocks: {
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            { type: 'p', children: [{ text }] },
          ],
        },
      },
      blocks_layout: { items: ['__somersault__'] },
    };
  };
}

function withCommentMention(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title : '';

  return {
    ...body,
    blocks: {
      __somersault__: {
        '@type': '__somersault__',
        value: [
          { type: 'title', children: [{ text: title }] },
          {
            type: 'p',
            children: [
              { text: 'Discuss', comment_discussion1: true, comment: true },
            ],
          },
        ],
        discussions: {
          discussion1: {
            comments: [
              {
                contentRich: [
                  {
                    type: 'p',
                    children: [
                      { text: 'Hello ' },
                      {
                        children: [{ text: '' }],
                        key: 'mention-target',
                        mentionId: 'comment-mention',
                        type: 'mention',
                        value: 'Mention Target',
                      },
                    ],
                  },
                ],
                createdAt: '2026-07-20T10:00:00+00:00',
                discussionId: 'discussion1',
                id: 'comment1',
                isEdited: false,
                userId: 'admin',
              },
            ],
            createdAt: '2026-07-20T10:00:00+00:00',
            id: 'discussion1',
            isResolved: false,
            userId: 'admin',
          },
        },
        users: { admin: { fullname: 'Admin', id: 'admin' } },
      },
    },
    blocks_layout: { items: ['__somersault__'] },
  };
}

test.describe('Plate mentions', () => {
  test.beforeEach(async ({ page, request }) => {
    await login(page);
    await createMentionableUser(request);
  });

  test('queries @mentions and inserts the selected user in document text', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      bodyModifier: withSomersaultBody(''),
      contentId: 'text-mention',
      contentTitle: 'Text mention',
      transition: 'publish',
      wikiId: 'wiki-text-mention',
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const editorHandle = await getEditorHandle(page, editor);
    await setSelection(page, editorHandle, {
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 0, path: [1, 0] },
    });

    await page.keyboard.type('@');

    await expect(
      page.getByText('Type to search people', { exact: true }),
    ).toBeVisible();

    const searchRequest = page.waitForRequest(
      (value) =>
        value.url().includes('/@mentions') &&
        value.url().includes('search=Mention'),
    );
    await page.keyboard.type('Mention');
    await searchRequest;

    await page.getByRole('option', { name: 'Mention Target' }).click();
    await expect(
      page.getByText('Mention Target', { exact: true }),
    ).toBeVisible();

    await expect
      .poll(async () =>
        editorHandle.evaluate((editor: any) => {
          const findMention = (node: any): any => {
            if (node?.type === 'mention') return node;
            if (!Array.isArray(node?.children)) return null;
            return node.children.map(findMention).find(Boolean) ?? null;
          };

          return findMention({ children: editor.children });
        }),
      )
      .toMatchObject({
        key: 'mention-target',
        mentionId: expect.any(String),
        type: 'mention',
        value: 'Mention Target',
      });

    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem(
            '@plone/plate:recent-mentions:http://localhost:3000:admin',
          ),
        ),
      )
      .toBe(JSON.stringify(['mention-target']));

    // Recent IDs are resolved individually by the backend; the endpoint
    // contract is covered by backend tests. This keeps the UI test focused on
    // browser-local persistence and rendering.
    await page.route(
      (url) =>
        url.pathname.endsWith('/@mentions') &&
        url.searchParams.get('id') === 'mention-target',
      async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          json: {
            items: [
              {
                fullname: 'Mention Target',
                id: 'mention-target',
                portrait: null,
              },
            ],
            items_total: 1,
          },
        });
      },
    );
    const recentRequest = page.waitForRequest(
      (value) =>
        value.url().includes('/@mentions') &&
        value.url().includes('id=mention-target'),
    );
    await page.keyboard.type(' @');
    await recentRequest;
    await expect(
      page.getByText('Recently mentioned', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'Mention Target' }),
    ).toBeVisible();
  });

  test('renders mentions inside persisted discussion comments', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      bodyModifier: withCommentMention,
      contentId: 'comment-mention',
      contentTitle: 'Comment mention',
      transition: 'publish',
      wikiId: 'wiki-comment-mention',
    });

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await page.getByText('Discuss', { exact: true }).click();

    const mention = page.locator('#plate-mention-comment-mention');
    await expect(mention).toBeVisible();
    await expect(mention).toContainText('Mention Target');
  });
});
