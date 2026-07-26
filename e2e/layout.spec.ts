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
})
