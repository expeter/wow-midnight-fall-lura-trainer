import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { resolve } from 'node:path'
import { createApp } from '../src/app.js'
import type { ApiConfig } from '../src/config.js'
import { applyMigrations, openDatabase, type Database } from '../src/database.js'
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
    assert.deepEqual(payload.rows.map(row => row.displayName), ['Beacon', 'Aegis', 'Anonymous'])
    assert.deepEqual(payload.rows.map(row => row.realm), ['illidan', 'silvermoon', null])
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
                  guild: { id: 7, name: 'Milestone', realm: { name: 'Silvermoon' } },
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
    const sessionToken = 'owned-session'
    const { createHmac, createHash } = await import('node:crypto')
    const csrf = createHmac('sha256', config.csrfSecret).update(sessionToken).digest('hex')
    database.prepare(`
      INSERT INTO sessions (id_hash, account_id, csrf_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      createHmac('sha256', config.sessionSecret).update(sessionToken).digest('hex'),
      ownerId,
      createHash('sha256').update(csrf).digest('hex'),
      '2026-07-29T00:00:00.000Z',
      '2026-07-28T00:00:00.000Z',
    )
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
        cookie: `lura_session=${sessionToken}`,
        origin: config.trainerOrigin,
        'content-type': 'application/json',
        'x-csrf-token': csrf,
      },
      body: JSON.stringify({ characterId: otherCharacter.id }),
    }))
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'invalid_character' })
  })
})
