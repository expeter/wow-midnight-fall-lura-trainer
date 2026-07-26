export type Role = 'carrier' | 'non-carrier'
export type Difficulty = 'test' | 'easy' | 'normal' | 'hard'
export type PlayerClass = 'mage' | 'warlock' | 'augmentation' | 'priest' | 'death-knight' | 'demon-hunter' | 'warrior' | 'paladin' | 'druid' | 'evoker' | 'shaman' | 'hunter' | 'monk'

export interface Point { x: number; y: number }
export interface PlayerProfile { name: string; playerClass: PlayerClass; crystal: boolean }
export interface Star { id: number; position: Point; angle: number; active: boolean }

export const ARENA = { width: 760, height: 540, center: { x: 380, y: 270 }, radius: 235 }
export const INTERMISSION_SEQUENCE = [
  { kind: 'beam' as const, seconds: 3 },
  { kind: 'splinter' as const, seconds: 3 },
]
export const WIPE_PENALTY = 500
export const PLAYER_COLLISION_PENALTY = 50
export const OPENING_BOOST_SECONDS = 5
export const P1_FINAL_RECOVERY_SECONDS = 2
export const P2_PERSONAL_CIRCLE_INNER_RADIUS = 11.55
export const P2_PERSONAL_CIRCLE_OUTER_RADIUS = 12.16
export const P2_POSITIONING_SECONDS = 5
export const P2_BEAM_SECONDS = 7
export const P2_PULL_SECONDS = 5
export const P2_SPREAD_SECONDS = 5
export const P2_BEAM_CADENCE_SECONDS = 30
export const P2_ORB_RETURN_SECONDS = 13
export const P2_ORB_GLOW_LEAD_SECONDS = 1
export const P2_ORB_RETURN_GLOW_SECONDS = 1
export const P2_ORB_RETURN_TRAVEL_SECONDS = 1
export const P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS = P2_BEAM_CADENCE_SECONDS - P2_BEAM_SECONDS
export const P2_NPC_PREPOSITION_SECONDS = 3
export const P2_ORBIT_SPEED = .12
export const P1_STAR_LENGTH = 38.8
export const P3_OUTER_RADIUS = 199
export const P3_LIGHT_RADIUS = 26
export const P3_APPROACH_NPC_SPEED_MULTIPLIER = 1.5
export const P3_APPROACH_SECONDS = 10
export const P3_SAFE_ZONE_GRACE_SECONDS = 5
export const P3_SAFE_ZONE_PENALTY_PER_SECOND = 10
export const P3_POOL_RADIUS = 12.65
export const P3_POOL_HEALTH = 29.75
export const P3_POOL_CRYSTAL_CLEARANCE = .5
export const P3_LANDING_SOAK_RADIUS = 12
export const P3_FLIGHT_SECONDS = 2
export const P3_SECTOR_SECONDS = 40
export const P3_FINAL_SECTOR_MOVE_SECONDS = 9
export const P3_STARS_START_SECONDS = 5
export const P3_STARS_TELEGRAPH_SECONDS = 4.5
export const P3_STARS_INTERVAL_SECONDS = P3_STARS_TELEGRAPH_SECONDS + 3
export const P3_RUNE_ORB_MIN_GAP = 18
export const P3_RUNE_HALF_CLEARANCE = 10
export const P3_MEMORY_PANEL_SECONDS = 20
export const P3_MEMORY_START_SECONDS = 25
export const P3_MEMORY_STEP_SECONDS = 5
export const P3_SECOND_SOAK_NPC_DELAY_SECONDS = 4
export const P4_STACK_RADIUS = 150
export const P4_PROTECTION_RADIUS = 22.572
export const P4_GROUP_HIT_RADIUS = 10
export const P4_INITIAL_SPLINTER_START_SECONDS = 14.3
export const P4_SPLINTER_START_SECONDS = 14.3
export const P4_SPLINTER_INTERVAL_SECONDS = 1.1
export const P4_SPLINTER_DETONATION_SECONDS = 3.5
export const P4_SPLINTER_RETURN_SECONDS = P4_SPLINTER_INTERVAL_SECONDS
export const P4_HEAVEN_START_SECONDS = 21
export const P4_HEAVEN_MOVE_SECONDS = 12
export const P4_KNOCKUP_SECONDS = 1.5
export const P4_MOVEMENT_MULTIPLIER = 1.1
export const P4_CYCLE_SECONDS = 21
export const P4_FINAL_KILL_START_SECONDS = 9
export const P4_FINAL_KILL_SECONDS = 1
export const P4_FINAL_SEQUENCE_END_SECONDS = 12
export const P4_FRONT_SOAKER_OFFSET = 6
export const P4_FRONT_CONE_RANGE = 30
export const P4_TANK_KILL_RADIUS = 7
export const P4_BOX_COUNT = 36
export const P4_BOX_MIN_SEPARATION = 15
export const P4_BOX_SPEED = 6.336
export const P4_TANK_CONE_INTERVAL_SECONDS = 3
export const P4_TANK_CONE_DURATION_SECONDS = .65
export const P4_BOSS_DURATION_SECONDS = 88
export type RuneSymbol = 'T' | 'X' | 'O'
let p3BossPlan: [Point, Point] | null = null
let p3PoolLayoutSeed = 0
export function setP3BossPlan(points: Point[]): void {
  p3BossPlan = points.length === 2 ? [{ ...points[0] }, { ...points[1] }] : null
}
export function randomizeP3PoolLayout(seed = Math.floor(Math.random() * 2147483646) + 1): void {
  p3PoolLayoutSeed = Math.abs(Math.floor(seed)) % 2147483647
}

export function p3PoolLayoutId(): number {
  return p3PoolLayoutSeed
}
export function assignmentRevealDistance(difficulty: Difficulty): number {
  return difficulty === 'test' || difficulty === 'easy' ? Infinity : difficulty === 'normal' ? 45 : 22
}

export function p3SideForPosition(position: Point, center: Point): -1 | 1 {
  return position.x < center.x ? -1 : 1
}

export function isOnAssignedP3Side(position: Point, assignment: Point, center: Point): boolean {
  return p3SideForPosition(position, center) === p3SideForPosition(assignment, center)
}

export function keepP3PointOnSide(position: Point, side: -1 | 1, center: Point, clearance = 0): Point {
  return {
    x: side < 0 ? Math.min(position.x, center.x - clearance) : Math.max(position.x, center.x + clearance),
    y: position.y,
  }
}

export function isP3RaidMemberVisible(playerPosition: Point, memberPosition: Point, center: Point, phaseThree: boolean): boolean {
  return !phaseThree || p3SideForPosition(playerPosition, center) === p3SideForPosition(memberPosition, center)
}

export function p3LandingGroupIndex(index: number): number {
  return (index < 10 ? 0 : 3) + Math.min(2, Math.floor(index % 10 / 3))
}

export function p3LandingPlanIndex(index: number, positions: Point[], center: Point): number {
  const side = p3SideForPosition(positions[index], center)
  const sideMembers = positions
    .map((position, profileIndex) => ({ position, profileIndex }))
    .filter(candidate => p3SideForPosition(candidate.position, center) === side)
    .map(candidate => candidate.profileIndex)
  const sideOrdinal = Math.max(0, sideMembers.indexOf(index))
  return (side < 0 ? 0 : 10) + Math.min(9, sideOrdinal)
}

export function p3LandingGroupCenter(index: number, center: Point, radius = 176): Point {
  const side = index < 10 ? -1 : 1
  const sideIndex = index % 10
  const group = Math.min(2, Math.floor(sideIndex / 3))
  const angles = side < 0
    ? [-Math.PI * 2 / 3, Math.PI, Math.PI * 2 / 3]
    : [-Math.PI / 3, 0, Math.PI / 3]
  const angle = angles[group]
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
}

