import { describe, expect, it } from 'vitest'
import type { AchievementSummary, PhaseResult } from './completion'
import {
  achievementCatalog,
  collectibleAchievements,
  emptyCollection,
  flawlessFullRunStreak,
  mergeEarnedAchievements,
  newlyEarnedAchievements,
  parseAchievementCollection,
  serializeAchievementCollection,
  totalPhaseClears,
  type AchievementRunRecord,
} from './achievementCollection'

const flawlessPhases: PhaseResult[] = [
  { key: 'intermission', label: 'Intermission', points: 1000, time: 60, mistakes: 0, recovery: 'passed' },
  { key: 'p2', label: 'Phase 2', points: 1000, time: 70, mistakes: 0, recovery: 'passed' },
  { key: 'p3', label: 'Phase 3', points: 1000, time: 90, mistakes: 0, recovery: 'passed' },
  { key: 'p4', label: 'Phase 4', points: 1000, time: 88, mistakes: 0, recovery: 'passed' },
]

const normalFlawless: AchievementSummary = {
  difficulty: 'Normal',
  crystalPlayer: false,
  fullSequence: true,
  mistakes: 0,
  totalScore: 1120,
  healthPotEnabled: true,
  shieldEnabled: true,
  mainAbilityEnabled: true,
  mainAbilityCasts: 120,
  phaseResults: flawlessPhases,
  wipeCount: 0,
  crystalFailures: 0,
  runeFailures: 0,
  allPhaseRecovery: true,
  recoveryUses: 4,
}

function ids(summary: AchievementSummary) {
  return collectibleAchievements(summary).map(achievement => achievement.id)
}

describe('canonical achievement rules', () => {
  const recordedRun = (
    attempt: number,
    difficulty: string,
    overrides: Partial<AchievementRunRecord> = {},
  ): AchievementRunRecord => ({
    attempt,
    difficulty,
    fullSequence: true,
    fullRunAttempt: true,
    crystalPlayer: false,
    flawless: true,
    totalScore: 1120,
    allOptions: true,
    allPhaseRecovery: true,
    phaseClears: 4,
    ...overrides,
  })

  it('awards overlapping full-run and per-phase feats without repeated variants', () => {
    expect(ids(normalFlawless)).toEqual(expect.arrayContaining([
      'ready-for-raid-night',
      'no-second-chances',
      'not-a-scratch',
      'crystal-clear-conscience',
      'rune-reader',
      'flawless-intermission',
      'flawless-p2',
      'flawless-p3',
      'flawless-p4',
      'prepared-for-every-phase',
      'never-caught-unprepared',
      'always-be-casting',
    ]))
  })

  it('awards a direct phase clear and only that phase flawless badge', () => {
    const direct = ids({
      ...normalFlawless,
      fullSequence: false,
      phaseResults: [flawlessPhases[2]],
      allPhaseRecovery: false,
    })
    expect(direct).toContain('one-phase-wonder')
    expect(direct).toContain('flawless-p3')
    expect(direct).not.toContain('flawless-p2')
  })

  it('separates first recovery use from every-phase recovery mastery', () => {
    const firstUse = ids({
      ...normalFlawless,
      fullSequence: false,
      phaseResults: [flawlessPhases[0]],
      allPhaseRecovery: false,
      recoveryUses: 1,
    })
    expect(firstUse).toContain('prepared-for-every-phase')
    expect(firstUse).not.toContain('never-caught-unprepared')
  })

  it('requires clean rune telemetry and the strict hard score threshold', () => {
    expect(ids({ ...normalFlawless, runeFailures: 1 })).not.toContain('rune-reader')
    expect(ids({ ...normalFlawless, difficulty: 'Hard', totalScore: 1100 })).not.toContain('hard-score-flawless')
    expect(ids({ ...normalFlawless, difficulty: 'Hard', totalScore: 1101 })).toContain('hard-score-flawless')
  })

  it('celebrates reducing the Phase 3 image to 0% without revealing transition tactics', () => {
    expect(ids({ ...normalFlawless, p3EarlyClear: true })).toContain('p3-early-clear')
    expect(ids({ ...normalFlawless, p3EarlyClear: false })).not.toContain('p3-early-clear')
    const achievement = achievementCatalog().find(candidate => candidate.id === 'p3-early-clear')
    expect(achievement?.requirement).toBe('Reduce L’ura to 0% during Phase 3.')
    expect(`${achievement?.flavor} ${achievement?.requirement}`).not.toMatch(/regroup|north|phase 4/i)
  })

  it('unlocks both-duty feats from canonical cross-run history', () => {
    const crystalHard = { ...normalFlawless, difficulty: 'Hard', crystalPlayer: true, totalScore: 1200 }
    const firstAwards = collectibleAchievements(crystalHard, emptyCollection(), 7)
    const afterCrystal = mergeEarnedAchievements(emptyCollection(), firstAwards, '2026-07-26T10:00:00.000Z', {
      attempt: 7,
      summary: crystalHard,
    })
    const secondAwards = collectibleAchievements({ ...crystalHard, crystalPlayer: false }, afterCrystal, 8)
    expect(secondAwards.map(achievement => achievement.id)).toEqual(expect.arrayContaining([
      'both-sides-of-crystal',
      'superhuman-both-duties',
    ]))
  })

  it('unlocks Normal and Hard impossible streaks only after five matching flawless full attempts', () => {
    const fourNormal = Array.from({ length: 4 }, (_, index) => recordedRun(index + 1, 'normal'))
    const directPractice = recordedRun(5, 'normal', {
      fullSequence: false,
      fullRunAttempt: false,
      phaseClears: 1,
    })
    const normalHistory = { ...emptyCollection(), runs: [...fourNormal, directPractice] }
    expect(collectibleAchievements(normalFlawless, normalHistory, 6).map(entry => entry.id))
      .toContain('impossible-normal-streak')
    expect(flawlessFullRunStreak([...normalHistory.runs, recordedRun(6, 'normal')], 'normal')).toBe(5)

    const failedNormal = recordedRun(7, 'normal', { fullSequence: false, flawless: false, phaseClears: 2 })
    expect(flawlessFullRunStreak([...fourNormal, failedNormal], 'normal')).toBe(0)
    expect(collectibleAchievements(normalFlawless, { ...emptyCollection(), runs: [...fourNormal, failedNormal] }, 8).map(entry => entry.id))
      .not.toContain('impossible-normal-streak')

    const fourHard = Array.from({ length: 4 }, (_, index) => recordedRun(index + 10, 'hard'))
    expect(collectibleAchievements({ ...normalFlawless, difficulty: 'Hard' }, { ...emptyCollection(), runs: fourHard }, 14).map(entry => entry.id))
      .toContain('impossible-hard-streak')
  })

  it('unlocks only the compact 10, 50, and 100 phase-clear milestones', () => {
    const history = {
      ...emptyCollection(),
      runs: [
        recordedRun(1, 'normal', { phaseClears: 4 }),
        recordedRun(2, 'normal', { fullSequence: false, fullRunAttempt: false, phaseClears: 1 }),
      ],
    }
    expect(totalPhaseClears(history.runs)).toBe(5)
    const ten = collectibleAchievements(normalFlawless, history, 3).map(entry => entry.id)
    expect(ten).not.toContain('phase-clears-10')

    const fortySixClears = Array.from({ length: 11 }, (_, index) => recordedRun(index + 20, 'normal'))
      .concat(recordedRun(31, 'normal', { fullSequence: false, fullRunAttempt: false, phaseClears: 2 }))
    expect(totalPhaseClears(fortySixClears)).toBe(46)
    expect(collectibleAchievements(normalFlawless, { ...emptyCollection(), runs: fortySixClears }, 32).map(entry => entry.id))
      .toEqual(expect.arrayContaining(['phase-clears-10', 'phase-clears-50']))

    const ninetySixClears = Array.from({ length: 24 }, (_, index) => recordedRun(index + 40, 'hard'))
    expect(collectibleAchievements(normalFlawless, { ...emptyCollection(), runs: ninetySixClears }, 70).map(entry => entry.id))
      .toEqual(expect.arrayContaining(['phase-clears-10', 'phase-clears-50', 'phase-clears-100']))
  })
})

