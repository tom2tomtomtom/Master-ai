import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {

  test('should load signin page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Verify signin page elements
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Wait for and check form elements with explicit timeout
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    // Verify signup page loaded
    await expect(page).toHaveURL(/\/auth\/signup/);

    // Wait for and check form elements with explicit timeout
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 15000 });
  });
});
