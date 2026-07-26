import { describe, expect, it } from 'vitest'
import {
  P1_DEFAULT_INTERRUPT_KEY,
  P1_GLAIVE_LIFETIME_SECONDS,
  P1_INTERMISSION_POSITION_SECONDS,
  P1_MAX_GLAIVE_SETS,
  p1AddGlaiveSet,
  p1AdvanceGlaiveSet,
  p1BeamAngles,
  p1CrystalExpired,
  p1CrystalSpawns,
  p1GlaiveSet,
  p1InterruptAssignment,
  p1InterruptCasts,
  p1InterruptState,
  p1InterruptSucceeded,
  p1MemoryOrder,
  p1PlayerSoakFailed,
  p1Progress,
  p1ReactiveSoaks,
  p1RotatingBeams,
  p1ValidateMemoryContacts,
} from './p1'

describe('P1 headless mechanics', () => {
  it('assigns one of five deterministic two-second interrupt casts', () => {
    const assignment = p1InterruptAssignment(1234)
    expect(assignment).toBe(p1InterruptAssignment(1234))
    expect(assignment).toBeGreaterThanOrEqual(0)
    expect(assignment).toBeLessThan(5)
    expect(p1InterruptCasts(10)).toEqual([
      { index: 0, startsAt: 10, endsAt: 12 },
      { index: 1, startsAt: 12, endsAt: 14 },
      { index: 2, startsAt: 14, endsAt: 16 },
      { index: 3, startsAt: 16, endsAt: 18 },
      { index: 4, startsAt: 18, endsAt: 20 },
    ])
    expect(P1_DEFAULT_INTERRUPT_KEY).toBe('Numpad2')
  })

  it('reports red, yellow, and green and rejects late or wrong interrupts', () => {
    expect(p1InterruptState(3, 1)).toBe('red')
    expect(p1InterruptState(3, 2)).toBe('yellow')
    expect(p1InterruptState(3, 3)).toBe('green')
    expect(p1InterruptSucceeded(3, 3, 1.99)).toBe(true)
    expect(p1InterruptSucceeded(3, 2, 1)).toBe(false)
    expect(p1InterruptSucceeded(3, 3, 2.01)).toBe(false)
  })

  it('creates three assigned crystals with five-second pickup deadlines', () => {
    const crystals = p1CrystalSpawns([2, 7, 11], [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }], 20)
    expect(crystals.map(crystal => crystal.carrierIndex)).toEqual([2, 7, 11])
    expect(crystals.every(crystal => crystal.expiresAt === 25)).toBe(true)
    expect(p1CrystalExpired(crystals[0], 25, null)).toBe(false)
    expect(p1CrystalExpired(crystals[0], 25.01, null)).toBe(true)
    expect(p1CrystalExpired(crystals[0], 30, 24)).toBe(false)
  })

  it('seeds five star-like glaives, reflects them from the ring, and expires them after a configurable lifetime', () => {
    const set = p1GlaiveSet(42, 0, { x: 0, y: 0 }, 5, { speed: 10 })
    expect(set.glaives).toHaveLength(5)
    expect(set.launchesAt).toBe(7)
    expect(set.expiresAt).toBe(7 + P1_GLAIVE_LIFETIME_SECONDS)
    expect(p1GlaiveSet(42, 0, { x: 0, y: 0 }, 5, { speed: 10 })).toEqual(set)

    const radial = {
      ...set,
      glaives: [{ id: 0, position: { x: 0, y: 0 }, direction: { x: 1, y: 0 } }],
    }
    const reflected = p1AdvanceGlaiveSet(radial, 7, 8.5, { x: 0, y: 0 }, 10)
    expect(reflected.glaives[0].position.x).toBeCloseTo(5)
    expect(reflected.glaives[0].direction.x).toBeCloseTo(-1)
  })

  it('removes expired glaives and caps the live field at the newest two sets', () => {
    const makeSet = (id: number, startsAt: number, lifetimeSeconds = 30) =>
      p1GlaiveSet(id, id, { x: 0, y: 0 }, startsAt, { speed: 1, lifetimeSeconds })
    let sets = p1AddGlaiveSet([], makeSet(0, 0), 0)
    sets = p1AddGlaiveSet(sets, makeSet(1, 5), 5)
    sets = p1AddGlaiveSet(sets, makeSet(2, 10), 10)
    expect(P1_MAX_GLAIVE_SETS).toBe(2)
    expect(sets.map(set => set.id)).toEqual([1, 2])
    sets = p1AddGlaiveSet(sets, makeSet(3, 50), 50)
    expect(sets.map(set => set.id)).toEqual([3])
  })

  it('builds a seeded permutation of TXOV+ and validates beam contacts in order', () => {
    const order = p1MemoryOrder(2026, 1)
    expect(order).toEqual(p1MemoryOrder(2026, 1))
    expect([...order].sort()).toEqual(['+', 'O', 'T', 'V', 'X'])
    expect(p1ValidateMemoryContacts(order, order.slice(0, 4))).toEqual({
      valid: true,
      complete: false,
      nextIndex: 4,
      wrongIndex: null,
    })
    expect(p1ValidateMemoryContacts(order, order)).toMatchObject({ valid: true, complete: true })
    const wrong = [...order]
    ;[wrong[0], wrong[1]] = [wrong[1], wrong[0]]
    expect(p1ValidateMemoryContacts(order, wrong)).toMatchObject({ valid: false, complete: false, wrongIndex: 0 })
  })

  it('rotates eight evenly spaced beams from a seeded ten-degree side offset', () => {
    const beams = p1RotatingBeams(99, 0, 10, Math.PI / 4)
    const initial = p1BeamAngles(beams, 10)
    const later = p1BeamAngles(beams, 11)
    expect(initial).toHaveLength(8)
    expect(Math.abs(initial[0])).toBeCloseTo(Math.PI / 18)
    expect(initial[1] - initial[0]).toBeCloseTo(Math.PI / 4)
    expect(Math.abs(later[0] - initial[0])).toBeCloseTo(Math.PI / 4)
  })

  it('assigns one reactive soak to an NPC and the other to the player for two seconds', () => {
    const soaks = p1ReactiveSoaks(12, { x: 50, y: 50 }, 8)
    expect(soaks.map(soak => soak.assignee)).toEqual(['npc', 'player'])
    expect(soaks.every(soak => soak.expiresAt === 10)).toBe(true)
    expect(p1PlayerSoakFailed(soaks, [0], 10)).toBe(false)
    expect(p1PlayerSoakFailed(soaks, [0], 10.01)).toBe(true)
    expect(p1PlayerSoakFailed(soaks, [0, 1], 10.01)).toBe(false)
  })

  it('runs exactly two sequences then allows fifteen seconds to reach Intermission assignments', () => {
    expect(p1Progress(0, null, 0)).toEqual({ phase: 'sequence', sequence: 1, secondsRemaining: null })
    expect(p1Progress(1, null, 0)).toEqual({ phase: 'sequence', sequence: 2, secondsRemaining: null })
    expect(p1Progress(2, 100, 106)).toEqual({
      phase: 'intermission-positioning',
      sequence: 2,
      secondsRemaining: P1_INTERMISSION_POSITION_SECONDS - 6,
    })
    expect(p1Progress(2, 100, 115)).toEqual({ phase: 'intermission', sequence: 2, secondsRemaining: 0 })
  })
})