export function p3LandingPosition(index: number, center: Point, radius = 176): Point {
  const groupCenter = p3LandingGroupCenter(index, center, radius)
  const member = index % 10 - Math.min(2, Math.floor(index % 10 / 3)) * 3
  const offsets = [{ x: -3.5, y: -1.5 }, { x: 3.5, y: -1.5 }, { x: 0, y: 3.5 }, { x: 0, y: -5 }]
  const offset = offsets[member]
  return { x: groupCenter.x + offset.x, y: groupCenter.y + offset.y }
}

export function p3FlightPosition(origin: Point, target: Point, eventTime: number): Point {
  const progress = Math.min(1, Math.max(0, eventTime / P3_FLIGHT_SECONDS))
  const eased = 1 - Math.pow(1 - progress, 3)
  return {
    x: origin.x + (target.x - origin.x) * eased,
    y: origin.y + (target.y - origin.y) * eased,
  }
}

function seededUnit(seed: number, salt: number): number {
  let value = (Math.floor(seed) ^ Math.imul(salt + 17, 0x9e3779b1)) >>> 0
  value = Math.imul(value ^ value >>> 16, 0x7feb352d)
  value = Math.imul(value ^ value >>> 15, 0x846ca68b)
  return ((value ^ value >>> 16) >>> 0) / 0x100000000
}

export function p3LandingSoakPositions(index: number, center: Point, seed = 0): Point[] {
  const landing = p3LandingGroupCenter(index, center)
  const group = p3LandingGroupIndex(index)
  const candidate = (ordinal: number, attempt: number): Point => {
    const salt = group * 40 + ordinal * 20 + attempt * 2
    const angle = seededUnit(seed, salt) * Math.PI * 2
    const radius = 21 + Math.sqrt(seededUnit(seed, salt + 1)) * 7
    return { x: landing.x + Math.cos(angle) * radius, y: landing.y + Math.sin(angle) * radius }
  }
  const first = candidate(0, 0)
  let second = candidate(1, 0)
  for (let attempt = 1; attempt < 20 && distance(first, second) < P3_LANDING_SOAK_RADIUS * 2; attempt += 1) second = candidate(1, attempt)
  if (distance(first, second) < P3_LANDING_SOAK_RADIUS * 2) {
    second = { x: landing.x * 2 - first.x, y: landing.y * 2 - first.y }
  }
  const points = [first, second]
  return points.sort((a, b) => distance(b, landing) - distance(a, landing))
}
export function p3LightHealthRate(protectedByLight: boolean): number {
  return protectedByLight ? 12 : -2
}
export function p3UnsafePenaltyTicks(previousUnsafeSeconds: number, nextUnsafeSeconds: number, graceSeconds = P3_SAFE_ZONE_GRACE_SECONDS): number {
  const previousTicks = Math.max(0, Math.floor(previousUnsafeSeconds - graceSeconds))
  const nextTicks = Math.max(0, Math.floor(nextUnsafeSeconds - graceSeconds))
  return Math.max(0, nextTicks - previousTicks)
}
export function hasActiveP3CrystalLight(assignedCrystal: boolean, crystalSpent: boolean): boolean {
  return assignedCrystal && !crystalSpent
}
export function isProtectedByP3Light(player: Point, ownLightActive: boolean, npcLights: Point[], padding = 3): boolean {
  return ownLightActive || npcLights.some(light => distance(player, light) <= P3_LIGHT_RADIUS + padding)
}
export function separateP3NpcTarget(target: Point, crystal: boolean, occupied: Array<{ point: Point; crystal: boolean }>, salt = 0): Point {
  let result = { ...target }
  for (let pass = 0; pass < 3; pass += 1) {
    occupied.forEach((other, index) => {
      const clearance = crystal && other.crystal ? P3_LIGHT_RADIUS * 2 : 7
      const dx = result.x - other.point.x
      const dy = result.y - other.point.y
      const gap = Math.hypot(dx, dy)
      if (gap >= clearance) return
      const fallbackAngle = (salt * 2.399963 + index * 1.618034) % (Math.PI * 2)
      const unit = gap > .001 ? { x: dx / gap, y: dy / gap } : { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) }
      result = { x: other.point.x + unit.x * clearance, y: other.point.y + unit.y * clearance }
    })
  }
  return result
}
export function isProtectedByP3Bubble(player: Point, bubble: Point, playerRadius = 4): boolean {
  return distance(player, bubble) <= P3_LIGHT_RADIUS + playerRadius
}
export function isP3ProtectionCrystalPlaced(crystal: Point, stack: Point): boolean {
  return distance(crystal, stack) <= P3_LIGHT_RADIUS
}
export function p3ProtectionBubbleCenter(stack: Point, crystal: Point | null, playerDuty: 1 | 2 | null, round: number): Point {
  return playerDuty === round && crystal ? crystal : stack
}
export function p3PoolSoakRate(occupants: number): number {
  return occupants >= 3 ? occupants : 0
}

export function keepP3NpcInSoak(target: Point, pool: Point, padding = 1): Point {
  const dx = target.x - pool.x
  const dy = target.y - pool.y
  const currentDistance = Math.hypot(dx, dy)
  const maximumDistance = Math.max(0, P3_POOL_RADIUS - padding)
  if (currentDistance <= maximumDistance) return target
  const scale = maximumDistance / (currentDistance || 1)
  return { x: pool.x + dx * scale, y: pool.y + dy * scale }
}

export function keepP3CrystalPoolCovered(target: Point, pool: Point): Point {
  const dx = target.x - pool.x
  const dy = target.y - pool.y
  const currentDistance = Math.hypot(dx, dy)
  const minimumDistance = P3_POOL_RADIUS + P3_POOL_CRYSTAL_CLEARANCE
  const maximumDistance = P3_LIGHT_RADIUS - P3_POOL_RADIUS
  const direction = currentDistance > .001 ? { x: dx / currentDistance, y: dy / currentDistance } : { x: 0, y: -1 }
  const coveredDistance = Math.max(minimumDistance, Math.min(maximumDistance, currentDistance))
  return { x: pool.x + direction.x * coveredDistance, y: pool.y + direction.y * coveredDistance }
}

export function p3CrystalPoolCoverageTargets(pools: Point[], crystalAnchors: Point[], existingLights: Point[] = []): Point[] {
  const uncovered = pools.filter(pool => !existingLights.some(light => distance(light, pool) + P3_POOL_RADIUS <= P3_LIGHT_RADIUS))
  const occupiedLights = [...existingLights]
  return crystalAnchors.map(anchor => {
    const candidates = uncovered.length ? uncovered : pools
    if (!candidates.length) return anchor
    const pool = candidates.reduce((nearest, candidate) => distance(anchor, candidate) < distance(anchor, nearest) ? candidate : nearest)
    const assignedPoolIndex = uncovered.indexOf(pool)
    if (assignedPoolIndex >= 0) uncovered.splice(assignedPoolIndex, 1)
    const supportRadius = (P3_POOL_RADIUS + P3_POOL_CRYSTAL_CLEARANCE + P3_LIGHT_RADIUS - P3_POOL_RADIUS) / 2
    const positions = Array.from({ length: 24 }, (_, index) => {
      const angle = index * Math.PI * 2 / 24
      const point = { x: pool.x + Math.cos(angle) * supportRadius, y: pool.y + Math.sin(angle) * supportRadius }
      const outsideOtherPools = pools.every(other => other === pool || distance(point, other) >= P3_POOL_RADIUS + P3_POOL_CRYSTAL_CLEARANCE)
      const nearestLight = occupiedLights.length ? Math.min(...occupiedLights.map(light => distance(point, light))) : P3_LIGHT_RADIUS * 2
      return { point, score: (outsideOtherPools ? 1000 : 0) + Math.min(P3_LIGHT_RADIUS * 2, nearestLight) * 10 - distance(point, anchor) }
    })
    const target = positions.reduce((best, candidate) => candidate.score > best.score ? candidate : best).point
    occupiedLights.push(target)
    for (let index = uncovered.length - 1; index >= 0; index -= 1) {
      if (distance(target, uncovered[index]) + P3_POOL_RADIUS <= P3_LIGHT_RADIUS) uncovered.splice(index, 1)
    }
    return target
  })
}

