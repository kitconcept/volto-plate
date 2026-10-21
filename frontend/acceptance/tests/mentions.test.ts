import { getEditorHandle, setSelection } from '@platejs/playwright';
import type { APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createNativeBlocksPage } from '../fixtures/pages';
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

async function createMentionableUser(
  request: APIRequestContext,
  {
    username,
    fullname,
    portrait,
  }: {
    username: string;
    fullname: string;
    portrait?: string;
  },
) {
  const response = await request.post(`${apiURL}/@users`, {
    data: {
      email: `${username}@example.com`,
      password: 'secret123',
      username,
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
      `Unable to create user ${username}: ${response.status()} ${await response.text()}`,
    );
  }

  const update = await request.patch(`${apiURL}/@users/${username}`, {
    data: {
      fullname,
      ...(portrait && {
        portrait: {
          'content-type': 'image/png',
          filename: path.basename(portrait),
          encoding: 'base64',
          data: readFileSync(portrait).toString('base64'),
        },
      }),
    },
    headers: {
      Accept: 'application/json',
      Authorization: adminAuth,
      'Content-Type': 'application/json',
    },
  });
  if (!update.ok()) {
    throw new Error(`Unable to update user ${username}: ${update.status()}`);
  }
}

const USER_KEYS_BY_FULLNAME: Record<string, string> = {
  'Mention Second': 'mention-second',
  'Mention Target': 'mention-target',
};

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
    await createMentionableUser(request, {
      fullname: 'Mention Target',
      username: 'mention-target',
      portrait: path.join(__dirname, '../fixtures/mention-portrait.png'),
    });
    await createMentionableUser(request, {
      fullname: 'Mention Second',
      username: 'mention-second',
    });
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

  test('selects a mention while composing a new comment', async ({ page }) => {
    const { contentPath } = await createWikiPage(page, {
      bodyModifier: withSomersaultBody('Some paragraph text'),
      contentId: 'new-comment-mention',
      contentTitle: 'New comment mention',
      transition: 'publish',
      wikiId: 'wiki-new-comment-mention',
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const editorHandle = await getEditorHandle(page, editor);
    await setSelection(page, editorHandle, {
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 4, path: [1, 0] },
    });

    const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
    await expect(toolbar).toBeVisible();
    const finalGroup = toolbar.locator(':scope > div').nth(2);
    await finalGroup.locator('button').nth(0).click();

    const commentDialog = page.getByRole('dialog');
    const commentInput = commentDialog.getByRole('textbox');
    await commentInput.click();

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
      commentInput.getByText('Mention Target', { exact: true }),
    ).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
  });

  test('selects the second match with arrow keys and Enter in the document editor', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      bodyModifier: withSomersaultBody(''),
      contentId: 'keyboard-mention',
      contentTitle: 'Keyboard mention',
      transition: 'publish',
      wikiId: 'wiki-keyboard-mention',
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
    const searchRequest = page.waitForRequest(
      (value) =>
        value.url().includes('/@mentions') &&
        value.url().includes('search=Mention'),
    );
    await page.keyboard.type('Mention');
    await searchRequest;

    const options = page.getByRole('option');
    await expect(options).toHaveCount(2);

    const optionTexts = await options.allTextContents();
    const secondFullname = optionTexts[1];
    const expectedKey = USER_KEYS_BY_FULLNAME[secondFullname];
    expect(expectedKey).toBeDefined();

    // Arrow down from the first match to the second, then confirm with
    // Enter instead of clicking.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

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
        key: expectedKey,
        type: 'mention',
        value: secondFullname,
      });
  });

  test('selects the second match with arrow keys and Enter while composing a new comment', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      bodyModifier: withSomersaultBody('Some paragraph text'),
      contentId: 'keyboard-comment-mention',
      contentTitle: 'Keyboard comment mention',
      transition: 'publish',
      wikiId: 'wiki-keyboard-comment-mention',
    });

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);

    const editor = page.locator('.slate-editor[data-slate-editor]');
    const editorHandle = await getEditorHandle(page, editor);
    await setSelection(page, editorHandle, {
      anchor: { offset: 0, path: [1, 0] },
      focus: { offset: 4, path: [1, 0] },
    });

    const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
    await expect(toolbar).toBeVisible();
    const finalGroup = toolbar.locator(':scope > div').nth(2);
    await finalGroup.locator('button').nth(0).click();

    const commentDialog = page.getByRole('dialog');
    const commentInput = commentDialog.getByRole('textbox');
    await commentInput.click();

    await page.keyboard.type('@');
    const searchRequest = page.waitForRequest(
      (value) =>
        value.url().includes('/@mentions') &&
        value.url().includes('search=Mention'),
    );
    await page.keyboard.type('Mention');
    await searchRequest;

    const options = page.getByRole('option');
    await expect(options).toHaveCount(2);
    const optionTexts = await options.allTextContents();
    const secondFullname = optionTexts[1];

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(
      commentInput.getByText(secondFullname, { exact: true }),
    ).toBeVisible();
    // Wait for the mention combobox to fully close before submitting, so the
    // Enter below is not swallowed by the still-closing combobox.
    await expect(page.getByRole('listbox')).toBeHidden();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
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

  test('loads mention portraits for anonymous visitors', async ({ page }) => {
    const contentPath = await createNativeBlocksPage(page, [], {
      title: 'Anonymous mention portrait',
      extra: [
        {
          type: 'p',
          children: [
            { text: 'Hello ' },
            {
              type: 'mention',
              key: 'mention-target',
              mentionId: 'anonymous-portrait',
              value: 'Mention Target',
              children: [{ text: '' }],
            },
            { text: '!' },
          ],
        },
      ],
    });

    await page.context().clearCookies();
    await page.goto(contentPath);
    await expect(
      page.getByRole('link', { name: 'login', exact: true }),
    ).toBeVisible();

    const portrait = page.locator(
      '#plate-mention-anonymous-portrait img.person-pill-portrait',
    );
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute('src', /\/@portrait\//);
    await expect
      .poll(() =>
        portrait.evaluate((image: HTMLImageElement) => {
          const url = new URL(image.src);
          return (
            url.origin === window.location.origin &&
            image.complete &&
            image.naturalWidth > 0
          );
        }),
      )
      .toBe(true);
  });
});
