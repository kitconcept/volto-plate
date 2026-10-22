import type { Page } from '@playwright/test';
import { getEditorHandle, setSelection } from '@platejs/playwright';

import { createWikiPage } from './content';
import { withSomersaultBody } from './helpers';
import { login } from './login';
import { waitForPlateEditorReady } from './plate';
import { expect, test } from './test';

function withSomersaultDiscussionFixture({
  bodyText,
  commentText,
  isResolved = false,
}: {
  bodyText: string;
  commentText: string;
  isResolved?: boolean;
}) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';
    const existingBlocks =
      typeof body.blocks === 'object' && body.blocks !== null
        ? (body.blocks as Record<string, unknown>)
        : {};

    return {
      ...body,
      blocks: {
        ...existingBlocks,
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            {
              type: 'p',
              children: [
                { text: 'Discuss', comment_discussion1: true, comment: true },
                { text: bodyText.slice('Discuss'.length) },
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
                    {
                      type: 'p',
                      children: [{ text: commentText }],
                    },
                  ],
                  createdAt: '2026-04-17T09:00:00+00:00',
                  discussionId: 'discussion1',
                  isEdited: false,
                  userId: 'admin',
                },
              ],
              createdAt: '2026-04-17T09:00:00+00:00',
              documentContent: 'Discuss',
              isResolved,
              userId: 'admin',
            },
          },
          users: {
            admin: {
              id: 'admin',
              fullname: 'Admin',
            },
          },
        },
      },
    };
  };
}

function withLongSomersaultBody(targetText: string) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';
    const existingBlocks =
      typeof body.blocks === 'object' && body.blocks !== null
        ? (body.blocks as Record<string, unknown>)
        : {};
    const filler = Array.from({ length: 35 }, (_, index) => ({
      id: `selection-filler-before-${index}`,
      type: 'p',
      children: [
        {
          text: `Filler paragraph ${index + 1}: enough content to exercise scrolling while a comment is saved.`,
        },
      ],
    }));

    return {
      ...body,
      blocks: {
        ...existingBlocks,
        __somersault__: {
          '@type': '__somersault__',
          value: [
            {
              id: 'selection-title',
              type: 'title',
              children: [{ text: title }],
            },
            ...filler,
            {
              '@type': 'plateimage',
              alt: 'Selection regression image',
              children: [{ text: '' }],
              id: 'selection-void-image',
              type: 'ploneBlock',
              url: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
            },
            {
              id: 'selection-target',
              type: 'p',
              children: [
                { text: 'Select ' },
                { text: targetText, bold: true },
                { text: ' and keep the page here.' },
              ],
            },
            ...Array.from({ length: 5 }, (_, index) => ({
              id: `selection-filler-after-${index}`,
              type: 'p',
              children: [
                {
                  text: `Trailing paragraph ${index + 1}: content below the selected word.`,
                },
              ],
            })),
          ],
        },
      },
    };
  };
}

type DiscussionThreadFixture = {
  id: string;
  markText: string;
  restText: string;
  comments: { id: string; text: string; userId: string }[];
};

// One paragraph per thread, each with its own comment mark, so every
// thread gets its own discussion trigger.
function withSomersaultThreadsFixture(threads: DiscussionThreadFixture[]) {
  return (body: Record<string, unknown>) => {
    const title = typeof body.title === 'string' ? body.title : '';
    const existingBlocks =
      typeof body.blocks === 'object' && body.blocks !== null
        ? (body.blocks as Record<string, unknown>)
        : {};

    return {
      ...body,
      blocks: {
        ...existingBlocks,
        __somersault__: {
          '@type': '__somersault__',
          value: [
            { type: 'title', children: [{ text: title }] },
            ...threads.map((thread) => ({
              type: 'p',
              children: [
                {
                  text: thread.markText,
                  comment: true,
                  [`comment_${thread.id}`]: true,
                },
                { text: thread.restText },
              ],
            })),
          ],
          discussions: Object.fromEntries(
            threads.map((thread) => [
              thread.id,
              {
                id: thread.id,
                comments: thread.comments.map((comment) => ({
                  id: comment.id,
                  contentRich: [
                    { type: 'p', children: [{ text: comment.text }] },
                  ],
                  createdAt: '2026-04-17T09:00:00+00:00',
                  discussionId: thread.id,
                  isEdited: false,
                  userId: comment.userId,
                })),
                createdAt: '2026-04-17T09:00:00+00:00',
                documentContent: thread.markText,
                isResolved: false,
                userId: thread.comments[0]?.userId ?? 'admin',
              },
            ]),
          ),
          users: {
            admin: { id: 'admin', fullname: 'Admin' },
            alok: { id: 'alok', fullname: 'Alok' },
          },
        },
      },
    };
  };
}

