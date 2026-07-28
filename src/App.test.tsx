import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import App from './App'

const asgardRaidPlanCode = btoa(encodeURIComponent(JSON.stringify({
  positions: Array.from({ length: 20 }, (_, index) => ({ x: 350 + index, y: 270 })),
  p2Positions: Array.from({ length: 20 }, (_, index) => ({ x: 430 + index, y: 270 })),
  p2SpreadPositions: Array.from({ length: 20 }, (_, index) => ({ x: 440 + index, y: 250 })),
  p3Positions: Array.from({ length: 20 }, (_, index) => ({ x: 410 + index, y: 390 })),
  p3BossPositions: [{ x: 430, y: 390 }, { x: 530, y: 390 }],
  startSlots: [{ x: 480, y: 490 }, { x: 250, y: 270 }, { x: 710, y: 270 }, { x: 480, y: 40 }],
  profiles: Array.from({ length: 20 }, (_, index) => ({
    name: index === 0 ? 'aero' : index === 19 ? 'Pestivator' : `Player ${index + 1}`,
    playerClass: 'mage',
    crystal: [8, 11, 12, 15, 16, 18].includes(index),
  })),
  crystalAssignments: {
    intermission: [8, 11, 12, 15, 16, 18],
    p2: [8, 11, 12, 15, 16, 18],
    p3: [8, 11, 12, 15, 16, 18],
  },
})))

