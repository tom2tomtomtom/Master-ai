import { test, expect } from '@playwright/test';

const LOCAL_URL = 'http://localhost:3002';
const REAL_USER_EMAIL = 'tomh@redbaez.com';
const REAL_USER_PASSWORD = 'Wijlre2010!';

test('Local dashboard visibility check', async ({ page }) => {
  console.log('🔍 Testing LOCAL dashboard with sidebar fix\n');

  // Login
  await page.goto(`${LOCAL_URL}/auth/signin`);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(REAL_USER_EMAIL);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(REAL_USER_PASSWORD);

  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Go to dashboard
  await page.goto(`${LOCAL_URL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/local-dashboard.png', fullPage: true });

  // Check for visible content elements
  const body = await page.textContent('body');
  const bodyLength = body?.length || 0;
  console.log(`📄 Page content length: ${bodyLength} characters`);

  const hasProgress = body?.toLowerCase().includes('progress') || false;
  const hasLessons = body?.toLowerCase().includes('lesson') || false;
  const hasGreeting = body?.toLowerCase().includes('good') || body?.toLowerCase().includes('welcome') || false;

  console.log(`✓ Has "progress": ${hasProgress}`);
  console.log(`✓ Has "lesson": ${hasLessons}`);
  console.log(`✓ Has greeting: ${hasGreeting}`);

  // Check main content is visible
  const mainContent = page.locator('main');
  const mainVisible = await mainContent.isVisible().catch(() => false);
  console.log(`✓ Main <main> element visible: ${mainVisible}`);

  if (mainVisible) {
    const mainText = await mainContent.textContent();
    const mainLength = mainText?.length || 0;
    console.log(`✓ Main content length: ${mainLength} characters`);

    if (mainLength > 100) {
      console.log('✅ SUCCESS: Main content is visible with substantial text!');
    } else {
      console.log('❌ FAIL: Main content visible but too short');
    }
  } else {
    console.log('❌ FAIL: Main content element not visible');
  }

  // Look for actual dashboard elements
  const dashboardCards = await page.locator('[class*="Card"]').count();
  console.log(`✓ Card components found: ${dashboardCards}`);

  const statsElements = await page.locator('h1, h2, h3').count();
  console.log(`✓ Heading elements found: ${statsElements}`);
});
