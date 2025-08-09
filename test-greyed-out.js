const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to https://www.master-ai-learn.com/auth/signin');
    await page.goto('https://www.master-ai-learn.com/auth/signin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Take initial screenshot
    await page.screenshot({ path: 'greyed-out-initial.png', fullPage: true });
    console.log('📸 Initial screenshot saved');

    // Check for loading states or overlays
    const loadingElements = await page.locator('[data-loading], .loading, .spinner, [aria-busy="true"]').count();
    console.log('🔄 Loading elements found:', loadingElements);

    // Check if form elements are disabled
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Sign In")');
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');

    console.log('🔍 Checking form element states:');
    
    if (await emailInput.count() > 0) {
      const emailDisabled = await emailInput.isDisabled();
      const emailVisible = await emailInput.isVisible();
      console.log('📧 Email input - Disabled:', emailDisabled, 'Visible:', emailVisible);
      
      // Check CSS properties
      const emailOpacity = await emailInput.evaluate(el => window.getComputedStyle(el).opacity);
      const emailPointerEvents = await emailInput.evaluate(el => window.getComputedStyle(el).pointerEvents);
      console.log('📧 Email CSS - Opacity:', emailOpacity, 'Pointer Events:', emailPointerEvents);
    }

    if (await passwordInput.count() > 0) {
      const passwordDisabled = await passwordInput.isDisabled();
      const passwordVisible = await passwordInput.isVisible();
      console.log('🔐 Password input - Disabled:', passwordDisabled, 'Visible:', passwordVisible);
    }

    if (await signInButton.count() > 0) {
      const buttonDisabled = await signInButton.isDisabled();
      const buttonVisible = await signInButton.isVisible();
      console.log('🔘 Sign in button - Disabled:', buttonDisabled, 'Visible:', buttonVisible);
      
      // Check button CSS
      const buttonOpacity = await signInButton.evaluate(el => window.getComputedStyle(el).opacity);
      const buttonPointerEvents = await signInButton.evaluate(el => window.getComputedStyle(el).pointerEvents);
      const buttonCursor = await signInButton.evaluate(el => window.getComputedStyle(el).cursor);
      console.log('🔘 Button CSS - Opacity:', buttonOpacity, 'Pointer Events:', buttonPointerEvents, 'Cursor:', buttonCursor);
    }

    if (await googleButton.count() > 0) {
      const googleDisabled = await googleButton.isDisabled();
      const googleVisible = await googleButton.isVisible();
      console.log('🔵 Google button - Disabled:', googleDisabled, 'Visible:', googleVisible);
    }

    // Check for any overlays or blocking elements
    const overlays = await page.locator('.overlay, .modal, .backdrop').count();
    console.log('🎭 Overlay elements found:', overlays);

    // Try to interact with the form
    console.log('🖱️ Testing interactions:');
    
    if (await emailInput.count() > 0) {
      try {
        await emailInput.click({ timeout: 5000 });
        await emailInput.fill('test@example.com');
        const emailValue = await emailInput.inputValue();
        console.log('📧 Email interaction - Success, value:', emailValue);
      } catch (error) {
        console.log('📧 Email interaction - Failed:', error.message);
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'greyed-out-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');

    // Check page title and content
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const pageContent = await page.textContent('body');
    if (pageContent.includes('Welcome back') || pageContent.includes('Sign in')) {
      console.log('✅ Sign-in content detected');
    } else {
      console.log('❌ Sign-in content not found');
      console.log('First 200 chars of page:', pageContent.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'greyed-out-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();