export function p3LightCenters(side: -1 | 1, center: Point, round: number): Point[] {
  const boss = p3BossPosition(side, center, round)
  const dx = boss.x - center.x
  const dy = boss.y - center.y
  const length = Math.hypot(dx, dy) || 1
  const radial = { x: dx / length, y: dy / length }
  const tangent = { x: -radial.y, y: radial.x }
  return [-50, 0, 50].map(offset => {
    const point = {
      x: boss.x + radial.x * 4 + tangent.x * offset,
      y: boss.y + radial.y * 4 + tangent.y * offset,
    }
    return round > 1 ? keepClearOfP3ConsumedSector(point, side, center, P3_LIGHT_RADIUS + 2) : point
  })
}

export function p3BossPosition(side: -1 | 1, center: Point, round: number): Point {
  if (p3BossPlan) {
    const initial = p3BossPlan[side < 0 ? 0 : 1]
    return round <= 1 ? initial : rotatePoint(initial, center, -side * Math.PI / 3)
  }
  const angle = round <= 1
    ? side < 0 ? Math.PI * 2 / 3 : Math.PI / 3
    : side < 0 ? Math.PI : 0
  const radius = 148
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
}

export function p3ActiveCrystalAssignments(
  assignments: number[],
  playerAssignment: number,
  playerDuty: 1 | 2 | null,
  playerSpent: boolean,
  round: number,
  event: string,
  attemptSeed = 0,
  positions?: Point[],
  center: Point = ARENA.center,
): number[] {
  const resolvedArchangels = event === 'p3-sector-move' ? round : Math.max(0, round - 1)
  const active = new Set(assignments)
  for (const side of [-1, 1] as const) {
    for (let resolvedRound = 1; resolvedRound <= resolvedArchangels; resolvedRound += 1) {
      const sideAssignments = assignments.filter(index => {
        const assignmentSide = positions?.[index] ? p3SideForPosition(positions[index], center) : index < 10 ? -1 : 1
        return assignmentSide === side && active.has(index)
      })
      const playerSpentThisRound = sideAssignments.includes(playerAssignment)
        && playerDuty === resolvedRound
        && playerSpent
      const npcCandidates = sideAssignments.filter(index => index !== playerAssignment)
      const randomIndex = npcCandidates.length
        ? ((attemptSeed + (side < 0 ? 2654435761 : 2246822519) + resolvedRound * 3266489917) >>> 0) % npcCandidates.length
        : -1
      const spentAssignment = playerSpentThisRound ? playerAssignment : npcCandidates[randomIndex]
      if (spentAssignment !== undefined) active.delete(spentAssignment)
    }
  }
  return assignments.filter(index => active.has(index))
}

export function p3SpreadPosition(index: number, crystal: boolean, center: Point, round: number, crystalSlot = -1, assignedSide?: -1 | 1): Point {
  const side: -1 | 1 = assignedSide ?? (index < 10 ? -1 : 1)
  const sideIndex = index % 10
  const cluster = crystal && crystalSlot >= 0 ? crystalSlot % 3 : sideIndex % 3
  const member = Math.floor(sideIndex / 3)
  const safeCenter = p3LightCenters(side, center, round)[cluster]
  const boss = p3BossPosition(side, center, round)
  const towardBossX = boss.x - safeCenter.x
  const towardBossY = boss.y - safeCenter.y
  const towardBossLength = Math.hypot(towardBossX, towardBossY) || 1
  const towardBoss = { x: towardBossX / towardBossLength, y: towardBossY / towardBossLength }
  const across = { x: -towardBoss.y, y: towardBoss.x }
  const inward = (member < 2 ? 7 : 15) - (crystal ? 1 : 0)
  const lateral = (member % 2 ? 1 : -1) * 7
  return {
    x: safeCenter.x + towardBoss.x * inward + across.x * lateral,
    y: safeCenter.y + towardBoss.y * inward + across.y * lateral,
  }
}

export function p3AssignmentForRound(initial: Point, center: Point, round: number): Point {
  if (round <= 1) return initial
  const side: -1 | 1 = initial.x < center.x ? -1 : 1
  const rotated = rotatePoint(initial, center, -side * Math.PI / 3)
  const dx = rotated.x - center.x
  const dy = rotated.y - center.y
  const radius = Math.hypot(dx, dy) || 1
  const safeRadius = Math.max(110, Math.min(P3_OUTER_RADIUS - 7, radius))
  return keepClearOfP3ConsumedSector(
    { x: center.x + dx / radius * safeRadius, y: center.y + dy / radius * safeRadius },
    side,
    center,
    5,
  )
}

function keepClearOfP3ConsumedSector(point: Point, side: -1 | 1, center: Point, clearance: number): Point {
  const radius = distance(point, center)
  if (radius <= clearance) return point
  const angle = Math.atan2(point.y - center.y, point.x - center.x)
  const comparableAngle = side < 0 && angle < 0 ? angle + Math.PI * 2 : angle
  const angularClearance = Math.asin(Math.min(.95, clearance / radius))
  const boundary = side < 0 ? Math.PI * 5 / 6 + angularClearance : Math.PI / 6 - angularClearance
  const safeAngle = side < 0 ? Math.max(comparableAngle, boundary) : Math.min(comparableAngle, boundary)
  return { x: center.x + Math.cos(safeAngle) * radius, y: center.y + Math.sin(safeAngle) * radius }
}

export function p3ArchangelStackPosition(side: -1 | 1, center: Point, round: number): Point {
  const boss = p3BossPosition(side, center, round)
  const bossAngle = Math.atan2(boss.y - center.y, boss.x - center.x)
  const radius = P3_OUTER_RADIUS - 14
  return { x: center.x + Math.cos(bossAngle) * radius, y: center.y + Math.sin(bossAngle) * radius }
}

export function isInP3ConsumedSector(point: Point, center: Point, innerRadius: number, outerRadius: number): boolean {
  const radius = distance(point, center)
  if (radius < innerRadius || radius > outerRadius) return false
  const angle = Math.atan2(point.y - center.y, point.x - center.x)
  const fromSouth = Math.abs(Math.atan2(Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2)))
  return fromSouth <= Math.PI / 3
}

export function isP3ConsumedSectorLethal(point: Point, center: Point, innerRadius: number, outerRadius: number, round: number, event: string, eventTime: number): boolean {
  return isInP3ConsumedSector(point, center, innerRadius, outerRadius)
    && (round > 1 || event === 'p3-sector-move' && eventTime >= 4.5)
}

