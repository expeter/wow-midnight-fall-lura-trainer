import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  completeOnlineAttempt,
  configurationFingerprint,
  issueOnlineAttempt,
  loadLeaderboard,
} from './online'

afterEach(() => vi.restoreAllMocks())

describe('online API client', () => {
  it('sends credentialed attempt issuance and completion requests with CSRF', async () => {
    const requests: Array<{ url: string; init: RequestInit }> = []
    vi.stubGlobal('fetch', vi.fn(async (input, init = {}) => {
      requests.push({ url: String(input), init })
      return Response.json(
        String(input).endsWith('/v1/attempts')
          ? { attemptId: 'attempt', nonce: 'nonce', expiresAt: 'later' }
          : { accepted: true, score: 1200, achievementIds: [] },
      )
    }))
    await issueOnlineAttempt('csrf-token', { difficulty: 'hard' })
    await completeOnlineAttempt('csrf-token', 'attempt', { nonce: 'nonce' })
    expect(requests).toHaveLength(2)
    expect(requests.every(request => request.init.credentials === 'include')).toBe(true)
    expect(new Headers(requests[0].init.headers).get('x-csrf-token')).toBe('csrf-token')
    expect(requests[1].url).toMatch(/\/v1\/attempts\/attempt\/complete$/)
  })

  it('keeps EU and US together by querying one public board division', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = new URL(String(input))
      expect(url.pathname).toBe('/v1/leaderboards/search')
      expect(url.searchParams.get('difficulty')).toBe('hard')
      expect(url.searchParams.get('duty')).toBe('crystal')
      expect(url.searchParams.get('q')).toBe('Milestone')
      expect(url.searchParams.has('region')).toBe(false)
      return Response.json({ rows: [] })
    }))
    await loadLeaderboard('hard', 'crystal', 'Milestone')
  })

  it('creates a stable SHA-256 raid configuration fingerprint', async () => {
    const first = await configurationFingerprint({ assignment: 3, positions: [{ x: 1, y: 2 }] })
    const second = await configurationFingerprint({ assignment: 3, positions: [{ x: 1, y: 2 }] })
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(first).toBe(second)
  })
})
