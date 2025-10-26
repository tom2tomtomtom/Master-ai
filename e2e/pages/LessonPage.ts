import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LessonPage extends BasePage {
  readonly lessonContent: Locator;
  readonly completeButton: Locator;
  readonly bookmarkButton: Locator;

  constructor(page: Page) {
    super(page);
    this.lessonContent = page.locator('[data-testid="lesson-content"]').or(page.locator('article, .lesson-content').first());
    this.completeButton = page.locator('button:has-text("Mark as Complete"), button:has-text("Complete Lesson")');
    this.bookmarkButton = page.locator('[data-testid="bookmark-button"]').or(page.locator('button[aria-label*="bookmark" i]'));
  }

  async verifyLessonLoaded() {
    await expect(this.lessonContent).toBeVisible({ timeout: 10000 });
  }

  async completeLesson() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.completeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async toggleBookmark() {
    await this.bookmarkButton.click();
    await this.page.waitForTimeout(1000);
  }
}
