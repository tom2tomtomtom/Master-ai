import { test, expect } from '@playwright/test';

test.describe('Lessons Page Deep Debugging', () => {
  test('comprehensive lessons page analysis', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
    });

    // Track network requests
    const apiRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('lessons')) {
        console.log(`REQUEST: ${request.method()} ${request.url()}`);
        apiRequests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
      }
    });

    // Track responses
    page.on('response', async response => {
      if (response.url().includes('/api/') || response.url().includes('lessons')) {
        const status = response.status();
        console.log(`RESPONSE: ${status} ${response.url()}`);
        
        if (status >= 400) {
          try {
            const body = await response.text();
            console.log(`ERROR BODY: ${body}`);
          } catch (e) {
            console.log(`Could not read error body: ${e}`);
          }
        }
      }
    });

    // Track JavaScript errors
    page.on('pageerror', error => {
      console.log(`JS ERROR: ${error.message}`);
      console.log(`STACK: ${error.stack}`);
    });

    console.log('🔍 Starting deep analysis of lessons page...');

    // Step 1: Navigate to lessons page
    console.log('📍 Step 1: Navigating to lessons page');
    await page.goto('https://www.master-ai-learn.com/dashboard/lessons', {
      waitUntil: 'networkidle'
    });

    // Step 2: Check initial page state
    console.log('📍 Step 2: Checking initial page state');
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Step 3: Check for authentication
    console.log('📍 Step 3: Checking authentication state');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/auth/') || currentUrl.includes('/signin')) {
      console.log('🚨 REDIRECTED TO AUTH - User not authenticated');
      
      // Try to sign in
      console.log('📍 Attempting Google OAuth sign in...');
      await page.click('text=Continue with Google', { timeout: 5000 }).catch(() => {
        console.log('Google sign in button not found');
      });
      
      await page.waitForTimeout(2000);
      const newUrl = page.url();
      console.log(`URL after auth attempt: ${newUrl}`);
    }

    // Step 4: Check DOM structure
    console.log('📍 Step 4: Analyzing DOM structure');
    
    // Check for loading states
    const loadingElements = await page.locator('text=Loading').count();
    console.log(`Loading elements found: ${loadingElements}`);

    // Check for error messages  
    const errorElements = await page.locator('text=Error').count();
    console.log(`Error elements found: ${errorElements}`);

    // Check for lesson cards
    const lessonCards = await page.locator('[class*="card"], [class*="lesson"]').count();
    console.log(`Potential lesson cards found: ${lessonCards}`);

    // Check for specific lesson content
    const lessonTitles = await page.locator('text=Lesson, h1, h2, h3').count();
    console.log(`Elements with "Lesson" text: ${lessonTitles}`);

    // Step 5: Check page HTML content
    console.log('📍 Step 5: Analyzing page HTML content');
    const bodyHTML = await page.locator('body').innerHTML();
    
    // Check if lessons data is in HTML
    const hasLessonData = bodyHTML.includes('AI Tool Selection') || bodyHTML.includes('ChatGPT Email');
    console.log(`Lessons data in HTML: ${hasLessonData}`);
    
    // Check for specific patterns
    const hasStartLesson = bodyHTML.includes('Start Lesson');
    console.log(`"Start Lesson" buttons in HTML: ${hasStartLesson}`);
    
    const hasDifficultyBadges = bodyHTML.includes('beginner') || bodyHTML.includes('intermediate');
    console.log(`Difficulty badges in HTML: ${hasDifficultyBadges}`);

    // Step 6: Check API calls
    console.log('📍 Step 6: API calls analysis');
    console.log(`Total API requests made: ${apiRequests.length}`);
    apiRequests.forEach((req, i) => {
      console.log(`  ${i+1}. ${req.method} ${req.url}`);
    });

    // Step 7: Try direct API call
    console.log('📍 Step 7: Testing direct API access');
    try {
      const apiResponse = await page.request.get('https://www.master-ai-learn.com/api/lessons?page=1&limit=5');
      const apiStatus = apiResponse.status();
      console.log(`Direct API status: ${apiStatus}`);
      
      if (apiStatus === 200) {
        const apiData = await apiResponse.json();
        console.log(`API returned ${apiData.lessons?.length || 0} lessons`);
        console.log(`Total lessons in DB: ${apiData.pagination?.total || 'unknown'}`);
      } else {
        const errorText = await apiResponse.text();
        console.log(`API error: ${errorText}`);
      }
    } catch (e) {
      console.log(`API call failed: ${e}`);
    }

    // Step 8: Check React hydration
    console.log('📍 Step 8: Checking React hydration');
    
    // Wait for potential hydration
    await page.waitForTimeout(3000);
    
    // Check if content changed after hydration
    const bodyHTMLAfter = await page.locator('body').innerHTML();
    const contentChanged = bodyHTML !== bodyHTMLAfter;
    console.log(`Content changed after hydration: ${contentChanged}`);
    
    // Final check for visible lessons
    const visibleLessons = await page.locator('text=Lesson 0, text=Lesson 1, text=AI Tool Selection').count();
    console.log(`Visible lesson elements: ${visibleLessons}`);

    // Step 9: Screenshot for manual review
    console.log('📍 Step 9: Taking screenshot');
    await page.screenshot({ 
      path: '/tmp/lessons-debug.png', 
      fullPage: true 
    });
    console.log('Screenshot saved to /tmp/lessons-debug.png');

    // Summary
    console.log('\n🔍 DEBUGGING SUMMARY:');
    console.log(`- Authentication: ${currentUrl.includes('/auth/') ? 'FAILED' : 'OK'}`);
    console.log(`- Page loads: ${title ? 'OK' : 'FAILED'}`);
    console.log(`- API accessible: ${apiRequests.length > 0 ? 'OK' : 'NO CALLS'}`);
    console.log(`- Lesson data in HTML: ${hasLessonData ? 'YES' : 'NO'}`);
    console.log(`- Visible lessons: ${visibleLessons > 0 ? 'YES' : 'NO'}`);
    console.log(`- Loading states: ${loadingElements}`);
    console.log(`- Error states: ${errorElements}`);
  });
});
