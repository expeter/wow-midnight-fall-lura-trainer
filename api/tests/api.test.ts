import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { resolve } from 'node:path'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { createApp } from '../src/app.js'
import { loadConfig, type ApiConfig } from '../src/config.js'
import { applyMigrations, openDatabase, type Database } from '../src/database.js'
import { isDatabaseBusyError } from '../src/http.js'
import type { AuthDependencies } from '../src/auth.js'
import { aggregateAchievementIds, leaderboardAchievementIds } from '../src/attempts.js'
import { listAchievementHall } from '../src/achievementHall.js'
import { FIND_A_BUG_ACHIEVEMENT_ID, grantExceptionalAchievement } from '../src/exceptionalAchievements.js'
import { listGlobalRanking, publicPlayerProfile } from '../src/globalRanking.js'

const config: ApiConfig = {
  host: '127.0.0.1',
  port: 0,
  databasePath: ':memory:',
  trainerOrigin: 'https://trainer.example',
  localOrigins: ['http://127.0.0.1:5173'],
  currentTrainerVersion: '0.3.0',
  currentLeaderboardSeason: 'season-1',
  battleNetClientId: 'client-id',
  battleNetClientSecret: 'client-secret',
  battleNetCallbackUrl: 'http://api.test/v1/auth/battlenet/callback',
  sessionSecret: 'session-secret-with-at-least-32-bytes',
  csrfSecret: 'csrf-secret-with-at-least-32-bytes---',
}

