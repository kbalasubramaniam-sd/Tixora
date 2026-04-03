import { test, expect, type Page } from '@playwright/test'
import { loginViaApi, USERS } from './helpers/auth'

const API_BASE = 'https://localhost:7255/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getToken(page: Page, email: string): Promise<string> {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email, password: 'Password1!' },
    ignoreHTTPSErrors: true,
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return body.token
}

async function switchUser(page: Page, email: string) {
  const token = await getToken(page, email)
  await page.evaluate((t) => {
    localStorage.setItem('tixora_token', t)
  }, token)
  await page.reload()
}

/** Navigate to ticket detail and approve the current stage. */
async function approveStage(page: Page, ticketGuid: string, userEmail: string, comment: string) {
  await switchUser(page, userEmail)
  await page.goto(`/tickets/${ticketGuid}`)

  const approveBtn = page.getByRole('button', { name: /Approve & Advance/i })
  await expect(approveBtn).toBeVisible({ timeout: 10_000 })
  await approveBtn.click()

  // Modal — fill comment and confirm
  const commentBox = page.locator('textarea').last()
  await commentBox.fill(comment)
  await page.getByRole('button', { name: /Confirm/i }).click()

  // Wait for action to complete
  await expect(approveBtn).not.toBeVisible({ timeout: 15_000 })
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
  await page.getByRole('link', { name: /View Ticket/i }).click()
  await expect(page).toHaveURL(/\/tickets\//, { timeout: 10_000 })
  return extractTicketGuid(page)
}

/** Verify ticket reached Completed status with no remaining approve buttons. */
async function verifyCompleted(page: Page) {
  await expect(page.getByText(/Completed/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /Approve/i })).not.toBeVisible({ timeout: 5_000 })
}

// ─── Tests ──────────────────────────────────────────────────────────────────
// Serial chain: T-01 → T-02 → T-03 → T-04 on the same partner (Al Ain Insurance / RBT).
// Each task type advances the partner lifecycle to the next required state.
//   None → [T-01] → Onboarded → [T-02] → UatCompleted → [T-03] → Live → [T-04] → Live (no change)

