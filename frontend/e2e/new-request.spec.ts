import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('New Request wizard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('loads the new request page', async ({ page }) => {
    await page.goto('/new-request')
    await expect(page).toHaveURL(/\/new-request/)
  })

  test('can select a product and task type', async ({ page }) => {
    await page.goto('/new-request')

    // Step 1: Select first product — cards are <button> elements with product names
    await page.getByText('Rabet', { exact: true }).click({ timeout: 10_000 })

    // Step 2: A task type selection should appear — click the first one
    await page.getByText('Agreement Validation', { exact: false }).first().click({ timeout: 10_000 })

    // Step 3: Form should load with partner information heading
    await expect(page.getByRole('heading', { name: /Partner Information/i })).toBeVisible({ timeout: 10_000 })
  })
})
