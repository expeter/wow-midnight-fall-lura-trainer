import { expect, test } from '@playwright/test'

test('publishes the trainer favicon', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.png')
  const favicon = await request.get('/favicon.png')
  expect(favicon.ok()).toBe(true)
  expect(favicon.headers()['content-type']).toBe('image/png')
  expect((await favicon.body()).byteLength).toBeGreaterThan(1000)
})

test('keeps unreleased encounter previews off public hosts', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lura-selected-position', '5')
    localStorage.setItem('lura-p2-crystal-assignments', JSON.stringify([1, 4, 7, 10, 13, 16]))
  })
  const localOrigin = process.env.LURA_E2E_PORT
    ? `http://127.0.0.1:${process.env.LURA_E2E_PORT}`
    : 'http://127.0.0.1:4173'
  const publicOrigin = localOrigin.replace('127.0.0.1', 'lura-public.test')
  await page.route(`${publicOrigin}/**`, async route => {
    const response = await route.fetch({
      url: route.request().url().replace(publicOrigin, localOrigin),
    })
    await route.fulfill({ response })
  })
  await page.goto(publicOrigin)

  await expect(page.getByRole('heading', { name: 'Two Heaven’s Lance tanks' })).toHaveCount(0)
  await expect(page.getByLabel('Taunt / tank action keybind')).toHaveCount(0)
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()
  await expect(page.getByLabel("Heaven's Lance tank mechanic")).toHaveCount(0)
  const arena = page.locator('.arena-wrap')
  await expect(arena).not.toHaveAttribute('data-lance-stage')
  await expect(arena).toHaveAttribute('data-p2-beam-assignees', /^\d+(,\d+){3}$/, { timeout: 20_000 })
  const beamAssignees = (await arena.getAttribute('data-p2-beam-assignees'))?.split(',').map(Number) ?? []
  expect(beamAssignees).not.toContain(5)
})

test('keeps optional login and public leaderboards usable without the API', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Global leaderboard' })).toBeVisible()
  await expect(page.getByLabel('Global leaderboard standings').locator(':scope > .global-leaderboard-rows > li')).toHaveCount(10)
  await expect(page.getByLabel('Your global position')).toContainText('65')
  await page.getByRole('button', { name: 'Runs' }).click()
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
  const achievementBox = await overview.locator('.achievement-summary-link').boundingBox()
  const bestRunsBox = await overview.getByLabel('Best run standings').boundingBox()
  expect(bestRunsBox!.width).toBeGreaterThan(achievementBox!.width * 1.8)
  expect(Math.abs(bestRunsBox!.width - onlineBox!.width)).toBeLessThanOrEqual(1)
  expect(await overview.locator('.best-runs-summary li small').evaluateAll(labels => labels.every(label => label.scrollWidth <= label.clientWidth))).toBe(true)
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
  const podium = page.getByLabel('Global player ranking').locator('ol')
  await expect(podium.locator('li')).toHaveCount(3)
  expect(await podium.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(3)
  expect(await podium.locator('button').evaluateAll(cards => cards.every(card => card.scrollWidth <= card.clientWidth))).toBe(true)
  await expect(page.getByLabel('Best run standings')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Top 10 leaderboard' })).toHaveCount(0)
  expect(await page.locator('.entry-choice, .global-ranking-summary, .setup-overview').evaluateAll(nodes => nodes.map(node => node.className))).toEqual([
    'entry-choice',
    'global-ranking-summary',
    'setup-overview',
  ])
  const tabs = page.getByRole('navigation', { name: 'Setup sections' })
  await expect(tabs.getByRole('button')).toHaveCount(6)
  await tabs.getByRole('button', { name: 'Keys & Mouse' }).click()
  await expect(page.getByRole('heading', { name: 'Keyboard & mouse controls' })).toBeVisible()
  await expect(practice).toBeHidden()
  await tabs.getByRole('button', { name: 'HUD' }).click()
  await expect(page.getByRole('heading', { name: 'HUD positions' })).toBeVisible()
  await page.getByRole('button', { name: 'View standings' }).click()
  await expect(page.getByRole('heading', { name: 'Global leaderboard' })).toBeVisible()
  const globalPlayers = page.locator('.global-leaderboard-rows .global-player')
  await expect(page.locator('.global-leaderboard-rows .standard-guild').first()).toBeVisible()
  const playerLefts = await globalPlayers.locator('.profile-name-button').evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().left)))
  expect(new Set(playerLefts).size).toBe(1)
  await page.getByRole('button', { name: 'Runs' }).click()
  await expect(page.getByRole('heading', { name: 'Top 10 leaderboard' })).toBeVisible()
  await expect(page.locator('.standard-columns span')).toHaveCount(5)
  await expect(page.locator('.standard-leaderboard-rows li').first().locator(':scope > *')).toHaveCount(5)
  await page.getByRole('button', { name: 'Achievement Hall' }).click()
  await expect(page.locator('.achievement-hall .standard-columns span')).toHaveCount(5)
  await expect(page.locator('.hall-rows li').first().locator(':scope > *')).toHaveCount(5)
  await page.getByRole('button', { name: 'Runs' }).click()
  await expect(page.getByRole('region', { name: 'Top 10 leaderboard' }).getByRole('button', { name: 'View full leaderboard' })).toHaveCount(0)
  await tabs.getByRole('button', { name: 'Raid plan' }).click()
  await expect(page.getByRole('heading', { name: 'Layouts and sharing' })).toBeVisible()
})

test('opens the in-page Profile achievements from the shell summary', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Open personal achievements/ }).click()
  await expect(page.getByRole('button', { name: 'Profile' })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('#personal-achievements')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Personal achievements' })).toHaveCount(0)
})

test('restores verified achievements and progress for the authenticated account', async ({ page }) => {
  await page.route('http://127.0.0.1:8787/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/v1/me') return route.fulfill({ json: {
      authenticated: true,
      achievementSyncKey: 'browser-account-one',
      region: 'eu',
      csrfToken: 'csrf-token',
      privacy: { identityMode: 'anonymous', alias: null, showGuild: 0, selectedCharacterId: null },
    } })
    if (path === '/v1/me/achievements') return route.fulfill({ json: {
      rows: [{
        achievementId: 'always-be-casting',
        trainerVersion: '0.7.2',
        buildId: 'verified-build',
        firstEarnedAt: '2026-07-26T10:00:00.000Z',
        currentlyObtainable: 1,
        characterName: 'Lurana',
        realmSlug: 'silvermoon',
      }],
      progress: {
        phaseClears: 37,
        duties: ['crystal'],
        superhumanDuties: [],
        flawlessStreaks: { normal: 3, hard: 1 },
      },
    } })
    return route.fulfill({ status: 200, json: { rows: [] } })
  })
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Open personal achievements, 1 of 32 earned' })).toBeVisible()
  await page.getByRole('button', { name: 'Open personal achievements, 1 of 32 earned' }).click()
  await expect(page.getByText(/First earned.*Lurana.*Server verified/)).toBeVisible()
  await expect(page.getByText('37 of 50 phase clears')).toBeVisible()
  expect(await page.evaluate(() => ({
    local: localStorage.getItem('lura-achievement-collection'),
    account: localStorage.getItem('lura-achievement-account:browser-account-one'),
  }))).toEqual({ local: null, account: expect.stringContaining('always-be-casting') })
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
  await jumpNav.getByRole('button', { name: 'Keys & Mouse' }).click()
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
