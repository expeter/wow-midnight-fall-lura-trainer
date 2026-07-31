import type { ApiConfig } from './config.js'
import type { Database } from './database.js'
import { accountLeaderboardStandings, listLeaderboard, type Difficulty, type Duty } from './leaderboards.js'
import { activeAttemptIdentity, completeAttempt, issueAttempt } from './attempts.js'
import { ACHIEVEMENT_CATALOG } from './achievementCatalog.js'
import { listAchievementHall } from './achievementHall.js'
import { listGlobalRanking, publicPlayerProfile } from './globalRanking.js'
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

function allowedOriginVariants(origins: string[]): Set<string> {
  const allowed = new Set(origins)
  for (const origin of origins) {
    const url = new URL(origin)
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') continue
    url.hostname = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
    allowed.add(url.origin)
  }
  return allowed
}

export function createApp(
  database: Database,
  config: ApiConfig,
  dependencies: AuthDependencies = defaultAuthDependencies,
): App {
  const upsertAchievement = database.prepare(`
    INSERT INTO achievement_catalog (id, title, tier, points, season, introduced_version, retired_version)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET title = excluded.title, tier = excluded.tier,
      points = excluded.points, season = excluded.season,
      introduced_version = excluded.introduced_version,
      retired_version = excluded.retired_version
  `)
  for (const achievement of ACHIEVEMENT_CATALOG) upsertAchievement.run(
    achievement.id,
    achievement.title,
    achievement.tier,
    achievement.points,
    achievement.season,
    achievement.introducedVersion,
    achievement.retiredVersion,
  )
  const allowedOrigins = allowedOriginVariants([config.trainerOrigin, ...config.localOrigins])
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
        return json({
          status: row?.ok === 1 ? 'ok' : 'degraded',
          trainerVersion: config.currentTrainerVersion,
          leaderboardSeason: config.currentLeaderboardSeason,
        }, row?.ok === 1 ? 200 : 503, corsHeaders)
      }
      if (request.method === 'GET' && (url.pathname === '/v1/activity' || url.pathname === '/v1/wipes')) {
        const limit = integerParameter(url, 'limit', 20, 100)
        if (limit === null) return json({ error: 'invalid_limit' }, 400, corsHeaders)
        const rows = database.prepare(`
          WITH activity AS (
            SELECT 'wipe' AS type, 'wipe:' || w.id AS id,
              w.account_id AS accountId, w.character_id AS characterId,
              w.phase, w.difficulty, w.reason,
              NULL AS achievementTitle,
              NULL AS score, NULL AS durationMs, NULL AS duty,
              w.trainer_version AS trainerVersion, w.occurred_at AS occurredAt
            FROM wipe_events w
            UNION ALL
            SELECT 'wipe' AS type, 'anonymous-wipe:' || w.id AS id,
              NULL AS accountId, NULL AS characterId,
              w.phase, w.difficulty, w.reason,
              NULL AS achievementTitle,
              NULL AS score, NULL AS durationMs, NULL AS duty,
              w.trainer_version AS trainerVersion, w.occurred_at AS occurredAt
            FROM anonymous_wipe_events w
            UNION ALL
            SELECT 'achievement' AS type, 'achievement:' || e.id AS id,
              e.account_id AS accountId, e.character_id AS characterId,
              NULL AS phase, NULL AS difficulty, NULL AS reason,
              c.title AS achievementTitle,
              NULL AS score, NULL AS durationMs, NULL AS duty,
              e.trainer_version AS trainerVersion, e.occurred_at AS occurredAt
            FROM achievement_events e
            JOIN achievement_catalog c ON c.id = e.achievement_id
            UNION ALL
            SELECT 'completion' AS type, 'completion:' || r.id AS id,
              r.account_id AS accountId, r.character_id AS characterId,
              NULL AS phase, r.difficulty, NULL AS reason,
              NULL AS achievementTitle,
              r.score, r.duration_ms AS durationMs, r.duty,
              r.trainer_version AS trainerVersion, r.accepted_at AS occurredAt
            FROM results r
            WHERE r.run_eligible = 1
          )
          SELECT activity.id, activity.type,
            CASE WHEN p.identity_mode <> 'anonymous' THEN a.public_profile_id ELSE NULL END AS profileId,
            CASE
              WHEN p.identity_mode = 'character' THEN c.name
              WHEN p.identity_mode = 'alias' THEN COALESCE(p.alias, 'Anonymous')
              ELSE 'Anonymous'
            END AS displayName,
            CASE WHEN p.identity_mode = 'character' THEN c.name ELSE NULL END AS character,
            CASE WHEN p.identity_mode = 'character' THEN c.realm_slug ELSE NULL END AS realm,
            CASE WHEN p.identity_mode = 'character' THEN c.region ELSE NULL END AS region,
            activity.phase, activity.difficulty, activity.reason,
            activity.achievementTitle, activity.score, activity.durationMs,
            activity.duty, activity.trainerVersion, activity.occurredAt
          FROM activity
          LEFT JOIN privacy_settings p ON p.account_id = activity.accountId
          LEFT JOIN accounts a ON a.id = activity.accountId
          LEFT JOIN characters c ON c.id = activity.characterId
          WHERE activity.accountId IS NULL OR a.selected_character_id = activity.characterId
          ORDER BY activity.occurredAt DESC, activity.id DESC
          LIMIT ?
        `).all(limit)
        return json({ rows: url.pathname === '/v1/wipes' ? rows.filter(row => row.type === 'wipe') : rows }, 200, corsHeaders)
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
            a.selected_character_id AS selectedCharacterId,
            c.name AS selectedCharacterName, c.realm_slug AS selectedCharacterRealm,
            c.region AS selectedCharacterRegion
          FROM privacy_settings p
          JOIN accounts a ON a.id = p.account_id
          LEFT JOIN characters c ON c.id = a.selected_character_id
          WHERE p.account_id = ?
        `).get(session.accountId) as {
          identityMode: string
          alias: string | null
          showGuild: number
          selectedCharacterId: number | null
          selectedCharacterName: string | null
          selectedCharacterRealm: string | null
          selectedCharacterRegion: 'eu' | 'us' | null
        }
        const standings = accountLeaderboardStandings(
          database,
          config.currentLeaderboardSeason,
          session.accountId,
        )
        const globalPosition = listGlobalRanking(database, config.currentLeaderboardSeason, session.accountId).own?.rank ?? null
        return json({
          authenticated: true,
          region: session.region,
          csrfToken: session.csrfToken,
          privacy: {
            identityMode: profile.identityMode,
            alias: profile.alias,
            showGuild: profile.showGuild,
            selectedCharacterId: profile.selectedCharacterId,
          },
          selectedCharacter: profile.selectedCharacterId
            && profile.selectedCharacterName
            && profile.selectedCharacterRealm
            && profile.selectedCharacterRegion
            ? {
                name: profile.selectedCharacterName,
                realmSlug: profile.selectedCharacterRealm,
                region: profile.selectedCharacterRegion,
              }
            : undefined,
          standings,
          globalPosition,
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
      if (request.method === 'POST' && url.pathname === '/v1/me/characters/refresh') {
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        if (!session) return json({ error: 'not_authenticated' }, 401, corsHeaders)
        const csrf = request.headers.get('x-csrf-token')
        if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        try {
          const authorizationUrl = issueOAuthState(database, config, dependencies, session.region)
          return json({ reauthenticationRequired: true, authorizationUrl }, 200, corsHeaders)
        } catch (error) {
          if (error instanceof Error && error.message === 'battle_net_not_configured') {
            return json({ error: 'battle_net_not_configured' }, 503, corsHeaders)
          }
          throw error
        }
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
      if (request.method === 'POST' && url.pathname === '/v1/wipes') {
        if (rateLimited(request, 'wipe-create', 30, 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '60' })
        }
        if (!origin || !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        const claimedAuthentication = Boolean(request.headers.get('x-csrf-token'))
        if (session) {
          const csrf = request.headers.get('x-csrf-token')
          if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        }
        let input: {
          phase?: unknown
          difficulty?: unknown
          reason?: unknown
          trainerVersion?: unknown
          attemptId?: unknown
          nonce?: unknown
        }
        try {
          input = await request.json() as typeof input
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        const phase = typeof input.phase === 'string' ? input.phase.trim() : ''
        const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
        const trainerVersion = typeof input.trainerVersion === 'string' ? input.trainerVersion.trim() : ''
        if (!phase || phase.length > 40) return json({ error: 'invalid_phase' }, 400, corsHeaders)
        if (!reason || reason.length > 160) return json({ error: 'invalid_reason' }, 400, corsHeaders)
        if (input.difficulty !== 'normal' && input.difficulty !== 'hard') {
          return json({ error: 'invalid_difficulty' }, 400, corsHeaders)
        }
        if (!trainerVersion || trainerVersion.length > 40) return json({ error: 'invalid_version' }, 400, corsHeaders)
        const suppliedAttemptIdentity = input.attemptId !== undefined || input.nonce !== undefined
        const attemptIdentity = typeof input.attemptId === 'string' && typeof input.nonce === 'string'
          ? activeAttemptIdentity(database, dependencies, input.attemptId, input.nonce)
          : null
        if (suppliedAttemptIdentity && !attemptIdentity) {
          return json({ error: 'invalid_attempt_capability' }, 401, corsHeaders)
        }
        if (session && attemptIdentity && attemptIdentity.accountId !== session.accountId) {
          return json({ error: 'attempt_identity_mismatch' }, 403, corsHeaders)
        }
        if (!session && claimedAuthentication && !attemptIdentity) {
          return json({ error: 'not_authenticated' }, 401, corsHeaders)
        }
        const selectedCharacter = session ? database.prepare(`
          SELECT a.selected_character_id AS characterId
          FROM accounts a
          WHERE a.id = ?
        `).get(session.accountId) as { characterId: number | null } | undefined : undefined
        const occurredAt = dependencies.now().toISOString()
        if (session && !attemptIdentity && !selectedCharacter?.characterId) {
          return json({ error: 'character_required' }, 409, corsHeaders)
        }
        if (!session && !attemptIdentity) {
          const inserted = database.prepare(`
            INSERT INTO anonymous_wipe_events (phase, difficulty, reason, trainer_version, occurred_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(phase, input.difficulty, reason, trainerVersion, occurredAt)
          return json({ recorded: true, anonymous: true, id: Number(inserted.lastInsertRowid), occurredAt }, 201, corsHeaders)
        }
        const inserted = database.prepare(`
          INSERT INTO wipe_events (
            account_id, character_id, phase, difficulty, reason, trainer_version, occurred_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          attemptIdentity?.accountId ?? session!.accountId,
          attemptIdentity?.characterId ?? selectedCharacter!.characterId,
          phase,
          input.difficulty,
          reason,
          trainerVersion,
          occurredAt,
        )
        return json({ recorded: true, id: Number(inserted.lastInsertRowid), occurredAt }, 201, corsHeaders)
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
        if (rateLimited(request, 'attempt-issue', 10, 60_000)) {
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
          return json(issueAttempt(database, config, dependencies, session.accountId, input as never), 201, corsHeaders)
        } catch (error) {
          const known = new Set([
            'invalid_difficulty', 'invalid_duty', 'invalid_entry_mode',
            'invalid_phase_scope', 'unsupported_trainer_version',
            'invalid_build_id', 'invalid_configuration',
            'invalid_optional_challenges', 'character_required',
          ])
          if (error instanceof Error && known.has(error.message)) {
            return json({ error: error.message }, 400, corsHeaders)
          }
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
        if (session) {
          const csrf = request.headers.get('x-csrf-token')
          if (!csrf || !safeEqual(csrf, session.csrfToken)) return json({ error: 'invalid_csrf' }, 403, corsHeaders)
        }
        const idempotencyKey = request.headers.get('idempotency-key') ?? ''
        let input: unknown
        try {
          input = await request.json()
        } catch {
          return json({ error: 'invalid_body' }, 400, corsHeaders)
        }
        const attemptId = decodeURIComponent(completionMatch[1])
        const boundAccount = database.prepare(
          'SELECT account_id AS accountId FROM attempts WHERE id = ?',
        ).get(attemptId) as { accountId: number } | undefined
        const accountId = session?.accountId ?? boundAccount?.accountId ?? -1
        if (session && boundAccount && boundAccount.accountId !== session.accountId) {
          return json({ error: 'attempt_not_found' }, 400, corsHeaders)
        }
        try {
          return json(
            completeAttempt(
              database,
              dependencies,
              accountId,
              attemptId,
              idempotencyKey,
              input as never,
            ),
            200,
            corsHeaders,
          )
        } catch (error) {
          const known = new Set([
            'invalid_nonce', 'invalid_version', 'implausible_duration',
            'invalid_score', 'invalid_phase_order', 'invalid_phase_duration',
            'invalid_mistakes', 'mistake_count_mismatch', 'invalid_actions',
            'score_mismatch', 'invalid_achievement_inputs', 'attempt_not_found',
            'attempt_already_used', 'attempt_expired', 'attempt_version_mismatch',
            'invalid_configuration', 'invalid_optional_challenges',
            'attempt_configuration_mismatch', 'invalid_idempotency_key',
            'idempotency_conflict',
          ])
          if (error instanceof Error && known.has(error.message)) {
            const conflict = error.message === 'attempt_already_used' || error.message === 'idempotency_conflict'
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
        logout(database, session.accountId)
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
        const current = requestedVersion === 'current'
        const version = current ? config.currentTrainerVersion : requestedVersion
        const rows = listLeaderboard(database, {
          difficulty: difficulty as Difficulty,
          duty: duty as Duty,
          ...(current
            ? { season: config.currentLeaderboardSeason }
            : { version }),
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
      if (request.method === 'GET' && url.pathname === '/v1/achievement-hall') {
        if (rateLimited(request, 'achievement-hall', 120, 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '60' })
        }
        const limit = integerParameter(url, 'limit', 10, 100)
        const offset = integerParameter(url, 'offset', 0, 10_000)
        const search = url.searchParams.get('q')?.trim()
        if (limit === null || offset === null) return json({ error: 'invalid_pagination' }, 400, corsHeaders)
        if (search && (search.length < 2 || search.length > 80)) return json({ error: 'invalid_search' }, 400, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        return json(listAchievementHall(database, {
          limit,
          offset,
          search,
          ownAccountId: session?.accountId,
        }), 200, corsHeaders)
      }
      if (request.method === 'GET' && url.pathname === '/v1/global-ranking') {
        if (rateLimited(request, 'global-ranking', 120, 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '60' })
        }
        const limit = integerParameter(url, 'limit', 10, 100)
        const search = url.searchParams.get('q')?.trim() ?? ''
        if (limit === null) return json({ error: 'invalid_pagination' }, 400, corsHeaders)
        if (search && (search.length < 2 || search.length > 80)) return json({ error: 'invalid_search' }, 400, corsHeaders)
        const session = authenticate(database, config, dependencies, request)
        const ranking = listGlobalRanking(database, config.currentLeaderboardSeason, session?.accountId, search)
        return json({ ...ranking, rows: ranking.rows.slice(0, limit) }, 200, corsHeaders)
      }
      const profileMatch = url.pathname.match(/^\/v1\/profiles\/([a-f0-9]{24})$/)
      if (request.method === 'GET' && profileMatch) {
        if (rateLimited(request, 'public-profile', 120, 60_000)) {
          return json({ error: 'rate_limited' }, 429, { ...corsHeaders, 'retry-after': '60' })
        }
        const session = authenticate(database, config, dependencies, request)
        const profile = publicPlayerProfile(database, profileMatch[1], config.currentLeaderboardSeason, session?.accountId)
        return profile ? json(profile, 200, corsHeaders) : json({ error: 'profile_not_found' }, 404, corsHeaders)
      }
      return json({ error: 'not_found' }, 404, corsHeaders)
    },
  }
}
