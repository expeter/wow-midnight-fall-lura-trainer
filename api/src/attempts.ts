import { createHash } from 'node:crypto'
import type { AuthDependencies } from './auth.js'
import type { ApiConfig } from './config.js'
import type { Database } from './database.js'

const PHASES = ['p1', 'intermission', 'p2', 'p3', 'p4'] as const
const ENTRY_PHASES: Record<string, readonly string[]> = {
  arena0: PHASES,
  arena1: ['intermission', 'p2', 'p3', 'p4'],
  arena2: ['p2', 'p3', 'p4'],
  arena3: ['p3', 'p4'],
  arena4: ['p4'],
}

interface AttemptInput {
  difficulty?: unknown
  duty?: unknown
  entryMode?: unknown
  phaseScope?: unknown
  trainerVersion?: unknown
  buildId?: unknown
  configurationFingerprint?: unknown
  optionalChallenges?: unknown
}

interface CompletionInput {
  clientRunId?: unknown
  nonce?: unknown
  configurationFingerprint?: unknown
  optionalChallenges?: unknown
  durationMs?: unknown
  phaseResults?: unknown
  mistakes?: unknown
  actions?: unknown
  achievementInputs?: unknown
  submittedScore?: unknown
  trainerVersion?: unknown
  buildId?: unknown
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function acceptedActionScore(input: {
  mistakePenalty: number
  continuousPenalty: number
  recoveryPasses: number
  mainAbilityCasts: number
}): number {
  return Math.max(
    0,
    1000
      - input.mistakePenalty
      - input.continuousPenalty
      + input.recoveryPasses * 50
      + input.mainAbilityCasts
      + Math.floor(input.mainAbilityCasts / 20) * 50,
  )
}

export function activeAttemptIdentity(
  database: Database,
  dependencies: AuthDependencies,
  attemptId: string,
  nonce: string,
): { accountId: number; characterId: number } | null {
  const attempt = database.prepare(`
    SELECT account_id AS accountId, character_id AS characterId,
      nonce_hash AS nonceHash, expires_at AS expiresAt, consumed_at AS consumedAt
    FROM attempts WHERE id = ?
  `).get(attemptId) as {
    accountId: number
    characterId: number
    nonceHash: string
    expiresAt: string
    consumedAt: string | null
  } | undefined
  if (
    !attempt
    || attempt.consumedAt
    || attempt.expiresAt <= dependencies.now().toISOString()
    || hash(nonce) !== attempt.nonceHash
  ) return null
  return { accountId: attempt.accountId, characterId: attempt.characterId }
}

function cleanString(value: unknown, maximum: number): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum ? value : null
}

