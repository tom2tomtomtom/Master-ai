import { test as setup, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-users';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const { email, password } = TEST_USERS.primary;

  console.log('🔐 Signing in with pre-seeded test user...');
  console.log('   Email:', email);

  // Navigate to signin page
  await page.goto('/auth/signin');
  await page.waitForLoadState('networkidle');

  // Fill signin form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);

  console.log('✅ Successfully authenticated!');

  // Save authentication state
  await page.context().storageState({ path: authFile });

  console.log('💾 Auth state saved to:', authFile);
});
