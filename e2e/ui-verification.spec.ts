/**
 * UI Verification Test - Check that lessons are actually visible
 */

import { test, expect } from '@playwright/test';

test.describe('UI Verification - Lessons Display', () => {
  test('dashboard/lessons page shows actual lessons', async ({ page }) => {
    console.log('🔍 Checking /dashboard/lessons page...');

    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for any dynamic loading

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/lessons-page.png', fullPage: true });

    // Check page title
    const title = await page.locator('h1, h2').first().textContent();
    console.log(`📄 Page title: ${title}`);

    // Look for lesson cards
    const lessonCards = page.locator('[data-testid="lesson-card"], .hover\\:shadow-md, article');
    const cardCount = await lessonCards.count();
    console.log(`📚 Found ${cardCount} lesson cards`);

    // Look for "Start Lesson" buttons or lesson links
    const lessonLinks = page.locator('a[href*="/lesson/"]');
    const linkCount = await lessonLinks.count();
    console.log(`🔗 Found ${linkCount} lesson links`);

    // Check for lesson titles
    const lessonTitles = page.locator('text=/Lesson \\d+:/i, text=/ChatGPT/i, text=/Claude/i, text=/Midjourney/i');
    const titleCount = await lessonTitles.count();
    console.log(`📝 Found ${titleCount} lesson title elements`);

    // Get page content for debugging
    const bodyText = await page.textContent('body');
    const hasLessonContent = bodyText?.includes('Lesson') || bodyText?.includes('Start Lesson');
    console.log(`💬 Page has lesson content: ${hasLessonContent}`);

    // Check for "No Lessons Available" message
    const noLessonsMessage = await page.locator('text=No Lessons Available').isVisible().catch(() => false);
    console.log(`⚠️  "No Lessons" message visible: ${noLessonsMessage}`);

    // ASSERTIONS
    expect(cardCount, 'Should have lesson cards').toBeGreaterThan(0);
    expect(linkCount, 'Should have lesson links').toBeGreaterThan(0);
    expect(noLessonsMessage, 'Should NOT show "No Lessons Available"').toBe(false);

    console.log('✅ /dashboard/lessons verification PASSED');
  });

  test('discover page shows lessons', async ({ page }) => {
    console.log('🔍 Checking /discover page...');

    await page.goto('/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000); // Wait for API calls to complete

    // Take screenshot
    await page.screenshot({ path: 'test-results/discover-page.png', fullPage: true });

    // Check for lessons
    const lessonElements = page.locator('[data-testid="lesson-card"], a[href*="/lesson/"], article');
    const elementCount = await lessonElements.count();
    console.log(`📚 Found ${elementCount} lesson elements on discover page`);

    // Check for lesson titles
    const pageText = await page.textContent('body');
    const hasLessonText = pageText?.includes('Lesson') || pageText?.includes('ChatGPT') || pageText?.includes('Claude');
    console.log(`💬 Page has lesson text: ${hasLessonText}`);

    // ASSERTION
    expect(elementCount, 'Discover page should show lessons').toBeGreaterThan(0);

    console.log('✅ /discover verification PASSED');
  });

  test('can click and navigate to a lesson', async ({ page }) => {
    console.log('🔍 Testing lesson navigation...');

    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find and click first lesson link
    const firstLessonLink = page.locator('a[href*="/lesson/"]').first();
    const isVisible = await firstLessonLink.isVisible();
    console.log(`🔗 First lesson link visible: ${isVisible}`);

    if (isVisible) {
      const href = await firstLessonLink.getAttribute('href');
      console.log(`📍 Clicking lesson link: ${href}`);

      await firstLessonLink.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`📍 Navigated to: ${currentUrl}`);

      // Take screenshot of lesson page
      await page.screenshot({ path: 'test-results/lesson-page.png', fullPage: true });

      // ASSERTION
      expect(currentUrl, 'Should navigate to lesson page').toContain('/lesson/');

      console.log('✅ Lesson navigation PASSED');
    } else {
      throw new Error('No visible lesson links found - UI FAILED');
    }
  });
});
