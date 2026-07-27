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
export const P1_GLAIVE_LIFETIME_SECONDS = 60
export const P1_GLAIVE_REFLECTED_SPEED_MULTIPLIER = 1.1
export const P1_MAX_GLAIVE_SETS = 2
export const P1_INNER_RADIUS = 102
export const P1_OUTER_RADIUS = 260
export const P1_MEMORY_RADIUS = 20
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

export function p1CrystalPickupSequence(assignments: readonly number[], playerIndex: number): 1 | 2 | null {
  const slot = assignments.indexOf(playerIndex)
  return slot < 0 ? null : slot < P1_CRYSTAL_COUNT ? 1 : 2
}

export function p1NpcCrystalPickupReleased(
  assignments: readonly number[],
  playerIndex: number,
  sequence: number,
  playerCollected: boolean,
): boolean {
  return p1CrystalPickupSequence(assignments, playerIndex) !== sequence || playerCollected
}

export interface P1GlaiveConfig {
  speed: number
  reflectedSpeed?: number
  lifetimeSeconds?: number
  telegraphSeconds?: number
  target?: P1Point
}

export interface P1Glaive {
  id: number
  position: P1Point
  direction: P1Point
  reflected?: boolean
}

export interface P1GlaiveSet {
  id: number
  seed: number
  telegraphStartsAt: number
  launchesAt: number
  expiresAt: number
  speed: number
  reflectedSpeed: number
  origin: P1Point
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
  const rotation = config.target
    ? Math.atan2(config.target.y - origin.y, config.target.x - origin.x)
    : seededUnit(seed, id * 101) * Math.PI * 2
  const glaives = Array.from({ length: P1_GLAIVE_COUNT }, (_, glaiveId) => {
    const angle = config.target
      ? rotation + (glaiveId - (P1_GLAIVE_COUNT - 1) / 2) * Math.PI / 9
      : rotation + glaiveId * Math.PI * 2 / P1_GLAIVE_COUNT
    return {
      id: glaiveId,
      position: { ...origin },
      direction: { x: Math.cos(angle), y: Math.sin(angle) },
      reflected: false,
    }
  })
  return {
    id,
    seed,
    telegraphStartsAt,
    launchesAt,
    expiresAt: launchesAt + (config.lifetimeSeconds ?? P1_GLAIVE_LIFETIME_SECONDS),
    speed: config.speed,
    reflectedSpeed: config.reflectedSpeed ?? config.speed * P1_GLAIVE_REFLECTED_SPEED_MULTIPLIER / 3,
    origin: { ...origin },
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
  const discriminant = projection * projection - offset
  if (discriminant < 0) return Infinity
  const root = Math.sqrt(discriminant)
  return [-projection - root, -projection + root]
    .filter(value => value > 1e-6)
    .sort((left, right) => left - right)[0] ?? Infinity
}

function advanceGlaive(
  glaive: P1Glaive,
  seconds: number,
  initialSpeed: number,
  reflectedSpeed: number,
  center: P1Point,
  outerRadius: number,
  innerRadius: number,
): P1Glaive {
  let position = { ...glaive.position }
  let direction = { ...glaive.direction }
  let reflected = glaive.reflected ?? false
  let remainingSeconds = Math.max(0, seconds)

  for (let reflection = 0; reflection < 16 && remainingSeconds > 1e-8; reflection += 1) {
    const speed = reflected ? reflectedSpeed : initialSpeed
    const outerDistance = distanceToRingAlongRay(position, direction, center, outerRadius)
    const innerDistance = innerRadius > 0
      ? distanceToRingAlongRay(position, direction, center, innerRadius)
      : Infinity
    const toRing = Math.min(outerDistance, innerDistance)
    const secondsToRing = toRing / speed
    if (secondsToRing >= remainingSeconds - 1e-8) {
      position = {
        x: position.x + direction.x * speed * remainingSeconds,
        y: position.y + direction.y * speed * remainingSeconds,
      }
      remainingSeconds = 0
      break
    }
    position = {
      x: position.x + direction.x * toRing,
      y: position.y + direction.y * toRing,
    }
    remainingSeconds -= secondsToRing
    reflected = true
    const radius = innerDistance < outerDistance ? innerRadius : outerRadius
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
    remainingSeconds = Math.max(0, remainingSeconds - 1e-7 / reflectedSpeed)
  }

  return { ...glaive, position, direction, reflected }
}

export function p1AdvanceGlaiveSet(
  set: P1GlaiveSet,
  fromTime: number,
  toTime: number,
  arenaCenter: P1Point,
  arenaOuterRadius: number,
  arenaInnerRadius = 0,
): P1GlaiveSet {
  const movementStart = Math.max(fromTime, set.launchesAt)
  const movementEnd = Math.min(toTime, set.expiresAt)
  const elapsed = movementEnd - movementStart
  if (elapsed <= 0) return set
  return {
    ...set,
    glaives: set.glaives.map(glaive => advanceGlaive(glaive, elapsed, set.speed, set.reflectedSpeed, arenaCenter, arenaOuterRadius, arenaInnerRadius)),
  }
}

export function p1BossPosition(opening: P1Point, arenaCenter: P1Point, sequence: number): P1Point {
  const dx = opening.x - arenaCenter.x
  const dy = opening.y - arenaCenter.y
  const angle = Math.atan2(dy, dx) + Math.max(0, sequence - 1) * Math.PI / 2
  const radius = Math.hypot(dx, dy)
  return {
    x: arenaCenter.x + Math.cos(angle) * radius,
    y: arenaCenter.y + Math.sin(angle) * radius,
  }
}

export function p1ContinuousBeamTime(event: string, eventTime: number): number {
  return event === 'p1-beams' ? P1_ROTATING_BEAM_TELEGRAPH_SECONDS + eventTime : eventTime
}

export function p1BossEncounterPosition(
  opening: P1Point,
  tankPositions: readonly P1Point[],
  sequence: number,
  event: string,
  eventTime: number,
): P1Point {
  const start = sequence <= 1 ? opening : tankPositions[sequence - 2] ?? opening
  const target = tankPositions[sequence - 1] ?? start
  if (event === 'p1-soaks') return { ...target }
  if (event !== 'p1-beam-telegraph' && event !== 'p1-beams') return { ...start }
  const progress = Math.max(0, Math.min(1, p1ContinuousBeamTime(event, eventTime)
    / (P1_ROTATING_BEAM_TELEGRAPH_SECONDS + P1_ROTATING_BEAM_ACTIVE_SECONDS)))
  return {
    x: start.x + (target.x - start.x) * progress,
    y: start.y + (target.y - start.y) * progress,
  }
}

export function p1NpcMemoryPosition(target: P1Point, npcIndex: number, eventTime: number, positioning: boolean): P1Point {
  if (!positioning) return { ...target }
  const remainingChaos = Math.max(0, Math.min(1, (P1_MEMORY_POSITION_SECONDS - 1.25 - eventTime) / (P1_MEMORY_POSITION_SECONDS - 1.25)))
  const radius = remainingChaos * (9 + npcIndex % 4 * 2.5)
  const angle = npcIndex * 2.399963 + eventTime * (1.35 + npcIndex % 3 * .18)
  return {
    x: target.x + Math.cos(angle) * radius,
    y: target.y + Math.sin(angle) * radius,
  }
}

export function p1NpcRoamingPosition(
  assignment: P1Point,
  boss: P1Point,
  npcIndex: number,
  time: number,
  seed: number,
): P1Point {
  const stepSeconds = 2.2 + npcIndex % 4 * .28
  const step = Math.floor(time / stepSeconds)
  const assignmentAngle = Math.atan2(assignment.y - boss.y, assignment.x - boss.x)
  const assignmentRadius = Math.hypot(assignment.x - boss.x, assignment.y - boss.y)
  const angleJitter = (seededUnit(seed + npcIndex * 97, step * 2) - .5) * .7
  const radiusJitter = (seededUnit(seed + npcIndex * 131, step * 2 + 1) - .5) * 24
  const direction = npcIndex % 2 ? 1 : -1
  const angle = assignmentAngle + direction * step * (.32 + npcIndex % 5 * .035) + angleJitter
  const radius = Math.max(34, Math.min(88, assignmentRadius + radiusJitter))
  return {
    x: boss.x + Math.cos(angle) * radius,
    y: boss.y + Math.sin(angle) * radius,
  }
}

export function p1NpcBeamPosition(
  assignment: P1Point,
  npcIndex: number,
  beams: P1RotatingBeams,
  elapsed: number,
  arenaCenter: P1Point,
): P1Point {
  const assignmentAngle = Math.atan2(assignment.y - arenaCenter.y, assignment.x - arenaCenter.x)
  const initialAngles = p1BeamAngles(beams, 0)
  let beamIndex = 0
  let nearest = Infinity
  initialAngles.forEach((angle, index) => {
    const delta = Math.abs(Math.atan2(Math.sin(assignmentAngle - angle), Math.cos(assignmentAngle - angle)))
    if (delta < nearest) {
      nearest = delta
      beamIndex = index
    }
  })
  const beamAngle = p1BeamAngles(beams, elapsed)[beamIndex]
  const crossingSide = elapsed < 1 ? 1 : -1
  const followOffset = beams.direction * crossingSide * (elapsed < 1 ? .2 : .13)
  const radius = Math.max(P1_INNER_RADIUS + 24, Math.min(P1_OUTER_RADIUS - 28, Math.hypot(assignment.x - arenaCenter.x, assignment.y - arenaCenter.y)))
  const spread = (npcIndex % 5 - 2) * 2.2
  return {
    x: arenaCenter.x + Math.cos(beamAngle + followOffset) * (radius + spread),
    y: arenaCenter.y + Math.sin(beamAngle + followOffset) * (radius + spread),
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
  openingAngle = 0,
): P1RotatingBeams {
  const direction = seededUnit(seed, sequence * 29) < .5 ? -1 : 1
  return {
    startsAt,
    telegraphEndsAt: startsAt + P1_ROTATING_BEAM_TELEGRAPH_SECONDS,
    initialAngle: openingAngle + direction * P1_ROTATING_BEAM_OFFSET_DEGREES * Math.PI / 180,
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
  return openingAngle + index * Math.PI * 2 / order.length
}

export function p1MemorySlotValid(
  point: P1Point,
  center: P1Point,
  order: readonly P1Rune[],
  rune: P1Rune,
  openingAngle = -Math.PI / 2,
  toleranceRadians = Math.PI / 7,
): boolean {
  const actual = Math.atan2(point.y - center.y, point.x - center.x)
  const expected = p1MemorySlotAngle(order, rune, openingAngle)
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