export function p3NpcPoolAssignment(sideOrdinal: number, playerSide: boolean, requiredPlayerPool: number, health: number[], assignedCounts = [0, 0, 0]): number | null {
  const supportPools = [(requiredPlayerPool + 1) % 3, (requiredPlayerPool + 2) % 3]
  const initialPool = !playerSide
    ? sideOrdinal % 3
    : sideOrdinal < 6
      ? Math.floor(sideOrdinal / 2)
      : sideOrdinal === 6
        ? supportPools[0]
        : sideOrdinal === 7
          ? supportPools[1]
          : sideOrdinal === 8
            ? supportPools[health[supportPools[0]] >= health[supportPools[1]] ? 0 : 1]
            : -1
  if (initialPool >= 0 && health[initialPool] > .5 && assignedCounts[initialPool] < 5) return initialPool
  const aPoolFinished = health.some(value => value <= .5)
  if (!aPoolFinished) return null
  const unfinished = health.map((value, index) => ({ value, index })).filter(pool => pool.value > .5 && assignedCounts[pool.index] < 5)
  return unfinished.length ? unfinished[Math.max(0, sideOrdinal) % unfinished.length].index : null
}

export function p3NpcSoaksActive(playerEngaged: boolean, round: number, eventTime: number): boolean {
  return playerEngaged || round > 1 && eventTime >= P3_SECOND_SOAK_NPC_DELAY_SECONDS
}

export function p4StackPosition(cycle: number, center: Point, radius = P4_STACK_RADIUS): Point {
  const angle = -Math.PI / 2 - (cycle - 1) * Math.PI / 2
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
}
export function p4TransitionStartPosition(center: Point): Point {
  return p4StackPosition(1, center)
}

export function p4SplinterStartSeconds(cycle: number): number {
  return cycle === 1 ? P4_INITIAL_SPLINTER_START_SECONDS : P4_SPLINTER_START_SECONDS
}

export function p4SplinterAge(cycle: number, eventTime: number, ordinal: number): number {
  return eventTime - p4SplinterStartSeconds(cycle) - ordinal * P4_SPLINTER_INTERVAL_SECONDS
}

function p4PatternValue(seed: number, cycle: number, salt: number): number {
  let value = (Math.floor(seed) ^ Math.imul(cycle + 17, 0x9e3779b1) ^ Math.imul(salt + 31, 0x85ebca6b)) >>> 0
  value = Math.imul(value ^ value >>> 16, 0x7feb352d)
  value = Math.imul(value ^ value >>> 15, 0x846ca68b)
  return (value ^ value >>> 16) >>> 0
}

export function p4PlayerSplinterDuty(assignment: number, cycle = 1, seed = 0): 0 | 1 | 2 {
  return p4PatternValue(seed, cycle, assignment) % 3 as 0 | 1 | 2
}

export function randomCrystalDropDuty(random = Math.random()): 1 | 2 {
  return random < .5 ? 1 : 2
}

export function p4RelocationProgress(cycle: number, eventTime: number): number | null {
  if (cycle >= 5) return null
  const carrySeconds = P4_CYCLE_SECONDS - P4_HEAVEN_START_SECONDS
  const splinterStart = p4SplinterStartSeconds(cycle)
  if (cycle > 1 && eventTime < splinterStart) return Math.max(0, Math.min(1, (carrySeconds + eventTime) / P4_HEAVEN_MOVE_SECONDS))
  if (eventTime >= P4_HEAVEN_START_SECONDS) return Math.max(0, Math.min(1, (eventTime - P4_HEAVEN_START_SECONDS) / P4_HEAVEN_MOVE_SECONDS))
  return null
}

export function p4NpcRelocationPace(relocationSeconds: number): number {
  void relocationSeconds
  return 1
}

export function p4GroupPosition(cycle: number, eventTime: number, center: Point, radius = P4_STACK_RADIUS): Point {
  if (cycle >= 5) return p4StackPosition(4, center, radius)
  let baseCycle = cycle
  const relocation = p4RelocationProgress(cycle, eventTime)
  if (cycle > 1 && eventTime < p4SplinterStartSeconds(cycle)) baseCycle = cycle - 1
  const progress = relocation ?? 0
  const angle = -Math.PI / 2 - (baseCycle - 1 + progress) * Math.PI / 2
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
}

export function p4SplinterRotation(cycle: number, ordinal: number, seed = 0): number {
  return p4PatternValue(seed, cycle, ordinal + 101) % 2 ? Math.PI / 6 : 0
}

export function p4FrontSoakerPosition(stack: Point, center: Point, offset = P4_FRONT_SOAKER_OFFSET): Point {
  const dx = center.x - stack.x
  const dy = center.y - stack.y
  const length = Math.hypot(dx, dy) || 1
  return { x: stack.x + dx / length * offset, y: stack.y + dy / length * offset }
}

export function p4TankConeActive(eventTime: number): boolean {
  return eventTime >= 0 && eventTime % P4_TANK_CONE_INTERVAL_SECONDS < P4_TANK_CONE_DURATION_SECONDS
}

export function p4TankKillsBox(boxPosition: Point, tankPosition: Point): boolean {
  return distance(boxPosition, tankPosition) <= P4_TANK_KILL_RADIUS
}

export interface P4BoxState { id: number; position: Point; size: number; aimedAtGroup: boolean; active: boolean }
export function p4BoxStates(cycle: number, eventTime: number, center: Point): P4BoxState[] {
  const spawnClock = cycle === 1 ? Math.max(0, eventTime - P4_KNOCKUP_SECONDS) : eventTime
  const yellowCircle = p4GroupPosition(cycle, eventTime, center)
  const packAngle = Math.atan2(yellowCircle.y - center.y, yellowCircle.x - center.x)
  const spawned: Array<{ angle: number; spawnDelay: number }> = []
  return Array.from({ length: P4_BOX_COUNT }, (_, index) => {
    const randomA = Math.abs(Math.sin((index + 1) * 12.9898 + cycle * 78.233)) % 1
    const randomB = Math.abs(Math.sin((index + 7) * 39.346 + cycle * 11.135)) % 1
    const aimedAtGroup = index < 7
    const groupFocused = index >= 7 && index < 21
    const spawnDelay = index * .56
    const angleForAttempt = (attempt: number) => {
      const randomAngle = (randomA + attempt * .61803398875) % 1
      if (aimedAtGroup) return packAngle + (randomAngle - .5)
      if (groupFocused) return packAngle + (randomAngle - .5) * 2.2
      return randomAngle * Math.PI * 2
    }
    let angle = angleForAttempt(0)
    for (let attempt = 0; attempt < 64; attempt += 1) {
      const candidate = angleForAttempt(attempt)
      const candidatePosition = { x: center.x + Math.cos(candidate) * 104, y: center.y + Math.sin(candidate) * 104 }
      const clear = spawned.every(previous => {
        const previousTravel = 104 + Math.max(0, spawnDelay - previous.spawnDelay) * P4_BOX_SPEED
        const previousPosition = { x: center.x + Math.cos(previous.angle) * previousTravel, y: center.y + Math.sin(previous.angle) * previousTravel }
        return distance(candidatePosition, previousPosition) >= P4_BOX_MIN_SEPARATION
      })
      angle = candidate
      if (clear) break
    }
    spawned.push({ angle, spawnDelay })
    const landed = cycle !== 1 || eventTime >= P4_KNOCKUP_SECONDS
    const active = landed && spawnClock >= spawnDelay
    const travel = 104 + Math.max(0, spawnClock - spawnDelay) * P4_BOX_SPEED
    return {
      id: cycle * 100 + index,
      position: { x: center.x + Math.cos(angle) * travel, y: center.y + Math.sin(angle) * travel },
      size: 6.3 + randomB * 2.1,
      aimedAtGroup,
      active,
    }
  })
}

