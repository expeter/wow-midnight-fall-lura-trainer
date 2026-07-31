import type { Achievement, AchievementSummary, PhaseKey, PhaseResult } from './completion'
import { ACHIEVEMENT_BY_ID, type AchievementTier } from '../api/src/achievementCatalog.js'
import { FEATURE_FLAGS } from './features'

export const ACHIEVEMENT_STORAGE_KEY = 'lura-achievement-collection'

export type AchievementCluster = 'Foundations' | 'Precision' | 'Tools of the Trade' | 'Feats of Movement'
export type AchievementId =
  | 'test-pilot'
  | 'easy-does-it'
  | 'ready-for-raid-night'
  | 'midnight-shift'
  | 'one-phase-wonder'
  | 'strategic-timeout'
  | 'no-second-chances'
  | 'not-a-scratch'
  | 'crystal-clear-conscience'
  | 'rune-reader'
  | 'flawless-p1'
  | 'flawless-intermission'
  | 'flawless-p2'
  | 'flawless-p3'
  | 'flawless-p4'
  | 'prepared-for-every-phase'
  | 'never-caught-unprepared'
  | 'always-be-casting'
  | 'hard-score-flawless'
  | 'both-sides-of-crystal'
  | 'superhuman-both-duties'
  | 'early-kill'
  | 'p3-early-clear'
  | 'impossible-normal-streak'
  | 'impossible-hard-streak'
  | 'phase-clears-10'
  | 'phase-clears-50'
  | 'phase-clears-100'
  | 'heavens-lance-warden'
  | 'dawnforged-vanguard'
  | 'p4-frontal-tank'
  | 'p4-protection-tank'

export interface AchievementDefinition extends Achievement {
  id: AchievementId
  key: AchievementId
  cluster: AchievementCluster
  flavor: string
  requirement: string
  icon: string
  available: boolean
  tier: AchievementTier
  points: number
}

export interface EarnedAchievement {
  key: AchievementId
  earnedAt: string
  attempt?: number
  playerName?: string
}

export interface AchievementRunRecord {
  attempt: number
  difficulty: string
  fullSequence: boolean
  crystalPlayer: boolean
  flawless: boolean
  totalScore: number
  allOptions: boolean
  allPhaseRecovery: boolean
  fullRunAttempt?: boolean
  phaseClears?: number
}

export interface AchievementCollectionData {
  version: 2
  records: EarnedAchievement[]
  runs: AchievementRunRecord[]
}

export interface AchievementProgress {
  current: number
  target: number
  label: string
}