export function issueAttempt(
  database: Database,
  config: ApiConfig,
  dependencies: AuthDependencies,
  accountId: number,
  input: AttemptInput,
) {
  if (!['test', 'easy', 'normal', 'hard'].includes(String(input.difficulty))) throw new Error('invalid_difficulty')
  const verifiedDifficulty = String(input.difficulty)
  if (input.duty !== 'crystal' && input.duty !== 'non-crystal') throw new Error('invalid_duty')
  const entryMode = String(input.entryMode)
  const expectedPhases = ENTRY_PHASES[entryMode]
  if (!expectedPhases) throw new Error('invalid_entry_mode')
  const phaseScope = String(input.phaseScope)
  if (phaseScope !== (entryMode === 'arena0' ? 'full' : expectedPhases[0])) throw new Error('invalid_phase_scope')
  if (input.trainerVersion !== config.currentTrainerVersion) throw new Error('unsupported_trainer_version')
  const buildId = cleanString(input.buildId, 80)
  const fingerprint = cleanString(input.configurationFingerprint, 128)
  if (!buildId) throw new Error('invalid_build_id')
  if (!fingerprint) throw new Error('invalid_configuration')
  if (
    !Array.isArray(input.optionalChallenges)
    || input.optionalChallenges.some(value => value !== 'recovery' && value !== 'main-ability')
  ) throw new Error('invalid_optional_challenges')
  const selected = database.prepare(
    'SELECT selected_character_id AS characterId FROM accounts WHERE id = ?',
  ).get(accountId) as { characterId: number | null } | undefined
  if (!selected?.characterId) throw new Error('character_required')

  const id = dependencies.randomToken()
  const nonce = dependencies.randomToken()
  const issuedAt = dependencies.now()
  const expiresAt = new Date(issuedAt.getTime() + 90 * 60_000)
  const configuration = {
    fingerprint,
    optionalChallenges: [...new Set(input.optionalChallenges)].sort(),
  }
  database.prepare(`
    INSERT INTO attempts (
      id, account_id, character_id, nonce_hash, difficulty, duty, entry_mode,
      phase_scope, trainer_version, build_id, configuration_json, issued_at, expires_at,
      verified_difficulty, leaderboard_season
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    accountId,
    selected.characterId,
    hash(nonce),
    verifiedDifficulty === 'test' || verifiedDifficulty === 'easy' ? 'normal' : verifiedDifficulty,
    input.duty,
    entryMode,
    phaseScope,
    input.trainerVersion,
    buildId,
    JSON.stringify(configuration),
    issuedAt.toISOString(),
    expiresAt.toISOString(),
    verifiedDifficulty,
    config.currentLeaderboardSeason,
  )
  return {
    attemptId: id,
    nonce,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    configuration,
  }
}

interface Mistake {
  penalty: number
  timeMs: number
  code: string
}

interface PhaseResult {
  key: string
  durationMs: number
  mistakes: number
  recovery: 'passed' | 'missed'
}

function validatedCompletion(input: CompletionInput, expectedPhases: readonly string[]) {
  const clientRunId = cleanString(input.clientRunId, 40)
  const nonce = cleanString(input.nonce, 128)
  const configurationFingerprint = cleanString(input.configurationFingerprint, 128)
  const trainerVersion = cleanString(input.trainerVersion, 30)
  const buildId = cleanString(input.buildId, 80)
  const durationMs = Number(input.durationMs)
  const submittedScore = Number(input.submittedScore)
  if (!clientRunId || !/^LURA1-(?:[0-9A-F]{4}-){4}[0-9A-F]{4}$/.test(clientRunId)) {
    throw new Error('invalid_client_run_id')
  }
  if (!nonce) throw new Error('invalid_nonce')
  if (!configurationFingerprint) throw new Error('invalid_configuration')
  if (
    !Array.isArray(input.optionalChallenges)
    || input.optionalChallenges.some(value => value !== 'recovery' && value !== 'main-ability')
  ) throw new Error('invalid_optional_challenges')
  if (!trainerVersion || !buildId) throw new Error('invalid_version')
  if (!Number.isInteger(durationMs) || durationMs < 1_000 || durationMs > 3_600_000) {
    throw new Error('implausible_duration')
  }
  if (!Number.isInteger(submittedScore) || submittedScore < 0 || submittedScore > 10_000) {
    throw new Error('invalid_score')
  }
  if (!Array.isArray(input.phaseResults) || input.phaseResults.length !== expectedPhases.length) {
    throw new Error('invalid_phase_order')
  }
  const phases = input.phaseResults as PhaseResult[]
  if (phases.some((phase, index) => (
    phase?.key !== expectedPhases[index]
    || !Number.isInteger(phase.durationMs)
    || phase.durationMs < 1_000
    || !Number.isInteger(phase.mistakes)
    || phase.mistakes < 0
    || phase.mistakes > 100
    || (phase.recovery !== 'passed' && phase.recovery !== 'missed')
  ))) throw new Error('invalid_phase_order')
  const phaseDuration = phases.reduce((total, phase) => total + phase.durationMs, 0)
  if (Math.abs(phaseDuration - durationMs) > 5_000) throw new Error('invalid_phase_duration')

  if (!Array.isArray(input.mistakes) || input.mistakes.length > 100) throw new Error('invalid_mistakes')
  const mistakes = input.mistakes as Mistake[]
  if (mistakes.some(mistake => (
    !mistake
    || !Number.isInteger(mistake.penalty)
    || mistake.penalty < 0
    || mistake.penalty > 200
    || !Number.isInteger(mistake.timeMs)
    || mistake.timeMs < 0
    || mistake.timeMs > durationMs
    || !cleanString(mistake.code, 80)
  ))) throw new Error('invalid_mistakes')
  if (phases.reduce((total, phase) => total + phase.mistakes, 0) !== mistakes.length) {
    throw new Error('mistake_count_mismatch')
  }
  const actions = input.actions as {
    recoveryPasses?: unknown
    mainAbilityCasts?: unknown
    continuousPenalty?: unknown
  } | null
  const recoveryPasses = Number(actions?.recoveryPasses)
  const mainAbilityCasts = Number(actions?.mainAbilityCasts)
  const continuousPenalty = Number(actions?.continuousPenalty)
  if (
    !Number.isInteger(recoveryPasses) || recoveryPasses < 0 || recoveryPasses > expectedPhases.length
    || recoveryPasses !== phases.filter(phase => phase.recovery === 'passed').length
    || !Number.isInteger(mainAbilityCasts) || mainAbilityCasts < 0
    || mainAbilityCasts > Math.floor(durationMs / 1_000)
    || !Number.isInteger(continuousPenalty) || continuousPenalty < 0 || continuousPenalty > 1000
  ) throw new Error('invalid_actions')
  const mistakePenalty = mistakes.reduce((total, mistake) => total + mistake.penalty, 0)
  const acceptedScore = acceptedActionScore({
    mistakePenalty,
    continuousPenalty,
    recoveryPasses,
    mainAbilityCasts,
  })
  if (submittedScore !== acceptedScore) throw new Error('score_mismatch')
  const achievementInputs = input.achievementInputs as {
    wipeCount?: unknown
    crystalFailures?: unknown
    runeFailures?: unknown
    pauseCycle?: unknown
    earlyKill?: unknown
    p3EarlyClear?: unknown
    tankRole?: unknown
    tankCrystalRole?: unknown
    p4ConeTankRole?: unknown
    p4ProtectionTankRole?: unknown
  } | null
  const count = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100
  if (
    !achievementInputs
    || !count(achievementInputs.wipeCount)
    || !count(achievementInputs.crystalFailures)
    || !count(achievementInputs.runeFailures)
    || typeof achievementInputs.pauseCycle !== 'boolean'
    || typeof achievementInputs.earlyKill !== 'boolean'
    || typeof achievementInputs.p3EarlyClear !== 'boolean'
    || typeof achievementInputs.tankRole !== 'undefined' && typeof achievementInputs.tankRole !== 'boolean'
    || typeof achievementInputs.tankCrystalRole !== 'undefined' && typeof achievementInputs.tankCrystalRole !== 'boolean'
    || typeof achievementInputs.p4ConeTankRole !== 'undefined' && typeof achievementInputs.p4ConeTankRole !== 'boolean'
    || typeof achievementInputs.p4ProtectionTankRole !== 'undefined' && typeof achievementInputs.p4ProtectionTankRole !== 'boolean'
  ) throw new Error('invalid_achievement_inputs')
  return {
    clientRunId,
    nonce,
    configuration: {
      fingerprint: configurationFingerprint,
      optionalChallenges: [...new Set(input.optionalChallenges)].sort(),
    },
    trainerVersion,
    buildId,
    durationMs,
    submittedScore,
    acceptedScore,
    phases,
    mistakes,
    actions: { recoveryPasses, mainAbilityCasts, continuousPenalty },
    achievementInputs: {
      ...achievementInputs,
      tankRole: achievementInputs.tankRole === true,
      tankCrystalRole: achievementInputs.tankCrystalRole === true,
      p4ConeTankRole: achievementInputs.p4ConeTankRole === true,
      p4ProtectionTankRole: achievementInputs.p4ProtectionTankRole === true,
    },
  }
}

function earnedAchievementIds(
  difficulty: string,
  score: number,
  phases: PhaseResult[],
  mistakes: Mistake[],
  actions: { recoveryPasses: number; mainAbilityCasts: number },
  inputs: { wipeCount?: unknown; crystalFailures?: unknown; runeFailures?: unknown; pauseCycle?: unknown; earlyKill?: unknown; p3EarlyClear?: unknown; tankRole?: unknown; tankCrystalRole?: unknown; p4ConeTankRole?: unknown; p4ProtectionTankRole?: unknown },
): string[] {
  const ids: string[] = []
  const fullRun = phases.length === PHASES.length
  if (fullRun && difficulty === 'test') ids.push('test-pilot')
  if (fullRun && difficulty === 'easy') ids.push('easy-does-it')
  if (fullRun && (difficulty === 'test' || difficulty === 'normal')) ids.push('ready-for-raid-night')
  if (fullRun && difficulty === 'hard') ids.push('midnight-shift')
  if (!fullRun && phases.length === 1) ids.push('one-phase-wonder')
  if (fullRun && difficulty === 'normal' && Number(inputs.wipeCount) === 0) ids.push('no-second-chances')
  if (fullRun && difficulty === 'normal' && mistakes.length === 0) ids.push('not-a-scratch')
  for (const phase of phases) if (phase.mistakes === 0) ids.push(`flawless-${phase.key}`)
  if (fullRun && Number(inputs.crystalFailures) === 0) ids.push('crystal-clear-conscience')
  if (phases.some(phase => phase.key === 'p3') && Number(inputs.runeFailures) === 0) ids.push('rune-reader')
  if (actions.recoveryPasses > 0) ids.push('prepared-for-every-phase')
  if (fullRun && actions.recoveryPasses === PHASES.length) ids.push('never-caught-unprepared')
  if (actions.mainAbilityCasts > 0) ids.push('always-be-casting')
  if (inputs.pauseCycle) ids.push('strategic-timeout')
  if (fullRun && difficulty === 'hard' && mistakes.length === 0 && score > 1100) ids.push('hard-score-flawless')
  if (inputs.earlyKill) ids.push('early-kill')
  if (inputs.p3EarlyClear) ids.push('p3-early-clear')
  if (inputs.tankRole) ids.push('heavens-lance-warden')
  if (inputs.tankCrystalRole) ids.push('dawnforged-vanguard')
  if (inputs.p4ConeTankRole) ids.push('p4-frontal-tank')
  if (inputs.p4ProtectionTankRole) ids.push('p4-protection-tank')
  return [...new Set(ids)]
}

interface AchievementProgressRow {
  difficulty: string
  duty: string
  score: number
  acceptedAt: string
  runEligible: number
  phaseResultsJson: string
  mistakesJson: string
  actionsJson: string
}

export interface AccountAchievementProgress {
  phaseClears: number
  duties: string[]
  superhumanDuties: string[]
  flawlessStreaks: { normal: number; hard: number }
}

function achievementProgressRows(database: Database, accountId: number): AchievementProgressRow[] {
  return database.prepare(`
    SELECT COALESCE(r.verified_difficulty, r.difficulty) AS difficulty,
      r.duty, r.score, r.run_eligible AS runEligible, r.accepted_at AS acceptedAt,
      s.phase_results_json AS phaseResultsJson,
      s.mistakes_json AS mistakesJson, s.actions_json AS actionsJson
    FROM results r
    JOIN attempt_summaries s ON s.attempt_id = r.attempt_id
    WHERE r.account_id = ?
    ORDER BY r.accepted_at
  `).all(accountId) as unknown as AchievementProgressRow[]
}

export function accountAchievementProgress(database: Database, accountId: number): AccountAchievementProgress {
  const parsed = achievementProgressRows(database, accountId).map(row => {
    const mistakes = JSON.parse(row.mistakesJson) as unknown[]
    const actions = JSON.parse(row.actionsJson) as { recoveryPasses?: number; mainAbilityCasts?: number }
    const phaseResults = JSON.parse(row.phaseResultsJson) as unknown[]
    return { ...row, flawless: mistakes.length === 0, actions, phaseClears: phaseResults.length }
  })
  const fullRuns = parsed.filter(row => row.runEligible === 1)
  const duties = [...new Set(fullRuns.map(row => row.duty))]
  const superhumanDuties = [...new Set(parsed
    .filter(row => row.runEligible === 1
      && row.difficulty === 'hard'
      && row.flawless
      && row.score > 1100
      && row.actions.recoveryPasses === PHASES.length
      && Number(row.actions.mainAbilityCasts) > 0)
    .map(row => row.duty))]
  const flawlessStreaks = { normal: 0, hard: 0 }
  for (const difficulty of ['normal', 'hard'] as const) {
    const relevant = fullRuns.filter(row => row.difficulty === difficulty)
    for (let index = relevant.length - 1; index >= 0 && relevant[index].flawless; index -= 1) {
      flawlessStreaks[difficulty] += 1
    }
  }
  return {
    phaseClears: parsed.reduce((total, row) => total + row.phaseClears, 0),
    duties,
    superhumanDuties,
    flawlessStreaks,
  }
}

export function aggregateAchievementIds(database: Database, accountId: number): string[] {
  const progress = accountAchievementProgress(database, accountId)
  const ids: string[] = []
  if (progress.duties.length === 2) ids.push('both-sides-of-crystal')
  if (progress.superhumanDuties.length === 2) ids.push('superhuman-both-duties')
  if (progress.flawlessStreaks.normal >= 5) ids.push('impossible-normal-streak')
  if (progress.flawlessStreaks.hard >= 5) ids.push('impossible-hard-streak')
  if (progress.phaseClears >= 10) ids.push('phase-clears-10')
  if (progress.phaseClears >= 50) ids.push('phase-clears-50')
  if (progress.phaseClears >= 100) ids.push('phase-clears-100')
  return ids
}

export function leaderboardAchievementIds(database: Database, accountId: number, season: string): string[] {
  const leaders = database.prepare(`
    WITH account_bests AS (
      SELECT account_id AS accountId, difficulty, duty, score, duration_ms AS durationMs, accepted_at AS acceptedAt,
        ROW_NUMBER() OVER (
          PARTITION BY account_id, difficulty, duty
          ORDER BY score DESC, duration_ms ASC, accepted_at ASC
        ) AS accountRun
      FROM results
      WHERE run_eligible = 1 AND leaderboard_season = ?
        AND difficulty IN ('normal', 'hard')
    ), ranked AS (
      SELECT accountId, difficulty, duty,
        ROW_NUMBER() OVER (
          PARTITION BY difficulty, duty
          ORDER BY score DESC, durationMs ASC, acceptedAt ASC
        ) AS boardRank
      FROM account_bests WHERE accountRun = 1
    )
    SELECT difficulty, duty FROM ranked WHERE accountId = ? AND boardRank = 1
  `).all(season, accountId) as Array<{ difficulty: 'normal' | 'hard'; duty: 'crystal' | 'non-crystal' }>
  const ids = leaders.map(row => `rank-one-${row.difficulty}-${row.duty}`)
  if (new Set(leaders.map(row => `${row.difficulty}:${row.duty}`)).size === 4) ids.push('rank-one-all-boards')
  return ids
}

export function completeAttempt(
  database: Database,
  dependencies: AuthDependencies,
  accountId: number,
  attemptId: string,
  idempotencyKey: string,
  input: CompletionInput,
) {
  const attempt = database.prepare(`
    SELECT id, character_id AS characterId, difficulty,
      COALESCE(verified_difficulty, difficulty) AS verifiedDifficulty,
      duty, entry_mode AS entryMode, phase_scope AS phaseScope, trainer_version AS trainerVersion,
      build_id AS buildId, leaderboard_season AS leaderboardSeason,
      configuration_json AS configurationJson,
      nonce_hash AS nonceHash, expires_at AS expiresAt, consumed_at AS consumedAt
    FROM attempts WHERE id = ? AND account_id = ?
  `).get(attemptId, accountId) as {
    id: string
    characterId: number
    difficulty: string
    verifiedDifficulty: string
    duty: string
    entryMode: string
    phaseScope: string
    trainerVersion: string
    buildId: string
    leaderboardSeason: string
    configurationJson: string
    nonceHash: string
    expiresAt: string
    consumedAt: string | null
  } | undefined
  if (!attempt) throw new Error('attempt_not_found')
  const expectedPhases = ENTRY_PHASES[attempt.entryMode]
  if (!expectedPhases || attempt.phaseScope !== (attempt.entryMode === 'arena0' ? 'full' : expectedPhases[0])) throw new Error('invalid_phase_scope')
  const cleanIdempotencyKey = cleanString(idempotencyKey, 128)
  if (!cleanIdempotencyKey) throw new Error('invalid_idempotency_key')
  const completionHash = hash(JSON.stringify(input))
  const idempotencyKeyHash = hash(cleanIdempotencyKey)
  if (attempt.consumedAt) {
    const summary = database.prepare(`
      SELECT accepted_score AS score, accepted_at AS acceptedAt,
        idempotency_key_hash AS idempotencyKeyHash,
        completion_hash AS completionHash,
        client_run_id AS clientRunId,
        achievement_ids_json AS achievementIdsJson
      FROM attempt_summaries WHERE attempt_id = ?
    `).get(attemptId) as {
      score: number
      acceptedAt: string
      idempotencyKeyHash: string | null
      completionHash: string | null
      clientRunId: string
      achievementIdsJson: string
    } | undefined
    if (summary?.idempotencyKeyHash === idempotencyKeyHash) {
      if (summary.completionHash !== completionHash) throw new Error('idempotency_conflict')
      return {
        accepted: true,
        score: summary.score,
        acceptedAt: summary.acceptedAt,
        clientRunId: summary.clientRunId,
        achievementIds: JSON.parse(summary.achievementIdsJson) as string[],
      }
    }
    throw new Error('attempt_already_used')
  }
  const completion = validatedCompletion(input, expectedPhases)
  if (hash(completion.nonce) !== attempt.nonceHash) throw new Error('invalid_nonce')
  if (completion.trainerVersion !== attempt.trainerVersion || completion.buildId !== attempt.buildId) {
    throw new Error('attempt_version_mismatch')
  }
  let issuedConfiguration: unknown
  try {
    issuedConfiguration = JSON.parse(attempt.configurationJson)
  } catch {
    throw new Error('attempt_configuration_mismatch')
  }
  if (JSON.stringify(completion.configuration) !== JSON.stringify(issuedConfiguration)) {
    throw new Error('attempt_configuration_mismatch')
  }
  if (attempt.expiresAt <= dependencies.now().toISOString()) throw new Error('attempt_expired')
  const acceptedAt = dependencies.now().toISOString()
  const achievementIds = earnedAchievementIds(
    attempt.verifiedDifficulty,
    completion.acceptedScore,
    completion.phases,
    completion.mistakes,
    completion.actions,
    completion.achievementInputs,
  )
  const awardedAchievementIds: string[] = []
  database.exec('BEGIN IMMEDIATE')
  try {
    const consumed = database.prepare(`
      UPDATE attempts SET consumed_at = ?
      WHERE id = ? AND account_id = ? AND consumed_at IS NULL
    `).run(acceptedAt, attemptId, accountId)
    if (consumed.changes !== 1) throw new Error('attempt_already_used')
    database.prepare(`
      INSERT INTO attempt_summaries (
        attempt_id, duration_ms, phase_results_json, mistakes_json, actions_json,
        accepted_score, submitted_score, accepted_at, idempotency_key_hash,
        completion_hash, client_run_id, achievement_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
    `).run(
      attemptId,
      completion.durationMs,
      JSON.stringify(completion.phases),
      JSON.stringify(completion.mistakes),
      JSON.stringify({ ...completion.actions, achievementInputs: completion.achievementInputs }),
      completion.acceptedScore,
      completion.submittedScore,
      acceptedAt,
      idempotencyKeyHash,
      completionHash,
      completion.clientRunId,
    )
    database.prepare(`
      INSERT INTO results (
        attempt_id, account_id, character_id, difficulty, duty, score,
        duration_ms, trainer_version, build_id, accepted_at, verified_difficulty,
        run_eligible, leaderboard_season
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      attemptId,
      accountId,
      attempt.characterId,
      attempt.difficulty,
      attempt.duty,
      completion.acceptedScore,
      completion.durationMs,
      attempt.trainerVersion,
      attempt.buildId,
      acceptedAt,
      attempt.verifiedDifficulty,
      Number(
        attempt.entryMode === 'arena0'
        && completion.phases.length === PHASES.length
        && (attempt.verifiedDifficulty === 'normal' || attempt.verifiedDifficulty === 'hard'),
      ),
      attempt.leaderboardSeason,
    )
    achievementIds.push(...aggregateAchievementIds(database, accountId))
    achievementIds.push(...leaderboardAchievementIds(database, accountId, attempt.leaderboardSeason))
    for (const achievementId of [...new Set(achievementIds)]) {
      database.prepare(`
        INSERT INTO achievements (id, trainer_version, title)
        VALUES (?, ?, ?)
        ON CONFLICT (id, trainer_version) DO NOTHING
      `).run(achievementId, attempt.trainerVersion, achievementId)
      const insertedAchievement = database.prepare(`
        INSERT INTO account_achievements (
          account_id, character_id, achievement_id, trainer_version,
          build_id, source_attempt_id, first_earned_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
      `).run(
        accountId,
        attempt.characterId,
        achievementId,
        attempt.trainerVersion,
        attempt.buildId,
        attemptId,
        acceptedAt,
      )
      if (insertedAchievement.changes === 1) {
        awardedAchievementIds.push(achievementId)
        database.prepare(`
          INSERT INTO achievement_events (
            account_id, character_id, achievement_id, trainer_version,
            source_attempt_id, occurred_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          accountId,
          attempt.characterId,
          achievementId,
          attempt.trainerVersion,
          attemptId,
          acceptedAt,
        )
      }
    }
    database.prepare(`
      UPDATE attempt_summaries SET achievement_ids_json = ? WHERE attempt_id = ?
    `).run(JSON.stringify(awardedAchievementIds), attemptId)
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
  return {
    accepted: true,
    score: completion.acceptedScore,
    acceptedAt,
    clientRunId: completion.clientRunId,
    achievementIds: awardedAchievementIds,
  }
}
