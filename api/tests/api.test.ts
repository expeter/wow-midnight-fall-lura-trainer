import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { resolve } from 'node:path'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { createApp } from '../src/app.js'
import type { ApiConfig } from '../src/config.js'
import { applyMigrations, openDatabase, type Database } from '../src/database.js'
import { isDatabaseBusyError } from '../src/http.js'
import type { AuthDependencies } from '../src/auth.js'

const config: ApiConfig = {
  host: '127.0.0.1',
  port: 0,
  databasePath: ':memory:',
  trainerOrigin: 'https://trainer.example',
  localOrigins: ['http://127.0.0.1:5173'],
  currentTrainerVersion: '0.3.0',
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
    '2026-07-29T00:00:00.000Z',
    '2026-07-28T00:00:00.000Z',
  )
  return { cookie: `lura_session=${token}`, csrf }
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
    assert.deepEqual(await response.json(), { status: 'ok' })
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
    insertResult(database, {
      region: 'eu', account: '1', character: 'Aegis', realm: 'silvermoon',
      mode: 'character', score: 1200, duration: 90_000, acceptedAt: '2026-07-28T00:03:00.000Z',
    })
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
    const rows = (await visible.json() as { rows: Array<{ displayName: string; character: null; guild: string }> }).rows
    assert.deepEqual(rows, [{ ...rows[0], displayName: 'Runner', character: null, guild: 'Milestone' }])
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
    const profile = await me.json() as { authenticated: boolean; region: string; csrfToken: string }
    assert.equal(profile.authenticated, true)
    assert.equal(profile.region, 'us')
    assert.ok(profile.csrfToken)

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
    assert.deepEqual(meBody.standings, [{
      difficulty: 'hard', duty: 'crystal', score: 1000, durationMs: 90_000, position: 1,
    }])
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
      [['Runner', 'Secret Guild']],
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
      nonce: attempt.nonce,
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
      { method: 'POST', headers, body: JSON.stringify({ ...completion, submittedScore: 2000 }) },
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
        headers,
        body: JSON.stringify({
          ...completion,
          actions: { ...completion.actions, mainAbilityCasts: 301 },
        }),
      },
    ))
    assert.equal(impossibleCastRate.status, 400)
    assert.deepEqual(await impossibleCastRate.json(), { error: 'invalid_actions' })

    const accepted = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      { method: 'POST', headers, body: JSON.stringify(completion) },
    ))
    assert.equal(accepted.status, 200)
    const acceptedBody = await accepted.json() as { score: number; achievementIds: string[] }
    assert.equal(acceptedBody.score, 2020)
    assert.ok(acceptedBody.achievementIds.includes('hard-score-flawless'))
    const duplicate = await app.handle(new Request(
      `http://api.test/v1/attempts/${attempt.attemptId}/complete`,
      { method: 'POST', headers, body: JSON.stringify(completion) },
    ))
    assert.equal(duplicate.status, 409)
    assert.deepEqual(await duplicate.json(), { error: 'attempt_already_used' })

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
    const achievementRows = (await achievements.json() as {
      rows: Array<{ achievementId: string; buildId: string }>
    }).rows
    assert.ok(achievementRows.some(row => (
      row.achievementId === 'hard-score-flawless' && row.buildId === 'build-online'
    )))
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
      headers,
      body: JSON.stringify({
        nonce: attempt.nonce,
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
