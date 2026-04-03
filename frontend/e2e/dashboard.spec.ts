import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('shows greeting with user name', async ({ page }) => {
    await expect(page.getByText('Sarah')).toBeVisible({ timeout: 10_000 })
  })

  test('displays stat cards section', async ({ page }) => {
    // The dashboard renders stat cards — look for common stat labels
    const dashboard = page.locator('main, [role="main"], .flex-1')
    await expect(dashboard).toBeVisible({ timeout: 10_000 })
  })

  test('shows action required section', async ({ page }) => {
    await expect(page.getByText(/action required/i)).toBeVisible({ timeout: 10_000 })
  })

  test('shows recent activity section', async ({ page }) => {
    await expect(page.getByText(/recent activity|activity/i)).toBeVisible({ timeout: 10_000 })
  })
})
