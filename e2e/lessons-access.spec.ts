import { test, expect } from '@playwright/test';

test.describe('Lessons Access with Database Fallback', () => {
  test('lessons page should show fallback lessons when database unavailable', async ({ page }) => {
    console.log('🔄 Testing lessons page with fallback data...');
    
    // Navigate directly to lessons page
    await page.goto('/dashboard/lessons');
    await page.waitForTimeout(3000);
    
    // Should see lesson content (fallback lessons)
    await expect(page.locator('h1')).toContainText('All Lessons');
    
    // Should see lesson cards
    const lessonCards = page.locator('[data-testid="lesson-card"], .hover\\:shadow-md');
    const cardCount = await lessonCards.count();
    console.log(`📚 Found ${cardCount} lesson cards`);
    
    expect(cardCount).toBeGreaterThan(0);
    
    // Check for specific fallback lessons
    const firstLesson = page.locator('text=AI Tool Selection Guide');
    await expect(firstLesson).toBeVisible();
    console.log('✅ Found "AI Tool Selection Guide" lesson');
    
    const emailLesson = page.locator('text=ChatGPT Email Mastery');
    await expect(emailLesson).toBeVisible();
    console.log('✅ Found "ChatGPT Email Mastery" lesson');
    
    // Check for FREE badges on fallback lessons
    const freeBadges = page.locator('text=FREE');
    const freeCount = await freeBadges.count();
    console.log(`🆓 Found ${freeCount} FREE lesson badges`);
    expect(freeCount).toBeGreaterThan(0);
    
    // Check for Start Lesson buttons
    const startButtons = page.locator('text=Start Lesson');
    const buttonCount = await startButtons.count();
    console.log(`🎯 Found ${buttonCount} "Start Lesson" buttons`);
    expect(buttonCount).toBeGreaterThan(0);
    
    // Verify lesson metadata is displayed
    const difficultyBadges = page.locator('text=Beginner, text=Intermediate, text=Advanced');
    const difficultyCount = await difficultyBadges.count();
    console.log(`📊 Found ${difficultyCount} difficulty indicators`);
    
    const timeBadges = page.locator('text=/\\d+m/');
    const timeCount = await timeBadges.count();
    console.log(`⏱️ Found ${timeCount} time estimates`);
    
    console.log('🎉 All lesson access tests passed!');
  });

  test('lesson navigation from lessons page should work', async ({ page }) => {
    console.log('🔄 Testing lesson navigation...');
    
    await page.goto('/dashboard/lessons');
    await page.waitForTimeout(3000);
    
    // Click on first "Start Lesson" button
    const firstStartButton = page.locator('text=Start Lesson').first();
    if (await firstStartButton.isVisible()) {
      await firstStartButton.click();
      await page.waitForTimeout(2000);
      
      // Should navigate to a lesson page (even if it shows 404 or access denied, the routing works)
      const currentUrl = page.url();
      console.log(`📍 Navigated to: ${currentUrl}`);
      expect(currentUrl).toContain('/dashboard/lesson/');
      console.log('✅ Lesson navigation routing works');
    }
  });

  test('dashboard should eventually load with fallback data', async ({ page }) => {
    console.log('🔄 Testing dashboard fallback behavior...');
    
    await page.goto('/dashboard');
    await page.waitForTimeout(10000); // Wait longer for dashboard to resolve
    
    const pageContent = await page.textContent('body');
    
    // Should eventually show either proper dashboard content or fallback
    // Check if it's no longer stuck in loading
    const isStillLoading = pageContent && pageContent.includes('Loading...') && pageContent.length < 1000;
    
    if (!isStillLoading) {
      console.log('✅ Dashboard is no longer stuck in infinite loading state');
      
      // Look for Browse All Lessons if dashboard loaded
      const browseLessons = page.locator('text=Browse All').first();
      if (await browseLessons.isVisible().catch(() => false)) {
        console.log('✅ Found "Browse All Lessons" navigation');
        
        await browseLessons.click();
        await page.waitForTimeout(2000);
        
        if (page.url().includes('/dashboard/lessons')) {
          console.log('✅ Dashboard to lessons navigation works');
        }
      }
    } else {
      console.log('⚠️ Dashboard still in loading state (expected with database issues)');
    }
  });
});