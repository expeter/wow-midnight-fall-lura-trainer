import { expect, test } from '@playwright/test'

// Three.js can render substantially slower on GitHub's software-only runner.
// The game caps animation-frame deltas to keep mechanics stable, so simulated
// time intentionally advances more slowly when the renderer is under load.
const MECHANIC_TIMEOUT = 20_000
const P2_RESOLUTION_TIMEOUT = 40_000

test.setTimeout(60_000)

test('exposes the released Phase 1 encounter and begins its assigned interrupts', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lura-game-speed', '2.5')
    localStorage.setItem('lura-difficulty', 'test')
  })
  await page.goto('/')

  await page.getByRole('button', { name: 'P1', exact: true }).click()
  await page.getByRole('button', { name: 'Raid plan' }).click()
  await expect(page.getByLabel('Phase 1 position map')).toBeVisible()
  await expect(page.getByLabel('Phase 1 crystal assignments')).toBeVisible()
  const plannedBoss = await page.evaluate(() => JSON.parse(localStorage.getItem('lura-p1-boss-position') || 'null') as { x: number; y: number })
  await page.getByRole('button', { name: /Enter P1/ }).click()

  await expect(page.getByRole('heading', { name: /Kick [1-5] · (?:Crystal pickup [12]|No crystal pickup)/ })).toBeVisible()
  await expect(page.getByText(/PHASE 1 · SEQUENCE 1 \/ 2/)).toBeVisible()
  await expect(page.locator('.scene-3d')).toHaveAttribute('data-p1-boss-opening', `${plannedBoss.x},${plannedBoss.y}`)
  const arena = page.locator('.arena-wrap')
  await expect(arena).toHaveAttribute('data-event', 'p1-pull', { timeout: MECHANIC_TIMEOUT })
  await expect(page.getByRole('heading', { name: 'Engage L’ura.' })).toBeVisible()
  await expect(page.locator('.p1-interrupt-counter')).not.toBeVisible()
  const interruptCounter = page.locator('.p1-interrupt-counter')
  await expect(interruptCounter).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(interruptCounter).toContainText(/INTERRUPTS[1-5] \/ 5/)
  await expect(interruptCounter).toHaveCSS('gap', '10px')
  const interrupt = page.locator('.p1-interrupt-display')
  await expect(interrupt).toBeVisible()
  await expect(interrupt.locator('i')).toHaveCount(5)
  await expect(interrupt.locator('i.assigned')).toHaveCount(1)
  await expect(interrupt).toContainText(/WAIT|NEXT|KICK|INTERRUPTED/)
  await expect(page.getByRole('progressbar', { name: /Dangerous cone cast/ })).toBeVisible()
})

test('despawns the first Phase 1 Heaven Glaive set before the second sequence launches', async ({ page }) => {
  test.setTimeout(90_000)
  await page.addInitScript(() => {
    localStorage.setItem('lura-game-speed', '2.5')
    localStorage.setItem('lura-selected-position', '0')
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: 'P1', exact: true }).click()
  await page.getByRole('button', { name: /Enter P1/ }).click()

  const arena = page.locator('.arena-wrap')
  await expect(arena).toHaveAttribute('data-p1-glaive-sets', '1', { timeout: 25_000 })
  await expect(page.locator('.p1-rune-grid')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.p1-rune-grid strong')).toHaveCount(5)
  await expect(page.locator('.p1-rune-grid strong.personal')).toHaveCount(1)
  await expect(arena).toHaveAttribute('data-event', 'p1-beam-position', { timeout: 40_000 })
  await expect(page.getByRole('heading', { name: 'Hold behind L’ura.' })).toBeVisible()
  await expect(arena).toHaveAttribute('data-p1-glaive-sets', '0')
  await expect(arena).toHaveAttribute('data-p1-glaive-set-ids', '2', { timeout: 55_000 })
  await expect(arena).toHaveAttribute('data-p1-glaive-sets', '1')
  const firstTime = Number(await arena.getAttribute('data-event-time'))
  await page.waitForTimeout(500)
  const laterTime = Number(await arena.getAttribute('data-event-time'))
  expect(laterTime).not.toBe(firstTime)
})

test('unlocks and schedules the complete prerecorded P4 raidlead in the browser', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lura-tts-enabled', 'true')
    localStorage.setItem('lura-game-speed', '2.5')
    const voiceState = { played: [] as string[] }
    Object.defineProperty(window, '__p4VoiceState', { value: voiceState })
    HTMLMediaElement.prototype.play = function play() {
      voiceState.played.push(this.src.split('/').at(-1) ?? '')
      return Promise.resolve()
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'P4', exact: true }).click()
  await page.getByRole('button', { name: /Enter P4/ }).click()

  await expect.poll(
    () => page.evaluate(() => (window as typeof window & { __p4VoiceState: { played: string[] } }).__p4VoiceState.played.length),
    { timeout: MECHANIC_TIMEOUT },
  ).toBe(4)
  const voiceState = await page.evaluate(() => (
    window as typeof window & { __p4VoiceState: { played: string[] } }
  ).__p4VoiceState)
  expect(voiceState.played.map(filename => filename.match(/^(left|right|move)/)?.[1])).toEqual(['left', 'right', 'left', 'move'])
})