describe('persistent achievement collection', () => {
  it('returns only achievements not already earned for the current result summary', () => {
    const awards = collectibleAchievements(normalFlawless)
    const previouslyEarned = mergeEarnedAchievements(
      emptyCollection(),
      [awards[0]],
      '2026-07-26T10:00:00.000Z',
      { attempt: 1, playerName: 'Pestivator' },
    )
    expect(newlyEarnedAchievements(awards, previouslyEarned).map(achievement => achievement.key))
      .toEqual(awards.slice(1).map(achievement => achievement.key))
  })

  it('keeps the first-earned metadata and stores one run per attempt', () => {
    const award = collectibleAchievements(normalFlawless)
    const first = mergeEarnedAchievements(emptyCollection(), award, '2026-07-26T10:00:00.000Z', {
      attempt: 4,
      playerName: 'Pestivator',
      summary: normalFlawless,
    })
    const repeated = mergeEarnedAchievements(first, award, '2026-07-27T10:00:00.000Z', {
      attempt: 4,
      summary: normalFlawless,
    })
    expect(repeated).toBe(first)
    expect(repeated.records.find(record => record.key === 'ready-for-raid-night')).toMatchObject({
      earnedAt: '2026-07-26T10:00:00.000Z',
      attempt: 4,
      playerName: 'Pestivator',
    })
    expect(repeated.runs).toHaveLength(1)
  })

  it('migrates useful legacy awards and safely drops malformed records', () => {
    const legacy = JSON.stringify({
      version: 1,
      records: [
        { key: 'movement-master:normal:crystal', earnedAt: '2026-07-26T10:00:00.000Z' },
        { key: 'invalid', earnedAt: 'not-a-date' },
      ],
    })
    const loaded = parseAchievementCollection(legacy)
    expect(loaded.records.map(record => record.key)).toContain('ready-for-raid-night')
    expect(parseAchievementCollection('{broken')).toEqual(emptyCollection())
    expect(parseAchievementCollection(serializeAchievementCollection(loaded))).toEqual(loaded)
  })

  it('publishes all 28 canonical achievements', () => {
    const catalog = achievementCatalog()
    expect(catalog.filter(achievement => achievement.available)).toHaveLength(28)
    expect(catalog.find(achievement => achievement.id === 'flawless-p1')).toMatchObject({ available: true })
    expect(new Set(catalog.map(achievement => achievement.id)).size).toBe(catalog.length)
  })
})