const DEFINITIONS: AchievementDefinition[] = [
  badge('test-pilot', 'Foundations', 'The Test Must Go On', 'Complete the full journey in Test mode. The hazards were optional; the footwork was not.', 'Complete Phase 1 through Phase 4 in Test mode.', '⌁'),
  badge('easy-does-it', 'Foundations', 'Easy Does It', 'Complete the full journey on Easy and leave the training wheels polished.', 'Complete Phase 1 through Phase 4 on Easy.', '❖'),
  badge('ready-for-raid-night', 'Foundations', 'Ready for Raid Night', 'See the complete rehearsal through before the real pull begins.', 'Complete Phase 1 through Phase 4 on Test or Normal.', '◆'),
  badge('midnight-shift', 'Foundations', 'The Midnight Shift', 'Complete the full journey on Hard. No overtime pay included.', 'Complete Phase 1 through Phase 4 on Hard.', '☾'),
  badge('one-phase-wonder', 'Foundations', 'One Phase Wonder', 'Enter one phase directly and bring that assignment home.', 'Complete exactly one directly selected phase.', 'Ⅰ'),
  badge('strategic-timeout', 'Foundations', 'Strategic Timeout', 'Pause, take a breath, then return to the pull.', 'Pause and resume during an attempt that reaches its result.', 'Ⅱ'),
  badge('no-second-chances', 'Precision', 'No Second Chances Needed', 'Complete Normal without spending a single wipe allowance.', 'Complete the full sequence on Normal without a wipe event.', '♢'),
  badge('not-a-scratch', 'Precision', 'Not a Scratch', 'Complete Normal without a wipe, penalty, or misplaced step.', 'Complete the full sequence on Normal with zero recorded mistakes.', '◇'),
  badge('crystal-clear-conscience', 'Precision', 'Crystal-Clear Conscience', 'Leave every carried and grounded crystal untouched by your mechanics.', 'Complete the full sequence without causing a crystal or crystal-carrier hit.', '⬡'),
  badge('rune-reader', 'Precision', 'Read the Room', 'Resolve every rune in order and leave no memory unfinished.', 'Complete Phase 3 without a wrong, missed, or out-of-order rune.', '⌘'),
  badge('flawless-p1', 'Precision', 'Glaive Expectations', 'Complete Phase 1 without a single recorded mistake.', 'Complete Phase 1 with zero recorded mistakes.', '✧'),
  badge('flawless-intermission', 'Precision', 'Between the Beams', 'Dance through the opening without giving the void an inch.', 'Complete Intermission with zero recorded mistakes.', '╱'),
  badge('flawless-p2', 'Precision', 'Perfectly Orb-ital', 'Every beam, circle, and returning orb exactly where it belongs.', 'Complete Phase 2 with zero recorded mistakes.', '◉'),
  badge('flawless-p3', 'Precision', 'Rune Without Error', 'Read the stars, finish the Soaks, and never lose the light.', 'Complete Phase 3 with zero recorded mistakes.', '✣'),
  badge('flawless-p4', 'Precision', 'Heaven, Hell, No Hits', 'Four quarters, three splinters, zero excuses.', 'Complete Phase 4 with zero recorded mistakes.', '✦'),
  badge('prepared-for-every-phase', 'Tools of the Trade', 'Prepared for Anything', 'A timely answer turns a dangerous health bar into another solved mechanic.', 'Use a health potion or shield at least once.', '✚'),
  badge('never-caught-unprepared', 'Tools of the Trade', 'Never Caught Unprepared', 'Every phase asks a new question. Every time, you have an answer ready.', 'Successfully use a health potion or shield in every phase of a full run.', '✙'),
  badge('always-be-casting', 'Tools of the Trade', 'Always Be Casting', 'Even perfect footwork leaves room for one more spell.', 'Complete at least one Main Ability cast in a finished attempt.', '➶'),
  badge('heavens-lance-warden', 'Tools of the Trade', 'The Lance Passes On', 'Take the full weight of Heaven’s Lance, then pass L’ura cleanly to your partner.', 'Finish an attempt while assigned as one of the two tanks.', '🛡'),
  badge('p4-frontal-tank', 'Tools of the Trade', 'Point of the Spear', 'Stand one step ahead of the raid and break the darkness before it reaches them.', 'Finish Phase 4 as Tank 1 with the frontal-cone assignment.', '➤'),
  badge('p4-protection-tank', 'Tools of the Trade', 'Carry the Light', 'Where you lead, the last circle of safety follows.', 'Finish Phase 4 as Tank 2 carrying the protection zone.', '☀'),
  badge('hard-score-flawless', 'Feats of Movement', 'Eleven Hundred and Flawless', 'Cross the midnight line without leaving a mark behind.', 'Clear the full sequence on Hard with zero mistakes and more than 1,100 points.', '★'),
  badge('both-sides-of-crystal', 'Feats of Movement', 'Both Sides of the Crystal', 'Master the burden—and the space around the one who carries it.', 'Complete the full journey once with crystal duty and once without it.', '◈'),
  badge('superhuman-both-duties', 'Feats of Movement', 'Superhuman: Refraction', 'Two duties. Every tool. Not one step out of place.', 'Earn >1,100-point flawless Hard clears as crystal and non-crystal with every combat option handled.', '✪'),
  badge('early-kill', 'Feats of Movement', 'Ahead of the Darkness', 'Bring L’ura down before the final Heaven & Hell can close.', 'Reach 0% boss health before the final Phase 4 sequence.', '⚔'),
  badge('p3-early-clear', 'Feats of Movement', 'The Stars Can Wait', 'Push L’ura’s image beyond its limit before Phase 3 can complete its course.', 'Reduce L’ura to 0% during Phase 3.', '☄'),
  badge('dawnforged-vanguard', 'Feats of Movement', 'Dawnforged Vanguard', 'Carry the crystal and the boss together without letting either duty break the line.', 'Finish an attempt with both tank and crystal duty.', '♜'),
  badge('impossible-normal-streak', 'Feats of Movement', 'The Impossible', 'Five flawless rehearsals in a row. At some point, impossible becomes preparation.', 'Complete five consecutive full runs flawlessly on Normal.', '∞'),
  badge('impossible-hard-streak', 'Feats of Movement', 'Beyond the Impossible', 'Five perfect journeys through the hardest rehearsal without surrendering a single step.', 'Complete five consecutive full runs flawlessly on Hard.', '♛'),
  badge('phase-clears-10', 'Foundations', 'Still Standing', 'Ten phases cleared and the floor is beginning to remember your footsteps.', 'Clear 10 phases across all finished attempts.', 'Ⅹ'),
  badge('phase-clears-50', 'Foundations', 'One More Pull', 'Fifty phases later, “one more pull” remains a perfectly reasonable plan.', 'Clear 50 phases across all finished attempts.', '↻'),
  badge('phase-clears-100', 'Feats of Movement', 'Can’t Get Enough', 'One hundred phases cleared. L’ura may now be practicing against you.', 'Clear 100 phases across all finished attempts.', '100'),
]

