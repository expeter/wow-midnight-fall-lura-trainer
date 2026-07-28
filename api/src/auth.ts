import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ApiConfig } from './config.js'
import type { Database } from './database.js'

export type BattleNetRegion = 'eu' | 'us'

export interface AuthDependencies {
  fetch: typeof fetch
  now: () => Date
  randomToken: () => string
}

export const defaultAuthDependencies: AuthDependencies = {
  fetch: globalThis.fetch,
  now: () => new Date(),
  randomToken: () => randomBytes(32).toString('base64url'),
}

function configured(value: string): boolean {
  return Boolean(value && !value.startsWith('replace-'))
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function keyedHash(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function cookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}

export function issueOAuthState(
  database: Database,
  config: ApiConfig,
  dependencies: AuthDependencies,
  region: BattleNetRegion,
): URL {
  if (
    !configured(config.battleNetClientId)
    || !configured(config.battleNetClientSecret)
    || config.sessionSecret.length < 32
    || config.csrfSecret.length < 32
  ) {
    throw new Error('battle_net_not_configured')
  }
  const state = dependencies.randomToken()
  const issuedAt = dependencies.now()
  const expiresAt = new Date(issuedAt.getTime() + 10 * 60_000)
  database.prepare('DELETE FROM oauth_states WHERE expires_at <= ?').run(issuedAt.toISOString())
  database.prepare(`
    INSERT INTO oauth_states (state_hash, region, return_to, issued_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(hash(state), region, config.trainerOrigin, issuedAt.toISOString(), expiresAt.toISOString())
  const url = new URL(`https://${region}.battle.net/oauth/authorize`)
  url.searchParams.set('client_id', config.battleNetClientId)
  url.searchParams.set('redirect_uri', config.battleNetCallbackUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'wow.profile')
  url.searchParams.set('state', state)
  return url
}

interface OAuthToken {
  access_token?: string
}

interface UserInfo {
  id?: number | string
  sub?: number | string
}

interface AccountProfile {
  wow_accounts?: Array<{
    characters?: Array<{
      id?: number | string
      name?: string
      realm?: { id?: number | string; slug?: string }
      playable_class?: { name?: string }
      faction?: { name?: string; type?: string }
      guild?: { id?: number | string; name?: string; realm?: { name?: string; slug?: string } }
    }>
  }>
}

interface CharacterProfile {
  id?: number | string
  name?: string
  playable_class?: { name?: string }
  faction?: { name?: string; type?: string }
  guild?: { id?: number | string; name?: string; realm?: { name?: string; slug?: string } }
}

export async function completeOAuth(
  database: Database,
  config: ApiConfig,
  dependencies: AuthDependencies,
  code: string,
  state: string,
): Promise<{ cookie: string; redirect: string }> {
  const now = dependencies.now()
  const stateRow = database.prepare(`
    SELECT region, return_to AS returnTo, expires_at AS expiresAt
    FROM oauth_states WHERE state_hash = ?
  `).get(hash(state)) as { region: BattleNetRegion; returnTo: string; expiresAt: string } | undefined
  if (!stateRow || stateRow.expiresAt <= now.toISOString()) throw new Error('invalid_oauth_state')
  database.prepare('DELETE FROM oauth_states WHERE state_hash = ?').run(hash(state))

  const tokenResponse = await dependencies.fetch(`https://${stateRow.region}.battle.net/oauth/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${config.battleNetClientId}:${config.battleNetClientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      redirect_uri: config.battleNetCallbackUrl,
      code,
    }),
  })
  if (!tokenResponse.ok) throw new Error('oauth_exchange_failed')
  const token = await tokenResponse.json() as OAuthToken
  if (!token.access_token) throw new Error('oauth_exchange_failed')

  const userResponse = await dependencies.fetch(`https://${stateRow.region}.battle.net/oauth/userinfo`, {
    headers: { authorization: `Bearer ${token.access_token}` },
  })
  if (!userResponse.ok) throw new Error('oauth_identity_failed')
  const user = await userResponse.json() as UserInfo
  const providerId = String(user.id ?? user.sub ?? '')
  if (!providerId) throw new Error('oauth_identity_failed')

  const profileResponse = await dependencies.fetch(
    `https://${stateRow.region}.api.blizzard.com/profile/user/wow?namespace=profile-${stateRow.region}&locale=en_US`,
    { headers: { authorization: `Bearer ${token.access_token}` } },
  )
  if (!profileResponse.ok) throw new Error('oauth_profile_failed')
  const profile = await profileResponse.json() as AccountProfile
  const characters = (profile.wow_accounts ?? [])
    .flatMap(account => account.characters ?? [])
    .filter(character => (
      character.id !== undefined
      && character.name
      && character.realm?.id !== undefined
      && character.realm.slug
    ))
  const detailedCharacters = new Map<string, CharacterProfile>()
  await Promise.all(characters.slice(0, 50).map(async character => {
    try {
      const detailResponse = await dependencies.fetch(
        `https://${stateRow.region}.api.blizzard.com/profile/wow/character/${encodeURIComponent(character.realm!.slug!)}/${encodeURIComponent(character.name!.toLowerCase())}?namespace=profile-${stateRow.region}&locale=en_US`,
        { headers: { authorization: `Bearer ${token.access_token}` } },
      )
      if (!detailResponse.ok) return
      const detail = await detailResponse.json() as CharacterProfile
      detailedCharacters.set(String(character.id), detail)
    } catch {
      // Character detail is optional enrichment; the verified account roster
      // remains authoritative when an individual profile is unavailable.
    }
  }))

  database.exec('BEGIN IMMEDIATE')
  try {
    database.prepare(`
      INSERT INTO accounts (battle_net_region, battle_net_account_id, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (battle_net_region, battle_net_account_id)
      DO UPDATE SET updated_at = excluded.updated_at
    `).run(stateRow.region, providerId, now.toISOString(), now.toISOString())
    const account = database.prepare(`
      SELECT id FROM accounts WHERE battle_net_region = ? AND battle_net_account_id = ?
    `).get(stateRow.region, providerId) as { id: number }
    database.prepare(`
      INSERT INTO privacy_settings (account_id, updated_at) VALUES (?, ?)
      ON CONFLICT (account_id) DO NOTHING
    `).run(account.id, now.toISOString())
    const upsertCharacter = database.prepare(`
      INSERT INTO characters (
        account_id, region, character_id, realm_id, realm_slug, name,
        class_name, faction, guild_id, guild_name, guild_realm, refreshed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (region, character_id) DO UPDATE SET
        account_id = excluded.account_id,
        realm_id = excluded.realm_id,
        realm_slug = excluded.realm_slug,
        name = excluded.name,
        class_name = excluded.class_name,
        faction = excluded.faction,
        guild_id = excluded.guild_id,
        guild_name = excluded.guild_name,
        guild_realm = excluded.guild_realm,
        refreshed_at = excluded.refreshed_at
    `)
    for (const character of characters) {
      const detail = detailedCharacters.get(String(character.id))
      upsertCharacter.run(
        account.id,
        stateRow.region,
        String(character.id),
        String(character.realm!.id),
        character.realm!.slug!,
        character.name!,
        detail?.playable_class?.name ?? character.playable_class?.name ?? null,
        detail?.faction?.name ?? detail?.faction?.type ?? character.faction?.name ?? character.faction?.type ?? null,
        (detail?.guild?.id ?? character.guild?.id) === undefined
          ? null
          : String(detail?.guild?.id ?? character.guild?.id),
        detail?.guild?.name ?? character.guild?.name ?? null,
        detail?.guild?.realm?.name
          ?? detail?.guild?.realm?.slug
          ?? character.guild?.realm?.name
          ?? character.guild?.realm?.slug
          ?? null,
        now.toISOString(),
      )
    }
    const session = dependencies.randomToken()
    const csrf = keyedHash(config.csrfSecret, session)
    database.prepare(`
      INSERT INTO sessions (id_hash, account_id, csrf_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      keyedHash(config.sessionSecret, session),
      account.id,
      hash(csrf),
      new Date(now.getTime() + 7 * 24 * 60 * 60_000).toISOString(),
      now.toISOString(),
    )
    database.exec('COMMIT')
    return {
      cookie: `lura_session=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      redirect: `${stateRow.returnTo}/?online=connected`,
    }
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

export interface AuthenticatedSession {
  accountId: number
  region: BattleNetRegion
  csrfToken: string
}

export function authenticate(
  database: Database,
  config: ApiConfig,
  dependencies: AuthDependencies,
  request: Request,
): AuthenticatedSession | null {
  const session = cookie(request, 'lura_session')
  if (!session) return null
  const row = database.prepare(`
    SELECT s.account_id AS accountId, s.csrf_hash AS csrfHash,
      a.battle_net_region AS region
    FROM sessions s JOIN accounts a ON a.id = s.account_id
    WHERE s.id_hash = ? AND s.expires_at > ?
  `).get(
    keyedHash(config.sessionSecret, session),
    dependencies.now().toISOString(),
  ) as { accountId: number; csrfHash: string; region: BattleNetRegion } | undefined
  if (!row) return null
  const csrfToken = keyedHash(config.csrfSecret, session)
  if (!safeEqual(hash(csrfToken), row.csrfHash)) return null
  return { accountId: row.accountId, region: row.region, csrfToken }
}

export function logout(database: Database, accountId: number): void {
  database.prepare('DELETE FROM sessions WHERE account_id = ?').run(accountId)
}

export function clearedSessionCookie(): string {
  return 'lura_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
}
