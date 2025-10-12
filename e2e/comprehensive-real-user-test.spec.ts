import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

const PRODUCTION_URL = 'https://master-ai-saas-dpvb3aay6-tom-hydes-projects.vercel.app';
const REAL_USER_EMAIL = 'tomh@redbaez.com';
const REAL_USER_PASSWORD = 'Wijlre2010!';

test.describe('Comprehensive Real User Experience Tests', () => {

  test('Complete User Journey: Login → Dashboard → Discover → Lesson', async ({ page }) => {
    console.log('🎯 COMPREHENSIVE REAL USER TEST\n');
    console.log('Testing with real user:', REAL_USER_EMAIL);
    console.log('Production URL:', PRODUCTION_URL);
    console.log('='.repeat(80));

    // ============================================================================
    // STEP 1: LOGIN
    // ============================================================================
    console.log('\n📍 STEP 1: USER LOGIN');
    console.log('-'.repeat(80));

    const loginStart = Date.now();
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');
    const loginPageLoadTime = Date.now() - loginStart;
    console.log(`⏱️  Login page load time: ${loginPageLoadTime}ms`);

    await page.screenshot({ path: 'test-results/real-user-01-signin.png', fullPage: true });

    // Fill credentials
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(REAL_USER_EMAIL);
    console.log('✅ Email filled');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(REAL_USER_PASSWORD);
    console.log('✅ Password filled');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    console.log('✅ Login submitted');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const postLoginUrl = page.url();
    console.log(`📍 Post-login URL: ${postLoginUrl}`);

    if (postLoginUrl.includes('/auth/')) {
      throw new Error('❌ LOGIN FAILED - Still on auth page');
    }
    console.log('✅ Login successful - redirected from auth');

    // ============================================================================
    // STEP 2: DASHBOARD ANALYSIS
    // ============================================================================
    console.log('\n📍 STEP 2: DASHBOARD ANALYSIS');
    console.log('-'.repeat(80));

    const dashboardStart = Date.now();
    await page.goto(`${PRODUCTION_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const dashboardLoadTime = Date.now() - dashboardStart;
    console.log(`⏱️  Dashboard load time: ${dashboardLoadTime}ms`);

    await page.screenshot({ path: 'test-results/real-user-02-dashboard.png', fullPage: true });

    const dashboardContent = await page.textContent('body');
    const dashboardLength = dashboardContent?.length || 0;
    console.log(`📄 Dashboard content length: ${dashboardLength} characters`);

    // Check for actual dashboard elements
    const hasGreeting = dashboardContent?.toLowerCase().includes('good') ||
                       dashboardContent?.toLowerCase().includes('welcome');
    const hasDashboardWord = dashboardContent?.toLowerCase().includes('dashboard');
    const hasProgress = dashboardContent?.toLowerCase().includes('progress');
    const hasLessons = dashboardContent?.toLowerCase().includes('lesson');

    console.log(`   Has greeting: ${hasGreeting}`);
    console.log(`   Has "dashboard": ${hasDashboardWord}`);
    console.log(`   Has "progress": ${hasProgress}`);
    console.log(`   Has "lesson": ${hasLessons}`);

    // Count visible elements
    const headings = await page.locator('h1, h2, h3').count();
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    console.log(`   Headings found: ${headings}`);
    console.log(`   Buttons found: ${buttons}`);
    console.log(`   Links found: ${links}`);

    if (dashboardLength < 1000) {
      console.log('⚠️  WARNING: Dashboard content seems minimal');
      console.log('Content preview:', dashboardContent?.substring(0, 500));
    } else {
      console.log('✅ Dashboard has substantial content');
    }

    // ============================================================================
    // STEP 3: DISCOVER PAGE
    // ============================================================================
    console.log('\n📍 STEP 3: DISCOVER PAGE');
    console.log('-'.repeat(80));

    const discoverStart = Date.now();
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for lessons to load
    const discoverLoadTime = Date.now() - discoverStart;
    console.log(`⏱️  Discover page load time: ${discoverLoadTime}ms`);

    await page.screenshot({ path: 'test-results/real-user-03-discover.png', fullPage: true });

    const discoverContent = await page.textContent('body');
    const lessonNumbers = discoverContent?.match(/lesson \d+/gi);
    console.log(`📚 Lesson mentions found: ${lessonNumbers?.length || 0}`);

    // Look for lesson cards
    const lessonCards = await page.locator('[data-testid="lesson-card"], article, [class*="lesson"]').count();
    console.log(`🎴 Lesson card elements: ${lessonCards}`);

    // Look for Start buttons
    const startButtons = await page.locator('button:has-text("Start")').count();
    console.log(`▶️  "Start" buttons found: ${startButtons}`);

    if (startButtons === 0) {
      console.log('⚠️  WARNING: No Start buttons found - lessons may not be displayed');
    } else {
      console.log('✅ Lessons are displayed with Start buttons');
    }

    // ============================================================================
    // STEP 4: CLICK AND VIEW LESSON
    // ============================================================================
    console.log('\n📍 STEP 4: VIEW LESSON DETAIL');
    console.log('-'.repeat(80));

    const firstStartButton = page.locator('button:has-text("Start")').first();
    if (await firstStartButton.count() > 0) {
      await firstStartButton.click();
      console.log('✅ Clicked first lesson Start button');

      const lessonStart = Date.now();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      const lessonLoadTime = Date.now() - lessonStart;
      console.log(`⏱️  Lesson page load time: ${lessonLoadTime}ms`);

      const lessonUrl = page.url();
      console.log(`📍 Lesson URL: ${lessonUrl}`);

      await page.screenshot({ path: 'test-results/real-user-04-lesson-page.png', fullPage: true });

      // ============================================================================
      // STEP 5: TEXT READABILITY ANALYSIS
      // ============================================================================
      console.log('\n📍 STEP 5: TEXT READABILITY ANALYSIS');
      console.log('-'.repeat(80));

      const lessonContent = await page.textContent('body');
      console.log(`📄 Lesson content length: ${lessonContent?.length || 0} characters`);

      // Check for lesson structure
      const hasTitle = lessonContent?.toLowerCase().includes('lesson');
      const hasBackButton = lessonContent?.includes('Back to Discover');
      const hasDescription = lessonContent && lessonContent.length > 500;

      console.log(`   Has lesson title: ${hasTitle}`);
      console.log(`   Has back navigation: ${hasBackButton}`);
      console.log(`   Has substantial content: ${hasDescription}`);

      // Analyze text colors by checking computed styles
      const paragraphs = await page.locator('p').all();
      console.log(`\n🎨 CHECKING TEXT CONTRAST:`);

      if (paragraphs.length > 0) {
        const firstP = paragraphs[0];
        const color = await firstP.evaluate(el => window.getComputedStyle(el).color);
        const bgColor = await firstP.evaluate(el => {
          let element = el;
          let bg = window.getComputedStyle(element).backgroundColor;
          while (bg === 'rgba(0, 0, 0, 0)' && element.parentElement) {
            element = element.parentElement;
            bg = window.getComputedStyle(element).backgroundColor;
          }
          return bg;
        });

        console.log(`   Text color: ${color}`);
        console.log(`   Background: ${bgColor}`);

        // Simple contrast check (RGB values)
        const textRGB = color.match(/\d+/g);
        const bgRGB = bgColor.match(/\d+/g);

        if (textRGB && bgRGB) {
          const textLuminance = (parseInt(textRGB[0]) + parseInt(textRGB[1]) + parseInt(textRGB[2])) / 3;
          const bgLuminance = (parseInt(bgRGB[0]) + parseInt(bgRGB[1]) + parseInt(bgRGB[2])) / 3;
          const contrast = Math.abs(textLuminance - bgLuminance);

          console.log(`   Text luminance: ${textLuminance.toFixed(0)}`);
          console.log(`   Background luminance: ${bgLuminance.toFixed(0)}`);
          console.log(`   Contrast difference: ${contrast.toFixed(0)}/255`);

          if (contrast < 100) {
            console.log('   ❌ POOR CONTRAST - Text may be hard to read');
          } else if (contrast < 150) {
            console.log('   ⚠️  MODERATE CONTRAST - Could be improved');
          } else {
            console.log('   ✅ GOOD CONTRAST - Text should be readable');
          }
        }
      }

      // Check heading visibility
      const h1 = await page.locator('h1').first();
      if (await h1.count() > 0) {
        const h1Text = await h1.textContent();
        const h1Color = await h1.evaluate(el => window.getComputedStyle(el).color);
        console.log(`\n   H1 text: "${h1Text?.substring(0, 50)}..."`);
        console.log(`   H1 color: ${h1Color}`);
      }

      // ============================================================================
      // STEP 6: INTERACTION TESTING
      // ============================================================================
      console.log('\n📍 STEP 6: INTERACTION TESTING');
      console.log('-'.repeat(80));

      // Test back navigation
      const backLink = page.locator('text="Back to Discover"').first();
      if (await backLink.count() > 0) {
        console.log('✅ Back to Discover button found');
      } else {
        console.log('❌ Back to Discover button NOT found');
      }

      // Check for signup CTAs
      const signupButtons = await page.locator('text=/sign up/i, text=/sign in/i').count();
      console.log(`🔑 Signup/Signin CTAs found: ${signupButtons}`);

    } else {
      console.log('❌ Could not find any Start buttons to test lesson viewing');
    }

    // ============================================================================
    // STEP 7: MY LESSONS PAGE
    // ============================================================================
    console.log('\n📍 STEP 7: MY LESSONS PAGE');
    console.log('-'.repeat(80));

    const myLessonsStart = Date.now();
    await page.goto(`${PRODUCTION_URL}/dashboard/lessons`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const myLessonsLoadTime = Date.now() - myLessonsStart;
    console.log(`⏱️  My Lessons load time: ${myLessonsLoadTime}ms`);

    await page.screenshot({ path: 'test-results/real-user-05-my-lessons.png', fullPage: true });

    const myLessonsContent = await page.textContent('body');
    console.log(`📄 My Lessons content length: ${myLessonsContent?.length || 0} characters`);

    // ============================================================================
    // PERFORMANCE SUMMARY
    // ============================================================================
    console.log('\n📊 PERFORMANCE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Login page:     ${loginPageLoadTime}ms ${loginPageLoadTime < 2000 ? '✅' : '⚠️'}`);
    console.log(`Dashboard:      ${dashboardLoadTime}ms ${dashboardLoadTime < 3000 ? '✅' : '⚠️'}`);
    console.log(`Discover:       ${discoverLoadTime}ms ${discoverLoadTime < 3000 ? '✅' : '⚠️'}`);
    if (lessonLoadTime !== undefined) {
      console.log(`Lesson detail:  ${lessonLoadTime}ms ${lessonLoadTime < 3000 ? '✅' : '⚠️'}`);
    }
    console.log(`My Lessons:     ${myLessonsLoadTime}ms ${myLessonsLoadTime < 3000 ? '✅' : '⚠️'}`);

    const avgLoadTime = (loginPageLoadTime + dashboardLoadTime + discoverLoadTime + myLessonsLoadTime) / 4;
    console.log(`\nAverage load time: ${avgLoadTime.toFixed(0)}ms`);

    if (avgLoadTime > 3000) {
      console.log('⚠️  Overall performance could be improved');
    } else {
      console.log('✅ Good overall performance');
    }

    // ============================================================================
    // FINAL VERDICT
    // ============================================================================
    console.log('\n🎯 FINAL VERDICT');
    console.log('='.repeat(80));

    let issuesFound = 0;
    const issues: string[] = [];

    if (dashboardLength < 1000) {
      issues.push('Dashboard appears empty or minimal');
      issuesFound++;
    }

    if (startButtons === 0) {
      issues.push('No lesson cards displayed on Discover page');
      issuesFound++;
    }

    if (avgLoadTime > 5000) {
      issues.push('Slow page load times');
      issuesFound++;
    }

    if (issuesFound === 0) {
      console.log('✅ ALL TESTS PASSED - Application is working correctly!');
    } else {
      console.log(`❌ ${issuesFound} ISSUE(S) FOUND:`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      throw new Error(`Found ${issuesFound} issues that need to be fixed`);
    }

    console.log('\n' + '='.repeat(80));
  });

  test('Text Readability Spot Check', async ({ page }) => {
    console.log('\n🔍 DETAILED TEXT READABILITY CHECK\n');

    // Login first
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
    await page.waitForTimeout(2000);

    // Go to a lesson
    await page.goto(`${PRODUCTION_URL}/discover`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const firstStart = page.locator('button:has-text("Start")').first();
    if (await firstStart.count() > 0) {
      await firstStart.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Take a focused screenshot of the content area
      const contentArea = page.locator('main, [role="main"], article').first();
      if (await contentArea.count() > 0) {
        await contentArea.screenshot({ path: 'test-results/real-user-text-closeup.png' });
        console.log('✅ Captured close-up of lesson content for readability check');
      }

      // Check every paragraph's contrast
      const allParagraphs = await page.locator('p, div[class*="content"], div[class*="prose"]').all();
      console.log(`\nAnalyzing ${allParagraphs.length} text elements...`);

      let poorContrastCount = 0;
      for (let i = 0; i < Math.min(5, allParagraphs.length); i++) {
        const elem = allParagraphs[i];
        const text = await elem.textContent();
        if (text && text.length > 20) {
          const color = await elem.evaluate(el => window.getComputedStyle(el).color);
          console.log(`\nElement ${i + 1}:`);
          console.log(`  Text: "${text.substring(0, 60)}..."`);
          console.log(`  Color: ${color}`);

          // Check if it's too light (close to white)
          const rgb = color.match(/\d+/g);
          if (rgb) {
            const avg = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
            if (avg > 180) {
              console.log(`  ❌ TEXT TOO LIGHT (${avg.toFixed(0)}/255)`);
              poorContrastCount++;
            } else {
              console.log(`  ✅ Good darkness (${avg.toFixed(0)}/255)`);
            }
          }
        }
      }

      if (poorContrastCount > 0) {
        throw new Error(`Found ${poorContrastCount} elements with poor text contrast!`);
      }
    }
  });
});
