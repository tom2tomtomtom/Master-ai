import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard Features', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
  });

  test('should load dashboard successfully', async ({ page }) => {
    await dashboardPage.verifyLoaded();
    // Check for dashboard elements - good morning/afternoon/evening or any stats
    const dashboardLoaded = await page.locator('text=/Good (morning|afternoon|evening)|Overall Progress|Learning Streak/i').first().isVisible();
    expect(dashboardLoaded).toBeTruthy();
  });

  test('should navigate to lessons', async ({ page }) => {
    await dashboardPage.verifyLoaded();
    await page.click('a[href="/discover"], a:has-text("Lessons"), a:has-text("Browse")');
    await expect(page).toHaveURL(/\/discover|\/dashboard\/lessons/);
  });
});