export function p4EncounterBoxStates(cycle: number, eventTime: number, center: Point): P4BoxState[] {
  const currentWave = p4BoxStates(cycle, eventTime, center)
  if (cycle <= 1) return currentWave
  const outgoingWave = p4BoxStates(cycle - 1, eventTime + P4_CYCLE_SECONDS, center)
    .filter(box => box.active && distance(box.position, center) <= P3_OUTER_RADIUS + box.size)
  return [...outgoingWave, ...currentWave]
}

export function p4SplinterResolutionActive(age: number): boolean {
  return age >= P4_SPLINTER_DETONATION_SECONDS
}

export function p4SplinterHitsGroup(origin: Point, rotation: number, groupCenter: Point, groupRadius = P4_GROUP_HIT_RADIUS, length = 42): boolean {
  if (distance(origin, groupCenter) <= groupRadius) return true
  return Array.from({ length: 6 }, (_, index) => {
    const angle = rotation + index * Math.PI / 3
    const end = { x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length }
    return distanceToSegment(groupCenter, origin, end) <= groupRadius
  }).some(Boolean)
}

export function p4NpcSplinterPosition(stack: Point, center: Point, ordinal: number, age: number, rotation: number): Point {
  const stackAngle = Math.atan2(stack.y - center.y, stack.x - center.x)
  const radial = { x: Math.cos(stackAngle), y: Math.sin(stackAngle) }
  const tangent = { x: -radial.y, y: radial.x }
  const side = ordinal === 1 ? -1 : 1
  const safeRadius = P4_PROTECTION_RADIUS - .75
  const final = Array.from({ length: 6 }, (_, index) => {
    const angle = rotation + Math.PI / 6 + index * Math.PI / 3
    const direction = { x: Math.cos(angle), y: Math.sin(angle) }
    const sideAlignment = (direction.x * tangent.x + direction.y * tangent.y) * side
    const outwardAlignment = direction.x * radial.x + direction.y * radial.y
    return {
      point: { x: stack.x + direction.x * safeRadius, y: stack.y + direction.y * safeRadius },
      score: sideAlignment * 10 + outwardAlignment,
    }
  }).sort((a, b) => b.score - a.score)[0].point
  const outwardProgress = Math.min(1, Math.max(0, age) / 1.35)
  const returnProgress = Math.min(1, Math.max(0, age - P4_SPLINTER_DETONATION_SECONDS) / P4_SPLINTER_RETURN_SECONDS)
  const progress = outwardProgress * (1 - returnProgress)
  return { x: stack.x + (final.x - stack.x) * progress, y: stack.y + (final.y - stack.y) * progress }
}

export function keepP4NpcInProtection(position: Point, groupCenter: Point, margin = .5): Point {
  const dx = position.x - groupCenter.x
  const dy = position.y - groupCenter.y
  const currentRadius = Math.hypot(dx, dy)
  const allowedRadius = Math.max(0, P4_PROTECTION_RADIUS - margin)
  if (currentRadius <= allowedRadius) return position
  return {
    x: groupCenter.x + dx / currentRadius * allowedRadius,
    y: groupCenter.y + dy / currentRadius * allowedRadius,
  }
}

export function p4BossHealth(cycle: number, eventTime: number): number {
  const elapsed = (cycle - 1) * P4_CYCLE_SECONDS + eventTime
  return Math.max(0, 100 * (1 - elapsed / P4_BOSS_DURATION_SECONDS))
}

export function p3PoolCenters(side: -1 | 1, center: Point, round: number): Point[] {
  const boss = p3BossPosition(side, center, round)
  const dx = boss.x - center.x
  const dy = boss.y - center.y
  const length = Math.hypot(dx, dy) || 1
  const radial = { x: dx / length, y: dy / length }
  const tangent = { x: -radial.y, y: radial.x }
  let seed = 419 + p3PoolLayoutSeed + round * 173 + (side > 0 ? 71 : 0) + Math.round(boss.x * 3 + boss.y * 5)
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
  const pools: Point[] = []
  for (let attempt = 0; attempt < 200 && pools.length < 3; attempt += 1) {
    const tangentOffset = (random() * 2 - 1) * 48
    const radialOffset = -32 + random() * 36
    const candidate = {
      x: boss.x + radial.x * radialOffset + tangent.x * tangentOffset,
      y: boss.y + radial.y * radialOffset + tangent.y * tangentOffset,
    }
    const arenaRadius = distance(candidate, center)
    const staysInHalf = side < 0 ? candidate.x <= center.x - P3_POOL_RADIUS : candidate.x >= center.x + P3_POOL_RADIUS
    const hasRoom = arenaRadius >= 102 + P3_POOL_RADIUS + 3 && arenaRadius <= P3_OUTER_RADIUS - P3_POOL_RADIUS - 3
    const avoidsConsumedSector = round <= 1 || Array.from({ length: 9 }, (_, index) => {
      if (index === 0) return candidate
      const angle = (index - 1) * Math.PI / 4
      return { x: candidate.x + Math.cos(angle) * (P3_POOL_RADIUS + 2), y: candidate.y + Math.sin(angle) * (P3_POOL_RADIUS + 2) }
    }).every(point => !isInP3ConsumedSector(point, center, 102, P3_OUTER_RADIUS))
    const separated = pools.every(pool => distance(pool, candidate) >= P3_POOL_RADIUS * 2 + 15)
    if (staysInHalf && hasRoom && avoidsConsumedSector && separated) pools.push(candidate)
  }
  if (pools.length === 3) return pools
  return [-38, 0, 38].map((offset, index) => ({
    x: boss.x + radial.x * (index === 1 ? 16 : -14) + tangent.x * offset,
    y: boss.y + radial.y * (index === 1 ? 16 : -14) + tangent.y * offset,
  }))
}

export function translateSelectedPoints(points: Point[], selected: number[], anchor: Point): Point[] {
  if (!selected.length) return points.map(point => ({ ...point }))
  const selectedPoints = selected.map(index => points[index]).filter((point): point is Point => Boolean(point))
  if (!selectedPoints.length) return points.map(point => ({ ...point }))
  const center = selectedPoints.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 })
  center.x /= selectedPoints.length
  center.y /= selectedPoints.length
  const selectedSet = new Set(selected)
  return points.map((point, index) => selectedSet.has(index)
    ? { x: point.x + anchor.x - center.x, y: point.y + anchor.y - center.y }
    : { ...point })
}

export function p3RunePartnerPosition(assignment: number, center: Point, round: number, assignedSide?: -1 | 1): Point {
  const side: -1 | 1 = assignedSide ?? (assignment < 10 ? -1 : 1)
  return p3LightCenters(side, center, round)[assignment % 3]
}

