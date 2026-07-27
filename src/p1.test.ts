import { describe, expect, it } from 'vitest'
import {
  P1_DEFAULT_INTERRUPT_KEY,
  P1_GLAIVE_LIFETIME_SECONDS,
  P1_INNER_RADIUS,
  P1_INTERMISSION_POSITION_SECONDS,
  P1_MAX_GLAIVE_SETS,
  P1_OUTER_RADIUS,
  p1AddGlaiveSet,
  p1AdvanceGlaiveSet,
  p1BeamAngles,
  p1BossEncounterPosition,
  p1BossPosition,
  p1ContinuousBeamTime,
  p1CrystalExpired,
  p1CrystalPickupSequence,
  p1CrystalSpawnPosition,
  p1CrystalSpawns,
  p1GlaiveSet,
  p1InterruptAssignment,
  p1InterruptCasts,
  p1InterruptState,
  p1InterruptSucceeded,
  p1MemoryOrder,
  p1MemorySlotAngle,
  p1MemorySlotValid,
  p1MemorySweepAngle,
  p1NpcBeamPosition,
  p1NpcCrystalPickupReleased,
  p1NpcMemoryPosition,
  p1NpcRoamingPosition,
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

  it('places pickup crystals inward from their raid-plan assignments', () => {
    expect(p1CrystalSpawnPosition({ x: 100, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 86, y: 0 })
    expect(p1CrystalSpawnPosition({ x: 0, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('splits six configured carriers into two trios and holds NPCs for the player pickup', () => {
    const assignments = [2, 4, 6, 8, 10, 12]
    expect(p1CrystalPickupSequence(assignments, 4)).toBe(1)
    expect(p1CrystalPickupSequence(assignments, 10)).toBe(2)
    expect(p1CrystalPickupSequence(assignments, 3)).toBeNull()
    expect(p1NpcCrystalPickupReleased(assignments, 4, 1, false)).toBe(false)
    expect(p1NpcCrystalPickupReleased(assignments, 4, 1, true)).toBe(true)
    expect(p1NpcCrystalPickupReleased(assignments, 10, 1, false)).toBe(true)
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
    expect(reflected.glaives[0].position.x).toBeCloseTo(8.1667, 3)
    expect(reflected.glaives[0].direction.x).toBeCloseTo(-1)
    expect(reflected.glaives[0].reflected).toBe(true)
  })

  it('launches a regular five-ray star at full speed, then uses 110% player speed after impact', () => {
    const set = p1GlaiveSet(42, 1, { x: 220, y: 0 }, 0, {
      speed: 30,
      reflectedSpeed: 11,
      telegraphSeconds: 0,
    })
    const angles = set.glaives.map(glaive => Math.atan2(glaive.direction.y, glaive.direction.x))
    const wrappedDifferences = angles.slice(1).map((angle, index) => Math.atan2(Math.sin(angle - angles[index]), Math.cos(angle - angles[index])))
    expect(wrappedDifferences.every(difference => Math.abs(difference - Math.PI * 2 / 5) < 1e-8)).toBe(true)
    const firstSecond = p1AdvanceGlaiveSet({
      ...set,
      glaives: [{ id: 0, position: { x: 20, y: 0 }, direction: { x: -1, y: 0 } }],
    }, 0, 1, { x: 0, y: 0 }, 100, 10)
    expect(firstSecond.glaives[0].direction.x).toBeCloseTo(1)
    expect(firstSecond.glaives[0].position.x).toBeCloseTo(17.3333, 3)

    const fullSpeed = p1AdvanceGlaiveSet({
      ...set,
      glaives: [{ id: 0, position: { x: 0, y: 0 }, direction: { x: 1, y: 0 }, reflected: false }],
    }, 0, 1, { x: 0, y: 0 }, 1000)
    const reflectedSpeed = p1AdvanceGlaiveSet({
      ...set,
      glaives: [{ id: 0, position: { x: 0, y: 0 }, direction: { x: 1, y: 0 }, reflected: true }],
    }, 0, 1, { x: 0, y: 0 }, 1000)
    expect(fullSpeed.glaives[0].position.x).toBeCloseTo(30)
    expect(reflectedSpeed.glaives[0].position.x).toBeCloseTo(11)
    expect(P1_INNER_RADIUS).toBe(102)
    expect(P1_OUTER_RADIUS).toBe(260)
    expect(P1_GLAIVE_LIFETIME_SECONDS).toBe(60)
  })

  it('moves the outside boss through one quarter per demonstrated sequence', () => {
    expect(p1BossPosition({ x: 480, y: 492 }, { x: 480, y: 270 }, 1)).toEqual({ x: 480, y: 492 })
    const second = p1BossPosition({ x: 480, y: 492 }, { x: 480, y: 270 }, 2)
    expect(second.x).toBeCloseTo(258)
    expect(second.y).toBeCloseTo(270)
  })

  it('keeps the beam angle continuous while the low telegraph becomes lethal and moves L’ura between tank positions', () => {
    const opening = { x: 300, y: 430 }
    const tanks = [{ x: 390, y: 420 }, { x: 520, y: 410 }]
    const beams = p1RotatingBeams(17, 1, 0, Math.PI / 16, 1.2)
    const telegraphEnd = p1BeamAngles(beams, p1ContinuousBeamTime('p1-beam-telegraph', 2))[0]
    const activeStart = p1BeamAngles(beams, p1ContinuousBeamTime('p1-beams', 0))[0]
    expect(activeStart).toBeCloseTo(telegraphEnd)
    expect(p1BossEncounterPosition(opening, tanks, 1, 'p1-memory-sweep', 4)).toEqual(opening)
    expect(p1BossEncounterPosition(opening, tanks, 1, 'p1-beams', 8)).toEqual(tanks[0])
    expect(p1BossEncounterPosition(opening, tanks, 2, 'p1-interrupts', 0)).toEqual(tanks[0])
  })

  it('lets memory NPCs roam before settling and makes beam NPCs cross then follow a rotating ray', () => {
    const target = { x: 400, y: 400 }
    expect(p1NpcMemoryPosition(target, 3, 1, true)).not.toEqual(target)
    expect(p1NpcMemoryPosition(target, 3, 7, true)).toEqual(target)
    const center = { x: 480, y: 270 }
    const assignment = { x: 480, y: 450 }
    const beams = p1RotatingBeams(91, 1, 0, Math.PI / 16, Math.PI / 2)
    const crossing = p1NpcBeamPosition(assignment, 3, beams, .5, center)
    const following = p1NpcBeamPosition(assignment, 3, beams, 2.5, center)
    expect(crossing).not.toEqual(following)
    expect(Math.hypot(following.x - center.x, following.y - center.y)).toBeGreaterThan(P1_INNER_RADIUS)
    expect(Math.hypot(following.x - center.x, following.y - center.y)).toBeLessThan(P1_OUTER_RADIUS)
  })

  it('gives idle P1 NPCs deterministic cast-and-move waypoints around L’ura', () => {
    const boss = { x: 350, y: 400 }
    const assignment = { x: 410, y: 420 }
    const firstCast = p1NpcRoamingPosition(assignment, boss, 4, .5, 77)
    const heldCast = p1NpcRoamingPosition(assignment, boss, 4, 1.8, 77)
    const nextMove = p1NpcRoamingPosition(assignment, boss, 4, 2.3, 77)
    expect(heldCast).toEqual(firstCast)
    expect(nextMove).not.toEqual(firstCast)
    expect(Math.hypot(nextMove.x - boss.x, nextMove.y - boss.y)).toBeGreaterThanOrEqual(34)
    expect(Math.hypot(nextMove.x - boss.x, nextMove.y - boss.y)).toBeLessThanOrEqual(88)
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

  it('maps every rune to a distinct clockwise slot and sweeps one full turn', () => {
    const order = ['T', 'X', 'O', 'V', '+'] as const
    const center = { x: 480, y: 270 }
    const outward = Math.PI / 3
    expect(p1MemorySlotAngle(order, 'T', outward)).toBeCloseTo(outward)
    const angle = p1MemorySlotAngle(order, 'O', outward)
    const correct = { x: center.x + Math.cos(angle) * 120, y: center.y + Math.sin(angle) * 120 }
    expect(p1MemorySlotValid(correct, center, order, 'O', outward)).toBe(true)
    expect(p1MemorySlotValid(correct, center, order, 'X', outward)).toBe(false)
    expect(p1MemorySweepAngle(0, 0, outward)).toBeCloseTo(outward)
    expect(p1MemorySweepAngle(0, 5, outward)).toBeCloseTo(outward + Math.PI * 2)
  })

  it('rotates eight evenly spaced beams from a seeded ten-degree side offset', () => {
    const openingAngle = Math.PI * 2 / 3
    const beams = p1RotatingBeams(99, 0, 10, Math.PI / 4, openingAngle)
    const initial = p1BeamAngles(beams, 10)
    const later = p1BeamAngles(beams, 11)
    expect(initial).toHaveLength(8)
    expect(Math.abs(initial[0] - openingAngle)).toBeCloseTo(Math.PI / 18)
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
