import { test as base, expect } from '@playwright/test';

// Create test without auth dependency
const test = base.extend({
  storageState: undefined,
});

const PRODUCTION_URL = 'https://master-ai-saas-dpvb3aay6-tom-hydes-projects.vercel.app';
const REAL_USER_EMAIL = 'tomh@redbaez.com';
const REAL_USER_PASSWORD = 'Wijlre2010!';

test.describe('Complete UX Audit - Standalone', () => {

  test('Full User Journey UX Test', async ({ page }) => {
    const issues: string[] = [];

    console.log('\n🎯 COMPLETE UX AUDIT STARTING\n');
    console.log('=' .repeat(80));

    // ==== STEP 1: LOGIN ====
    console.log('\n📍 STEP 1: LOGIN FLOW\n');
    try {
      const loginStart = Date.now();
      await page.goto(`${PRODUCTION_URL}/auth/signin`);
      await page.waitForLoadState('domcontentloaded');
      const loginLoadTime = Date.now() - loginStart;
      console.log(`⏱️  Login page load: ${loginLoadTime}ms`);

      await page.screenshot({ path: 'test-results/ux-audit-01-login.png', fullPage: true });

      const emailField = page.locator('input[type="email"]').first();
      await emailField.waitFor({ state: 'visible', timeout: 5000 });
      await emailField.fill(REAL_USER_EMAIL);
      console.log('✅ Email field works');

      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.fill(REAL_USER_PASSWORD);
      console.log('✅ Password field works');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      console.log('✅ Login button works');

      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(3000);

      const postLoginUrl = page.url();
      if (postLoginUrl.includes('/auth/')) {
        issues.push('Login failed - still on auth page');
        console.log('❌ LOGIN FAILED');
      } else {
        console.log('✅ LOGIN SUCCESSFUL');
      }
    } catch (error: any) {
      issues.push(`Login error: ${error.message}`);
      console.log(`❌ LOGIN ERROR: ${error.message}`);
    }

    // ==== STEP 2: DASHBOARD ====
    console.log('\n📍 STEP 2: DASHBOARD UX\n');
    try {
      const dashStart = Date.now();
      await page.goto(`${PRODUCTION_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(4000);
      const dashLoadTime = Date.now() - dashStart;
      console.log(`⏱️  Dashboard load: ${dashLoadTime}ms`);

      await page.screenshot({ path: 'test-results/ux-audit-02-dashboard.png', fullPage: true });

      const body = await page.textContent('body');
      const bodyLength = body?.length || 0;

      // UX Checks
      const checks = {
        'Content loaded': bodyLength > 3000,
        'Greeting visible': body?.toLowerCase().includes('good') || body?.toLowerCase().includes('welcome') || false,
        'Progress shown': body?.toLowerCase().includes('progress') || false,
        'Lessons mentioned': body?.toLowerCase().includes('lesson') || false,
        'Sidebar visible': await page.locator('aside, nav').count() > 0,
        'Stats cards present': await page.locator('h1, h2, h3').count() > 5,
      };

      for (const [check, result] of Object.entries(checks)) {
        if (result) {
          console.log(`✅ ${check}`);
        } else {
          console.log(`❌ ${check}`);
          issues.push(`Dashboard: ${check} failed`);
        }
      }

      if (dashLoadTime > 5000) {
        issues.push(`Dashboard slow: ${dashLoadTime}ms`);
        console.log(`⚠️  Dashboard load time is slow (${dashLoadTime}ms)`);
      }
    } catch (error: any) {
      issues.push(`Dashboard error: ${error.message}`);
      console.log(`❌ DASHBOARD ERROR: ${error.message}`);
    }

    // ==== STEP 3: DISCOVER PAGE ====
    console.log('\n📍 STEP 3: DISCOVER PAGE UX\n');
    try {
      const discoverStart = Date.now();
      await page.goto(`${PRODUCTION_URL}/discover`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(6000); // Give extra time for lessons to load
      const discoverLoadTime = Date.now() - discoverStart;
      console.log(`⏱️  Discover page load: ${discoverLoadTime}ms`);

      await page.screenshot({ path: 'test-results/ux-audit-03-discover.png', fullPage: true });

      const startButtons = await page.locator('button:has-text("Start"), a:has-text("Start")').count();
      const lessonCards = await page.locator('article, [class*="card"]').count();
      const skeletons = await page.locator('[class*="skeleton"], [class*="animate-pulse"]').count();

      console.log(`📊 Start buttons: ${startButtons}`);
      console.log(`📊 Lesson cards: ${lessonCards}`);
      console.log(`📊 Skeleton loaders: ${skeletons}`);

      if (startButtons === 0 && lessonCards < 3) {
        if (skeletons > 5) {
          issues.push('Discover page stuck on skeleton loaders - lessons not loading');
          console.log('❌ STUCK ON SKELETON LOADERS');
        } else {
          issues.push('Discover page has no lessons displayed');
          console.log('❌ NO LESSONS DISPLAYED');
        }
      } else {
        console.log('✅ Lessons are displayed');
      }

      if (discoverLoadTime > 6000) {
        issues.push(`Discover page slow: ${discoverLoadTime}ms`);
        console.log(`⚠️  Discover load time is slow (${discoverLoadTime}ms)`);
      }
    } catch (error: any) {
      issues.push(`Discover page error: ${error.message}`);
      console.log(`❌ DISCOVER ERROR: ${error.message}`);
    }

    // ==== STEP 4: LESSON VIEWING ====
    console.log('\n📍 STEP 4: LESSON VIEWING UX\n');
    try {
      // Try to click a lesson
      const startButton = page.locator('button:has-text("Start"), a:has-text("Start")').first();
      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/ux-audit-04-lesson.png', fullPage: true });

        const lessonUrl = page.url();
        console.log(`📍 Lesson URL: ${lessonUrl}`);

        const content = await page.textContent('body');
        const contentLength = content?.length || 0;

        // TEXT READABILITY CHECK
        console.log('\n📖 TEXT READABILITY CHECK:\n');
        const textElements = await page.locator('p, h1, h2, h3, div[class*="prose"]').all();

        let poorContrastCount = 0;
        let checkedCount = 0;

        for (let i = 0; i < Math.min(10, textElements.length); i++) {
          const elem = textElements[i];
          const text = await elem.textContent();
          if (text && text.trim().length > 20) {
            try {
              const color = await elem.evaluate(el => window.getComputedStyle(el).color);
              const bgColor = await elem.evaluate(el => {
                let element = el as HTMLElement;
                let bg = window.getComputedStyle(element).backgroundColor;
                let attempts = 0;
                while (bg === 'rgba(0, 0, 0, 0)' && element.parentElement && attempts < 10) {
                  element = element.parentElement;
                  bg = window.getComputedStyle(element).backgroundColor;
                  attempts++;
                }
                return bg;
              });

              const textRGB = color.match(/\d+/g);
              const bgRGB = bgColor.match(/\d+/g);

              if (textRGB && bgRGB) {
                const textLum = (parseInt(textRGB[0]) + parseInt(textRGB[1]) + parseInt(textRGB[2])) / 3;
                const bgLum = (parseInt(bgRGB[0]) + parseInt(bgRGB[1]) + parseInt(bgRGB[2])) / 3;
                const contrast = Math.abs(textLum - bgLum);

                checkedCount++;

                if (contrast < 90) {
                  console.log(`❌ Element ${checkedCount}: POOR contrast (${contrast.toFixed(0)}/255)`);
                  console.log(`   Text: "${text.substring(0, 40)}..."`);
                  console.log(`   Colors: text=${color}, bg=${bgColor}`);
                  poorContrastCount++;
                } else if (contrast < 120) {
                  console.log(`⚠️  Element ${checkedCount}: OK contrast (${contrast.toFixed(0)}/255)`);
                } else {
                  console.log(`✅ Element ${checkedCount}: GOOD contrast (${contrast.toFixed(0)}/255)`);
                }
              }
            } catch (e) {
              // Skip elements that can't be evaluated
            }
          }
        }

        if (poorContrastCount > 0) {
          issues.push(`${poorContrastCount} text elements have poor contrast (hard to read)`);
          console.log(`\n❌ TEXT READABILITY ISSUE: ${poorContrastCount} elements with poor contrast`);
        } else {
          console.log('\n✅ TEXT READABILITY: All checked elements have good contrast');
        }

        if (contentLength < 500) {
          issues.push('Lesson page has insufficient content');
          console.log('❌ INSUFFICIENT CONTENT');
        } else {
          console.log('✅ Lesson content loaded');
        }
      } else {
        console.log('⚠️  No lessons available to test viewing');
      }
    } catch (error: any) {
      issues.push(`Lesson viewing error: ${error.message}`);
      console.log(`❌ LESSON VIEWING ERROR: ${error.message}`);
    }

    // ==== FINAL REPORT ====
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 FINAL UX AUDIT REPORT\n');
    console.log('='.repeat(80));

    if (issues.length === 0) {
      console.log('\n✅ ALL UX CHECKS PASSED - APPLICATION IS READY FOR USERS!\n');
    } else {
      console.log(`\n❌ FOUND ${issues.length} UX ISSUES:\n`);
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
      console.log('\n⚠️  THESE ISSUES MUST BE FIXED BEFORE LAUNCH\n');
      throw new Error(`UX Audit failed with ${issues.length} issues`);
    }

    console.log('='.repeat(80) + '\n');
  });
});
