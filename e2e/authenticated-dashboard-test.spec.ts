import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-etrwl8ykd-tom-hydes-projects.vercel.app';

test.describe('Authenticated Dashboard Tests', () => {

  test('Login and check dashboard displays content', async ({ page }) => {
    console.log('🔐 Testing authenticated dashboard...\n');

    // Step 1: Go to signin page
    console.log('Step 1: Navigate to signin');
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: 'test-results/auth-signin-page.png', fullPage: true });

    const signinContent = await page.textContent('body');
    console.log('Signin page loaded:', signinContent?.includes('sign') || signinContent?.includes('email'));
    console.log('');

    // Step 2: Fill in credentials
    console.log('Step 2: Fill credentials');

    // Look for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const emailCount = await emailInput.count();
    console.log(`Email inputs found: ${emailCount}`);

    if (emailCount > 0) {
      await emailInput.fill('tomh@redbaez.com');
      console.log('✅ Email filled');
    }

    // Look for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const passwordCount = await passwordInput.count();
    console.log(`Password inputs found: ${passwordCount}`);

    if (passwordCount > 0) {
      await passwordInput.fill('Wijlre2010!');
      console.log('✅ Password filled');
    }
    console.log('');

    // Step 3: Submit form
    console.log('Step 3: Submit form');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first();
    const buttonCount = await submitButton.count();
    console.log(`Submit buttons found: ${buttonCount}`);

    if (buttonCount > 0) {
      await submitButton.click();
      console.log('✅ Clicked submit');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    console.log('');

    // Step 4: Check where we landed
    console.log('Step 4: Check navigation after login');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    await page.screenshot({ path: 'test-results/auth-after-signin.png', fullPage: true });

    const pageContent = await page.textContent('body');
    const isDashboard = currentUrl.includes('/dashboard') || pageContent?.includes('Dashboard');
    const isStillSignin = currentUrl.includes('/auth/signin');

    console.log(`Is Dashboard: ${isDashboard}`);
    console.log(`Still on Signin: ${isStillSignin}`);
    console.log('');

    // Step 5: If not on dashboard, navigate there
    if (!isDashboard) {
      console.log('Step 5: Navigate to dashboard manually');
      await page.goto(`${PRODUCTION_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log(`Navigated to: ${page.url()}`);
    }

    // Step 6: Check dashboard content
    console.log('Step 6: Check dashboard content');
    await page.screenshot({ path: 'test-results/auth-dashboard.png', fullPage: true });

    const dashboardContent = await page.textContent('body');
    const contentLength = dashboardContent?.length || 0;
    console.log(`Dashboard content length: ${contentLength} characters`);

    // Check for dashboard elements
    const hasGreeting = dashboardContent?.includes('Good morning') ||
                       dashboardContent?.includes('Good afternoon') ||
                       dashboardContent?.includes('Good evening');
    const hasProgress = dashboardContent?.includes('Progress') || dashboardContent?.includes('progress');
    const hasLessons = dashboardContent?.includes('Lesson') || dashboardContent?.includes('lesson');

    console.log(`Has greeting: ${hasGreeting}`);
    console.log(`Has progress: ${hasProgress}`);
    console.log(`Has lessons: ${hasLessons}`);
    console.log('');

    if (contentLength < 500) {
      console.log('⚠️  Dashboard appears empty or minimal');
      console.log('Content preview:', dashboardContent?.substring(0, 500));
    } else {
      console.log('✅ Dashboard has substantial content');
    }

    // Check for specific dashboard cards/widgets
    const statsCards = await page.locator('[data-testid*="stats"], [class*="stats"], h3, h2').count();
    console.log(`Dashboard cards/headings found: ${statsCards}`);
  });

  test('Check dashboard/lessons page', async ({ page }) => {
    console.log('🔍 Testing /dashboard/lessons directly...\n');

    await page.goto(`${PRODUCTION_URL}/dashboard/lessons`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/auth/')) {
      console.log('⚠️  Redirected to auth - requires authentication');
    } else {
      console.log('✅ Loaded dashboard/lessons page');

      await page.screenshot({ path: 'test-results/dashboard-lessons-direct.png', fullPage: true });

      const content = await page.textContent('body');
      console.log(`Content length: ${content?.length || 0} characters`);

      const hasLessons = content?.includes('Lesson') || content?.includes('lesson');
      console.log(`Has lesson content: ${hasLessons}`);
    }
  });
});
