export interface P1Point {
  x: number
  y: number
}

export const P1_INTERRUPT_CAST_COUNT = 5
export const P1_INTERRUPT_CAST_SECONDS = 2
export const P1_DEFAULT_INTERRUPT_KEY = 'Numpad2'
export const P1_CRYSTAL_COUNT = 3
export const P1_CRYSTAL_PICKUP_SECONDS = 5
export const P1_GLAIVE_COUNT = 5
export const P1_GLAIVE_TELEGRAPH_SECONDS = 2
export const P1_GLAIVE_LIFETIME_SECONDS = 30
export const P1_MAX_GLAIVE_SETS = 2
export const P1_MEMORY_DELAY_SECONDS = 2
export const P1_MEMORY_POSITION_SECONDS = 7
export const P1_MEMORY_SWEEP_SECONDS = 5
export const P1_ROTATING_BEAM_COUNT = 8
export const P1_ROTATING_BEAM_OFFSET_DEGREES = 10
export const P1_ROTATING_BEAM_TELEGRAPH_SECONDS = 2
export const P1_ROTATING_BEAM_ACTIVE_SECONDS = 8
export const P1_REACTIVE_SOAK_SECONDS = 2
export const P1_SEQUENCE_COUNT = 2
export const P1_INTERMISSION_POSITION_SECONDS = 15
export const P1_WIPE_PENALTY = 500
export const P1_RUNES = ['T', 'X', 'O', 'V', '+'] as const

export type P1Rune = typeof P1_RUNES[number]
export type P1InterruptState = 'red' | 'yellow' | 'green'

function seededUnit(seed: number, salt: number): number {
  let value = (Math.floor(seed) ^ Math.imul(salt + 31, 0x9e3779b1)) >>> 0
  value = Math.imul(value ^ value >>> 16, 0x7feb352d)
  value = Math.imul(value ^ value >>> 15, 0x846ca68b)
  return ((value ^ value >>> 16) >>> 0) / 0x100000000
}

export function p1InterruptAssignment(seed: number): number {
  return Math.floor(seededUnit(seed, 0) * P1_INTERRUPT_CAST_COUNT)
}

export interface P1InterruptCast {
  index: number
  startsAt: number
  endsAt: number
}

export function p1InterruptCasts(startAt = 0): P1InterruptCast[] {
  return Array.from({ length: P1_INTERRUPT_CAST_COUNT }, (_, index) => ({
    index,
    startsAt: startAt + index * P1_INTERRUPT_CAST_SECONDS,
    endsAt: startAt + (index + 1) * P1_INTERRUPT_CAST_SECONDS,
  }))
}

export function p1InterruptState(assignedCast: number, activeCast: number): P1InterruptState {
  if (activeCast === assignedCast) return 'green'
  if (activeCast === assignedCast - 1) return 'yellow'
  return 'red'
}

export function p1InterruptSucceeded(
  assignedCast: number,
  pressedCast: number | null,
  secondsIntoCast: number,
): boolean {
  return pressedCast === assignedCast
    && secondsIntoCast >= 0
    && secondsIntoCast <= P1_INTERRUPT_CAST_SECONDS
}

export interface P1CrystalSpawn {
  id: number
  carrierIndex: number
  position: P1Point
  spawnedAt: number
  expiresAt: number
}

export function p1CrystalSpawns(
  carrierIndices: readonly number[],
  positions: readonly P1Point[],
  spawnedAt: number,
): P1CrystalSpawn[] {
  if (carrierIndices.length < P1_CRYSTAL_COUNT || positions.length < P1_CRYSTAL_COUNT) {
    throw new Error(`P1 requires ${P1_CRYSTAL_COUNT} crystal carriers and positions`)
  }
  return Array.from({ length: P1_CRYSTAL_COUNT }, (_, id) => ({
    id,
    carrierIndex: carrierIndices[id],
    position: { ...positions[id] },
    spawnedAt,
    expiresAt: spawnedAt + P1_CRYSTAL_PICKUP_SECONDS,
  }))
}

export function p1CrystalExpired(crystal: P1CrystalSpawn, now: number, collectedAt: number | null): boolean {
  return collectedAt === null && now > crystal.expiresAt
}

export interface P1GlaiveConfig {
  speed: number
  lifetimeSeconds?: number
  telegraphSeconds?: number
}

export interface P1Glaive {
  id: number
  position: P1Point
  direction: P1Point
}

export interface P1GlaiveSet {
  id: number
  seed: number
  telegraphStartsAt: number
  launchesAt: number
  expiresAt: number
  speed: number
  glaives: P1Glaive[]
}

