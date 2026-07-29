import { createHash } from 'node:crypto'
import type { AuthDependencies } from './auth.js'
import type { ApiConfig } from './config.js'
import type { Database } from './database.js'

const PHASES = ['p1', 'intermission', 'p2', 'p3', 'p4'] as const

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
  nonce?: unknown
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
  if (input.entryMode !== 'arena0') throw new Error('invalid_entry_mode')
  if (input.phaseScope !== 'full') throw new Error('invalid_phase_scope')
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
      verified_difficulty
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    accountId,
    selected.characterId,
    hash(nonce),
    verifiedDifficulty === 'test' || verifiedDifficulty === 'easy' ? 'normal' : verifiedDifficulty,
    input.duty,
    input.entryMode,
    input.phaseScope,
    input.trainerVersion,
    buildId,
    JSON.stringify(configuration),
    issuedAt.toISOString(),
    expiresAt.toISOString(),
    verifiedDifficulty,
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

function validatedCompletion(input: CompletionInput) {
  const nonce = cleanString(input.nonce, 128)
  const trainerVersion = cleanString(input.trainerVersion, 30)
  const buildId = cleanString(input.buildId, 80)
  const durationMs = Number(input.durationMs)
  const submittedScore = Number(input.submittedScore)
  if (!nonce) throw new Error('invalid_nonce')
  if (!trainerVersion || !buildId) throw new Error('invalid_version')
  if (!Number.isInteger(durationMs) || durationMs < 60_000 || durationMs > 3_600_000) {
    throw new Error('implausible_duration')
  }
  if (!Number.isInteger(submittedScore) || submittedScore < 0 || submittedScore > 10_000) {
    throw new Error('invalid_score')
  }
  if (!Array.isArray(input.phaseResults) || input.phaseResults.length !== PHASES.length) {
    throw new Error('invalid_phase_order')
  }
  const phases = input.phaseResults as PhaseResult[]
  if (phases.some((phase, index) => (
    phase?.key !== PHASES[index]
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
    !Number.isInteger(recoveryPasses) || recoveryPasses < 0 || recoveryPasses > PHASES.length
    || recoveryPasses !== phases.filter(phase => phase.recovery === 'passed').length
    || !Number.isInteger(mainAbilityCasts) || mainAbilityCasts < 0
    || mainAbilityCasts > Math.floor(durationMs / 1_000)
    || !Number.isInteger(continuousPenalty) || continuousPenalty < 0 || continuousPenalty > 1000
  ) throw new Error('invalid_actions')
  const mistakePenalty = mistakes.reduce((total, mistake) => total + mistake.penalty, 0)
  const acceptedScore = Math.max(
    0,
    1000
      - mistakePenalty
      - continuousPenalty
      + recoveryPasses * 50
      + mainAbilityCasts
      + Math.floor(mainAbilityCasts / 20) * 50,
  )
  if (submittedScore !== acceptedScore) throw new Error('score_mismatch')
  const achievementInputs = input.achievementInputs as {
    wipeCount?: unknown
    crystalFailures?: unknown
    runeFailures?: unknown
    pauseCycle?: unknown
    earlyKill?: unknown
    p3EarlyClear?: unknown
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
  ) throw new Error('invalid_achievement_inputs')
  return {
    nonce,
    trainerVersion,
    buildId,
    durationMs,
    submittedScore,
    acceptedScore,
    phases,
    mistakes,
    actions: { recoveryPasses, mainAbilityCasts, continuousPenalty },
    achievementInputs,
  }
}

function earnedAchievementIds(
  difficulty: string,
  score: number,
  phases: PhaseResult[],
  mistakes: Mistake[],
  actions: { recoveryPasses: number; mainAbilityCasts: number },
  inputs: { wipeCount?: unknown; crystalFailures?: unknown; runeFailures?: unknown; pauseCycle?: unknown; earlyKill?: unknown; p3EarlyClear?: unknown },
): string[] {
  const ids: string[] = []
  if (difficulty === 'test') ids.push('test-pilot')
  if (difficulty === 'easy') ids.push('easy-does-it')
  if (difficulty === 'normal') ids.push('ready-for-raid-night')
  if (difficulty === 'hard') ids.push('midnight-shift')
  if (difficulty === 'normal' && Number(inputs.wipeCount) === 0) ids.push('no-second-chances')
  if (difficulty === 'normal' && mistakes.length === 0) ids.push('not-a-scratch')
  for (const phase of phases) if (phase.mistakes === 0) ids.push(`flawless-${phase.key}`)
  if (Number(inputs.crystalFailures) === 0) ids.push('crystal-clear-conscience')
  if (Number(inputs.runeFailures) === 0) ids.push('rune-reader')
  if (actions.recoveryPasses > 0) ids.push('prepared-for-every-phase')
  if (actions.recoveryPasses === PHASES.length) ids.push('never-caught-unprepared')
  if (actions.mainAbilityCasts > 0) ids.push('always-be-casting')
  if (inputs.pauseCycle) ids.push('strategic-timeout')
  if (difficulty === 'hard' && mistakes.length === 0 && score > 1100) ids.push('hard-score-flawless')
  if (inputs.earlyKill) ids.push('early-kill')
  if (inputs.p3EarlyClear) ids.push('p3-early-clear')
  return [...new Set(ids)]
}

function aggregateAchievementIds(database: Database, accountId: number): string[] {
  const rows = database.prepare(`
    SELECT COALESCE(r.verified_difficulty, r.difficulty) AS difficulty,
      r.duty, r.score, r.accepted_at AS acceptedAt,
      s.mistakes_json AS mistakesJson, s.actions_json AS actionsJson
    FROM results r
    JOIN attempt_summaries s ON s.attempt_id = r.attempt_id
    WHERE r.account_id = ?
    ORDER BY r.accepted_at
  `).all(accountId) as Array<{
    difficulty: string
    duty: string
    score: number
    acceptedAt: string
    mistakesJson: string
    actionsJson: string
  }>
  const parsed = rows.map(row => {
    const mistakes = JSON.parse(row.mistakesJson) as unknown[]
    const actions = JSON.parse(row.actionsJson) as { recoveryPasses?: number; mainAbilityCasts?: number }
    return { ...row, flawless: mistakes.length === 0, actions }
  })
  const ids: string[] = []
  if (new Set(parsed.map(row => row.duty)).size === 2) ids.push('both-sides-of-crystal')
  const superhumanDuties = new Set(parsed
    .filter(row => row.difficulty === 'hard'
      && row.flawless
      && row.score > 1100
      && row.actions.recoveryPasses === PHASES.length
      && Number(row.actions.mainAbilityCasts) > 0)
    .map(row => row.duty))
  if (superhumanDuties.size === 2) ids.push('superhuman-both-duties')
  for (const difficulty of ['normal', 'hard']) {
    const relevant = parsed.filter(row => row.difficulty === difficulty)
    let streak = 0
    for (let index = relevant.length - 1; index >= 0 && relevant[index].flawless; index -= 1) streak += 1
    if (streak >= 5) ids.push(difficulty === 'hard' ? 'impossible-hard-streak' : 'impossible-normal-streak')
  }
  const phaseClears = parsed.length * PHASES.length
  if (phaseClears >= 10) ids.push('phase-clears-10')
  if (phaseClears >= 50) ids.push('phase-clears-50')
  if (phaseClears >= 100) ids.push('phase-clears-100')
  return ids
}

export function completeAttempt(
  database: Database,
  dependencies: AuthDependencies,
  accountId: number,
  attemptId: string,
  input: CompletionInput,
) {
  const completion = validatedCompletion(input)
  const attempt = database.prepare(`
    SELECT id, character_id AS characterId, difficulty,
      COALESCE(verified_difficulty, difficulty) AS verifiedDifficulty,
      duty, trainer_version AS trainerVersion,
      build_id AS buildId, nonce_hash AS nonceHash, expires_at AS expiresAt, consumed_at AS consumedAt
    FROM attempts WHERE id = ? AND account_id = ?
  `).get(attemptId, accountId) as {
    id: string
    characterId: number
    difficulty: string
    verifiedDifficulty: string
    duty: string
    trainerVersion: string
    buildId: string
    nonceHash: string
    expiresAt: string
    consumedAt: string | null
  } | undefined
  if (!attempt) throw new Error('attempt_not_found')
  if (attempt.consumedAt) throw new Error('attempt_already_used')
  if (attempt.expiresAt <= dependencies.now().toISOString()) throw new Error('attempt_expired')
  if (hash(completion.nonce) !== attempt.nonceHash) throw new Error('invalid_nonce')
  if (completion.trainerVersion !== attempt.trainerVersion || completion.buildId !== attempt.buildId) {
    throw new Error('attempt_version_mismatch')
  }
  const acceptedAt = dependencies.now().toISOString()
  const achievementIds = earnedAchievementIds(
    attempt.verifiedDifficulty,
    completion.acceptedScore,
    completion.phases,
    completion.mistakes,
    completion.actions,
    completion.achievementInputs,
  )
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
        accepted_score, submitted_score, accepted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      attemptId,
      completion.durationMs,
      JSON.stringify(completion.phases),
      JSON.stringify(completion.mistakes),
      JSON.stringify({ ...completion.actions, achievementInputs: completion.achievementInputs }),
      completion.acceptedScore,
      completion.submittedScore,
      acceptedAt,
    )
    database.prepare(`
      INSERT INTO results (
        attempt_id, account_id, character_id, difficulty, duty, score,
        duration_ms, trainer_version, build_id, accepted_at, verified_difficulty,
        run_eligible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      Number(attempt.verifiedDifficulty === 'normal' || attempt.verifiedDifficulty === 'hard'),
    )
    achievementIds.push(...aggregateAchievementIds(database, accountId))
    for (const achievementId of [...new Set(achievementIds)]) {
      database.prepare(`
        INSERT INTO achievements (id, trainer_version, title)
        VALUES (?, ?, ?)
        ON CONFLICT (id, trainer_version) DO NOTHING
      `).run(achievementId, attempt.trainerVersion, achievementId)
      database.prepare(`
        INSERT INTO account_achievements (
          account_id, character_id, achievement_id, trainer_version,
          build_id, source_attempt_id, first_earned_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (account_id, character_id, achievement_id, trainer_version) DO NOTHING
      `).run(
        accountId,
        attempt.characterId,
        achievementId,
        attempt.trainerVersion,
        attempt.buildId,
        attemptId,
        acceptedAt,
      )
    }
    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
  return { accepted: true, score: completion.acceptedScore, acceptedAt, achievementIds }
}
