import type { Page } from '@playwright/test'

const API_BASE_URL = 'https://localhost:7255/api'
const DEFAULT_PASSWORD = 'Password1!'

/** Seeded test users */
export const USERS = {
  parankush: { email: 'parankush@tixora.ae', name: 'Parankush', role: 'PartnershipTeam' },
  bahnas: { email: 'bahnas@tixora.ae', name: 'Bahnas', role: 'LegalTeam' },
  albaha: { email: 'albaha@tixora.ae', name: 'Albaha', role: 'ProductTeam' },
  leena: { email: 'leena@tixora.ae', name: 'Leena', role: 'ExecutiveAuthority' },
  faiz: { email: 'faiz@tixora.ae', name: 'Faiz Siddiqui', role: 'IntegrationTeam' },
  karthik: { email: 'karthik@tixora.ae', name: 'Karthik', role: 'DevTeam' },
  fares: { email: 'fares@tixora.ae', name: 'Fares Alotaibi', role: 'BusinessTeam' },
  vileena: { email: 'vileena@tixora.ae', name: 'Vileena', role: 'PartnerOps' },
  admin: { email: 'admin@tixora.ae', name: 'Admin', role: 'SystemAdministrator' },
} as const

type UserKey = keyof typeof USERS

/**
 * Authenticate by calling the login API directly, then injecting the token
 * into localStorage so the app treats the session as authenticated.
 */
export async function loginViaApi(page: Page, user: UserKey = 'parankush') {
  const { email } = USERS[user]

  const response = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password: DEFAULT_PASSWORD },
    ignoreHTTPSErrors: true,
    timeout: 30_000,
  })

  if (!response.ok()) {
    throw new Error(`Login API failed for ${email}: ${response.status()} ${response.statusText()}`)
  }

  const body = await response.json()
  const token: string = body.token

  // Navigate to app origin so we can set localStorage (will redirect to /login)
  await page.goto('/login')
  await page.evaluate((t) => {
    localStorage.setItem('tixora_token', t)
  }, token)

  // Navigate to root — app will read token from localStorage and authenticate
  await page.goto('/')
  // Wait for the dashboard to render (proves auth worked)
  await page.waitForSelector('[class*="sidebar"], [class*="Sidebar"], nav', { timeout: 15_000 })
}

/**
 * Fallback: authenticate via the UI login form.
 */
export async function loginViaUi(page: Page, user: UserKey = 'parankush') {
  const { email } = USERS[user]
  await page.goto('/login')
  await page.getByPlaceholder('Email address').fill(email)
  await page.getByPlaceholder('Password').fill(DEFAULT_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('/')
}
