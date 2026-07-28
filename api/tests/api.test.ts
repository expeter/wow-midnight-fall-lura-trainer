import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { resolve } from 'node:path'
import { createApp } from '../src/app.js'
import type { ApiConfig } from '../src/config.js'
import { applyMigrations, openDatabase, type Database } from '../src/database.js'

const config: ApiConfig = {
  host: '127.0.0.1',
  port: 0,
  databasePath: ':memory:',
  trainerOrigin: 'https://trainer.example',
  localOrigins: ['http://127.0.0.1:5173'],
  currentTrainerVersion: '0.3.0',
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
})
