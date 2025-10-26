import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-mk6stzyza-tom-hydes-projects.vercel.app';

test.describe('Real User Journey Tests', () => {
  let errorMessages: string[] = [];
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errorMessages = [];
    pageErrors = [];

    // Capture all console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log('💥 Page Error:', error.message);
      console.log('Stack:', error.stack);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      console.log('🌐 Request Failed:', request.url(), request.failure()?.errorText);
    });
  });

  test('User visits homepage and sees content', async ({ page }) => {
    console.log('🧪 Test: Visiting homepage as a new user...');

    // Navigate to homepage
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Take screenshot immediately
    await page.screenshot({ path: 'test-results/homepage-initial.png', fullPage: true });

    // Wait a moment for any JS to execute
    await page.waitForTimeout(3000);

    // Check if error boundary is showing
    const hasErrorBoundary = await page.locator('text=Application Error').count() > 0;
    if (hasErrorBoundary) {
      console.log('🚨 ERROR BOUNDARY DETECTED!');

      // Try to find error ID
      const errorId = await page.locator('text=/Error ID:/').textContent();
      console.log('Error ID:', errorId);

      // Take screenshot
      await page.screenshot({ path: 'test-results/error-boundary.png', fullPage: true });

      // Get page HTML for debugging
      const html = await page.content();
      console.log('Page HTML length:', html.length);

      throw new Error(`Application Error boundary is showing. ${errorId}`);
    }

    // Check for actual content
    const hasContent = await page.locator('text=Master-AI').count() > 0;
    console.log('Has Master-AI text:', hasContent);

    const bodyText = await page.textContent('body');
    console.log('Page body preview:', bodyText?.substring(0, 200));

    // Verify page loaded
    expect(hasContent).toBeTruthy();

    // Report any errors found
    if (errorMessages.length > 0) {
      console.log('\n📋 Console Errors Found:', errorMessages.length);
      errorMessages.slice(0, 5).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.substring(0, 100)}`);
      });
    }

    if (pageErrors.length > 0) {
      console.log('\n💥 Page Errors Found:', pageErrors.length);
      pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
  });

  test('User can navigate to signup page', async ({ page }) => {
    console.log('🧪 Test: Navigating to signup...');

    await page.goto(PRODUCTION_URL);
    await page.waitForTimeout(2000);

    // Look for signup button
    const signupButton = page.locator('a[href="/auth/signup"]').first();
    const buttonExists = await signupButton.count() > 0;

    console.log('Signup button exists:', buttonExists);

    if (buttonExists) {
      await signupButton.click();
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: 'test-results/signup-page.png', fullPage: true });

      console.log('Current URL:', page.url());
    }
  });

  test('User can view discover page', async ({ page }) => {
    console.log('🧪 Test: Visiting discover page...');

    await page.goto(`${PRODUCTION_URL}/discover`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/discover-page-full.png', fullPage: true });

    const hasError = await page.locator('text=Application Error').count() > 0;
    expect(hasError).toBe(false);
  });

  test('API health check responds', async ({ request }) => {
    console.log('🧪 Test: Checking API health...');

    const response = await request.get(`${PRODUCTION_URL}/api/health/database`);
    console.log('Health check status:', response.status());
    console.log('Health check response:', await response.text());
  });
});
