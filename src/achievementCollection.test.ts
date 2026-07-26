import { describe, expect, it } from 'vitest'
import {
  achievementCatalog,
  collectibleAchievements,
  mergeEarnedAchievements,
  parseAchievementCollection,
  serializeAchievementCollection,
} from './achievementCollection'

const baseSummary = {
  difficulty: 'Easy',
  crystalPlayer: false,
  fullSequence: false,
  mistakes: 1,
  totalScore: 900,
  healthPotEnabled: false,
  shieldEnabled: false,
  mainAbilityEnabled: false,
}

describe('persistent achievement collection', () => {
  it('keeps difficulty and crystal-duty variants independent', () => {
    const easyNonCrystal = collectibleAchievements(baseSummary)
    const hardCrystal = collectibleAchievements({ ...baseSummary, difficulty: 'Hard', crystalPlayer: true })
    expect(easyNonCrystal[0].key).toBe('practice-clear:easy:non-crystal')
    expect(hardCrystal[0].key).toBe('practice-clear:hard:crystal')
    expect(easyNonCrystal[0].key).not.toBe(hardCrystal[0].key)
  })

  it('builds locked catalogue entries through the existing completion rules', () => {
    const catalog = achievementCatalog()
    expect(catalog.some(entry => entry.key === 'movement-master:normal:crystal')).toBe(true)
    expect(catalog.some(entry => entry.key === 'flawless:hard:non-crystal')).toBe(true)
    expect(catalog.some(entry => entry.key === 'superhuman-flawless:hard:crystal')).toBe(true)
    expect(catalog.some(entry => entry.key === 'superhuman-flawless:hard:non-crystal')).toBe(false)
    expect(catalog.some(entry => entry.key === 'all-options:easy:crystal')).toBe(false)
    expect(catalog.some(entry => entry.key === 'early-kill:normal:non-crystal')).toBe(true)
  })

  it('preserves the first-earned timestamp when an award is earned again', () => {
    const award = collectibleAchievements(baseSummary)
    const first = mergeEarnedAchievements({ version: 1, records: [] }, award, '2026-07-26T10:00:00.000Z', { attempt: 4, playerName: 'Pestivator' })
    const repeated = mergeEarnedAchievements(first, award, '2026-07-27T10:00:00.000Z', { attempt: 5 })
    expect(repeated).toBe(first)
    expect(repeated.records[0]).toEqual({
      key: 'practice-clear:easy:non-crystal',
      earnedAt: '2026-07-26T10:00:00.000Z',
      attempt: 4,
      playerName: 'Pestivator',
    })
  })

  it('loads legacy arrays and safely drops malformed records', () => {
    const legacy = JSON.stringify([
      { key: 'practice-clear:easy:non-crystal', earnedAt: '2026-07-26T10:00:00.000Z' },
      { key: 'invalid', earnedAt: 'not-a-date' },
      { key: 'practice-clear:easy:non-crystal', earnedAt: '2026-07-27T10:00:00.000Z' },
    ])
    const loaded = parseAchievementCollection(legacy)
    expect(loaded.records).toHaveLength(1)
    expect(parseAchievementCollection('{broken')).toEqual({ version: 1, records: [] })
    expect(parseAchievementCollection(serializeAchievementCollection(loaded))).toEqual(loaded)
  })
})
