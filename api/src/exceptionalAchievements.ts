import type { CanonicalAchievement } from './achievementCatalog.js'
import type { Database } from './database.js'

// Server-only catalogue: client code must not import this module. Opaque IDs
// keep exceptional unlock semantics out of the browser bundle.
export const FIND_A_BUG_ACHIEVEMENT_ID = 'exceptional-7c9f34a821d6'

export const SERVER_ONLY_ACHIEVEMENTS: readonly CanonicalAchievement[] = [{
  id: FIND_A_BUG_ACHIEVEMENT_ID,
  title: 'Find a Bug',
  tier: 'Common',
  points: 10,
  season: 1,
  introducedVersion: '0.8.0',
  retiredVersion: null,
}]

export const SERVER_ONLY_ACHIEVEMENT_BY_ID = new Map(
  SERVER_ONLY_ACHIEVEMENTS.map(achievement => [achievement.id, achievement]),
)

export function isExceptionalAchievement(id: string): boolean {
  return SERVER_ONLY_ACHIEVEMENT_BY_ID.has(id)
}

export function grantExceptionalAchievement(database: Database, input: {
  accountId: number
  achievementId: string
  trainerVersion: string
  grantedBy: string
  reason: string
  grantedAt: string
}): boolean {
  const achievement = SERVER_ONLY_ACHIEVEMENT_BY_ID.get(input.achievementId)
  if (!achievement) throw new Error('unknown_exceptional_achievement')
  const attempt = database.prepare(`
    SELECT id, character_id AS characterId, build_id AS buildId
    FROM attempts WHERE account_id = ?
    ORDER BY issued_at DESC, id DESC LIMIT 1
  `).get(input.accountId) as { id: string; characterId: number; buildId: string } | undefined
  if (!attempt) throw new Error('exceptional_achievement_requires_attempt')
  database.exec('BEGIN IMMEDIATE')
  try {
    database.prepare(`
      INSERT OR IGNORE INTO achievements (id, trainer_version, title)
      VALUES (?, ?, ?)
    `).run(achievement.id, input.trainerVersion, achievement.title)
    const inserted = database.prepare(`
      INSERT OR IGNORE INTO account_achievements (
        account_id, character_id, achievement_id, trainer_version,
        build_id, source_attempt_id, first_earned_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.accountId,
      attempt.characterId,
      achievement.id,
      input.trainerVersion,
      attempt.buildId,
      attempt.id,
      input.grantedAt,
    )
    database.prepare(`
      INSERT OR IGNORE INTO exceptional_achievement_grants (
        account_id, character_id, achievement_id, granted_by, reason, granted_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      input.accountId,
      attempt.characterId,
      achievement.id,
      input.grantedBy,
      input.reason,
      input.grantedAt,
    )
    database.exec('COMMIT')
    return inserted.changes === 1
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}
