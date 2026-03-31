import { expect, test, type Page } from '@playwright/test'

const registerAndCompleteOnboarding = async (page: Page) => {
  const uniqueEmail = `visual_${Date.now()}@edunova.ai`
  const password = 'Visual1234!'

  await page.goto('/register')
  await page.getByTestId('register-email').fill(uniqueEmail)
  await page.getByTestId('register-password').fill(password)
  await page.getByTestId('register-submit').click()
  await expect(page).toHaveURL(/\/onboarding/)

  await page.getByRole('button', { name: 'Learn new skill' }).click()
  await page.getByRole('button', { name: 'frontend' }).click()
  await page.getByRole('button', { name: 'backend' }).click()

  const assessmentCheckboxes = page
    .locator('section')
    .filter({ hasText: 'Quick adaptive assessment' })
    .locator('input[type="checkbox"]')
  const count = await assessmentCheckboxes.count()
  for (let i = 0; i < Math.min(2, count); i += 1) {
    await assessmentCheckboxes.nth(i).check()
  }

  await page.getByTestId('onboarding-submit').click()
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20_000 })
}

test.describe('visual snapshots', () => {
  test('landing page visual baseline', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('dashboard and learn page visual baseline', async ({ page }) => {
    await registerAndCompleteOnboarding(page)

    await page.goto('/app/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      animations: 'disabled',
    })

    await page.goto('/app/courses')
    await page.locator('[data-testid^="course-open-"]').first().click()
    await page.getByTestId('course-start-resume').click()
    await expect(page).toHaveURL(/\/app\/learn\/\d+/)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('learn-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})
