import type { Database } from './database.js'

export interface GlobalRankingRow {
  rank: number
  profileId: string
  displayName: string
  guild: string | null
  achievementPoints: number
  runPoints: number
  totalPoints: number
  crystalFlawless: boolean
  hardClear: boolean
}

interface RawGlobalRow extends Omit<GlobalRankingRow, 'rank' | 'totalPoints'> {
  accountId: number
}

export function listGlobalRanking(database: Database, season: string, ownAccountId?: number, search = ''): {
  rows: GlobalRankingRow[]
  own: GlobalRankingRow | null
  total: number
} {
  const raw = database.prepare(`
    WITH achievement_totals AS (
      SELECT aa.account_id AS accountId, SUM(ac.points) AS achievementPoints
      FROM (
        SELECT account_id, achievement_id, MIN(first_earned_at) AS firstEarnedAt
        FROM account_achievements GROUP BY account_id, achievement_id
      ) aa
      JOIN achievement_catalog ac ON ac.id = aa.achievement_id
      GROUP BY aa.account_id
    ), board_bests AS (
      SELECT account_id AS accountId, difficulty, duty, MAX(score) AS bestScore
      FROM results
      WHERE run_eligible = 1 AND leaderboard_season = ?
      GROUP BY account_id, difficulty, duty
    ), run_totals AS (
      SELECT accountId, SUM(bestScore) AS runPoints FROM board_bests GROUP BY accountId
    ), credentials AS (
      SELECT r.account_id AS accountId,
        MAX(CASE WHEN r.duty = 'crystal' AND s.mistakes_json = '[]' THEN 1 ELSE 0 END) AS crystalFlawless,
        MAX(CASE WHEN COALESCE(r.verified_difficulty, r.difficulty) = 'hard' THEN 1 ELSE 0 END) AS hardClear
      FROM results r JOIN attempt_summaries s ON s.attempt_id = r.attempt_id
      WHERE r.run_eligible = 1 AND r.leaderboard_season = ?
      GROUP BY r.account_id
    )
    SELECT a.id AS accountId, a.public_profile_id AS profileId,
      CASE WHEN p.identity_mode = 'character' THEN c.name ELSE COALESCE(NULLIF(TRIM(p.alias), ''), 'Unnamed player') END AS displayName,
      CASE WHEN p.show_guild = 1 THEN c.guild_name ELSE NULL END AS guild,
      COALESCE(at.achievementPoints, 0) AS achievementPoints,
      COALESCE(rt.runPoints, 0) AS runPoints,
      COALESCE(cr.crystalFlawless, 0) AS crystalFlawless,
      COALESCE(cr.hardClear, 0) AS hardClear
    FROM accounts a
    JOIN privacy_settings p ON p.account_id = a.id
    LEFT JOIN characters c ON c.id = a.selected_character_id
    LEFT JOIN achievement_totals at ON at.accountId = a.id
    LEFT JOIN run_totals rt ON rt.accountId = a.id
    LEFT JOIN credentials cr ON cr.accountId = a.id
    WHERE p.identity_mode != 'anonymous'
      AND (COALESCE(at.achievementPoints, 0) > 0 OR COALESCE(rt.runPoints, 0) > 0)
  `).all(season, season) as unknown as Array<Omit<RawGlobalRow, 'crystalFlawless' | 'hardClear'> & { crystalFlawless: number; hardClear: number }>
  const normalized = raw.map(row => ({ ...row, crystalFlawless: Boolean(row.crystalFlawless), hardClear: Boolean(row.hardClear) }))
  const ranked = normalized.sort((left, right) =>
    right.achievementPoints + right.runPoints - (left.achievementPoints + left.runPoints)
    || right.runPoints - left.runPoints
    || left.displayName.localeCompare(right.displayName))
    .map((row, index) => ({ ...row, rank: index + 1, totalPoints: row.achievementPoints + row.runPoints }))
  const publicRow = ({ accountId: _accountId, ...row }: typeof ranked[number]): GlobalRankingRow => row
  const own = ownAccountId ? ranked.find(row => row.accountId === ownAccountId) : undefined
  const needle = search.trim().toLocaleLowerCase()
  const visible = needle
    ? ranked.filter(row => row.displayName.toLocaleLowerCase().includes(needle) || row.guild?.toLocaleLowerCase().includes(needle))
    : ranked
  return { rows: visible.map(publicRow), own: own ? publicRow(own) : null, total: visible.length }
}

