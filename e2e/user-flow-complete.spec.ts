import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-f7fcaoacr-tom-hydes-projects.vercel.app';

test.describe('Complete User Flow Tests', () => {

  test('Flow 1: Visitor browses and views lesson', async ({ page }) => {
    console.log('🎬 Starting visitor user flow...\n');

    // Step 1: Visit homepage
    console.log('Step 1: Visit homepage');
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/Master-AI/i);
    console.log('✅ Homepage loaded\n');

    // Step 2: Navigate to discover page
    console.log('Step 2: Navigate to discover page');
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for lessons to load
    await page.screenshot({ path: 'test-results/flow-discover-page.png', fullPage: true });
    console.log('✅ Discover page loaded\n');

    // Step 3: Check that lessons are visible
    console.log('Step 3: Check lessons are visible');
    const lessonCards = await page.locator('[data-testid="lesson-card"], .lesson-card, article, [class*="lesson"]').count();
    console.log(`📚 Found ${lessonCards} lesson elements`);

    // Take screenshot to see what's on the page
    const bodyText = await page.textContent('body');
    const hasLessonText = /lesson \d+/i.test(bodyText || '');
    console.log(`🔍 Has lesson numbers in text: ${hasLessonText}`);

    if (lessonCards === 0 && !hasLessonText) {
      console.log('⚠️  No lessons visible - checking page content...');
      console.log('Page preview:', bodyText?.substring(0, 500));
    }
    console.log('');

    // Step 4: Try to click first lesson
    console.log('Step 4: Try to click first lesson');

    // Try multiple selectors to find clickable lesson
    const selectors = [
      '[data-testid="lesson-card"]',
      '.lesson-card',
      'article',
      '[class*="lesson-"]',
      'a[href*="/lesson"]',
      'button:has-text("Start")',
      'button:has-text("View")',
      'div[role="button"]'
    ];

    let clicked = false;
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`   Found ${count} elements matching: ${selector}`);
        try {
          const firstElement = page.locator(selector).first();
          await firstElement.click({ timeout: 5000 });
          clicked = true;
          console.log(`   ✅ Clicked element: ${selector}`);
          break;
        } catch (e) {
          console.log(`   ⚠️  Could not click: ${selector}`);
        }
      }
    }

    if (!clicked) {
      console.log('❌ Could not find clickable lesson element');
      await page.screenshot({ path: 'test-results/flow-no-clickable-lessons.png', fullPage: true });
      return;
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('');

    // Step 5: Check if we landed on lesson detail page or got 404
    console.log('Step 5: Check lesson detail page');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    await page.screenshot({ path: 'test-results/flow-lesson-page.png', fullPage: true });

    const pageTitle = await page.title();
    const pageContent = await page.textContent('body');

    if (pageContent?.includes('404') || pageContent?.includes('Not Found')) {
      console.log('❌ Got 404 error!');
      console.log('Page content:', pageContent.substring(0, 300));
      throw new Error('Lesson page returned 404');
    } else if (currentUrl.includes('/lesson')) {
      console.log('✅ Navigated to lesson page');
      console.log(`Page title: ${pageTitle}`);
    } else {
      console.log('⚠️  Unexpected navigation');
      console.log(`Page title: ${pageTitle}`);
    }
    console.log('');

    // Step 6: Check lesson content is visible
    console.log('Step 6: Check lesson content visible');
    const hasContent = pageContent?.length > 500;
    console.log(`Content length: ${pageContent?.length || 0} characters`);
    console.log(`Has substantial content: ${hasContent}`);
  });

  test('Flow 2: User signs up and views lesson', async ({ page }) => {
    console.log('🎬 Starting signup user flow...\n');

    // Step 1: Visit homepage and click signup
    console.log('Step 1: Click signup from homepage');
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    const signupButton = page.locator('a[href*="/auth/signup"], button:has-text("Sign Up")').first();
    if (await signupButton.count() > 0) {
      await signupButton.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to signup page');
      console.log(`Current URL: ${page.url()}`);
    } else {
      console.log('⚠️  No signup button found on homepage');
    }
    console.log('');

    // Step 2: Check signup page exists
    console.log('Step 2: Check signup page');
    await page.goto(`${PRODUCTION_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flow-signup-page.png', fullPage: true });

    const signupPageContent = await page.textContent('body');
    const hasSignupForm = signupPageContent?.includes('email') || signupPageContent?.includes('password');
    console.log(`Has signup form: ${hasSignupForm}`);
    console.log('');
  });

  test('Flow 3: Search and filter lessons', async ({ page }) => {
    console.log('🎬 Starting search/filter flow...\n');

    // Step 1: Go to discover page
    console.log('Step 1: Navigate to discover');
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('');

    // Step 2: Try to use search
    console.log('Step 2: Try search functionality');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('ChatGPT');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/flow-search-results.png', fullPage: true });
      console.log('✅ Search input works');
    } else {
      console.log('⚠️  No search input found');
    }
    console.log('');

    // Step 3: Try filters
    console.log('Step 3: Try filters');
    const filterButton = page.locator('button:has-text("Filter")').first();
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/flow-filters-open.png', fullPage: true });
      console.log('✅ Filters button works');
    } else {
      console.log('⚠️  No filter button found');
    }
  });

  test('Flow 4: Test API integration', async ({ request }) => {
    console.log('🎬 Testing API integration...\n');

    // Step 1: Get lessons list
    console.log('Step 1: Fetch lessons list');
    const lessonsResponse = await request.get(`${PRODUCTION_URL}/api/lessons`);
    const lessonsData = await lessonsResponse.json();
    console.log(`Status: ${lessonsResponse.status()}`);
    console.log(`Lessons returned: ${lessonsData.lessons?.length || 0}`);

    if (lessonsData.lessons && lessonsData.lessons.length > 0) {
      const firstLesson = lessonsData.lessons[0];
      console.log(`First lesson ID: ${firstLesson.id}`);
      console.log(`First lesson title: ${firstLesson.title}`);
      console.log('');

      // Step 2: Try to fetch individual lesson
      console.log('Step 2: Fetch individual lesson');
      const lessonDetailResponse = await request.get(`${PRODUCTION_URL}/api/lessons/${firstLesson.id}`);
      console.log(`Detail API status: ${lessonDetailResponse.status()}`);

      if (lessonDetailResponse.status() !== 200) {
        const errorData = await lessonDetailResponse.json();
        console.log('Error:', JSON.stringify(errorData, null, 2));
      }
    }
  });
});