function badge(id: AchievementId, cluster: AchievementCluster, label: string, flavor: string, requirement: string, icon: string, available = true): AchievementDefinition {
  const scoring = ACHIEVEMENT_BY_ID.get(id)
  return { id, key: id, cluster, label, detail: flavor, flavor, requirement, icon, available, tier: scoring?.tier ?? 'Common', points: scoring?.points ?? 10 }
}

export function achievementCatalog(tankRolesEnabled = FEATURE_FLAGS.tankRoles): AchievementDefinition[] {
  return tankRolesEnabled
    ? DEFINITIONS
    : DEFINITIONS.filter(definition => !['heavens-lance-warden', 'dawnforged-vanguard', 'p4-frontal-tank', 'p4-protection-tank'].includes(definition.id))
}

function normalizedDifficulty(difficulty: string): string {
  return difficulty.trim().toLowerCase()
}

function phaseFlawless(results: PhaseResult[] | undefined, key: PhaseKey): boolean {
  const result = results?.find(candidate => candidate.key === key)
  return Boolean(result && (result.mistakes ?? 0) === 0)
}

function award(id: AchievementId): AchievementDefinition {
  return DEFINITIONS.find(candidate => candidate.id === id)!
}

export function currentRunAchievements(summary: AchievementSummary, tankRolesEnabled = FEATURE_FLAGS.tankRoles): AchievementDefinition[] {
  const difficulty = normalizedDifficulty(summary.difficulty)
  const results = summary.phaseResults ?? []
  const includesP3 = results.some(result => result.key === 'p3')
  const ids: AchievementId[] = []
  if (summary.fullSequence && difficulty === 'test') ids.push('test-pilot')
  if (summary.fullSequence && difficulty === 'easy') ids.push('easy-does-it')
  if (summary.fullSequence && (difficulty === 'test' || difficulty === 'normal')) ids.push('ready-for-raid-night')
  if (summary.fullSequence && difficulty === 'hard') ids.push('midnight-shift')
  if (!summary.fullSequence && results.length === 1) ids.push('one-phase-wonder')
  if (summary.pauseCycle) ids.push('strategic-timeout')
  if (summary.fullSequence && difficulty === 'normal' && (summary.wipeCount ?? 0) === 0) ids.push('no-second-chances')
  if (summary.fullSequence && difficulty === 'normal' && summary.mistakes === 0) ids.push('not-a-scratch')
  if (summary.fullSequence && (summary.crystalFailures ?? 0) === 0) ids.push('crystal-clear-conscience')
  if (includesP3 && (summary.runeFailures ?? 0) === 0) ids.push('rune-reader')
  if (phaseFlawless(results, 'p1')) ids.push('flawless-p1')
  if (phaseFlawless(results, 'intermission')) ids.push('flawless-intermission')
  if (phaseFlawless(results, 'p2')) ids.push('flawless-p2')
  if (phaseFlawless(results, 'p3')) ids.push('flawless-p3')
  if (phaseFlawless(results, 'p4')) ids.push('flawless-p4')
  if ((summary.recoveryUses ?? 0) > 0) ids.push('prepared-for-every-phase')
  if (summary.fullSequence && summary.allPhaseRecovery) ids.push('never-caught-unprepared')
  if ((summary.mainAbilityCasts ?? (summary.mainAbilityEnabled ? 1 : 0)) > 0) ids.push('always-be-casting')
  if (tankRolesEnabled && summary.tankRole) ids.push('heavens-lance-warden')
  if (tankRolesEnabled && summary.tankCrystalRole) ids.push('dawnforged-vanguard')
  if (tankRolesEnabled && summary.p4ConeTankRole) ids.push('p4-frontal-tank')
  if (tankRolesEnabled && summary.p4ProtectionTankRole) ids.push('p4-protection-tank')
  if (summary.fullSequence && difficulty === 'hard' && summary.mistakes === 0 && summary.totalScore > 1100) ids.push('hard-score-flawless')
  if (summary.earlyKill) ids.push('early-kill')
  if (summary.p3EarlyClear) ids.push('p3-early-clear')
  return ids.map(award)
}

