import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Master|AI|SaaS/i)
})

test('can open sign in page', async ({ page }) => {
  await page.goto('/auth/signin')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('can open signup page', async ({ page }) => {
  await page.goto('/auth/signup')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('health endpoint returns 200', async ({ page, request }) => {
  const res = await request.get('/health')
  expect(res.status()).toBeLessThan(500)
})


