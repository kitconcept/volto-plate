import type { Page } from '@playwright/test';
import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';

type NavPages = {
  workspace: string;
  hr: string;
  benefits: string;
  review: string;
  itDept: string;
  hardware: string;
  vpn: string;
  finance: string;
  expense: string;
  budget: string;
};

async function createNavSidebarContent(
  page: Page,
): Promise<{ workspacePath: string; pages: NavPages }> {
  const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const workspaceId = `nav-workspace-${idSuffix}`;
  const hrId = `hr-${idSuffix}`;
  const itDeptId = `it-dept-${idSuffix}`;
  const financeId = `finance-${idSuffix}`;
  const benefitsId = `benefits-${idSuffix}`;
  const hardwareId = `hardware-${idSuffix}`;
  const expenseId = `expense-${idSuffix}`;
  const reviewId = `review-${idSuffix}`;
  const vpnId = `vpn-${idSuffix}`;
  const budgetId = `budget-${idSuffix}`;
  const workspacePath = `/${workspaceId}`;

  // Workspace root
  await createContent(page, {
    contentType: 'Workspace',
    contentId: workspaceId,
    contentTitle: 'Navigation Test Wiki',
    path: '',
    transition: 'publish',
  });

  // Level 1
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: hrId,
    contentTitle: 'Human Resources',
    path: workspaceId,
    transition: 'publish',
  });
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: itDeptId,
    contentTitle: 'Information Technology',
    path: workspaceId,
    transition: 'publish',
  });
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: financeId,
    contentTitle: 'Finance and Accounting',
    path: workspaceId,
    transition: 'publish',
  });

  // Level 2
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: benefitsId,
    contentTitle: 'Employee Benefits and Leave Policies',
    path: `${workspaceId}/${hrId}`,
    transition: 'publish',
  });
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: hardwareId,
    contentTitle: 'Request New Hardware or Software Access',
    path: `${workspaceId}/${itDeptId}`,
    transition: 'publish',
  });
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: expenseId,
    contentTitle: 'Expense Reimbursement Process',
    path: `${workspaceId}/${financeId}`,
    transition: 'publish',
  });

  // Level 3
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: reviewId,
    contentTitle: 'Annual Performance Review Guidelines',
    path: `${workspaceId}/${hrId}/${benefitsId}`,
    transition: 'publish',
  });
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: vpnId,
    contentTitle: 'Troubleshooting VPN and Remote Work',
    path: `${workspaceId}/${itDeptId}/${hardwareId}`,
    transition: 'publish',
  });
  await createContent(page, {
    contentType: 'WikiPage',
    contentId: budgetId,
    contentTitle: 'Quarterly Budget Planning',
    path: `${workspaceId}/${financeId}/${expenseId}`,
    transition: 'publish',
  });

  return {
    workspacePath,
    pages: {
      workspace: workspacePath,
      hr: `${workspacePath}/${hrId}`,
      benefits: `${workspacePath}/${hrId}/${benefitsId}`,
      review: `${workspacePath}/${hrId}/${benefitsId}/${reviewId}`,
      itDept: `${workspacePath}/${itDeptId}`,
      hardware: `${workspacePath}/${itDeptId}/${hardwareId}`,
      vpn: `${workspacePath}/${itDeptId}/${hardwareId}/${vpnId}`,
      finance: `${workspacePath}/${financeId}`,
      expense: `${workspacePath}/${financeId}/${expenseId}`,
      budget: `${workspacePath}/${financeId}/${expenseId}/${budgetId}`,
    },
  };
}