function runRecord(summary: AchievementSummary, attempt: number): AchievementRunRecord {
  return {
    attempt,
    difficulty: normalizedDifficulty(summary.difficulty),
    fullSequence: summary.fullSequence,
    crystalPlayer: summary.crystalPlayer,
    flawless: summary.mistakes === 0,
    totalScore: summary.totalScore,
    allOptions: summary.healthPotEnabled && summary.shieldEnabled && (summary.mainAbilityCasts ?? 0) > 0,
    allPhaseRecovery: Boolean(summary.allPhaseRecovery),
    fullRunAttempt: Boolean(summary.fullRunAttempt ?? summary.fullSequence),
    phaseClears: summary.phaseResults?.length ?? (summary.fullSequence ? 5 : 0),
  }
}

export function flawlessFullRunStreak(runs: AchievementRunRecord[], difficulty: string): number {
  const targetDifficulty = normalizedDifficulty(difficulty)
  let streak = 0
  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const run = runs[index]
    if (run.difficulty !== targetDifficulty || !(run.fullRunAttempt ?? run.fullSequence)) continue
    if (!run.fullSequence || !run.flawless) break
    streak += 1
  }
  return streak
}

export function totalPhaseClears(runs: AchievementRunRecord[]): number {
  return runs.reduce((total, run) => total + (run.phaseClears ?? (run.fullSequence ? 4 : 1)), 0)
}

