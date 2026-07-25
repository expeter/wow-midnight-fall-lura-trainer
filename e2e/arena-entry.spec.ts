import { expect, test } from '@playwright/test'

// Three.js can render substantially slower on GitHub's software-only runner.
// The game caps animation-frame deltas to keep mechanics stable, so simulated
// time intentionally advances more slowly when the renderer is under load.
const MECHANIC_TIMEOUT = 20_000

test.setTimeout(60_000)

test('selects Arena 2 and enters the Phase 2 countdown', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Intermission', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

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
  await expect(page.getByText('Soak your assigned beam.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText('WAIT TO DROP')).toHaveCount(0)
  await expect(beamCountdown).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(beamCountdown).toContainText(/BEAM IN [1-4]/)
})

test('shows the early crystal drop warning on Easy only', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'easy' }).click()
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByText('WAIT TO DROP')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
})

test('continues the current Phase 2 sequence after the first Normal wipe', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByLabel('Assignment position').fill('1')
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByText(/Strike 1 \/ 2/)).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText('Practice continues')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText(/Pulled to the center|Spread your circle/)).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText(/ORBS RETURN IN/)).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText(/PHASE 2 · CYCLE 1 \/ 3/)).toBeVisible()
})

test('wipes when a non-carrier personal circle hits an NPC crystal in Phase 2', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'hard' }).click()
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByRole('alert')).toContainText('Your personal circle hit another player’s crystal', { timeout: MECHANIC_TIMEOUT })
  await expect(page.locator('.score-overlay strong')).toHaveText('400')
})

test('Space jumps while actions are locked and P pauses', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'easy' }).click()
  await page.getByLabel('Assignment position').fill('1')
  await page.getByLabel('Enable main ability').check()
  await page.getByRole('button', { name: /Enter Intermission/ }).click()

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
  await expect(page.locator('.player-castbar')).toHaveAttribute('style', /left: 50%; top: 65%/)
  await expect(page.locator('.boss-health .main-cast')).toHaveCount(0)
  await page.keyboard.press('e')
  await expect(page.locator('.crystal-countdown')).toBeVisible()

  await page.keyboard.press('p')
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
})

test('enters Phase 3 directly in non-blocking Test mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'test' }).click()
  await page.getByRole('button', { name: 'P3', exact: true }).click()
  await page.getByRole('button', { name: /Enter P3/ }).click()

  await expect(page.getByText('Get ready for Phase 3.')).toBeVisible()
  await expect(page.getByText(/PHASE 3 · SECTOR 1 \/ 2/)).toBeVisible()
  await expect(page.getByText('Thrown into the split arena.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText('Catch a yellow impact.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await page.keyboard.down('w')
  await expect(page.getByText('Complete the Soaks.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await page.keyboard.up('w')
  await expect(page.getByText(/Stars pattern disappears for five seconds/i)).toBeVisible()
  await expect(page.getByText(/BIG BOOM/)).toBeVisible()
  await expect(page.locator('.player-health')).toBeVisible()
  await expect(page.getByText('RUNE ORDER', { exact: true })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('alert')).toHaveCount(0)
})
