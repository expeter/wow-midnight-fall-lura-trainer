import { describe, expect, it } from 'vitest'
import { buildPhaseResult, completionAchievements, completionShareText, isFullSequenceCompletion, type PhaseResult } from './completion'

describe('completion card results', () => {
  it('scores each phase from its own 1000-point budget', () => {
    expect(buildPhaseResult('p2', 900, 775, 40, 72)).toEqual({
      key: 'p2',
      label: 'Phase 2',
      points: 875,
      time: 32,
    })
    expect(buildPhaseResult('p3', 900, 950, 40, 70, 'passed').recovery).toBe('passed')
  })

  it('unlocks the achievement only for all four phases in sequence', () => {
    const full = (['intermission', 'p2', 'p3', 'p4'] as const).map((key, index) => buildPhaseResult(key, 1000, 1000, index * 10, index * 10 + 10))
    expect(isFullSequenceCompletion(full)).toBe(true)
    expect(isFullSequenceCompletion(full.slice(1))).toBe(false)
    expect(isFullSequenceCompletion([full[0], full[2], full[1], full[3]])).toBe(false)
  })

  it('builds a compact guild-shareable result', () => {
    const results: PhaseResult[] = [buildPhaseResult('p4', 1000, 950, 0, 55)]
    const text = completionShareText({
      playerName: 'Pestivator',
      playedPosition: 'Assigned Mage — Spot 4',
      playerClass: 'Mage',
      difficulty: 'Normal',
      totalScore: 950,
      totalTime: 55,
      mistakes: 1,
      attempt: 7,
      extras: 'Shield · health responses 1/1',
      fullSequence: false,
      results,
    })
    expect(text).toContain('L’ura practice complete')
    expect(text).toContain('Phase 4: 950 pts · 55.0s')
    expect(text).toContain('1 mistake')
    expect(text).toContain('Attempt #7')
    expect(text).toContain('Played position: Assigned Mage — Spot 4')
  })

  it('differentiates mode, crystal duty, options, and superhuman flawless clears', () => {
    const achievements = completionAchievements({
      difficulty: 'Hard',
      crystalPlayer: true,
      fullSequence: true,
      mistakes: 0,
      totalScore: 1101,
      healthPotEnabled: true,
      shieldEnabled: true,
      mainAbilityEnabled: true,
    })
    expect(achievements.map(achievement => achievement.id)).toEqual([
      'movement-master',
      'flawless',
      'all-options',
      'superhuman-flawless',
    ])
    expect(achievements.find(achievement => achievement.id === 'flawless')?.detail).toBe('Crystal player')
    expect(completionAchievements({
      difficulty: 'Normal',
      crystalPlayer: false,
      fullSequence: true,
      mistakes: 0,
      totalScore: 1101,
      healthPotEnabled: true,
      shieldEnabled: true,
      mainAbilityEnabled: true,
    }).some(achievement => achievement.id === 'superhuman-flawless')).toBe(false)
    expect(completionAchievements({
      difficulty: 'Easy',
      crystalPlayer: false,
      fullSequence: false,
      mistakes: 2,
      totalScore: 900,
      healthPotEnabled: false,
      shieldEnabled: false,
      mainAbilityEnabled: false,
    })[0]).toEqual({ id: 'practice-clear', label: 'L’URA PRACTICE CLEAR', detail: 'Easy · Non-crystal player' })
  })

  it('celebrates defeating L’ura before the final Heaven and Hell', () => {
    const achievements = completionAchievements({
      difficulty: 'Normal',
      crystalPlayer: false,
      fullSequence: true,
      mistakes: 1,
      totalScore: 1250,
      healthPotEnabled: false,
      shieldEnabled: false,
      mainAbilityEnabled: true,
      earlyKill: true,
    })
    expect(achievements.some(achievement => achievement.id === 'early-kill')).toBe(true)
  })
})
