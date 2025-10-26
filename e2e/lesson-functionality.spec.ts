import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-f7fcaoacr-tom-hydes-projects.vercel.app';

test.describe('Lesson Functionality Tests', () => {
  test('API: Check lessons endpoint returns data', async ({ request }) => {
    console.log('🔍 Testing /api/lessons endpoint...');

    const response = await request.get(`${PRODUCTION_URL}/api/lessons`);
    const status = response.status();
    const data = await response.json();

    console.log('Status:', status);
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));

    if (status === 200) {
      console.log('✅ API returned successfully');
      console.log('📚 Number of lessons:', data.lessons?.length || 0);

      if (data.lessons && data.lessons.length > 0) {
        console.log('📖 First lesson:', {
          id: data.lessons[0].id,
          title: data.lessons[0].title,
          lessonNumber: data.lessons[0].lessonNumber
        });
      } else {
        console.log('⚠️  No lessons found in response!');
      }
    } else {
      console.log('❌ API returned error:', status);
      console.log('Error details:', data);
    }

    // Expect successful response (but allow empty results for now)
    expect(status).toBe(200);
  });

  test('API: Check database health', async ({ request }) => {
    console.log('🔍 Testing database health...');

    const response = await request.get(`${PRODUCTION_URL}/api/health/database`);
    const status = response.status();
    const data = await response.json();

    console.log('Database Health Status:', status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.status === 'unhealthy') {
      console.log('❌ Database is not connected properly!');
      console.log('This explains why lessons are not showing.');
    }
  });

  test('Frontend: Check discover page for lessons', async ({ page }) => {
    console.log('🔍 Testing discover page...');

    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for API calls

    // Take screenshot
    await page.screenshot({ path: 'test-results/discover-lessons.png', fullPage: true });

    // Check for lesson cards
    const lessonCards = await page.locator('[data-testid="lesson-card"], .lesson-card, article').count();
    console.log('📚 Lesson cards found:', lessonCards);

    // Check for "no lessons" message
    const noLessonsText = await page.locator('text=/no lessons/i, text=/no content/i, text=/coming soon/i').count();
    console.log('❌ "No lessons" message found:', noLessonsText > 0);

    // Check for loading state
    const isLoading = await page.locator('text=/loading/i').count();
    console.log('⏳ Loading state:', isLoading > 0);

    // Get page text to analyze
    const bodyText = await page.textContent('body');
    const hasLessonNumbers = /lesson\s+\d+/i.test(bodyText || '');
    console.log('🔢 Has lesson numbers in text:', hasLessonNumbers);

    // Log what's actually on the page
    console.log('Page content preview:', bodyText?.substring(0, 300));
  });

  test('Frontend: Check dashboard lessons page', async ({ page }) => {
    console.log('🔍 Testing dashboard lessons page...');

    // This might require authentication
    await page.goto(`${PRODUCTION_URL}/dashboard/lessons`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/dashboard-lessons.png', fullPage: true });

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/auth/')) {
      console.log('🔐 Redirected to auth - authentication required');
    } else {
      const lessonCount = await page.locator('[data-testid="lesson"], .lesson-item, article').count();
      console.log('📚 Lessons found on dashboard:', lessonCount);
    }
  });

  test('API: Test specific lesson by ID', async ({ request }) => {
    console.log('🔍 Testing individual lesson endpoint...');

    // First, try to get a lesson ID
    const lessonsResponse = await request.get(`${PRODUCTION_URL}/api/lessons`);
    const lessonsData = await lessonsResponse.json();

    if (lessonsData.lessons && lessonsData.lessons.length > 0) {
      const firstLessonId = lessonsData.lessons[0].id;
      console.log('Testing with lesson ID:', firstLessonId);

      const lessonResponse = await request.get(`${PRODUCTION_URL}/api/lessons/${firstLessonId}`);
      const lessonStatus = lessonResponse.status();
      const lessonData = await lessonResponse.json();

      console.log('Lesson detail status:', lessonStatus);
      console.log('Lesson data:', JSON.stringify(lessonData, null, 2).substring(0, 300));
    } else {
      console.log('⚠️  No lessons available to test individual endpoint');
    }
  });

  test('Check if lesson markdown files exist', async ({ request }) => {
    console.log('🔍 Checking if lesson markdown files are accessible...');

    // Try to access a lesson markdown file
    const response = await request.get(`${PRODUCTION_URL}/lesson-01-chatgpt-email-mastery.md`);
    console.log('Lesson file status:', response.status());

    if (response.status() === 404) {
      console.log('❌ Lesson files not found at root level');
      console.log('This is expected - lessons should be in database, not served as static files');
    }
  });
});
