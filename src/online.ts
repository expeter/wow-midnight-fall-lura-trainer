export const ONLINE_API_ORIGIN = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:8787'
  : 'https://api.asgard.website'

export interface OnlineSession {
  authenticated: boolean
  region?: 'eu' | 'us'
  csrfToken?: string
  privacy?: {
    identityMode: 'anonymous' | 'alias' | 'character'
    alias: string | null
    showGuild: number
    selectedCharacterId: number | null
  }
}

export interface OnlineCharacter {
  id: number
  region: 'eu' | 'us'
  characterId: string
  realmSlug: string
  name: string
  className: string | null
  guildName: string | null
  selected: number
}

export interface LeaderboardRow {
  rank: number
  displayName: string
  character: string | null
  realm: string | null
  guild: string | null
  score: number
  durationMs: number
  trainerVersion: string
}

export interface OnlineAchievement {
  achievementId: string
  trainerVersion: string
  buildId: string
  firstEarnedAt: string
  currentlyObtainable: number
  characterName: string
  realmSlug: string
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${ONLINE_API_ORIGIN}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const body = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(body.error ?? `request_failed_${response.status}`)
  return body
}

export async function loadOnlineSession(): Promise<OnlineSession> {
  try {
    return await api<OnlineSession>('/v1/me')
  } catch (error) {
    if (error instanceof Error && (
      error.message === 'not_authenticated'
      || error.message === 'request_failed_401'
    )) return { authenticated: false }
    throw error
  }
}

export function battleNetLoginUrl(region: 'eu' | 'us'): string {
  return `${ONLINE_API_ORIGIN}/v1/auth/battlenet/start?region=${region}`
}

export function loadCharacters(): Promise<{ rows: OnlineCharacter[] }> {
  return api('/v1/me/characters')
}

export function loadOnlineAchievements(): Promise<{ rows: OnlineAchievement[] }> {
  return api('/v1/me/achievements')
}

export function selectCharacter(characterId: number, csrfToken: string) {
  return api<{ selectedCharacterId: number }>('/v1/me/character', {
    method: 'PUT',
    headers: { 'x-csrf-token': csrfToken },
    body: JSON.stringify({ characterId }),
  })
}

export function refreshCharacters(csrfToken: string) {
  return api<{ reauthenticationRequired: true; authorizationUrl: string }>(
    '/v1/me/characters/refresh',
    { method: 'POST', headers: { 'x-csrf-token': csrfToken } },
  )
}

export function updatePrivacy(
  csrfToken: string,
  input: { identityMode: string; alias: string; showGuild: boolean },
) {
  return api('/v1/me/privacy', {
    method: 'PUT',
    headers: { 'x-csrf-token': csrfToken },
    body: JSON.stringify(input),
  })
}

export function logoutOnline(csrfToken: string) {
  return api('/v1/auth/logout', { method: 'POST', headers: { 'x-csrf-token': csrfToken } })
}

export function deleteOnlineData(csrfToken: string) {
  return api('/v1/me', {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrfToken },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  })
}

export function loadLeaderboard(
  difficulty: 'normal' | 'hard',
  duty: 'crystal' | 'non-crystal',
  search = '',
): Promise<{ rows: LeaderboardRow[] }> {
  const route = search.trim() ? '/v1/leaderboards/search' : '/v1/leaderboards'
  const query = new URLSearchParams({ difficulty, duty, version: 'current' })
  if (search.trim()) query.set('q', search.trim())
  return api(`${route}?${query}`)
}

export async function configurationFingerprint(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export function issueOnlineAttempt(csrfToken: string, input: object) {
  return api<{
    attemptId: string
    nonce: string
    expiresAt: string
  }>('/v1/attempts', {
    method: 'POST',
    headers: { 'x-csrf-token': csrfToken },
    body: JSON.stringify(input),
  })
}

export function completeOnlineAttempt(
  csrfToken: string,
  attemptId: string,
  input: object,
) {
  return api<{ accepted: true; score: number; achievementIds: string[] }>(
    `/v1/attempts/${encodeURIComponent(attemptId)}/complete`,
    {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify(input),
    },
  )
}