export function p1GlaiveSet(
  seed: number,
  id: number,
  origin: P1Point,
  telegraphStartsAt: number,
  config: P1GlaiveConfig,
): P1GlaiveSet {
  const telegraphSeconds = config.telegraphSeconds ?? P1_GLAIVE_TELEGRAPH_SECONDS
  const launchesAt = telegraphStartsAt + telegraphSeconds
  const rotation = seededUnit(seed, id * 101) * Math.PI * 2
  const jitterLimit = Math.PI / 18
  const glaives = Array.from({ length: P1_GLAIVE_COUNT }, (_, glaiveId) => {
    const jitter = (seededUnit(seed, id * 101 + glaiveId + 1) * 2 - 1) * jitterLimit
    const angle = rotation + glaiveId * Math.PI * 2 / P1_GLAIVE_COUNT + jitter
    return {
      id: glaiveId,
      position: { ...origin },
      direction: { x: Math.cos(angle), y: Math.sin(angle) },
    }
  })
  return {
    id,
    seed,
    telegraphStartsAt,
    launchesAt,
    expiresAt: launchesAt + (config.lifetimeSeconds ?? P1_GLAIVE_LIFETIME_SECONDS),
    speed: config.speed,
    glaives,
  }
}

export function p1GlaiveSetVisible(set: P1GlaiveSet, now: number): boolean {
  return now >= set.telegraphStartsAt && now <= set.expiresAt
}

function distanceToRingAlongRay(position: P1Point, direction: P1Point, center: P1Point, radius: number): number {
  const x = position.x - center.x
  const y = position.y - center.y
  const projection = x * direction.x + y * direction.y
  const offset = x * x + y * y - radius * radius
  const discriminant = Math.max(0, projection * projection - offset)
  return -projection + Math.sqrt(discriminant)
}

function advanceGlaive(glaive: P1Glaive, distance: number, center: P1Point, radius: number): P1Glaive {
  let position = { ...glaive.position }
  let direction = { ...glaive.direction }
  let remaining = Math.max(0, distance)

  for (let reflection = 0; reflection < 16 && remaining > 1e-8; reflection += 1) {
    const toRing = Math.max(0, distanceToRingAlongRay(position, direction, center, radius))
    if (toRing >= remaining - 1e-8) {
      position = {
        x: position.x + direction.x * remaining,
        y: position.y + direction.y * remaining,
      }
      remaining = 0
      break
    }
    position = {
      x: position.x + direction.x * toRing,
      y: position.y + direction.y * toRing,
    }
    remaining -= toRing
    const normal = {
      x: (position.x - center.x) / radius,
      y: (position.y - center.y) / radius,
    }
    const dot = direction.x * normal.x + direction.y * normal.y
    direction = {
      x: direction.x - 2 * dot * normal.x,
      y: direction.y - 2 * dot * normal.y,
    }
    position = {
      x: position.x + direction.x * 1e-7,
      y: position.y + direction.y * 1e-7,
    }
    remaining = Math.max(0, remaining - 1e-7)
  }

  return { ...glaive, position, direction }
}

export function p1AdvanceGlaiveSet(
  set: P1GlaiveSet,
  fromTime: number,
  toTime: number,
  arenaCenter: P1Point,
  arenaRadius: number,
): P1GlaiveSet {
  const movementStart = Math.max(fromTime, set.launchesAt)
  const movementEnd = Math.min(toTime, set.expiresAt)
  const elapsed = Math.max(0, movementEnd - movementStart)
  if (elapsed === 0) return set
  return {
    ...set,
    glaives: set.glaives.map(glaive => advanceGlaive(glaive, elapsed * set.speed, arenaCenter, arenaRadius)),
  }
}

export function p1AddGlaiveSet(
  existing: readonly P1GlaiveSet[],
  next: P1GlaiveSet,
  now: number,
  maximumSets = P1_MAX_GLAIVE_SETS,
): P1GlaiveSet[] {
  return [...existing.filter(set => set.expiresAt > now), next]
    .sort((left, right) => left.launchesAt - right.launchesAt)
    .slice(-maximumSets)
}

export function p1MemoryOrder(seed: number, sequence: number): P1Rune[] {
  const runes = [...P1_RUNES]
  for (let index = runes.length - 1; index > 0; index -= 1) {
    const target = Math.floor(seededUnit(seed, sequence * 17 + index) * (index + 1))
    const previous = runes[index]
    runes[index] = runes[target]
    runes[target] = previous
  }
  return runes
}

export interface P1MemoryValidation {
  valid: boolean
  complete: boolean
  nextIndex: number
  wrongIndex: number | null
}

export function p1ValidateMemoryContacts(
  order: readonly P1Rune[],
  contacts: readonly P1Rune[],
): P1MemoryValidation {
  const wrongIndex = contacts.findIndex((rune, index) => rune !== order[index])
  if (wrongIndex >= 0 || contacts.length > order.length) {
    return {
      valid: false,
      complete: false,
      nextIndex: Math.min(wrongIndex >= 0 ? wrongIndex : order.length, order.length),
      wrongIndex: wrongIndex >= 0 ? wrongIndex : order.length,
    }
  }
  return {
    valid: true,
    complete: contacts.length === order.length,
    nextIndex: contacts.length,
    wrongIndex: null,
  }
}