function insertResult(
  database: Database,
  input: {
    region: 'eu' | 'us'
    account: string
    character: string
    realm: string
    guild?: string
    mode: 'anonymous' | 'alias' | 'character'
    alias?: string
    showGuild?: boolean
    score: number
    duration: number
    acceptedAt: string
  },
) {
  const now = '2026-07-28T00:00:00.000Z'
  const account = database.prepare(`
    INSERT INTO accounts (battle_net_region, battle_net_account_id, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(input.region, input.account, now, now)
  const accountId = Number(account.lastInsertRowid)
  const character = database.prepare(`
    INSERT INTO characters (
      account_id, region, character_id, realm_id, realm_slug, name,
      guild_name, refreshed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(accountId, input.region, `${input.region}-${input.account}`, input.realm, input.realm, input.character, input.guild ?? null, now)
  const characterId = Number(character.lastInsertRowid)
  database.prepare(`
    INSERT INTO privacy_settings (account_id, identity_mode, alias, show_guild, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(accountId, input.mode, input.alias ?? null, input.showGuild ? 1 : 0, now)
  const attemptId = `attempt-${input.account}`
  database.prepare(`
    INSERT INTO attempts (
      id, account_id, character_id, nonce_hash, difficulty, duty, entry_mode,
      phase_scope, trainer_version, build_id, configuration_json, issued_at,
      expires_at, consumed_at
    ) VALUES (?, ?, ?, 'nonce', 'hard', 'crystal', 'full', 'all', '0.3.0',
      'build-1', '{}', ?, ?, ?)
  `).run(attemptId, accountId, characterId, now, '2026-07-28T01:00:00.000Z', input.acceptedAt)
  database.prepare(`
    INSERT INTO results (
      attempt_id, account_id, character_id, difficulty, duty, score,
      duration_ms, trainer_version, build_id, accepted_at
    ) VALUES (?, ?, ?, 'hard', 'crystal', ?, ?, '0.3.0', 'build-1', ?)
  `).run(attemptId, accountId, characterId, input.score, input.duration, input.acceptedAt)
  return accountId
}

function insertSession(database: Database, accountId: number, token = 'owned-session') {
  const csrf = createHmac('sha256', config.csrfSecret).update(token).digest('hex')
  database.prepare(`
    INSERT INTO sessions (id_hash, account_id, csrf_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    createHmac('sha256', config.sessionSecret).update(token).digest('hex'),
    accountId,
    createHash('sha256').update(csrf).digest('hex'),
    '2099-07-29T00:00:00.000Z',
    '2026-07-28T00:00:00.000Z',
  )
  return { cookie: `lura_session=${token}`, csrf }
}

function insertAdditionalResult(
  database: Database,
  accountId: number,
  suffix: string,
  score: number,
  duration: number,
  acceptedAt: string,
  trainerVersion = '0.3.0',
  season = 'season-1',
) {
  const character = database.prepare('SELECT id FROM characters WHERE account_id = ? LIMIT 1')
    .get(accountId) as { id: number }
  const attemptId = `attempt-${suffix}`
  database.prepare(`
    INSERT INTO attempts (
      id, account_id, character_id, nonce_hash, difficulty, duty, entry_mode,
      phase_scope, trainer_version, build_id, configuration_json, issued_at,
      expires_at, consumed_at, verified_difficulty, leaderboard_season
    ) VALUES (?, ?, ?, 'nonce', 'hard', 'crystal', 'arena0', 'full', ?, 'build-1',
      '{}', '2026-07-28T00:00:00.000Z', '2026-07-28T01:00:00.000Z', ?,
      'hard', ?)
  `).run(attemptId, accountId, character.id, trainerVersion, acceptedAt, season)
  database.prepare(`
    INSERT INTO results (
      attempt_id, account_id, character_id, difficulty, duty, score,
      duration_ms, trainer_version, build_id, accepted_at, verified_difficulty,
      run_eligible, leaderboard_season
    ) VALUES (?, ?, ?, 'hard', 'crystal', ?, ?, ?, 'build-1', ?, 'hard', 1, ?)
  `).run(attemptId, accountId, character.id, score, duration, trainerVersion, acceptedAt, season)
  return attemptId
}

describe('Lura API foundation', () => {
  let database: Database

  beforeEach(() => {
    database = openDatabase(':memory:')
    applyMigrations(database, resolve(process.cwd(), 'migrations'))
  })

  afterEach(() => database.close())

  it('applies migrations idempotently and reports database health', async () => {
    assert.deepEqual(applyMigrations(database, resolve(process.cwd(), 'migrations')), [])
    const response = await createApp(database, config).handle(new Request('http://api.test/health'))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      status: 'ok',
      trainerVersion: config.currentTrainerVersion,
      leaderboardSeason: config.currentLeaderboardSeason,
    })
  })

  it('awards hidden board crowns for each first place and the four-board sweep', () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'four-crowns', character: 'Crowned', realm: 'blackrock',
      mode: 'character', score: 1800, duration: 80_000, acceptedAt: '2026-07-28T00:00:00.000Z',
    })
    const characterId = Number((database.prepare('SELECT id FROM characters WHERE account_id = ?').get(accountId) as { id: number }).id)
    database.prepare("UPDATE attempts SET difficulty = 'normal', duty = 'crystal', verified_difficulty = 'normal' WHERE account_id = ?").run(accountId)
    database.prepare("UPDATE results SET difficulty = 'normal', duty = 'crystal', verified_difficulty = 'normal' WHERE account_id = ?").run(accountId)
    for (const [difficulty, duty, suffix] of [
      ['normal', 'non-crystal', 'nn'], ['hard', 'crystal', 'hc'], ['hard', 'non-crystal', 'hn'],
    ] as const) {
      const attemptId = `attempt-four-crowns-${suffix}`
      database.prepare(`
        INSERT INTO attempts (
          id, account_id, character_id, nonce_hash, difficulty, duty, entry_mode, phase_scope,
          trainer_version, build_id, configuration_json, issued_at, expires_at, consumed_at,
          verified_difficulty, leaderboard_season
        ) VALUES (?, ?, ?, 'nonce', ?, ?, 'full', 'all', '0.3.0', 'build-1', '{}',
          '2026-07-28T00:00:00.000Z', '2026-07-28T01:00:00.000Z', '2026-07-28T00:01:00.000Z', ?, 'season-1')
      `).run(attemptId, accountId, characterId, difficulty, duty, difficulty)
      database.prepare(`
        INSERT INTO results (
          attempt_id, account_id, character_id, difficulty, duty, score, duration_ms,
          trainer_version, build_id, accepted_at, verified_difficulty, run_eligible, leaderboard_season
        ) VALUES (?, ?, ?, ?, ?, 1800, 80000, '0.3.0', 'build-1',
          '2026-07-28T00:01:00.000Z', ?, 1, 'season-1')
      `).run(attemptId, accountId, characterId, difficulty, duty, difficulty)
    }
    assert.deepEqual(leaderboardAchievementIds(database, accountId, 'season-1').sort(), [
      'rank-one-all-boards',
      'rank-one-hard-crystal',
      'rank-one-hard-non-crystal',
      'rank-one-normal-crystal',
      'rank-one-normal-non-crystal',
    ])
  })

  it('keeps manually granted exceptional achievements out of activity and concealed until the viewer owns them', () => {
    const targetId = insertResult(database, {
      region: 'eu', account: 'bug-finder', character: 'Bugfinder', realm: 'blackrock',
      mode: 'character', score: 1200, duration: 80_000, acceptedAt: '2026-07-28T00:01:00.000Z',
    })
    const fellowId = insertResult(database, {
      region: 'eu', account: 'fellow-finder', character: 'Fellowfinder', realm: 'blackhand',
      mode: 'character', score: 1100, duration: 82_000, acceptedAt: '2026-07-28T00:02:00.000Z',
    })
    const outsiderId = insertResult(database, {
      region: 'eu', account: 'outsider', character: 'Outsider', realm: 'antonidas',
      mode: 'character', score: 1000, duration: 84_000, acceptedAt: '2026-07-28T00:03:00.000Z',
    })
    for (const accountId of [targetId, fellowId, outsiderId]) {
      const character = database.prepare('SELECT id FROM characters WHERE account_id = ?').get(accountId) as { id: number }
      database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?').run(character.id, accountId)
    }
    createApp(database, config)
    const grant = (accountId: number) => grantExceptionalAchievement(database, {
      accountId,
      achievementId: FIND_A_BUG_ACHIEVEMENT_ID,
      trainerVersion: config.currentTrainerVersion,
      grantedBy: 'Pestivator',
      reason: 'Verified trainer bug report',
      grantedAt: '2026-07-31T11:00:00.000Z',
    })
    assert.equal(grant(targetId), true)
    assert.equal(grant(fellowId), true)
    assert.equal(grant(targetId), false)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM achievement_events').get()!.count, 0)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM exceptional_achievement_grants').get()!.count, 2)

    const targetProfileId = (database.prepare('SELECT public_profile_id AS id FROM accounts WHERE id = ?').get(targetId) as { id: string }).id
    const hidden = publicPlayerProfile(database, targetProfileId, 'season-1', outsiderId)!
    assert.deepEqual(hidden.achievements, [{
      id: 'hidden-exceptional-1', title: 'Hidden achievement', tier: 'Exceptional', points: 10,
      firstEarnedAt: '2026-07-31T11:00:00.000Z', hidden: true,
    }])
    assert.equal(publicPlayerProfile(database, targetProfileId, 'season-1', fellowId)!.achievements[0].title, 'Find a Bug')
    assert.equal(publicPlayerProfile(database, targetProfileId, 'season-1', targetId)!.achievements[0].title, 'Find a Bug')
    assert.equal(listGlobalRanking(database, 'season-1').rows.find(row => row.profileId === targetProfileId)?.exceptionalAchievementCount, 1)
    const hallTarget = listAchievementHall(database, { limit: 10, offset: 0 }).rows.find(row => row.profileId === targetProfileId)!
    assert.equal(hallTarget.exceptionalAchievementCount, 1)
    assert.equal(hallTarget.highestAchievement.title, 'Hidden achievement')
    const sharedHallTarget = listAchievementHall(database, { limit: 10, offset: 0, ownAccountId: fellowId }).rows.find(row => row.profileId === targetProfileId)!
    assert.equal(sharedHallTarget.highestAchievement.title, 'Find a Bug')
  })

  it('does not let a stale environment override pin attempt compatibility', () => {
    const releaseConfig = loadConfig({ TRAINER_CURRENT_VERSION: '0.3.0' })
    assert.equal(releaseConfig.currentTrainerVersion, '0.9.0')
    assert.equal(releaseConfig.currentLeaderboardSeason, 'season-1')
  })

  it('accepts both loopback hostname forms for configured local CORS origins', async () => {
    const app = createApp(database, config)
    const response = await app.handle(new Request('http://api.test/v1/me', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:5173' },
    }))
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  })

  it('classifies SQLite writer contention as retryable without exposing internals', () => {
    assert.equal(isDatabaseBusyError(new Error('database is locked')), true)
    assert.equal(isDatabaseBusyError(new Error('database is busy')), true)
    assert.equal(isDatabaseBusyError(new Error('other failure')), false)
  })

  it('merges EU and US results and sorts score, duration, then acceptance time', async () => {
    const priorReleaseAccount = insertResult(database, {
      region: 'eu', account: '1', character: 'Aegis', realm: 'silvermoon',
      mode: 'character', score: 1200, duration: 90_000, acceptedAt: '2026-07-28T00:03:00.000Z',
    })
    database.prepare(
      'UPDATE results SET trainer_version = ? WHERE account_id = ?',
    ).run('0.2.9', priorReleaseAccount)
    insertResult(database, {
      region: 'us', account: '2', character: 'Beacon', realm: 'illidan',
      mode: 'character', score: 1200, duration: 80_000, acceptedAt: '2026-07-28T00:02:00.000Z',
    })
    insertResult(database, {
      region: 'eu', account: '3', character: 'Cipher', realm: 'draenor',
      mode: 'anonymous', score: 1100, duration: 70_000, acceptedAt: '2026-07-28T00:01:00.000Z',
    })
    const response = await createApp(database, config).handle(new Request(
      'http://api.test/v1/leaderboards?difficulty=hard&duty=crystal&version=current',
    ))
    assert.equal(response.status, 200)
    const payload = await response.json() as { rows: Array<{ displayName: string; realm: string | null }> }
    assert.deepEqual(payload.rows.map(row => row.displayName), ['Beacon', 'Aegis'])
    assert.deepEqual(payload.rows.map(row => row.realm), ['illidan', 'silvermoon'])
    const priorRelease = await createApp(database, config).handle(new Request(
      'http://api.test/v1/leaderboards?difficulty=hard&duty=crystal&version=0.2.9',
    ))
    assert.deepEqual(
      (await priorRelease.json() as { rows: Array<{ displayName: string }> }).rows.map(row => row.displayName),
      ['Aegis'],
    )
  })

  it('publishes one best run per account and preserves board rank while searching', async () => {
    const alpha = insertResult(database, {
      region: 'eu', account: 'best-alpha', character: 'Alpha', realm: 'silvermoon',
      mode: 'character', score: 1200, duration: 90_000,
      acceptedAt: '2026-07-28T00:01:00.000Z',
    })
    insertAdditionalResult(
      database,
      alpha,
      'best-alpha-lower',
      1100,
      80_000,
      '2026-07-28T00:02:00.000Z',
    )
    insertResult(database, {
      region: 'us', account: 'best-beta', character: 'Beta', realm: 'illidan',
      mode: 'character', score: 1150, duration: 85_000,
      acceptedAt: '2026-07-28T00:03:00.000Z',
    })
    const app = createApp(database, config)
    const board = await app.handle(new Request(
      'http://api.test/v1/leaderboards?difficulty=hard&duty=crystal',
    ))
    const boardRows = (await board.json() as {
      rows: Array<{ displayName: string; score: number; rank: number }>
    }).rows
    assert.deepEqual(
      boardRows.map(row => [row.displayName, row.score, row.rank]),
      [['Alpha', 1200, 1], ['Beta', 1150, 2]],
    )
    const search = await app.handle(new Request(
      'http://api.test/v1/leaderboards/search?difficulty=hard&duty=crystal&q=Beta',
    ))
    assert.deepEqual(
      (await search.json() as { rows: Array<{ displayName: string; rank: number }> }).rows
        .map(row => [row.displayName, row.rank]),
      [['Beta', 2]],
    )
  })

  it('uses the current season consistently for personal and public profile standings', async () => {
    const alpha = insertResult(database, {
      region: 'eu', account: 'season-alpha', character: 'Seasonalpha', realm: 'silvermoon',
      mode: 'character', score: 1200, duration: 90_000,
      acceptedAt: '2026-07-28T00:01:00.000Z',
    })
    const beta = insertResult(database, {
      region: 'us', account: 'season-beta', character: 'Seasonbeta', realm: 'illidan',
      mode: 'character', score: 1100, duration: 85_000,
      acceptedAt: '2026-07-28T00:02:00.000Z',
    })
    insertAdditionalResult(
      database,
      beta,
      'season-beta-prior-version',
      1300,
      80_000,
      '2026-07-28T00:03:00.000Z',
      '0.2.9',
      'season-1',
    )
    insertAdditionalResult(
      database,
      alpha,
      'season-alpha-future-season',
      2000,
      70_000,
      '2026-07-28T00:04:00.000Z',
      '0.3.0',
      'season-2',
    )
    const betaCharacter = database.prepare('SELECT id FROM characters WHERE account_id = ?')
      .get(beta) as { id: number }
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?')
      .run(betaCharacter.id, beta)
    const profileId = (database.prepare('SELECT public_profile_id AS profileId FROM accounts WHERE id = ?')
      .get(beta) as { profileId: string }).profileId
    const session = insertSession(database, beta, 'season-beta-session')
    const app = createApp(database, config)
    const me = await app.handle(new Request('http://api.test/v1/me', {
      headers: { cookie: session.cookie },
    }))
    assert.deepEqual(
      (await me.json() as { standings: Array<{ score: number; position: number }> }).standings
        .map(row => [row.score, row.position]),
      [[1300, 1]],
    )
    const profile = await app.handle(new Request(`http://api.test/v1/profiles/${profileId}`))
    const profileBoard = (await profile.json() as {
      boards: Array<{ difficulty: string; duty: string; rank: number | null }>
    }).boards.find(row => row.difficulty === 'hard' && row.duty === 'crystal')
    assert.equal(profileBoard?.rank, 1)
  })

  it('searches only fields made public by privacy settings', async () => {
    insertResult(database, {
      region: 'eu', account: '1', character: 'Hiddenhero', realm: 'secret-realm',
      guild: 'Hidden Guild', mode: 'anonymous', showGuild: true, score: 900,
      duration: 90_000, acceptedAt: '2026-07-28T00:01:00.000Z',
    })
    insertResult(database, {
      region: 'us', account: '2', character: 'Visiblehero', realm: 'public-realm',
      guild: 'Milestone', mode: 'alias', alias: 'Runner', showGuild: true,
      score: 1000, duration: 80_000, acceptedAt: '2026-07-28T00:02:00.000Z',
    })
    const app = createApp(database, config)
    const hidden = await app.handle(new Request(
      'http://api.test/v1/leaderboards/search?difficulty=hard&duty=crystal&q=Hiddenhero',
    ))
    const visible = await app.handle(new Request(
      'http://api.test/v1/leaderboards/search?difficulty=hard&duty=crystal&q=Milestone',
    ))
    assert.deepEqual((await hidden.json() as { rows: unknown[] }).rows, [])
    assert.deepEqual((await visible.json() as { rows: unknown[] }).rows, [])
    const alias = await app.handle(new Request(
      'http://api.test/v1/leaderboards/search?difficulty=hard&duty=crystal&q=Runner',
    ))
    const rows = (await alias.json() as { rows: Array<{ displayName: string; character: null; guild: null }> }).rows
    assert.deepEqual(rows, [{ ...rows[0], displayName: 'Runner', character: null, guild: null }])
  })

  it('ranks public profiles by achievement points plus the best score from each run board', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'global', character: 'Globalhero', realm: 'silvermoon',
      guild: 'I Asgard I', mode: 'character', showGuild: true, score: 1500,
      duration: 80_000, acceptedAt: '2026-07-28T00:02:00.000Z',
    })
    database.prepare(`
      INSERT INTO achievement_catalog (id, title, tier, points, season, introduced_version)
      VALUES ('global-achievement', 'Global Achievement', 'Rare', 50, 1, '0.3.0')
    `).run()
    database.prepare(`
      INSERT INTO achievements (id, trainer_version, title) VALUES ('global-achievement', '0.3.0', 'Global Achievement')
    `).run()
    const account = database.prepare('SELECT public_profile_id AS profileId FROM accounts WHERE id = ?').get(accountId) as { profileId: string }
    const character = database.prepare('SELECT id FROM characters WHERE account_id = ?').get(accountId) as { id: number }
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?').run(character.id, accountId)
    database.prepare(`
      INSERT INTO account_achievements (account_id, character_id, achievement_id, trainer_version, build_id, source_attempt_id, first_earned_at)
      VALUES (?, ?, 'global-achievement', '0.3.0', 'build-1', 'attempt-global', '2026-07-28T00:03:00.000Z')
    `).run(accountId, character.id)
    database.prepare(`
      INSERT INTO wipe_events (account_id, character_id, phase, difficulty, reason, trainer_version, occurred_at)
      VALUES (?, ?, 'Phase 1', 'hard', 'Test wipe', '0.3.0', '2026-07-28T00:04:00.000Z')
    `).run(accountId, character.id)
    database.prepare(`
      INSERT INTO attempt_summaries (
        attempt_id, duration_ms, phase_results_json, mistakes_json, actions_json,
        accepted_score, submitted_score, accepted_at
      ) VALUES ('attempt-global', 80000, '[]', '[]', '{}', 1500, 1500, '2026-07-28T00:02:00.000Z')
    `).run()
    const app = createApp(database, config)
    const ranking = await app.handle(new Request('http://api.test/v1/global-ranking?limit=3'))
    const rankingRows = (await ranking.json() as { rows: Array<{ profileId: string; achievementPoints: number; runPoints: number; totalPoints: number; crystalFlawless: boolean; hardClear: boolean }> }).rows
    assert.deepEqual(rankingRows[0], { ...rankingRows[0], profileId: account.profileId, achievementPoints: 50, runPoints: 1500, totalPoints: 1550, crystalFlawless: true, hardClear: true })
    const searched = await app.handle(new Request('http://api.test/v1/global-ranking?limit=10&q=Asgard'))
    assert.deepEqual((await searched.json() as { rows: Array<{ profileId: string }> }).rows.map(row => row.profileId), [account.profileId])
    const profile = await app.handle(new Request(`http://api.test/v1/profiles/${account.profileId}`))
    const body = await profile.json() as { displayName: string; attempts: number; fullRuns: number; wipes: number; achievements: unknown[]; boards: Array<{ rank: number | null }> }
    assert.equal(body.displayName, 'Globalhero')
    assert.equal(body.attempts, 1)
    assert.equal(body.fullRuns, 1)
    assert.equal(body.wipes, 1)
    assert.equal(body.achievements.length, 1)
    assert.equal(body.boards.find(board => board.rank !== null)?.rank, 1)
    database.prepare(`
      UPDATE privacy_settings SET identity_mode = 'alias', alias = 'Global alias', show_guild = 1
      WHERE account_id = ?
    `).run(accountId)
    const aliasRanking = await app.handle(new Request('http://api.test/v1/global-ranking?limit=3'))
    assert.equal((await aliasRanking.json() as { rows: Array<{ guild: string | null }> }).rows[0].guild, null)
    const aliasHall = await app.handle(new Request('http://api.test/v1/achievement-hall'))
    assert.equal((await aliasHall.json() as { rows: Array<{ guild: string | null }> }).rows[0].guild, null)
    const aliasProfile = await app.handle(new Request(`http://api.test/v1/profiles/${account.profileId}`))
    assert.equal((await aliasProfile.json() as { guild: string | null }).guild, null)
    database.prepare("UPDATE privacy_settings SET identity_mode = 'anonymous' WHERE account_id = ?").run(accountId)
    assert.equal((await app.handle(new Request(`http://api.test/v1/profiles/${account.profileId}`))).status, 404)
    const session = insertSession(database, accountId)
    const ownProfile = await app.handle(new Request(`http://api.test/v1/profiles/${account.profileId}`, { headers: { cookie: session.cookie } }))
    assert.equal(ownProfile.status, 200)
    assert.equal((await ownProfile.json() as { ownProfile: boolean }).ownProfile, true)
  })

  it('publishes non-logged-in wipes only as generic anonymous activity', async () => {
    const app = createApp(database, config)
    const recorded = await app.handle(new Request('http://api.test/v1/wipes', {
      method: 'POST',
      headers: { origin: config.trainerOrigin, 'content-type': 'application/json' },
      body: JSON.stringify({ phase: 'Intermission', difficulty: 'hard', reason: 'Hit by Starsplinter', trainerVersion: '0.5.1' }),
    }))
    assert.equal(recorded.status, 201)
    const feed = await app.handle(new Request('http://api.test/v1/activity?limit=20'))
    const rows = (await feed.json() as { rows: Array<{ displayName: string; character: null; realm: null; region: null }> }).rows
    assert.equal(rows[0].displayName, 'Anonymous')
    assert.equal(rows[0].character, null)
    assert.equal(rows[0].realm, null)
    assert.equal(rows[0].region, null)
  })

  it('never downgrades stale authenticated wipe submissions to anonymous activity', async () => {
    const app = createApp(database, config)
    const stale = await app.handle(new Request('http://api.test/v1/wipes', {
      method: 'POST',
      headers: {
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': 'expired-session-csrf',
      },
      body: JSON.stringify({
        phase: 'Phase 1',
        difficulty: 'hard',
        reason: 'Missed assigned interrupt',
        trainerVersion: '0.6.1',
      }),
    }))
    assert.equal(stale.status, 401)
    assert.deepEqual(await stale.json(), { error: 'not_authenticated' })
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM anonymous_wipe_events').get()!.count, 0)
  })

  it('requires an active character for authenticated wipe submissions', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'unselected-wipe', character: 'Nochoice', realm: 'blackrock',
      mode: 'character', score: 100, duration: 500_000,
      acceptedAt: '2026-07-27T00:00:00.000Z',
    })
    const session = insertSession(database, accountId)
    const app = createApp(database, config)
    const response = await app.handle(new Request('http://api.test/v1/wipes', {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({
        phase: 'Phase 2',
        difficulty: 'normal',
        reason: 'Hit by a boss beam',
        trainerVersion: '0.6.1',
      }),
    }))
    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), { error: 'character_required' })
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM anonymous_wipe_events').get()!.count, 0)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM wipe_events').get()!.count, 0)
  })

  it('cascades complete account deletion through attempts and public results', () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'delete-me', character: 'Gone', realm: 'draenor',
      mode: 'character', score: 1000, duration: 80_000,
      acceptedAt: '2026-07-28T00:02:00.000Z',
    })
    database.prepare('DELETE FROM accounts WHERE id = ?').run(accountId)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM characters').get()!.count, 0)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM attempts').get()!.count, 0)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM results').get()!.count, 0)
  })

  it('completes Battle.net OAuth without retaining the provider token', async () => {
    const requests: Array<{ url: string; authorization: string | null }> = []
    const tokens = ['oauth-state', 'application-session']
    const dependencies: AuthDependencies = {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => tokens.shift()!,
      fetch: async (input, init) => {
        const url = String(input)
        requests.push({
          url,
          authorization: new Headers(init?.headers).get('authorization'),
        })
        if (url.endsWith('/oauth/token')) {
          assert.match(String(init?.body), /code=authorization-code/)
          return Response.json({ access_token: 'short-lived-provider-token' })
        }
        if (url.includes('.api.blizzard.com/profile/user/wow')) {
          return Response.json({
            wow_accounts: [{
              characters: [
                {
                  id: 88,
                  name: 'Lurana',
                  realm: { id: 509, slug: 'silvermoon' },
                  playable_class: { name: 'Priest' },
                  faction: { name: 'Alliance' },
                },
                {
                  id: 89,
                  name: 'Altana',
                  realm: { id: 510, slug: 'draenor' },
                  playable_class: { name: 'Mage' },
                  faction: { name: 'Horde' },
                },
              ],
            }],
          })
        }
        if (url.includes('/profile/wow/character/silvermoon/lurana?')) {
          return Response.json({
            id: 88,
            name: 'Lurana',
            playable_class: { name: 'Priest' },
            faction: { name: 'Alliance' },
            guild: { id: 7, name: 'Milestone', realm: { name: 'Silvermoon' } },
          })
        }
        return Response.json({ id: 4242 })
      },
    }
    const app = createApp(database, config, dependencies)
    const start = await app.handle(new Request('http://api.test/v1/auth/battlenet/start?region=us'))
    assert.equal(start.status, 302)
    const authorization = new URL(start.headers.get('location')!)
    assert.equal(authorization.origin, 'https://us.battle.net')
    assert.equal(authorization.searchParams.get('scope'), 'wow.profile')
    assert.equal(authorization.searchParams.get('state'), 'oauth-state')

    const callback = await app.handle(new Request(
      'http://api.test/v1/auth/battlenet/callback?code=authorization-code&state=oauth-state',
    ))
    assert.equal(callback.status, 302)
    assert.equal(callback.headers.get('location'), 'https://trainer.example/?online=connected')
    const setCookie = callback.headers.get('set-cookie')!
    assert.match(setCookie, /^lura_session=/)
    assert.match(setCookie, /HttpOnly/)
    assert.match(setCookie, /Secure/)
    assert.equal(requests[0].authorization, `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`)
    assert.equal(requests[1].authorization, 'Bearer short-lived-provider-token')
    assert.equal(requests[2].authorization, 'Bearer short-lived-provider-token')
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM accounts').get()!.count, 1)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM sessions').get()!.count, 1)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM oauth_states').get()!.count, 0)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM characters').get()!.count, 2)
    assert.equal(JSON.stringify(database.prepare('SELECT * FROM sessions').get()).includes('provider-token'), false)

    const cookie = setCookie.split(';', 1)[0]
    const me = await app.handle(new Request('http://api.test/v1/me', { headers: { cookie } }))
    assert.equal(me.status, 200)
    const profile = await me.json() as { authenticated: boolean; region: string; csrfToken: string; achievementSyncKey: string }
    assert.equal(profile.authenticated, true)
    assert.equal(profile.region, 'us')
    assert.ok(profile.csrfToken)
    assert.match(profile.achievementSyncKey, /^[0-9a-f]{24}$/)

    const characters = await app.handle(new Request('http://api.test/v1/me/characters', { headers: { cookie } }))
    assert.equal(characters.status, 200)
    const characterRows = (await characters.json() as {
      rows: Array<{ id: number; name: string; guildName: string | null; selected: number }>
    }).rows
    assert.deepEqual(characterRows.map(row => row.name), ['Altana', 'Lurana'])
    assert.equal(characterRows[1].guildName, 'Milestone')
    assert.equal(characterRows[1].selected, 0)

    const selection = await app.handle(new Request('http://api.test/v1/me/character', {
      method: 'PUT',
      headers: {
        cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': profile.csrfToken,
      },
      body: JSON.stringify({ characterId: characterRows[1].id }),
    }))
    assert.equal(selection.status, 200)
    assert.deepEqual(await selection.json(), { selectedCharacterId: characterRows[1].id })

    const rejectedLogout = await app.handle(new Request('http://api.test/v1/auth/logout', {
      method: 'POST',
      headers: { cookie, origin: config.trainerOrigin, 'x-csrf-token': 'wrong' },
    }))
    assert.equal(rejectedLogout.status, 403)
    insertSession(database, 1, 'second-device-session')
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM sessions').get()!.count, 2)
    const logout = await app.handle(new Request('http://api.test/v1/auth/logout', {
      method: 'POST',
      headers: { cookie, origin: config.trainerOrigin, 'x-csrf-token': profile.csrfToken },
    }))
    assert.equal(logout.status, 200)
    assert.match(logout.headers.get('set-cookie')!, /Max-Age=0/)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM sessions').get()!.count, 0)
  })

  it('rejects expired or replayed OAuth state before exchanging a code', async () => {
    let now = new Date('2026-07-28T12:00:00.000Z')
    let exchanges = 0
    const dependencies: AuthDependencies = {
      now: () => now,
      randomToken: () => 'one-use-state',
      fetch: async () => {
        exchanges += 1
        return Response.json({ access_token: 'unused' })
      },
    }
    const app = createApp(database, config, dependencies)
    await app.handle(new Request('http://api.test/v1/auth/battlenet/start?region=eu'))
    now = new Date('2026-07-28T12:11:00.000Z')
    const expired = await app.handle(new Request(
      'http://api.test/v1/auth/battlenet/callback?code=x&state=one-use-state',
    ))
    assert.equal(expired.status, 400)
    assert.deepEqual(await expired.json(), { error: 'invalid_oauth_state' })
    assert.equal(exchanges, 0)
  })

  it('reports Battle.net login unavailable while deployment placeholders remain', async () => {
    const app = createApp(database, {
      ...config,
      battleNetClientId: 'replace-me',
      battleNetClientSecret: 'replace-me',
    })
    const response = await app.handle(new Request(
      'http://api.test/v1/auth/battlenet/start?region=eu',
    ))
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'battle_net_not_configured' })
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM oauth_states').get()!.count, 0)
  })

  it('rate limits repeated authentication starts by forwarded client address', async () => {
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => randomUUID(),
      fetch: globalThis.fetch,
    })
    let response!: Response
    for (let index = 0; index < 11; index += 1) {
      response = await app.handle(new Request(
        'http://api.test/v1/auth/battlenet/start?region=eu',
        { headers: { 'x-forwarded-for': '192.0.2.8' } },
      ))
    }
    assert.equal(response.status, 429)
    assert.deepEqual(await response.json(), { error: 'rate_limited' })
    assert.equal(response.headers.get('retry-after'), '600')
  })

  it('rate limits repeated attempt issuance by forwarded client address', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'attempt-rate-limit', character: 'Limiter', realm: 'silvermoon',
      mode: 'character', score: 500, duration: 500_000,
      acceptedAt: '2026-07-27T00:00:00.000Z',
    })
    const selected = database.prepare('SELECT id FROM characters WHERE account_id = ?')
      .get(accountId) as { id: number }
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?')
      .run(selected.id, accountId)
    const session = insertSession(database, accountId, 'attempt-rate-session')
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => randomUUID(),
      fetch: globalThis.fetch,
    })
    const headers = {
      cookie: session.cookie,
      origin: config.trainerOrigin,
      'content-type': 'application/json',
      'x-csrf-token': session.csrf,
      'x-forwarded-for': '192.0.2.9',
    }
    let response!: Response
    for (let index = 0; index < 10; index += 1) {
      response = await app.handle(new Request('http://api.test/v1/attempts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          difficulty: 'hard',
          duty: 'non-crystal',
          entryMode: 'arena4',
          phaseScope: 'p4',
          trainerVersion: '0.3.0',
          buildId: 'rate-build',
          configurationFingerprint: 'rate-config',
          optionalChallenges: [],
        }),
      }))
      assert.equal(response.status, 201)
    }
    response = await app.handle(new Request('http://api.test/v1/attempts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        difficulty: 'hard',
        duty: 'non-crystal',
        entryMode: 'arena4',
        phaseScope: 'p4',
        trainerVersion: '0.3.0',
        buildId: 'rate-build',
        configurationFingerprint: 'rate-config',
        optionalChallenges: [],
      }),
    }))
    assert.equal(response.status, 429)
    assert.deepEqual(await response.json(), { error: 'rate_limited' })
    assert.equal(response.headers.get('retry-after'), '60')
  })

  it('prevents selecting another account character', async () => {
    const ownerId = insertResult(database, {
      region: 'eu', account: 'owner', character: 'Owner', realm: 'draenor',
      mode: 'anonymous', score: 100, duration: 100_000,
      acceptedAt: '2026-07-28T00:00:00.000Z',
    })
    const otherId = insertResult(database, {
      region: 'eu', account: 'other', character: 'Other', realm: 'silvermoon',
      mode: 'anonymous', score: 90, duration: 110_000,
      acceptedAt: '2026-07-28T00:01:00.000Z',
    })
    const session = insertSession(database, ownerId)
    const otherCharacter = database.prepare(
      'SELECT id FROM characters WHERE account_id = ?',
    ).get(otherId) as { id: number }
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => 'unused',
      fetch: globalThis.fetch,
    })
    const response = await app.handle(new Request('http://api.test/v1/me/character', {
      method: 'PUT',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({ characterId: otherCharacter.id }),
    }))
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'invalid_character' })
    const refresh = await app.handle(new Request('http://api.test/v1/me/characters/refresh', {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'x-csrf-token': session.csrf,
      },
    }))
    assert.equal(refresh.status, 200)
    const refreshBody = await refresh.json() as {
      reauthenticationRequired: boolean
      authorizationUrl: string
    }
    assert.equal(refreshBody.reauthenticationRequired, true)
    assert.match(refreshBody.authorizationUrl, /^https:\/\/eu\.battle\.net\/oauth\/authorize\?/)
  })

  it('enforces privacy visibility and completely deletes account-linked data', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'privacy', character: 'Private', realm: 'draenor',
      guild: 'Secret Guild', mode: 'anonymous', score: 1000, duration: 90_000,
      acceptedAt: '2026-07-28T00:00:00.000Z',
    })
    const session = insertSession(database, accountId)
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => 'unused',
      fetch: globalThis.fetch,
    })
    const me = await app.handle(new Request('http://api.test/v1/me', {
      headers: { cookie: session.cookie },
    }))
    const meBody = await me.json() as {
      standings: Array<{ difficulty: string; duty: string; position: number; score: number }>
    }
    assert.deepEqual(meBody.standings, [])
    const hiddenRows = await app.handle(new Request(
      'http://api.test/v1/leaderboards?difficulty=hard&duty=crystal',
    ))
    assert.deepEqual((await hiddenRows.json() as { rows: unknown[] }).rows, [])
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM results').get()!.count, 1)

    const privacy = await app.handle(new Request('http://api.test/v1/me/privacy', {
      method: 'PUT',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({ identityMode: 'alias', alias: '  Runner  ', showGuild: true }),
    }))
    assert.equal(privacy.status, 200)
    assert.deepEqual(await privacy.json(), {
      identityMode: 'alias', alias: 'Runner', showGuild: true,
    })
    const publicRows = await app.handle(new Request(
      'http://api.test/v1/leaderboards?difficulty=hard&duty=crystal',
    ))
    assert.deepEqual(
      (await publicRows.json() as { rows: Array<{ displayName: string; guild: string }> }).rows
        .map(row => [row.displayName, row.guild]),
      [['Runner', null]],
    )

    const unconfirmed = await app.handle(new Request('http://api.test/v1/me', {
      method: 'DELETE',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({ confirmation: 'no' }),
    }))
    assert.equal(unconfirmed.status, 400)
    const deletion = await app.handle(new Request('http://api.test/v1/me', {
      method: 'DELETE',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({ confirmation: 'DELETE' }),
    }))
    assert.equal(deletion.status, 200)
    assert.match(deletion.headers.get('set-cookie')!, /Max-Age=0/)
    for (const table of ['accounts', 'sessions', 'characters', 'privacy_settings', 'attempts', 'results']) {
      assert.equal(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()!.count, 0, table)
    }
  })

  it('records selected-character wipes and anonymizes them on privacy opt-out', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'wipe-feed', character: 'Wiper', realm: 'blackrock',
      mode: 'character', score: 900, duration: 100_000,
      acceptedAt: '2026-07-28T00:00:00.000Z',
    })
    const character = database.prepare(
      'SELECT id FROM characters WHERE account_id = ?',
    ).get(accountId) as { id: number }
    const publicProfileId = (database.prepare(
      'SELECT public_profile_id AS profileId FROM accounts WHERE id = ?',
    ).get(accountId) as { profileId: string }).profileId
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?')
      .run(character.id, accountId)
    const session = insertSession(database, accountId)
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => 'unused',
      fetch: globalThis.fetch,
    })
    const recorded = await app.handle(new Request('http://api.test/v1/wipes', {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({
        phase: 'Phase 3',
        difficulty: 'normal',
        reason: 'Touched a Stars beam',
        trainerVersion: '0.3.0',
      }),
    }))
    assert.equal(recorded.status, 201)
    const feed = await app.handle(new Request('http://api.test/v1/wipes?limit=20'))
    assert.deepEqual(
      (await feed.json() as { rows: Array<Record<string, unknown>> }).rows.map(row => ({
        profileId: row.profileId,
        displayName: row.displayName,
        character: row.character,
        realm: row.realm,
        region: row.region,
        phase: row.phase,
        difficulty: row.difficulty,
        occurredAt: row.occurredAt,
      })),
      [{
        profileId: publicProfileId,
        displayName: 'Wiper',
        character: 'Wiper',
        realm: 'blackrock',
        region: 'eu',
        phase: 'Phase 3',
        difficulty: 'normal',
        occurredAt: '2026-07-28T12:00:00.000Z',
      }],
    )
    const privacy = await app.handle(new Request('http://api.test/v1/me/privacy', {
      method: 'PUT',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({ identityMode: 'anonymous', alias: '', showGuild: false }),
    }))
    assert.equal(privacy.status, 200)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM wipe_events').get()!.count, 1)
    const anonymous = await app.handle(new Request('http://api.test/v1/wipes'))
    assert.deepEqual(
      (await anonymous.json() as { rows: Array<Record<string, unknown>> }).rows.map(row => ({
        displayName: row.displayName,
        character: row.character,
        realm: row.realm,
        region: row.region,
      })),
      [{ displayName: 'Anonymous', character: null, realm: null, region: null }],
    )
  })

  it('issues one-use attempts and publishes only server-recomputed results', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'online', character: 'Verified', realm: 'silvermoon',
      mode: 'character', score: 500, duration: 500_000,
      acceptedAt: '2026-07-27T00:00:00.000Z',
    })
    const selected = database.prepare('SELECT id FROM characters WHERE account_id = ?')
      .get(accountId) as { id: number }
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?').run(selected.id, accountId)
    const session = insertSession(database, accountId)
    const randomTokens = ['online-attempt', 'online-nonce']
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => randomTokens.shift()!,
      fetch: globalThis.fetch,
    })
    const headers = {
      cookie: session.cookie,
      origin: config.trainerOrigin,
      'content-type': 'application/json',
      'x-csrf-token': session.csrf,
    }
    const issued = await app.handle(new Request('http://api.test/v1/attempts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        difficulty: 'hard',
        duty: 'crystal',
        entryMode: 'arena0',
        phaseScope: 'full',
        trainerVersion: '0.3.0',
        buildId: 'build-online',
        configurationFingerprint: 'raid-plan-sha256',
        optionalChallenges: ['main-ability', 'recovery'],
      }),
    }))
    assert.equal(issued.status, 201)
    const attempt = await issued.json() as { attemptId: string; nonce: string }
    assert.deepEqual(attempt, { ...attempt, attemptId: 'online-attempt', nonce: 'online-nonce' })

    const completion = {
      clientRunId: 'LURA1-0001-0002-0003-0004-0005',
      nonce: attempt.nonce,
      configurationFingerprint: 'raid-plan-sha256',
      optionalChallenges: ['main-ability', 'recovery'],
      durationMs: 300_000,
      phaseResults: ['p1', 'intermission', 'p2', 'p3', 'p4'].map(key => ({
        key, durationMs: 60_000, mistakes: 0, recovery: 'passed',
      })),
      mistakes: [],
      actions: { recoveryPasses: 5, mainAbilityCasts: 220, continuousPenalty: 0 },
      achievementInputs: {
        wipeCount: 0,
        crystalFailures: 0,
        runeFailures: 0,
        pauseCycle: false,
        earlyKill: false,
        p3EarlyClear: false,
      },
      submittedScore: 2020,
      trainerVersion: '0.3.0',
      buildId: 'build-online',
    }
    const tampered = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      {
        method: 'POST',
        headers: { ...headers, 'idempotency-key': attempt.attemptId },
        body: JSON.stringify({ ...completion, submittedScore: 2000 }),
      },
    ))
    assert.equal(tampered.status, 400)
    assert.deepEqual(await tampered.json(), { error: 'score_mismatch' })
    assert.equal(
      database.prepare('SELECT consumed_at AS consumedAt FROM attempts WHERE id = ?')
        .get(attempt.attemptId)!.consumedAt,
      null,
    )
    const impossibleCastRate = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      {
        method: 'POST',
        headers: { ...headers, 'idempotency-key': attempt.attemptId },
        body: JSON.stringify({
          ...completion,
          actions: { ...completion.actions, mainAbilityCasts: 301 },
        }),
      },
    ))
    assert.equal(impossibleCastRate.status, 400)
    assert.deepEqual(await impossibleCastRate.json(), { error: 'invalid_actions' })

    const mismatchedConfiguration = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      {
        method: 'POST',
        headers: { ...headers, 'idempotency-key': attempt.attemptId },
        body: JSON.stringify({ ...completion, configurationFingerprint: 'other-plan' }),
      },
    ))
    assert.equal(mismatchedConfiguration.status, 400)
    assert.deepEqual(await mismatchedConfiguration.json(), { error: 'attempt_configuration_mismatch' })
    assert.equal(
      database.prepare('SELECT consumed_at AS consumedAt FROM attempts WHERE id = ?')
        .get(attempt.attemptId)!.consumedAt,
      null,
    )

    const invalidCapabilityWipe = await app.handle(new Request('http://api.test/v1/wipes', {
      method: 'POST',
      headers: {
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({
        phase: 'Phase 3',
        difficulty: 'hard',
        reason: 'Touched a Stars beam',
        trainerVersion: '0.3.0',
        attemptId: attempt.attemptId,
        nonce: 'wrong-nonce',
      }),
    }))
    assert.equal(invalidCapabilityWipe.status, 401)
    assert.deepEqual(await invalidCapabilityWipe.json(), { error: 'invalid_attempt_capability' })

    const sessionBoundWipe = await app.handle(new Request('http://api.test/v1/wipes', {
      method: 'POST',
      headers: {
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({
        phase: 'Phase 3',
        difficulty: 'hard',
        reason: 'Touched a Stars beam',
        trainerVersion: '0.3.0',
        attemptId: attempt.attemptId,
        nonce: attempt.nonce,
      }),
    }))
    assert.equal(sessionBoundWipe.status, 201)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM wipe_events WHERE account_id = ?').get(accountId)!.count, 1)
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM anonymous_wipe_events').get()!.count, 0)

    const accepted = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      {
        method: 'POST',
        headers: {
          origin: config.trainerOrigin,
          'content-type': 'application/json',
          'idempotency-key': attempt.attemptId,
        },
        body: JSON.stringify(completion),
      },
    ))
    assert.equal(accepted.status, 200)
    const acceptedBody = await accepted.json() as {
      accepted: true
      score: number
      acceptedAt: string
      clientRunId: string
      achievementIds: string[]
    }
    assert.equal(acceptedBody.score, 2020)
    assert.equal(acceptedBody.clientRunId, completion.clientRunId)
    assert.equal(
      database.prepare('SELECT client_run_id AS clientRunId FROM attempt_summaries WHERE attempt_id = ?')
        .get(attempt.attemptId)!.clientRunId,
      completion.clientRunId,
    )
    assert.ok(acceptedBody.achievementIds.includes('hard-score-flawless'))
    const activity = await app.handle(new Request('http://api.test/v1/activity?limit=100'))
    const activityRows = (await activity.json() as {
      rows: Array<{ type: string; displayName: string; achievementTitle: string; occurredAt: string; score: number | null; durationMs: number | null; duty: string | null }>
    }).rows
    const achievementActivity = activityRows.filter(row => row.type === 'achievement')
    assert.ok(achievementActivity.some(row => (
      row.displayName === 'Verified'
      && row.achievementTitle === 'The Midnight Shift'
      && row.occurredAt === '2026-07-28T12:00:00.000Z'
    )))
    assert.equal(
      database.prepare('SELECT COUNT(*) AS count FROM achievement_events').get()!.count,
      achievementActivity.length,
    )
    assert.deepEqual(
      activityRows.find(row => row.type === 'completion'),
      {
        ...activityRows.find(row => row.type === 'completion'),
        type: 'completion',
        displayName: 'Verified',
        score: 2020,
        durationMs: 300_000,
        duty: 'crystal',
        occurredAt: '2026-07-28T12:00:00.000Z',
      },
    )
    const duplicate = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      {
        method: 'POST',
        headers: { ...headers, 'idempotency-key': attempt.attemptId },
        body: JSON.stringify(completion),
      },
    ))
    assert.equal(duplicate.status, 200)
    assert.deepEqual(await duplicate.json(), acceptedBody)
    const conflictingRetry = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      {
        method: 'POST',
        headers: { ...headers, 'idempotency-key': attempt.attemptId },
        body: JSON.stringify({ ...completion, submittedScore: 2000 }),
      },
    ))
    assert.equal(conflictingRetry.status, 409)
    assert.deepEqual(await conflictingRetry.json(), { error: 'idempotency_conflict' })

    const board = await app.handle(new Request(
      'http://api.test/v1/leaderboards?difficulty=hard&duty=crystal',
    ))
    const rows = (await board.json() as { rows: Array<{ score: number; displayName: string }> }).rows
    assert.deepEqual(rows[0], { ...rows[0], score: 2020, displayName: 'Verified' })
    const achievements = await app.handle(new Request(
      'http://api.test/v1/me/achievements',
      { headers: { cookie: session.cookie } },
    ))
    assert.equal(achievements.status, 200)
    const achievementBody = await achievements.json() as {
      rows: Array<{ achievementId: string; buildId: string }>
      progress: { phaseClears: number; duties: string[]; flawlessStreaks: { hard: number } }
    }
    const achievementRows = achievementBody.rows
    assert.ok(achievementRows.some(row => (
      row.achievementId === 'hard-score-flawless' && row.buildId === 'build-online'
    )))
    assert.deepEqual(achievementBody.progress, {
      phaseClears: 5,
      duties: ['crystal'],
      superhumanDuties: ['crystal'],
      flawlessStreaks: { normal: 0, hard: 1 },
    })
    const hall = await app.handle(new Request('http://api.test/v1/achievement-hall', {
      headers: { cookie: session.cookie },
    }))
    assert.equal(hall.status, 200)
    const hallBody = await hall.json() as {
      rows: Array<{ displayName: string; totalPoints: number; highestAchievement: { points: number } }>
      own: { rank: number; displayName: string }
    }
    assert.equal(hallBody.rows[0].displayName, 'Verified')
    assert.ok(hallBody.rows[0].totalPoints >= 200)
    assert.equal(hallBody.rows[0].highestAchievement.points, 100)
    assert.deepEqual(hallBody.own, { ...hallBody.own, rank: 1, displayName: 'Verified' })
  })

  it('awards Phase 4-only achievement points without admitting the partial run to a run board', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'p4-achievements', character: 'Quartermaster', realm: 'silvermoon',
      mode: 'character', score: 500, duration: 500_000,
      acceptedAt: '2026-07-27T00:00:00.000Z',
    })
    const selected = database.prepare('SELECT id FROM characters WHERE account_id = ?').get(accountId) as { id: number }
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?').run(selected.id, accountId)
    const session = insertSession(database, accountId, 'p4-session')
    const tokens = ['p4-attempt', 'p4-nonce']
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => tokens.shift()!,
      fetch: globalThis.fetch,
    })
    const headers = {
      cookie: session.cookie,
      origin: config.trainerOrigin,
      'content-type': 'application/json',
      'x-csrf-token': session.csrf,
    }
    const issued = await app.handle(new Request('http://api.test/v1/attempts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        difficulty: 'hard', duty: 'non-crystal', entryMode: 'arena4', phaseScope: 'p4',
        trainerVersion: '0.3.0', buildId: 'p4-build', configurationFingerprint: 'p4-config',
        optionalChallenges: [],
      }),
    }))
    assert.equal(issued.status, 201)
    const attempt = await issued.json() as { attemptId: string; nonce: string }
    const accepted = await app.handle(new Request(`http://api.test/v1/attempts/${attempt.attemptId}/complete`, {
      method: 'POST',
      headers: { ...headers, 'idempotency-key': attempt.attemptId },
      body: JSON.stringify({
        clientRunId: 'LURA1-1001-1002-1003-1004-1005',
        nonce: attempt.nonce,
        configurationFingerprint: 'p4-config',
        optionalChallenges: [],
        durationMs: 88_000,
        phaseResults: [{ key: 'p4', durationMs: 88_000, mistakes: 0, recovery: 'missed' }],
        mistakes: [],
        actions: { recoveryPasses: 0, mainAbilityCasts: 0, continuousPenalty: 0 },
        achievementInputs: {
          wipeCount: 0, crystalFailures: 0, runeFailures: 0, pauseCycle: false,
          earlyKill: false, p3EarlyClear: false, tankRole: true, tankCrystalRole: false,
          p4ConeTankRole: true, p4ProtectionTankRole: false,
        },
        submittedScore: 1000,
        trainerVersion: '0.3.0',
        buildId: 'p4-build',
      }),
    }))
    assert.equal(accepted.status, 200)
    const achievementIds = ((await accepted.json()) as { achievementIds: string[] }).achievementIds
    assert.ok(achievementIds.includes('one-phase-wonder'))
    assert.ok(achievementIds.includes('flawless-p4'))
    assert.ok(achievementIds.includes('heavens-lance-warden'))
    assert.ok(achievementIds.includes('p4-frontal-tank'))
    assert.ok(!achievementIds.includes('p4-protection-tank'))
    assert.ok(!achievementIds.includes('dawnforged-vanguard'))
    assert.ok(!achievementIds.includes('midnight-shift'))
    assert.ok(!achievementIds.includes('hard-score-flawless'))
    assert.ok(!achievementIds.includes('crystal-clear-conscience'))
    const board = await app.handle(new Request('http://api.test/v1/leaderboards?difficulty=hard&duty=non-crystal'))
    assert.equal((await board.json() as { rows: unknown[] }).rows.length, 0)
    const hall = await app.handle(new Request('http://api.test/v1/achievement-hall'))
    const hallRows = (await hall.json() as { rows: Array<{ displayName: string; totalPoints: number }> }).rows
    assert.ok(hallRows.some(row => row.displayName === 'Quartermaster' && row.totalPoints >= 50))
  })

  it('counts actual direct-phase clears without admitting them to full-run aggregate feats', () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'direct-aggregate', character: 'Specialist', realm: 'silvermoon',
      mode: 'character', score: 1000, duration: 88_000,
      acceptedAt: '2026-07-28T00:00:00.000Z',
    })
    const firstAttempt = 'attempt-direct-aggregate'
    database.prepare('UPDATE results SET run_eligible = 0 WHERE attempt_id = ?').run(firstAttempt)
    const secondAttempt = insertAdditionalResult(
      database,
      accountId,
      'direct-aggregate-second',
      1000,
      88_000,
      '2026-07-28T00:01:00.000Z',
    )
    database.prepare('UPDATE results SET run_eligible = 0 WHERE attempt_id = ?').run(secondAttempt)
    for (const attemptId of [firstAttempt, secondAttempt]) {
      database.prepare(`
        INSERT INTO attempt_summaries (
          attempt_id, duration_ms, phase_results_json, mistakes_json, actions_json,
          accepted_score, submitted_score, accepted_at
        ) VALUES (?, 88000, ?, '[]', ?, 1000, 1000, '2026-07-28T00:01:00.000Z')
      `).run(
        attemptId,
        JSON.stringify([{ key: 'p4', durationMs: 88_000, mistakes: 0, recovery: 'passed' }]),
        JSON.stringify({ recoveryPasses: 1, mainAbilityCasts: 1, continuousPenalty: 0 }),
      )
    }
    assert.deepEqual(aggregateAchievementIds(database, accountId), [])
  })

  it('stores each canonical achievement only once per account across builds', () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'achievement-once', character: 'First', realm: 'silvermoon',
      mode: 'character', score: 1000, duration: 88_000,
      acceptedAt: '2026-07-28T00:00:00.000Z',
    })
    const characterId = Number((database.prepare(
      'SELECT id FROM characters WHERE account_id = ?',
    ).get(accountId) as { id: number }).id)
    for (const version of ['0.3.0', '0.4.0']) {
      database.prepare(`
        INSERT OR REPLACE INTO achievements (
          id, trainer_version, title, currently_obtainable
        ) VALUES ('rank-one-hard-crystal', ?, 'Crown', 1)
      `).run(version)
      database.prepare(`
        INSERT OR IGNORE INTO account_achievements (
          account_id, character_id, achievement_id, trainer_version, build_id,
          source_attempt_id, first_earned_at
        ) VALUES (?, ?, 'rank-one-hard-crystal', ?, ?, 'attempt-achievement-once',
          '2026-07-28T00:00:00.000Z')
      `).run(accountId, characterId, version, `build-${version}`)
    }
    assert.equal(
      database.prepare(`
        SELECT COUNT(*) AS count FROM account_achievements
        WHERE account_id = ? AND achievement_id = 'rank-one-hard-crystal'
      `).get(accountId)!.count,
      1,
    )
  })

  it('keeps verified Easy results out of run rankings while awarding Hall points', async () => {
    const accountId = insertResult(database, {
      region: 'eu', account: 'easy-hall', character: 'Learner', realm: 'silvermoon',
      mode: 'character', score: 500, duration: 500_000,
      acceptedAt: '2026-07-27T00:00:00.000Z',
    })
    const selected = database.prepare('SELECT id FROM characters WHERE account_id = ?').get(accountId) as { id: number }
    database.prepare('UPDATE accounts SET selected_character_id = ? WHERE id = ?').run(selected.id, accountId)
    const session = insertSession(database, accountId, 'easy-session')
    const tokens = ['easy-attempt', 'easy-nonce']
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => tokens.shift()!,
      fetch: globalThis.fetch,
    })
    const headers = {
      cookie: session.cookie,
      origin: config.trainerOrigin,
      'content-type': 'application/json',
      'x-csrf-token': session.csrf,
    }
    const issued = await app.handle(new Request('http://api.test/v1/attempts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        difficulty: 'easy', duty: 'non-crystal', entryMode: 'arena0', phaseScope: 'full',
        trainerVersion: '0.3.0', buildId: 'easy-build', configurationFingerprint: 'easy-config',
        optionalChallenges: [],
      }),
    }))
    const attempt = await issued.json() as { attemptId: string; nonce: string }
    const accepted = await app.handle(new Request(`http://api.test/v1/attempts/${attempt.attemptId}/complete`, {
      method: 'POST',
      headers: { ...headers, 'idempotency-key': attempt.attemptId },
      body: JSON.stringify({
        clientRunId: 'LURA1-2001-2002-2003-2004-2005',
        nonce: attempt.nonce,
        configurationFingerprint: 'easy-config',
        optionalChallenges: [],
        durationMs: 300_000,
        phaseResults: ['p1', 'intermission', 'p2', 'p3', 'p4'].map(key => ({
          key, durationMs: 60_000, mistakes: 0, recovery: 'missed',
        })),
        mistakes: [],
        actions: { recoveryPasses: 0, mainAbilityCasts: 0, continuousPenalty: 0 },
        achievementInputs: {
          wipeCount: 0, crystalFailures: 0, runeFailures: 0, pauseCycle: false,
          earlyKill: false, p3EarlyClear: false,
        },
        submittedScore: 1000,
        trainerVersion: '0.3.0',
        buildId: 'easy-build',
      }),
    }))
    assert.equal(accepted.status, 200)
    assert.ok(((await accepted.json()) as { achievementIds: string[] }).achievementIds.includes('easy-does-it'))
    const board = await app.handle(new Request('http://api.test/v1/leaderboards?difficulty=normal&duty=non-crystal'))
    assert.equal((await board.json() as { rows: unknown[] }).rows.length, 0)
    const hall = await app.handle(new Request('http://api.test/v1/achievement-hall'))
    assert.equal((await hall.json() as { rows: Array<{ displayName: string }> }).rows[0].displayName, 'Learner')
  })

  it('requires a selected verified character before issuing an attempt', async () => {
    const accountId = insertResult(database, {
      region: 'us', account: 'unselected', character: 'Unselected', realm: 'illidan',
      mode: 'anonymous', score: 100, duration: 500_000,
      acceptedAt: '2026-07-27T00:00:00.000Z',
    })
    const session = insertSession(database, accountId)
    const app = createApp(database, config, {
      now: () => new Date('2026-07-28T12:00:00.000Z'),
      randomToken: () => 'unused',
      fetch: globalThis.fetch,
    })
    const response = await app.handle(new Request('http://api.test/v1/attempts', {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': session.csrf,
      },
      body: JSON.stringify({
        difficulty: 'normal',
        duty: 'non-crystal',
        entryMode: 'arena0',
        phaseScope: 'full',
        trainerVersion: '0.3.0',
        buildId: 'build',
        configurationFingerprint: 'config',
        optionalChallenges: [],
      }),
    }))
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'character_required' })
  })
})
