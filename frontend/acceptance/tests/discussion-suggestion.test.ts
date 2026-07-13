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
}: {
  bodyText: string;
  commentText: string;
}) {
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
              isResolved: false,
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
      blocks_layout: {
        items: ['__somersault__'],
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

  test('renders persisted discussions read-only in view mode', async ({
    page,
  }) => {
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

    await expect(discussionDialog.getByText('Reply...')).toBeHidden();
    await expect(discussionDialog.getByText('Edit comment')).toBeHidden();
    await expect(discussionDialog.getByText('Delete comment')).toBeHidden();

    await page.mouse.click(20, 20);
    await expect(discussionDialog).toBeHidden();
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
