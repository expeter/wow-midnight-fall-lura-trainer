import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AchievementCollection, { AchievementBadgeSummary, AchievementUnlockPopups } from './AchievementCollection'
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
  it('groups canonical earned, locked, and coming-soon badges', () => {
    render(<AchievementCollection collection={collection} />)
    expect(screen.getByRole('heading', { name: 'L’ura’s movement ledger' })).toBeInTheDocument()
    for (const cluster of ['Foundations', 'Precision', 'Tools of the Trade', 'Feats of Movement']) {
      expect(screen.getByRole('heading', { name: cluster })).toBeInTheDocument()
    }
    const earned = screen.getByRole('article', { name: /Always Be Casting/i })
    expect(within(earned).getByText('Earned')).toBeInTheDocument()
    expect(within(earned).getByText(/First earned.*Pestivator.*Attempt #4/)).toBeInTheDocument()
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0)
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('links the compact one-of-twenty summary to the ledger', () => {
    render(<AchievementBadgeSummary collection={collection} />)
    expect(screen.getByRole('link', { name: 'Achievements 1 of 20 earned' })).toHaveAttribute('href', '#achievements')
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
})