describe('player menu', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('lura-entry-mode', 'arena1')
    window.location.hash = ''
    vi.mocked(window.speechSynthesis.getVoices).mockReturnValue([])
    vi.mocked(fetch).mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({ version: '0.1.0', revision: 'unknown', builtAt: new Date(0).toISOString() }),
    } as Response)
  })
  afterEach(() => cleanup())

  it('defaults new users to P1 and restores the last selected practice phase', async () => {
    localStorage.removeItem('lura-entry-mode')
    const user = userEvent.setup()
    const view = render(<App />)
    expect(screen.getByRole('button', { name: /^p1$/i })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: /enter p1/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^p3$/i }))
    await waitFor(() => expect(localStorage.getItem('lura-entry-mode')).toBe('arena3'))
    view.unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: /^p3$/i })).toHaveClass('selected')
    expect(screen.getByRole('button', { name: /enter p3/i })).toBeInTheDocument()
  })

  it('persists the selected Phase 1 rune-panel orientation', async () => {
    const user = userEvent.setup()
    render(<App />)
    const hudSettings = screen.getByRole('group', { name: 'Phase 1 HUD' })
    const orientation = within(hudSettings).getByLabelText('P1 rune panel orientation')
    expect(within(screen.getByRole('group', { name: 'Difficulty & movement' })).queryByLabelText('P1 rune panel orientation')).not.toBeInTheDocument()
    expect(orientation).toHaveValue('pentagram')
    await user.selectOptions(orientation, 'positional')
    await waitFor(() => expect(localStorage.getItem('lura-p1-rune-panel-orientation')).toBe('positional'))
  })
  it('derives crystal duty from the phase roster and starts with a countdown', async () => { const user = userEvent.setup(); render(<App />); fireEvent.change(screen.getByLabelText(/assignment position/i), { target: { value: '1' } }); expect(screen.getByLabelText(/intermission crystal 1/i)).toHaveValue('1'); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByText(/Get ready/i)).toBeInTheDocument(); expect(screen.getByText('3')).toBeInTheDocument(); expect(screen.getByText(/CRYSTAL CARRIER/i)).toBeInTheDocument(); expect(screen.getByText(/You received a crystal · Intermission/i)).toBeInTheDocument(); expect(screen.getByText('The veil shudders with every step.')).toBeInTheDocument(); expect(screen.queryByText(/MAIN ABILITY READY/i)).not.toBeInTheDocument(); expect(screen.getByText('Points')).toBeInTheDocument(); expect(document.querySelector('.hud')).not.toBeInTheDocument() })
  it('shows the assignment control and difficulty choices', () => { render(<App />); expect(screen.getByLabelText(/assignment position/i)).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'easy' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'hard' })).toBeInTheDocument() })
  it('offers the released P1 encounter before Intermission', async () => {
    const user = userEvent.setup()
    render(<App />)
    const p1 = screen.getByRole('button', { name: /^p1$/i })
    const intermission = screen.getByRole('button', { name: /^intermission$/i })
    expect(p1).toBeEnabled()
    expect(p1.compareDocumentPosition(intermission) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(p1)
    expect(screen.getByRole('button', { name: /enter p1/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/phase 1 position map/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phase 1 crystal assignments/i)).toBeInTheDocument()
  })
  it('allows a Phase 1 assignment inside the visual middle bubble without silently clamping it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^p1$/i }))
    const map = screen.getByLabelText(/phase 1 position map/i)
    Object.defineProperty(map, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, right: 952, bottom: 535.5, width: 952, height: 535.5, x: 0, y: 0, toJSON: () => ({}) }) })
    const firstPlayer = screen.getByRole('button', { name: /^move p1 player 1$/i })
    Object.defineProperty(firstPlayer, 'setPointerCapture', { value: () => undefined })
    fireEvent.pointerDown(firstPlayer, { pointerId: 1 })
    fireEvent.pointerMove(map, { pointerId: 1, clientX: 476, clientY: 267.75 })
    fireEvent.pointerUp(map, { pointerId: 1 })
    const boss = screen.getByRole('button', { name: /move phase 1 l’ura/i })
    Object.defineProperty(boss, 'setPointerCapture', { value: () => undefined })
    fireEvent.pointerDown(boss, { pointerId: 2 })
    fireEvent.pointerMove(map, { pointerId: 2, clientX: 360, clientY: 460 })
    fireEvent.pointerUp(map, { pointerId: 2 })
    await user.click(screen.getByRole('button', { name: /save layout/i }))
    expect(JSON.parse(localStorage.getItem('lura-p1-player-positions') || '[]')[0]).toEqual({ x: 480, y: 270 })
    expect(JSON.parse(localStorage.getItem('lura-p1-boss-position') || 'null')).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }))
  })
  it('copies the build identifier and links GitHub, changelog, and issue filing', async () => { const user = userEvent.setup(); const writeText = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } }); render(<App />); const build = screen.getByLabelText(/build information/i); expect(build).toHaveTextContent(/v0\.3\.0 · (?:unknown|[0-9a-f]{7}) · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC/); fireEvent.click(screen.getByRole('button', { name: /v0\.3\.0.*copy/i })); await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^v0\.3\.0 · (?:unknown|[0-9a-f]{7}) · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/))); expect(screen.getByRole('link', { name: /^github/i })).toHaveAttribute('href', 'https://github.com/expeter/wow-midnight-fall-lura-trainer'); expect(screen.getByRole('link', { name: /changelog/i })).toHaveAttribute('href', 'https://github.com/expeter/wow-midnight-fall-lura-trainer/blob/main/CHANGELOG.md'); expect(screen.getByRole('link', { name: /file an issue/i })).toHaveAttribute('href', 'https://github.com/expeter/wow-midnight-fall-lura-trainer/issues/new/choose'); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByLabelText(/build information/i)).toBeInTheDocument() })
  it('offers to load a newly deployed Git revision', async () => { vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ version: '0.1.1', revision: 'abcdef1', builtAt: new Date().toISOString() }) } as Response); const user = userEvent.setup(); render(<App />); const alert = await screen.findByRole('alert'); expect(alert).toHaveTextContent(/new trainer version available.*abcdef1/i); expect(within(alert).getByRole('button', { name: /load new version/i })).toBeInTheDocument(); await user.click(within(alert).getByRole('button', { name: /later/i })); expect(screen.queryByRole('alert')).not.toBeInTheDocument() })
  it('offers direct P3 and P4 practice', async () => { const user = userEvent.setup(); render(<App />); expect(screen.getByRole('button', { name: /^p3$/i })).toBeEnabled(); expect(screen.getByRole('button', { name: /^p4$/i })).toBeEnabled(); await user.click(screen.getByRole('button', { name: /^p3$/i })); await user.click(screen.getByRole('button', { name: /enter p3/i })); expect(screen.getByText(/Get ready for Phase 3/i)).toBeInTheDocument(); expect(screen.getByText(/PHASE 3 · SECTOR 1 \/ 2/i)).toBeInTheDocument() })
  it('initializes direct P3 practice with the configured Soak health', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /^p3$/i })); await user.click(screen.getByRole('button', { name: /enter p3/i })); expect(document.querySelector('.arena-wrap')).toHaveAttribute('data-p3-pool-health', '29.75,29.75,29.75,29.75,29.75,29.75') })
  it('reloads the selected Phase 3 crystal roster when entering P3 directly', async () => { const user = userEvent.setup(); const view = render(<App />); await user.selectOptions(screen.getByLabelText(/phase 3 crystal 1/i), '0'); await waitFor(() => expect(JSON.parse(localStorage.getItem('lura-p3-crystal-assignments') || '[]')).toContain(0)); view.unmount(); render(<App />); await user.click(screen.getByRole('button', { name: /^p3$/i })); await user.click(screen.getByRole('button', { name: /enter p3/i })); expect(screen.getByText(/You received a crystal · P3/i)).toBeInTheDocument(); expect(screen.getByText(/PHASE 3 .* CRYSTAL CARRIER/i)).toBeInTheDocument() })
  it('previews a clearly marked full completion screen without unlocking achievements', async () => { const user = userEvent.setup(); render(<App />); expect(screen.queryByRole('button', { name: /preview final screen/i })).not.toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'test' })); await user.click(screen.getByRole('button', { name: /preview final screen/i })); expect(screen.getByText('RESULT SCREEN PREVIEW')).toBeInTheDocument(); expect(screen.getByText(/Preview data only/i)).toBeInTheDocument(); expect(screen.getByRole('heading', { name: /L’ura conquered/i })).toBeInTheDocument(); expect(screen.getByLabelText('Phase results').querySelectorAll('article')).toHaveLength(4); expect(localStorage.getItem('lura-achievement-collection')).toBeNull() })
  it('enters Phase 4 directly with a locked countdown instead of the P3 regroup', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /^p4$/i })); await user.click(screen.getByRole('button', { name: /enter p4/i })); expect(screen.getByRole('heading', { name: /Get ready for Phase 4/i })).toBeInTheDocument(); expect(screen.getByText('3')).toBeInTheDocument(); expect(screen.queryByText(/Run to the north stack/i)).not.toBeInTheDocument(); expect(screen.getByText(/PHASE 4 · RAID STACK/i)).toBeInTheDocument() })
  it('shows elapsed time and recent failures inside the Test-mode arena', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: 'test' })); await user.click(screen.getByRole('button', { name: /^p3$/i })); await user.click(screen.getByRole('button', { name: /enter p3/i })); const panel = screen.getByLabelText(/test mode recent failures/i); expect(panel).toHaveTextContent('TEST FAILURES'); expect(panel.querySelector('header time')).toHaveTextContent(/s$/); expect(panel).toHaveTextContent('No failures yet.') })
  it('keeps the recent-failures panel visible in regular difficulties', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByLabelText('Recent failures')).toHaveTextContent('RECENT FAILURES'); expect(screen.getByLabelText('Recent failures')).toHaveTextContent('No failures yet.') })
  it('copies the selectable bottom-left failure log', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByLabelText('Recent failures')).toHaveClass('selectable-log'); await user.click(screen.getByRole('button', { name: /copy failure log/i })); expect(await screen.findByRole('button', { name: /failure log copied/i })).toBeInTheDocument() })
  it('explains recoverable wipes outside Hard mode', async () => { const user = userEvent.setup(); render(<App />); expect(screen.getByText(/first wipe costs 500 points/i)).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'hard' })); expect(screen.getByText(/wipe ends the attempt immediately/i)).toBeInTheDocument() })
  it('assigns a name and WoW class color and saves all profiles', async () => { const user = userEvent.setup(); render(<App />); await user.clear(screen.getByLabelText(/raid position name/i)); await user.type(screen.getByLabelText(/raid position name/i), 'Lunara'); await user.selectOptions(screen.getByLabelText(/player class and color/i), 'mage'); await user.click(screen.getByRole('button', { name: /save layout/i })); const saved = JSON.parse(localStorage.getItem('lura-player-profiles') || '[]'); expect(saved).toHaveLength(20); expect(saved[0]).toMatchObject({ name: 'Lunara', playerClass: 'mage', crystal: false }) })
  it('shows four configurable raid-plan start slots and saves them', async () => { const user = userEvent.setup(); render(<App />); expect(screen.getAllByRole('button', { name: /start slot/i })).toHaveLength(4); await user.click(screen.getByRole('button', { name: /save layout/i })); expect(JSON.parse(localStorage.getItem('lura-start-slots') || '[]')).toHaveLength(4) })
  it('creates a shareable raid-plan link and supports P pause/resume', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /copy share link/i })); expect((screen.getByLabelText(/raid plan share code/i) as HTMLInputElement).value).toContain('#raidplan='); await user.click(screen.getByRole('button', { name: /enter arena/i })); await user.keyboard('p'); expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument(); await user.keyboard('p'); expect(screen.getByRole('button', { name: /^pause$/i })).toBeInTheDocument() })
  it('fetches the bundled I Asgard I raid plan into localhost and persists it without navigating away', async () => {
    vi.mocked(fetch).mockImplementation(async input => String(input).includes('raidplans/asgard.txt')
      ? { ok: true, text: async () => asgardRaidPlanCode } as Response
      : { ok: true, json: async () => ({ version: '0.1.0', revision: 'unknown', builtAt: new Date(0).toISOString() }) } as Response)
    const user = userEvent.setup()
    render(<App />)
    const loader = screen.getByRole('button', { name: /load i asgard i raid plan/i })
    expect(loader).toHaveTextContent(/loads here and saves to this browser/i)
    expect(window.location.hash).toBe('')
    await user.click(loader)
    expect(await screen.findByText('I Asgard I raid plan loaded and saved')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lura-player-profiles') || '[]')[0].name).toBe('aero')
    expect(JSON.parse(localStorage.getItem('lura-player-positions') || '[]')).toHaveLength(20)
    expect(JSON.parse(localStorage.getItem('lura-p1-player-positions') || '[]')[0]).toEqual({ x: 368.5307864874153, y: 462.59201659297275 })
    expect(JSON.parse(localStorage.getItem('lura-p1-boss-position') || 'null')).toEqual({ x: 378.84170305676855, y: 473.1239082969432 })
    expect(JSON.parse(localStorage.getItem('lura-p3-crystal-assignments') || '[]')).toHaveLength(6)
    expect((screen.getByLabelText(/raid plan share code/i) as HTMLInputElement).value).toMatch(/^http:\/\/localhost(?::\d+)?\/#raidplan=/)
    expect(window.location.hash).toBe('')
  })
  it('uses the bundled I Asgard I plan for the first visit while preserving explicit local plans', async () => {
    vi.mocked(fetch).mockImplementation(async input => String(input).includes('raidplans/asgard.txt')
      ? { ok: true, text: async () => asgardRaidPlanCode } as Response
      : { ok: true, json: async () => ({ version: '0.1.0', revision: 'unknown', builtAt: new Date(0).toISOString() }) } as Response)
    const firstVisit = render(<App />)
    await waitFor(() => expect(JSON.parse(localStorage.getItem('lura-player-profiles') || '[]')).toHaveLength(20))
    const guildProfiles = JSON.parse(localStorage.getItem('lura-player-profiles') || '[]')
    expect(guildProfiles[0].name).toBe('aero')
    expect(guildProfiles[19].name).toBe('Pestivator')
    firstVisit.unmount()

    guildProfiles[0].name = 'My saved setup'
    localStorage.setItem('lura-player-profiles', JSON.stringify(guildProfiles))
    vi.mocked(fetch).mockClear()
    render(<App />)
    expect(screen.getByLabelText(/raid position name/i)).toHaveValue('My saved setup')
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes('raidplans/asgard.txt'))).toBe(false)
  })
  it('uses a consistent setup hierarchy for game, input, HUD, sharing, and phase plans', () => {
    render(<App />)
    const gameHeading = screen.getByRole('heading', { name: /practice configuration/i })
    const difficulty = screen.getByRole('group', { name: /difficulty & movement/i })
    const assignment = screen.getByRole('group', { name: /selected assignment/i })
    const combat = screen.getByRole('group', { name: /^combat actions$/i })
    const keyboardHeading = screen.getByRole('heading', { name: /keyboard & mouse controls/i })
    const input = screen.getByRole('group', { name: /input bindings/i })
    const hudHeading = screen.getByRole('heading', { name: /hud positions/i })
    const hud = screen.getByLabelText(/phase 2 hud layout preview/i)
    const raidHeading = screen.getByRole('heading', { name: /layouts and sharing/i })
    const sharing = screen.getByRole('group', { name: /raid-plan sharing/i })
    const planHeading = screen.getByRole('heading', { name: /opening positions/i })
    const firstPlan = screen.getByLabelText(/intermission position map/i)

    expect(screen.getByText('GAME SETTINGS')).toBeInTheDocument()
    expect(screen.getByText('KEYBOARD SETTINGS')).toBeInTheDocument()
    expect(screen.getByText('INTERFACE')).toBeInTheDocument()
    expect(screen.getByText('RAID PLANNING')).toBeInTheDocument()
    expect(screen.getByText('INTERMISSION RAID PLAN')).toBeInTheDocument()
    const setupNav = screen.getByRole('navigation', { name: /setup sections/i })
    expect(within(setupNav).getAllByRole('link')).toHaveLength(4)
    expect(within(setupNav).getByRole('link', { name: /game settings/i })).toHaveAttribute('href', '#game-settings')
    expect(within(setupNav).getByRole('link', { name: /keyboard settings/i })).toHaveAttribute('href', '#keyboard-settings')
    expect(within(setupNav).getByRole('link', { name: /^hud$/i })).toHaveAttribute('href', '#hud-settings')
    expect(within(setupNav).getByRole('link', { name: /raid plan/i })).toHaveAttribute('href', '#raid-planning')
    expect(screen.getAllByRole('link', { name: /back to top from/i })).toHaveLength(4)
    expect(gameHeading.parentElement).toHaveClass('plan-heading', 'setup-section-heading')
    expect(keyboardHeading.parentElement).toHaveClass('plan-heading', 'setup-section-heading')
    expect(difficulty.parentElement).toHaveClass('setup-grid')
    expect(assignment.parentElement).toBe(difficulty.parentElement)
    expect(combat.parentElement).toBe(difficulty.parentElement)

    const ordered = [gameHeading, difficulty, keyboardHeading, input, hudHeading, hud, raidHeading, sharing, planHeading, firstPlan]
    ordered.slice(0, -1).forEach((element, index) => {
      expect(element.compareDocumentPosition(ordered[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
  it('shows the Season 2 recruitment banner outside the arena only', async () => { const user = userEvent.setup(); render(<App />); const link = screen.getByRole('link', { name: /asgard.*raider\.io/i }); expect(link).toHaveAttribute('href', 'https://raider.io/guilds/eu/blackrock/IAsgardI'); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.queryByRole('link', { name: /asgard.*raider\.io/i })).not.toBeInTheDocument() })
  it('centers the phase title in a three-column header and moves build information to the status bar', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /enter arena/i })); const title = screen.getByRole('heading', { name: 'Get ready.' }); expect(title.parentElement).toHaveClass('game-top'); const build = screen.getByLabelText(/build information/i); expect(build).toHaveClass('game-build-indicator'); expect(build.parentElement).toHaveClass('controls') })
  it('loads and persists a hash raid plan instead of falling back to an older local layout', async () => {
    const user = userEvent.setup()
    const view = render(<App />)
    const name = screen.getByLabelText(/raid position name/i)
    await user.clear(name)
    await user.type(name, 'Shared Player')
    await user.click(screen.getByRole('button', { name: /copy share link/i }))
    const link = (screen.getByLabelText(/raid plan share code/i) as HTMLInputElement).value
    const payload = JSON.parse(decodeURIComponent(atob(link.split('#raidplan=')[1])))
    payload.profiles[14].name = 'Zoxzy'
    payload.p3Positions[14] = { x: 553, y: 398 }
    payload.p3Positions[19] = { x: 409, y: 421 }
    localStorage.setItem('lura-p3-player-positions', JSON.stringify(Array.from({ length: 20 }, () => ({ x: 410, y: 400 }))))
    window.location.hash = `#raidplan=${btoa(encodeURIComponent(JSON.stringify(payload)))}`
    await waitFor(() => expect(name).toHaveValue('Shared Player'))
    expect(screen.getByText('Shared raid plan loaded')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]')[14]).toEqual({ x: 553, y: 398 })
    expect(JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]')[19]).toEqual({ x: 409, y: 421 })
    expect(parseFloat(screen.getByRole('button', { name: 'Move P3 player 15' }).style.left)).toBeGreaterThan(50)
    view.unmount()
    window.location.hash = ''
    render(<App />)
    expect(parseFloat(screen.getByRole('button', { name: 'Move P3 player 15' }).style.left)).toBeGreaterThan(50)
  })
  it('persists a manually loaded raid plan immediately', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.clear(screen.getByLabelText(/raid position name/i))
    await user.type(screen.getByLabelText(/raid position name/i), 'Manual Shared')
    await user.click(screen.getByRole('button', { name: /copy share link/i }))
    const link = (screen.getByLabelText(/raid plan share code/i) as HTMLInputElement).value
    await user.clear(screen.getByLabelText(/raid position name/i))
    await user.type(screen.getByLabelText(/raid position name/i), 'Stale Local Player')
    fireEvent.change(screen.getByLabelText(/raid plan share code/i), { target: { value: link } })
    await user.click(screen.getByRole('button', { name: /load shared plan/i }))
    expect(screen.getByText('Shared raid plan loaded and saved')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lura-player-profiles') || '[]')[0].name).toBe('Manual Shared')
    expect(JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]')).toHaveLength(20)
    expect(JSON.parse(localStorage.getItem('lura-p3-boss-positions') || '[]')).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem('lura-p3-crystal-assignments') || '[]')).toHaveLength(6)
  })
  it('persists a player-name override and keeps the raid position on the result certificate', async () => { const user = userEvent.setup(); render(<App />); await user.clear(screen.getByLabelText(/raid position name/i)); await user.type(screen.getByLabelText(/raid position name/i), 'Assigned Mage'); await user.type(screen.getByLabelText(/your player name/i), 'Pestivator'); await waitFor(() => expect(localStorage.getItem('lura-player-name')).toBe('Pestivator')); await user.click(screen.getByRole('button', { name: 'test' })); await user.click(screen.getByRole('button', { name: /preview final screen/i })); expect(screen.getByRole('heading', { name: 'Pestivator' })).toHaveClass('completion-player-name'); expect(screen.getByText(/Played position: Assigned Mage — Spot 1/i)).toBeInTheDocument() })
  it('explains the independent look, facing, and zoom controls', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByText(/left-drag look · right-drag view \+ face · wheel zoom/i)).toBeInTheDocument() })
  it('defaults vertical camera inversion on and persists independent camera choices', async () => { const user = userEvent.setup(); render(<App />); const horizontal = screen.getByLabelText(/invert camera horizontal/i); const vertical = screen.getByLabelText(/invert camera vertical/i); expect(horizontal).not.toBeChecked(); expect(vertical).toBeChecked(); await user.click(horizontal); await user.click(vertical); await waitFor(() => { expect(localStorage.getItem('lura-invert-camera-x')).toBe('true'); expect(localStorage.getItem('lura-invert-camera-y')).toBe('false') }) })
  it('shows zoom information in the bottom status bar instead of over the arena', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByText(/Zoom 16\.0 yd/i).closest('.controls')).toBeInTheDocument(); expect(document.querySelector('.zoom-readout')).not.toBeInTheDocument() })
  it('keeps the opening boost, recovery actions, and Main ability permanent on Easy', async () => { localStorage.setItem('lura-opening-speed-bonus', 'false'); localStorage.setItem('lura-health-pot-enabled', 'false'); const user = userEvent.setup(); render(<App />); expect(screen.queryByLabelText(/opening movement bonus/i)).not.toBeInTheDocument(); expect(screen.queryByLabelText(/enable main ability|enable health potion|enable shield/i)).not.toBeInTheDocument(); expect(screen.getByText(/40% opening movement boost is always active/i)).toBeInTheDocument(); expect(screen.getByText(/Health potion · Num Del/i)).toBeInTheDocument(); expect(screen.getByText(/Shield · Num 7/i)).toBeInTheDocument(); expect(screen.getByText(/Main ability · F/i)).toBeInTheDocument(); await waitFor(() => { expect(localStorage.getItem('lura-opening-speed-bonus')).toBeNull(); expect(localStorage.getItem('lura-health-pot-enabled')).toBeNull() }); await user.click(screen.getByRole('button', { name: 'easy' })); expect(screen.getAllByText(/one charge per phase/i)).toHaveLength(2) })
  it('rebinds gameplay actions and always displays recovery charges above the health HUD', async () => { const user = userEvent.setup(); render(<App />); const forward = screen.getByLabelText(/forward keybind/i); fireEvent.keyDown(forward, { code: 'KeyI', key: 'i' }); expect(forward).toHaveValue('I'); await waitFor(() => expect(JSON.parse(localStorage.getItem('lura-keybindings') || '{}').forward).toBe('KeyI')); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByText(/100%/i)).toBeInTheDocument(); const charges = screen.getByLabelText(/recovery charges/i); expect(charges).toHaveTextContent('Num Del'); expect(charges).toHaveTextContent('Num 7') })
  it('allows an Easy-mode recovery charge and greys it out after use', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: 'easy' })); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByTitle('Health potion ready')).toBeInTheDocument(); fireEvent.keyDown(window, { code: 'NumpadDecimal' }); expect(screen.getByTitle('Health potion used until next phase')).toHaveClass('used'); expect(screen.getByTitle('Shield ready')).not.toHaveClass('used') })
  it('provides configurable Q/E keyboard turning and persists its speed', async () => { render(<App />); expect(screen.getByLabelText(/rotate left keybind/i)).toHaveValue('Q'); expect(screen.getByLabelText(/rotate right keybind/i)).toHaveValue('E'); expect(screen.getByLabelText(/keyboard rotation speed/i)).toHaveValue('150'); fireEvent.change(screen.getByLabelText(/keyboard rotation speed/i), { target: { value: '210' } }); await waitFor(() => expect(localStorage.getItem('lura-player-rotation-speed')).toBe('210')); const rotateLeft = screen.getByLabelText(/rotate left keybind/i); fireEvent.keyDown(rotateLeft, { code: 'KeyZ', key: 'z' }); expect(rotateLeft).toHaveValue('Z') })
  it('moves mouse options into the aligned input settings and marks displaced duplicate bindings', () => { render(<App />); const settings = screen.getByRole('group', { name: /input bindings/i }); expect(within(settings).getByLabelText(/invert camera horizontal/i)).toBeInTheDocument(); expect(within(settings).getByLabelText(/invert camera vertical/i)).toBeInTheDocument(); const forward = within(settings).getByLabelText(/forward keybind/i); const rotateLeft = within(settings).getByLabelText(/rotate left keybind/i); fireEvent.keyDown(rotateLeft, { code: 'KeyW', key: 'w' }); expect(rotateLeft).toHaveValue('W'); expect(forward).toHaveValue(''); expect(forward).toHaveAttribute('aria-invalid', 'true'); expect(forward).toHaveClass('missing-keybind') })
  it('persists and displays the global simulation speed', async () => { const user = userEvent.setup(); render(<App />); fireEvent.change(screen.getByLabelText(/global game speed/i), { target: { value: '2' } }); await waitFor(() => expect(localStorage.getItem('lura-game-speed')).toBe('2')); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByText(/2\.00×/i)).toBeInTheDocument() })
  it('provides and saves separate twenty-player Phase 2 soak and spread assignments', async () => { const user = userEvent.setup(); render(<App />); expect(screen.getByLabelText(/phase 2 soak position map/i)).toBeInTheDocument(); expect(screen.getByLabelText(/phase 2 spread position map/i)).toBeInTheDocument(); expect(screen.getAllByRole('button', { name: /move p2 soak player/i })).toHaveLength(20); expect(screen.getAllByRole('button', { name: /move p2 spread player/i })).toHaveLength(20); await user.click(screen.getByRole('button', { name: /save layout/i })); expect(JSON.parse(localStorage.getItem('lura-p2-player-positions') || '[]')).toHaveLength(20); expect(JSON.parse(localStorage.getItem('lura-p2-spread-positions') || '[]')).toHaveLength(20) })
  it('provides, saves, and shares the Phase 3 players and movable bosses', async () => { const user = userEvent.setup(); render(<App />); expect(screen.getByLabelText(/phase 3 initial position map/i)).toBeInTheDocument(); expect(screen.getAllByRole('button', { name: /move p3 player/i })).toHaveLength(20); expect(screen.getAllByRole('button', { name: /move p3 .* boss/i })).toHaveLength(2); await user.click(screen.getByRole('button', { name: /save layout/i })); expect(JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]')).toHaveLength(20); expect(JSON.parse(localStorage.getItem('lura-p3-boss-positions') || '[]')).toHaveLength(2); await user.click(screen.getByRole('button', { name: /copy share link/i })); const link = (screen.getByLabelText(/raid plan share code/i) as HTMLInputElement).value; const payload = JSON.parse(decodeURIComponent(atob(link.split('#raidplan=')[1]))); expect(payload.p3Positions).toHaveLength(20); expect(payload.p3BossPositions).toHaveLength(2) })
  it('keeps the Phase 3 planner at content width with an independent closer viewport', () => { render(<App />); const planner = screen.getByLabelText(/phase 3 initial position map/i); expect(planner).toHaveAttribute('data-planner-scale', '2.8'); expect(planner).toHaveAttribute('data-background-zoom', '325%'); expect(planner).toHaveClass('p3-position-map'); expect(planner).not.toHaveClass('p2-position-map') })
  it('keeps valid southern P3 assignments and explains group selection', async () => { const saved = Array.from({ length: 20 }, (_, index) => ({ x: index < 10 ? 420 : 540, y: 380 })); localStorage.setItem('lura-p3-player-positions', JSON.stringify(saved)); const user = userEvent.setup(); render(<App />); expect(within(screen.getByLabelText(/phase 3 initial position map/i)).getByText(/drag empty space to select a group/i)).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: /save layout/i })); const positions = JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]'); expect(positions[0].y).toBeGreaterThan(270); expect(positions[10].y).toBeGreaterThan(270) })
  it('describes the second P3 sector as rotating toward the south', () => { render(<App />); expect(screen.getByText(/sector two.*rotate toward the south/i)).toBeInTheDocument(); expect(screen.queryByText(/rotate toward the next boss/i)).not.toBeInTheDocument() })
  it('allows Phase 3 planner positions inside the visual inner circle', async () => { const saved = Array.from({ length: 20 }, (_, index) => ({ x: index < 10 ? 440 : 520, y: 270 })); localStorage.setItem('lura-p3-player-positions', JSON.stringify(saved)); const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /save layout/i })); const positions = JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]'); expect(Math.hypot(positions[0].x - 480, positions[0].y - 270)).toBe(40); expect(Math.hypot(positions[10].x - 480, positions[10].y - 270)).toBe(40) })
  it('allows Phase 3 players to cross the visual room divider', async () => { const saved = Array.from({ length: 20 }, (_, index) => ({ x: index === 0 ? 530 : index < 10 ? 420 : 540, y: 380 })); localStorage.setItem('lura-p3-player-positions', JSON.stringify(saved)); const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /save layout/i })); const positions = JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]'); expect(positions[0].x).toBe(530) })
  it('migrates legacy northern P3 player and boss plans to the southern opening', async () => { localStorage.setItem('lura-p3-player-positions', JSON.stringify(Array.from({ length: 20 }, (_, index) => ({ x: index < 10 ? 420 : 540, y: 150 })))); localStorage.setItem('lura-p3-boss-positions', JSON.stringify([{ x: 406, y: 142 }, { x: 554, y: 142 }])); const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /save layout/i })); const positions = JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]'); const bosses = JSON.parse(localStorage.getItem('lura-p3-boss-positions') || '[]'); expect(positions.every((position: { y: number }) => position.y > 270)).toBe(true); expect(bosses.every((boss: { y: number }) => boss.y > 270)).toBe(true) })
  it('lasso-selects and moves the full P3 group with the next map click', () => { render(<App />); const map = screen.getByLabelText(/phase 3 initial position map/i); Object.defineProperty(map, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, right: 952, bottom: 535.5, width: 952, height: 535.5, x: 0, y: 0, toJSON: () => ({}) }) }); Object.defineProperty(map, 'setPointerCapture', { value: () => undefined }); const firstPlayer = screen.getByRole('button', { name: /^move p3 player 1$/i }); const initialTop = firstPlayer.style.top; fireEvent.pointerDown(map, { pointerId: 1, clientX: 1, clientY: 1 }); fireEvent.pointerMove(map, { pointerId: 1, clientX: 951, clientY: 534 }); fireEvent.pointerUp(map, { pointerId: 1, clientX: 951, clientY: 534 }); expect(within(map).getByText(/20 selected · click their destination/i)).toBeInTheDocument(); fireEvent.pointerDown(firstPlayer, { pointerId: 2, clientX: 476, clientY: 470 }); expect(within(map).getByText(/drag empty space to select a group/i)).toBeInTheDocument(); expect(firstPlayer.style.top).not.toBe(initialTop) })
  it('offers the same lasso-and-place interaction on every raid plan', () => { render(<App />); const maps = [/intermission position map/i, /phase 1 position map/i, /phase 2 soak position map/i, /phase 2 spread position map/i, /phase 3 initial position map/i].map(label => screen.getByLabelText(label)); maps.forEach(map => expect(within(map).getByText(/drag empty space to select a group/i)).toBeInTheDocument()); const map = screen.getByLabelText(/phase 2 soak position map/i); Object.defineProperty(map, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, right: 952, bottom: 535.5, width: 952, height: 535.5, x: 0, y: 0, toJSON: () => ({}) }) }); Object.defineProperty(map, 'setPointerCapture', { value: () => undefined }); const firstPlayer = within(map).getByRole('button', { name: /^move p2 soak player 1$/i }); const initialTop = firstPlayer.style.top; fireEvent.pointerDown(map, { pointerId: 1, clientX: 1, clientY: 1 }); fireEvent.pointerMove(map, { pointerId: 1, clientX: 951, clientY: 534 }); fireEvent.pointerUp(map, { pointerId: 1, clientX: 951, clientY: 534 }); expect(within(map).getByText(/20 selected · click their destination/i)).toBeInTheDocument(); fireEvent.pointerDown(firstPlayer, { pointerId: 2, clientX: 476, clientY: 470 }); expect(firstPlayer.style.top).not.toBe(initialTop) })
  it('shows mechanic-sized personal circles on every P2 spread assignment', () => { render(<App />); const spreadMap = screen.getByLabelText(/phase 2 spread position map/i); const rings = spreadMap.querySelectorAll<HTMLElement>('.planner-personal-circle'); expect(rings).toHaveLength(20); expect(parseFloat(rings[0].style.width)).toBeCloseTo(7.2814, 3); expect(screen.getByLabelText(/phase 2 soak position map/i).querySelectorAll('.planner-personal-circle')).toHaveLength(0) })
  it('shows a readable Pestivator card with consistent external-link arrows and no generic Discord link', () => { render(<App />); const card = screen.getByLabelText(/about pestivator/i); expect(card).toHaveTextContent('pestivator#2515'); const raiderLinks = card.querySelectorAll('a[href="https://raider.io/characters/eu/antonidas/Pestivator"]'); expect(raiderLinks).toHaveLength(3); expect(within(card).getByRole('link', { name: 'Raider.IO ↗' })).toBeInTheDocument(); const twitch = screen.getByRole('link', { name: /pestivator on twitch/i }); expect(twitch).toHaveAttribute('href', 'https://twitch.tv/pestivator'); expect(twitch).toHaveTextContent('Twitch.tv ↗'); expect(card.querySelector('a[href*="discord.com"]')).not.toBeInTheDocument(); expect(screen.getByRole('link', { name: /buy me a coffee/i })).toHaveAttribute('href', expect.stringContaining('E684K1q1gzodtZK3xgdBXfTeRQbWWhSu8kVbzZNiw9Cz')); expect(screen.queryByRole('button', { name: /copy solana address/i })).not.toBeInTheDocument(); expect(screen.getByAltText(/gnome avatar/i)).toBeInTheDocument() })
  it('provides six independent crystal selectors beneath each phase plan', () => { render(<App />); for (const phase of ['Phase 1', 'Intermission', 'Phase 2', 'Phase 3']) { const editor = screen.getByLabelText(`${phase} crystal assignments`); expect(within(editor).getAllByRole('combobox')).toHaveLength(6); expect(within(editor).getByLabelText(`${phase} crystal 1`)).toHaveValue('1') } })
  it('uses the darker petrol class color for Monk assignments', () => { render(<App />); expect(screen.getByRole('button', { name: 'Move player 13' })).toHaveStyle({ backgroundColor: '#00a98f' }) })
  it('loads, resets, and persists the draggable HUD layout including the castbar', async () => { localStorage.setItem('lura-hud-layout', JSON.stringify({ mechanic: { x: 22, y: 18 }, beam: { x: 72, y: 31 }, crystal: { x: 66, y: 82 } })); const user = userEvent.setup(); render(<App />); expect(screen.getByLabelText(/phase 2 hud layout preview/i)).toBeInTheDocument(); expect(screen.getByText(/static p2 view · drag the hud boxes/i)).toBeInTheDocument(); expect(screen.getByRole('button', { name: /move beam in counter/i })).toHaveStyle({ left: '72%', top: '31%' }); expect(screen.getByRole('button', { name: /move player health counter/i })).toHaveStyle({ left: '21%', top: '53%' }); expect(screen.getByRole('button', { name: /move main ability counter/i })).toHaveStyle({ left: '50%', top: '65%' }); await user.click(screen.getByRole('button', { name: /reset counter positions/i })); expect(screen.getByRole('button', { name: /move beam in counter/i })).toHaveStyle({ left: '57%', top: '23%' }); await waitFor(() => expect(JSON.parse(localStorage.getItem('lura-hud-layout') || '{}').castbar).toEqual({ x: 50, y: 65 })) })
  it('completes the always-available Main ability before awarding points and firing', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /enter arena/i })); fireEvent.keyDown(window, { code: 'KeyF', key: 'f' }); expect(screen.getByText(/MAIN ABILITY · 1\.0s/i)).toBeInTheDocument(); const castFill = document.querySelector('.main-cast-fill'); expect(castFill).toHaveStyle({ animationDuration: '1s', animationPlayState: 'running' }); expect(screen.getByText(/L’URA · 100\.0%/i)).toBeInTheDocument(); expect(screen.getByText('Points').nextElementSibling).toHaveTextContent('1000'); fireEvent.keyDown(window, { code: 'KeyF', key: 'f' }); expect(document.querySelector('.main-cast-fill')).toBe(castFill); expect(screen.getByText('Points').nextElementSibling).toHaveTextContent('1000'); await waitFor(() => expect(screen.getByText(/L’URA · 99\.5%/i)).toBeInTheDocument(), { timeout: 1800 }); expect(screen.getByText('Points').nextElementSibling).toHaveTextContent('1001') })
  it('finishes a Main ability cast after the live event changes instead of leaving its bar stuck', async () => { const user = userEvent.setup(); render(<App />); fireEvent.change(screen.getByLabelText(/global game speed/i), { target: { value: '2.5' } }); await user.click(screen.getByRole('button', { name: /enter arena/i })); fireEvent.keyDown(window, { code: 'KeyF', key: 'f' }); expect(screen.getByText(/MAIN ABILITY · 1\.0s/i)).toBeInTheDocument(); await waitFor(() => expect(screen.queryByText(/MAIN ABILITY · \d/)).not.toBeInTheDocument(), { timeout: 1400 }); expect(screen.getByText(/L’URA · 99\.5%/i)).toBeInTheDocument(); expect(screen.getByText('Points').nextElementSibling).toHaveTextContent('1001') })
  it('persists the global cosmetic combat-projectile switch', async () => { const user = userEvent.setup(); render(<App />); const toggle = screen.getByLabelText(/show combat projectiles/i); expect(toggle).toBeChecked(); await user.click(toggle); await waitFor(() => expect(localStorage.getItem('lura-combat-projectiles-enabled')).toBe('false')); await user.click(screen.getByRole('button', { name: /enter arena/i })); expect(screen.getByLabelText(/3D L'ura Intermission arena/i)).toHaveAttribute('data-combat-projectiles', 'off') })
  it('moves newly assigned Phase 2 crystal carriers onto an inner spread spot', async () => { const user = userEvent.setup(); render(<App />); await user.selectOptions(screen.getByLabelText(/phase 2 crystal 1/i), '0'); await user.click(screen.getByRole('button', { name: /save layout/i })); const [spot] = JSON.parse(localStorage.getItem('lura-p2-spread-positions') || '[]'); expect(Math.hypot(spot.x - 480, spot.y - 270)).toBeLessThanOrEqual(46.01); expect(JSON.parse(localStorage.getItem('lura-p2-crystal-assignments') || '[]')).toContain(0); expect(JSON.parse(localStorage.getItem('lura-intermission-crystal-assignments') || '[]')).not.toContain(0) })
  it('can enter P2 directly with its own countdown and compact arena HUD', async () => { const user = userEvent.setup(); render(<App />); await user.click(screen.getByRole('button', { name: /^P2$/ })); await user.click(screen.getByRole('button', { name: /enter p2/i })); expect(screen.getByText(/Get ready for Phase 2/i)).toBeInTheDocument(); expect(screen.getByText(/PHASE 2 · CYCLE 1 \/ 3/i)).toBeInTheDocument(); expect(screen.getByText(/raid begins stacked in the middle/i)).toBeInTheDocument(); expect(screen.getByText('Points')).toBeInTheDocument() })
  it('offers two opt-in music tracks and separately persisted opt-in TTS', async () => {
    const user = userEvent.setup()
    render(<App />)
    const music = screen.getByRole('group', { name: /music settings/i })
    const enabled = within(music).getByLabelText(/enable background music/i)
    expect(enabled).not.toBeChecked()
    expect(within(music).getByRole('button', { name: /enable music to preview/i })).toBeDisabled()
    expect(within(music).getAllByRole('option').map(option => option.textContent)).toEqual([
      'Criminal Dark Tech · 8:03',
      'GYM · Beast Mode ON · 8:07',
    ])
    const encounterSounds = screen.getByLabelText(/enable encounter sounds/i)
    expect(encounterSounds).toBeEnabled()
    expect(encounterSounds).not.toBeChecked()
    await user.click(encounterSounds)
    await waitFor(() => expect(localStorage.getItem('lura-encounter-sounds-enabled')).toBe('true'))
    const tts = screen.getByLabelText(/enable raid lead tts/i)
    expect(tts).toBeEnabled()
    expect(tts).not.toBeChecked()
    await user.click(tts)
    await waitFor(() => expect(localStorage.getItem('lura-tts-enabled')).toBe('true'))
    await user.click(enabled)
    await waitFor(() => expect(localStorage.getItem('lura-music-enabled')).toBe('true'))
    expect(within(music).getByRole('button', { name: /play preview/i })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /enter arena/i }))
    expect(screen.getByRole('button', { name: /disable music/i })).toHaveTextContent('Music on')
    const raidLead = screen.getByRole('button', { name: /mute raid lead/i })
    expect(raidLead).toHaveTextContent('Raidlead on')
    await user.click(raidLead)
    await waitFor(() => expect(localStorage.getItem('lura-tts-enabled')).toBe('false'))
    expect(screen.getByRole('button', { name: /enable raid lead/i })).toHaveTextContent('Raidlead muted')
  })
  it('speaks a direct-entry countdown once per number when TTS is enabled', async () => {
    const user = userEvent.setup()
    const speak = vi.mocked(window.speechSynthesis.speak)
    speak.mockClear()
    render(<App />)
    await user.click(screen.getByLabelText(/enable raid lead tts/i))
    await user.click(screen.getByRole('button', { name: /^P2$/ }))
    await user.click(screen.getByRole('button', { name: /enter p2/i }))
    await waitFor(() => expect(speak).toHaveBeenCalled())
    expect((speak.mock.calls[0][0] as SpeechSynthesisUtterance).text).toBe('3')
  })
  it('selects, previews, persists, and uses an installed Raidlead voice', async () => {
    const googleVoice = {
      default: false,
      lang: 'en-US',
      localService: false,
      name: 'Google US English',
      voiceURI: 'Google US English',
    } as SpeechSynthesisVoice
    const selectedVoice = {
      default: false,
      lang: 'en-GB',
      localService: true,
      name: 'Daniel',
      voiceURI: 'com.apple.voice.compact.en-GB.Daniel',
    } as SpeechSynthesisVoice
    const nonEnglishVoice = {
      default: true,
      lang: 'de-DE',
      localService: true,
      name: 'Anna',
      voiceURI: 'com.apple.voice.compact.de-DE.Anna',
    } as SpeechSynthesisVoice
    vi.mocked(window.speechSynthesis.getVoices).mockReturnValue([nonEnglishVoice, selectedVoice, googleVoice])
    const speak = vi.mocked(window.speechSynthesis.speak)
    speak.mockClear()
    const user = userEvent.setup()
    render(<App />)

    const selector = screen.getByLabelText(/raidlead voice/i)
    expect(selector).toHaveValue(googleVoice.voiceURI)
    expect(within(selector).getByRole('option', { name: /Daniel · en-GB/i })).toBeInTheDocument()
    expect(within(selector).queryByRole('option', { name: /Anna/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /preview voice/i }))
    expect((speak.mock.calls.at(-1)?.[0] as SpeechSynthesisUtterance).voice).toBe(googleVoice)

    await user.selectOptions(selector, selectedVoice.voiceURI)
    await waitFor(() => expect(localStorage.getItem('lura-tts-voice')).toBe(selectedVoice.voiceURI))

    await user.click(screen.getByRole('button', { name: /preview voice/i }))
    const preview = speak.mock.calls.at(-1)?.[0] as SpeechSynthesisUtterance
    expect(preview.text).toBe('Raid lead ready')
    expect(preview.voice).toBe(selectedVoice)
    expect(preview.lang).toBe('en-GB')

    speak.mockClear()
    await user.click(screen.getByLabelText(/enable raid lead tts/i))
    await user.click(screen.getByRole('button', { name: /^P2$/ }))
    await user.click(screen.getByRole('button', { name: /enter p2/i }))
    await waitFor(() => expect(speak).toHaveBeenCalled())
    expect((speak.mock.calls[0][0] as SpeechSynthesisUtterance).voice).toBe(selectedVoice)
  })
  it('defaults the global player movement speed to 18', () => { render(<App />); expect(screen.getByLabelText(/movement speed/i)).toHaveValue('18') })
  it('migrates legacy action conflicts when adding Q/E turning', () => { localStorage.setItem('lura-keybindings', JSON.stringify({ forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', crystal: 'KeyE', pause: 'Space', healthPot: 'KeyQ', shield: 'KeyR', mainAbility: 'KeyF' })); render(<App />); expect(screen.getByLabelText(/\(un\)pause keybind/i)).toHaveValue('P'); expect(screen.getByLabelText(/jump keybind/i)).toHaveValue('Space'); expect(screen.getByLabelText(/rotate left keybind/i)).toHaveValue('Q'); expect(screen.getByLabelText(/rotate right keybind/i)).toHaveValue('E'); expect(screen.getByLabelText(/drop crystal keybind/i)).toHaveValue('C'); expect(screen.getByLabelText(/health potion keybind/i)).toHaveValue('Num Del'); expect(screen.getByLabelText(/shield keybind/i)).toHaveValue('Num 7') })
})
