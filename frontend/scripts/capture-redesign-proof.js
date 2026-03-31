import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } })

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.screenshot({ path: './test-results/redesign-public-20260329.png', fullPage: true })

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.fill('[data-testid="login-email"]', 'demo@edunova.ai')
  await page.fill('[data-testid="login-password"]', 'Demo1234!')
  await page.click('[data-testid="login-submit"]')
  await page.waitForURL(/\/app\/(dashboard)?/, { timeout: 20000 })
  await page.waitForSelector('[data-testid="global-navbar"]', { timeout: 20000 })
  await page.screenshot({ path: './test-results/redesign-app-20260329.png', fullPage: true })

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.click('a[href="/#course-preview"]')
  await page.waitForURL('**/#course-preview', { timeout: 20000 })
  await page.waitForTimeout(900)
  const scrollY = await page.evaluate(() => window.scrollY)
  const sectionTop = await page.evaluate(() => {
    const section = document.getElementById('course-preview')
    if (!section) {
      return -1
    }
    return Math.round(section.getBoundingClientRect().top)
  })
  await page.screenshot({ path: './test-results/redesign-hash-course-preview-20260329.png', fullPage: true })
  console.log(`hash-nav-scrollY=${scrollY}; sectionTop=${sectionTop}`)

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
