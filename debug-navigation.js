const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track navigation
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('🧭 Navigation to:', frame.url());
    }
  });

  // Track console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });

  try {
    console.log('🌐 Initial navigation to sign-in page...');
    await page.goto('https://www.master-ai-learn.com/auth/signin', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    console.log('Current URL after initial load:', page.url());

    // Wait and see if there are any redirects
    console.log('⏳ Waiting 5 seconds to see if there are redirects...');
    await page.waitForTimeout(5000);
    
    console.log('Final URL:', page.url());

    // Check if we're still on the sign-in page
    if (page.url().includes('/auth/signin')) {
      console.log('✅ Still on sign-in page');
      
      // Check if form is visible
      const formExists = await page.$('form') !== null;
      const emailExists = await page.$('input[type="email"]') !== null;
      console.log('Form elements exist:', { formExists, emailExists });
      
      if (formExists && emailExists) {
        console.log('🔍 Form found, checking if interactive...');
        
        // Try very gentle interaction
        const emailField = page.locator('input[type="email"]').first();
        
        try {
          await emailField.click({ timeout: 3000 });
          console.log('✅ Email field is clickable');
          
          await emailField.fill('test@example.com');
          const value = await emailField.inputValue();
          console.log('✅ Email field accepts input:', value);
          
        } catch (error) {
          console.error('❌ Email field not interactive:', error.message);
          
          // Check what's blocking it
          const isVisible = await emailField.isVisible();
          const isEnabled = await emailField.isEnabled();
          const boundingBox = await emailField.boundingBox();
          
          console.log('Email field state:', {
            isVisible,
            isEnabled,
            boundingBox
          });
        }
      }
    } else {
      console.log('❌ Redirected away from sign-in page to:', page.url());
    }

    await page.screenshot({ path: 'debug-navigation.png', fullPage: true });
    console.log('📸 Screenshot saved');

  } catch (error) {
    console.error('❌ Navigation error:', error);
    await page.screenshot({ path: 'debug-navigation-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();