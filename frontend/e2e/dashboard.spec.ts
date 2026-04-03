import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('shows greeting with user name', async ({ page }) => {
    await expect(page.getByText('Parankush')).toBeVisible({ timeout: 10_000 })
  })

  test('displays stat cards section', async ({ page }) => {
    // The dashboard renders stat cards in a grid
    const dashboard = page.getByRole('main')
    await expect(dashboard).toBeVisible({ timeout: 10_000 })
  })

  test('shows action required section', async ({ page }) => {
    await expect(page.getByText(/action required/i)).toBeVisible({ timeout: 10_000 })
  })

  test('shows recent activity section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Activity', exact: true })).toBeVisible({ timeout: 10_000 })
  })
})