export function p3RuneOrbs(side: -1 | 1, center: Point, round: number, cycle = 0): Point[] {
  const boss = p3BossPosition(side, center, round)
  const pools = p3PoolCenters(side, center, round)
  const radialX = boss.x - center.x
  const radialY = boss.y - center.y
  const radialLength = Math.hypot(radialX, radialY) || 1
  const radial = { x: radialX / radialLength, y: radialY / radialLength }
  const tangent = { x: -radial.y, y: radial.x }
  const coverage = [boss, ...p3LightCenters(side, center, round), ...pools]
  const local = coverage.map(point => ({
    tangent: (point.x - boss.x) * tangent.x + (point.y - boss.y) * tangent.y,
    radial: (point.x - boss.x) * radial.x + (point.y - boss.y) * radial.y,
  }))
  const tangentMin = Math.min(...local.map(point => point.tangent)) - 30
  const tangentMax = Math.max(...local.map(point => point.tangent)) + 30
  const radialMin = Math.min(...local.map(point => point.radial)) - 30
  const radialMax = Math.max(...local.map(point => point.radial)) + 30
  let seed = 113 + round * 97 + cycle * 131 + (side > 0 ? 41 : 0)
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
  const pointForRatio = ({ x, y }: Point): Point => {
    const tangentOffset = tangentMin + (tangentMax - tangentMin) * x
    const radialOffset = radialMin + (radialMax - radialMin) * y
    return {
      x: boss.x + tangent.x * tangentOffset + radial.x * radialOffset,
      y: boss.y + tangent.y * tangentOffset + radial.y * radialOffset,
    }
  }
  const isPlayableRatio = (ratio: Point) => {
    const point = pointForRatio(ratio)
    const arenaRadius = distance(point, center)
    const staysInHalf = side < 0 ? point.x <= center.x - P3_RUNE_HALF_CLEARANCE : point.x >= center.x + P3_RUNE_HALF_CLEARANCE
    return staysInHalf
      && arenaRadius >= 108
      && arenaRadius <= P3_OUTER_RADIUS - 5
      && pools.every(pool => distance(point, pool) >= P3_POOL_RADIUS + 8)
      && (round < 2 || !isInP3ConsumedSector(point, center, 102, P3_OUTER_RADIUS))
  }
  const ratios: Point[] = [
    { x: 0, y: .04 },
    { x: 1, y: .1 },
    { x: .04, y: .96 },
    { x: .96, y: 1 },
  ].filter(isPlayableRatio)
  while (ratios.length < 20) {
    let best: Point | null = null
    let bestGap = 0
    for (let attempt = 0; attempt < 4096; attempt += 1) {
      const candidate = { x: random(), y: random() }
      if (!isPlayableRatio(candidate)) continue
      const tangentGap = tangentMax - tangentMin
      const radialGap = radialMax - radialMin
      const gap = ratios.length
        ? Math.min(...ratios.map(point => Math.hypot((candidate.x - point.x) * tangentGap, (candidate.y - point.y) * radialGap)))
        : Infinity
      if (gap > bestGap) { best = candidate; bestGap = gap }
      if (gap >= P3_RUNE_ORB_MIN_GAP) break
    }
    if (!best || bestGap < P3_RUNE_ORB_MIN_GAP) break
    ratios.push(best)
  }
  const points = ratios.map(pointForRatio)
  const hasViableNeighbour = (point: Point, others: Point[]) => others.some(neighbour =>
    distance(point, neighbour) <= 72
    && pools.every(pool => distanceToSegment(pool, point, neighbour) >= P3_POOL_RADIUS + 3)
    && others.every(other => other === neighbour || distanceToSegment(other, point, neighbour) >= 8)
  )
  for (let index = 0; index < points.length; index++) {
    const others = points.filter((_, otherIndex) => otherIndex !== index)
    if (hasViableNeighbour(points[index], others)) continue
    for (let attempt = 0; attempt < 4096; attempt++) {
      const ratio = { x: random(), y: random() }
      if (!isPlayableRatio(ratio)) continue
      const candidate = pointForRatio(ratio)
      if (others.some(other => distance(candidate, other) < P3_RUNE_ORB_MIN_GAP)) continue
      if (!hasViableNeighbour(candidate, others)) continue
      points[index] = candidate
      break
    }
  }
  return points
}

export function p3RuneStepAt(eventTime: number): number {
  return Math.min(2, Math.max(0, Math.floor((eventTime - P3_MEMORY_START_SECONDS) / P3_MEMORY_STEP_SECONDS)))
}

export function isP3RuneTurn(order: RuneSymbol[], rune: RuneSymbol, eventTime: number): boolean {
  if (eventTime < P3_MEMORY_START_SECONDS - .25) return false
  return order[p3RuneStepAt(eventTime - .35)] === rune
    || order[p3RuneStepAt(eventTime)] === rune
    || order[p3RuneStepAt(eventTime + .25)] === rune
}

export function p3WrongRuneContact(contacts: RuneSymbol[], required: RuneSymbol): RuneSymbol | null {
  return contacts.find(rune => rune !== required) ?? null
}

export function p3RuneDeadline(order: RuneSymbol[], rune: RuneSymbol): number {
  return P3_MEMORY_START_SECONDS + (order.indexOf(rune) + 1) * P3_MEMORY_STEP_SECONDS
}

export function p3MemoryResolved(order: RuneSymbol[], resolved: RuneSymbol[]): boolean {
  return order.every(rune => resolved.includes(rune))
}

export function p3NpcRuneReactionDelay(seed: number, assignment: number, round: number): number {
  return 1 + seededUnit(seed, assignment * 7 + round * 31) * 5
}

export function p3StarsTiming(eventTime: number): { active: boolean; cycle: number; localTime: number } {
  if (eventTime < P3_STARS_START_SECONDS) return { active: false, cycle: 0, localTime: 0 }
  const elapsed = eventTime - P3_STARS_START_SECONDS
  const localTime = elapsed % P3_STARS_INTERVAL_SECONDS
  return {
    active: localTime < P3_STARS_TELEGRAPH_SECONDS,
    cycle: Math.floor(elapsed / P3_STARS_INTERVAL_SECONDS),
    localTime,
  }
}

export function nearestRuneEdges(points: Point[], maximumConnections = 3, maximumDistance = 72): Array<[number, number]> {
  const candidates: Array<{ from: number; to: number; length: number }> = []
  for (let from = 0; from < points.length; from++) {
    for (let to = from + 1; to < points.length; to++) {
      const length = distance(points[from], points[to])
      const hasCloserBridge = points.some((point, index) =>
        index !== from
        && index !== to
        && distance(points[from], point) < length
        && distance(points[to], point) < length
      )
      const crossesAnotherOrb = points.some((point, index) => {
        if (index === from || index === to) return false
        const start = points[from]
        const end = points[to]
        const dx = end.x - start.x
        const dy = end.y - start.y
        const projection = length * length ? ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length) : 0
        return projection > .08 && projection < .92 && distanceToSegment(point, start, end) < 8
      })
      if (length <= maximumDistance && !hasCloserBridge && !crossesAnotherOrb) candidates.push({ from, to, length })
    }
  }
  candidates.sort((a, b) => a.length - b.length)
  const degree = Array.from({ length: points.length }, () => 0)
  const edges: Array<[number, number]> = []
  for (const candidate of candidates) {
    if (degree[candidate.from] >= maximumConnections || degree[candidate.to] >= maximumConnections) continue
    const crossesBeam = edges.some(([from, to]) => {
      if (from === candidate.from || from === candidate.to || to === candidate.from || to === candidate.to) return false
      return segmentsIntersect(points[candidate.from], points[candidate.to], points[from], points[to])
    })
    if (crossesBeam) continue
    edges.push([candidate.from, candidate.to])
    degree[candidate.from] += 1
    degree[candidate.to] += 1
  }
  return edges
}

