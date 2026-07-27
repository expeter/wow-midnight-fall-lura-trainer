import { expect, test } from '@playwright/test'

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
  const sharing = page.getByRole('group', { name: 'Raid-plan sharing' })
  const firstPlan = page.getByLabel('Intermission position map')
  const [hudBounds, sharingBounds, planBounds] = await Promise.all([hud.boundingBox(), sharing.boundingBox(), firstPlan.boundingBox()])
  expect(hudBounds).not.toBeNull()
  expect(sharingBounds).not.toBeNull()
  expect(planBounds).not.toBeNull()
  expect(sharingBounds!.y).toBeGreaterThan(hudBounds!.y + hudBounds!.height)
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
  const headings = [
    page.getByRole('heading', { name: 'Practice configuration' }),
    page.getByRole('heading', { name: 'Keyboard & mouse controls' }),
    page.getByRole('heading', { name: 'HUD positions' }),
    page.getByRole('heading', { name: 'Layouts and sharing' }),
    page.getByRole('heading', { name: 'Opening positions' }),
  ]
  const bounds = await Promise.all(headings.map(heading => heading.boundingBox()))
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
    [page.getByRole('heading', { name: 'Layouts and sharing' }).locator('..'), page.getByRole('group', { name: 'Raid-plan sharing' })],
    [page.getByRole('heading', { name: 'Opening positions' }).locator('..'), page.getByLabel('Intermission position map')],
  ]
  for (const [heading, content] of headingContentPairs) {
    const [headingBounds, contentBounds] = await Promise.all([heading.boundingBox(), content.boundingBox()])
    expect(headingBounds).not.toBeNull()
    expect(contentBounds).not.toBeNull()
    expect(contentBounds!.y - (headingBounds!.y + headingBounds!.height)).toBeGreaterThanOrEqual(10)
    expect(contentBounds!.y - (headingBounds!.y + headingBounds!.height)).toBeLessThanOrEqual(18)
  }

  const jumpNav = page.getByRole('navigation', { name: 'Setup sections' })
  await expect(jumpNav.getByRole('link')).toHaveCount(4)
  await page.evaluate(() => history.replaceState(null, '', '#raidplan=preserve-this-hash'))
  await jumpNav.getByRole('link', { name: 'Raid plan' }).click()
  await expect(page).toHaveURL(/#raidplan=preserve-this-hash$/)
  await expect(page.getByRole('heading', { name: 'Layouts and sharing' })).toBeInViewport()
})
