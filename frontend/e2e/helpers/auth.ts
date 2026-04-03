import type { Page } from '@playwright/test'

const API_BASE_URL = 'https://localhost:7255/api'
const DEFAULT_PASSWORD = 'Password1!'

/** Seeded test users */
export const USERS = {
  sarah: { email: 'sarah.ahmad@tixora.ae', name: 'Sarah Ahmad', role: 'PartnershipTeam' },
  omar: { email: 'omar.khalid@tixora.ae', name: 'Omar Khalid', role: 'LegalTeam' },
  hannoun: { email: 'hannoun@tixora.ae', name: 'Hannoun', role: 'ProductTeam' },
  fatima: { email: 'fatima.noor@tixora.ae', name: 'Fatima Noor', role: 'ExecutiveAuthority' },
  khalid: { email: 'khalid.rashed@tixora.ae', name: 'Khalid Rashed', role: 'IntegrationTeam' },
  ahmed: { email: 'ahmed.tariq@tixora.ae', name: 'Ahmed Tariq', role: 'DevTeam' },
  layla: { email: 'layla.hassan@tixora.ae', name: 'Layla Hassan', role: 'BusinessTeam' },
  vilina: { email: 'vilina.sequeira@tixora.ae', name: 'Vilina Sequeira', role: 'PartnerOps' },
  sara: { email: 'sara.raeed@tixora.ae', name: 'Sara Raeed', role: 'PartnerOps' },
  shayman: { email: 'shayman.ali@tixora.ae', name: 'Shayman Ali', role: 'PartnerOps' },
  admin: { email: 'admin@tixora.ae', name: 'Admin User', role: 'SystemAdministrator' },
} as const

type UserKey = keyof typeof USERS

/**
 * Authenticate by calling the login API directly, then injecting the token
 * into localStorage so the app treats the session as authenticated.
 */
export async function loginViaApi(page: Page, user: UserKey = 'sarah') {
  const { email } = USERS[user]

  const response = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password: DEFAULT_PASSWORD },
    ignoreHTTPSErrors: true,
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
export async function loginViaUi(page: Page, user: UserKey = 'sarah') {
  const { email } = USERS[user]
  await page.goto('/login')
  await page.getByPlaceholder('Email address').fill(email)
  await page.getByPlaceholder('Password').fill(DEFAULT_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('/')
}
