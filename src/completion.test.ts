import { describe, expect, it } from 'vitest'
import { buildPhaseResult, completionAchievements, completionImageCardLayout, completionPhasePresentation, completionResultTitle, completionShareText, isFullSequenceCompletion, wrapTextByWidth, type PhaseResult } from './completion'

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

  it('unlocks the achievement only for Phase 1 through Phase 4 in sequence', () => {
    const full = (['p1', 'intermission', 'p2', 'p3', 'p4'] as const).map((key, index) => buildPhaseResult(key, 1000, 1000, index * 10, index * 10 + 10))
    expect(isFullSequenceCompletion(full)).toBe(true)
    expect(isFullSequenceCompletion(full.slice(1))).toBe(false)
    expect(isFullSequenceCompletion([full[0], full[2], full[1], full[3], full[4]])).toBe(false)
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
    expect(text).toContain('Phase 4: 950 pts · Phase contribution −50 · 55.0s')
    expect(text).toContain('1 mistake')
    expect(text).toContain('Attempt #7')
    expect(text).toContain('Played position: Assigned Mage — Spot 4')
  })

  it('presents phase results as cumulative scores with explicit contributions', () => {
    const results: PhaseResult[] = [1342, 1180, 1329, 1117, 1202].map((points, index) => ({
      key: (['p1', 'intermission', 'p2', 'p3', 'p4'] as const)[index],
      label: ['Phase 1', 'Intermission', 'Phase 2', 'Phase 3', 'Phase 4'][index],
      points,
      time: 10,
    }))

    expect(completionPhasePresentation(results).map(result => ({
      cumulative: result.cumulativePoints,
      contribution: result.contribution,
    }))).toEqual([
      { cumulative: 1342, contribution: 342 },
      { cumulative: 1522, contribution: 180 },
      { cumulative: 1851, contribution: 329 },
      { cumulative: 1968, contribution: 117 },
      { cumulative: 2170, contribution: 202 },
    ])
    expect(completionShareText({
      playerName: 'Pestivator',
      playerClass: 'Mage',
      difficulty: 'Normal',
      totalScore: 2170,
      totalTime: 50,
      mistakes: 0,
      attempt: 1,
      extras: 'Standard movement mechanics',
      fullSequence: true,
      results,
    })).toContain('Phase 4: 2170 pts · Phase contribution +202')
  })

  it('reduces cumulative score for a negative contribution and preserves direct practice baseline', () => {
    const sequence = completionPhasePresentation([
      { key: 'p1', label: 'Phase 1', points: 1100, time: 10 },
      { key: 'intermission', label: 'Intermission', points: 925, time: 10 },
    ])
    expect(sequence.map(result => [result.cumulativePoints, result.contribution])).toEqual([[1100, 100], [1025, -75]])

    const direct = completionPhasePresentation([{ key: 'p4', label: 'Phase 4', points: 950, time: 55 }])
    expect(direct[0]).toMatchObject({ cumulativePoints: 950, contribution: -50 })
  })

  it('keeps five phase cards and long completion text inside the copied image', () => {
    const cards = completionImageCardLayout(5)
    expect(cards).toHaveLength(5)
    expect(cards[0].x).toBe(70)
    expect(cards.at(-1)!.x + cards.at(-1)!.width).toBeCloseTo(1130)
    expect(cards.every(card => card.width >= 200)).toBe(true)

    const lines = wrapTextByWidth(
      'OPTIONAL CHALLENGES · 9 recovery items used + Main ability used + 20% boss damage + 100 points · health responses 5/5',
      520,
      value => value.length * 10,
    )
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every(line => line.length * 10 <= 520)).toBe(true)
  })

  it('celebrates a zero-mistake full clear in the result and share-image title', () => {
    expect(completionResultTitle(true, 0)).toBe('L’URA CONQUERED FLAWLESSLY')
    expect(completionResultTitle(true, 1)).toBe('L’URA CONQUERED')
    expect(completionResultTitle(false, 0)).toBe('L’URA PRACTICE CLEAR')
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
      allPhaseRecovery: true,
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
