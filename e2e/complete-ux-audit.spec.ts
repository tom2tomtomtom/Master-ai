import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-dpvb3aay6-tom-hydes-projects.vercel.app';
const REAL_USER_EMAIL = 'tomh@redbaez.com';
const REAL_USER_PASSWORD = 'Wijlre2010!';

test.describe('Complete UX Audit', () => {

  test('1. Login Flow UX', async ({ page }) => {
    console.log('\n🔍 TESTING LOGIN FLOW UX\n');

    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: 'test-results/ux-01-login.png', fullPage: true });

    // Check login page elements
    const hasEmailField = await page.locator('input[type="email"]').count() > 0;
    const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
    const hasSubmitButton = await page.locator('button[type="submit"]').count() > 0;

    console.log(`✓ Email field present: ${hasEmailField}`);
    console.log(`✓ Password field present: ${hasPasswordField}`);
    console.log(`✓ Submit button present: ${hasSubmitButton}`);

    if (!hasEmailField || !hasPasswordField || !hasSubmitButton) {
      throw new Error('❌ LOGIN FORM INCOMPLETE');
    }

    // Test login
    await page.locator('input[type="email"]').first().fill(REAL_USER_EMAIL);
    await page.locator('input[type="password"]').first().fill(REAL_USER_PASSWORD);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const postLoginUrl = page.url();
    console.log(`✓ Post-login URL: ${postLoginUrl}`);

    if (postLoginUrl.includes('/auth/')) {
      throw new Error('❌ LOGIN FAILED - Still on auth page');
    }

    console.log('✅ LOGIN FLOW: PASS\n');
  });

  test('2. Dashboard UX', async ({ page }) => {
    console.log('\n🔍 TESTING DASHBOARD UX\n');

    // Login first
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().fill(REAL_USER_EMAIL);
    await page.locator('input[type="password"]').first().fill(REAL_USER_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Go to dashboard
    await page.goto(`${PRODUCTION_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/ux-02-dashboard.png', fullPage: true });

    // Check critical elements
    const body = await page.textContent('body');

    const checks = {
      'Sidebar visible': await page.locator('aside, [role="navigation"]').count() > 0,
      'Greeting present': body?.toLowerCase().includes('good') || body?.toLowerCase().includes('welcome') || false,
      'Stats cards present': await page.locator('h1, h2, h3').count() > 5,
      'Main content visible': body && body.length > 3000,
      'Navigation links work': await page.locator('a[href*="/dashboard"]').count() > 0,
      'Progress indicator': body?.toLowerCase().includes('progress') || false,
      'Lessons mentioned': body?.toLowerCase().includes('lesson') || false,
    };

    for (const [check, result] of Object.entries(checks)) {
      console.log(`${result ? '✅' : '❌'} ${check}`);
      if (!result) {
        throw new Error(`Dashboard UX issue: ${check} failed`);
      }
    }

    console.log('✅ DASHBOARD UX: PASS\n');
  });

  test('3. Discover Page UX', async ({ page }) => {
    console.log('\n🔍 TESTING DISCOVER PAGE UX\n');

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().fill(REAL_USER_EMAIL);
    await page.locator('input[type="password"]').first().fill(REAL_USER_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Go to discover
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000); // Wait for lessons to load
    await page.screenshot({ path: 'test-results/ux-03-discover.png', fullPage: true });

    const body = await page.textContent('body');

    // Check for lessons
    const lessonCards = await page.locator('[data-testid="lesson-card"], article, [class*="card"]').count();
    const startButtons = await page.locator('button:has-text("Start"), a:has-text("Start")').count();
    const searchBar = await page.locator('input[type="search"], input[placeholder*="search" i]').count() > 0;

    console.log(`✓ Lesson cards: ${lessonCards}`);
    console.log(`✓ Start buttons: ${startButtons}`);
    console.log(`✓ Search bar present: ${searchBar}`);

    if (startButtons === 0 && lessonCards === 0) {
      // Check if showing skeleton loaders (bad UX)
      const skeletons = await page.locator('[class*="skeleton"], [class*="animate-pulse"]').count();
      console.log(`⚠️  Skeleton loaders visible: ${skeletons}`);
      if (skeletons > 3) {
        throw new Error('❌ DISCOVER PAGE: Stuck on loading skeletons - lessons not loading');
      }
      throw new Error('❌ DISCOVER PAGE: No lessons displayed');
    }

    console.log('✅ DISCOVER PAGE UX: PASS\n');
  });

  test('4. Lesson Viewing UX', async ({ page }) => {
    console.log('\n🔍 TESTING LESSON VIEWING UX\n');

    // Login
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().fill(REAL_USER_EMAIL);
    await page.locator('input[type="password"]').first().fill(REAL_USER_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Go to discover and click a lesson
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    const startButton = page.locator('button:has-text("Start"), a:has-text("Start")').first();
    if (await startButton.count() > 0) {
      await startButton.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/ux-04-lesson.png', fullPage: true });

      const content = await page.textContent('body');

      // TEXT READABILITY CHECK
      console.log('\n📖 TEXT READABILITY ANALYSIS:');
      const paragraphs = await page.locator('p, div[class*="prose"], div[class*="content"]').all();

      let readableCount = 0;
      let poorContrastCount = 0;

      for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
        const elem = paragraphs[i];
        const text = await elem.textContent();
        if (text && text.length > 30) {
          const color = await elem.evaluate(el => window.getComputedStyle(el).color);
          const bgColor = await elem.evaluate(el => {
            let element = el as HTMLElement;
            let bg = window.getComputedStyle(element).backgroundColor;
            while (bg === 'rgba(0, 0, 0, 0)' && element.parentElement) {
              element = element.parentElement;
              bg = window.getComputedStyle(element).backgroundColor;
            }
            return bg;
          });

          const textRGB = color.match(/\d+/g);
          const bgRGB = bgColor.match(/\d+/g);

          if (textRGB && bgRGB) {
            const textLum = (parseInt(textRGB[0]) + parseInt(textRGB[1]) + parseInt(textRGB[2])) / 3;
            const bgLum = (parseInt(bgRGB[0]) + parseInt(bgRGB[1]) + parseInt(bgRGB[2])) / 3;
            const contrast = Math.abs(textLum - bgLum);

            if (contrast < 100) {
              console.log(`❌ Element ${i+1}: POOR contrast (${contrast.toFixed(0)}/255)`);
              poorContrastCount++;
            } else {
              console.log(`✅ Element ${i+1}: Good contrast (${contrast.toFixed(0)}/255)`);
              readableCount++;
            }
          }
        }
      }

      if (poorContrastCount > 0) {
        throw new Error(`❌ LESSON READABILITY: ${poorContrastCount} elements have poor text contrast`);
      }

      // Check for content structure
      const hasTitle = content?.toLowerCase().includes('lesson') || false;
      const hasContent = content && content.length > 500;
      const hasNavigation = await page.locator('a:has-text("Back"), button:has-text("Back")').count() > 0;

      console.log(`\n✓ Has lesson title: ${hasTitle}`);
      console.log(`✓ Has substantial content: ${hasContent}`);
      console.log(`✓ Has back navigation: ${hasNavigation}`);

      if (!hasContent) {
        throw new Error('❌ LESSON VIEWING: Insufficient content displayed');
      }

      console.log('✅ LESSON VIEWING UX: PASS\n');
    } else {
      console.log('⚠️  No lessons available to test viewing');
    }
  });

  test('5. Performance Check', async ({ page }) => {
    console.log('\n🔍 TESTING PERFORMANCE\n');

    const tests = [
      { name: 'Login page', url: `${PRODUCTION_URL}/auth/signin`, maxTime: 3000 },
      { name: 'Dashboard', url: `${PRODUCTION_URL}/dashboard`, maxTime: 4000 },
      { name: 'Discover', url: `${PRODUCTION_URL}/discover`, maxTime: 4000 },
    ];

    for (const test of tests) {
      const start = Date.now();
      await page.goto(test.url);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - start;

      const status = loadTime < test.maxTime ? '✅' : '⚠️';
      console.log(`${status} ${test.name}: ${loadTime}ms (max: ${test.maxTime}ms)`);

      if (loadTime > test.maxTime * 1.5) {
        console.log(`   WARNING: Page is very slow (${loadTime}ms)`);
      }
    }

    console.log('\n✅ PERFORMANCE CHECK: COMPLETE\n');
  });
});
