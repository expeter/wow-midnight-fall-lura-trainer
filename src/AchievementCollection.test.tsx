import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AchievementCollection, { AchievementBadgeSummary } from './AchievementCollection'
import { collectibleAchievements, mergeEarnedAchievements } from './achievementCollection'

describe('achievement collection UI', () => {
  const awards = collectibleAchievements({
    difficulty: 'Easy',
    crystalPlayer: false,
    fullSequence: false,
    mistakes: 1,
    totalScore: 900,
    healthPotEnabled: false,
    shieldEnabled: false,
    mainAbilityEnabled: false,
  })
  const collection = mergeEarnedAchievements({ version: 1, records: [] }, awards, '2026-07-26T10:00:00.000Z', { playerName: 'Pestivator' })

  it('shows earned and locked variants with their first-earned details', () => {
    render(<AchievementCollection collection={collection} />)
    expect(screen.getByRole('heading', { name: 'Movement collection' })).toBeInTheDocument()
    expect(screen.getByText(/First earned.*Pestivator/)).toBeInTheDocument()
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Easy · Non-crystal player').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hard · Crystal player').length).toBeGreaterThan(0)
  })

  it('links the compact badge summary to the collection', () => {
    render(<AchievementBadgeSummary collection={collection} />)
    expect(screen.getByRole('link', { name: /Achievements 1 of .* earned/i })).toHaveAttribute('href', '#achievements')
  })
})
