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
      await this.page.waitForSelector(`text=${message}`, { timeout: 5000 });
    } else {
      await this.page.waitForSelector('[role="status"], [role="alert"]', { timeout: 5000 });
    }
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
