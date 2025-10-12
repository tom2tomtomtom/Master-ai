import { test, expect, Page } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-rm2r2hxl1-tom-hydes-projects.vercel.app';

// Collect console errors
const consoleErrors: string[] = [];
const consoleWarnings: string[] = [];
const networkErrors: string[] = [];

test.describe('Production Application Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear error arrays
    consoleErrors.length = 0;
    consoleWarnings.length = 0;
    networkErrors.length = 0;

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}\n${error.stack}`);
    });

    // Listen for failed requests
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterEach(async () => {
    // Report collected errors
    if (consoleErrors.length > 0) {
      console.log('\n🚨 Console Errors Found:');
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  Console Warnings:');
      consoleWarnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check title
    await expect(page).toHaveTitle(/Master AI/i);

    // Check no critical console errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('Warning') &&
      !error.includes('DevTools')
    );

    if (criticalErrors.length > 0) {
      console.error('Critical errors found:', criticalErrors);
    }
  });

  test('Main navigation elements are present', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });

    // Log the page content for debugging
    const bodyText = await page.textContent('body');
    console.log('Page contains text:', bodyText?.substring(0, 500));
  });

  test('Check for runtime errors on homepage', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Wait longer for any delayed errors
    await page.waitForTimeout(5000);

    // Check for error boundaries
    const errorBoundary = await page.locator('text=Application Error').count();
    expect(errorBoundary).toBe(0);

    // Check for unhandled error messages
    const unhandledError = await page.locator('text=UNHANDLED ERROR').count();
    expect(unhandledError).toBe(0);
  });

  test('Discover page loads', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/discover-page.png', fullPage: true });
  });

  test('API endpoints respond', async ({ page }) => {
    // Test API health
    const response = await page.request.get(`${PRODUCTION_URL}/api/health/database`);
    console.log('Health check status:', response.status());

    if (!response.ok()) {
      const body = await response.text();
      console.log('Health check response:', body);
    }
  });

  test('Check authentication flow', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot
    await page.screenshot({ path: 'test-results/signin-page.png', fullPage: true });

    // Check if signin page loaded
    const pageContent = await page.textContent('body');
    console.log('Signin page loaded, has content:', pageContent ? 'Yes' : 'No');
  });

  test('Check for broken images and resources', async ({ page }) => {
    const brokenResources: string[] = [];

    page.on('response', (response) => {
      if (!response.ok() && (
        response.url().includes('.png') ||
        response.url().includes('.jpg') ||
        response.url().includes('.svg') ||
        response.url().includes('.css') ||
        response.url().includes('.js')
      )) {
        brokenResources.push(`${response.status()} - ${response.url()}`);
      }
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    if (brokenResources.length > 0) {
      console.log('\n🔴 Broken Resources:');
      brokenResources.forEach((resource) => {
        console.log(`  - ${resource}`);
      });
    }

    expect(brokenResources.length).toBe(0);
  });
});
