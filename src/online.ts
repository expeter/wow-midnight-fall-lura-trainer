export const ONLINE_API_ORIGIN = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:8787'
  : 'https://api.asgard.website'

export interface OnlineSession {
  authenticated: boolean
  globalPosition?: number | null
  region?: 'eu' | 'us'
  csrfToken?: string
  privacy?: {
    identityMode: 'anonymous' | 'alias' | 'character'
    alias: string | null
    showGuild: number
    selectedCharacterId: number | null
  }
  standings?: Array<{
    difficulty: 'normal' | 'hard'
    duty: 'crystal' | 'non-crystal'
    score: number
    durationMs: number
    position: number
  }>
  selectedCharacter?: {
    name: string
    realmSlug: string
    region: 'eu' | 'us'
  }
}

export type RunAttributionMode = 'verified' | 'anonymous' | 'local'

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
  profileId: string
  displayName: string
  character: string | null
  realm: string | null
  region: 'eu' | 'us' | null
  guild: string | null
  score: number
  durationMs: number
  trainerVersion: string
}

export interface AchievementHallRow {
  rank: number
  profileId: string
  displayName: string
  guild: string | null
  totalPoints: number
  achievementCount: number
  exceptionalAchievementCount: number
  highestAchievement: {
    id: string
    title: string
    tier: string
    points: number
    firstEarnedAt: string
    featOfStrength: boolean
  }
}

export interface GlobalRankingRow {
  rank: number
  profileId: string
  displayName: string
  guild: string | null
  achievementPoints: number
  runPoints: number
  totalPoints: number
  crystalFlawless: boolean
  hardClear: boolean
  exceptionalAchievementCount: number
}

