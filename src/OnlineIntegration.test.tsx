import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(() => {
  cleanup()
  history.replaceState(null, '', '/')
  vi.restoreAllMocks()
})

describe('online attempt integration', () => {
  it('shows chronological wipe and achievement activity with a Raider.IO character link', async () => {
    history.replaceState(null, '', '/?wipe-feed-test=1')
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = String(input)
      if (url.includes('/v1/activity')) return Response.json({ rows: [{
        id: 'wipe:1',
        type: 'wipe',
        profileId: 'profile-lurana',
        displayName: 'Lurana',
        character: 'Lurana',
        realm: 'silvermoon',
        region: 'eu',
        phase: 'Phase 3',
        difficulty: 'normal',
        reason: 'Touched a Stars beam',
        trainerVersion: '0.3.0',
        occurredAt: new Date(Date.now() - 60_000).toISOString(),
        achievementTitle: null,
      }, {
        id: 'achievement:1',
        type: 'achievement',
        profileId: 'profile-lurana',
        displayName: 'Lurana',
        character: 'Lurana',
        realm: 'silvermoon',
        region: 'eu',
        phase: null,
        difficulty: null,
        reason: null,
        achievementTitle: 'Ready for Raid Night',
        trainerVersion: '0.3.0',
        occurredAt: new Date(Date.now() - 30_000).toISOString(),
      }, {
        id: 'completion:1',
        type: 'completion',
        profileId: 'profile-lurana',
        displayName: 'Lurana',
        character: 'Lurana',
        realm: 'silvermoon',
        region: 'eu',
        phase: null,
        difficulty: 'hard',
        reason: null,
        achievementTitle: null,
        score: 1488,
        durationMs: 382400,
        duty: 'crystal',
        trainerVersion: '0.3.0',
        occurredAt: new Date(Date.now() - 15_000).toISOString(),
      }] })
      if (url.endsWith('/v1/profiles/profile-lurana')) return Response.json({
        profileId: 'profile-lurana',
        displayName: 'Lurana',
        character: 'Lurana',
        realm: 'silvermoon',
        region: 'eu',
        guild: 'Milestone',
        ownProfile: false,
        attempts: 3,
        fullRuns: 1,
        wipes: 2,
        boards: [],
        achievements: [],
        global: null,
      })
      if (url.endsWith('/v1/me')) return Response.json({ authenticated: false }, { status: 401 })
      if (url.includes('/v1/leaderboards')) return Response.json({ rows: [] })
      if (url.endsWith('/version.json')) return new Response('', { status: 404 })
      throw new Error(`unexpected ${url}`)
    }))
    const user = userEvent.setup()
    render(<App />)
    const players = await screen.findAllByRole('button', { name: 'Lurana—silvermoon' })
    expect(players).toHaveLength(3)
    await user.click(players[0])
    expect(await screen.findByRole('dialog')).toHaveTextContent('PUBLIC TRAINER PROFILE')
    expect(screen.getByRole('heading', { name: 'Lurana' })).toBeVisible()
    expect(screen.getByText(/wiped on: Phase 3 · normal/i)).toHaveTextContent('Touched a Stars beam')
    expect(screen.getByText(/earned achievement:/i)).toHaveTextContent('Ready for Raid Night')
    expect(screen.getByText(/completed full run:/i)).toHaveTextContent('hard · crystal · 1488 points · 382.4s')
  })

  it('issues a character-bound attempt before an eligible full Normal run', async () => {
    const requests: Array<{ url: string; body: string }> = []
    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      const url = String(input)
      requests.push({ url, body: String(init?.body ?? '') })
      if (url.endsWith('/v1/me')) return Response.json({
        authenticated: true,
        region: 'eu',
        csrfToken: 'csrf-token',
        privacy: {
          identityMode: 'anonymous',
          alias: null,
          showGuild: 0,
          selectedCharacterId: 7,
        },
      })
      if (url.endsWith('/v1/me/characters')) return Response.json({ rows: [{
        id: 7,
        region: 'eu',
        characterId: '77',
        realmSlug: 'silvermoon',
        name: 'Lurana',
        className: 'Priest',
        guildName: 'Milestone',
        selected: 1,
      }] })
      if (url.endsWith('/v1/me/achievements')) return Response.json({ rows: [] })
      if (url.includes('/v1/leaderboards')) return Response.json({ rows: [] })
      if (url.includes('/v1/wipes')) return Response.json({ rows: [] })
      if (url.endsWith('/v1/attempts')) return Response.json({
        attemptId: 'attempt-id',
        nonce: 'attempt-nonce',
        expiresAt: '2026-07-28T14:00:00.000Z',
      }, { status: 201 })
      if (url.endsWith('/version.json')) return new Response('', { status: 404 })
      throw new Error(`unexpected ${url}`)
    }))
    const user = userEvent.setup()
    const view = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Profile' }))
    await screen.findByLabelText(/Active character/)
    await user.click(screen.getByRole('button', { name: 'Game settings' }))
    await user.click(screen.getByRole('button', { name: 'normal' }))
    await user.click(screen.getByRole('button', { name: 'Enter P1' }))
    await waitFor(() => expect(requests.some(request => request.url.endsWith('/v1/attempts'))).toBe(true))
    const issuance = requests.find(request => request.url.endsWith('/v1/attempts'))!
    expect(issuance.body).toContain('"difficulty":"normal"')
    expect(issuance.body).toContain('"entryMode":"arena0"')
    expect(issuance.body).toMatch(/"configurationFingerprint":"[a-f0-9]{64}"/)
    expect(view.container.querySelector('[data-event="p1-countdown"]')).toBeInTheDocument()
  })

  it('revalidates a cached signed-in session before starting a leaderboard run', async () => {
    let sessionChecks = 0
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = String(input)
      requests.push(url)
      if (url.endsWith('/v1/me')) {
        sessionChecks += 1
        if (sessionChecks === 1) return Response.json({
          authenticated: true,
          region: 'eu',
          csrfToken: 'stale-csrf',
          privacy: {
            identityMode: 'character',
            alias: null,
            showGuild: 1,
            selectedCharacterId: 7,
          },
          selectedCharacter: {
            name: 'Brasoevo',
            realmSlug: 'blackrock',
            region: 'eu',
          },
        })
        return Response.json({ error: 'not_authenticated' }, { status: 401 })
      }
      if (url.includes('/v1/activity')) return Response.json({ rows: [] })
      if (url.includes('/v1/leaderboards')) return Response.json({ rows: [] })
      if (url.endsWith('/version.json')) return new Response('', { status: 404 })
      throw new Error(`unexpected ${url}`)
    }))
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Signed in as Brasoevo—blackrock/i)
    await user.click(screen.getByRole('button', { name: 'normal' }))
    await user.click(screen.getByRole('button', { name: 'Enter P1' }))
    expect(await screen.findByText(/online session expired.*log in again.*local practice/i)).toBeVisible()
    expect(sessionChecks).toBe(2)
    expect(requests.some(url => url.endsWith('/v1/attempts'))).toBe(false)
  })
})