test('a shared hash plan drives every live phase and survives a clean reload', async ({ page }) => {
  const profiles = Array.from({ length: 20 }, (_, index) => ({ name: index === 14 ? 'Zoxzy' : index === 19 ? 'Pestivator' : `Player ${index + 1}`, playerClass: 'mage', crystal: index < 6 }))
  const plan = {
    positions: Array.from({ length: 20 }, (_, index) => ({ x: index < 10 ? 420 : 540, y: 360 })),
    p2Positions: Array.from({ length: 20 }, (_, index) => ({ x: index === 14 ? 500 : 480, y: 270 })),
    p2SpreadPositions: Array.from({ length: 20 }, (_, index) => ({ x: index === 14 ? 480 : 470, y: index === 14 ? 300 : 270 })),
    p3Positions: Array.from({ length: 20 }, (_, index) => index === 14 ? { x: 553, y: 398 } : index === 19 ? { x: 409, y: 421 } : { x: index < 10 ? 420 : 540, y: 400 }),
    p3BossPositions: [{ x: 406, y: 398 }, { x: 554, y: 398 }],
    startSlots: [{ x: 480, y: 510 }, { x: 240, y: 270 }, { x: 720, y: 270 }, { x: 480, y: 30 }],
    profiles,
    crystalAssignments: { intermission: [0, 1, 2, 3, 4, 5], p2: [0, 1, 2, 3, 4, 5], p3: [0, 1, 2, 3, 4, 5] },
  }
  const stale = Array.from({ length: 20 }, () => ({ x: 410, y: 400 }))
  await page.addInitScript(value => {
    if (sessionStorage.getItem('stale-plan-seeded')) return
    localStorage.setItem('lura-p3-player-positions', JSON.stringify(value))
    localStorage.setItem('lura-selected-position', '14')
    sessionStorage.setItem('stale-plan-seeded', 'true')
  }, stale)
  const code = Buffer.from(encodeURIComponent(JSON.stringify(plan))).toString('base64')
  await page.goto(`/#raidplan=${code}`)

  await expect(page.getByText('Shared raid plan loaded')).toBeVisible()
  const stored = await page.evaluate(() => ({
    intermission: JSON.parse(localStorage.getItem('lura-player-positions') || '[]')[14],
    p2Soak: JSON.parse(localStorage.getItem('lura-p2-player-positions') || '[]')[14],
    p2Spread: JSON.parse(localStorage.getItem('lura-p2-spread-positions') || '[]')[14],
    p3: JSON.parse(localStorage.getItem('lura-p3-player-positions') || '[]')[14],
  }))
  expect(stored.p3).toEqual({ x: 553, y: 398 })
  expect(await page.getByRole('button', { name: 'Move P3 player 15' }).evaluate(element => parseFloat((element as HTMLElement).style.left))).toBeGreaterThan(50)

  const expectedPoint = (point: { x: number; y: number }) => `${point.x},${point.y}`
  const enterAndInspect = async (phase: 'Intermission' | 'P2' | 'P3' | 'P4') => {
    await page.getByRole('button', { name: phase, exact: true }).click()
    await page.getByRole('button', { name: phase === 'Intermission' ? /Enter Arena/ : new RegExp(`Enter ${phase}`) }).click()
    const arena = page.locator('.arena-wrap')
    await expect(arena).toHaveAttribute('data-player-profile', 'Zoxzy|mage')
    await expect(arena).toHaveAttribute('data-intermission-assignment', expectedPoint(stored.intermission))
    await expect(arena).toHaveAttribute('data-p2-soak-assignment', expectedPoint(stored.p2Soak))
    await expect(arena).toHaveAttribute('data-p2-spread-assignment', expectedPoint(stored.p2Spread))
    await expect(arena).toHaveAttribute('data-p3-assignment', expectedPoint(stored.p3))
    if (phase === 'Intermission') await expect(arena).toHaveAttribute('data-active-assignment', expectedPoint(stored.intermission))
    if (phase === 'P2') await expect(arena).toHaveAttribute('data-active-assignment', expectedPoint(stored.p2Soak))
    if (phase === 'P3') {
      await expect(arena).toHaveAttribute('data-active-assignment', expectedPoint(stored.p3))
      await expect(page.getByText(/PHASE 3 · SECTOR 1 \/ 2 · IMAGE SIDE/)).toBeVisible()
    }
    await page.getByRole('button', { name: 'Exit' }).click()
  }

  await page.getByRole('button', { name: 'Game settings' }).click()
  await page.getByRole('button', { name: 'easy' }).click()
  await enterAndInspect('Intermission')
  await enterAndInspect('P2')
  await enterAndInspect('P3')
  await enterAndInspect('P4')

  await page.goto('/')
  await page.getByRole('button', { name: 'Raid plan' }).click()
  expect(await page.getByRole('button', { name: 'Move P3 player 15' }).evaluate(element => parseFloat((element as HTMLElement).style.left))).toBeGreaterThan(50)
})

