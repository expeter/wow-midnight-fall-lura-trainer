export const LANCE_COUNTER_SECONDS = 2
export const LANCE_IMPACT_COUNT = 5
export const LANCE_IMPACT_INTERVAL_SECONDS = .35
export const LANCE_SWAP_WINDOW_SECONDS = 2
export const LANCE_NPC_SWAP_SECONDS = .7
export const TANK_SHIELD_COOLDOWN_SECONDS = 20
export const IMPALED_DURATION_SECONDS = 20

export type TankIndex = 0 | 1
export type LanceStage = 'suspended' | 'building' | 'burst' | 'swap'

export interface TankMechanicState {
  stage: LanceStage
  activeTank: TankIndex
  counter: number
  counterElapsed: number
  burstElapsed: number
  impactIndex: number
  swapElapsed: number
  impaledStacks: [number, number]
  impaledRemaining: [number, number]
  playerShieldCooldown: number
  defensivePrepared: boolean
  cycleFailed: boolean
}

export type TankMechanicEvent =
  | { type: 'counter'; value: number }
  | { type: 'burst-start'; tank: TankIndex }
  | { type: 'impact'; tank: TankIndex; index: number }
  | { type: 'swap-needed'; tank: TankIndex }
  | { type: 'swapped'; tank: TankIndex; automatic: boolean }
  | { type: 'failure'; reason: string }
  | { type: 'tears'; tank: TankIndex }

export interface TankAdvanceContext {
  active: boolean
  controlledTank: TankIndex | null
  controlledTankHasCrystal: boolean
  heroic: boolean
}

export interface TankAdvanceResult {
  state: TankMechanicState
  events: TankMechanicEvent[]
}

export function createTankMechanicState(activeTank: TankIndex = 0): TankMechanicState {
  return {
    stage: 'suspended',
    activeTank,
    counter: 0,
    counterElapsed: 0,
    burstElapsed: 0,
    impactIndex: 0,
    swapElapsed: 0,
    impaledStacks: [0, 0],
    impaledRemaining: [0, 0],
    playerShieldCooldown: 0,
    defensivePrepared: false,
    cycleFailed: false,
  }
}

function lowerRiskTank(state: TankMechanicState): TankIndex {
  if (state.impaledStacks[0] !== state.impaledStacks[1]) return state.impaledStacks[0] < state.impaledStacks[1] ? 0 : 1
  if (state.impaledRemaining[0] !== state.impaledRemaining[1]) return state.impaledRemaining[0] < state.impaledRemaining[1] ? 0 : 1
  return state.activeTank
}

function failure(state: TankMechanicState, events: TankMechanicEvent[], reason: string) {
  if (state.cycleFailed) return
  state.cycleFailed = true
  events.push({ type: 'failure', reason })
}

function completeSwap(state: TankMechanicState, events: TankMechanicEvent[], automatic: boolean) {
  state.activeTank = state.activeTank === 0 ? 1 : 0
  state.stage = 'building'
  state.counter = 0
  state.counterElapsed = 0
  state.burstElapsed = 0
  state.impactIndex = 0
  state.swapElapsed = 0
  state.defensivePrepared = false
  state.cycleFailed = false
  events.push({ type: 'swapped', tank: state.activeTank, automatic })
}

export function setTankMechanicActive(state: TankMechanicState, active: boolean): TankMechanicState {
  if (!active) {
    return { ...state, stage: 'suspended', counter: 0, counterElapsed: 0, burstElapsed: 0, impactIndex: 0, swapElapsed: 0, defensivePrepared: false, cycleFailed: false }
  }
  if (state.stage !== 'suspended') return state
  return { ...state, stage: 'building', activeTank: lowerRiskTank(state), counter: 0, counterElapsed: 0, burstElapsed: 0, impactIndex: 0, swapElapsed: 0, defensivePrepared: false, cycleFailed: false }
}

export function prepareTankDefensive(state: TankMechanicState, controlledTank: TankIndex | null): TankMechanicState {
  if (controlledTank === null || controlledTank !== state.activeTank || state.playerShieldCooldown > 0) return state
  if (state.stage !== 'building' && (state.stage !== 'burst' || state.impactIndex > 0)) return state
  return { ...state, defensivePrepared: true, playerShieldCooldown: TANK_SHIELD_COOLDOWN_SECONDS }
}

