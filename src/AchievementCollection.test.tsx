import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AchievementCollection, { AchievementBadgeSummary, AchievementUnlockPopups } from './AchievementLedger'
import { achievementCatalog, type AchievementCollectionData } from './achievementCollection'

const collection: AchievementCollectionData = {
  version: 2,
  records: [{
    key: 'always-be-casting',
    earnedAt: '2026-07-26T10:00:00.000Z',
    attempt: 4,
    playerName: 'Pestivator',
  }],
  runs: [],
}

describe('achievement collection UI', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
  it('groups canonical earned and locked badges', () => {
    render(<AchievementCollection collection={collection} />)
    expect(screen.getByRole('heading', { name: 'L’ura’s movement ledger' })).toBeInTheDocument()
    for (const cluster of ['Foundations', 'Precision', 'Tools of the Trade', 'Feats of Movement']) {
      expect(screen.getByRole('heading', { name: cluster })).toBeInTheDocument()
    }
    const earned = screen.getByRole('article', { name: /Always Be Casting/i })
    expect(within(earned).getByText('Earned')).toBeInTheDocument()
    expect(within(earned).getByText(/First earned.*Pestivator.*Attempt #4/)).toBeInTheDocument()
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0)
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })

  it('opens personal achievements from the compact summary', async () => {
    const onOpen = vi.fn()
    render(<AchievementBadgeSummary collection={collection} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open personal achievements, 1 of 28 earned' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('shows newly earned achievements as compact live cards with title and flavor text', () => {
    const achievement = achievementCatalog().find(entry => entry.key === 'always-be-casting')!
    render(<AchievementUnlockPopups achievements={[achievement]} />)
    const popups = screen.getByLabelText('New achievements')
    expect(popups).toHaveAttribute('aria-live', 'polite')
    expect(within(popups).getByText('Achievement unlocked')).toBeInTheDocument()
    expect(within(popups).getByText('Always Be Casting')).toBeInTheDocument()
    expect(within(popups).getByText(/perfect footwork leaves room/i)).toBeInTheDocument()
  })

  it('copies a shareable achievement-ledger image from the compact clipboard action', async () => {
    const user = userEvent.setup()
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write } })
    vi.stubGlobal('ClipboardItem', class {
      constructor(public data: Record<string, Blob>) {}
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      set fillStyle(_value: string | CanvasGradient) {},
      set strokeStyle(_value: string | CanvasGradient) {},
      set lineWidth(_value: number) {},
      set font(_value: string) {},
      set textAlign(_value: CanvasTextAlign) {},
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['ledger'], { type: 'image/png' })))

    const view = render(<AchievementCollection collection={collection} />)
    await user.click(within(view.container).getByRole('button', { name: 'Copy achievement ledger image' }))

    expect(write).toHaveBeenCalledOnce()
    expect(within(view.container).getByRole('status')).toHaveTextContent('Achievement image copied')
  })
})
