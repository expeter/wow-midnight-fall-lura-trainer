import type { ApiConfig } from './config.js'
import type { Database } from './database.js'
import { listLeaderboard, type Difficulty, type Duty } from './leaderboards.js'
import { completeAttempt, issueAttempt } from './attempts.js'
import {
  authenticate,
  clearedSessionCookie,
  completeOAuth,
  defaultAuthDependencies,
  issueOAuthState,
  logout,
  safeEqual,
  type AuthDependencies,
  type BattleNetRegion,
} from './auth.js'

interface App {
  handle(request: Request): Promise<Response>
}

function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

function integerParameter(url: URL, name: string, fallback: number, maximum: number): number | null {
  const raw = url.searchParams.get(name)
  if (raw === null) return fallback
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 && value <= maximum ? value : null
}

export function createApp(
  database: Database,
  config: ApiConfig,
  dependencies: AuthDependencies = defaultAuthDependencies,
): App {
  const allowedOrigins = new Set([config.trainerOrigin, ...config.localOrigins])
  const rateLimits = new Map<string, { count: number; resetsAt: number }>()
  function rateLimited(request: Request, bucket: string, limit: number, windowMs: number): boolean {
    const client = request.headers.get('x-forwarded-for')?.split(',', 1)[0].trim() || 'local'
    const key = `${bucket}:${client}`
    const now = dependencies.now().getTime()
    const current = rateLimits.get(key)
    if (!current || current.resetsAt <= now) {
      rateLimits.set(key, { count: 1, resetsAt: now + windowMs })
      return false
    }
    current.count += 1
    return current.count > limit
  }
  return {
    async handle(request) {
      const url = new URL(request.url)
      const origin = request.headers.get('origin')
      const corsHeaders: Record<string, string> = {}
      if (origin && allowedOrigins.has(origin)) {
        corsHeaders['access-control-allow-origin'] = origin
        corsHeaders['access-control-allow-credentials'] = 'true'
        corsHeaders.vary = 'Origin'
      }
      if (request.method === 'OPTIONS') {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403)
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'access-control-allow-headers': 'content-type,x-csrf-token,idempotency-key',
          },
        })
      }
      if (request.method === 'GET' && url.pathname === '/health') {
        const row = database.prepare('SELECT 1 AS ok').get()
        return json({ status: row?.ok === 1 ? 'ok' : 'degraded' }, row?.ok === 1 ? 200 : 503, corsHeaders)
      }
      if (request.method === 'GET' && url.pathname === '/v1/auth/battlenet/start') {
        if (rateLimited(request, 'auth-start', 10, 10 * 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '600' })
        }
        const region = url.searchParams.get('region') ?? 'eu'
        if (region !== 'eu' && region !== 'us') return json({ error: 'invalid_region' }, 400, corsHeaders)
        try {
          return Response.redirect(issueOAuthState(database, config, dependencies, region as BattleNetRegion), 302)
        } catch (error) {
          if (error instanceof Error && error.message === 'battle_net_not_configured') {
            return json({ error: 'battle_net_not_configured' }, 503, corsHeaders)
          }
          throw error
        }
      }
      if (request.method === 'GET' && url.pathname === '/v1/auth/battlenet/callback') {
        if (rateLimited(request, 'auth-callback', 20, 10 * 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '600' })
        }
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        if (!code || !state) return json({ error: 'invalid_oauth_callback' }, 400, corsHeaders)
        try {
          const completed = await completeOAuth(database, config, dependencies, code, state)
          return new Response(null, {
            status: 302,
            headers: { location: completed.redirect, 'set-cookie': completed.cookie },
          })
        } catch (error) {
          const known = new Set([
            'invalid_oauth_state',
            'oauth_exchange_failed',
            'oauth_identity_failed',
            'oauth_profile_failed',
          ])
          if (error instanceof Error && known.has(error.message)) return json({ error: error.message }, 400, corsHeaders)
          throw error
        }
      }
      if (request.method === 'GET' && url.pathname === '/v1/me') {
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ authenticated: false }, 401, corsHeaders)
        const profile = database.prepare(`
          SELECT p.identity_mode AS identityMode, p.alias, p.show_guild AS showGuild,
            a.selected_character_id AS selectedCharacterId
          FROM privacy_settings p JOIN accounts a ON a.id = p.account_id
          WHERE p.account_id = ?
        `).get(session.accountId)
        return json({
          authenticated: true,
          region: session.region,
          csrfToken: session.csrfToken,
          privacy: profile,
        }, 200, corsHeaders)
      }
      if (request.method === 'GET' && url.pathname === '/v1/me/characters') {
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const rows = database.prepare(`
          SELECT c.id, c.region, c.character_id AS characterId,
            c.realm_id AS realmId, c.realm_slug AS realmSlug, c.name,
            c.class_name AS className, c.faction, c.guild_name AS guildName,
            c.guild_realm AS guildRealm, c.refreshed_at AS refreshedAt,
            CASE WHEN c.id = a.selected_character_id THEN 1 ELSE 0 END AS selected
          FROM characters c JOIN accounts a ON a.id = c.account_id
          WHERE c.account_id = ?
          ORDER BY c.name COLLATE NOCASE, c.realm_slug COLLATE NOCASE
        `).all(session.accountId)
        return json({ rows }, 200, corsHeaders)
      }
      if (request.method === 'PUT' && url.pathname === '/v1/me/character') {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        let characterId: number
        try {
          const body = await request.json() as { characterId?: unknown }
          characterId = Number(body.characterId)
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        if (!Number.isInteger(characterId) || characterId < 1) {
          return json({ error: 'invalid_character' }, 400, corsHeaders)
        }
        const owned = database.prepare(
          'SELECT id FROM characters WHERE id = ? AND account_id = ?',
        ).get(characterId, session.accountId)
        if (!owned) return json({ error: 'invalid_character' }, 400, corsHeaders)
        database.prepare('UPDATE accounts SET selected_character_id = ?, updated_at = ? WHERE id = ?')
          .run(characterId, dependencies.now().toISOString(), session.accountId)
        return json({ selectedCharacterId: characterId }, 200, corsHeaders)
      }
      if (request.method === 'PUT' && url.pathname === '/v1/me/privacy') {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        let input: { identityMode?: unknown; alias?: unknown; showGuild?: unknown }
        try {
          input = await request.json() as typeof input
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        if (
          input.identityMode !== 'anonymous'
          && input.identityMode !== 'alias'
          && input.identityMode !== 'character'
        ) return json({ error: 'invalid_identity_mode' }, 400, corsHeaders)
        const alias = typeof input.alias === 'string' ? input.alias.trim() : ''
        if (alias.length > 40 || (input.identityMode === 'alias' && alias.length < 1)) {
          return json({ error: 'invalid_alias' }, 400, corsHeaders)
        }
        if (typeof input.showGuild !== 'boolean') return json({ error: 'invalid_guild_visibility' }, 400, corsHeaders)
        database.prepare(`
          UPDATE privacy_settings
          SET identity_mode = ?, alias = ?, show_guild = ?, updated_at = ?
          WHERE account_id = ?
        `).run(
          input.identityMode,
          alias || null,
          input.identityMode === 'anonymous' ? 0 : Number(input.showGuild),
          dependencies.now().toISOString(),
          session.accountId,
        )
        return json({
          identityMode: input.identityMode,
          alias: alias || null,
          showGuild: input.identityMode === 'anonymous' ? false : input.showGuild,
        }, 200, corsHeaders)
      }
      if (request.method === 'DELETE' && url.pathname === '/v1/me') {
        if (rateLimited(request, 'account-delete', 5, 60 * 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '3600' })
        }
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        let confirmation: unknown
        try {
          confirmation = (await request.json() as { confirmation?: unknown }).confirmation
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        if (confirmation !== 'DELETE') return json({ error: 'deletion_not_confirmed' }, 400, corsHeaders)
        database.prepare('DELETE FROM accounts WHERE id = ?').run(session.accountId)
        return json({ deleted: true }, 200, { ...corsHeaders, 'set-cookie': clearedSessionCookie() })
      }
      if (request.method === 'POST' && url.pathname === '/v1/attempts') {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        let input: unknown
        try {
          input = await request.json()
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        try {
          return json(issueAttempt(database, config, dependencies, session.accountId, input as never), 201, corsHeaders)
        } catch (error) {
          if (error instanceof Error) return json({ error: error.message }, 400, corsHeaders)
          throw error
        }
      }
      const completionMatch = url.pathname.match(/^\/v1\/attempts\/([^/]+)\/complete$/)
      if (request.method === 'POST' && completionMatch) {
        if (rateLimited(request, 'attempt-complete', 30, 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '60' })
        }
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        let input: unknown
        try {
          input = await request.json()
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        try {
          return json(
            completeAttempt(database, dependencies, session.accountId, decodeURIComponent(completionMatch[1]), input as never),
            200,
            corsHeaders,
          )
        } catch (error) {
          if (error instanceof Error) {
            const conflict = error.message === 'attempt_already_used'
            return json({ error: error.message }, conflict ? 409 : 400, corsHeaders)
          }
          throw error
        }
      }
      if (request.method === 'GET' && url.pathname === '/v1/me/attempts') {
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const rows = database.prepare(`
          SELECT a.id, a.difficulty, a.duty, a.trainer_version AS trainerVersion,
            a.build_id AS buildId, a.issued_at AS issuedAt, a.expires_at AS expiresAt,
            a.consumed_at AS consumedAt, s.accepted_score AS score,
            s.duration_ms AS durationMs
          FROM attempts a LEFT JOIN attempt_summaries s ON s.attempt_id = a.id
          WHERE a.account_id = ? ORDER BY a.issued_at DESC LIMIT 100
        `).all(session.accountId)
        return json({ rows }, 200, corsHeaders)
      }
      const deleteAttemptMatch = url.pathname.match(/^\/v1\/me\/attempts\/([^/]+)$/)
      if (request.method === 'DELETE' && deleteAttemptMatch) {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        const deleted = database.prepare(`
          DELETE FROM attempts WHERE id = ? AND account_id = ? AND consumed_at IS NULL
        `).run(decodeURIComponent(deleteAttemptMatch[1]), session.accountId)
        if (deleted.changes !== 1) return json({ error: 'attempt_not_deletable' }, 404, corsHeaders)
        return json({ deleted: true }, 200, corsHeaders)
      }
      if (request.method === 'GET' && url.pathname === '/v1/me/achievements') {
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const rows = database.prepare(`
          SELECT aa.achievement_id AS achievementId, aa.trainer_version AS trainerVersion,
            aa.build_id AS buildId, aa.first_earned_at AS firstEarnedAt,
            a.title, a.currently_obtainable AS currentlyObtainable,
            c.name AS characterName, c.realm_slug AS realmSlug
          FROM account_achievements aa
          JOIN achievements a
            ON a.id = aa.achievement_id AND a.trainer_version = aa.trainer_version
          JOIN characters c ON c.id = aa.character_id
          WHERE aa.account_id = ?
          ORDER BY aa.first_earned_at, aa.achievement_id
        `).all(session.accountId)
        return json({ rows }, 200, corsHeaders)
      }
      if (request.method === 'POST' && url.pathname === '/v1/auth/logout') {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        logout(database, config, request)
        return json({ loggedOut: true }, 200, { ...corsHeaders, 'set-cookie': clearedSessionCookie() })
      }
      if (request.method === 'GET' && (url.pathname === '/v1/leaderboards' || url.pathname === '/v1/leaderboards/search')) {
        if (url.pathname.endsWith('/search') && rateLimited(request, 'leaderboard-search', 60, 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '60' })
        }
        const difficulty = url.searchParams.get('difficulty')
        const duty = url.searchParams.get('duty')
        const limit = integerParameter(url, 'limit', 50, 100)
        const offset = integerParameter(url, 'offset', 0, 10_000)
        const search = url.pathname.endsWith('/search') ? url.searchParams.get('q')?.trim() : undefined
        if (difficulty !== 'normal' && difficulty !== 'hard') return json({ error: 'invalid_difficulty' }, 400, corsHeaders)
        if (duty !== 'crystal' && duty !== 'non-crystal') return json({ error: 'invalid_duty' }, 400, corsHeaders)
        if (limit === null || offset === null) return json({ error: 'invalid_pagination' }, 400, corsHeaders)
        if (url.pathname.endsWith('/search') && (!search || search.length < 2 || search.length > 80)) {
          return json({ error: 'invalid_search' }, 400, corsHeaders)
        }
        const requestedVersion = url.searchParams.get('version') ?? 'current'
        const version = requestedVersion === 'current' ? config.currentTrainerVersion : requestedVersion
        const rows = listLeaderboard(database, {
          difficulty: difficulty as Difficulty,
          duty: duty as Duty,
          version,
          limit,
          offset,
          search,
        })
        return json({
          difficulty,
          duty,
          version,
          limit,
          offset,
          rows,
        }, 200, corsHeaders)
      }
      return json({ error: 'not_found' }, 404, corsHeaders)
    },
  }
}
