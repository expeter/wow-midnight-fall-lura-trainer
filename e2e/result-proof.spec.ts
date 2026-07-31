import { expect, test } from '@playwright/test'

test('result preview exposes an offline Run-ID and copyable canonical proof JSON', async ({ page }) => {
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

  await page.getByRole('button', { name: 'Copy proof' }).click()
  const copied = await page.evaluate(() => (
    window as typeof window & { __copiedRunProof: string }
  ).__copiedRunProof)
  expect(JSON.parse(copied)).toMatchObject({
    runId: await runId.textContent(),
    checksumKey: 'LURA-RESULT-V1',
    claim: {
      schema: 'lura-result-v1',
      preview: true,
      run: { score: 850, durationMs: 421500, mistakes: 3 },
      phases: [
        { key: 'p1', cumulativePoints: 990, contribution: -10 },
        { key: 'intermission', cumulativePoints: 970, contribution: -20 },
        { key: 'p2', cumulativePoints: 920, contribution: -50 },
        { key: 'p3', cumulativePoints: 940, contribution: 20 },
        { key: 'p4', cumulativePoints: 850, contribution: -90 },
      ],
    },
  })

  await page.getByRole('button', { name: 'Copy result text' }).click()
  const summary = await page.evaluate(() => (
    window as typeof window & { __copiedRunProof: string }
  ).__copiedRunProof)
  expect(summary).toContain('Phase 4: 850 pts · Phase contribution −90')

  await page.getByRole('button', { name: 'Copy result image' }).click()
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __resultCanvasText: string[] }
  ).__resultCanvasText)).toEqual(expect.arrayContaining([
    '990 pts',
    'Phase contribution −10',
    '850 pts',
    'Phase contribution −90',
  ]))
})
