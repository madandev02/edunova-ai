import { chromium } from 'playwright'

async function login(page) {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.fill('[data-testid="login-email"]', 'demo@edunova.ai')
  await page.fill('[data-testid="login-password"]', 'Demo1234!')
  await page.click('[data-testid="login-submit"]')
  await page.waitForURL(/\/app\/(dashboard)?/, { timeout: 20000 })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } })

  await login(page)
  await page.screenshot({ path: './test-results/phase2-dashboard-20260329.png', fullPage: true })

  await page.goto('http://localhost:3000/app/courses', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.screenshot({ path: './test-results/phase2-courses-20260329.png', fullPage: true })

  await page.goto('http://localhost:3000/app/analytics', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.screenshot({ path: './test-results/phase2-analytics-20260329.png', fullPage: true })

  await page.goto('http://localhost:3000/app/assistant', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.screenshot({ path: './test-results/phase2-assistant-20260329.png', fullPage: true })

  await page.goto('http://localhost:3000/app/profile', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.screenshot({ path: './test-results/phase2-profile-20260329.png', fullPage: true })

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