export function publicPlayerProfile(database: Database, profileId: string, season: string, viewerAccountId?: number) {
  const identity = database.prepare(`
    SELECT a.id AS accountId, a.public_profile_id AS profileId, p.identity_mode AS identityMode,
      CASE WHEN p.identity_mode = 'character' THEN c.name ELSE COALESCE(NULLIF(TRIM(p.alias), ''), 'Unnamed player') END AS displayName,
      CASE WHEN p.identity_mode = 'character' THEN c.name ELSE NULL END AS character,
      CASE WHEN p.identity_mode = 'character' THEN c.realm_slug ELSE NULL END AS realm,
      CASE WHEN p.identity_mode = 'character' THEN c.region ELSE NULL END AS region,
      CASE WHEN p.show_guild = 1 THEN c.guild_name ELSE NULL END AS guild
    FROM accounts a JOIN privacy_settings p ON p.account_id = a.id
    LEFT JOIN characters c ON c.id = a.selected_character_id
    WHERE a.public_profile_id = ? AND (p.identity_mode != 'anonymous' OR a.id = ?)
  `).get(profileId, viewerAccountId ?? -1) as { accountId: number; profileId: string; identityMode: string; displayName: string; character: string | null; realm: string | null; region: string | null; guild: string | null } | undefined
  if (!identity) return null
  const achievements = database.prepare(`
    SELECT aa.achievement_id AS id, ac.title, ac.tier, ac.points, MIN(aa.first_earned_at) AS firstEarnedAt
    FROM account_achievements aa JOIN achievement_catalog ac ON ac.id = aa.achievement_id
    WHERE aa.account_id = ? GROUP BY aa.achievement_id
    ORDER BY ac.points DESC, firstEarnedAt ASC
  `).all(identity.accountId)
  const attempts = Number((database.prepare('SELECT COUNT(*) AS count FROM attempts WHERE account_id = ?').get(identity.accountId) as { count: number }).count)
  const fullRuns = Number((database.prepare('SELECT COUNT(*) AS count FROM results WHERE account_id = ? AND run_eligible = 1 AND leaderboard_season = ?').get(identity.accountId, season) as { count: number }).count)
  const wipes = Number((database.prepare('SELECT COUNT(*) AS count FROM wipe_events WHERE account_id = ?').get(identity.accountId) as { count: number }).count)
  const global = listGlobalRanking(database, season).rows.find(row => row.profileId === profileId) ?? null
  const boards = (['normal:crystal', 'normal:non-crystal', 'hard:crystal', 'hard:non-crystal'] as const).map(key => {
    const [difficulty, duty] = key.split(':')
    const row = database.prepare(`
      SELECT rank FROM (
        SELECT account_id, ROW_NUMBER() OVER (ORDER BY score DESC, duration_ms ASC, accepted_at ASC) AS rank
        FROM results WHERE difficulty = ? AND duty = ? AND leaderboard_season = ? AND run_eligible = 1
      ) WHERE account_id = ? ORDER BY rank LIMIT 1
    `).get(difficulty, duty, season, identity.accountId) as { rank: number } | undefined
    return { difficulty, duty, rank: row?.rank ?? null }
  })
  const { accountId: _accountId, identityMode: _identityMode, ...publicIdentity } = identity
  return { ...publicIdentity, ownProfile: identity.accountId === viewerAccountId, achievements, attempts, fullRuns, wipes, global, boards }
}