test('selects Arena 2 and enters the Phase 2 countdown', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Intermission', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByText('Get ready for Phase 2.')).toBeVisible()
  await expect(page.getByText(/PHASE 2 · CYCLE 1 \/ 3/)).toBeVisible()
  await expect(page.getByText('Points')).toBeVisible()
  await expect(page.getByText(/raid begins stacked in the middle/i)).toBeVisible()

  const viewportFits = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }))
  expect(viewportFits.documentHeight).toBeLessThanOrEqual(viewportFits.viewportHeight)

  const beamCountdown = page.locator('.beam-drop-counter')
  await expect(page.getByText('Soak your assigned beam.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText('WAIT TO DROP')).toHaveCount(0)
  await expect(beamCountdown).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(beamCountdown).toContainText(/BEAM IN [1-5]/)
})

test('shows the early crystal drop warning on Easy only', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'easy' }).click()
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByText('WAIT TO DROP')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
})

test('continues the current Phase 2 sequence after the first Normal wipe', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByLabel('Character to play').selectOption('8')
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByText(/Strike 1 \/ 2/)).toBeVisible({ timeout: P2_RESOLUTION_TIMEOUT })
  await expect(page.getByText('Practice continues')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText(/Pulled to the center|Spread your circle/)).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText(/ORBS RETURN IN/)).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText(/PHASE 2 · CYCLE [12] \/ 3/)).toBeVisible({ timeout: MECHANIC_TIMEOUT })
})

test('wipes when a non-carrier personal circle hits an NPC crystal in Phase 2', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'hard' }).click()
  await page.getByRole('button', { name: 'P2', exact: true }).click()
  await page.getByRole('button', { name: /Enter P2/ }).click()

  await expect(page.getByRole('alert')).toContainText('Your personal circle hit another player’s crystal', { timeout: P2_RESOLUTION_TIMEOUT })
  await expect(page.locator('.score-overlay strong')).toHaveText('400')
})

