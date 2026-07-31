import { expect, test } from '@playwright/test'

test('result preview fits a compact card with a branded offline Run-ID', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    Object.defineProperty(window, '__copiedRunProof', { configurable: true, writable: true, value: '' })
    Object.defineProperty(window, '__resultCanvasText', { configurable: true, writable: true, value: [] })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          ;(window as typeof window & { __copiedRunProof: string }).__copiedRunProof = value
        },
        write: async () => {},
      },
    })
    const originalFillText = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      ;(window as typeof window & { __resultCanvasText: string[] }).__resultCanvasText.push(String(text))
      return typeof maxWidth === 'number'
        ? originalFillText.call(this, text, x, y, maxWidth)
        : originalFillText.call(this, text, x, y)
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: /preview final screen/i }).click()

  const runId = page.locator('.completion-run-id code')
  await expect(runId).toHaveText(/^LURA1-(?:[0-9A-F]{4}-){4}[0-9A-F]{4}$/)
  const phases = page.getByLabel('Phase results')
  await expect(phases).toContainText('990 pts')
  await expect(phases).toContainText('Phase contribution −10')
  await expect(phases).toContainText('850 pts')
  await expect(phases).toContainText('Phase contribution −90')

  await expect(page.getByRole('button', { name: /copy proof/i })).toHaveCount(0)
  await expect(page.getByLabel('Achievements')).toHaveCount(0)
  const card = await page.locator('.completion-card').boundingBox()
  expect(card).not.toBeNull()
  expect(card!.height).toBeLessThanOrEqual(780)
  expect(card!.y + card!.height).toBeLessThanOrEqual(890)

  await page.getByRole('button', { name: 'Copy result text' }).click()
  const copiedText = await page.evaluate(() => (
    window as typeof window & { __copiedRunProof: string }
  ).__copiedRunProof)
  expect(copiedText).toContain(`Run-ID: ${await runId.textContent()}`)
  expect(copiedText).not.toContain('Run data:')
  expect(copiedText).not.toContain(page.url())
  expect(copiedText.trimEnd()).toMatch(/Run-ID: LURA1-(?:[0-9A-F]{4}-){4}[0-9A-F]{4}$/)
  expect(copiedText).toContain('Phase 4: 850 pts · Phase contribution −90')

  await page.getByRole('button', { name: 'Copy result image' }).click()
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __resultCanvasText: string[] }
  ).__resultCanvasText)).toEqual(expect.arrayContaining([
    'RESULT SCREEN PREVIEW',
    'L’ura conquered!',
    `RUN-ID  ${await runId.textContent()}`,
    '990 pts',
    'Phase contribution −10',
    '850 pts',
    'Phase contribution −90',
  ]))
  const canvasText = await page.evaluate(() => (
    window as typeof window & { __resultCanvasText: string[] }
  ).__resultCanvasText)
  expect(canvasText).not.toEqual(expect.arrayContaining([
    expect.stringContaining('localhost'),
    expect.stringContaining('Client checksum'),
    expect.stringContaining('NEW ACHIEVEMENTS'),
  ]))
})
