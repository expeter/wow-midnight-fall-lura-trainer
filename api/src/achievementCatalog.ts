export type AchievementTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

export interface CanonicalAchievement {
  id: string
  title: string
  tier: AchievementTier
  points: 10 | 25 | 50 | 100 | 200
  season: number
  introducedVersion: string
  retiredVersion: string | null
}

const entry = (
  id: string,
  title: string,
  tier: AchievementTier,
  points: CanonicalAchievement['points'],
  retiredVersion: string | null = null,
  introducedVersion = '0.3.0',
): CanonicalAchievement => ({ id, title, tier, points, season: 1, introducedVersion, retiredVersion })

export const ACHIEVEMENT_CATALOG: readonly CanonicalAchievement[] = [
  entry('test-pilot', 'The Test Must Go On', 'Common', 10),
  entry('one-phase-wonder', 'One Phase Wonder', 'Common', 10),
  entry('strategic-timeout', 'Strategic Timeout', 'Common', 10),
  entry('prepared-for-every-phase', 'Prepared for Anything', 'Common', 10),
  entry('always-be-casting', 'Always Be Casting', 'Common', 10),
  entry('heavens-lance-warden', 'The Lance Passes On', 'Uncommon', 25, null, '0.7.0'),
  entry('p4-frontal-tank', 'Point of the Spear', 'Uncommon', 25, null, '0.7.0'),
  entry('p4-protection-tank', 'Carry the Light', 'Uncommon', 25, null, '0.7.0'),
  entry('easy-does-it', 'Easy Does It', 'Uncommon', 25),
  entry('ready-for-raid-night', 'Ready for Raid Night', 'Uncommon', 25),
  entry('crystal-clear-conscience', 'Crystal-Clear Conscience', 'Uncommon', 25),
  entry('rune-reader', 'Read the Room', 'Uncommon', 25),
  entry('phase-clears-10', 'Still Standing', 'Uncommon', 25),
  entry('midnight-shift', 'The Midnight Shift', 'Rare', 50),
  entry('no-second-chances', 'No Second Chances Needed', 'Rare', 50),
  entry('flawless-p1', 'Glaive Expectations', 'Rare', 50),
  entry('flawless-intermission', 'Between the Beams', 'Rare', 50),
  entry('flawless-p2', 'Perfectly Orb-ital', 'Rare', 50),
  entry('flawless-p3', 'Rune Without Error', 'Rare', 50),
  entry('flawless-p4', 'Heaven, Hell, No Hits', 'Rare', 50),
  entry('never-caught-unprepared', 'Never Caught Unprepared', 'Rare', 50),
  entry('both-sides-of-crystal', 'Both Sides of the Crystal', 'Rare', 50),
  entry('phase-clears-50', 'One More Pull', 'Rare', 50),
  entry('rank-one-normal-crystal', 'First Light, Crystal in Hand', 'Rare', 50),
  entry('rank-one-normal-non-crystal', 'First Light, Hands Free', 'Rare', 50),
  entry('rank-one-hard-crystal', 'Midnight’s Crystal Crown', 'Rare', 50),
  entry('rank-one-hard-non-crystal', 'Midnight’s Unburdened Crown', 'Rare', 50),
  entry('not-a-scratch', 'Not a Scratch', 'Epic', 100),
  entry('hard-score-flawless', 'Eleven Hundred and Flawless', 'Epic', 100),
  entry('early-kill', 'Ahead of the Darkness', 'Epic', 100),
  entry('p3-early-clear', 'The Stars Can Wait', 'Epic', 100),
  entry('dawnforged-vanguard', 'Dawnforged Vanguard', 'Epic', 100, null, '0.7.0'),
  entry('impossible-normal-streak', 'The Impossible', 'Epic', 100),
  entry('phase-clears-100', 'Can’t Get Enough', 'Epic', 100),
  entry('superhuman-both-duties', 'Superhuman: Refraction', 'Legendary', 200),
  entry('impossible-hard-streak', 'Beyond the Impossible', 'Legendary', 200),
  entry('rank-one-all-boards', 'Four Boards, One Throne', 'Legendary', 200),
  entry('legacy-flawless', 'Legacy Flawless', 'Rare', 50, '0.3.1'),
] as const

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENT_CATALOG.map(achievement => [achievement.id, achievement]))
