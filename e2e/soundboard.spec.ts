import { expect, test } from '@playwright/test'

test('fine-tunes an experimental sound at exact millisecond and rate values', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          ;(window as typeof window & { __copiedTiming?: string }).__copiedTiming = text
        },
      },
    })
  })
  await page.goto('/tools/voice-soundboard/')

  await page.getByLabel('Timing mechanic').selectOption('stars-connect')
  const sound = page.getByLabel('Timing sound candidate')
  await expect(sound.locator('option')).toHaveCount(77)
  await expect(sound.locator('optgroup').first()).toHaveAttribute('label', 'Suggested for this mechanic')
  await expect(sound.locator('optgroup').last()).toHaveAttribute('label', 'Complete sound library · 77 clips')
  const completeDurations = await sound.locator('optgroup').last().locator('option').allTextContents()
    .then(labels => labels.map(label => label.match(/ · ([\d.]+)s$/)?.[1]).filter(Boolean).map(Number))
  expect(completeDurations).toEqual([...completeDurations].sort((left, right) => left - right))
  await sound.selectOption('tune-archangel-doom-rise')

  const exactOffset = page.getByLabel('Exact sound start offset in milliseconds')
  await exactOffset.fill('90')
  await expect(page.locator('#timing-offset-value')).toHaveText('+90 ms')
  await expect(page.locator('#timing-offset')).toHaveValue('90')
  await page.getByRole('button', { name: '−1', exact: true }).click()
  await expect(exactOffset).toHaveValue('89')

  const exactRate = page.getByLabel('Exact sound playback rate')
  await exactRate.fill('1.37')
  await expect(page.locator('#timing-rate-value')).toHaveText('1.37×')
  await expect(page.locator('#timing-rate')).toHaveValue('1.37')
  await page.getByLabel('Exact bass boost in decibels').fill('3.5')
  await page.getByLabel('Exact treble reduction in decibels').fill('2')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lura-sfx-timing-review') || '{}')['stars-connect'])
  expect(saved).toEqual({ offset: .089, rate: 1.37, bass: 3.5, treble: 2, sound: 'tune-archangel-doom-rise' })

  await page.getByRole('button', { name: '▶ Loop' }).click()
  await expect(page.locator('#timing-status')).toContainText('Looping')
  await expect(page.locator('.timing-clock')).toContainText('sound')

  await page.getByLabel('Timing mechanic').selectOption('main-ability-release')
  await expect(sound).toHaveValue('error-pulse-fast')
  await expect(exactOffset).toHaveValue('-10')
  await expect(exactRate).toHaveValue('7')
  await expect(page.getByLabel('Exact bass boost in decibels')).toHaveValue('0')
  await expect(page.getByLabel('Exact treble reduction in decibels')).toHaveValue('0')
  await page.getByRole('button', { name: 'Copy current' }).click()
  await expect(page.locator('#timing-status')).toContainText('Main Ability projectile fires tuning copied')
  const copiedTiming = await page.evaluate(() => (window as typeof window & { __copiedTiming?: string }).__copiedTiming)
  expect(copiedTiming).toContain('| main-ability-release | error-pulse-fast | -10 ms | 7.00× |')
})
