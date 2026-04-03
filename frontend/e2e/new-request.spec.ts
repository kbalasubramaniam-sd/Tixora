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

    // Step 1: Select first product card
    const productCards = page.locator('[class*="cursor-pointer"], [role="button"]').filter({ hasText: /Rabet|Rhoon|Wtheeq|Mulem/ })
    const firstProduct = productCards.first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()

    // Step 2: A task type selection should appear — click the first enabled one
    const taskOptions = page.locator('[class*="cursor-pointer"], [role="button"]').filter({ hasText: /T-0[1-4]|Agreement|UAT|Production|Support/ })
    const firstTask = taskOptions.first()
    await expect(firstTask).toBeVisible({ timeout: 10_000 })
    await firstTask.click()

    // Step 3: Form should load with partner information
    await expect(page.getByText(/partner/i)).toBeVisible({ timeout: 10_000 })
  })
})