test.describe('NavigationSidebar', () => {
  test.describe('navigation tree stays open and expands ancestors', () => {
    test('sidebar is visible by default on WikiPage view', async ({ page }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      await page.goto(pages.review, { waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).toBeVisible();
      await expect(page.locator('.navigation-sidebar-title')).toBeVisible();
    });

    test('navigating to another page keeps sidebar open and expands its ancestors', async ({
      page,
    }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      // Start on a page in the HR branch
      await page.goto(pages.review, { waitUntil: 'networkidle' });
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).toBeVisible();

      // Navigate to a page in the IT branch
      await page.goto(pages.vpn, { waitUntil: 'networkidle' });

      // Sidebar stays open
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).toBeVisible();

      // IT branch parent is auto-expanded — L2 child is now visible
      const nav = page.locator('nav.navigation-sidebar');
      await expect(
        nav.getByRole('row', {
          name: 'Request New Hardware or Software Access',
        }),
      ).toBeVisible();

      // Active page item carries is-current class
      await expect(
        nav.getByRole('row', { name: /Troubleshooting VPN/ }),
      ).toHaveAttribute('class', /is-current/);
    });
  });

  test.describe('workspace title and page links', () => {
    test('workspace title link points to workspace root and is navigable', async ({
      page,
    }) => {
      await login(page);
      const { workspacePath, pages } = await createNavSidebarContent(page);

      await page.goto(pages.review, { waitUntil: 'networkidle' });

      const titleLink = page.locator('.navigation-sidebar-title');
      await expect(titleLink).toBeVisible();
      await expect(titleLink).toHaveAttribute('href', workspacePath);

      await titleLink.click();
      await expect(page).toHaveURL(new RegExp(workspacePath + '$'));
    });

    test('page tree items link to correct paths and are navigable', async ({
      page,
    }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      // Land on benefits so hr (L1) and benefits (L2) are both expanded,
      // making review (L3) visible in the tree
      await page.goto(pages.benefits, { waitUntil: 'networkidle' });

      const nav = page.locator('nav.navigation-sidebar');

      // L1 item has correct data-href
      const hrItem = nav.getByRole('row', { name: 'Human Resources' });
      await expect(hrItem).toHaveAttribute('data-href', pages.hr);

      // L3 item has correct data-href and navigates on click
      const reviewItem = nav.getByRole('row', {
        name: 'Annual Performance Review Guidelines',
      });
      await expect(reviewItem).toHaveAttribute('data-href', pages.review);
      await reviewItem.click();
      await expect(page).toHaveURL(new RegExp(pages.review + '$'));
    });
  });

  test.describe('collapse and expand', () => {
    test('inner close button collapses the sidebar panel', async ({ page }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      await page.goto(pages.hr, { waitUntil: 'networkidle' });
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).toBeVisible();

      await page.locator('.navigation-sidebar-close').click();

      // is-open removed and panel element remains in DOM (but hidden)
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).not.toBeVisible();
      await expect(page.locator('.navigation-sidebar-panel')).toBeAttached();
    });

    test('panel toggle button reopens a collapsed sidebar', async ({
      page,
    }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      await page.goto(pages.hr, { waitUntil: 'networkidle' });

      // Collapse first via inner close button
      await page.locator('.navigation-sidebar-close').click();
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).not.toBeVisible();

      // Reopen via toggle button
      await page.locator('.navigation-sidebar-toggle').click();
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).toBeVisible();
      await expect(page.locator('nav.navigation-sidebar')).toBeVisible();
    });
  });

  test.describe('localStorage persistence', () => {
    test('collapsed state persists across page reload', async ({ page }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      await page.goto(pages.hr, { waitUntil: 'networkidle' });

      await page.locator('.navigation-sidebar-close').click();
      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).not.toBeVisible();

      await page.reload({ waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).not.toBeVisible();
    });

    test('open state persists across page reload', async ({ page }) => {
      await login(page);
      const { pages } = await createNavSidebarContent(page);

      await page.goto(pages.hr, { waitUntil: 'networkidle' });

      // Ensure localStorage is set to open before reloading
      await page.evaluate(() =>
        localStorage.setItem('navigation-sidebar-open', 'true'),
      );
      await page.reload({ waitUntil: 'networkidle' });

      await expect(
        page.locator('.navigation-sidebar-panel.is-open'),
      ).toBeVisible();
    });
  });
});
