import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DiscoverPage extends BasePage {
  readonly searchInput: Locator;
  readonly lessonCards: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    // More flexible lesson selectors - look for lesson cards, links, or articles
    this.lessonCards = page.locator('[data-testid="lesson-card"], .lesson-card, [class*="LessonCard"], a[href*="/lesson/"], article');
  }

  async navigate() {
    await this.goto('/discover');
  }

  async searchLessons(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async getLessonCount(): Promise<number> {
    return await this.lessonCards.count();
  }

  async clickFirstLesson() {
    await this.lessonCards.first().click();
    await this.page.waitForLoadState('networkidle');
  }
}
