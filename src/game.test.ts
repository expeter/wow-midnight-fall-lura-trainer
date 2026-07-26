import { describe, expect, it } from 'vitest'
import { angleToward, ARENA, assignmentRevealDistance, bossBeamHitsPlayer, canPickupCrystal, canRecoverFromWipe, crystalCarrierPosition, crystalWipeReason, difficultySettings, distance, distanceToSegment, hasActiveP3CrystalLight, healthResponsesPerPhase, INTERMISSION_SEQUENCE, isOnAssignedP3Side, isInP3ConsumedSector, isP3ConsumedSectorLethal, isP3ProtectionCrystalPlaced, isP3RuneTurn, isInSafeAnnulus, isInsideArena, isProtectedByP3Bubble, isProtectedByP3Light, jumpHeights, keepP3PointOnSide, moveInBounds, movePlayer, moveRelativeToCamera, moveWithIncreasingPull, nearestRuneEdges, npcEntryPosition, OPENING_BOOST_SECONDS, orientedAssignments, p1PositioningWipeReason, P2_BEAM_CADENCE_SECONDS, P2_BEAM_SECONDS, P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS, p2NpcCrystalDrops, P2_NPC_PREPOSITION_SECONDS, p2NpcRoamingPosition, p2NpcShouldReturnToSoak, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, p2OrbReturnState, P2_PERSONAL_CIRCLE_OUTER_RADIUS, P2_POSITIONING_SECONDS, P2_PULL_SECONDS, p2ReturningOrbPositions, P2_SPREAD_SECONDS, p3ArchangelStackPosition, p3AssignmentForRound, p3BossPosition, p3FlightPosition, P3_FLIGHT_SECONDS, p3LandingGroupCenter, p3LandingGroupIndex, p3LandingPlanIndex, p3LandingPosition, p3LandingSoakPositions, p3LightCenters, p3LightHealthRate, p3MemoryResolved, p3NpcPoolAssignment, p3NpcRuneReactionDelay, p3NpcSoaksActive, p3PoolCenters, p3PoolSoakRate, p3RuneDeadline, p3RuneEdges, p3RuneOrbs, P3_LANDING_SOAK_RADIUS, P3_RUNE_ORB_MIN_GAP, p3StarsTiming, p3WrongRuneContact, P3_OUTER_RADIUS, P3_POOL_HEALTH, P3_POOL_RADIUS, P3_SECOND_SOAK_NPC_DELAY_SECONDS, p4BossHealth, p4BoxStates, p4EncounterBoxStates, p4FrontSoakerPosition, p4GroupPosition, P4_GROUP_HIT_RADIUS, p4NpcRelocationPace, p4NpcSplinterPosition, p4PlayerSplinterDuty, p4RelocationProgress, p4SplinterAge, p4SplinterHitsGroup, p4SplinterResolutionActive, p4SplinterRotation, p4SplinterStartSeconds, p4StackPosition, p4TankConeActive, p4TransitionStartPosition, P4_BOX_COUNT, P4_BOX_MIN_SEPARATION, P4_BOX_SPEED, P4_CYCLE_SECONDS, P4_HEAVEN_START_SECONDS, P4_KNOCKUP_SECONDS, P4_MOVEMENT_MULTIPLIER, P4_PROTECTION_RADIUS, P4_SPLINTER_DETONATION_SECONDS, P4_SPLINTER_INTERVAL_SECONDS, P4_TANK_CONE_DURATION_SECONDS, P4_TANK_CONE_INTERVAL_SECONDS, personalCircleHitsCrystal, personalCircleHitsPlayer, PLAYER_COLLISION_PENALTY, randomCrystalDropDuty, randomizeP3PoolLayout, roamingNpcPosition, seededStars, separateP3NpcTarget, setP3BossPlan, shouldShowP2OrbReturnCounter, translateSelectedPoints, walkTowards, WIPE_PENALTY } from './game'
import { keepP3CrystalPoolCovered, keepP4NpcInProtection, p3CrystalPoolCoverageTargets, P3_APPROACH_NPC_SPEED_MULTIPLIER, P3_APPROACH_SECONDS, P3_MEMORY_START_SECONDS, P3_RUNE_HALF_CLEARANCE, P3_SAFE_ZONE_GRACE_SECONDS, P3_SAFE_ZONE_PENALTY_PER_SECOND, P3_SECTOR_SECONDS, p3UnsafePenaltyTicks, P4_SPLINTER_RETURN_SECONDS } from './game'
import { p3ProtectionBubbleCenter } from './game'
import type { Point } from './game'
import { P3_LIGHT_RADIUS, p3SpreadPosition, p4TankKillsBox, P4_TANK_KILL_RADIUS } from './game'
import { isP3RaidMemberVisible, p3ActiveCrystalAssignments } from './game'

