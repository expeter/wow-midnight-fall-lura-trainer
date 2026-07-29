import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnlinePanel, { OnlineStandingSummary } from './OnlinePanel'

afterEach(() => vi.restoreAllMocks())

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

describe('optional online profile', () => {
  it('keeps anonymous play available and loads the public leaderboard', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = String(input)
      if (url.endsWith('/v1/me')) return json({ error: 'not_authenticated' }, 401)
      if (url.includes('/v1/leaderboards')) {
        return json({ rows: [{
          displayName: 'Anonymous',
          character: null,
          realm: null,
          guild: null,
          score: 1200,
          durationMs: 300_000,
          trainerVersion: '0.3.0',
        }] })
      }
      throw new Error(`unexpected ${url}`)
    }))
    render(<OnlinePanel onSession={() => undefined} />)
    expect(await screen.findByText(/Anonymous play remains fully available/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
      'href',
      'http://127.0.0.1:8787/v1/auth/battlenet/start?region=eu',
    )
    await userEvent.selectOptions(screen.getByLabelText('Battle.net region'), 'us')
    expect(screen.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
      'href',
      'http://127.0.0.1:8787/v1/auth/battlenet/start?region=us',
    )
    expect(await screen.findByText('1200 pts · 300.0s')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top 10' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'View full leaderboard' }))
    expect(await screen.findByRole('heading', { name: 'Full leaderboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy.html')
  })

  it('shows current Normal and Hard positions beside the local achievement summary', () => {
    render(<OnlineStandingSummary session={{
      authenticated: true,
      standings: [
        { difficulty: 'normal', duty: 'crystal', position: 8, score: 1100, durationMs: 300_000 },
        { difficulty: 'hard', duty: 'non-crystal', position: 3, score: 1300, durationMs: 290_000 },
      ],
    }} />)
    expect(screen.getByLabelText('Current online standings')).toHaveTextContent('Normal #8 · Hard #3')
  })

  it('uses localhost fixtures only after a successful empty response and links verified characters', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = String(input)
      if (url.endsWith('/v1/me')) return json({ error: 'not_authenticated' }, 401)
      if (url.includes('/v1/leaderboards')) return json({ rows: [] })
      throw new Error(`unexpected ${url}`)
    }))
    render(<OnlinePanel onSession={() => undefined} />)
    const character = await screen.findByRole('link', { name: 'Aegis' })
    expect(character).toHaveAttribute(
      'href',
      'https://raider.io/characters/eu/silvermoon/Aegis',
    )
    expect(character.closest('ol')?.querySelectorAll('a')).toHaveLength(1)
    expect(character.closest('ol')).toHaveTextContent('Voidrunner')
  })

  it('selects an owned character and saves explicit public privacy', async () => {
    const requests: Array<{ url: string; method: string; body: string }> = []
    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      requests.push({ url, method, body: String(init?.body ?? '') })
      if (url.endsWith('/v1/me')) return json({
        authenticated: true,
        region: 'eu',
        csrfToken: 'csrf',
        privacy: {
          identityMode: 'anonymous',
          alias: null,
          showGuild: 0,
          selectedCharacterId: null,
        },
      })
      if (url.endsWith('/v1/me/characters')) return json({ rows: [{
        id: 7,
        region: 'eu',
        characterId: '77',
        realmSlug: 'silvermoon',
        name: 'Lurana',
        className: 'Priest',
        guildName: 'Milestone',
        selected: 0,
      }] })
      if (url.endsWith('/v1/me/achievements')) return json({ rows: [] })
      if (url.includes('/v1/leaderboards')) return json({ rows: [] })
      if (url.endsWith('/v1/me/character')) return json({ selectedCharacterId: 7 })
      if (url.endsWith('/v1/me/privacy')) return json({
        identityMode: 'alias', alias: 'Runner', showGuild: true,
      })
      throw new Error(`unexpected ${url}`)
    }))
    const user = userEvent.setup()
    render(<OnlinePanel onSession={() => undefined} />)
    const character = await screen.findByLabelText('Verified character')
    await user.selectOptions(character, '7')
    await waitFor(() => expect(requests.some(request => (
      request.url.endsWith('/v1/me/character')
      && request.method === 'PUT'
      && request.body.includes('"characterId":7')
    ))).toBe(true))
    await user.selectOptions(screen.getByLabelText('Public identity'), 'alias')
    await user.type(screen.getByLabelText('Public trainer alias'), 'Runner')
    await user.click(screen.getByLabelText('Show cached guild'))
    await user.click(screen.getByRole('button', { name: 'Save privacy' }))
    await waitFor(() => expect(requests.some(request => (
      request.url.endsWith('/v1/me/privacy')
      && request.body.includes('"identityMode":"alias"')
      && request.body.includes('"alias":"Runner"')
      && request.body.includes('"showGuild":true')
    ))).toBe(true))
  })
})