export function achievementProgress(
  achievement: Pick<AchievementDefinition, 'id'>,
  collection: AchievementCollectionData,
): AchievementProgress | null {
  const fullRuns = collection.runs.filter(run => run.fullSequence)
  if (achievement.id === 'both-sides-of-crystal') {
    const duties = new Set(fullRuns.map(run => run.crystalPlayer ? 'crystal' : 'non-crystal'))
    return { current: Math.min(2, duties.size), target: 2, label: `${Math.min(2, duties.size)} of 2 duties` }
  }
  if (achievement.id === 'superhuman-both-duties') {
    const duties = new Set(fullRuns
      .filter(run => run.difficulty === 'hard' && run.flawless && run.totalScore > 1100 && run.allOptions && run.allPhaseRecovery)
      .map(run => run.crystalPlayer ? 'crystal' : 'non-crystal'))
    return { current: Math.min(2, duties.size), target: 2, label: `${Math.min(2, duties.size)} of 2 flawless duties` }
  }
  if (achievement.id === 'impossible-normal-streak' || achievement.id === 'impossible-hard-streak') {
    const difficulty = achievement.id === 'impossible-hard-streak' ? 'hard' : 'normal'
    const current = Math.min(5, flawlessFullRunStreak(collection.runs, difficulty))
    return { current, target: 5, label: `${current} of 5 flawless runs` }
  }
  const phaseTarget = achievement.id === 'phase-clears-10' ? 10
    : achievement.id === 'phase-clears-50' ? 50
      : achievement.id === 'phase-clears-100' ? 100
        : null
  if (phaseTarget) {
    const current = Math.min(phaseTarget, totalPhaseClears(collection.runs))
    return { current, target: phaseTarget, label: `${current} of ${phaseTarget} phase clears` }
  }
  return null
}

export function collectibleAchievements(summary: AchievementSummary, collection: AchievementCollectionData = emptyCollection(), attempt = 0): AchievementDefinition[] {
  const currentRun = runRecord(summary, attempt)
  const runs = collection.runs.some(run => run.attempt === attempt)
    ? collection.runs
    : [...collection.runs, currentRun]
  const awards = currentRunAchievements(summary)
  const fullDuties = new Set(runs.filter(run => run.fullSequence).map(run => run.crystalPlayer ? 'crystal' : 'non-crystal'))
  if (fullDuties.size === 2) awards.push(award('both-sides-of-crystal'))
  const superhumanDuties = new Set(runs
    .filter(run => run.fullSequence && run.difficulty === 'hard' && run.flawless && run.totalScore > 1100 && run.allOptions && run.allPhaseRecovery)
    .map(run => run.crystalPlayer ? 'crystal' : 'non-crystal'))
  if (superhumanDuties.size === 2) awards.push(award('superhuman-both-duties'))
  if (flawlessFullRunStreak(runs, 'normal') >= 5) awards.push(award('impossible-normal-streak'))
  if (flawlessFullRunStreak(runs, 'hard') >= 5) awards.push(award('impossible-hard-streak'))
  const phaseClears = totalPhaseClears(runs)
  if (phaseClears >= 10) awards.push(award('phase-clears-10'))
  if (phaseClears >= 50) awards.push(award('phase-clears-50'))
  if (phaseClears >= 100) awards.push(award('phase-clears-100'))
  return [...new Map(awards.map(entry => [entry.id, entry])).values()]
}

export function newlyEarnedAchievements(
  awards: AchievementDefinition[],
  collection: AchievementCollectionData,
): AchievementDefinition[] {
  const earned = new Set(collection.records.map(record => record.key))
  return awards.filter(achievement => !earned.has(achievement.key))
}

export function emptyCollection(): AchievementCollectionData {
  return { version: 2, records: [], runs: [] }
}

function validRecord(value: unknown): value is EarnedAchievement {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<EarnedAchievement>
  return typeof candidate.key === 'string'
    && DEFINITIONS.some(definition => definition.id === candidate.key)
    && typeof candidate.earnedAt === 'string'
    && !Number.isNaN(Date.parse(candidate.earnedAt))
}

