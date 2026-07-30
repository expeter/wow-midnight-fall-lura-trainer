import { expect, test } from '@playwright/test'

test('publishes the trainer favicon', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.png')
  const favicon = await request.get('/favicon.png')
  expect(favicon.ok()).toBe(true)
  expect(favicon.headers()['content-type']).toBe('image/png')
  expect((await favicon.body()).byteLength).toBeGreaterThan(1000)
})

test('keeps optional login and public leaderboards usable without the API', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Top 10 leaderboard' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Login with Battle.net' })).toHaveCount(0)
  await expect(panel.getByRole('button', { name: 'Normal · Crystal' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Hard · Crystal' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Normal · Non-crystal' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Hard · Non-crystal' })).toBeVisible()
  await expect(panel.getByLabel('Search public leaderboard')).toBeVisible()
  await page.getByRole('button', { name: 'Profile', exact: true }).click()
  const profile = page.getByRole('region', { name: 'My characters' })
  await expect(profile.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
    'href',
    'http://127.0.0.1:8787/v1/auth/battlenet/start?region=eu',
  )
  await profile.getByLabel('Battle.net region').selectOption('us')
  await expect(profile.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
    'href',
    'http://127.0.0.1:8787/v1/auth/battlenet/start?region=us',
  )
  await expect(profile.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy.html')
  const box = await profile.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
})

test('keeps all overview ranking cards inside the desktop page boundary', async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 816 })
  await page.goto('/')
  const overview = page.locator('.setup-overview')
  const online = page.getByLabel('Current online standings')
  const [overviewBox, onlineBox] = await Promise.all([overview.boundingBox(), online.boundingBox()])
  expect(overviewBox).not.toBeNull()
  expect(onlineBox).not.toBeNull()
  expect(onlineBox!.x + onlineBox!.width).toBeLessThanOrEqual(overviewBox!.x + overviewBox!.width + 1)
})

test('orders game start, global Top 3, and player summaries before setup sections', async ({ page }) => {
  await page.goto('/')
  const practice = page.getByRole('heading', { name: 'Practice configuration' })
  const assignment = page.getByRole('group', { name: 'Character to play' })
  const difficulty = page.getByRole('group', { name: 'Difficulty & movement' })
  await expect(practice).toBeVisible()
  await expect(assignment.getByLabel('Name used in practice')).toBeVisible()
  await expect(difficulty.getByLabel('Name used in practice')).toHaveCount(0)
  await expect(page.getByLabel('Current practice configuration')).toContainText('Normal · Non-crystal')
  await expect(page.getByLabel('Global player ranking')).toBeVisible()
  await expect(page.getByLabel('Best run standings')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Top 10 leaderboard' })).toHaveCount(0)
  expect(await page.locator('.entry-choice, .global-ranking-summary, .setup-overview').evaluateAll(nodes => nodes.map(node => node.className))).toEqual([
    'entry-choice',
    'global-ranking-summary',
    'setup-overview',
  ])
  const tabs = page.getByRole('navigation', { name: 'Setup sections' })
  await expect(tabs.getByRole('button')).toHaveCount(6)
  await tabs.getByRole('button', { name: 'Keyboard settings' }).click()
  await expect(page.getByRole('heading', { name: 'Keyboard & mouse controls' })).toBeVisible()
  await expect(practice).toBeHidden()
  await tabs.getByRole('button', { name: 'HUD' }).click()
  await expect(page.getByRole('heading', { name: 'HUD positions' })).toBeVisible()
  await page.getByRole('button', { name: 'View standings' }).click()
  await expect(page.getByRole('heading', { name: 'Top 10 leaderboard' })).toBeVisible()
  await page.getByRole('region', { name: 'Top 10 leaderboard' }).getByRole('button', { name: 'View full leaderboard' }).click()
  await expect(page.getByRole('heading', { name: 'Full leaderboard' })).toBeVisible()
  await tabs.getByRole('button', { name: 'Raid plan' }).click()
  await expect(page.getByRole('heading', { name: 'Layouts and sharing' })).toBeVisible()
})

test('raidlead menu exposes system voice selection and preview', async ({ page }) => {
  await page.goto('/')
  const tts = page.getByRole('group', { name: 'TTS settings' })
  await expect(tts.getByLabel('Raidlead voice')).toBeVisible()
  await expect(tts.getByRole('option', { name: 'Automatic · English system default' })).toBeAttached()
  await expect(tts.getByRole('button', { name: 'Preview voice' })).toBeEnabled()
  await expect(tts).toContainText('Only installed English voices are listed')
})

test('creator card stays inside the setup layout with readable text', async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    const card = page.getByLabel('About Pestivator')
    await expect(card).toBeVisible()
    const bounds = await card.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    const textSizes = await card.locator(':scope > div > span, :scope strong, :scope .battle-tag-link, :scope nav a').evaluateAll(elements =>
      elements.map(element => parseFloat(getComputedStyle(element).fontSize)),
    )
    expect(textSizes.length).toBeGreaterThan(0)
    expect(Math.min(...textSizes)).toBeGreaterThanOrEqual(16)
  }
})

