import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logs in by clicking a user card and lands on dashboard', async ({ page }) => {
    await page.goto('/login')

    // Login page is a user-picker demo — click the Parankush card button
    await page.getByRole('button', { name: /Parankush/i }).click()

    // Should navigate away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })

    // Should see the user's name in the dashboard greeting
    await expect(page.getByRole('heading', { name: /Parankush/i })).toBeVisible({ timeout: 10_000 })
  })

  test('shows user picker with seeded users', async ({ page }) => {
    await page.goto('/login')

    // The demo login page should show user cards
    await expect(page.getByRole('button', { name: /Parankush/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /Bahnas/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Albaha/i })).toBeVisible()
  })
})
