import { expect, test } from '@playwright/test'

test('landing to register to onboarding to learn navigation', async ({ page }) => {
  const uniqueEmail = `smoke_${Date.now()}@edunova.ai`
  const password = 'Smoke1234!'

  await page.goto('/')
  await expect(page.getByText('Learn smarter with AI')).toBeVisible()
  await expect(page.getByTestId('landing-explore-catalog')).toBeVisible()
  await page.getByTestId('landing-register-cta').click()

  await expect(page).toHaveURL(/\/register/)
  await page.getByTestId('register-email').fill(uniqueEmail)
  await page.getByTestId('register-password').fill(password)
  await page.getByTestId('register-submit').click()

  await expect(page).toHaveURL(/\/onboarding/)
  await page.getByRole('button', { name: 'Learn new skill' }).click()
  await page.getByRole('button', { name: 'frontend' }).click()
  await page.getByRole('button', { name: 'backend' }).click()
  await page.getByRole('button', { name: 'ai' }).click()

  const checkboxes = page.locator('section').filter({ hasText: 'Quick adaptive assessment' }).locator('input[type="checkbox"]')
  const count = await checkboxes.count()
  for (let i = 0; i < Math.min(3, count); i += 1) {
    await checkboxes.nth(i).check()
  }

  await page.getByTestId('onboarding-submit').click()
  await Promise.race([
    page.waitForURL(/\/app\/dashboard/, { timeout: 20_000 }),
    page.getByText('Onboarding complete').waitFor({ timeout: 20_000 }),
  ])
  await page.goto('/app/dashboard')
  await expect(page).toHaveURL(/\/app\/dashboard/)

  await page.getByRole('link', { name: 'Courses' }).click()
  await expect(page).toHaveURL(/\/app\/courses/)

  const firstCourseButton = page.locator('[data-testid^="course-open-"]').first()
  await expect(firstCourseButton).toBeVisible()
  await firstCourseButton.click()

  await expect(page).toHaveURL(/\/app\/courses\/\d+/)
  await page.getByTestId('course-start-resume').click()

  await expect(page).toHaveURL(/\/app\/learn\/\d+/)
  await expect(page.getByText('Modules and lessons')).toBeVisible()
})

test('login and dashboard visibility', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('login-email').fill('demo@edunova.ai')
  await page.getByTestId('login-password').fill('Demo1234!')
  await page.getByTestId('login-submit').click()

  await expect(page).toHaveURL(/\/app\/dashboard/)
  await expect(page.getByText('Your adaptive learning command center')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Recommendations' })).toBeVisible()
})
