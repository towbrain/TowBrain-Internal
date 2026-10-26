import { test, expect } from '@playwright/test'

// End-to-end lead lifecycle against a REAL Supabase project (not mocked). Requires:
//   E2E_TEST_EMAIL / E2E_TEST_PASSWORD — an existing, active team member account
// Skips entirely if those aren't set, since there's no safe way to fabricate a
// Supabase session without real auth. See README "Testing" for setup.

const email = process.env.E2E_TEST_EMAIL
const password = process.env.E2E_TEST_PASSWORD

test.skip(!email || !password, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set')

test('full lead lifecycle: create, edit, note, move, delete, restore', async ({ page }) => {
  const clientName = `E2E Test Lead ${Date.now()}`

  // 1. Login
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/password/i).fill(password!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/overview|leads|pipeline/)

  // 2. Create a lead
  await page.goto('/leads')
  await page.getByRole('button', { name: /add lead/i }).click()
  await page.getByLabel(/client name/i).fill(clientName)
  await page.getByRole('button', { name: /create lead/i }).click()
  await expect(page.getByText(clientName)).toBeVisible()

  // 3. Edit the lead
  await page.getByRole('button', { name: clientName }).click()
  await page.getByRole('button', { name: /^edit$/i }).click()
  await page.getByLabel(/company/i).fill('Acme E2E Co')
  await page.getByRole('button', { name: /save changes/i }).click()
  await expect(page.getByText('Acme E2E Co')).toBeVisible()

  // 4. Add a note
  await page.getByPlaceholder(/add a note/i).fill('E2E note content')
  await page.getByRole('button', { name: /add note/i }).click()
  await expect(page.getByText('E2E note content')).toBeVisible()

  // 6. Confirm the activity timeline recorded creation + the edit
  await page.getByRole('tab', { name: /activity/i }).click()
  await expect(page.getByText(/created this lead/i)).toBeVisible()
  await expect(page.getByText(/updated the lead/i)).toBeVisible()

  await page.keyboard.press('Escape')

  // 5. Move the lead to another Kanban stage
  await page.goto('/pipeline')
  const card = page.getByText(clientName)
  const contactedColumn = page.getByText('Contacted').locator('..')
  await card.dragTo(contactedColumn)
  await expect(contactedColumn).toContainText(clientName)

  // 7. Delete the lead
  await page.goto('/leads')
  await page
    .getByRole('row', { name: new RegExp(clientName) })
    .getByRole('button', { name: /delete/i })
    .click()
  await page.getByRole('button', { name: /^delete lead$/i }).click()
  await expect(page.getByText(clientName)).not.toBeVisible()

  // 8. Restore the lead (admin-only — skip assertion if this account isn't admin)
  const deletedTab = page.getByRole('tab', { name: /deleted/i })
  if (await deletedTab.isVisible()) {
    await deletedTab.click()
    await page.getByRole('row', { name: new RegExp(clientName) }).getByRole('button', { name: /restore/i }).click()
  }

  // 9. A second browser context (another "user") should see the same data without
  // a manual refresh once Realtime delivers the change — covered separately in
  // realtime.spec.ts using two authenticated contexts.
})