function withSomersaultSuggestionFixture({
  bodyText,
  originalText,
  replacementText,
  includeUsers = true,
}: {
  bodyText: string;
  originalText: string;
  replacementText: string;
  includeUsers?: boolean;
}) {
  const suggestionId = 'suggestion1';
  const suffix = bodyText.slice(originalText.length);

  return (body: Record<string, unknown>) => {
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
                {
                  text: originalText,
                  suggestion: true,
                  [`suggestion_${suggestionId}`]: {
                    createdAt: 1760691600000,
                    id: suggestionId,
                    type: 'remove',
                    userId: 'admin',
                  },
                },
                {
                  text: replacementText,
                  suggestion: true,
                  [`suggestion_${suggestionId}`]: {
                    createdAt: 1760691600000,
                    id: suggestionId,
                    type: 'insert',
                    userId: 'admin',
                  },
                },
                { text: suffix },
              ],
            },
          ],
          discussions: {
            [suggestionId]: {
              id: suggestionId,
              comments: [],
              createdAt: '2026-04-17T09:00:00+00:00',
              isResolved: false,
              userId: 'admin',
            },
          },
          ...(includeUsers
            ? {
                users: {
                  admin: {
                    id: 'admin',
                    fullname: 'Admin',
                  },
                },
              }
            : {}),
        },
      },
      blocks_layout: {
        items: ['__somersault__'],
      },
    };
  };
}

// A paragraph with two distinct suggestions: an insertion first, a deletion
// second. Used to assert that clicking a mark opens the popover for the mark
// that was clicked (not just the first suggestion in the paragraph).
function withTwoSuggestionsFixture(body: Record<string, unknown>) {
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
              { text: 'Nach dem Absenden wird Ihr Antrag ' },
              {
                text: 'in der Regel ',
                suggestion: true,
                suggestion_insertion: {
                  createdAt: 1760691600000,
                  id: 'insertion',
                  type: 'insert',
                  userId: 'admin',
                },
              },
              { text: 'geprüft und genehmigt' },
              {
                text: ' per Hauspost',
                suggestion: true,
                suggestion_deletion: {
                  createdAt: 1760695200000,
                  id: 'deletion',
                  type: 'remove',
                  userId: 'admin',
                },
              },
              { text: '.' },
            ],
          },
        ],
        discussions: {
          insertion: {
            id: 'insertion',
            comments: [],
            createdAt: '2026-04-17T09:00:00+00:00',
            isResolved: false,
            userId: 'admin',
          },
          deletion: {
            id: 'deletion',
            comments: [],
            createdAt: '2026-04-17T10:00:00+00:00',
            isResolved: false,
            userId: 'admin',
          },
        },
        users: {
          admin: { id: 'admin', fullname: 'Admin' },
        },
      },
    },
    blocks_layout: {
      items: ['__somersault__'],
    },
  };
}

