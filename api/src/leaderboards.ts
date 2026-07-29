import type { Database } from './database.js'

export type Difficulty = 'normal' | 'hard'
export type Duty = 'crystal' | 'non-crystal'

interface LeaderboardQuery {
  difficulty: Difficulty
  duty: Duty
  version?: string
  season?: string
  limit: number
  offset: number
  search?: string
}

interface RawLeaderboardRow {
  result_id: number
  identity_mode: 'anonymous' | 'alias' | 'character'
  alias: string | null
  show_guild: number
  character_name: string
  region: 'eu' | 'us'
  realm_slug: string
  guild_name: string | null
  score: number
  duration_ms: number
  trainer_version: string
  build_id: string
  accepted_at: string
}

export interface PublicLeaderboardRow {
  id: number
  rank: number
  displayName: string
  character: string | null
  realm: string | null
  region: 'eu' | 'us' | null
  guild: string | null
  score: number
  durationMs: number
  trainerVersion: string
  buildId: string
  acceptedAt: string
}

const publicSearchClause = `
  AND (
    p.identity_mode = 'alias' AND p.alias IS NOT NULL AND p.alias LIKE ? COLLATE NOCASE
    OR p.identity_mode = 'character' AND (
      c.name LIKE ? COLLATE NOCASE OR c.realm_slug LIKE ? COLLATE NOCASE
    )
    OR p.identity_mode != 'anonymous' AND p.show_guild = 1
      AND c.guild_name IS NOT NULL AND c.guild_name LIKE ? COLLATE NOCASE
  )
`

export function listLeaderboard(database: Database, query: LeaderboardQuery): PublicLeaderboardRow[] {
  const search = query.search?.trim()
  const releaseClause = query.season
    ? 'r.leaderboard_season = ?'
    : 'r.trainer_version = ?'
  const statement = database.prepare(`
    SELECT
      r.id AS result_id,
      p.identity_mode,
      p.alias,
      p.show_guild,
      c.name AS character_name,
      c.region,
      c.realm_slug,
      c.guild_name,
      r.score,
      r.duration_ms,
      r.trainer_version,
      r.build_id,
      r.accepted_at
    FROM results r
    JOIN characters c ON c.id = r.character_id
    JOIN privacy_settings p ON p.account_id = r.account_id
    WHERE r.difficulty = ? AND r.duty = ? AND ${releaseClause}
      AND r.run_eligible = 1
      AND p.identity_mode != 'anonymous'
      ${search ? publicSearchClause : ''}
    ORDER BY r.score DESC, r.duration_ms ASC, r.accepted_at ASC
    LIMIT ? OFFSET ?
  `)
  const parameters: Array<string | number> = [
    query.difficulty,
    query.duty,
    query.season ?? query.version ?? '',
  ]
  if (search) {
    const pattern = `%${search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
    parameters.push(pattern, pattern, pattern, pattern)
  }
  parameters.push(query.limit, query.offset)
  const rows = statement.all(...parameters) as unknown as RawLeaderboardRow[]
  return rows.map((row, index) => {
    const anonymous = row.identity_mode === 'anonymous'
    const character = row.identity_mode === 'character'
    return {
      id: row.result_id,
      rank: query.offset + index + 1,
      displayName: anonymous
        ? 'Anonymous'
        : character
          ? row.character_name
          : row.alias?.trim() || 'Anonymous',
      character: character ? row.character_name : null,
      realm: character ? row.realm_slug : null,
      region: character ? row.region : null,
      guild: !anonymous && row.show_guild ? row.guild_name : null,
      score: row.score,
      durationMs: row.duration_ms,
      trainerVersion: row.trainer_version,
      buildId: row.build_id,
      acceptedAt: row.accepted_at,
    }
  })
}
