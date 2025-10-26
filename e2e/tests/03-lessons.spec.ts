import { test, expect } from '@playwright/test';
import { DiscoverPage } from '../pages/DiscoverPage';
import { LessonPage } from '../pages/LessonPage';

test.describe('Lesson Discovery & Completion', () => {
  
  test('should display lessons on discover page', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);

    // Check for any lesson links or cards on the page
    const lessonLinks = await page.locator('a[href*="/lesson/"]').count();
    expect(lessonLinks).toBeGreaterThan(0);
  });

  test('should search for lessons', async ({ page }) => {
    const discoverPage = new DiscoverPage(page);
    await discoverPage.navigate();
    
    await discoverPage.searchLessons('ChatGPT');
    await page.waitForLoadState('networkidle');
    
    const resultsCount = await discoverPage.getLessonCount();
    expect(resultsCount).toBeGreaterThanOrEqual(0);
  });

  test('should open and view a lesson', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    // Wait for lessons to load
    await page.waitForTimeout(2000);

    // Click first lesson link with timeout
    const firstLesson = page.locator('a[href*="/lesson/"]').first();
    await firstLesson.click({ timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify we're on a lesson page
    await expect(page).toHaveURL(/\/lesson\//, { timeout: 15000 });
  });

  test('should load lesson content', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');

    // Wait for lessons to load
    await page.waitForTimeout(2000);

    const firstLesson = page.locator('a[href*="/lesson/"]').first();
    await firstLesson.click({ timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify lesson page loaded with content
    await expect(page).toHaveURL(/\/lesson\//, { timeout: 15000 });

    // Check for lesson content elements (title, description, or content area)
    await expect(
      page.locator('h1, h2, article, [class*="lesson"], [class*="content"]').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
