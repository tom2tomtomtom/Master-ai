const { chromium } = require('playwright');

async function testMinimal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set a shorter timeout for testing
  page.setDefaultTimeout(10000);
  
  try {
    console.log('Loading homepage with minimal timeout...');
    await page.goto('https://www.master-ai-learn.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('Page loaded successfully');
    
    // Check if the page contains the expected content
    const title = await page.textContent('h1');
    console.log('Found title:', title);
    
    // Check for any JavaScript errors in the console
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a moment for any async operations
    await page.waitForTimeout(2000);
    
    console.log('Console logs:');
    logs.forEach(log => console.log('  -', log));
    
  } catch (error) {
    console.error('Error loading page:', error.message);
  }
  
  await browser.close();
}

testMinimal().catch(console.error);