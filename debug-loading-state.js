const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🌐 Loading sign-in page...');
    await page.goto('https://www.master-ai-learn.com/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for React to hydrate
    await page.waitForTimeout(3000);

    console.log('🔍 Checking if form elements are disabled due to loading state...');
    
    // Check if elements are disabled
    const emailDisabled = await page.locator('input[type="email"]').isDisabled();
    const passwordDisabled = await page.locator('input[type="password"]').isDisabled();
    const submitDisabled = await page.locator('button[type="submit"]').isDisabled();
    const googleDisabled = await page.locator('button:has-text("Continue with Google")').isDisabled();
    
    console.log('Form element states:');
    console.log('  Email input disabled:', emailDisabled);
    console.log('  Password input disabled:', passwordDisabled);
    console.log('  Submit button disabled:', submitDisabled);
    console.log('  Google button disabled:', googleDisabled);
    
    // Check submit button text to see if it shows "Loading..."
    const submitText = await page.locator('button[type="submit"]').textContent();
    console.log('  Submit button text:', submitText?.trim());
    
    // Check if any loading indicators are visible
    const loadingIndicators = await page.locator('text=Loading').count();
    console.log('  "Loading" text count:', loadingIndicators);
    
    // Check console for any Supabase initialization errors
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('Supabase') || msg.text().includes('error') || msg.text().includes('Error')) {
        logs.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('\n📋 Relevant console messages:');
      logs.forEach(log => console.log('  ' + log));
    }
    
    // Try to inject some debug code to check React state
    const reactState = await page.evaluate(() => {
      // Try to find React components and check their loading state
      const buttons = document.querySelectorAll('button');
      const inputs = document.querySelectorAll('input');
      
      return {
        buttonsDisabled: Array.from(buttons).map(btn => ({
          text: btn.textContent?.trim(),
          disabled: btn.disabled
        })),
        inputsDisabled: Array.from(inputs).map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          disabled: input.disabled
        }))
      };
    });
    
    console.log('\n🔧 Detailed element states:');
    console.log('Buttons:', JSON.stringify(reactState.buttonsDisabled, null, 2));
    console.log('Inputs:', JSON.stringify(reactState.inputsDisabled, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();