test('Space jumps while actions are locked and P pauses', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'easy' }).click()
  await page.getByLabel('Character to play').selectOption('8')
  await page.getByRole('button', { name: 'Intermission', exact: true }).click()
  await page.getByRole('button', { name: /Enter Intermission/ }).click()

  await expect(page.getByText('Take your position.')).toBeVisible({ timeout: 3_000 })
  await page.keyboard.press('Space')
  const arena = page.locator('.arena-wrap')
  await expect(arena).toHaveAttribute('data-personal-jump', 'true')

  await page.keyboard.press('f')
  await page.keyboard.press('c')
  await expect(page.locator('.score-overlay strong')).toHaveText('1000')
  await expect(page.locator('.crystal-countdown')).toHaveCount(0)

  await expect(arena).toHaveAttribute('data-personal-jump', 'false', { timeout: 1_000 })
  await page.keyboard.press('f')
  await expect(page.locator('.player-castbar')).toBeVisible()
  await expect(page.locator('.player-castbar')).toHaveAttribute('style', /left: 50%; top: 65%/)
  await expect(page.locator('.boss-health .main-cast')).toHaveCount(0)
  await expect(page.locator('.score-overlay strong')).toHaveText('1001')
  await expect(page.locator('.player-castbar')).toHaveCount(0)
  await page.keyboard.press('c')
  await expect(page.locator('.crystal-countdown')).toBeVisible()

  await page.keyboard.press('p')
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
})

test('Main ability visibly animates and completes only once when its bound key is hammered', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lura-keybindings', JSON.stringify({
      forward: 'KeyW',
      backward: 'KeyS',
      left: 'KeyA',
      right: 'KeyD',
      turnLeft: 'KeyQ',
      turnRight: 'KeyE',
      jump: 'Space',
      crystal: 'KeyC',
      pause: 'KeyP',
      healthPot: 'NumpadDecimal',
      shield: 'Numpad7',
      mainAbility: 'Digit4',
    }))
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Intermission', exact: true }).click()
  await page.getByRole('button', { name: /Enter Intermission/ }).click()
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit4' }))
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit4' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }))
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyP' }))
  })

  const fill = page.locator('.main-cast-fill')
  await expect(page.locator('.player-castbar.main-cast')).toBeVisible()
  await expect(fill).toBeAttached()
  await expect(fill).toHaveCSS('animation-name', 'main-cast-fill')
  await expect(fill).toHaveCSS('animation-duration', '1s')
  await expect(fill).toHaveCSS('animation-play-state', 'paused')
  await page.keyboard.press('p')

  await page.keyboard.press('4')
  await page.keyboard.press('4')
  await page.keyboard.press('4')

  await expect(page.getByText(/L’URA · 99\.5%/i)).toBeVisible({ timeout: 5_000 })
  await expect(fill).toHaveCount(0)
  await expect(page.locator('.score-overlay strong')).toHaveText('1001')
  await page.waitForTimeout(250)
  await expect(fill).toHaveCount(0)
  await expect(page.getByText(/L’URA · 99\.5%/i)).toBeVisible()
  await expect(page.locator('.score-overlay strong')).toHaveText('1001')
})

