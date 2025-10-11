import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
  }

  async navigate() {
    await this.goto('/dashboard');
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await this.page.waitForLoadState('networkidle');

    // Wait for dashboard content to load (stats or empty state)
    await this.page.waitForFunction(() => {
      const text = document.body.textContent || '';
      return text.includes('Good morning') ||
             text.includes('Good afternoon') ||
             text.includes('Good evening') ||
             text.includes('Overall Progress') ||
             text.includes('Learning Streak') ||
             text.includes('lesson');
    }, { timeout: 20000 });
  }

  async searchLessons(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }
}