async function openWikiPageEditor(
  page: Page,
  {
    contentId,
    contentTitle,
    bodyModifier,
    wikiId = `wiki-${contentId}`,
  }: {
    contentId: string;
    contentTitle: string;
    bodyModifier: (body: Record<string, unknown>) => Record<string, unknown>;
    wikiId?: string;
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

  return { contentPath };
}

async function selectParagraphText(
  page: Page,
  textRange: { start: number; end: number },
) {
  const editable = page.locator('.slate-editor[data-slate-editor]');
  const editorHandle = await getEditorHandle(page, editable);

  await setSelection(page, editorHandle, {
    anchor: { path: [1, 0], offset: textRange.start },
    focus: { path: [1, 0], offset: textRange.end },
  });

  await expect(
    page.getByRole('toolbar', { name: 'Editor toolbar' }),
  ).toBeVisible();
}

async function enableSuggestionMode(page: Page) {
  const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
  const groups = toolbar.locator(':scope > div');
  const finalGroup = groups.nth(2);

  await finalGroup.locator('button').nth(1).click();
}

// The comment actions menu only shows while hovering one's own comment.
async function deleteComment(page: Page, commentText: string) {
  const dialog = page.getByRole('dialog');

  await dialog.getByText(commentText).hover();
  await dialog.locator('button:has(svg.lucide-ellipsis)').click();
  await page.getByRole('menuitem', { name: 'Delete comment' }).click();
}

test.describe('Plate discussions and suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('hydrates persisted discussions from the somersault block', async ({
    page,
  }) => {
    const commentText = 'Stored comment from acceptance test';
    await openWikiPageEditor(page, {
      contentId: 'discussion-hydration',
      contentTitle: 'Discussion hydration',
      bodyModifier: withSomersaultDiscussionFixture({
        bodyText: 'Discuss this paragraph',
        commentText,
      }),
    });

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await page.getByRole('button', { name: '1' }).click();
    await expect(page.getByText(commentText)).toBeVisible();
  });

  test('renders persisted discussions with comment actions in view mode', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const commentText = 'Rendered comment from acceptance test';
    const { contentPath } = await createWikiPage(page, {
      contentId: 'discussion-renderer',
      contentTitle: 'Discussion renderer',
      wikiId: 'wiki-discussion-renderer',
      transition: 'publish',
      bodyModifier: withSomersaultDiscussionFixture({
        bodyText: 'Discuss this rendered paragraph',
        commentText,
      }),
    });

    await page.setViewportSize({ height: 768, width: 1024 });
    await page.goto(contentPath, { waitUntil: 'networkidle' });
    const commentMark = page.getByText('Discuss', { exact: true }).first();
    const discussionButton = page.getByRole('button', { name: '1' });

    await expect(commentMark).toBeVisible();
    await expect(discussionButton).toBeVisible();

    const markBox = await commentMark.boundingBox();
    const buttonBox = await discussionButton.boundingBox();

    await page.evaluate(() => {
      const testWindow = window as Window & {
        __discussionPopoverFrames?: { width: number; x: number }[];
      };

      testWindow.__discussionPopoverFrames = [];

      let frameCount = 0;
      const recordDialogFrame = () => {
        const dialog = document.querySelector('[role="dialog"]');

        if (dialog) {
          const rect = dialog.getBoundingClientRect();
          testWindow.__discussionPopoverFrames?.push({
            width: rect.width,
            x: rect.x,
          });
          frameCount += 1;
        }

        if (frameCount < 8) {
          window.requestAnimationFrame(recordDialogFrame);
        }
      };

      window.requestAnimationFrame(recordDialogFrame);
    });

    await commentMark.click();

    const discussionDialog = page.getByRole('dialog');
    await expect(discussionDialog.getByText(commentText)).toBeVisible();
    await page.waitForFunction(
      () =>
        (
          window as Window & {
            __discussionPopoverFrames?: { width: number; x: number }[];
          }
        ).__discussionPopoverFrames?.length,
    );
    await expect(
      discussionDialog.getByRole('heading', { name: 'Comments (1)' }),
    ).toBeVisible();
    await expect(discussionDialog).toHaveCSS('border-radius', '14px');
    await expect(discussionButton).toHaveCSS('border-top-width', '0px');
    const dialogBox = await discussionDialog.boundingBox();
    const toolbarBox = await page.locator('#toolbar').boundingBox();

    expect(markBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(toolbarBox).not.toBeNull();
    expect(buttonBox!.height).toBeGreaterThanOrEqual(20);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(markBox!.y);
    expect(dialogBox!.x).toBeGreaterThanOrEqual(
      toolbarBox!.x + toolbarBox!.width,
    );

    const dialogCenter = dialogBox!.x + dialogBox!.width / 2;
    const markCenter = markBox!.x + markBox!.width / 2;
    const buttonCenter = buttonBox!.x + buttonBox!.width / 2;
    const [firstDialogFrame] = await page.evaluate(
      () =>
        (
          window as Window & {
            __discussionPopoverFrames?: { width: number; x: number }[];
          }
        ).__discussionPopoverFrames ?? [],
    );

    expect(firstDialogFrame).toBeDefined();

    const firstDialogCenter = firstDialogFrame.x + firstDialogFrame.width / 2;

    expect(Math.abs(firstDialogCenter - markCenter)).toBeLessThan(
      Math.abs(firstDialogCenter - buttonCenter),
    );

    expect(Math.abs(dialogCenter - markCenter)).toBeLessThan(
      Math.abs(dialogCenter - buttonCenter),
    );

    await expect(
      discussionDialog.getByText('Reply to thread...'),
    ).toBeVisible();
    await expect(
      discussionDialog.getByRole('button', { name: 'Resolve' }),
    ).toBeVisible();

    const replyEditor = discussionDialog.getByRole('textbox').last();
    await replyEditor.click();
    await page.keyboard.type('Reply saved from view mode');
    await page.keyboard.press('Enter');
    await expect(
      discussionDialog.getByText('Reply saved from view mode'),
    ).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-comment-id="discussion1"]').click();
    await expect(
      page.getByRole('dialog').getByText('Reply saved from view mode'),
    ).toBeVisible();

    await page.mouse.click(20, 20);
    await expect(discussionDialog).toBeHidden();
  });

  test('creates and persists a rich comment from a view-mode selection', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const bodyText = 'View mode selection target';
    const { contentPath } = await createWikiPage(page, {
      contentId: 'view-comment-create',
      contentTitle: 'View comment create',
      wikiId: 'wiki-view-comment-create',
      transition: 'publish',
      bodyModifier: withSomersaultBody(bodyText),
    });

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    const target = page.getByText(bodyText, { exact: true });
    await expect(target).toBeVisible();
    await target.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe(bodyText);

    await page
      .getByRole('button', { name: 'Comment on selected text' })
      .click();
    const composer = page.locator('[data-inline-comment-composer]');
    await expect(
      composer.getByText('Add comment', { exact: true }),
    ).toHaveCount(0);
    const commentEditor = composer.getByRole('textbox');
    await commentEditor.click();
    await page.keyboard.type('Created without opening edit mode');
    await page.keyboard.press('Enter');

    await expect(composer).toBeHidden();
    await expect(page.locator('[data-comment-id]').first()).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-comment-id]').first().click();
    await expect(
      page.getByRole('dialog').getByText('Created without opening edit mode'),
    ).toBeVisible();
  });

  test('comments a single mouse-selected word without losing scroll position', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const targetText = 'singleword';
    const { contentPath } = await createWikiPage(page, {
      contentId: 'view-comment-single-word',
      contentTitle: 'View comment single word',
      wikiId: 'wiki-view-comment-single-word',
      transition: 'publish',
      bodyModifier: withLongSomersaultBody(targetText),
    });

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    const target = page.getByText(targetText, { exact: true });
    await target.scrollIntoViewIfNeeded();
    await target.dblclick();
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe(targetText);

    await page
      .getByRole('button', { name: 'Comment on selected text' })
      .click();
    const composer = page.locator('[data-inline-comment-composer]');
    const commentEditor = composer.getByRole('textbox');
    await commentEditor.click();
    await page.keyboard.type('Single word comment');
    const scrollBeforeSave = await page.evaluate(() => window.scrollY);
    expect(scrollBeforeSave).toBeGreaterThan(0);
    await page.keyboard.press('Enter');

    await expect(composer).toBeHidden();
    await expect(page.locator('[data-comment-id]').first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(scrollBeforeSave);
  });

  test('anchors the comment action to the first fragment of a multiline selection', async ({
    page,
  }) => {
    const bodyText = `${'Selection geometry needs enough text to wrap naturally. '.repeat(8)}`;
    const { contentPath } = await createWikiPage(page, {
      contentId: 'view-comment-multiline-position',
      contentTitle: 'View comment multiline position',
      wikiId: 'wiki-view-comment-multiline-position',
      transition: 'publish',
      bodyModifier: withSomersaultBody(bodyText),
    });

    await page.setViewportSize({ height: 768, width: 1024 });
    await page.goto(contentPath, { waitUntil: 'networkidle' });
    const target = page.getByText(bodyText, { exact: true });
    const selectionRects = await target.evaluate((element) => {
      const textNode = element.firstChild;
      if (!(textNode instanceof Text)) {
        throw new Error('Expected the paragraph to contain a text node');
      }

      const range = document.createRange();
      range.setStart(textNode, 24);
      range.setEnd(textNode, 260);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));

      const firstRect = range.getClientRects()[0];
      const boundingRect = range.getBoundingClientRect();
      return {
        boundingLeft: boundingRect.left,
        firstLeft: firstRect.left,
      };
    });

    const commentAction = page.getByRole('button', {
      name: 'Comment on selected text',
    });
    await expect(commentAction).toBeVisible();
    const actionBox = await commentAction.boundingBox();

    expect(actionBox).not.toBeNull();
    expect(selectionRects.firstLeft - selectionRects.boundingLeft).toBeGreaterThan(
      20,
    );
    expect(Math.abs(actionBox!.x - selectionRects.firstLeft)).toBeLessThan(2);
  });

  test('does not offer view-mode commenting while the document is locked', async ({
    page,
  }) => {
    const bodyText = 'Locked selection target';
    const { contentPath } = await createWikiPage(page, {
      contentId: 'view-comment-locked',
      contentTitle: 'View comment locked',
      wikiId: 'wiki-view-comment-locked',
      transition: 'publish',
      bodyModifier: withSomersaultBody(bodyText),
    });
    const hostname = process.env.BACKEND_HOST || '127.0.0.1';
    const siteId = process.env.SITE_ID || 'plone';
    const apiURL = process.env.API_PATH || `http://${hostname}:55001/${siteId}`;
    const lockResponse = await page.request.post(
      `${apiURL}${contentPath}/@lock`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
        },
      },
    );
    expect(lockResponse.ok()).toBe(true);

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    const target = page.getByText(bodyText, { exact: true });
    await target.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    await expect(
      page.getByRole('button', { name: 'Comment on selected text' }),
    ).toHaveCount(0);
    const lockNotice = page.locator('[data-inline-comment-lock]');
    await expect(lockNotice).toBeVisible();
    const [selectionBox, lockNoticeBox] = await Promise.all([
      target.boundingBox(),
      lockNotice.boundingBox(),
    ]);
    expect(lockNoticeBox).not.toBeNull();
    expect(selectionBox).not.toBeNull();
    expect(lockNoticeBox!.y + lockNoticeBox!.height).toBeLessThan(
      selectionBox!.y,
    );
    await expect(lockNotice).toContainText('admin is editing this page');
    await expect(lockNotice).toContainText(
      'Inline comments are unavailable while this page is being edited.',
    );
    await expect(lockNotice).toContainText('Locked since');
  });

  test('resolving a discussion archives it and reopening restores it', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const commentText = 'Please raise the deadline';
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'discussion-resolve',
      contentTitle: 'Discussion resolve',
      bodyModifier: withSomersaultDiscussionFixture({
        bodyText: 'Discuss this paragraph',
        commentText,
      }),
    });
    const commentMark = page.locator('[data-comment-id="discussion1"]');
    const dialog = page.getByRole('dialog');

    // Clicking a mark doesn't open the popover in edit mode, use the trigger
    await page.getByRole('button', { name: '1' }).click();
    await expect(dialog.getByText(commentText)).toBeVisible();
    await dialog.getByRole('button', { name: 'Resolve' }).click();

    // The thread stays reachable: banner instead of deletion, mark kept
    await expect(dialog.getByText('Resolved by Admin')).toBeVisible();
    await expect(dialog.getByText(commentText)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Reopen' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Resolve' })).toBeHidden();
    await expect(dialog.getByText('Reply...')).toBeHidden();
    await expect(commentMark).toHaveAttribute('data-comment-resolved', 'true');

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await page.locator('#toolbar-save').click();
    await page.waitForURL(contentPath, { waitUntil: 'load', timeout: 30_000 });

    // Persisted in view mode, where the thread can be reopened directly.
    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await page.locator('[data-comment-id="discussion1"]').click();
    await expect(dialog.getByText('Resolved by Admin')).toBeVisible();
    await expect(dialog.getByText(commentText)).toBeVisible();
    await dialog.getByRole('button', { name: 'Reopen' }).click();
    await expect(dialog.getByText('Resolved by Admin')).toBeHidden();
    await expect(dialog.getByRole('button', { name: 'Resolve' })).toBeVisible();

    await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
    await waitForPlateEditorReady(page);
    await page.getByRole('button', { name: '1' }).click();
    await expect(dialog.getByText('Resolved by Admin')).toBeHidden();
    await expect(dialog.getByRole('button', { name: 'Resolve' })).toBeVisible();
    await expect(commentMark).not.toHaveAttribute('data-comment-resolved');
  });

  test('counts comments, updated when replying and deleting', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'discussion-count',
      contentTitle: 'Discussion count',
      bodyModifier: withSomersaultThreadsFixture([
        {
          id: 'discussion1',
          markText: 'Discuss',
          restText: ' this paragraph',
          comments: [
            { id: 'comment1', text: 'First comment', userId: 'admin' },
            { id: 'comment2', text: 'Reply from Alok', userId: 'alok' },
          ],
        },
      ]),
    });
    const dialog = page.getByRole('dialog');

    // One thread with two comments counts two, not one
    await page.getByRole('button', { name: '2' }).click();
    await expect(
      dialog.getByRole('heading', { name: 'Comments (2)' }),
    ).toBeVisible();

    await dialog
      .getByRole('textbox')
      .filter({ hasText: 'Reply to thread...' })
      .click();
    await page.keyboard.type('Another reply');
    await page.keyboard.press('Enter');
    await expect(dialog.getByText('Another reply')).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: 'Comments (3)' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '3' })).toBeVisible();

    await deleteComment(page, 'Another reply');
    await expect(dialog.getByText('Another reply')).toBeHidden();
    await expect(
      dialog.getByRole('heading', { name: 'Comments (2)' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '2' })).toBeVisible();

    // The view mode trigger counts comments too
    await page.locator('#toolbar-save').click();
    await page.waitForURL(contentPath, { waitUntil: 'load', timeout: 30_000 });
    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '2' }).click();
    await expect(
      dialog.getByRole('heading', { name: 'Comments (2)' }),
    ).toBeVisible();
  });

  test('deleting the only comment of a discussion removes it and keeps the others', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'discussion-delete',
      contentTitle: 'Discussion delete',
      bodyModifier: withSomersaultThreadsFixture([
        {
          id: 'discussionA',
          markText: 'First',
          restText: ' paragraph',
          comments: [{ id: 'commentA', text: 'Comment A', userId: 'admin' }],
        },
        {
          id: 'discussionB',
          markText: 'Second',
          restText: ' paragraph',
          comments: [{ id: 'commentB', text: 'Comment B', userId: 'admin' }],
        },
      ]),
    });
    const dialog = page.getByRole('dialog');
    const markA = page.locator('[data-comment-id="discussionA"]');
    const markB = page.locator('[data-comment-id="discussionB"]');
    const triggers = page.getByRole('button', { name: '1' });

    await expect(triggers).toHaveCount(2);
    await triggers.first().click();
    await deleteComment(page, 'Comment A');

    // The thread and its mark are gone, the other thread is untouched
    await expect(markA).toHaveCount(0);
    await expect(markB).toBeVisible();
    await expect(triggers).toHaveCount(1);

    // The backend accepts the save with one of two discussions removed
    await page.locator('#toolbar-save').click();
    await page.waitForURL(contentPath, { waitUntil: 'load', timeout: 30_000 });

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await expect(page.getByText('First paragraph')).toBeVisible();
    await expect(markA).toHaveCount(0);
    await expect(markB).toBeVisible();
    await triggers.click();
    await expect(dialog.getByText('Comment B')).toBeVisible();
    await expect(dialog.getByText('Comment A')).toBeHidden();
  });

  test('shows resolved discussions with a resolved trigger icon', async ({
    page,
  }) => {
    const commentText = 'Already handled';
    const { contentPath } = await createWikiPage(page, {
      contentId: 'discussion-resolved-view',
      contentTitle: 'Discussion resolved view',
      wikiId: 'wiki-discussion-resolved-view',
      transition: 'publish',
      bodyModifier: withSomersaultDiscussionFixture({
        bodyText: 'Discuss this rendered paragraph',
        commentText,
        isResolved: true,
      }),
    });

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    const trigger = page.getByRole('button', { name: '1' });
    await expect(trigger.locator('svg.lucide-circle-check')).toBeVisible();

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Resolved by Admin')).toBeVisible();
    await expect(dialog.getByText(commentText)).toBeVisible();
  });

  test('hydrates persisted suggestions in edit mode and renders them in view mode', async ({
    page,
  }) => {
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'suggestion-hydration',
      contentTitle: 'Suggestion hydration',
      bodyModifier: withSomersaultSuggestionFixture({
        bodyText: 'Change this paragraph',
        originalText: 'Change',
        replacementText: 'Update',
      }),
    });

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await expect(
      page.locator('del', { hasText: 'Change' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('ins', { hasText: 'Update' }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: '1' }).click();
    const suggestionDialog = page.getByRole('dialog');
    await expect(suggestionDialog.getByText('Replace:')).toBeVisible();
    await expect(
      suggestionDialog.getByText('Change', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Update', { exact: true }),
    ).toBeVisible();

    await page.goto(contentPath, { waitUntil: 'networkidle' });
    await expect(
      page.locator('ins', { hasText: 'Update' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('del', { hasText: 'Change' }).first(),
    ).toBeVisible();
  });

  test('creates suggestions from the toolbar flow', async ({ page }) => {
    await openWikiPageEditor(page, {
      contentId: 'suggestion-current-user',
      contentTitle: 'Suggestion current user',
      bodyModifier: withSomersaultSuggestionFixture({
        bodyText: 'Change this paragraph',
        originalText: '',
        replacementText: '',
      }),
    });

    await selectParagraphText(page, { start: 0, end: 6 });
    await enableSuggestionMode(page);
    await page.keyboard.type('Update');

    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
    await expect(
      page.locator('del', { hasText: 'Change' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('ins', { hasText: 'Update' }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: '1' }).click();
    const suggestionDialog = page.getByRole('dialog');
    await expect(
      suggestionDialog.getByText('admin', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Change', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Update', { exact: true }),
    ).toBeVisible();
  });

  test('renders persisted suggestions read-only in view mode', async ({
    page,
  }) => {
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'suggestion-renderer',
      contentTitle: 'Suggestion renderer',
      bodyModifier: withSomersaultSuggestionFixture({
        bodyText: 'Change this paragraph',
        originalText: 'Change',
        replacementText: 'Update',
      }),
    });

    await page.setViewportSize({ height: 768, width: 1024 });
    await page.goto(contentPath, { waitUntil: 'networkidle' });

    // Wait for the block to hydrate (the count button only renders once the
    // suggestion metadata is resolved) before asserting on the marks.
    const suggestionButton = page.getByRole('button', { name: '1' });
    await expect(suggestionButton).toBeVisible();

    // Inline marks render with the suggestion colours (green insert / red
    // delete), not the default brand/grey the static leaf used before.
    const insertion = page.locator('ins', { hasText: 'Update' }).first();
    const deletion = page.locator('del', { hasText: 'Change' }).first();
    await expect(insertion).toBeVisible();
    await expect(deletion).toBeVisible();
    await expect(insertion).toHaveCSS('color', 'rgb(49, 135, 34)');
    await expect(deletion).toHaveCSS('color', 'rgb(245, 78, 56)');

    // The suggestion popover is available in view mode.
    await suggestionButton.click();

    const suggestionDialog = page.getByRole('dialog');
    await expect(
      suggestionDialog.getByRole('heading', { name: 'Suggestions (1)' }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Change', { exact: true }),
    ).toBeVisible();
    await expect(
      suggestionDialog.getByText('Update', { exact: true }),
    ).toBeVisible();

    // Read-only: no accept/reject or reply controls.
    await expect(suggestionDialog.getByText('Accept')).toBeHidden();
    await expect(suggestionDialog.getByText('Reject')).toBeHidden();
    await expect(suggestionDialog.getByText('Reply...')).toBeHidden();
  });

  test('saving after creating a suggestion keeps the editor normalizable', async ({
    page,
  }) => {
    const { contentPath } = await openWikiPageEditor(page, {
      contentId: 'suggestion-save',
      contentTitle: 'Suggestion save',
      bodyModifier: withSomersaultBody('Change this paragraph'),
    });

    const editorErrors: string[] = [];
    page.on('pageerror', (error) => editorErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') editorErrors.push(message.text());
    });

    // Create a suggestion through the toolbar flow.
    await selectParagraphText(page, { start: 0, end: 6 });
    await enableSuggestionMode(page);
    await page.keyboard.type('Update');
    await expect(page.getByRole('button', { name: '1' })).toBeVisible();

    // Saving must not throw the Slate normalization invariant coming from the
    // title sync (volto-title.tsx) while suggestion marks are present.
    await page.locator('#toolbar-save').click();
    await page.waitForURL(contentPath, { waitUntil: 'load', timeout: 30_000 });
    await expect(
      page.getByRole('heading', { name: 'Suggestion save' }),
    ).toBeVisible();

    expect(editorErrors.join('\n')).not.toContain(
      'Could not completely normalize the editor',
    );
  });

  test('clicking an inline suggestion in view mode opens that suggestion', async ({
    page,
  }) => {
    const { contentPath } = await createWikiPage(page, {
      contentId: 'suggestion-click-target',
      contentTitle: 'Suggestion click target',
      wikiId: 'wiki-suggestion-click-target',
      transition: 'publish',
      bodyModifier: withTwoSuggestionsFixture,
    });

    await page.setViewportSize({ height: 768, width: 1024 });
    await page.goto(contentPath, { waitUntil: 'networkidle' });

    // Wait for hydration (count button appears once suggestions resolve).
    await expect(page.getByRole('button', { name: '2' })).toBeVisible();

    // Clicking the second suggestion (the deletion) must open the deletion
    // popover, not the first suggestion of the paragraph.
    await page.locator('del', { hasText: 'per Hauspost' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Suggested removing')).toBeVisible();
    await expect(dialog.getByText('per Hauspost')).toBeVisible();
    await expect(dialog.getByText('Suggested adding')).toBeHidden();

    // And clicking the first suggestion (the insertion) opens the insertion.
    await page.locator('ins', { hasText: 'in der Regel' }).first().click();
    await expect(dialog.getByText('Suggested adding')).toBeVisible();
    await expect(dialog.getByText('in der Regel')).toBeVisible();
    await expect(dialog.getByText('Suggested removing')).toBeHidden();
  });
});