export function p3RuneEdges(side: -1 | 1, center: Point, round: number, orbs: Point[]): Array<[number, number]> {
  const pools = p3PoolCenters(side, center, round)
  const clearsPools = (from: number, to: number) =>
    pools.every(pool => distanceToSegment(pool, orbs[from], orbs[to]) >= P3_POOL_RADIUS + 3)
  const candidates: Array<{ from: number; to: number; length: number }> = []
  for (let from = 0; from < orbs.length; from++) {
    for (let to = from + 1; to < orbs.length; to++) {
      const length = distance(orbs[from], orbs[to])
      if (
        length <= 72
        && clearsPools(from, to)
        && orbs.every((point, index) => index === from || index === to || distanceToSegment(point, orbs[from], orbs[to]) >= 8)
      ) candidates.push({ from, to, length })
    }
  }
  candidates.sort((a, b) => a.length - b.length)
  const edges: Array<[number, number]> = []
  const degree = Array.from({ length: orbs.length }, (_, index) => edges.filter(edge => edge.includes(index)).length)
  const canAdd = ({ from, to }: { from: number; to: number }) =>
    degree[from] < 3
    && degree[to] < 3
    && edges.every(([edgeFrom, edgeTo]) =>
      edgeFrom === from || edgeFrom === to || edgeTo === from || edgeTo === to
      || !segmentsIntersect(orbs[from], orbs[to], orbs[edgeFrom], orbs[edgeTo])
    )
  const add = ({ from, to }: { from: number; to: number }) => {
    edges.push([from, to])
    degree[from] += 1
    degree[to] += 1
  }

  // Establish visible coverage first. Starting with orphan coverage prevents
  // optional short links from saturating a neighbour or boxing an orb out.
  for (const candidate of candidates) {
    if (degree[candidate.from] > 0 && degree[candidate.to] > 0) continue
    if (canAdd(candidate)) add(candidate)
  }
  // Then add the familiar local density without crossings or >3 connections.
  for (const candidate of candidates) {
    if (edges.some(([from, to]) => from === candidate.from && to === candidate.to)) continue
    if (canAdd(candidate)) add(candidate)
  }
  return edges
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const cross = (origin: Point, first: Point, second: Point) =>
    (first.x - origin.x) * (second.y - origin.y) - (first.y - origin.y) * (second.x - origin.x)
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0
}

export function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0
  return distance(point, { x: start.x + dx * t, y: start.y + dy * t })
}

export function seededStars(seed: number, count = 6): Star[] {
  let value = Math.abs(seed) || 1
  const random = () => { value = (value * 1664525 + 1013904223) % 4294967296; return value / 4294967296 }
  return Array.from({ length: count }, (_, id) => {
    const angle = random() * Math.PI * 2
    const distance = 95 + random() * 125
    return { id, position: { x: ARENA.center.x + Math.cos(angle) * distance, y: ARENA.center.y + Math.sin(angle) * distance }, angle: random() * Math.PI * 2, active: true }
  })
}

export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y) }
export function angleToward(origin: Point, target: Point): number {
  return Math.atan2(target.y - origin.y, target.x - origin.x)
}
export function p2NpcCrystalDrops(center: Point, count: number, radius = 6): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count)
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
  })
}
export function p2OrbReturnState(age: number, orbitRadius = 82): { phase: 'inactive' | 'orbiting' | 'charging' | 'returning' | 'done'; radius: number } {
  if (age < 0) return { phase: 'inactive', radius: orbitRadius }
  if (age < P2_ORB_RETURN_SECONDS - P2_ORB_GLOW_LEAD_SECONDS) return { phase: 'orbiting', radius: orbitRadius }
  if (age < P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS) return { phase: 'charging', radius: orbitRadius }
  if (age < P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS) {
    const progress = (age - P2_ORB_RETURN_SECONDS - P2_ORB_RETURN_GLOW_SECONDS) / P2_ORB_RETURN_TRAVEL_SECONDS
    return { phase: 'returning', radius: orbitRadius * (1 - progress * progress) }
  }
  return { phase: 'done', radius: 0 }
}
export function p2ReturningOrbPositions(age: number, _cycle: number, _time: number, center: Point, orbitRadius = 82): Point[] {
  const state = p2OrbReturnState(age, orbitRadius)
  if (state.phase !== 'orbiting' && state.phase !== 'charging' && state.phase !== 'returning') return []
  return Array.from({ length: 4 }, (_, index) => {
    // A resolved set leaves its beam-aligned cardinal position and keeps moving
    // in the same positive rotational direction while it spirals inward.
    const angle = index * Math.PI / 2 + age * P2_ORBIT_SPEED
    return { x: center.x + Math.cos(angle) * state.radius, y: center.y + Math.sin(angle) * state.radius }
  })
}
export function p2NpcShouldReturnToSoak(orbReturnAge: number): boolean {
  return orbReturnAge >= P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - P2_NPC_PREPOSITION_SECONDS
}
export function shouldShowP2OrbReturnCounter(event: string, orbReturnAge: number): boolean {
  return event.startsWith('p2-')
    && orbReturnAge >= 0
    && orbReturnAge < P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS + .5
}
export function p2PhaseTransitionCountdown(event: string, cycle: number, orbReturnAge: number): number | null {
  const returnFlightEnds = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS
  if (event !== 'p2-wait' || cycle < 3 || orbReturnAge < returnFlightEnds) return null
  return Math.max(0, P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - orbReturnAge)
}
export function p2NpcRoamingPosition(base: Point, index: number, time: number, orbs: Point[], center: Point, maximumRadius: number): Point {
  const clampToArena = (point: Point): Point => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    const radius = Math.hypot(dx, dy)
    return radius <= maximumRadius ? point : { x: center.x + dx / radius * maximumRadius, y: center.y + dy / radius * maximumRadius }
  }
  const phase = time * (.36 + index % 4 * .025) + index * 1.73
  const preferred = clampToArena({ x: base.x + Math.cos(phase) * 8, y: base.y + Math.sin(phase * .91) * 8 })
  if (!orbs.length) return preferred
  const candidates = [preferred, ...Array.from({ length: 12 }, (_, ordinal) => {
    const angle = phase + ordinal * Math.PI / 6
    return clampToArena({ x: base.x + Math.cos(angle) * 9, y: base.y + Math.sin(angle) * 9 })
  })]
  return candidates.reduce((best, candidate) => {
    const clearance = Math.min(...orbs.map(orb => distance(candidate, orb)))
    const bestClearance = Math.min(...orbs.map(orb => distance(best, orb)))
    return clearance - distance(candidate, preferred) * .08 > bestClearance - distance(best, preferred) * .08 ? candidate : best
  }, preferred)
}
export function personalCircleHitsCrystal(circleCenter: Point, crystals: Point[], radius = P2_PERSONAL_CIRCLE_OUTER_RADIUS): boolean {
  return crystals.some(crystal => distance(circleCenter, crystal) < radius)
}
export function personalCircleHitsPlayer(circleCenter: Point, players: Point[], radius = P2_PERSONAL_CIRCLE_OUTER_RADIUS): boolean {
  return players.some(player => distance(circleCenter, player) < radius)
}
export function walkTowards(origin: Point, target: Point, seconds: number, speed: number): Point {
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const length = Math.hypot(dx, dy) || 1
  const travelled = Math.min(length, Math.max(0, seconds) * speed)
  return { x: origin.x + dx / length * travelled, y: origin.y + dy / length * travelled }
}
export function jumpHeights(scriptedProgress: number, personalProgress: number): { player: number; npc: number } {
  const scripted = scriptedProgress > 0 ? Math.sin(Math.min(1, scriptedProgress) * Math.PI) * 42 : 0
  const personal = personalProgress > 0 ? Math.sin(Math.min(1, personalProgress) * Math.PI) * 8 : 0
  return { player: scripted + personal, npc: scripted }
}
export function rotatePoint(point: Point, center: Point, radians: number): Point {
  const dx = point.x - center.x
  const dy = point.y - center.y
  return { x: center.x + dx * Math.cos(radians) - dy * Math.sin(radians), y: center.y + dx * Math.sin(radians) + dy * Math.cos(radians) }
}
export function orientedAssignments(positions: Point[], startSlot: Point, center: Point): Point[] {
  const slotAngle = Math.atan2(startSlot.y - center.y, startSlot.x - center.x)
  const rotationFromSouth = slotAngle - Math.PI / 2
  return positions.map(position => rotatePoint(position, center, rotationFromSouth))
}
export function npcEntryPosition(target: Point, startSlot: Point, index: number, time: number, speed: number): Point {
  const spreadAngle = index * Math.PI * 2 / 19
  const origin = { x: startSlot.x + Math.cos(spreadAngle) * (index % 3) * 2.2, y: startSlot.y + Math.sin(spreadAngle) * (index % 3) * 2.2 }
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const length = Math.hypot(dx, dy) || 1
  const travelled = Math.min(length, time * speed)
  return { x: origin.x + dx / length * travelled, y: origin.y + dy / length * travelled }
}
export function canPickupCrystal(player: Point, crystal: Point, groundAge: number, pickupRadius = 3): boolean {
  return groundAge >= 1 && distance(player, crystal) <= pickupRadius
}
export function crystalWipeReason(state: { assigned: boolean; splinterResolving: boolean; dropped: boolean; crystalHit: boolean; expired: boolean }): string | null {
  if (state.expired) return 'Crystal expired before pickup'
  if (!state.assigned || !state.splinterResolving) return null
  if (!state.dropped) return 'Starsplinter resolved before you dropped the crystal'
  if (state.crystalHit) return 'A Starsplinter hit your crystal'
  return null
}
export function bossBeamHitsPlayer(point: Point, origin: Point, angles: number[], width: number, eventTime: number): boolean {
  if (eventTime < 2.78) return false
  return angles.some(angle => {
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    const along = dx * Math.cos(angle) + dy * Math.sin(angle)
    const across = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle))
    return along > 20 && across < width
  })
}
export function roamingNpcPosition(base: Point, index: number, time: number, event: 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait' | `p3-${string}` | `p4-${string}`, eventTime: number, beamAngles: number[], center: Point): Point {
  if (event === 'countdown' || event === 'positioning') return base
  const phase = index * 1.73
  const roaming = {
    x: base.x + Math.sin(time * (.31 + index % 3 * .04) + phase) * (4 + index % 4),
    y: base.y + Math.cos(time * (.27 + index % 5 * .025) + phase * .7) * (4 + (index + 2) % 5),
  }
  if (event.startsWith('p2-') || event.startsWith('p3-') || event.startsWith('p4-') || !beamAngles.length) return roaming
  let nearest: { angle: number; across: number; signedAcross: number } | null = null
  for (const angle of beamAngles) {
    const dx = roaming.x - center.x
    const dy = roaming.y - center.y
    const along = dx * Math.cos(angle) + dy * Math.sin(angle)
    if (along <= 20) continue
    const signedAcross = -dx * Math.sin(angle) + dy * Math.cos(angle)
    if (!nearest || Math.abs(signedAcross) < nearest.across) nearest = { angle, across: Math.abs(signedAcross), signedAcross }
  }
  if (!nearest || nearest.across >= 21) return roaming
  const dodgeIn = event === 'splinter' ? 1 : Math.min(1, eventTime / 1.7)
  const dodgeOut = event === 'splinter' ? Math.max(0, 1 - eventTime / 1.7) : 1
  const side = Math.abs(nearest.signedAcross) > .1 ? Math.sign(nearest.signedAcross) : index % 2 ? 1 : -1
  const dodge = 24 * dodgeIn * dodgeOut
  return { x: roaming.x - Math.sin(nearest.angle) * side * dodge, y: roaming.y + Math.cos(nearest.angle) * side * dodge }
}
export function crystalCarrierPosition(normal: Point, dropped: Point, groundAge: number, index: number, center: Point, speed = 15): Point {
  const radialAngle = Math.atan2(dropped.y - center.y, dropped.x - center.x)
  const direction = radialAngle + (index % 2 ? Math.PI / 2 : -Math.PI / 2)
  const maximumAway = Math.min(20, speed * 1.35)
  const away = groundAge < 1.35
    ? Math.min(maximumAway, groundAge * speed)
    : groundAge < 3.4
      ? maximumAway
      : Math.max(0, maximumAway - (groundAge - 3.4) * speed)
  return {
    x: dropped.x + Math.cos(direction) * away + (normal.x - dropped.x) * .2,
    y: dropped.y + Math.sin(direction) * away + (normal.y - dropped.y) * .2,
  }
}
export function isInSafeAnnulus(point: Point, center: Point, innerRadius: number, outerRadius: number): boolean {
  const radius = distance(point, center)
  return radius >= innerRadius && radius <= outerRadius
}