export function requestTankTaunt(state: TankMechanicState, controlledTank: TankIndex | null): TankAdvanceResult {
  const next = { ...state, impaledStacks: [...state.impaledStacks] as [number, number], impaledRemaining: [...state.impaledRemaining] as [number, number] }
  const events: TankMechanicEvent[] = []
  if (controlledTank === null) return { state: next, events }
  if (next.stage === 'swap' && controlledTank !== next.activeTank) {
    completeSwap(next, events, false)
    return { state: next, events }
  }
  if (next.stage === 'burst') {
    failure(next, events, 'Taunted before Heaven’s Lance impact 5')
  } else if (next.stage === 'building') {
    failure(next, events, 'Taunted before the Heaven’s Lance burst finished')
  }
  return { state: next, events }
}

export function advanceTankMechanic(state: TankMechanicState, dt: number, context: TankAdvanceContext): TankAdvanceResult {
  let next = {
    ...state,
    impaledStacks: [...state.impaledStacks] as [number, number],
    impaledRemaining: [...state.impaledRemaining] as [number, number],
  }
  const events: TankMechanicEvent[] = []
  next.playerShieldCooldown = Math.max(0, next.playerShieldCooldown - dt)
  for (const index of [0, 1] as TankIndex[]) {
    next.impaledRemaining[index] = Math.max(0, next.impaledRemaining[index] - dt)
    if (next.impaledRemaining[index] === 0) next.impaledStacks[index] = 0
  }
  next = setTankMechanicActive(next, context.active)
  if (!context.active) return { state: next, events }
  let burstStartedThisAdvance = false

  if (next.stage === 'building') {
    next.counterElapsed += dt
    while (next.counterElapsed >= LANCE_COUNTER_SECONDS && next.stage === 'building') {
      next.counterElapsed -= LANCE_COUNTER_SECONDS
      next.counter += 1
      events.push({ type: 'counter', value: next.counter })
      if (next.counter === 5) {
        next.stage = 'burst'
        next.burstElapsed = 0
        next.impactIndex = 0
        if (context.controlledTank !== next.activeTank) next.defensivePrepared = true
        events.push({ type: 'burst-start', tank: next.activeTank })
        burstStartedThisAdvance = true
      }
    }
  }

  if (next.stage === 'burst' && !burstStartedThisAdvance) {
    next.burstElapsed += dt
    const resolvedImpacts = Math.min(LANCE_IMPACT_COUNT, Math.floor(next.burstElapsed / LANCE_IMPACT_INTERVAL_SECONDS))
    while (next.impactIndex < resolvedImpacts) {
      next.impactIndex += 1
      if (next.impactIndex === 1 && !next.defensivePrepared) failure(next, events, 'Heaven’s Lance impact 1 landed without a tank defensive')
      next.impaledStacks[next.activeTank] += 1
      next.impaledRemaining[next.activeTank] = IMPALED_DURATION_SECONDS
      events.push({ type: 'impact', tank: next.activeTank, index: next.impactIndex })
      if (next.impactIndex === 1 && context.heroic && context.controlledTankHasCrystal && context.controlledTank === next.activeTank) {
        events.push({ type: 'tears', tank: next.activeTank })
      }
      if (next.impactIndex === LANCE_IMPACT_COUNT) {
        next.stage = 'swap'
        next.swapElapsed = 0
        events.push({ type: 'swap-needed', tank: next.activeTank === 0 ? 1 : 0 })
      }
    }
  } else if (next.stage === 'swap') {
    next.swapElapsed += dt
    const offTank: TankIndex = next.activeTank === 0 ? 1 : 0
    if (context.controlledTank !== offTank && next.swapElapsed >= LANCE_NPC_SWAP_SECONDS) {
      completeSwap(next, events, true)
    } else if (context.controlledTank === offTank && next.swapElapsed >= LANCE_SWAP_WINDOW_SECONDS) {
      failure(next, events, 'Did not Taunt after Heaven’s Lance impact 5')
      completeSwap(next, events, true)
    }
  }
  return { state: next, events }
}

export function tankMechanicActiveForEvent(event: string): boolean {
  if (event.startsWith('p1-')) return !['p1-countdown', 'p1-transition'].includes(event)
  if (event.startsWith('p2-')) return !['p2-countdown', 'p2-jump'].includes(event)
  if (event.startsWith('p3-')) return !['p3-countdown', 'p3-flight', 'p3-landing'].includes(event)
  return false
}
