import type { Page } from '@playwright/test'

const API_BASE_URL = 'https://localhost:7255/api'
const TEST_EMAIL = 'sarah.ahmad@tixora.ae'
const TEST_PASSWORD = 'anything'

/**
 * Authenticate by calling the login API directly, then injecting the token
 * into localStorage so the app treats the session as authenticated.
 */
export async function loginViaApi(page: Page) {
  // Call the backend login endpoint directly
  const response = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    ignoreHTTPSErrors: true,
  })

  if (!response.ok()) {
    throw new Error(`Login API failed: ${response.status()} ${response.statusText()}`)
  }

  const body = await response.json()
  const token: string = body.token

  // Navigate to app origin first so we can set localStorage on it
  await page.goto('/')
  await page.evaluate((t) => {
    localStorage.setItem('tixora_token', t)
  }, token)

  // Reload so the app picks up the token
  await page.reload()
  await page.waitForURL('/')
}

/**
 * Fallback: authenticate via the UI login form.
 */
export async function loginViaUi(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('Email address').fill(TEST_EMAIL)
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('/')
}
