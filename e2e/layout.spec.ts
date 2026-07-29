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
  await page.getByRole('button', { name: 'Online profile & leaderboard' }).click()
  const panel = page.getByRole('region', { name: 'Top 10 leaderboard' })
  await expect(panel).toBeVisible()
  await expect(panel.getByText(/Local play still works|Anonymous play remains fully available/)).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
    'href',
    'http://127.0.0.1:8787/v1/auth/battlenet/start?region=eu',
  )
  await panel.getByLabel('Battle.net region').selectOption('us')
  await expect(panel.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
    'href',
    'http://127.0.0.1:8787/v1/auth/battlenet/start?region=us',
  )
  await expect(panel.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy.html')
  await expect(panel.getByRole('button', { name: 'View full leaderboard' })).toBeVisible()
  const box = await panel.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
})

test('keeps practice first while exposing Online and Raid plan as shallow tabs', async ({ page }) => {
  await page.goto('/')
  const practice = page.getByRole('heading', { name: 'Practice configuration' })
  const assignment = page.getByRole('group', { name: 'Selected assignment' })
  const difficulty = page.getByRole('group', { name: 'Difficulty & movement' })
  await expect(practice).toBeVisible()
  await expect(assignment.getByLabel('Your player name')).toBeVisible()
  await expect(difficulty.getByLabel('Your player name')).toHaveCount(0)
  const tabs = page.getByRole('navigation', { name: 'Setup sections' })
  await expect(tabs.getByRole('button')).toHaveCount(3)
  await tabs.getByRole('button', { name: 'Online profile & leaderboard' }).click()
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
    page.getByRole('group', { name: 'Selected assignment' }),
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

test('setup topics use one clear heading hierarchy in document order', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const practiceHeadings = [
    page.getByRole('heading', { name: 'Practice configuration' }),
    page.getByRole('heading', { name: 'Keyboard & mouse controls' }),
    page.getByRole('heading', { name: 'HUD positions' }),
  ]
  const bounds = await Promise.all(practiceHeadings.map(heading => heading.boundingBox()))
  expect(bounds.every(Boolean)).toBe(true)
  for (let index = 1; index < bounds.length; index += 1) {
    expect(bounds[index]!.y).toBeGreaterThan(bounds[index - 1]!.y)
  }
  await expect(page.getByRole('group', { name: 'Input bindings' })).toBeVisible()
  await expect(page.getByText('GAME SETTINGS', { exact: true })).toBeVisible()
  await expect(page.getByText('KEYBOARD SETTINGS', { exact: true })).toBeVisible()

  const headingContentPairs = [
    [page.getByRole('heading', { name: 'Practice configuration' }).locator('..'), page.getByRole('group', { name: 'Difficulty & movement' })],
    [page.getByRole('heading', { name: 'Keyboard & mouse controls' }).locator('..'), page.getByRole('group', { name: 'Input bindings' })],
  ]
  for (const [heading, content] of headingContentPairs) {
    const [headingBounds, contentBounds] = await Promise.all([heading.boundingBox(), content.boundingBox()])
    expect(headingBounds).not.toBeNull()
    expect(contentBounds).not.toBeNull()
    expect(contentBounds!.y - (headingBounds!.y + headingBounds!.height)).toBeGreaterThanOrEqual(10)
    expect(contentBounds!.y - (headingBounds!.y + headingBounds!.height)).toBeLessThanOrEqual(18)
  }

  const jumpNav = page.getByRole('navigation', { name: 'Setup sections' })
  await expect(jumpNav.getByRole('button')).toHaveCount(3)
  await page.evaluate(() => history.replaceState(null, '', '#raidplan=preserve-this-hash'))
  await jumpNav.getByRole('button', { name: 'Raid plan' }).click()
  await expect(page).toHaveURL(/#raidplan=preserve-this-hash$/)
  await expect(page.getByRole('heading', { name: 'Layouts and sharing' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Opening positions' })).toBeVisible()
})
