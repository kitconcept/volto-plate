import {
  createNativeBlocksPage,
  getStoredValue,
  openInEditor,
  savePage,
} from '../fixtures/pages';
import { editable } from '../fixtures/editor';
import { login } from './login';
import { expect, test } from './test';

test.describe.configure({ timeout: 30_000 });

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('My tasks lists open assigned tasks and follows source links', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, ['lists'], {
    title: 'Task source',
    extra: [
      {
        type: 'p',
        listStyleType: 'todo',
        checked: false,
        children: [
          { text: 'Dated task ' },
          { type: 'date', value: '2026-01-01', children: [{ text: '' }] },
        ],
      },
      {
        type: 'p',
        listStyleType: 'todo',
        checked: false,
        children: [
          { text: 'Someone else task ' },
          {
            type: 'mention',
            key: 'another-user',
            value: 'Another User',
            mentionId: 'other',
            children: [{ text: '' }],
          },
        ],
      },
    ],
  });
  await page.goto('/my-tasks');
  await expect(
    page.getByRole('heading', { name: 'My tasks', exact: true }),
  ).toBeVisible();
  const rows = page.locator('.my-tasks tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Dated task');
  await expect(rows.last()).toContainText('To-do pending');
  await expect(page.getByText('To-do done', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Someone else task', { exact: false }),
  ).toHaveCount(0);
  await expect(
    rows.first().getByRole('img', { name: 'Overdue' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'playwright/results/my-tasks-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    rows.first().getByRole('link', { name: 'Task source' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'playwright/results/my-tasks-mobile.png',
    fullPage: true,
  });
  const overflowing = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.my-tasks, .my-tasks *'))
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth)
      .map((el) => ({
        tag: el.tagName,
        className: el.className,
        right: el.getBoundingClientRect().right,
      })),
  );
  expect(overflowing).toEqual([]);
  await rows.first().getByRole('link', { name: 'Task source' }).click();
  await page.waitForURL(path);
});

test('Editor completion and reopening update My tasks while preserving identity', async ({
  page,
}) => {
  const path = await createNativeBlocksPage(page, ['lists']);
  const initial = await getStoredValue(page, path);
  const todo = initial.find(
    (node) => node.listStyleType === 'todo' && !node.checked,
  )!;
  expect(todo.taskId).toBeTruthy();
  await openInEditor(page, path);
  await editable(page).getByRole('checkbox').first().click();
  await savePage(page, path);
  const completed = (await getStoredValue(page, path)).find(
    (node) => node.taskId === todo.taskId,
  )!;
  expect(completed.checked).toBe(true);
  expect(completed.taskCompleted).toBeTruthy();
  await page.goto('/my-tasks');
  await expect(
    page.getByText('You have no open tasks.', { exact: true }),
  ).toBeVisible();
  await openInEditor(page, path);
  await editable(page).getByRole('checkbox').first().click();
  await savePage(page, path);
  await page.goto('/my-tasks');
  await expect(page.locator('.my-tasks tbody tr')).toHaveCount(1);
  await expect(page.locator('.my-tasks')).toContainText('To-do pending');
});

test('My tasks retries failed requests', async ({ page }) => {
  await page.route('**/*querystring-search*', (route) =>
    route.fulfill({ status: 500, body: '{}' }),
  );
  await page.goto('/my-tasks');
  await expect(page.locator('.my-tasks').getByRole('alert')).toContainText(
    'Unable to load tasks.',
  );
  await page.unroute('**/*querystring-search*');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(
    page.getByText('You have no open tasks.', { exact: true }),
  ).toBeVisible();
});

test('Personal tools links to My tasks without a toolbar shadow', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#toolbar-personal').click();
  await page.getByRole('link', { name: 'My tasks' }).click();
  await expect(page).toHaveURL(/\/my-tasks$/);
});

test('My tasks requires login', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/my-tasks');
  await expect(page).toHaveURL(/\/login\?return_url=%2Fmy-tasks$/);
});

test('My tasks batches long lists without dropping undated tasks', async ({
  page,
}) => {
  await createNativeBlocksPage(page, ['lists'], {
    extra: Array.from({ length: 25 }, (_, i) => ({
      type: 'p',
      listStyleType: 'todo',
      checked: false,
      children: [{ text: `Additional task ${i + 1}` }],
    })),
  });
  await page.goto('/my-tasks');
  await expect(page.locator('.my-tasks tbody tr')).toHaveCount(25);
  await expect(page.locator('.my-tasks-pagination')).toContainText('1-25 / 26');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('.my-tasks tbody tr')).toHaveCount(1);
  await expect(page.locator('.my-tasks-pagination')).toContainText(
    '26-26 / 26',
  );
  await page
    .getByRole('button', { name: 'Previous page', exact: true })
    .click();
  await expect(page.locator('.my-tasks tbody tr')).toHaveCount(25);
});
