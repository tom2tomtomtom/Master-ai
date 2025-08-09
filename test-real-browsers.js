const { webkit, chromium } = require('playwright');

async function testInBrowser(browserType, browserName) {
  console.log(`\n🌐 Testing in ${browserName}...`);
  
  const browser = await browserType.launch({ 
    headless: false,
    slowMo: 1000 // Slow down to see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  // Track console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('error')) {
      console.log(`${browserName} Console ${msg.type()}: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.error(`${browserName} Page Error: ${error.message}`);
  });

  try {
    console.log(`Loading https://www.master-ai-learn.com/auth/signin in ${browserName}...`);
    await page.goto('https://www.master-ai-learn.com/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait longer for everything to load
    await page.waitForTimeout(5000);

    // Take screenshot immediately
    await page.screenshot({ path: `signin-${browserName.toLowerCase()}.png`, fullPage: true });
    console.log(`📸 Screenshot saved for ${browserName}`);

    // Check form state
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    const googleButton = page.locator('button:has-text("Google")');

    const emailExists = await emailField.count() > 0;
    const emailDisabled = emailExists ? await emailField.isDisabled() : 'N/A';
    const emailVisible = emailExists ? await emailField.isVisible() : 'N/A';
    
    const passwordExists = await passwordField.count() > 0;
    const passwordDisabled = passwordExists ? await passwordField.isDisabled() : 'N/A';
    
    const submitExists = await submitButton.count() > 0;
    const submitDisabled = submitExists ? await submitButton.isDisabled() : 'N/A';
    const submitText = submitExists ? await submitButton.textContent() : 'N/A';
    
    const googleExists = await googleButton.count() > 0;
    const googleDisabled = googleExists ? await googleButton.isDisabled() : 'N/A';

    console.log(`${browserName} Form State:`);
    console.log(`  Email: exists=${emailExists}, disabled=${emailDisabled}, visible=${emailVisible}`);
    console.log(`  Password: exists=${passwordExists}, disabled=${passwordDisabled}`);
    console.log(`  Submit: exists=${submitExists}, disabled=${submitDisabled}, text="${submitText?.trim()}"`);
    console.log(`  Google: exists=${googleExists}, disabled=${googleDisabled}`);

    // Try to actually interact with the form
    if (emailExists && !emailDisabled) {
      try {
        console.log(`${browserName}: Attempting to click and type in email field...`);
        await emailField.click({ timeout: 5000 });
        await emailField.fill('test@example.com', { timeout: 5000 });
        const emailValue = await emailField.inputValue();
        console.log(`${browserName}: ✅ Email input successful: ${emailValue}`);
      } catch (error) {
        console.log(`${browserName}: ❌ Email input failed: ${error.message}`);
      }
    }

    // Check CSS properties that might cause greyout
    if (emailExists) {
      const emailStyles = await emailField.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          opacity: styles.opacity,
          pointerEvents: styles.pointerEvents,
          cursor: styles.cursor,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          filter: styles.filter
        };
      });
      console.log(`${browserName} Email CSS:`, emailStyles);
    }

    if (submitExists) {
      const submitStyles = await submitButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          opacity: styles.opacity,
          pointerEvents: styles.pointerEvents,
          cursor: styles.cursor,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          filter: styles.filter
        };
      });
      console.log(`${browserName} Submit Button CSS:`, submitStyles);
    }

  } catch (error) {
    console.error(`${browserName} Error:`, error.message);
    await page.screenshot({ path: `signin-${browserName.toLowerCase()}-error.png`, fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log(`${browserName} browser left open for inspection. Close manually.`);
    // Don't close browser - await browser.close();
  }
}

(async () => {
  try {
    // Test in Safari (WebKit)
    await testInBrowser(webkit, 'Safari');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test in Chrome
    await testInBrowser(chromium, 'Chrome');
    
    console.log('\n✅ Testing complete. Check screenshots and browser windows.');
    console.log('Both browsers are left open for manual inspection.');
    
  } catch (error) {
    console.error('Test runner error:', error);
  }
})();