test('enters Phase 3 directly in non-blocking Test mode', { tag: '@late-arena' }, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'test' }).click()
  await page.getByLabel('Character to play').selectOption('8')
  await page.getByRole('button', { name: 'P3', exact: true }).click()
  await page.getByRole('button', { name: /Enter P3/ }).click()

  await expect(page.getByText('Get ready for Phase 3.')).toBeVisible()
  await expect(page.getByText(/PHASE 3 · SECTOR 1 \/ 2/)).toBeVisible()
  await expect(page.getByText(/CRYSTAL · DROP [12]/)).toBeVisible()
  await expect(page.getByLabel('Test mode recent failures')).toContainText('No failures yet.')
  await expect(page.getByText('Thrown into the split arena.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText('Catch the open yellow impact.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await page.keyboard.down('w')
  await expect(page.getByText('Complete the Soaks.')).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await page.keyboard.up('w')
  await expect(page.getByText(/Stars pattern disappears for three seconds/i)).toBeVisible()
  await expect(page.getByText(/BIG BOOM/)).toBeVisible()
  await expect(page.locator('.player-health')).toBeVisible()
  await expect(page.getByText('RUNE ORDER', { exact: true })).toBeVisible({ timeout: MECHANIC_TIMEOUT })
  await expect(page.getByText('RUNE ORDER', { exact: true })).toHaveCount(0, { timeout: MECHANIC_TIMEOUT })
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('enters Phase 4 directly and plays Splinters again before the second Heaven and Hell', { tag: '@late-arena' }, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: 'P4', exact: true }).click()
  await page.getByRole('button', { name: /Enter Arena 4/ }).click()
  await expect(page.getByText('Get ready for Phase 4.')).toBeVisible()
  await expect(page.locator('.start-countdown')).toHaveText('3')
  await expect(page.getByText(/PHASE 4/)).toBeVisible()
  await expect(page.locator('.boss-health')).toContainText('L’URA · 100.0%')
  const mechanic = page.locator('.splinter-counter')
  await expect(mechanic).toContainText(/SPLINTER [1-3] \/ 3/, { timeout: MECHANIC_TIMEOUT })
  await page.getByRole('button', { name: 'Pause' }).click()
  const arena = page.locator('.arena-wrap')
  const scene = arena.locator('canvas')
  const pausedTime = await arena.getAttribute('data-event-time')
  const pausedCounter = await mechanic.textContent()
  const pausedCycle = await scene.getAttribute('data-p4-cycle')
  await page.waitForTimeout(750)
  await expect(arena).toHaveAttribute('data-event-time', pausedTime ?? '')
  await expect(mechanic).toHaveText(pausedCounter ?? '')
  await expect(scene).toHaveAttribute('data-p4-cycle', pausedCycle ?? '')
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(scene).toHaveAttribute('data-p4-cycle', pausedCycle ?? '')
  await expect(mechanic).toContainText(/SPLINTER IN/, { timeout: MECHANIC_TIMEOUT })
  await expect(mechanic).toContainText(/SPLINTER [1-3] \/ 3/, { timeout: MECHANIC_TIMEOUT })
  await expect(scene).not.toHaveAttribute('data-p4-cycle', pausedCycle ?? '')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('resolves a Phase 4 stack hit reliably at 2.5x speed', { tag: '@late-arena' }, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: 'P4', exact: true }).click()
  await page.getByRole('button', { name: /Enter Arena 4/ }).click()

  await expect(page.getByLabel('Test mode recent failures')).toContainText(
    'Phase 4 Starsplinter hit another player',
    { timeout: MECHANIC_TIMEOUT },
  )
})

test('keeps a terminal wipe over the frozen arena and allows minimizing its details', { tag: '@late-arena' }, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lura-game-speed', '2.5'))
  await page.goto('/')
  await page.getByRole('button', { name: 'hard', exact: true }).click()
  await page.getByRole('button', { name: 'P3', exact: true }).click()
  await page.getByRole('button', { name: /Enter Arena 3/ }).click()
  const wipe = page.getByRole('alert')
  await expect(wipe).toContainText(/Wiped due to:/, { timeout: MECHANIC_TIMEOUT })
  await expect(page.locator('.scene-3d')).toHaveAttribute('data-defeated', 'true')
  await expect(page.locator('.scene-3d')).toHaveAttribute('data-ground-texture', 'grid-cracks')
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Minimize wipe details' }).click()
  await expect(wipe).toContainText('Restore wipe details')
  await expect(page.getByLabel('Recent failures')).toBeVisible()
  await page.getByRole('button', { name: 'Restore wipe details' }).click()
  await expect(page.getByRole('button', { name: 'Minimize wipe details' })).toBeVisible()
})