function validRun(value: unknown): value is AchievementRunRecord {
  if (!value || typeof value !== 'object') return false
  const run = value as Partial<AchievementRunRecord>
  return typeof run.attempt === 'number'
    && typeof run.difficulty === 'string'
    && typeof run.fullSequence === 'boolean'
    && typeof run.crystalPlayer === 'boolean'
    && typeof run.flawless === 'boolean'
    && typeof run.totalScore === 'number'
    && typeof run.allOptions === 'boolean'
    && typeof run.allPhaseRecovery === 'boolean'
    && (typeof run.fullRunAttempt === 'undefined' || typeof run.fullRunAttempt === 'boolean')
    && (typeof run.phaseClears === 'undefined' || typeof run.phaseClears === 'number' && run.phaseClears >= 0)
}

const LEGACY_ID_MAP: Record<string, AchievementId[]> = {
  'movement-master:test': ['test-pilot', 'ready-for-raid-night'],
  'movement-master:easy': ['easy-does-it'],
  'movement-master:normal': ['ready-for-raid-night'],
  'movement-master:hard': ['midnight-shift'],
  'flawless:normal': ['no-second-chances', 'not-a-scratch'],
  'superhuman-flawless:hard': ['hard-score-flawless'],
  'early-kill': ['early-kill'],
}

function migrateLegacy(records: unknown[]): EarnedAchievement[] {
  const migrated: EarnedAchievement[] = []
  for (const value of records) {
    if (!value || typeof value !== 'object') continue
    const legacy = value as { key?: unknown; earnedAt?: unknown; attempt?: unknown; playerName?: unknown }
    if (typeof legacy.key !== 'string' || typeof legacy.earnedAt !== 'string' || Number.isNaN(Date.parse(legacy.earnedAt))) continue
    const legacyParts = legacy.key.split(':')
    const lookup = legacyParts[0] === 'early-kill' ? 'early-kill' : `${legacyParts[0]}:${legacyParts[1]}`
    for (const key of LEGACY_ID_MAP[lookup] ?? []) migrated.push({
      key,
      earnedAt: legacy.earnedAt,
      ...(typeof legacy.attempt === 'number' ? { attempt: legacy.attempt } : {}),
      ...(typeof legacy.playerName === 'string' ? { playerName: legacy.playerName } : {}),
    })
  }
  return migrated
}

export function parseAchievementCollection(raw: string | null): AchievementCollectionData {
  if (!raw) return emptyCollection()
  try {
    const parsed: unknown = JSON.parse(raw)
    const sourceRecords = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { records?: unknown }).records)
        ? (parsed as { records: unknown[] }).records
        : []
    const records = [
      ...sourceRecords.filter(validRecord),
      ...migrateLegacy(sourceRecords.filter(record => !validRecord(record))),
    ]
    const unique = new Map<AchievementId, EarnedAchievement>()
    for (const record of records) if (!unique.has(record.key)) unique.set(record.key, record)
    const sourceRuns = parsed && typeof parsed === 'object' && Array.isArray((parsed as { runs?: unknown }).runs)
      ? (parsed as { runs: unknown[] }).runs
      : []
    return { version: 2, records: [...unique.values()], runs: sourceRuns.filter(validRun) }
  } catch {
    return emptyCollection()
  }
}

export function mergeEarnedAchievements(
  collection: AchievementCollectionData,
  awards: AchievementDefinition[],
  earnedAt: string,
  metadata: Pick<EarnedAchievement, 'attempt' | 'playerName'> & { summary?: AchievementSummary } = {},
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
  const nextRuns = metadata.summary && typeof metadata.attempt === 'number' && !collection.runs.some(run => run.attempt === metadata.attempt)
    ? [...collection.runs, runRecord(metadata.summary, metadata.attempt)]
    : collection.runs
  return additions.length || nextRuns !== collection.runs
    ? { version: 2, records: [...collection.records, ...additions], runs: nextRuns }
    : collection
}

export function serializeAchievementCollection(collection: AchievementCollectionData): string {
  return JSON.stringify({ version: 2, records: collection.records, runs: collection.runs })
}