describe('Intermission game rules', () => {
  it('creates six deterministic stars for a seed', () => { expect(seededStars(42)).toEqual(seededStars(42)); expect(seededStars(42)).toHaveLength(6) })
  it('moves with normalized WASD input and keeps the player in bounds', () => { const p = movePlayer({ x: 20, y: 20 }, new Set(['w', 'a']), 200, 1); expect(p.x).toBe(24); expect(p.y).toBe(24) })
  it('moves continuously in zoomed world coordinates without adding a camera offset', () => { const bounds = { minX: 30, maxX: 1070, minY: 30, maxY: 790 }; expect(moveInBounds({ x: 550, y: 410 }, new Set(['d']), 100, .5, bounds)).toEqual({ x: 600, y: 410 }); expect(moveInBounds({ x: 600, y: 410 }, new Set(), 100, .5, bounds)).toEqual({ x: 600, y: 410 }) })
  it('recognizes the safe arena ring', () => { expect(isInsideArena(ARENA.center)).toBe(true); expect(isInsideArena({ x: 10, y: 10 })).toBe(false); expect(distance(ARENA.center, ARENA.center)).toBe(0) })
  it('makes hard mode faster and easy mode assisted', () => { expect(difficultySettings('hard').speed).toBeGreaterThan(difficultySettings('normal').speed); expect(difficultySettings('easy').helper).toBe(true) })
  it('alternates three-second beam and Starsplinter packs without an idle gap', () => { expect(INTERMISSION_SEQUENCE.map(step => step.kind)).toEqual(['beam', 'splinter']); expect(INTERMISSION_SEQUENCE.map(step => step.seconds)).toEqual([3, 3]) })
  it('only treats the band between the two arena circles as safe', () => { const center = { x: 100, y: 100 }; expect(isInSafeAnnulus({ x: 160, y: 100 }, center, 50, 80)).toBe(true); expect(isInSafeAnnulus({ x: 120, y: 100 }, center, 50, 80)).toBe(false); expect(isInSafeAnnulus({ x: 190, y: 100 }, center, 50, 80)).toBe(false) })
  it('wipes P1 positioning only when the player misses the playable ring', () => { const center = { x: 100, y: 100 }; expect(p1PositioningWipeReason({ x: 160, y: 100 }, center, 50, 80)).toBeNull(); expect(p1PositioningWipeReason({ x: 190, y: 100 }, center, 50, 80)).toMatch(/did not reach/i); expect(p1PositioningWipeReason({ x: 120, y: 100 }, center, 50, 80)).toMatch(/did not reach/i) })
  it('keeps personal jumps on the player while scripted jumps lift the raid', () => { const personal = jumpHeights(0, .5); expect(personal.player).toBeCloseTo(8); expect(personal.npc).toBe(0); const scripted = jumpHeights(.5, 0); expect(scripted.player).toBeCloseTo(42); expect(scripted.npc).toBeCloseTo(42) })
  it('maps forward and strafe movement to the camera direction', () => { const bounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }; expect(moveRelativeToCamera({ x: 500, y: 500 }, new Set(['w']), 100, 1, { x: 0, y: -1 }, bounds)).toEqual({ x: 500, y: 400 }); expect(moveRelativeToCamera({ x: 500, y: 500 }, new Set(['d']), 100, 1, { x: 0, y: -1 }, bounds)).toEqual({ x: 600, y: 500 }) })
  it('applies the optional backward-speed penalty without slowing forward or strafing', () => { const bounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }; const start = { x: 500, y: 500 }; const forward = { x: 0, y: -1 }; expect(moveRelativeToCamera(start, new Set(['s']), 100, 1, forward, bounds, .5)).toEqual({ x: 500, y: 550 }); expect(moveRelativeToCamera(start, new Set(['w']), 100, 1, forward, bounds, .5)).toEqual({ x: 500, y: 400 }); expect(moveRelativeToCamera(start, new Set(['d']), 100, 1, forward, bounds, .5)).toEqual({ x: 600, y: 500 }) })
  it('calculates the spawn facing directly toward the room center', () => { const center = { x: 480, y: 270 }; expect(angleToward({ x: 480, y: 500 }, center)).toBeCloseTo(-Math.PI / 2); expect(angleToward({ x: 700, y: 270 }, center)).toBeCloseTo(Math.PI) })
  it('allows movement against the early pull but overwhelms it at full force', () => { const bounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }; const start = { x: 600, y: 500 }; const center = { x: 500, y: 500 }; expect(moveWithIncreasingPull(start, new Set(['w']), 15, 1, { x: 1, y: 0 }, bounds, center, 0).x).toBeGreaterThan(start.x); expect(moveWithIncreasingPull(start, new Set(['w']), 15, 1, { x: 1, y: 0 }, bounds, center, 1).x).toBeLessThan(start.x) })
  it('requires the crystal to unlock and the player to move closer than simple model contact', () => { const crystal = { x: 100, y: 100 }; expect(canPickupCrystal({ x: 100, y: 100 }, crystal, .9)).toBe(false); expect(canPickupCrystal({ x: 104, y: 100 }, crystal, 2)).toBe(false); expect(canPickupCrystal({ x: 102.9, y: 100 }, crystal, 2)).toBe(true) })
  it('only resolves a boss beam against the player at the end of its telegraph', () => { const origin = { x: 0, y: 0 }; const player = { x: 100, y: 0 }; expect(bossBeamHitsPlayer(player, origin, [0], 12, 2.5)).toBe(false); expect(bossBeamHitsPlayer(player, origin, [0], 12, 2.9)).toBe(true); expect(bossBeamHitsPlayer({ x: 100, y: 20 }, origin, [0], 12, 2.9)).toBe(false) })
  it('moves NPCs out of boss lines and returns crystal carriers to their drop', () => { const center = { x: 0, y: 0 }; const base = { x: 100, y: 0 }; const idle = roamingNpcPosition(base, 0, 0, 'positioning', 2, [0], center); const dodging = roamingNpcPosition(base, 0, 0, 'beam', 2, [0], center); expect(Math.abs(dodging.y)).toBeGreaterThan(Math.abs(idle.y)); const away = crystalCarrierPosition(base, base, 2, 0, center); const returned = crystalCarrierPosition(base, base, 5, 0, center); expect(distance(away, base)).toBeGreaterThan(15); expect(distance(returned, base)).toBeLessThan(.01) })
  it('treats a missed drop, a crystal hit, and an expired pickup as 500-point wipes', () => { expect(WIPE_PENALTY).toBe(500); expect(crystalWipeReason({ assigned: true, splinterResolving: true, dropped: false, crystalHit: false, expired: false })).toMatch(/before you dropped/i); expect(crystalWipeReason({ assigned: true, splinterResolving: true, dropped: true, crystalHit: true, expired: false })).toMatch(/hit your crystal/i); expect(crystalWipeReason({ assigned: true, splinterResolving: false, dropped: true, crystalHit: false, expired: true })).toMatch(/expired/i); expect(crystalWipeReason({ assigned: false, splinterResolving: true, dropped: false, crystalHit: false, expired: false })).toBeNull() })
  it('rotates assignments from the South reference while leaving world markers independent', () => { const center = { x: 0, y: 0 }; const assignment = [{ x: 0, y: 10 }]; expect(orientedAssignments(assignment, { x: 0, y: -20 }, center)[0].y).toBeCloseTo(-10); expect(orientedAssignments(assignment, { x: 20, y: 0 }, center)[0].x).toBeCloseTo(10) })
  it('moves NPCs from the chosen entry toward their assignment at configured speed', () => { const target = { x: 100, y: 0 }; const start = { x: 0, y: 0 }; expect(npcEntryPosition(target, start, 0, 1, 20)).toEqual({ x: 20, y: 0 }); expect(npcEntryPosition(target, start, 0, 10, 20)).toEqual(target) })
  it('holds P1 NPCs exactly on their raid-plan anchor during positioning', () => { const anchor = { x: 100, y: 100 }; expect(roamingNpcPosition(anchor, 4, 20, 'positioning', 5, [], { x: 0, y: 0 })).toEqual(anchor) })
  it('uses 500-point crystal wipes and 50-point player collisions', () => { expect(WIPE_PENALTY).toBe(500); expect(PLAYER_COLLISION_PENALTY).toBe(50) })
  it('drops the other P2 carrier crystals in the middle and detects a player circle hitting them', () => { const center = { x: 480, y: 270 }; const drops = p2NpcCrystalDrops(center, 5); expect(drops).toHaveLength(5); expect(drops.every(crystal => distance(crystal, center) <= 6.01)).toBe(true); expect(personalCircleHitsCrystal(center, drops)).toBe(true); expect(personalCircleHitsCrystal({ x: 510, y: 270 }, drops)).toBe(false) })
  it('lets Easy and Normal recover from the first wipe while Hard ends immediately', () => { expect(canRecoverFromWipe('easy', 1, 1000, WIPE_PENALTY)).toBe(true); expect(canRecoverFromWipe('normal', 1, 1000, WIPE_PENALTY)).toBe(true); expect(canRecoverFromWipe('normal', 2, 500, WIPE_PENALTY)).toBe(false); expect(canRecoverFromWipe('hard', 1, 1000, WIPE_PENALTY)).toBe(false) })
  it('schedules one optional health response in every enabled phase', () => { expect(healthResponsesPerPhase('test')).toBe(0); expect(healthResponsesPerPhase('easy')).toBe(0); expect(healthResponsesPerPhase('normal')).toBe(1); expect(healthResponsesPerPhase('hard')).toBe(1) })
  it('randomly assigns a crystal carrier to the first or second P3 drop', () => { expect(randomCrystalDropDuty(.1)).toBe(1); expect(randomCrystalDropDuty(.9)).toBe(2) })
  it('uses a five-second opening boost and tighter assignment reveals by difficulty', () => { expect(OPENING_BOOST_SECONDS).toBe(5); expect(assignmentRevealDistance('easy')).toBe(Infinity); expect(assignmentRevealDistance('normal')).toBe(45); expect(assignmentRevealDistance('hard')).toBe(22) })
  it('keeps Test mode assisted and recoverable regardless of strike count', () => { expect(difficultySettings('test').helper).toBe(true); expect(assignmentRevealDistance('test')).toBe(Infinity); expect(canRecoverFromWipe('test', 20, 0, WIPE_PENALTY)).toBe(true) })
  it('splits Phase 3 landings and pool assignments across both room halves', () => { const center = { x: 480, y: 270 }; expect(p3LandingPosition(0, center).x).toBeLessThan(center.x); expect(p3LandingPosition(10, center).x).toBeGreaterThan(center.x); expect(p3PoolCenters(-1, center, 1)).toHaveLength(3); expect(p3PoolCenters(1, center, 1).every(point => point.x > center.x)).toBe(true) })
  it('derives mixed-roster Phase 3 landing groups from raid-plan sides', () => { const center = { x: 480, y: 270 }; const positions = Array.from({ length: 20 }, (_, index) => ({ x: [0, 3, 5, 9, 11, 12, 13, 14, 15, 17].includes(index) ? 550 : 410, y: 390 })); expect(p3LandingPlanIndex(14, positions, center)).toBeGreaterThanOrEqual(10); expect(p3LandingPosition(p3LandingPlanIndex(14, positions, center), center).x).toBeGreaterThan(center.x); expect(p3LandingPlanIndex(19, positions, center)).toBeLessThan(10); expect(p3LandingPosition(p3LandingPlanIndex(19, positions, center), center).x).toBeLessThan(center.x) })
  it('lands the raid in six compact groups with independent randomized soak locations', () => { const center = { x: 480, y: 270 }; const centers = Array.from({ length: 20 }, (_, index) => p3LandingGroupCenter(index, center)); expect(P3_OUTER_RADIUS).toBe(199); expect(new Set(centers.map(point => `${point.x.toFixed(2)}:${point.y.toFixed(2)}`)).size).toBe(6); expect(Math.min(...centers.map(point => point.x))).toBeLessThan(center.x); expect(Math.max(...centers.map(point => point.x))).toBeGreaterThan(center.x); expect(Math.min(...centers.map(point => point.y))).toBeLessThan(center.y); expect(Math.max(...centers.map(point => point.y))).toBeGreaterThan(center.y); expect(new Set(Array.from({ length: 20 }, (_, index) => p3LandingGroupIndex(index))).size).toBe(6); expect(distance(p3LandingPosition(0, center), p3LandingPosition(2, center))).toBeLessThan(8); expect(p3LandingSoakPositions(0, center, 1234)).toEqual(p3LandingSoakPositions(2, center, 1234)); expect(p3LandingSoakPositions(0, center, 1234)).not.toEqual(p3LandingSoakPositions(0, center, 5678)); const landing = p3LandingGroupCenter(0, center); const soaks = p3LandingSoakPositions(0, center, 1234); expect(soaks.every(point => distance(landing, point) >= 21 && distance(landing, point) <= 28.01)).toBe(true); expect(distance(soaks[0], landing)).toBeGreaterThanOrEqual(distance(soaks[1], landing)); const layouts = Array.from({ length: 100 }, (_, seed) => p3LandingSoakPositions(0, center, seed)); expect(Math.min(...layouts.map(points => distance(points[0], points[1])))).toBeGreaterThanOrEqual(P3_LANDING_SOAK_RADIUS * 2); expect(Math.min(...layouts.flatMap(points => points.flatMap(point => [0, 1, 2].map(member => distance(point, p3LandingPosition(member, center))))))).toBeGreaterThanOrEqual(15); expect(p3LandingSoakPositions(0, center, 1234)).not.toEqual(p3LandingSoakPositions(3, center, 1234)) })
  it('moves the P2 stack visibly through the full two-second P3 knockback', () => { const origin = { x: 480, y: 270 }; const target = { x: 320, y: 170 }; expect(p3FlightPosition(origin, target, 0)).toEqual(origin); const midpoint = p3FlightPosition(origin, target, P3_FLIGHT_SECONDS / 2); expect(distance(midpoint, origin)).toBeGreaterThan(0); expect(distance(midpoint, target)).toBeGreaterThan(0); expect(p3FlightPosition(origin, target, P3_FLIGHT_SECONDS)).toEqual(target) })
  it('derives the active P3 room half from raid-plan positions instead of roster indices', () => {
    const center = { x: 480, y: 270 }
    const player = { x: 420, y: 360 }
    expect(isP3RaidMemberVisible(player, { x: 430, y: 390 }, center, true)).toBe(true)
    expect(isP3RaidMemberVisible(player, { x: 530, y: 390 }, center, true)).toBe(false)
    expect(isP3RaidMemberVisible(player, { x: 530, y: 390 }, center, false)).toBe(true)
  })
  it('keeps cross-roster P3 crystal assignments together on their planned side', () => {
    const center = { x: 480, y: 270 }
    const assignments = [8, 11, 12, 15, 16, 18]
    const positions = Array.from({ length: 20 }, (_, index) => ({ x: index < 10 ? 420 : 540, y: 360 }))
    positions[16] = { x: 410, y: 390 }
    positions[18] = { x: 440, y: 380 }
    positions[11] = { x: 550, y: 380 }
    positions[12] = { x: 540, y: 390 }
    positions[15] = { x: 530, y: 370 }
    const active = p3ActiveCrystalAssignments(assignments, 19, null, false, 1, 'p3-light-pools', 1234, positions, center)
    expect(active.filter(index => positions[index].x < center.x)).toEqual([8, 16, 18])
    expect(active.filter(index => positions[index].x >= center.x)).toEqual([11, 12, 15])
  })
  it('keeps P3 actors and crystal light footprints on their assigned divider side', () => { const center = { x: 480, y: 270 }; expect(keepP3PointOnSide({ x: 520, y: 300 }, -1, center, 26)).toEqual({ x: 454, y: 300 }); expect(keepP3PointOnSide({ x: 440, y: 300 }, 1, center, 26)).toEqual({ x: 506, y: 300 }) })
  it('gives NPCs a 50% movement bonus while approaching their P3 assignment', () => { expect(P3_APPROACH_NPC_SPEED_MULTIPLIER).toBe(1.5) })
  it('allows ten seconds to reach the assigned P3 side without requiring the exact marker', () => {
    const center = { x: 480, y: 270 }
    expect(P3_APPROACH_SECONDS).toBe(10)
    expect(isOnAssignedP3Side({ x: 700, y: 100 }, { x: 520, y: 400 }, center)).toBe(true)
    expect(isOnAssignedP3Side({ x: 470, y: 400 }, { x: 520, y: 400 }, center)).toBe(false)
  })
  it('charges ten points per full second outside P3 protection after a five-second grace period', () => {
    expect(P3_SAFE_ZONE_GRACE_SECONDS).toBe(5)
    expect(P3_SAFE_ZONE_PENALTY_PER_SECOND).toBe(10)
    expect(p3UnsafePenaltyTicks(0, 5.99)).toBe(0)
    expect(p3UnsafePenaltyTicks(5.99, 6.01)).toBe(1)
    expect(p3UnsafePenaltyTicks(6.01, 8.1)).toBe(2)
    expect(p3UnsafePenaltyTicks(0, 20)).toBe(15)
  })
  it('keeps three P3 crystals per side until Dark Archangel consumes one per side', () => {
    const assignments = [1, 4, 7, 11, 14, 17]
    expect(p3ActiveCrystalAssignments(assignments, 0, null, false, 1, 'p3-light-pools')).toEqual(assignments)
    const npcDrop = p3ActiveCrystalAssignments(assignments, 0, null, false, 1, 'p3-sector-move', 1234)
    expect(npcDrop.filter(index => index < 10)).toHaveLength(2)
    expect(npcDrop.filter(index => index >= 10)).toHaveLength(2)
    expect(p3ActiveCrystalAssignments(assignments, 1, 1, true, 1, 'p3-sector-move', 1234)).not.toContain(1)
    expect(p3ActiveCrystalAssignments(assignments, 1, 2, false, 2, 'p3-light-pools', 1234)).toContain(1)
    const randomNpcDrops = new Set(Array.from({ length: 8 }, (_, seed) => p3ActiveCrystalAssignments(assignments, 0, null, false, 1, 'p3-sector-move', seed).join(',')))
    expect(randomNpcDrops.size).toBeGreaterThan(1)
  })
  it('gives each same-side P3 crystal carrier a distinct light anchor', () => {
    const center = { x: 480, y: 270 }
    const carriers = [1, 4, 7].map((index, slot) => p3SpreadPosition(index, true, center, 1, slot))
    expect(carriers.every((carrier, index) => carriers.slice(index + 1).every(other => distance(carrier, other) > 30))).toBe(true)
  })
  it('makes Phase 3 light recovery gentler and faster than its damage', () => { expect(p3LightHealthRate(true)).toBe(12); expect(p3LightHealthRate(false)).toBe(-2); expect(p3LightHealthRate(true)).toBeGreaterThan(Math.abs(p3LightHealthRate(false))) })
  it('removes a crystal carrier’s moving P3 light after Dark Archangel spends the crystal', () => { expect(hasActiveP3CrystalLight(true, false)).toBe(true); expect(hasActiveP3CrystalLight(true, true)).toBe(false); expect(hasActiveP3CrystalLight(false, false)).toBe(false) })
  it('protects the player using the same moving NPC light center that is rendered', () => { const movingLight = { x: 140, y: 100 }; expect(isProtectedByP3Light({ x: 165, y: 100 }, false, [movingLight])).toBe(true); expect(isProtectedByP3Light({ x: 168.1, y: 100 }, false, [movingLight])).toBe(false) })
  it('keeps P3 NPC bodies apart and reserves non-overlapping light zones for crystal carriers', () => { const occupied = [{ point: { x: 100, y: 100 }, crystal: false }, { point: { x: 130, y: 100 }, crystal: true }]; expect(distance(separateP3NpcTarget({ x: 102, y: 100 }, false, occupied), occupied[0].point)).toBeGreaterThanOrEqual(7); expect(distance(separateP3NpcTarget({ x: 132, y: 100 }, true, occupied), occupied[1].point)).toBeGreaterThanOrEqual(P3_LIGHT_RADIUS * 2) })
  it('gives the assisting memory partner a stable one-to-six-second reaction delay', () => { const delay = p3NpcRuneReactionDelay(1234, 7, 2); expect(delay).toBe(p3NpcRuneReactionDelay(1234, 7, 2)); expect(delay).toBeGreaterThanOrEqual(1); expect(delay).toBeLessThan(6); expect(new Set(Array.from({ length: 12 }, (_, seed) => p3NpcRuneReactionDelay(seed, 7, 2).toFixed(2))).size).toBeGreaterThan(4) })
  it('counts the visible player footprint at the edge of Dark Archangel protection', () => { const bubble = { x: 100, y: 100 }; expect(isProtectedByP3Bubble({ x: 128, y: 100 }, bubble)).toBe(true); expect(isProtectedByP3Bubble({ x: 128.1, y: 100 }, bubble)).toBe(false) })
  it('accepts a protection crystal anywhere inside the visible Dark Archangel protection area', () => { const stack = { x: 100, y: 100 }; expect(isP3ProtectionCrystalPlaced({ x: 124, y: 100 }, stack)).toBe(true); expect(isP3ProtectionCrystalPlaced({ x: 124.1, y: 100 }, stack)).toBe(false) })
  it('uses NPC protection when the player is assigned to the other Dark Archangel', () => { const stack = { x: 100, y: 100 }; const prematurePlayerCrystal = { x: 150, y: 150 }; expect(p3ProtectionBubbleCenter(stack, prematurePlayerCrystal, 2, 1)).toEqual(stack); expect(p3ProtectionBubbleCenter(stack, prematurePlayerCrystal, 2, 2)).toEqual(prematurePlayerCrystal) })
  it('requires three players and accelerates a P3 Soak for every extra player', () => { expect(P3_POOL_HEALTH).toBe(35); expect(p3PoolSoakRate(0)).toBe(0); expect(p3PoolSoakRate(1)).toBe(0); expect(p3PoolSoakRate(2)).toBe(0); expect(p3PoolSoakRate(3)).toBe(3); expect(p3PoolSoakRate(4)).toBe(4); expect(p3PoolSoakRate(5)).toBe(5); expect(p3PoolSoakRate(6)).toBe(6); expect(P3_POOL_HEALTH / p3PoolSoakRate(3)).toBeCloseTo(11.67, 2) })
  it('leaves the player pool one NPC short and biases extra help toward the other two pools', () => {
    expect(P3_SECOND_SOAK_NPC_DELAY_SECONDS).toBe(4)
    const initial = Array.from({ length: 9 }, (_, ordinal) => p3NpcPoolAssignment(ordinal, true, 0, [42, 42, 42]))
    expect(initial.filter(pool => pool === 0)).toHaveLength(2)
    expect(initial.filter(pool => pool === 1)).toHaveLength(4)
    expect(initial.filter(pool => pool === 2)).toHaveLength(3)
    expect(initial.filter(pool => pool === null)).toHaveLength(0)
    expect(p3NpcPoolAssignment(0, true, 0, [0, 42, 42])).toBe(1)
    expect(p3NpcPoolAssignment(8, true, 0, [0, 42, 42])).toBe(1)
    expect(p3NpcPoolAssignment(0, true, 0, [0, 42, 42], [0, 5, 0])).toBe(2)
    expect(p3NpcPoolAssignment(0, true, 0, [0, 42, 42], [0, 5, 5])).toBeNull()
  })
  it('holds first-round NPC Soak movement for the player and guarantees delayed help in round two', () => { expect(p3NpcSoaksActive(false, 1, 15)).toBe(false); expect(p3NpcSoaksActive(true, 1, 0)).toBe(true); expect(p3NpcSoaksActive(false, 2, P3_SECOND_SOAK_NPC_DELAY_SECONDS - .01)).toBe(false); expect(p3NpcSoaksActive(false, 2, P3_SECOND_SOAK_NPC_DELAY_SECONDS)).toBe(true); expect(p3NpcSoaksActive(true, 2, 0)).toBe(true) })
  it('places crystal carriers outside Phase 3 Soaks while their lights cover every possible pool', () => {
    const center = { x: 480, y: 270 }
    for (const side of [-1, 1] as const) {
      const pools = p3PoolCenters(side, center, 1)
      const anchors = p3LightCenters(side, center, 1)
      const targets = p3CrystalPoolCoverageTargets(pools, anchors)
      expect(targets).toHaveLength(3)
      expect(pools.every(pool => targets.some(target => distance(target, pool) + P3_POOL_RADIUS <= P3_LIGHT_RADIUS))).toBe(true)
      expect(targets.every(target => pools.every(pool => distance(target, pool) >= P3_POOL_RADIUS + 2))).toBe(true)
      const separated = separateP3NpcTarget(targets[0], true, [{ point: targets[1], crystal: true }])
      const assignedPool = pools.reduce((nearest, pool) => distance(targets[0], pool) < distance(targets[0], nearest) ? pool : nearest)
      const coveragePriority = keepP3CrystalPoolCovered(separated, assignedPool)
      expect(distance(coveragePriority, assignedPool)).toBeGreaterThan(P3_POOL_RADIUS)
      expect(distance(coveragePriority, assignedPool) + P3_POOL_RADIUS).toBeLessThanOrEqual(P3_LIGHT_RADIUS)
    }
  })
  it('covers the P3 formation with twenty irregular orbs and non-crossing links', () => {
    const center = { x: 480, y: 270 }
    const side = -1 as const
    const orbs = p3RuneOrbs(side, center, 1)
    const edges = nearestRuneEdges(orbs)
    const degree = Array.from({ length: orbs.length }, (_, index) => edges.filter(edge => edge.includes(index)).length)
    const minX = Math.min(...orbs.map(point => point.x)); const maxX = Math.max(...orbs.map(point => point.x))
    const minY = Math.min(...orbs.map(point => point.y)); const maxY = Math.max(...orbs.map(point => point.y))
    const coverage = [p3BossPosition(side, center, 1), ...p3LightCenters(side, center, 1), ...p3PoolCenters(side, center, 1)]
    const orientation = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
    const crossing = edges.some(([a, b], edgeIndex) => edges.slice(edgeIndex + 1).some(([c, d]) =>
      a !== c && a !== d && b !== c && b !== d
      && orientation(orbs[a], orbs[b], orbs[c]) * orientation(orbs[a], orbs[b], orbs[d]) < 0
      && orientation(orbs[c], orbs[d], orbs[a]) * orientation(orbs[c], orbs[d], orbs[b]) < 0
    ))
    expect(orbs).toHaveLength(20)
    expect(orbs.every((orb, index) => orbs.slice(index + 1).every(other => distance(orb, other) >= P3_RUNE_ORB_MIN_GAP))).toBe(true)
    expect(new Set(orbs.map(point => `${point.x.toFixed(2)}:${point.y.toFixed(2)}`)).size).toBe(20)
    expect(coverage.every(point => point.x > minX && point.x < maxX && point.y > minY && point.y < maxY)).toBe(true)
    expect(edges.length).toBeGreaterThan(18)
    expect(Math.max(...degree)).toBeLessThanOrEqual(3)
    expect(crossing).toBe(false)
    expect(edges.every(([from, to]) => distance(orbs[from], orbs[to]) <= 72)).toBe(true)
    expect(edges.every(([from, to]) => {
      const beamLength = distance(orbs[from], orbs[to])
      return orbs.every((point, index) => index === from || index === to || distance(orbs[from], point) >= beamLength || distance(orbs[to], point) >= beamLength)
    })).toBe(true)
    expect(edges.every(([from, to]) => orbs.every((point, index) => index === from || index === to || distanceToSegment(point, orbs[from], orbs[to]) >= 8))).toBe(true)
  })
  it('keeps second-round Stars out of the consumed purple sector', () => {
    const center = { x: 480, y: 270 }
    for (const side of [-1, 1] as const) {
      for (let cycle = 0; cycle < 8; cycle += 1) {
        const orbs = p3RuneOrbs(side, center, 2, cycle)
        expect(orbs).toHaveLength(20)
        expect(orbs.every(orb => !isInP3ConsumedSector(orb, center, 102, P3_OUTER_RADIUS))).toBe(true)
        expect(orbs.every((orb, index) => orbs.slice(index + 1).every(other => distance(orb, other) >= P3_RUNE_ORB_MIN_GAP))).toBe(true)
      }
    }
  })
  it('keeps Phase 3 Stars beams out of every Soak circle', () => { const center = { x: 480, y: 270 }; ([-1, 1] as const).forEach(side => { const orbs = p3RuneOrbs(side, center, 1, 2); const edges = p3RuneEdges(side, center, 1, orbs); expect(edges.length).toBeGreaterThan(8); p3PoolCenters(side, center, 1).forEach(pool => expect(edges.every(([from, to]) => distanceToSegment(pool, orbs[from], orbs[to]) >= P3_POOL_RADIUS + 3)).toBe(true)) }) })
  it('keeps the southwest and southeast Stars fields separated across attempts', () => {
    const center = { x: 480, y: 270 }
    for (let layout = 1; layout <= 12; layout += 1) {
      randomizeP3PoolLayout(layout)
      for (const round of [1, 2]) {
        for (let cycle = 0; cycle < 8; cycle += 1) {
          const left = p3RuneOrbs(-1, center, round, cycle)
          const right = p3RuneOrbs(1, center, round, cycle)
          expect(left).toHaveLength(20)
          expect(right).toHaveLength(20)
          expect(left.every(orb => orb.x <= center.x - P3_RUNE_HALF_CLEARANCE)).toBe(true)
          expect(right.every(orb => orb.x >= center.x + P3_RUNE_HALF_CLEARANCE)).toBe(true)
          for (const field of [left, right]) expect(field.every((orb, index) => field.slice(index + 1).every(other => distance(orb, other) >= P3_RUNE_ORB_MIN_GAP))).toBe(true)
        }
      }
    }
  })
  it('keeps round-two player targets and complete yellow light areas outside the consumed sector', () => {
    const center = { x: 480, y: 270 }
    for (const side of [-1, 1] as const) {
      const initial = { x: center.x + side * 95, y: center.y + 125 }
      expect(isInP3ConsumedSector(p3AssignmentForRound(initial, center, 2), center, 102, P3_OUTER_RADIUS)).toBe(false)
      for (const light of p3LightCenters(side, center, 2)) {
        const footprint = Array.from({ length: 24 }, (_, index) => {
          const angle = index * Math.PI * 2 / 24
          return { x: light.x + Math.cos(angle) * 26, y: light.y + Math.sin(angle) * 26 }
        })
        expect(footprint.every(point => !isInP3ConsumedSector(point, center, 102, P3_OUTER_RADIUS))).toBe(true)
      }
    }
  })
  it('spreads P3 NPC slots around their light anchors and biases them toward the boss', () => {
    const center = { x: 480, y: 270 }
    for (const side of [-1, 1] as const) {
      const offset = side < 0 ? 0 : 10
      const positions = Array.from({ length: 10 }, (_, index) => p3SpreadPosition(index + offset, index % 4 === 0, center, 2))
      const boss = p3BossPosition(side, center, 2)
      const anchors = p3LightCenters(side, center, 2)
      expect(positions.every((position, index) => distance(position, anchors[index % 3]) < P3_LIGHT_RADIUS)).toBe(true)
      expect(positions.every((position, index) => positions.slice(index + 1).every(other => distance(position, other) > 6))).toBe(true)
      const averageBossDistance = positions.reduce((sum, position) => sum + distance(position, boss), 0) / positions.length
      const averageAnchorDistance = Array.from({ length: 10 }, (_, index) => distance(anchors[index % 3], boss)).reduce((sum, value) => sum + value, 0) / 10
      expect(averageBossDistance).toBeLessThan(averageAnchorDistance)
    }
  })
  it('leaves three clear seconds between changing Stars patterns', () => { expect(p3StarsTiming(4.99).active).toBe(false); expect(p3StarsTiming(5)).toEqual({ active: true, cycle: 0, localTime: 0 }); expect(p3StarsTiming(9.5).active).toBe(false); expect(p3StarsTiming(12.49).active).toBe(false); expect(p3StarsTiming(12.5).cycle).toBe(1); expect(p3StarsTiming(12.5).active).toBe(true); expect(p3RuneOrbs(-1, { x: 480, y: 270 }, 1, 0)).not.toEqual(p3RuneOrbs(-1, { x: 480, y: 270 }, 1, 1)) })
  it('keeps P3 Soaks active through the full fifteen-second memory overlap before Big Boom', () => { expect(P3_SECTOR_SECONDS).toBe(40); expect(P3_MEMORY_START_SECONDS).toBe(25); expect(P3_SECTOR_SECONDS - P3_MEMORY_START_SECONDS).toBe(15) })
  it('keeps the P2 sequence on its configured thirty-second cross-beam cadence', () => {
    expect(P2_POSITIONING_SECONDS).toBe(5)
    expect(P2_BEAM_SECONDS).toBe(7)
    expect(P2_PULL_SECONDS).toBe(5)
    expect(P2_SPREAD_SECONDS).toBe(5)
    expect(P2_BEAM_SECONDS + P2_ORB_RETURN_SECONDS).toBe(20)
    expect(P2_BEAM_SECONDS + P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS).toBe(P2_BEAM_CADENCE_SECONDS)
    expect(P2_ORB_RETURN_GLOW_SECONDS).toBe(1)
    expect(P2_ORB_RETURN_TRAVEL_SECONDS).toBe(1)
  })
  it('lets P2 NPCs roam and dodge returning orbs until the final three-second preposition', () => {
    expect(P2_NPC_PREPOSITION_SECONDS).toBe(3)
    expect(p2NpcShouldReturnToSoak(P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - 3.01)).toBe(false)
    expect(p2NpcShouldReturnToSoak(P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - 3)).toBe(true)
    const base = { x: 510, y: 270 }
    const orb = { x: 518, y: 270 }
    const roaming = p2NpcRoamingPosition(base, 0, 0, [orb], { x: 480, y: 270 }, 53)
    expect(distance(roaming, { x: 480, y: 270 })).toBeLessThanOrEqual(53)
    expect(distance(roaming, orb)).toBeGreaterThan(distance(base, orb))
  })
  it('charges struck P2 orbs after thirteen seconds before a one-second inward return', () => {
    expect(p2OrbReturnState(-1).phase).toBe('inactive')
    expect(p2OrbReturnState(12.99)).toEqual({ phase: 'orbiting', radius: 82 })
    expect(p2OrbReturnState(13)).toEqual({ phase: 'charging', radius: 82 })
    expect(p2OrbReturnState(14).phase).toBe('returning')
    expect(p2OrbReturnState(14.5).radius).toBeCloseTo(61.5)
    expect(p2OrbReturnState(15)).toEqual({ phase: 'done', radius: 0 })
  })
  it('provides four deterministic P2 return-orb collision positions', () => { const center = { x: 480, y: 270 }; const positions = p2ReturningOrbPositions(14.5, 2, 30, center); expect(positions).toHaveLength(4); positions.forEach(position => expect(distance(position, center)).toBeCloseTo(61.5)); expect(p2ReturningOrbPositions(15, 2, 30, center)).toEqual([]) })
  it('enforces the displayed Phase 3 rune order with a short overlap at turn boundaries', () => { const order = ['X', 'T', 'O'] as const; expect(isP3RuneTurn([...order], 'X', 25)).toBe(true); expect(isP3RuneTurn([...order], 'T', 25)).toBe(false); expect(isP3RuneTurn([...order], 'X', 29.8)).toBe(true); expect(isP3RuneTurn([...order], 'T', 29.8)).toBe(true); expect(isP3RuneTurn([...order], 'T', 30.1)).toBe(true); expect(isP3RuneTurn([...order], 'T', 35.2)).toBe(true); expect(isP3RuneTurn([...order], 'O', 35.1)).toBe(true); expect(p3RuneDeadline([...order], 'T')).toBe(35) })
  it('requires every ordered rune pair to resolve before Big Boom', () => { const order = ['X', 'T', 'O'] as const; expect(p3MemoryResolved([...order], ['X', 'T'])).toBe(false); expect(p3MemoryResolved([...order], ['X', 'T', 'O'])).toBe(true) })
  it('treats contact with another memory symbol as a recoverable player mistake', () => { expect(p3WrongRuneContact(['T'], 'T')).toBeNull(); expect(p3WrongRuneContact(['T', 'X'], 'T')).toBe('X'); expect(PLAYER_COLLISION_PENALTY).toBe(50) })
  it('randomizes the three Soaks around their boss with a fifteen-yard gap and outside the inner void', () => { const center = { x: 480, y: 270 }; const pools = p3PoolCenters(-1, center, 1); const pairDistances = [distance(pools[0], pools[1]), distance(pools[0], pools[2]), distance(pools[1], pools[2])]; expect(pairDistances.every(value => value >= P3_POOL_RADIUS * 2 + 15)).toBe(true); expect(pools.every(pool => distance(pool, center) - P3_POOL_RADIUS > 102)).toBe(true); const area = Math.abs((pools[1].x - pools[0].x) * (pools[2].y - pools[0].y) - (pools[1].y - pools[0].y) * (pools[2].x - pools[0].x)); expect(area).toBeGreaterThan(30) })
  it('keeps second-sector Soaks fully clear of the consumed southern third', () => {
    const center = { x: 480, y: 270 }
    const pools = [...p3PoolCenters(-1, center, 2), ...p3PoolCenters(1, center, 2)]
    expect(pools.every(pool => Array.from({ length: 8 }, (_, index) => {
      const angle = index * Math.PI / 4
      return { x: pool.x + Math.cos(angle) * (P3_POOL_RADIUS + 2), y: pool.y + Math.sin(angle) * (P3_POOL_RADIUS + 2) }
    }).every(point => !isInP3ConsumedSector(point, center, 102, P3_OUTER_RADIUS)))).toBe(true)
  })
  it('chooses a fresh stable Soak layout for each attempt', () => { const center = { x: 480, y: 270 }; randomizeP3PoolLayout(101); const first = p3PoolCenters(-1, center, 1); expect(p3PoolCenters(-1, center, 1)).toEqual(first); randomizeP3PoolLayout(202); expect(p3PoolCenters(-1, center, 1)).not.toEqual(first) })
  it('moves a selected raid-plan group around its clicked anchor without changing its formation', () => { const points = [{ x: 10, y: 10 }, { x: 20, y: 15 }, { x: 80, y: 80 }]; const moved = translateSelectedPoints(points, [0, 1], { x: 50, y: 50 }); expect(moved[2]).toEqual(points[2]); expect(distance(moved[0], moved[1])).toBeCloseTo(distance(points[0], points[1])); expect({ x: (moved[0].x + moved[1].x) / 2, y: (moved[0].y + moved[1].y) / 2 }).toEqual({ x: 50, y: 50 }) })
  it('moves each Phase 3 boss from the consumed southern third around its own half', () => { setP3BossPlan([]); const center = { x: 480, y: 270 }; const firstBoss = p3BossPosition(-1, center, 1); const secondBoss = p3BossPosition(-1, center, 2); const firstStack = p3ArchangelStackPosition(-1, center, 1); expect(firstBoss.y).toBeGreaterThan(secondBoss.y); expect(firstBoss.x).toBeLessThan(center.x); expect(secondBoss.x).toBeLessThan(center.x); expect(isInP3ConsumedSector(firstBoss, center, 102, 199)).toBe(true); expect(isInP3ConsumedSector(firstStack, center, 102, 199)).toBe(true); expect(isInP3ConsumedSector(secondBoss, center, 102, 199)).toBe(false); expect(isP3ConsumedSectorLethal(firstStack, center, 102, 199, 1, 'p3-sector-move', 4.49)).toBe(false); expect(isP3ConsumedSectorLethal(firstStack, center, 102, 199, 1, 'p3-sector-move', 4.5)).toBe(true) })
  it('rotates southeast assignments toward east and southwest assignments toward west without crossing the divider', () => { const center = { x: 480, y: 270 }; const radius = 150; const southeast = { x: center.x + Math.cos(Math.PI / 3) * radius, y: center.y + Math.sin(Math.PI / 3) * radius }; const southwest = { x: center.x + Math.cos(Math.PI * 2 / 3) * radius, y: center.y + Math.sin(Math.PI * 2 / 3) * radius }; const rightNext = p3AssignmentForRound(southeast, center, 2); const leftNext = p3AssignmentForRound(southwest, center, 2); expect(rightNext.x).toBeGreaterThan(center.x); expect(rightNext.y).toBeCloseTo(center.y); expect(leftNext.x).toBeLessThan(center.x); expect(leftNext.y).toBeCloseTo(center.y) })
  it('keeps the Phase 4 clock and relocation continuous across cycle boundaries', () => {
    const center = { x: 480, y: 270 }
    expect(P4_CYCLE_SECONDS).toBe(21)
    expect(P4_HEAVEN_START_SECONDS).toBe(21)
    expect(P4_KNOCKUP_SECONDS).toBe(1.5)
    expect(p4SplinterStartSeconds(1)).toBe(14.3)
    expect(p4SplinterStartSeconds(2)).toBe(14.3)
    expect(P4_PROTECTION_RADIUS).toBeCloseTo(22.572)
    expect(P4_SPLINTER_INTERVAL_SECONDS).toBe(1.1)
    expect(P4_SPLINTER_DETONATION_SECONDS).toBe(3.5)
    expect(p4SplinterAge(2, 15.4, 1)).toBeCloseTo(0)
    expect(p4SplinterAge(2, 20, 2)).toBeCloseTo(3.5)
    expect(P4_HEAVEN_START_SECONDS - (p4SplinterStartSeconds(1) + P4_SPLINTER_INTERVAL_SECONDS * 2 + P4_SPLINTER_DETONATION_SECONDS)).toBeCloseTo(1)
    expect(P4_MOVEMENT_MULTIPLIER).toBe(1.1)
    expect(p4StackPosition(1, center)).toEqual({ x: 480, y: 120 })
    expect(p4StackPosition(2, center).x).toBeCloseTo(330)
    expect(p4StackPosition(2, center).y).toBeCloseTo(270)
    expect(p4StackPosition(3, center).x).toBeCloseTo(480)
    expect(p4StackPosition(3, center).y).toBeCloseTo(420)
    expect(p4StackPosition(4, center).x).toBeCloseTo(630)
    expect(p4StackPosition(4, center).y).toBeCloseTo(270)
    expect(p4GroupPosition(1, P4_HEAVEN_START_SECONDS - .01, center)).toEqual(p4StackPosition(1, center))
    const beforeBoundary = p4GroupPosition(1, P4_CYCLE_SECONDS, center)
    const afterBoundary = p4GroupPosition(2, 0, center)
    expect(distance(beforeBoundary, afterBoundary)).toBeLessThan(.01)
    expect(p4RelocationProgress(1, P4_CYCLE_SECONDS)).toBe(0)
    expect(p4RelocationProgress(2, 0)).toBe(0)
    expect(afterBoundary).toEqual(p4StackPosition(1, center))
    expect(p4GroupPosition(2, 12, center)).toEqual(p4StackPosition(2, center))
    expect(p4RelocationProgress(5, 0)).toBeNull()
    expect(p4GroupPosition(5, 0, center)).toEqual(p4StackPosition(4, center))
  })
  it('phase-gates the P2 return counter and anchors the P4 knockup at the north stack', () => {
    const center = { x: 480, y: 270 }
    expect(shouldShowP2OrbReturnCounter('p2-wait', 4)).toBe(true)
    expect(shouldShowP2OrbReturnCounter('p3-sector-move', 4)).toBe(false)
    expect(shouldShowP2OrbReturnCounter('p4-transition', 4)).toBe(false)
    expect(p4TransitionStartPosition(center)).toEqual(p4StackPosition(1, center))
  })
  it('only hits another player when their center is inside the Phase 2 personal circle', () => {
    const player = { x: 100, y: 100 }
    expect(personalCircleHitsPlayer(player, [{ x: 100 + P2_PERSONAL_CIRCLE_OUTER_RADIUS - .01, y: 100 }])).toBe(true)
    expect(personalCircleHitsPlayer(player, [{ x: 100 + P2_PERSONAL_CIRCLE_OUTER_RADIUS + .01, y: 100 }])).toBe(false)
    expect(walkTowards({ x: 0, y: 0 }, { x: 100, y: 0 }, 5, 10)).toEqual({ x: 50, y: 0 })
  })
  it('keeps Phase 4 NPC relocation at the same configured speed as the player', () => {
    expect(p4NpcRelocationPace(.99)).toBe(1)
    expect(p4NpcRelocationPace(1)).toBe(1)
    expect(p4NpcRelocationPace(1.99)).toBe(1)
    expect(p4NpcRelocationPace(2)).toBe(1)
  })
  it('treats any Phase 4 Starsplinter crossing the stack as a group hit', () => {
    const stack = { x: 480, y: 120 }
    expect(p4SplinterHitsGroup({ x: 440, y: 120 }, 0, stack)).toBe(true)
    expect(p4SplinterHitsGroup({ x: 440, y: 145 }, 0, stack)).toBe(false)
    expect(distance(p4FrontSoakerPosition(stack, { x: 480, y: 270 }), stack)).toBe(6)
    expect(p4SplinterResolutionActive(P4_SPLINTER_DETONATION_SECONDS - .01)).toBe(false)
    expect(p4SplinterResolutionActive(P4_SPLINTER_DETONATION_SECONDS)).toBe(true)
    expect(p4SplinterResolutionActive(P4_SPLINTER_DETONATION_SECONDS + .3)).toBe(true)
    expect(p4SplinterResolutionActive(P4_SPLINTER_DETONATION_SECONDS + 3)).toBe(true)
    expect(P4_GROUP_HIT_RADIUS).toBe(10)
  })
  it('places NPC Splinters where their beams clear the stack', () => {
    const center = { x: 480, y: 270 }
    for (let cycle = 1; cycle <= 4; cycle += 1) {
      const stack = p4StackPosition(cycle, center)
      for (let ordinal = 0; ordinal < 3; ordinal += 1) {
        for (const rotation of [0, Math.PI / 6]) {
          const origin = p4NpcSplinterPosition(stack, center, ordinal, P4_SPLINTER_DETONATION_SECONDS, rotation)
          expect(p4SplinterHitsGroup(origin, rotation, stack)).toBe(false)
        }
      }
    }
  })
  it('keeps every Phase 4 NPC path inside the moving protection zone', () => {
    const center = { x: 480, y: 270 }
    for (let cycle = 1; cycle <= 4; cycle += 1) {
      const stack = p4StackPosition(cycle, center)
      for (let ordinal = 0; ordinal < 3; ordinal += 1) {
        for (const rotation of [0, Math.PI / 6]) {
          for (const age of [0, .5, 1.35, P4_SPLINTER_DETONATION_SECONDS, P4_SPLINTER_DETONATION_SECONDS + .5, P4_SPLINTER_DETONATION_SECONDS + P4_SPLINTER_RETURN_SECONDS]) {
            expect(distance(p4NpcSplinterPosition(stack, center, ordinal, age, rotation), stack)).toBeLessThan(P4_PROTECTION_RADIUS)
          }
          expect(p4NpcSplinterPosition(stack, center, ordinal, P4_SPLINTER_DETONATION_SECONDS + P4_SPLINTER_RETURN_SECONDS, rotation)).toEqual(stack)
        }
      }
    }
    const movingCenter = { x: 400, y: 300 }
    const corrected = keepP4NpcInProtection({ x: 500, y: 300 }, movingCenter)
    expect(distance(corrected, movingCenter)).toBeCloseTo(P4_PROTECTION_RADIUS - .5)
    expect(keepP4NpcInProtection({ x: 410, y: 300 }, movingCenter)).toEqual({ x: 410, y: 300 })
  })
  it('casts the Phase 4 tank cone on an exact three-second cadence', () => {
    expect(P4_TANK_CONE_INTERVAL_SECONDS).toBe(3)
    expect(p4TankConeActive(0)).toBe(true)
    expect(p4TankConeActive(P4_TANK_CONE_DURATION_SECONDS + .01)).toBe(false)
    expect(p4TankConeActive(2.99)).toBe(false)
    expect(p4TankConeActive(3)).toBe(true)
  })
  it('permanently qualifies every P4 add within seven yards of the front tank for destruction', () => {
    const tank = { x: 100, y: 100 }
    expect(P4_TANK_KILL_RADIUS).toBe(7)
    expect(p4TankKillsBox({ x: 107, y: 100 }, tank)).toBe(true)
    expect(p4TankKillsBox({ x: 107.01, y: 100 }, tank)).toBe(false)
  })
  it('randomizes the player Phase 4 slot and straight/rotated pattern from a shared seed', () => {
    const duties = Array.from({ length: 20 }, (_, seed) => p4PlayerSplinterDuty(7, seed % 4 + 1, seed * 101))
    const rotations = Array.from({ length: 20 }, (_, seed) => p4SplinterRotation(seed % 4 + 1, p4PlayerSplinterDuty(7, seed % 4 + 1, seed * 101), seed * 101))
    expect(new Set(duties)).toEqual(new Set([0, 1, 2]))
    expect(new Set(rotations)).toEqual(new Set([0, Math.PI / 6]))
    expect(p4PlayerSplinterDuty(7, 2, 12345)).toBe(p4PlayerSplinterDuty(7, 2, 12345))
    expect(p4SplinterRotation(2, 1, 12345)).toBe(p4SplinterRotation(2, 1, 12345))
    const quarterDuties = Array.from({ length: 4 }, (_, cycle) => p4PlayerSplinterDuty(7, cycle + 1, 12345 + cycle * 1000))
    expect(new Set(quarterDuties).size).toBeGreaterThan(1)
  })
  it('plays all four 21-second quarters, then kills the boss at 88 seconds', () => {
    expect(p4BossHealth(1, 0)).toBe(100)
    expect(p4BossHealth(3, 2)).toBe(50)
    expect(p4BossHealth(4, 21)).toBeCloseTo(100 * (1 - 84 / 88))
    expect(p4BossHealth(5, 3.99)).toBeGreaterThan(0)
    expect(p4BossHealth(5, 4)).toBe(0)
    expect(p4SplinterAge(4, 20, 2)).toBeCloseTo(P4_SPLINTER_DETONATION_SECONDS)
  })
  it('streams Phase 4 adds outward from the boss instead of preloading them near the group', () => {
    const center = { x: 480, y: 270 }
    expect(p4BoxStates(1, P4_KNOCKUP_SECONDS - .01, center).every(box => !box.active)).toBe(true)
    expect(p4BoxStates(1, P4_KNOCKUP_SECONDS, center).filter(box => box.active)).toHaveLength(1)
    const opening = p4BoxStates(2, 0, center)
    expect(opening.filter(box => box.active)).toHaveLength(1)
    expect(distance(opening[0].position, center)).toBeCloseTo(104)
    expect(opening.every(box => Math.abs(distance(box.position, center) - 104) < .001)).toBe(true)
    const openingAngle = Math.atan2(opening[0].position.y - center.y, opening[0].position.x - center.x)
    const movingCircle = p4GroupPosition(2, 0, center)
    const movingCircleAngle = Math.atan2(movingCircle.y - center.y, movingCircle.x - center.x)
    const nextStack = p4StackPosition(2, center)
    const nextStackAngle = Math.atan2(nextStack.y - center.y, nextStack.x - center.x)
    expect(Math.abs(openingAngle - movingCircleAngle)).toBeLessThan(.4)
    expect(Math.abs(openingAngle - nextStackAngle)).toBeGreaterThan(.7)
    const boxes = p4BoxStates(2, 19.9, center)
    expect(P4_BOX_COUNT).toBe(36)
    expect(P4_BOX_SPEED).toBeCloseTo(5.76 * 1.1)
    expect(boxes).toHaveLength(36)
    expect(boxes.every(box => box.active)).toBe(true)
    expect(boxes.filter(box => box.aimedAtGroup)).toHaveLength(7)
    expect(boxes.filter(box => !box.aimedAtGroup)).toHaveLength(29)
    expect(boxes.every(box => box.size >= 6.3 && box.size <= 8.4)).toBe(true)
    expect(boxes.every(box => distance(box.position, center) > 0)).toBe(true)
    expect(boxes.every((box, index) => boxes.slice(index + 1).every(other => distance(box.position, other.position) >= P4_BOX_MIN_SEPARATION))).toBe(true)
    expect(p4BoxStates(2, 19.9, center)).toEqual(boxes)
    const boundary = p4EncounterBoxStates(2, 0, center)
    expect(boundary.some(box => box.id < 200 && distance(box.position, center) > 0)).toBe(true)
    expect(boundary.some(box => box.id >= 200 && Math.abs(distance(box.position, center) - 104) < .001)).toBe(true)
  })
  it('moves southern P3 raid-plan assignments outward without crossing room halves', () => { const center = { x: 480, y: 270 }; const leftInitial = { x: 350, y: 390 }; const rightInitial = { x: 610, y: 390 }; const leftNext = p3AssignmentForRound(leftInitial, center, 2); const rightNext = p3AssignmentForRound(rightInitial, center, 2); expect(leftNext.x).toBeLessThan(center.x); expect(rightNext.x).toBeGreaterThan(center.x); expect(leftNext.y).toBeLessThan(leftInitial.y); expect(rightNext.y).toBeLessThan(rightInitial.y); expect(leftNext).not.toEqual(leftInitial) })
})
