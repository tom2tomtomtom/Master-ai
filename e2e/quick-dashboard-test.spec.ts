import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-dpvb3aay6-tom-hydes-projects.vercel.app';
const REAL_USER_EMAIL = 'tomh@redbaez.com';
const REAL_USER_PASSWORD = 'Wijlre2010!';

test('Quick dashboard visibility check', async ({ page }) => {
  console.log('🔍 Testing dashboard visibility after sidebar fix\n');

  // Login
  await page.goto(`${PRODUCTION_URL}/auth/signin`);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(REAL_USER_EMAIL);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(REAL_USER_PASSWORD);

  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Go to dashboard
  await page.goto(`${PRODUCTION_URL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/dashboard-after-fix.png', fullPage: true });

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

  // Check for stats cards
  const statsCards = await page.locator('[class*="stats"], [class*="card"]').count();
  console.log(`✓ Stats/card elements: ${statsCards}`);

  // Check main content is visible (not just sidebar)
  const mainContent = page.locator('main, [role="main"]');
  const mainVisible = await mainContent.isVisible().catch(() => false);
  console.log(`✓ Main content visible: ${mainVisible}`);

  if (mainVisible) {
    const mainText = await mainContent.textContent();
    const mainLength = mainText?.length || 0;
    console.log(`✓ Main content length: ${mainLength} characters`);
  }

  console.log('\n✅ Dashboard visibility test complete');
});