test('raid sharing spans the setup width between HUD settings and raid planning', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'HUD' }).click()
  const hud = page.getByLabel('Phase 2 HUD layout preview')
  const hudBounds = await hud.boundingBox()
  await page.getByRole('button', { name: 'Raid plan', exact: true }).click()
  const sharing = page.getByRole('group', { name: 'Raid-plan sharing' })
  const firstPlan = page.getByLabel('Intermission position map')
  const [sharingBounds, planBounds] = await Promise.all([sharing.boundingBox(), firstPlan.boundingBox()])
  expect(hudBounds).not.toBeNull()
  expect(sharingBounds).not.toBeNull()
  expect(planBounds).not.toBeNull()
  expect(planBounds!.y).toBeGreaterThan(sharingBounds!.y + sharingBounds!.height)
  expect(sharingBounds!.width).toBeCloseTo(planBounds!.width, 0)
  await expect(page.getByText('INTERMISSION RAID PLAN')).toBeVisible()
})

test('game settings use one compact three-card row on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 })
  await page.goto('/')
  const cards = [
    page.getByRole('group', { name: 'Difficulty & movement' }),
    page.getByRole('group', { name: 'Character to play' }),
    page.getByRole('group', { name: 'Combat actions' }),
  ]
  const bounds = await Promise.all(cards.map(card => card.boundingBox()))
  expect(bounds.every(Boolean)).toBe(true)
  expect(Math.max(...bounds.map(box => box!.y)) - Math.min(...bounds.map(box => box!.y))).toBeLessThan(2)
  expect(bounds[0]!.x).toBeLessThan(bounds[1]!.x)
  expect(bounds[1]!.x).toBeLessThan(bounds[2]!.x)
  expect(bounds[0]!.x + bounds[0]!.width).toBeLessThan(bounds[1]!.x)
  expect(bounds[1]!.x + bounds[1]!.width).toBeLessThan(bounds[2]!.x)

  const difficultyButtons = ['test', 'easy', 'normal', 'hard'].map(name => page.getByRole('button', { name, exact: true }))
  const difficultyBounds = await Promise.all(difficultyButtons.map(button => button.boundingBox()))
  expect(difficultyBounds.every(Boolean)).toBe(true)
  expect(difficultyBounds[0]!.y).toBeCloseTo(difficultyBounds[1]!.y, 0)
  expect(difficultyBounds[2]!.y).toBeCloseTo(difficultyBounds[3]!.y, 0)
  expect(difficultyBounds[2]!.y).toBeGreaterThan(difficultyBounds[0]!.y + difficultyBounds[0]!.height)
  for (const button of difficultyButtons) {
    expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
})

test('setup tabs preserve the raid-plan hash and expose one section at a time', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Practice configuration' })).toBeVisible()
  await expect(page.getByText('GAME SETTINGS', { exact: true })).toBeVisible()
  await expect(page.getByText('KEYBOARD SETTINGS', { exact: true })).toBeHidden()

  const jumpNav = page.getByRole('navigation', { name: 'Setup sections' })
  await expect(jumpNav.getByRole('button')).toHaveCount(6)
  await jumpNav.getByRole('button', { name: 'Keyboard settings' }).click()
  await expect(page.getByRole('group', { name: 'Input bindings' })).toBeVisible()
  await expect(page.getByText('GAME SETTINGS', { exact: true })).toBeHidden()
  await page.evaluate(() => history.replaceState(null, '', '#raidplan=preserve-this-hash'))
  await jumpNav.getByRole('button', { name: 'Raid plan' }).click()
  await expect(page).toHaveURL(/#raidplan=preserve-this-hash$/)
  await expect(page.getByRole('heading', { name: 'Layouts and sharing' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Opening positions' })).toBeVisible()
})

test('raid-plan save confirms visibly and P2 crystal changes preserve positions', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Setup sections' }).getByRole('button', { name: 'Raid plan' }).click()

  const positionsBefore = await page.evaluate(() => ({
    soak: localStorage.getItem('lura-p2-player-positions'),
    spread: localStorage.getItem('lura-p2-spread-positions'),
  }))
  await page.getByLabel('Phase 2 crystal 1').selectOption('0')
  await page.getByRole('button', { name: 'Save layout' }).click()

  await expect(page.getByRole('button', { name: '✓ Layout saved' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Layout saved')
  await expect.poll(() => page.evaluate(() => ({
    soak: localStorage.getItem('lura-p2-player-positions'),
    spread: localStorage.getItem('lura-p2-spread-positions'),
  }))).toEqual(positionsBefore)
})
