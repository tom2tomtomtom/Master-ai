import { test, expect } from '@playwright/test';

test.describe('Real User Flow', () => {
  test('complete user journey to lessons page', async ({ page }) => {
    console.log('🔍 Testing complete user journey...');

    // Enable console logging
    page.on('console', msg => {
      console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
    });

    // Step 1: Go directly to the site homepage
    console.log('📍 Step 1: Visiting homepage');
    await page.goto('https://www.master-ai-learn.com');
    await page.waitForLoadState('networkidle');

    // Take screenshot of homepage
    await page.screenshot({ path: '/tmp/homepage.png' });
    console.log('Homepage screenshot saved');

    // Step 2: Try to access lessons directly  
    console.log('📍 Step 2: Accessing lessons page directly');
    await page.goto('https://www.master-ai-learn.com/dashboard/lessons');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of what we get
    await page.screenshot({ path: '/tmp/lessons-attempt.png' });
    console.log('Lessons attempt screenshot saved');
    
    const currentUrl = page.url();
    console.log(`Current URL after lessons attempt: ${currentUrl}`);

    // Step 3: Check what we actually see
    console.log('📍 Step 3: Analyzing what user sees');
    
    // Check if we're on a sign-in page
    const isSignInPage = currentUrl.includes('signin') || currentUrl.includes('auth') || 
                        currentUrl.includes('google.com') || 
                        await page.locator('text=Sign in, text=Continue with Google').count() > 0;
    
    console.log(`Is on sign-in page: ${isSignInPage}`);
    
    if (isSignInPage) {
      console.log('🚨 USER IS REDIRECTED TO SIGN IN');
      
      // Check for sign in options
      const googleButton = await page.locator('text=Continue with Google, [class*="google"], [data-provider="google"]').count();
      console.log(`Google sign-in buttons found: ${googleButton}`);
      
      // Get page title and content
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
    } else {
      console.log('✅ USER CAN ACCESS LESSONS DIRECTLY');
      
      // Check for lessons content
      const lessonElements = await page.locator('text=Lesson, [class*="lesson"], [class*="card"]').count();
      console.log(`Lesson elements found: ${lessonElements}`);
      
      // Check for specific lesson titles
      const lessonTitles = await page.locator('text=AI Tool Selection, text=ChatGPT Email, text=Start Lesson').count();
      console.log(`Specific lesson content found: ${lessonTitles}`);
    }

    // Step 4: Check the actual HTML content on lessons page
    console.log('📍 Step 4: Checking lessons page HTML content');
    
    // Go back to lessons page if we were redirected
    if (isSignInPage) {
      await page.goto('https://www.master-ai-learn.com/dashboard/lessons');
      await page.waitForTimeout(2000);
    }
    
    const bodyHTML = await page.locator('body').innerHTML();
    
    // Check for server-rendered content
    const hasServerContent = bodyHTML.includes('AI Tool Selection') || 
                             bodyHTML.includes('ChatGPT Email') ||
                             bodyHTML.includes('Start Lesson');
    
    console.log(`Server-rendered lesson content present: ${hasServerContent}`);
    
    // Check for loading or error states
    const hasLoading = bodyHTML.includes('Loading') || bodyHTML.includes('loading');
    const hasError = bodyHTML.includes('Error') || bodyHTML.includes('error');
    
    console.log(`Loading states: ${hasLoading}`);
    console.log(`Error states: ${hasError}`);
    
    // Step 5: Test API access without authentication
    console.log('📍 Step 5: Testing API access');
    try {
      const apiResponse = await fetch('https://www.master-ai-learn.com/api/lessons?page=1&limit=3');
      console.log(`API status: ${apiResponse.status}`);
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log(`API returned ${data.lessons?.length || 0} lessons`);
      } else {
        const errorText = await apiResponse.text();
        console.log(`API error: ${errorText}`);
      }
    } catch (e) {
      console.log(`API call failed: ${e}`);
    }

    // Step 6: Final summary
    console.log('\n🔍 USER EXPERIENCE SUMMARY:');
    console.log(`- Homepage accessible: ${!currentUrl.includes('error')}`);
    console.log(`- Lessons page redirects to auth: ${isSignInPage}`);
    console.log(`- Server content in HTML: ${hasServerContent}`);
    console.log(`- Content blocked by client auth: ${!hasServerContent && isSignInPage}`);
    
    // Final screenshot
    await page.screenshot({ path: '/tmp/final-state.png' });
    console.log('Final state screenshot saved');
  });
});