export function p1PositioningWipeReason(point: Point, center: Point, innerRadius: number, outerRadius: number): string | null {
  return isInSafeAnnulus(point, center, innerRadius, outerRadius)
    ? null
    : 'Did not reach the Phase 1 playable ring before mechanics began'
}

export function movePlayer(position: Point, keys: Set<string>, speed: number, dt: number): Point {
  return moveInBounds(position, keys, speed, dt, { minX: 24, maxX: ARENA.width - 24, minY: 24, maxY: ARENA.height - 24 })
}

export function moveInBounds(position: Point, keys: Set<string>, speed: number, dt: number, bounds: { minX: number; maxX: number; minY: number; maxY: number }): Point {
  const dx = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0)
  const dy = (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0)
  const length = Math.hypot(dx, dy) || 1
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x + dx / length * speed * dt)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y + dy / length * speed * dt)),
  }
}

export function moveRelativeToCamera(position: Point, keys: Set<string>, speed: number, dt: number, forward: Point, bounds: { minX: number; maxX: number; minY: number; maxY: number }, backwardMultiplier = 1): Point {
  const inputForward = (keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0)
  const inputRight = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0)
  const forwardLength = Math.hypot(forward.x, forward.y) || 1
  const fx = forward.x / forwardLength
  const fy = forward.y / forwardLength
  const rightX = -fy
  const rightY = fx
  const dx = fx * inputForward + rightX * inputRight
  const dy = fy * inputForward + rightY * inputRight
  const inputLength = Math.hypot(dx, dy) || 1
  const movementSpeed = inputForward < 0 ? speed * backwardMultiplier : speed
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x + dx / inputLength * movementSpeed * dt)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y + dy / inputLength * movementSpeed * dt)),
  }
}
export function moveWithIncreasingPull(position: Point, keys: Set<string>, speed: number, dt: number, forward: Point, bounds: { minX: number; maxX: number; minY: number; maxY: number }, center: Point, progress: number, backwardMultiplier = 1): Point {
  const moved = moveRelativeToCamera(position, keys, speed, dt, forward, bounds, backwardMultiplier)
  const dx = center.x - moved.x
  const dy = center.y - moved.y
  const length = Math.hypot(dx, dy)
  if (length < .001) return center
  const force = 2 + 80 * Math.pow(Math.max(0, Math.min(1, progress)), 3)
  const pulled = Math.min(length, force * dt)
  return { x: moved.x + dx / length * pulled, y: moved.y + dy / length * pulled }
}

export function isInsideArena(position: Point): boolean { return distance(position, ARENA.center) < ARENA.radius - 14 }

export function canRecoverFromWipe(difficulty: Difficulty, wipeCount: number, score: number, penalty: number): boolean {
  return difficulty === 'test' || difficulty !== 'hard' && wipeCount < 2 && score - penalty > 0
}

export function healthResponsesPerPhase(difficulty: Difficulty): number {
  return difficulty === 'normal' || difficulty === 'hard' ? 1 : 0
}

export function difficultySettings(difficulty: Difficulty) {
  return { test: { telegraph: 2.5, helper: true, speed: 120 }, easy: { telegraph: 2.2, helper: true, speed: 120 }, normal: { telegraph: 1.5, helper: false, speed: 136 }, hard: { telegraph: 0.95, helper: false, speed: 156 } }[difficulty]
}
