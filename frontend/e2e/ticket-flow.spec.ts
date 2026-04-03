import { test, expect, type Page, type Browser, request as playwrightRequest } from '@playwright/test'
import { loginViaApi, USERS } from './helpers/auth'

const API_BASE = 'https://localhost:7255/api'
const APP_BASE = 'http://localhost:5173'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Approve the current stage using a fresh browser context per user.
 * This avoids auth caching issues when switching JWT tokens mid-session.
 */
async function approveStage(browser: Browser, ticketGuid: string, userEmail: string, comment: string) {
  const context = await browser.newContext({
    baseURL: APP_BASE,
    ignoreHTTPSErrors: true,
  })
  const page = await context.newPage()

  try {
    // Login via API in the fresh context
    const res = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: userEmail, password: 'Password1!' },
      ignoreHTTPSErrors: true,
    })
    expect(res.ok()).toBeTruthy()
    const { token } = await res.json()

    // Set token and navigate to ticket
    await page.goto('/login')
    await page.evaluate((t) => {
      localStorage.setItem('tixora_token', t)
    }, token)
    await page.goto(`/tickets/${ticketGuid}`)

    // Wait for the approve button
    const approveBtn = page.getByRole('button', { name: /Approve & Advance|Complete & Close/i })
    await expect(approveBtn).toBeVisible({ timeout: 20_000 })
    await approveBtn.click()

    // Modal — fill comment and confirm
    const commentBox = page.locator('textarea').last()
    await commentBox.fill(comment)
    await page.getByRole('button', { name: /Confirm/i }).click()

    // Wait for action to complete (button disappears after successful approval)
    await expect(approveBtn).not.toBeVisible({ timeout: 15_000 })
  } finally {
    await context.close()
  }
}

/** Extract ticket GUID from the current /tickets/:id URL. */
function extractTicketGuid(page: Page): string {
  const guid = page.url().split('/tickets/')[1]?.split('?')[0]
  expect(guid).toBeTruthy()
  return guid!
}

/** Common: select product and task on the new-request wizard. */
async function selectProductAndTask(page: Page, productName: string, taskText: string) {
  await page.goto('/new-request')
  await page.getByText(productName, { exact: true }).click({ timeout: 10_000 })
  await page.getByText(taskText, { exact: false }).first().click({ timeout: 10_000 })
  await expect(page.getByText(/Partner Information/i)).toBeVisible({ timeout: 10_000 })
}

/** Common: wait for partner dropdown to load and select a partner by label. */
async function selectPartner(page: Page, partnerLabel: string) {
  const partnerSelect = page.locator('select').first()
  await expect(partnerSelect.locator('option')).not.toHaveCount(1, { timeout: 10_000 })
  await partnerSelect.selectOption({ label: partnerLabel })
}

/** Common: click Review, verify partner name, then Submit and capture ticket info. */
async function reviewAndSubmit(page: Page, partnerLabel: string, ticketIdPattern: RegExp) {
  // Review
  await page.getByRole('button', { name: /Review/i }).click()
  await expect(page.getByText(partnerLabel)).toBeVisible({ timeout: 5_000 })

  // Submit
  await page.getByRole('button', { name: /Submit Request/i }).click()

  // Confirmation
  await expect(page.getByText('Request Submitted')).toBeVisible({ timeout: 15_000 })
  const ticketIdText = await page.locator('.text-3xl.font-extrabold.text-primary').first().textContent()
  expect(ticketIdText).toMatch(ticketIdPattern)

  // Navigate to detail and return GUID
  await page.getByRole('link', { name: /View Ticket/i }).first().click()
  await expect(page).toHaveURL(/\/tickets\//, { timeout: 10_000 })
  return extractTicketGuid(page)
}

/** Verify ticket reached Completed status with no remaining approve buttons. */
async function verifyCompleted(page: Page, ticketGuid: string) {
  // Wait a moment for the backend to finalize status after last approval
  await page.waitForTimeout(2_000)
  // Reload the ticket detail page to see the updated status
  await page.goto(`/tickets/${ticketGuid}`)
  await expect(page.getByText('Completed', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /Approve/i })).not.toBeVisible({ timeout: 5_000 })
}

// ─── Tests ──────────────────────────────────────────────────────────────────
// Serial chain: T-01 → T-02 → T-03 → T-04 on the same partner (Al Ain Insurance / RBT).
// Each task type advances the partner lifecycle to the next required state.
//   None → [T-01] → Onboarded → [T-02] → UatCompleted → [T-03] → Live → [T-04] → Live (no change)