export interface PublicPlayerProfile {
  profileId: string
  displayName: string
  character: string | null
  realm: string | null
  region: 'eu' | 'us' | null
  guild: string | null
  ownProfile: boolean
  attempts: number
  fullRuns: number
  wipes: number
  boards: Array<{ difficulty: string; duty: string; rank: number | null }>
  achievements: Array<{ id: string; title: string; tier: string; points: number; firstEarnedAt: string; hidden: boolean }>
  global: GlobalRankingRow | null
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

export interface ActivityFeedRow {
  id: string
  type: 'wipe' | 'achievement' | 'completion'
  profileId?: string | null
  displayName: string
  character: string | null
  realm: string | null
  region: 'eu' | 'us' | null
  phase: string | null
  difficulty: 'normal' | 'hard' | null
  reason: string | null
  achievementTitle: string | null
  score?: number | null
  durationMs?: number | null
  duty?: 'crystal' | 'non-crystal' | null
  trainerVersion: string
  occurredAt: string
}

export const LIVE_ACTIVITY_WINDOW_MS = 10 * 60_000

export function recentActivityRows(
  rows: ActivityFeedRow[],
  now = Date.now(),
  windowMs = LIVE_ACTIVITY_WINDOW_MS,
): ActivityFeedRow[] {
  return rows.filter(row => {
    const occurredAt = Date.parse(row.occurredAt)
    return Number.isFinite(occurredAt) && occurredAt <= now && now - occurredAt <= windowMs
  })
}

export function newActivityRows(rows: ActivityFeedRow[], seenIds: Set<string> | null): ActivityFeedRow[] {
  if (!seenIds) return []
  return rows.filter(row => !seenIds.has(row.id)).reverse()
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
  limit = 10,
): Promise<{ rows: LeaderboardRow[] }> {
  const route = search.trim() ? '/v1/leaderboards/search' : '/v1/leaderboards'
  const query = new URLSearchParams({ difficulty, duty, version: 'current' })
  if (search.trim()) query.set('q', search.trim())
  query.set('limit', String(limit))
  return api(`${route}?${query}`)
}

export function loadAchievementHall(search = '', limit = 10): Promise<{
  rows: AchievementHallRow[]
  own: AchievementHallRow | null
  total: number
}> {
  const query = new URLSearchParams({ limit: String(limit) })
  if (search.trim()) query.set('q', search.trim())
  return api(`/v1/achievement-hall?${query}`)
}

export function loadGlobalRanking(limit = 10, search = ''): Promise<{ rows: GlobalRankingRow[]; own: GlobalRankingRow | null; total: number }> {
  const query = new URLSearchParams({ limit: String(limit) })
  if (search.trim()) query.set('q', search.trim())
  return api(`/v1/global-ranking?${query}`)
}

export function localhostPublicPlayerProfile(profileId: string): PublicPlayerProfile {
  return {
    profileId,
    displayName: 'Starweaver-G01',
    character: 'Starweaver',
    realm: 'silvermoon',
    region: 'eu',
    guild: 'I Asgard I',
    ownProfile: false,
    attempts: 184,
    fullRuns: 37,
    wipes: 96,
    achievements: [
      { id: 'ready-for-raid-night', title: 'Ready for Raid Night', tier: 'Legendary', points: 200, firstEarnedAt: '2026-07-24T20:12:00.000Z', hidden: false },
      { id: 'four-boards-one-throne', title: 'Four Boards, One Throne', tier: 'Legendary', points: 200, firstEarnedAt: '2026-07-26T18:05:00.000Z', hidden: false },
      { id: 'always-be-casting', title: 'Always Be Casting', tier: 'Epic', points: 100, firstEarnedAt: '2026-07-23T19:42:00.000Z', hidden: false },
      { id: 'crystal-clear', title: 'Crystal Clear', tier: 'Rare', points: 50, firstEarnedAt: '2026-07-22T21:31:00.000Z', hidden: false },
      { id: 'mind-the-gap', title: 'Mind the Gap', tier: 'Rare', points: 50, firstEarnedAt: '2026-07-22T21:38:00.000Z', hidden: false },
      { id: 'no-splinters', title: 'No Splinters', tier: 'Rare', points: 50, firstEarnedAt: '2026-07-23T19:47:00.000Z', hidden: false },
    ],
    global: {
      rank: 1,
      profileId,
      displayName: 'Starweaver-G01',
      guild: 'I Asgard I',
      achievementPoints: 725,
      runPoints: 6370,
      totalPoints: 7095,
      crystalFlawless: true,
      hardClear: true,
      exceptionalAchievementCount: 0,
    },
    boards: [
      { difficulty: 'normal', duty: 'crystal', rank: 1 },
      { difficulty: 'normal', duty: 'non-crystal', rank: 3 },
      { difficulty: 'hard', duty: 'crystal', rank: 1 },
      { difficulty: 'hard', duty: 'non-crystal', rank: 2 },
    ],
  }
}

export function loadPublicPlayerProfile(profileId: string): Promise<PublicPlayerProfile> {
  return api<PublicPlayerProfile>(`/v1/profiles/${encodeURIComponent(profileId)}`).catch(error => {
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return localhostPublicPlayerProfile(profileId)
    throw error
  })
}

let localhostActivityPoll = 0
function localhostActivityRows(): ActivityFeedRow[] {
  localhostActivityPoll += 1
  const now = Date.now()
  const fixtures: ActivityFeedRow[] = [
    { id: 'local:wipe', type: 'wipe', displayName: 'LocalLurana', character: null, realm: null, region: null, phase: 'Phase 3', difficulty: 'normal', reason: 'Touched a Stars beam', achievementTitle: null, score: null, durationMs: null, duty: null, trainerVersion: 'local', occurredAt: new Date(now - 12_000).toISOString() },
    { id: 'local:completion', type: 'completion', displayName: 'PracticeHero', character: null, realm: null, region: null, phase: null, difficulty: 'hard', reason: null, achievementTitle: null, score: 1488, durationMs: 382_400, duty: 'crystal', trainerVersion: 'local', occurredAt: new Date(now - 4_000).toISOString() },
    { id: 'local:achievement', type: 'achievement', displayName: 'Runeweaver', character: null, realm: null, region: null, phase: null, difficulty: null, reason: null, achievementTitle: 'Ready for Raid Night', score: null, durationMs: null, duty: null, trainerVersion: 'local', occurredAt: new Date(now - 1_000).toISOString() },
  ]
  return fixtures.slice(0, Math.min(fixtures.length, localhostActivityPoll))
}

export async function loadActivityFeed(limit = 20): Promise<{ rows: ActivityFeedRow[] }> {
  const localhostPreview = import.meta.env.MODE !== 'test' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  try {
    const result = await api<{ rows: ActivityFeedRow[] }>(`/v1/activity?limit=${limit}`)
    return localhostPreview ? { rows: [...localhostActivityRows(), ...result.rows].slice(0, limit) } : result
  } catch (error) {
    if (localhostPreview) return { rows: localhostActivityRows().slice(0, limit) }
    throw error
  }
}

export function canRecordOnlineWipe(
  attribution: RunAttributionMode,
  difficulty: string,
): boolean {
  return attribution !== 'local' && (difficulty === 'normal' || difficulty === 'hard')
}

export function recordOnlineWipe(
  csrfToken: string | undefined,
  input: {
    phase: string
    difficulty: 'normal' | 'hard'
    reason: string
    trainerVersion: string
    attemptId?: string
    nonce?: string
  },
) {
  return api<{ recorded: boolean; id?: number; occurredAt?: string }>('/v1/wipes', {
    method: 'POST',
    headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    body: JSON.stringify(input),
  })
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
  csrfToken: string | undefined,
  attemptId: string,
  input: object,
) {
  return api<{ accepted: true; score: number; achievementIds: string[] }>(
    `/v1/attempts/${encodeURIComponent(attemptId)}/complete`,
    {
      method: 'POST',
      headers: {
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        'idempotency-key': attemptId,
      },
      body: JSON.stringify(input),
    },
  )
}
