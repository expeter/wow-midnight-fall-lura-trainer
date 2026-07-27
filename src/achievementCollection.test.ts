import { describe, expect, it } from 'vitest'
import type { AchievementSummary, PhaseResult } from './completion'
import {
  achievementCatalog,
  collectibleAchievements,
  emptyCollection,
  mergeEarnedAchievements,
  parseAchievementCollection,
  serializeAchievementCollection,
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
}

function ids(summary: AchievementSummary) {
  return collectibleAchievements(summary).map(achievement => achievement.id)
}

describe('canonical achievement rules', () => {
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
})

describe('persistent achievement collection', () => {
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

  it('publishes 21 available canonical achievements and one P1 teaser', () => {
    const catalog = achievementCatalog()
    expect(catalog.filter(achievement => achievement.available)).toHaveLength(21)
    expect(catalog.find(achievement => achievement.id === 'flawless-p1')).toMatchObject({ available: false })
    expect(new Set(catalog.map(achievement => achievement.id)).size).toBe(catalog.length)
  })
})
