#!/bin/bash

# Auth setup
cat > e2e/auth.setup.ts << 'AUTHEOF'
import { test as setup, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-users';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const { email, password, name } = TEST_USERS.primary;
  
  console.log('🔐 Setting up authentication...');
  
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.fill('input[name="name"]', name);
  
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(auth\/welcome|auth\/signin|dashboard)/, { timeout: 10000 });
  
  if (page.url().includes('/auth/signin')) {
    console.log('✅ User already exists, signing in...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|auth\/welcome)/, { timeout: 10000 });
  }
  
  if (page.url().includes('/auth/welcome')) {
    console.log('👋 On welcome page, navigating to dashboard...');
    await page.click('a[href="/dashboard"], button:has-text("Get Started")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  }
  
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  
  console.log('✅ Successfully authenticated!');
  await page.context().storageState({ path: authFile });
  console.log('💾 Auth state saved!');
});
AUTHEOF

# Base Page Object
cat > e2e/pages/BasePage.ts << 'BASEPAGEEOF'
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForToast(message?: string) {
    if (message) {
      await this.page.waitForSelector(\`text=\${message}\`, { timeout: 5000 });
    } else {
      await this.page.waitForSelector('[role="status"], [role="alert"]', { timeout: 5000 });
    }
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: \`test-results/\${name}.png\`, fullPage: true });
  }
}
BASEPAGEEOF

echo "✅ Core test files created!"
