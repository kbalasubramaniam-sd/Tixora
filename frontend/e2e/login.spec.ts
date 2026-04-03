import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('logs in with valid credentials and lands on dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('Email address').fill('sarah.ahmad@tixora.ae')
    await page.getByPlaceholder('Password').fill('Password1!')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should navigate away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })

    // Should see the user's first name somewhere on the page (greeting or topbar)
    await expect(page.getByText('Sarah')).toBeVisible({ timeout: 10_000 })
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('Email address').fill('nonexistent@tixora.ae')
    await page.getByPlaceholder('Password').fill('wrong')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10_000 })
  })
})
