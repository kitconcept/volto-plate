import { expect, type Page } from '@playwright/test';
import { getEditorHandle } from '@platejs/playwright';

import { createWikiPage } from '../tests/content';
import { waitForPlateEditorReady } from '../tests/plate';
import { editable } from './editor';
import { nativeBlockSections, type NativeBlockSection } from './native-blocks';

type CreatePageOptions = {
  /** Page title, also rendered by the title block. */
  title?: string;
  /** Extra Plate nodes appended after the requested sections. */
  extra?: Record<string, unknown>[];
  /** Start the value with the title block (default). */
  withTitle?: boolean;
};

/**
 * Creates one published wiki page whose somersault value contains the title
 * block (unless `withTitle` is false) followed by the requested fixture
 * sections, in order. Returns the page path.
 *
 * The backend is reset around every test, so each test creates exactly the
 * page it needs through the REST API instead of relying on a shared site.
 */
export async function createNativeBlocksPage(
  page: Page,
  sections: NativeBlockSection[],
  {
    title = 'Native blocks',
    extra = [],
    withTitle = true,
  }: CreatePageOptions = {},
) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const contentId = `native-blocks-${suffix}`;

  const { contentPath } = await createWikiPage(page, {
    contentId,
    contentTitle: title,
    transition: 'publish',
    bodyModifier: (body) => ({
      ...body,
      // Keep the type's default blocks: `blocks_layout` refers to them and
      // the edit form fails to save without them.
      blocks: {
        ...((body.blocks as Record<string, unknown> | undefined) ?? {}),
        __somersault__: {
          '@type': '__somersault__',
          value: [
            ...(withTitle
              ? [{ type: 'title', children: [{ text: title }] }]
              : []),
            ...sections.flatMap((section) => nativeBlockSections[section]),
            ...extra,
          ],
        },
      },
    }),
  });

  return contentPath;
}

/**
 * Opens the page in the editor and returns the editor handle, once Plate is
 * ready and the editor has run its initial focus (it moves the caret to the
 * start of the document, which would otherwise race with the test's own
 * selection).
 */
export async function openInEditor(page: Page, contentPath: string) {
  await page.goto(`${contentPath}/edit`, { waitUntil: 'networkidle' });
  await waitForPlateEditorReady(page);
  const editorHandle = await getEditorHandle(page, editable(page));

  await expect
    .poll(() =>
      page.evaluate((editor) => editor.selection !== null, editorHandle),
    )
    .toBe(true);

  return editorHandle;
}

/** Opens the public view of the page. */
export async function openInView(page: Page, contentPath: string) {
  await page.goto(contentPath, { waitUntil: 'networkidle' });
  const content = page.locator('.typeset').first();
  await expect(content).toBeVisible();

  return content;
}

/** Saves the open edit form and waits for the view it redirects to. */
export async function savePage(page: Page, contentPath: string) {
  await page.locator('#toolbar-save').click();
  await page.waitForURL(contentPath, { waitUntil: 'load' });
}

/** Reads the somersault value of a page straight from the REST API. */
export async function getStoredValue(page: Page, contentPath: string) {
  const hostname = process.env.BACKEND_HOST || '127.0.0.1';
  const siteId = process.env.SITE_ID || 'plone';
  const apiURL = process.env.API_PATH || `http://${hostname}:55001/${siteId}`;
  const response = await page.request.get(`${apiURL}${contentPath}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
    },
  });
  const content = await response.json();

  return content.blocks.__somersault__.value as Record<string, unknown>[];
}
