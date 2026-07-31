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
  account_id: number
  board_rank: number
  profile_id: string
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
  profileId: string
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
    identity_mode = 'alias' AND alias IS NOT NULL AND alias LIKE ? COLLATE NOCASE
    OR identity_mode = 'character' AND (
      character_name LIKE ? COLLATE NOCASE OR realm_slug LIKE ? COLLATE NOCASE
    )
    OR identity_mode = 'character' AND show_guild = 1
      AND guild_name IS NOT NULL AND guild_name LIKE ? COLLATE NOCASE
  )
`

export function listLeaderboard(database: Database, query: LeaderboardQuery): PublicLeaderboardRow[] {
  const search = query.search?.trim()
  const releaseClause = query.season
    ? 'r.leaderboard_season = ?'
    : 'r.trainer_version = ?'
  const statement = database.prepare(`
    WITH account_bests AS (
      SELECT r.*,
        ROW_NUMBER() OVER (
          PARTITION BY r.account_id
          ORDER BY r.score DESC, r.duration_ms ASC, r.accepted_at ASC
        ) AS account_run
      FROM results r
      WHERE r.difficulty = ? AND r.duty = ? AND ${releaseClause}
        AND r.run_eligible = 1
    ), public_bests AS (
      SELECT
        r.id AS result_id,
        r.account_id,
        r.score,
        r.duration_ms,
        r.trainer_version,
        r.build_id,
        r.accepted_at,
        ROW_NUMBER() OVER (
          ORDER BY r.score DESC, r.duration_ms ASC, r.accepted_at ASC
        ) AS board_rank,
      a.public_profile_id AS profile_id,
      p.identity_mode,
      p.alias,
      p.show_guild,
      c.name AS character_name,
      c.region,
      c.realm_slug,
      c.guild_name
      FROM account_bests r
      JOIN accounts a ON a.id = r.account_id
      JOIN characters c ON c.id = r.character_id
      JOIN privacy_settings p ON p.account_id = r.account_id
      WHERE r.account_run = 1 AND p.identity_mode != 'anonymous'
    )
    SELECT * FROM public_bests
    WHERE 1 = 1
      ${search ? publicSearchClause : ''}
    ORDER BY board_rank
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
  return rows.map(row => {
    const character = row.identity_mode === 'character'
    return {
      id: row.result_id,
      profileId: row.profile_id,
      rank: row.board_rank,
      displayName: character
        ? row.character_name
        : row.alias?.trim() || 'Anonymous',
      character: character ? row.character_name : null,
      realm: character ? row.realm_slug : null,
      region: character ? row.region : null,
      guild: character && row.show_guild ? row.guild_name : null,
      score: row.score,
      durationMs: row.duration_ms,
      trainerVersion: row.trainer_version,
      buildId: row.build_id,
      acceptedAt: row.accepted_at,
    }
  })
}

export function accountLeaderboardStandings(
  database: Database,
  season: string,
  accountId: number,
): Array<{ difficulty: Difficulty; duty: Duty; score: number; durationMs: number; position: number }> {
  return database.prepare(`
    WITH account_bests AS (
      SELECT account_id AS accountId, difficulty, duty, score,
        duration_ms AS durationMs, accepted_at AS acceptedAt,
        ROW_NUMBER() OVER (
          PARTITION BY account_id, difficulty, duty
          ORDER BY score DESC, duration_ms ASC, accepted_at ASC
        ) AS accountRun
      FROM results
      WHERE leaderboard_season = ? AND run_eligible = 1
    ), public_bests AS (
      SELECT best.*,
        ROW_NUMBER() OVER (
          PARTITION BY difficulty, duty
          ORDER BY score DESC, durationMs ASC, acceptedAt ASC
        ) AS position
      FROM account_bests best
      JOIN privacy_settings privacy ON privacy.account_id = best.accountId
      WHERE best.accountRun = 1 AND privacy.identity_mode != 'anonymous'
    )
    SELECT difficulty, duty, score, durationMs, position
    FROM public_bests
    WHERE accountId = ?
    ORDER BY difficulty, duty
  `).all(season, accountId) as unknown as Array<{
    difficulty: Difficulty
    duty: Duty
    score: number
    durationMs: number
    position: number
  }>
}
