import { completionAchievements, type Achievement, type AchievementSummary } from './completion'

export const ACHIEVEMENT_STORAGE_KEY = 'lura-achievement-collection'

export type AchievementVariantKey = `${Achievement['id']}:${string}:${'crystal' | 'non-crystal'}`

export interface AchievementDefinition extends Achievement {
  key: AchievementVariantKey
  difficulty: string
  crystalPlayer: boolean
  icon: string
}

export interface EarnedAchievement {
  key: AchievementVariantKey
  earnedAt: string
  attempt?: number
  playerName?: string
}

export interface AchievementCollectionData {
  version: 1
  records: EarnedAchievement[]
}

const DIFFICULTIES = ['Test', 'Easy', 'Normal', 'Hard'] as const
const ICONS: Record<Achievement['id'], string> = {
  'practice-clear': '✦',
  'movement-master': '◆',
  flawless: '◇',
  'all-options': '✚',
  'superhuman-flawless': '★',
}

function normalizedDifficulty(difficulty: string): string {
  const trimmed = difficulty.trim()
  return trimmed ? `${trimmed[0].toUpperCase()}${trimmed.slice(1).toLowerCase()}` : 'Unknown'
}

export function achievementVariantKey(achievement: Achievement, summary: Pick<AchievementSummary, 'difficulty' | 'crystalPlayer'>): AchievementVariantKey {
  const difficulty = normalizedDifficulty(summary.difficulty).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${achievement.id}:${difficulty}:${summary.crystalPlayer ? 'crystal' : 'non-crystal'}`
}

export function collectibleAchievements(summary: AchievementSummary): AchievementDefinition[] {
  return completionAchievements(summary).map(achievement => ({
    ...achievement,
    key: achievementVariantKey(achievement, summary),
    difficulty: normalizedDifficulty(summary.difficulty),
    crystalPlayer: summary.crystalPlayer,
    icon: ICONS[achievement.id],
  }))
}

function scenarioAchievement(
  difficulty: string,
  crystalPlayer: boolean,
  id: Achievement['id'],
): AchievementDefinition | null {
  if ((difficulty === 'Test' || difficulty === 'Easy') && (id === 'all-options' || id === 'superhuman-flawless')) return null
  const shared = { difficulty, crystalPlayer, totalScore: 1000 }
  const summary: AchievementSummary = id === 'practice-clear'
    ? { ...shared, fullSequence: false, mistakes: 1, healthPotEnabled: false, shieldEnabled: false, mainAbilityEnabled: false }
    : id === 'movement-master'
      ? { ...shared, fullSequence: true, mistakes: 1, healthPotEnabled: false, shieldEnabled: false, mainAbilityEnabled: false }
      : id === 'flawless'
        ? { ...shared, fullSequence: true, mistakes: 0, healthPotEnabled: false, shieldEnabled: false, mainAbilityEnabled: false }
        : id === 'all-options'
          ? { ...shared, fullSequence: true, mistakes: 1, healthPotEnabled: true, shieldEnabled: true, mainAbilityEnabled: true }
          : { ...shared, fullSequence: true, mistakes: 0, totalScore: 1101, healthPotEnabled: true, shieldEnabled: true, mainAbilityEnabled: true }
  return collectibleAchievements(summary).find(achievement => achievement.id === id) ?? null
}

export function achievementCatalog(): AchievementDefinition[] {
  const ids: Achievement['id'][] = ['practice-clear', 'movement-master', 'flawless', 'all-options', 'superhuman-flawless']
  return DIFFICULTIES.flatMap(difficulty =>
    [false, true].flatMap(crystalPlayer =>
      ids.map(id => scenarioAchievement(difficulty, crystalPlayer, id)).filter((entry): entry is AchievementDefinition => Boolean(entry)),
    ),
  )
}

function isRecord(value: unknown): value is EarnedAchievement {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<EarnedAchievement>
  return typeof candidate.key === 'string'
    && /^[a-z-]+:[a-z0-9-]+:(?:crystal|non-crystal)$/.test(candidate.key)
    && typeof candidate.earnedAt === 'string'
    && !Number.isNaN(Date.parse(candidate.earnedAt))
}

export function parseAchievementCollection(raw: string | null): AchievementCollectionData {
  if (!raw) return { version: 1, records: [] }
  try {
    const parsed: unknown = JSON.parse(raw)
    const candidates = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown }).records)
        ? (parsed as { records: unknown[] }).records
        : []
    const unique = new Map<AchievementVariantKey, EarnedAchievement>()
    for (const candidate of candidates) {
      if (!isRecord(candidate) || unique.has(candidate.key)) continue
      unique.set(candidate.key, {
        key: candidate.key,
        earnedAt: candidate.earnedAt,
        ...(typeof candidate.attempt === 'number' && Number.isFinite(candidate.attempt) ? { attempt: candidate.attempt } : {}),
        ...(typeof candidate.playerName === 'string' && candidate.playerName.trim() ? { playerName: candidate.playerName.trim() } : {}),
      })
    }
    return { version: 1, records: [...unique.values()] }
  } catch {
    return { version: 1, records: [] }
  }
}

export function mergeEarnedAchievements(
  collection: AchievementCollectionData,
  awards: AchievementDefinition[],
  earnedAt: string,
  metadata: Pick<EarnedAchievement, 'attempt' | 'playerName'> = {},
): AchievementCollectionData {
  const existing = new Set(collection.records.map(record => record.key))
  const additions = awards
    .filter(award => !existing.has(award.key))
    .map(award => ({
      key: award.key,
      earnedAt,
      ...(typeof metadata.attempt === 'number' ? { attempt: metadata.attempt } : {}),
      ...(metadata.playerName?.trim() ? { playerName: metadata.playerName.trim() } : {}),
    }))
  return additions.length ? { version: 1, records: [...collection.records, ...additions] } : collection
}

export function serializeAchievementCollection(collection: AchievementCollectionData): string {
  return JSON.stringify({ version: 1, records: collection.records })
}
