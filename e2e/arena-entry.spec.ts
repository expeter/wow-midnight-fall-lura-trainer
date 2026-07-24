import { expect, test } from '@playwright/test'

test('selects Arena 2 and enters the Phase 2 countdown', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Arena 1 → Arena 2' })).toBeVisible()
  await page.getByRole('button', { name: 'Arena 2 only' }).click()
  await page.getByRole('button', { name: /Enter Arena 2/ }).click()

  await expect(page.getByText('Get ready for Phase 2.')).toBeVisible()
  await expect(page.getByText(/PHASE 2 · CYCLE 1 \/ 3/)).toBeVisible()
  await expect(page.getByText('Points')).toBeVisible()
  await expect(page.getByText(/raid begins stacked in the middle/i)).toBeVisible()

  const viewportFits = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }))
  expect(viewportFits.documentHeight).toBeLessThanOrEqual(viewportFits.viewportHeight)

  const beamCountdown = page.locator('.beam-drop-counter')
  await expect(page.getByText('Soak your assigned beam.')).toBeVisible({ timeout: 6_000 })
  await expect(page.getByText('WAIT TO DROP')).toHaveCount(0)
  await expect(beamCountdown).toBeVisible({ timeout: 6_000 })
  await expect(beamCountdown).toContainText(/BEAM IN [1-4]/)
})

test('shows the early crystal drop warning on Easy only', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'easy' }).click()
  await page.getByRole('button', { name: 'Arena 2 only' }).click()
  await page.getByRole('button', { name: /Enter Arena 2/ }).click()

  await expect(page.getByText('WAIT TO DROP')).toBeVisible({ timeout: 6_000 })
})

test('continues the current Phase 2 sequence after the first Normal wipe', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByLabel('Assignment position').fill('1')
  await page.getByRole('button', { name: 'Arena 2 only' }).click()
  await page.getByRole('button', { name: /Enter Arena 2/ }).click()

  await expect(page.getByText(/Strike 1 \/ 2/)).toBeVisible({ timeout: 8_000 })
  await expect(page.getByText('Practice continues')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText(/Pulled to the center|Spread your circle/)).toBeVisible({ timeout: 4_000 })
  await expect(page.getByText(/PHASE 2 · CYCLE 1 \/ 3/)).toBeVisible()
})

test('Space jumps while actions are locked and P pauses', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'easy' }).click()
  await page.getByLabel('Assignment position').fill('1')
  await page.getByLabel('Enable main ability').check()
  await page.getByRole('button', { name: /Enter Arena 1/ }).click()

  await expect(page.getByText('Take your position.')).toBeVisible({ timeout: 3_000 })
  await page.keyboard.press('Space')
  const arena = page.locator('.arena-wrap')
  await expect(arena).toHaveAttribute('data-personal-jump', 'true')

  await page.keyboard.press('f')
  await page.keyboard.press('e')
  await expect(page.locator('.score-overlay strong')).toHaveText('1000')
  await expect(page.locator('.crystal-countdown')).toHaveCount(0)

  await expect(arena).toHaveAttribute('data-personal-jump', 'false', { timeout: 1_000 })
  await page.keyboard.press('f')
  await expect(page.locator('.score-overlay strong')).toHaveText('1001')
  await expect(page.locator('.player-castbar')).toBeVisible()
  await expect(page.locator('.player-castbar')).toHaveAttribute('style', /left: 50%; top: 66%/)
  await expect(page.locator('.boss-health .main-cast')).toHaveCount(0)
  await page.keyboard.press('e')
  await expect(page.locator('.crystal-countdown')).toBeVisible()

  await page.keyboard.press('p')
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
})
