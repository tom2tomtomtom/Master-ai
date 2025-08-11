const { chromium } = require('playwright');

async function debugProductionSite() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

  // Capture network failures
  const networkFailures = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkFailures.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('Testing homepage...');
    await page.goto('https://www.master-ai-learn.com', { waitUntil: 'networkidle' });
    
    // Check page title
    const title = await page.title();
    console.log('Homepage title:', title);

    // Test dashboard access (should redirect to auth if not logged in)
    console.log('Testing dashboard access...');
    await page.goto('https://www.master-ai-learn.com/dashboard', { waitUntil: 'networkidle' });
    
    // Test auth signup page
    console.log('Testing auth signup page...');
    await page.goto('https://www.master-ai-learn.com/auth/signup', { waitUntil: 'networkidle' });
    
    // Test auth signin page
    console.log('Testing auth signin page...');  
    await page.goto('https://www.master-ai-learn.com/auth/signin', { waitUntil: 'networkidle' });

    // Wait a bit for any lazy-loaded errors
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Navigation error:', error);
  }

  // Report findings
  console.log('\n=== DEBUGGING REPORT ===');
  
  console.log('\nConsole Errors:', consoleErrors.length);
  consoleErrors.forEach((error, i) => {
    console.log(`${i + 1}. ${error.text} (${error.location?.url}:${error.location?.lineNumber})`);
  });

  console.log('\nPage Errors:', pageErrors.length);
  pageErrors.forEach((error, i) => {
    console.log(`${i + 1}. ${error.message}`);
    if (error.stack) console.log(`   Stack: ${error.stack.slice(0, 200)}...`);
  });

  console.log('\nNetwork Failures:', networkFailures.length);
  networkFailures.forEach((failure, i) => {
    console.log(`${i + 1}. ${failure.status} ${failure.statusText} - ${failure.url}`);
  });

  await browser.close();
}

debugProductionSite().catch(console.error);