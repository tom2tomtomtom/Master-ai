import { test as base, expect } from '@playwright/test';

const test = base.extend({
  storageState: undefined,
});

const PRODUCTION_URL = 'https://www.master-ai-learn.com';
const REAL_USER_EMAIL = 'tomh@redbaez.com';
const REAL_USER_PASSWORD = 'Wijlre2010!';

test('Diagnose Discover Page Issues', async ({ page }) => {
  const consoleMessages: string[] = [];
  const networkErrors: string[] = [];
  const apiCalls: { url: string; status: number; duration: number }[] = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', text);
    }
  });

  // Capture network requests
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/lessons')) {
      const timing = response.request().timing();
      apiCalls.push({
        url,
        status: response.status(),
        duration: timing?.responseEnd || 0
      });
      console.log(`📡 API Call: ${url} - Status: ${response.status()}`);

      if (response.status() !== 200) {
        networkErrors.push(`${url} returned ${response.status()}`);
        try {
          const body = await response.text();
          console.log(`Response body: ${body.slice(0, 200)}`);
        } catch (e) {
          console.log('Could not read response body');
        }
      } else {
        try {
          const data = await response.json();
          console.log(`✅ Lessons returned: ${data.lessons?.length || 0}`);
        } catch (e) {
          console.log('Could not parse JSON response');
        }
      }
    }
  });

  // Login
  console.log('\n🔐 Logging in...');
  await page.goto(`${PRODUCTION_URL}/auth/signin`);
  await page.locator('input[type="email"]').first().fill(REAL_USER_EMAIL);
  await page.locator('input[type="password"]').first().fill(REAL_USER_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/dashboard|discover/, { timeout: 10000 });
  console.log('✅ Logged in\n');

  // Go to discover
  console.log('📍 Navigating to discover page...');
  await page.goto(`${PRODUCTION_URL}/discover`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Click All Lessons
  console.log('🖱️  Clicking "All Lessons" button...');
  const allLessonsBtn = page.locator('button:has-text("All Lessons")');
  if (await allLessonsBtn.count() > 0) {
    await allLessonsBtn.click();
    console.log('✅ Clicked "All Lessons"\n');
  }

  // Wait for API calls
  console.log('⏳ Waiting 5 seconds for API calls...');
  await page.waitForTimeout(5000);

  // Check for skeleton loaders vs real content
  const skeletonCount = await page.locator('[class*="skeleton"], [class*="animate-pulse"]').count();
  const startButtons = await page.locator('button:has-text("Start"), a:has-text("Start")').count();
  const lessonTitles = await page.locator('h3, h2').filter({ hasText: /Lesson \d+/ }).count();

  console.log('\n📊 RESULTS:');
  console.log(`Skeleton loaders: ${skeletonCount}`);
  console.log(`Start buttons: ${startButtons}`);
  console.log(`Lesson titles: ${lessonTitles}`);
  console.log(`API calls made: ${apiCalls.length}`);
  console.log(`Console errors: ${consoleMessages.filter(m => m.startsWith('[error]')).length}`);
  console.log(`Network errors: ${networkErrors.length}`);

  // Show API call details
  if (apiCalls.length > 0) {
    console.log('\n📡 API CALLS:');
    apiCalls.forEach(call => {
      console.log(`  ${call.status} - ${call.url}`);
    });
  } else {
    console.log('\n❌ NO API CALLS MADE!');
  }

  // Show console errors
  const errors = consoleMessages.filter(m => m.startsWith('[error]'));
  if (errors.length > 0) {
    console.log('\n❌ CONSOLE ERRORS:');
    errors.forEach(err => console.log(`  ${err}`));
  }

  // Show network errors
  if (networkErrors.length > 0) {
    console.log('\n❌ NETWORK ERRORS:');
    networkErrors.forEach(err => console.log(`  ${err}`));
  }

  await page.screenshot({ path: 'test-results/diagnose-discover.png', fullPage: true });
});
