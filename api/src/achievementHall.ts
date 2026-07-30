import type { Database } from './database.js'

export interface AchievementHallRow {
  rank: number
  profileId: string
  displayName: string
  guild: string | null
  totalPoints: number
  achievementCount: number
  highestAchievement: {
    id: string
    title: string
    tier: string
    points: number
    firstEarnedAt: string
    featOfStrength: boolean
  }
}

interface RawAward {
  accountId: number
  profileId: string
  identityMode: 'alias' | 'character'
  alias: string | null
  showGuild: number
  characterName: string | null
  guildName: string | null
  achievementId: string
  title: string
  tier: string
  points: number
  retiredVersion: string | null
  firstEarnedAt: string
}

export function listAchievementHall(
  database: Database,
  options: { limit: number; offset: number; search?: string; ownAccountId?: number },
): { rows: AchievementHallRow[]; own: AchievementHallRow | null; total: number } {
  const awards = database.prepare(`
    SELECT p.account_id AS accountId, account.public_profile_id AS profileId, p.identity_mode AS identityMode, p.alias,
      p.show_guild AS showGuild, c.name AS characterName, c.guild_name AS guildName,
      aa.achievement_id AS achievementId, ac.title, ac.tier, ac.points,
      ac.retired_version AS retiredVersion, MIN(aa.first_earned_at) AS firstEarnedAt
    FROM privacy_settings p
    JOIN account_achievements aa ON aa.account_id = p.account_id
    JOIN achievement_catalog ac ON ac.id = aa.achievement_id
    LEFT JOIN accounts account ON account.id = p.account_id
    LEFT JOIN characters c ON c.id = account.selected_character_id
    WHERE p.identity_mode != 'anonymous'
    GROUP BY p.account_id, aa.achievement_id
  `).all() as unknown as RawAward[]
  const grouped = new Map<number, RawAward[]>()
  for (const award of awards) grouped.set(award.accountId, [...(grouped.get(award.accountId) ?? []), award])
  const ranked = [...grouped.entries()].map(([accountId, accountAwards]) => {
    const first = accountAwards[0]
    const sorted = [...accountAwards].sort((left, right) =>
      right.points - left.points
      || left.firstEarnedAt.localeCompare(right.firstEarnedAt)
      || left.achievementId.localeCompare(right.achievementId))
    const highest = sorted[0]
    return {
      accountId,
      profileId: first.profileId,
      displayName: first.identityMode === 'character'
        ? first.characterName ?? 'Unselected character'
        : first.alias?.trim() || 'Unnamed player',
      guild: first.showGuild ? first.guildName : null,
      totalPoints: accountAwards.reduce((sum, award) => sum + award.points, 0),
      achievementCount: accountAwards.length,
      highestAchievement: {
        id: highest.achievementId,
        title: highest.title,
        tier: highest.tier,
        points: highest.points,
        firstEarnedAt: highest.firstEarnedAt,
        featOfStrength: Boolean(highest.retiredVersion),
      },
    }
  }).sort((left, right) =>
    right.totalPoints - left.totalPoints
    || right.highestAchievement.points - left.highestAchievement.points
    || left.highestAchievement.firstEarnedAt.localeCompare(right.highestAchievement.firstEarnedAt)
    || left.displayName.localeCompare(right.displayName))
    .map((row, index) => ({ ...row, rank: index + 1 }))
  const search = options.search?.trim().toLocaleLowerCase()
  const filtered = search
    ? ranked.filter(row => row.displayName.toLocaleLowerCase().includes(search) || row.guild?.toLocaleLowerCase().includes(search))
    : ranked
  const publicRow = ({ accountId: _accountId, ...row }: typeof ranked[number]): AchievementHallRow => row
  const ownMatch = options.ownAccountId ? ranked.find(row => row.accountId === options.ownAccountId) : undefined
  return {
    rows: filtered.slice(options.offset, options.offset + options.limit).map(publicRow),
    own: ownMatch ? publicRow(ownMatch) : null,
    total: filtered.length,
  }
}