test.describe.serial('Ticket lifecycle: T-01 → T-02 → T-03 → T-04', () => {
  test.setTimeout(120_000)

  // ═════════════════════════════════════════════════════════════════
  //  T-01: Agreement Validation & Sign-off (3 stages)
  //  None → Onboarded
  // ═════════════════════════════════════════════════════════════════

  test('T-01: submit Agreement ticket and approve through 3 stages', async ({ page }) => {
    await loginViaApi(page, 'sarah')
    await selectProductAndTask(page, 'Rabet', 'Agreement Validation')
    await selectPartner(page, 'Al Ain Insurance')

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T01-/)

    // Stage 1: Omar (Legal) → Stage 2: Hannoun (Product) → Stage 3: Fatima (EA)
    await approveStage(page, guid, USERS.omar.email, 'Legal review complete.')
    await approveStage(page, guid, USERS.hannoun.email, 'Product review approved.')
    await approveStage(page, guid, USERS.fatima.email, 'Executive sign-off granted.')

    await verifyCompleted(page)
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-02: UAT Access Creation (5 stages, repeatable form)
  //  Onboarded → UatCompleted
  // ═════════════════════════════════════════════════════════════════

  test('T-02: submit UAT Access ticket with repeatable entries and approve 5 stages', async ({ page }) => {
    await loginViaApi(page, 'sarah')
    await selectProductAndTask(page, 'Rabet', 'UAT Access Creation')
    await selectPartner(page, 'Al Ain Insurance')

    // Fill repeatable UAT User Details (1 pre-created entry)
    await page.getByPlaceholder('e.g. Sarah Jenkins').first().fill('Test UAT User')
    await page.getByPlaceholder('sarah.j@company.com').first().fill('uat.user@alain.ae')
    await page.getByPlaceholder('+1 (555) 000-0000').first().fill('+971 50 123 4567')
    await page.locator('select').nth(1).selectOption('qa') // Designation

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T02-/)

    // 5 stages: ProductTeam → IntegrationTeam → DevTeam → PartnershipTeam (gate) → IntegrationTeam
    await approveStage(page, guid, USERS.hannoun.email, 'Product team review OK.')
    await approveStage(page, guid, USERS.khalid.email, 'Access provisioned.')
    await approveStage(page, guid, USERS.ahmed.email, 'API credentials created.')
    await approveStage(page, guid, USERS.sarah.email, 'UAT signal received from partner.')
    await approveStage(page, guid, USERS.khalid.email, 'UAT sign-off complete.')

    await verifyCompleted(page)
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-03: Partner Account Creation — PortalAndApi path (5 stages)
  //  UatCompleted → Live
  //  Most complex form: toggle, text fields, 2 repeatable sections
  // ═════════════════════════════════════════════════════════════════

  test('T-03: submit Production Account ticket (Portal+API) with multi-section form and approve 5 stages', async ({
    page,
  }) => {
    await loginViaApi(page, 'sarah')
    await selectProductAndTask(page, 'Rabet', 'Partner Account Creation')
    await selectPartner(page, 'Al Ain Insurance')

    // ── API Opt-In toggle (enables PortalAndApi path → 5 stages) ──
    const apiToggle = page.locator('input[type="checkbox"]')
    await apiToggle.check()

    // ── Portal Admin User section ──
    await page.getByPlaceholder('Johnathan Doe').fill('Admin Test User')
    await page.getByPlaceholder('j.doe@company.com').fill('admin@alain.ae')
    const mobileInputs = page.getByPlaceholder('+1 (555) 000-0000')
    await mobileInputs.first().fill('+971 50 999 0001')
    await page.getByPlaceholder('Operations Manager').fill('IT Manager')

    // ── Network section ──
    await page.getByPlaceholder(/comma-separated IP/i).fill('192.168.1.100, 10.0.0.50')

    // ── Invoicing Contacts (repeatable, 1 pre-created entry) ──
    await page.getByPlaceholder('Finance Dept').first().fill('Finance Team')
    await page.getByPlaceholder('billing@company.com').first().fill('billing@alain.ae')
    await page.getByPlaceholder('+1 (555) 123-4567').first().fill('+971 4 555 0001')

    // ── Customer Support Contact (repeatable, 1 pre-created entry) ──
    await page.getByPlaceholder('Name').first().fill('Support Lead')
    await mobileInputs.nth(1).fill('+971 50 888 0001')
    await page.getByPlaceholder('email@company.com').first().fill('support@alain.ae')
    const roleSelect = page.locator('select').last()
    await roleSelect.selectOption('Primary')

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T03-/)

    // 5 stages (PortalAndApi): PartnerOps → ProductTeam → DevTeam → BusinessTeam → IntegrationTeam
    await approveStage(page, guid, USERS.vilina.email, 'Partner ops review complete.')
    await approveStage(page, guid, USERS.hannoun.email, 'Product team sign-off approved.')
    await approveStage(page, guid, USERS.ahmed.email, 'Dev provisioning done.')
    await approveStage(page, guid, USERS.layla.email, 'Business provisioning done.')
    await approveStage(page, guid, USERS.khalid.email, 'API provisioning complete.')

    await verifyCompleted(page)
  })

  // ═════════════════════════════════════════════════════════════════
  //  T-04: Access & Credential Support (1 stage)
  //  Live → Live (no lifecycle change)
  //  Simplest form: radio-card issue type + description textarea
  // ═════════════════════════════════════════════════════════════════

  test('T-04: submit Support ticket with radio-card selection and approve 1 stage', async ({ page }) => {
    await loginViaApi(page, 'sarah')
    await selectProductAndTask(page, 'Rabet', 'Access & Credential Support')
    await selectPartner(page, 'Al Ain Insurance')

    // ── Support Details: select issue type via radio-card ──
    // Radio-cards render as clickable divs with the issue type labels
    await page.getByText('Password Reset', { exact: false }).first().click()

    // ── Description textarea ──
    await page.getByPlaceholder(/Describe the issue/i).fill(
      'Partner admin cannot reset their portal password. Getting "token expired" error after clicking the reset link.',
    )

    const guid = await reviewAndSubmit(page, 'Al Ain Insurance', /^SPM-RBT-T04-/)

    // 1 stage: Ahmed (DevTeam) — Verify & Resolve
    await approveStage(page, guid, USERS.ahmed.email, 'Password reset completed, new credentials sent.')

    await verifyCompleted(page)
  })
})
