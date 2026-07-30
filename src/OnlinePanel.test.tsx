import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnlinePanel, { BestRunsSummary, GlobalRankingSummary, OnlineStandingSummary } from './OnlinePanel'

afterEach(() => vi.restoreAllMocks())

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

describe('optional online profile', () => {
  it('shows guild names in all three Global podium columns when available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ rows: [
      { rank: 1, profileId: 'one', displayName: 'One', guild: 'Guild One', achievementPoints: 50, runPoints: 100, totalPoints: 150, crystalFlawless: false, hardClear: true },
      { rank: 2, profileId: 'two', displayName: 'Two', guild: 'Guild Two', achievementPoints: 40, runPoints: 90, totalPoints: 130, crystalFlawless: true, hardClear: false },
      { rank: 3, profileId: 'three', displayName: 'Three', guild: 'Guild Three', achievementPoints: 30, runPoints: 80, totalPoints: 110, crystalFlawless: false, hardClear: false },
    ] })))
    render(<GlobalRankingSummary />)
    const podium = await screen.findByLabelText('Global player ranking')
    expect(within(podium).getAllByRole('listitem')).toHaveLength(3)
    for (const guild of ['Guild One', 'Guild Two', 'Guild Three']) expect(within(podium).getByText(guild)).toBeInTheDocument()
  })
  it('shows all four personal board positions and the global position', () => {
    render(<BestRunsSummary session={{
      authenticated: true,
      globalPosition: 7,
      standings: [
        { difficulty: 'normal', duty: 'crystal', score: 1500, durationMs: 1000, position: 1 },
        { difficulty: 'hard', duty: 'non-crystal', score: 1400, durationMs: 1000, position: 4 },
      ],
    }} onOpen={() => undefined} />)
    const card = screen.getByLabelText('Best run standings')
    expect(card).toHaveTextContent('Best runs · Global #7')
    for (const label of ['Normal · crystal', 'Normal · non-crystal', 'Hard · crystal', 'Hard · non-crystal']) expect(card).toHaveTextContent(label)
    expect(card).toHaveTextContent('#1')
    expect(card).toHaveTextContent('#4')
  })
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
    const view = render(<OnlinePanel view="leaderboard" onSession={() => undefined} />)
    expect(screen.queryByRole('link', { name: 'Login with Battle.net' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Global leaderboard' })).toBeInTheDocument()
    await userEvent.click(within(view.container).getByRole('button', { name: 'Runs' }))
    expect(await within(view.container).findByText('1200 pts · 300.0s')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top 10 leaderboard' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View full leaderboard' })).not.toBeInTheDocument()
    view.rerender(<OnlinePanel view="profile" onSession={() => undefined} />)
    expect(screen.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
      'href',
      'http://127.0.0.1:8787/v1/auth/battlenet/start?region=eu',
    )
    await userEvent.selectOptions(screen.getByLabelText('Battle.net region'), 'us')
    expect(screen.getByRole('link', { name: 'Login with Battle.net' })).toHaveAttribute(
      'href',
      'http://127.0.0.1:8787/v1/auth/battlenet/start?region=us',
    )
    const login = screen.getByRole('link', { name: 'Login with Battle.net' })
    login.addEventListener('click', event => event.preventDefault())
    await userEvent.click(login)
    expect(screen.getByRole('link', { name: 'Redirecting to Battle.net' })).toHaveTextContent('Redirecting to Battle.net…')
    expect(screen.getByRole('link', { name: 'Redirecting to Battle.net' }).querySelector('.online-login-spinner')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy.html')
  })

  it('shows the global position beside the compact profile actions', async () => {
    const onLogout = vi.fn()
    render(<OnlineStandingSummary onManage={() => undefined} onLogout={onLogout} session={{
      authenticated: true,
      csrfToken: 'csrf',
      globalPosition: 4,
      standings: [
        { difficulty: 'normal', duty: 'crystal', position: 8, score: 1100, durationMs: 300_000 },
        { difficulty: 'hard', duty: 'non-crystal', position: 3, score: 1300, durationMs: 290_000 },
      ],
    }} />)
    expect(screen.getByLabelText('Current online standings')).toHaveTextContent('Global position #4')
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('uses localhost fixtures only after a successful empty response and opens trainer profiles', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = String(input)
      if (url.endsWith('/v1/me')) return json({ error: 'not_authenticated' }, 401)
      if (url.includes('/v1/leaderboards')) return json({ rows: [] })
      throw new Error(`unexpected ${url}`)
    }))
    render(<OnlinePanel view="leaderboard" onSession={() => undefined} />)
    const panel = document.body.lastElementChild as HTMLElement
    await userEvent.click(within(panel).getByRole('button', { name: 'Runs' }))
    const character = await screen.findByRole('button', { name: 'Nightbloom-HC01' }, { timeout: 3000 })
    expect(character.closest('ol')).toHaveTextContent('Dawnshield-HC02')
    expect(character.closest('ol')?.querySelectorAll('li')).toHaveLength(10)
    expect(screen.getByLabelText('Your leaderboard position')).toHaveTextContent('65. Your localhost test position')
    await userEvent.click(screen.getByRole('button', { name: 'Normal · Non-crystal' }))
    expect(await screen.findByRole('button', { name: 'Riftwalker-NN01' })).toBeInTheDocument()
    expect(document.querySelector('.leaderboard-rows')?.querySelectorAll('li')).toHaveLength(10)
  })

  it('presents a distinct account-wide Achievement Hall with an own-position row', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const url = String(input)
      if (url.endsWith('/v1/me')) return json({ error: 'not_authenticated' }, 401)
      if (url.includes('/v1/leaderboards')) return json({ rows: [] })
      if (url.includes('/v1/achievement-hall')) return json({ rows: [], own: null, total: 0 })
      throw new Error(`unexpected ${url}`)
    }))
    const view = render(<OnlinePanel view="leaderboard" onSession={() => undefined} />)
    await userEvent.click(within(view.container).getByRole('button', { name: 'Achievement Hall' }))
    expect(await within(view.container).findByRole('heading', { name: 'Achievement Hall of Fame' })).toBeInTheDocument()
    expect(within(view.container).getByRole('heading', { name: 'Hall of Fame' })).toBeInTheDocument()
    expect(within(view.container).queryByText('Beyond the Impossible')).not.toBeInTheDocument()
    expect(within(view.container).getAllByText(/pts$/)).toHaveLength(10)
    expect(within(view.container).getByLabelText('Your achievement Hall position')).toHaveTextContent('65. Your Hall of Fame position')
    expect(within(view.container).getByRole('list').querySelectorAll('li')).toHaveLength(10)
    expect(within(view.container).queryByRole('button', { name: 'View full Hall' })).not.toBeInTheDocument()
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
        standings: [{ difficulty: 'hard', duty: 'crystal', position: 18, score: 1110, durationMs: 320000 }],
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
    const view = render(<OnlinePanel view="profile" onSession={() => undefined} />)
    const heading = await within(view.container).findByRole('heading', { name: 'My characters' })
    const panel = heading.closest('section')!
    expect(within(panel).queryByText('Verified public rankings')).not.toBeInTheDocument()
    const character = within(panel).getByLabelText(/Active character/)
    await user.selectOptions(character, '7')
    await waitFor(() => expect(requests.some(request => (
      request.url.endsWith('/v1/me/character')
      && request.method === 'PUT'
      && request.body.includes('"characterId":7')
    ))).toBe(true))
    expect(screen.getByText('Character selected and saved.')).toBeInTheDocument()
    await user.selectOptions(within(panel).getByLabelText(/Leaderboard name/), 'alias')
    await user.type(within(panel).getByLabelText('Public trainer alias'), 'Runner')
    await user.click(within(panel).getByLabelText(/Show my guild on leaderboard rows/))
    await user.click(within(panel).getByRole('button', { name: 'Save leaderboard visibility' }))
    await waitFor(() => expect(requests.some(request => (
      request.url.endsWith('/v1/me/privacy')
      && request.body.includes('"identityMode":"alias"')
      && request.body.includes('"alias":"Runner"')
      && request.body.includes('"showGuild":true')
    ))).toBe(true))
    view.rerender(<OnlinePanel view="leaderboard" onSession={() => undefined} />)
    const leaderboardPanel = view.container.querySelector('section')!
    expect(within(leaderboardPanel).getByText('Verified rankings')).toBeInTheDocument()
    await user.click(within(leaderboardPanel).getByRole('button', { name: 'Runs' }))
    expect(within(leaderboardPanel).getByText(/Searches public character names/)).toBeInTheDocument()
    expect(within(leaderboardPanel).queryByLabelText(/Active character/)).not.toBeInTheDocument()
    expect(within(leaderboardPanel).getByLabelText('Your leaderboard position')).toHaveTextContent('18. Your verified position')
  })
})