export interface P1RotatingBeams {
  startsAt: number
  telegraphEndsAt: number
  initialAngle: number
  angularSpeed: number
  direction: -1 | 1
}

export function p1RotatingBeams(
  seed: number,
  sequence: number,
  startsAt: number,
  angularSpeed: number,
): P1RotatingBeams {
  const direction = seededUnit(seed, sequence * 29) < .5 ? -1 : 1
  return {
    startsAt,
    telegraphEndsAt: startsAt + P1_ROTATING_BEAM_TELEGRAPH_SECONDS,
    initialAngle: direction * P1_ROTATING_BEAM_OFFSET_DEGREES * Math.PI / 180,
    angularSpeed,
    direction,
  }
}

export function p1BeamAngles(beams: P1RotatingBeams, now: number): number[] {
  const elapsed = Math.max(0, now - beams.startsAt)
  return Array.from({ length: P1_ROTATING_BEAM_COUNT }, (_, index) =>
    beams.initialAngle
      + index * Math.PI * 2 / P1_ROTATING_BEAM_COUNT
      + elapsed * beams.angularSpeed * beams.direction)
}

export function p1MemorySweepAngle(startsAt: number, now: number, openingAngle = -Math.PI / 2): number {
  const progress = Math.max(0, Math.min(1, (now - startsAt) / P1_MEMORY_SWEEP_SECONDS))
  return openingAngle + progress * Math.PI * 2
}

export function p1MemorySlotAngle(order: readonly P1Rune[], rune: P1Rune, openingAngle = -Math.PI / 2): number {
  const index = order.indexOf(rune)
  if (index < 0) return openingAngle
  return openingAngle + (index + .5) * Math.PI * 2 / order.length
}

export function p1MemorySlotValid(
  point: P1Point,
  center: P1Point,
  order: readonly P1Rune[],
  rune: P1Rune,
  toleranceRadians = Math.PI / 7,
): boolean {
  const actual = Math.atan2(point.y - center.y, point.x - center.x)
  const expected = p1MemorySlotAngle(order, rune)
  return Math.abs(Math.atan2(Math.sin(actual - expected), Math.cos(actual - expected))) <= toleranceRadians
}

export function p1CrystalSpawnPosition(assignment: P1Point, center: P1Point, inwardDistance = 14): P1Point {
  const dx = center.x - assignment.x
  const dy = center.y - assignment.y
  const length = Math.hypot(dx, dy) || 1
  return {
    x: assignment.x + dx / length * Math.min(inwardDistance, length),
    y: assignment.y + dy / length * Math.min(inwardDistance, length),
  }
}

export type P1SoakAssignee = 'npc' | 'player'

export interface P1ReactiveSoak {
  id: number
  position: P1Point
  assignee: P1SoakAssignee
  spawnedAt: number
  expiresAt: number
}

export function p1ReactiveSoaks(seed: number, hitPosition: P1Point, spawnedAt: number, distance = 24): P1ReactiveSoak[] {
  const angle = seededUnit(seed, 911) * Math.PI * 2
  return [0, 1].map(id => ({
    id,
    position: {
      x: hitPosition.x + Math.cos(angle + id * Math.PI) * distance,
      y: hitPosition.y + Math.sin(angle + id * Math.PI) * distance,
    },
    assignee: id === 0 ? 'npc' : 'player',
    spawnedAt,
    expiresAt: spawnedAt + P1_REACTIVE_SOAK_SECONDS,
  }))
}

export function p1PlayerSoakFailed(soaks: readonly P1ReactiveSoak[], resolvedIds: readonly number[], now: number): boolean {
  return soaks.some(soak =>
    soak.assignee === 'player'
    && now > soak.expiresAt
    && !resolvedIds.includes(soak.id))
}

export type P1ProgressPhase = 'sequence' | 'intermission-positioning' | 'intermission'

export interface P1Progress {
  phase: P1ProgressPhase
  sequence: number
  secondsRemaining: number | null
}

export function p1Progress(completedSequences: number, finalSequenceCompletedAt: number | null, now: number): P1Progress {
  if (completedSequences < P1_SEQUENCE_COUNT || finalSequenceCompletedAt === null) {
    return { phase: 'sequence', sequence: Math.min(completedSequences + 1, P1_SEQUENCE_COUNT), secondsRemaining: null }
  }
  const elapsed = Math.max(0, now - finalSequenceCompletedAt)
  if (elapsed < P1_INTERMISSION_POSITION_SECONDS) {
    return {
      phase: 'intermission-positioning',
      sequence: P1_SEQUENCE_COUNT,
      secondsRemaining: P1_INTERMISSION_POSITION_SECONDS - elapsed,
    }
  }
  return { phase: 'intermission', sequence: P1_SEQUENCE_COUNT, secondsRemaining: 0 }
}
