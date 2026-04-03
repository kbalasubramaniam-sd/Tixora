import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('Sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('navigates to Team Queue', async ({ page }) => {
    await page.getByText('Team Queue').click()
    await expect(page).toHaveURL(/\/team-queue/)
    // Page should render without crashing
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigates to My Tickets', async ({ page }) => {
    await page.getByText('My Tickets').click()
    await expect(page).toHaveURL(/\/my-tickets/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigates to Notifications', async ({ page }) => {
    await page.getByText('Notifications').first().click()
    await expect(page).toHaveURL(/\/notifications/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigates to Partners', async ({ page }) => {
    await page.getByText('Partners').click()
    await expect(page).toHaveURL(/\/partners/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigates to Dashboard from another page', async ({ page }) => {
    await page.goto('/my-tickets')
    await page.getByText('Dashboard').click()
    await expect(page).toHaveURL(/^\/$|localhost:5173\/$/)
  })
})
