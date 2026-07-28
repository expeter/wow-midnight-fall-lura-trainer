import type { ApiConfig } from './config.js'
import type { Database } from './database.js'
import { listLeaderboard, type Difficulty, type Duty } from './leaderboards.js'

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

export function createApp(database: Database, config: ApiConfig): App {
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
