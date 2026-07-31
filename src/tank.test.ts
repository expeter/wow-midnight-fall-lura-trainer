import { describe, expect, it } from 'vitest'
import {
  advanceTankMechanic,
  createTankMechanicState,
  LANCE_COUNTER_SECONDS,
  LANCE_IMPACT_COUNT,
  LANCE_IMPACT_INTERVAL_SECONDS,
  prepareTankDefensive,
  requestTankTaunt,
  setTankMechanicActive,
  TANK_SHIELD_COOLDOWN_SECONDS,
  tankMechanicActiveForEvent,
} from './tank'

const playerActive = { active: true, controlledTank: 0 as const, controlledTankHasCrystal: false, heroic: false }

describe('Heaven’s Lance tank state machine', () => {
  it('builds five counters every two seconds and resolves five spaced impacts', () => {
    let state = setTankMechanicActive(createTankMechanicState(), true)
    state = prepareTankDefensive(state, 0)
    const armed = advanceTankMechanic(state, LANCE_COUNTER_SECONDS * 5, playerActive)
    expect(armed.state.stage).toBe('burst')
    expect(armed.events.filter(event => event.type === 'counter')).toHaveLength(5)
    const burst = advanceTankMechanic(armed.state, LANCE_IMPACT_INTERVAL_SECONDS * LANCE_IMPACT_COUNT, playerActive)
    expect(burst.events.filter(event => event.type === 'impact')).toHaveLength(5)
    expect(burst.state).toMatchObject({ stage: 'swap', impactIndex: 5, impaledStacks: [5, 0] })
  })

  it('requires mitigation before impact one and wipes only through emitted failures', () => {
    let state = setTankMechanicActive(createTankMechanicState(), true)
    state = advanceTankMechanic(state, LANCE_COUNTER_SECONDS * 5, playerActive).state
    const firstImpact = advanceTankMechanic(state, LANCE_IMPACT_INTERVAL_SECONDS, playerActive)
    expect(firstImpact.events).toContainEqual({ type: 'failure', reason: 'Heaven’s Lance impact 1 landed without a tank defensive' })
  })

  it('rejects premature taunts but accepts the off-tank after impact five', () => {
    let state = setTankMechanicActive(createTankMechanicState(), true)
    state = prepareTankDefensive(state, 0)
    state = advanceTankMechanic(state, LANCE_COUNTER_SECONDS * 5, playerActive).state
    expect(requestTankTaunt(state, 1).events[0]).toMatchObject({ type: 'failure' })
    state = advanceTankMechanic(state, LANCE_IMPACT_INTERVAL_SECONDS * 5, playerActive).state
    const swapped = requestTankTaunt(state, 1)
    expect(swapped.state).toMatchObject({ stage: 'building', activeTank: 1, counter: 0 })
  })

  it('lets NPC tanks mitigate and swap without player input', () => {
    let state = setTankMechanicActive(createTankMechanicState(), true)
    const context = { active: true, controlledTank: null, controlledTankHasCrystal: false, heroic: false }
    state = advanceTankMechanic(state, LANCE_COUNTER_SECONDS * 5, context).state
    state = advanceTankMechanic(state, LANCE_IMPACT_INTERVAL_SECONDS * 5, context).state
    const swapped = advanceTankMechanic(state, 1, context)
    expect(swapped.events.some(event => event.type === 'failure')).toBe(false)
    expect(swapped.state.activeTank).toBe(1)
  })

  it('suspends through unavailable phases, retaining and expiring real Impaled stacks', () => {
    const state = { ...createTankMechanicState(), stage: 'swap' as const, impaledStacks: [5, 0] as [number, number], impaledRemaining: [10, 0] as [number, number] }
    const suspended = advanceTankMechanic(state, 3, { ...playerActive, active: false }).state
    expect(suspended).toMatchObject({ stage: 'suspended', counter: 0, impaledStacks: [5, 0], impaledRemaining: [7, 0] })
    const resumed = advanceTankMechanic(suspended, 0, playerActive).state
    expect(resumed).toMatchObject({ stage: 'building', activeTank: 1 })
  })

  it('recharges the controlled tank shield continuously', () => {
    let state = setTankMechanicActive(createTankMechanicState(), true)
    state = prepareTankDefensive(state, 0)
    expect(state.playerShieldCooldown).toBe(TANK_SHIELD_COOLDOWN_SECONDS)
    state = advanceTankMechanic(state, TANK_SHIELD_COOLDOWN_SECONDS, playerActive).state
    expect(state.playerShieldCooldown).toBe(0)
  })

  it('emits one Heroic Tears set for a Lance ability on a controlled crystal tank', () => {
    let state = setTankMechanicActive(createTankMechanicState(), true)
    state = prepareTankDefensive(state, 0)
    const context = { ...playerActive, controlledTankHasCrystal: true, heroic: true }
    state = advanceTankMechanic(state, LANCE_COUNTER_SECONDS * 5, context).state
    const burst = advanceTankMechanic(state, LANCE_IMPACT_INTERVAL_SECONDS * 5, context)
    expect(burst.events.filter(event => event.type === 'tears')).toHaveLength(1)
  })

  it('runs only while L’ura is available in P1, P2, and P3', () => {
    expect(tankMechanicActiveForEvent('p1-interrupts')).toBe(true)
    expect(tankMechanicActiveForEvent('p1-transition')).toBe(false)
    expect(tankMechanicActiveForEvent('splinter')).toBe(false)
    expect(tankMechanicActiveForEvent('p2-orbs')).toBe(true)
    expect(tankMechanicActiveForEvent('p3-flight')).toBe(false)
    expect(tankMechanicActiveForEvent('p3-archangel')).toBe(true)
    expect(tankMechanicActiveForEvent('p4-cycle')).toBe(false)
  })
})
