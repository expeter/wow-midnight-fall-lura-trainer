import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(() => vi.restoreAllMocks())

describe('online attempt integration', () => {
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
    await screen.findByLabelText('Verified character')
    await user.click(screen.getByRole('button', { name: 'normal' }))
    await user.click(screen.getByRole('button', { name: 'Enter P1' }))
    await waitFor(() => expect(requests.some(request => request.url.endsWith('/v1/attempts'))).toBe(true))
    const issuance = requests.find(request => request.url.endsWith('/v1/attempts'))!
    expect(issuance.body).toContain('"difficulty":"normal"')
    expect(issuance.body).toContain('"entryMode":"arena0"')
    expect(issuance.body).toMatch(/"configurationFingerprint":"[a-f0-9]{64}"/)
    expect(view.container.querySelector('[data-event="p1-countdown"]')).toBeInTheDocument()
  })
})
