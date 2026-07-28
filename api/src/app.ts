import type { ApiConfig } from './config.js'
import type { Database } from './database.js'
import { listLeaderboard, type Difficulty, type Duty } from './leaderboards.js'
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
