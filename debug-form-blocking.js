const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture all console messages and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('Page Error:', error.message);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.error('Request Failed:', request.url(), request.failure()?.errorText);
  });

  try {
    console.log('🌐 Loading https://www.master-ai-learn.com/auth/signin');
    await page.goto('https://www.master-ai-learn.com/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for React to hydrate
    await page.waitForTimeout(3000);

    console.log('🔍 Checking for form elements...');
    
    // Check if elements exist in DOM
    const emailExists = await page.$('input[type="email"]') !== null;
    const passwordExists = await page.$('input[type="password"]') !== null;
    const submitExists = await page.$('button[type="submit"]') !== null;
    
    console.log('DOM Elements:', { emailExists, passwordExists, submitExists });

    // Try to click and type in email field
    console.log('🖱️ Attempting to interact with email field...');
    
    const emailField = page.locator('input[type="email"]');
    
    if (await emailField.count() > 0) {
      try {
        console.log('Clicking email field...');
        await emailField.click({ timeout: 10000 });
        
        console.log('Typing in email field...');
        await emailField.fill('test@example.com', { timeout: 10000 });
        
        const emailValue = await emailField.inputValue();
        console.log('✅ Email field working - value:', emailValue);
        
        // Try password field
        const passwordField = page.locator('input[type="password"]');
        if (await passwordField.count() > 0) {
          console.log('Clicking password field...');
          await passwordField.click({ timeout: 10000 });
          
          console.log('Typing in password field...');
          await passwordField.fill('testpassword123', { timeout: 10000 });
          
          const passwordValue = await passwordField.inputValue();
          console.log('✅ Password field working - length:', passwordValue.length);
          
          // Try to submit
          const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Sign in")');
          if (await submitButton.count() > 0) {
            console.log('Found submit button, attempting click...');
            await submitButton.click({ timeout: 10000 });
            console.log('✅ Submit button clicked');
            
            // Wait to see what happens
            await page.waitForTimeout(5000);
          }
        }
        
      } catch (error) {
        console.error('❌ Form interaction failed:', error.message);
        
        // Check if element is actually interactive
        const emailBoundingBox = await emailField.boundingBox();
        const emailIsVisible = await emailField.isVisible();
        const emailIsEnabled = await emailField.isEnabled();
        
        console.log('Email field debug:', {
          boundingBox: emailBoundingBox,
          isVisible: emailIsVisible,
          isEnabled: emailIsEnabled
        });
      }
    } else {
      console.error('❌ No email field found');
    }

    // Take final screenshot
    await page.screenshot({ path: 'debug-blocked-form.png', fullPage: true });
    console.log('📸 Debug screenshot saved');

    // Check for any overlays or blocking elements
    const allElements = await page.$$('*');
    console.log('Total DOM elements:', allElements.length);
    
    // Check if there are invisible overlays
    const overlays = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overlayElements = [];
      
      for (let el of elements) {
        const style = window.getComputedStyle(el);
        if (
          (style.position === 'fixed' || style.position === 'absolute') &&
          parseInt(style.zIndex) > 100 &&
          (style.display !== 'none' && style.visibility !== 'hidden')
        ) {
          overlayElements.push({
            tag: el.tagName,
            className: el.className,
            zIndex: style.zIndex,
            opacity: style.opacity
          });
        }
      }
      return overlayElements;
    });
    
    if (overlays.length > 0) {
      console.log('🎭 High z-index elements found:', overlays);
    }

  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    console.log('\n📋 Summary:');
    console.log('JavaScript Errors:', errors.length);
    console.log('Console Messages:', logs.length);
    
    if (errors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      errors.forEach(error => console.log('  -', error));
    }
    
    await browser.close();
  }
})();