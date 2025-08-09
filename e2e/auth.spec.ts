import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('sign in page should not show GitHub OAuth button', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Should show only Google OAuth button (if configured) or email/password form
    await expect(page.locator('button:has-text("Continue with GitHub")')).not.toBeVisible();
    
    // Should show Google button or email form
    const hasGoogleButton = await page.locator('button:has-text("Continue with Google")').isVisible();
    const hasEmailForm = await page.locator('input[type="email"]').isVisible();
    
    expect(hasGoogleButton || hasEmailForm).toBeTruthy();
  });

  test('should show proper error handling for missing OAuth providers', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check if the providers API endpoint works
    const response = await page.request.get('/api/auth/providers');
    expect(response.ok()).toBeTruthy();
    
    const providers = await response.json();
    expect(providers).toHaveProperty('success');
    expect(providers).toHaveProperty('providers');
  });

  test('privacy and terms pages should exist (no 404)', async ({ page }) => {
    // Pages are now deployed and working
    // Test privacy page
    await page.goto('/privacy');
    await expect(page.locator('h1:has-text("Privacy Policy")')).toBeVisible();
    expect(page.url()).toContain('/privacy');
    
    // Test terms page  
    await page.goto('/terms');
    await expect(page.locator('h1:has-text("Terms of Service")')).toBeVisible();
    expect(page.url()).toContain('/terms');
  });

  test('email/password form should be functional', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Should have email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible();
    
    // Test form validation
    const submitButton = page.locator('button[type="submit"]:has-text("Sign In")');
    await submitButton.click();
    
    // Should show validation message for empty fields (adjust selector)
    await expect(page.locator('text="Please fill in all fields" >> first').or(page.locator('[role="alert"]')).or(page.locator('.error'))).toBeVisible({ timeout: 5000 });
  });

  test('OAuth callback error should not occur when clicking available providers', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // If Google button is visible, clicking it should not cause immediate error
    const googleButton = page.locator('button:has-text("Continue with Google")');
    
    if (await googleButton.isVisible()) {
      // Set up a listener for navigation errors
      const errorPromise = new Promise<string>((resolve) => {
        page.on('pageerror', (error) => resolve(error.message));
      });
      
      await googleButton.click();
      
      // Wait a bit to see if we get redirected properly or get an error
      await page.waitForTimeout(2000);
      
      // Should not stay on signin page with OAuthCallback error
      const url = page.url();
      const hasOAuthError = url.includes('error=OAuthCallback');
      
      expect(hasOAuthError).toBeFalsy();
    }
  });
});