test.describe.serial('Ticket lifecycle: T-01 → T-02 → T-03 → T-04', () => {
  test.setTimeout(180_000)

  // Reset database to seed state before the test suite
  test.beforeAll(async () => {
    const apiContext = await playwrightRequest.newContext({ ignoreHTTPSErrors: true })
    const res = await apiContext.post(`${API_BASE}/admin/test-reset`, { timeout: 30_000 })
    expect(res.ok()).toBeTruthy()
    await apiContext.dispose()
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-01: Agreement Validation & Sign-off (3 stages)
  //  None → Onboarded
  // ═════════════════════════════════════════════════════════════════

  test('T-01: submit Agreement ticket and approve through 3 stages', async ({ browser, page }) => {
    await loginViaApi(page, 'parankush')
    await selectProductAndTask(page, 'Rabet', 'Agreement Validation')
    await selectPartner(page, 'Al Ain Insurance')

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T01-/)

    // Stage 1: Bahnas (Legal) → Stage 2: Albaha (Product) → Stage 3: Leena (EA)
    await approveStage(browser, guid, USERS.bahnas.email, 'Legal review complete.')
    await approveStage(browser, guid, USERS.albaha.email, 'Product review approved.')
    await approveStage(browser, guid, USERS.leena.email, 'Executive sign-off granted.')

    await verifyCompleted(page, guid)
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-02: UAT Access Creation (4 stages, repeatable form)
  //  Onboarded → UatCompleted
  // ═════════════════════════════════════════════════════════════════

  test('T-02: submit UAT Access ticket with repeatable entries and approve 4 stages', async ({ browser, page }) => {
    await loginViaApi(page, 'parankush')
    await selectProductAndTask(page, 'Rabet', 'UAT Access Creation')
    await selectPartner(page, 'Al Ain Insurance')

    // Fill repeatable UAT User Details (1 pre-created entry)
    await page.getByPlaceholder('e.g. Sarah Jenkins').first().fill('Test UAT User')
    await page.getByPlaceholder('sarah.j@company.com').first().fill('uat.user@alain.ae')
    await page.getByPlaceholder('+971 50 000 0000').first().fill('+971 50 123 4567')
    await page.getByPlaceholder('e.g. QA Engineer').first().fill('QA Engineer')

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T02-/)

    // 4 stages: IntegrationTeam → DevTeam → IntegrationTeam (gate) → IntegrationTeam
    await approveStage(browser, guid, USERS.faiz.email, 'Access provisioned.')
    await approveStage(browser, guid, USERS.karthik.email, 'API credentials created.')
    await approveStage(browser, guid, USERS.faiz.email, 'UAT signal received from partner.')
    await approveStage(browser, guid, USERS.faiz.email, 'UAT sign-off complete.')

    await verifyCompleted(page, guid)
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-03: Partner Account Creation — PortalAndApi path (5 stages)
  //  UatCompleted → Live
  //  Created by PartnerOps (Vileena), reviewed by PartnershipTeam first
  // ═════════════════════════════════════════════════════════════════

  test('T-03: submit Production Account ticket (Portal+API) with multi-section form and approve 5 stages', async ({
    browser,
    page,
  }) => {
    await loginViaApi(page, 'vileena')
    await selectProductAndTask(page, 'Rabet', 'Partner Account Creation')
    await selectPartner(page, 'Al Ain Insurance')

    // ── API Opt-In toggle (enables PortalAndApi path → 5 stages) ──
    await page.locator('input[name="apiOptIn"]').evaluate((el: HTMLInputElement) => el.click())
    await expect(page.locator('input[name="apiOptIn"]')).toBeChecked()

    // ── Portal Admin User section ──
    await page.getByPlaceholder('Johnathan Doe').fill('Admin Test User')
    await page.getByPlaceholder('j.doe@company.com').fill('admin@alain.ae')
    await page.getByPlaceholder('+971 50 000 0000').first().fill('+971 50 999 0001')
    await page.getByPlaceholder('Operations Manager').fill('IT Manager')

    // ── Network section ──
    await page.getByPlaceholder(/comma-separated IP/i).fill('192.168.1.100, 10.0.0.50')

    // ── Invoicing Contacts (repeatable, 1 pre-created entry) ──
    await page.getByPlaceholder('Finance Dept').first().fill('Finance Team')
    await page.getByPlaceholder('billing@company.com').first().fill('billing@alain.ae')
    await page.getByPlaceholder('+971 4 000 0000').first().fill('+971 4 555 0001')

    // ── Customer Support Contact (repeatable, 1 pre-created entry) ──
    await page.getByPlaceholder('Name').first().fill('Support Lead')
    await page.getByPlaceholder('+971 50 000 0000').nth(1).fill('+971 50 888 0001')
    await page.getByPlaceholder('email@company.com').first().fill('support@alain.ae')
    await page.getByPlaceholder('e.g. Primary, Escalation').first().fill('Primary')

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T03-/)

    // 5 stages (PortalAndApi): PartnershipTeam → ProductTeam → DevTeam → BusinessTeam → IntegrationTeam
    await approveStage(browser, guid, USERS.parankush.email, 'Partnership review complete.')
    await approveStage(browser, guid, USERS.albaha.email, 'Product team sign-off approved.')
    await approveStage(browser, guid, USERS.karthik.email, 'Dev provisioning done.')
    await approveStage(browser, guid, USERS.fares.email, 'Business provisioning done.')
    await approveStage(browser, guid, USERS.faiz.email, 'API provisioning complete.')

    await verifyCompleted(page, guid)
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-04: Access & Credential Support (1 stage)
  //  Live → Live (no lifecycle change)
  //  Simplest form: radio-card issue type + description textarea
  // ═════════════════════════════════════════════════════════════════

  test('T-04: submit Support ticket with radio-card selection and approve 1 stage', async ({ browser, page }) => {
    await loginViaApi(page, 'parankush')
    await selectProductAndTask(page, 'Rabet', 'Access & Credential Support')
    await selectPartner(page, 'Al Ain Insurance')

    // ── Support Details: select issue type via radio-card ──
    await page.getByText('Password Reset', { exact: false }).first().click()

    // ── Description textarea ──
    await page.getByPlaceholder(/Describe the issue/i).fill(
      'Partner admin cannot reset their portal password. Getting "token expired" error after clicking the reset link.',
    )

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T04-/)

    // 1 stage: Karthik (DevTeam) — Verify & Resolve
    await approveStage(browser, guid, USERS.karthik.email, 'Password reset completed, new credentials sent.')

    await verifyCompleted(page, guid)
  })
})
