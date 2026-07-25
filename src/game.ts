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
export const P2_PERSONAL_CIRCLE_INNER_RADIUS = 11.55
export const P2_PERSONAL_CIRCLE_OUTER_RADIUS = 12.16
export const P3_OUTER_RADIUS = 199
export const P3_LIGHT_RADIUS = 38
export const P3_POOL_RADIUS = 12
export const P3_LANDING_SOAK_RADIUS = 15
export type RuneSymbol = 'T' | 'X' | 'O'
export function assignmentRevealDistance(difficulty: Difficulty): number {
  return difficulty === 'test' || difficulty === 'easy' ? Infinity : difficulty === 'normal' ? 45 : 22
}

export function p3LandingPosition(index: number, center: Point, radius = 176): Point {
  const side = index < 10 ? -1 : 1
  const sideIndex = index % 10
  const angle = (side < 0 ? Math.PI : 0) + (sideIndex - 4.5) * .15
  const row = sideIndex % 3
  const distanceFromCenter = radius - row * 13
  return { x: center.x + Math.cos(angle) * distanceFromCenter, y: center.y + Math.sin(angle) * distanceFromCenter }
}

export function p3LightCenters(side: -1 | 1, center: Point, round: number): Point[] {
  const boss = { x: center.x + side * 108, y: center.y - 22 + (round - 1) * 45 }
  const outward = side < 0 ? Math.PI : 0
  return [-.75, 0, .75].map(offset => {
    const angle = outward + offset
    return {
    x: boss.x + Math.cos(angle) * 43,
    y: boss.y + Math.sin(angle) * 43,
    }
  })
}

export function p3PoolCenters(side: -1 | 1, center: Point, round: number): Point[] {
  return p3LightCenters(side, center, round).map((light, index) => {
    const outward = side < 0 ? Math.PI : 0
    const angle = outward + (index - 1) * .55
    return { x: light.x + Math.cos(angle) * 11, y: light.y + Math.sin(angle) * 11 }
  })
}

export function p3RunePartnerPosition(assignment: number, center: Point, round: number): Point {
  const side: -1 | 1 = assignment < 10 ? -1 : 1
  const pool = p3PoolCenters(side, center, round)[assignment % 3]
  return { x: pool.x + side * 8, y: pool.y - 5 }
}

export function p3RuneOrbs(side: -1 | 1, center: Point, round: number): Point[] {
  const anchorX = center.x + side * 142
  const anchorY = round === 1 ? center.y - 30 : center.y + 45
  let seed = 113 + round * 97 + (side > 0 ? 41 : 0)
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
  const anchors = [
    [-38, -40], [-9, -43], [25, -35], [44, -12],
    [-42, -8], [-14, -12], [14, -5], [39, 18],
    [-35, 27], [-8, 34], [19, 31], [43, 45],
  ]
  return anchors.map(([x, y]) => {
    const jitterX = (random() - .5) * 15
    const jitterY = (random() - .5) * 15
    return {
      x: anchorX + side * (x + jitterX),
      y: anchorY + y + jitterY,
    }
  })
}

export function nearestRuneEdges(points: Point[], maximumConnections = 3, maximumDistance = 39): Array<[number, number]> {
  const candidates: Array<{ from: number; to: number; length: number }> = []
  for (let from = 0; from < points.length; from++) {
    for (let to = from + 1; to < points.length; to++) {
      const length = distance(points[from], points[to])
      if (length <= maximumDistance) candidates.push({ from, to, length })
    }
  }
  candidates.sort((a, b) => a.length - b.length)
  const degree = Array.from({ length: points.length }, () => 0)
  const edges: Array<[number, number]> = []
  for (const candidate of candidates) {
    if (degree[candidate.from] >= maximumConnections || degree[candidate.to] >= maximumConnections) continue
    edges.push([candidate.from, candidate.to])
    degree[candidate.from] += 1
    degree[candidate.to] += 1
  }
  return edges
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
export function personalCircleHitsCrystal(circleCenter: Point, crystals: Point[], radius = P2_PERSONAL_CIRCLE_OUTER_RADIUS): boolean {
  return crystals.some(crystal => distance(circleCenter, crystal) < radius)
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
export function roamingNpcPosition(base: Point, index: number, time: number, event: 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait' | `p3-${string}`, eventTime: number, beamAngles: number[], center: Point): Point {
  const phase = index * 1.73
  const roaming = {
    x: base.x + Math.sin(time * (.31 + index % 3 * .04) + phase) * (4 + index % 4),
    y: base.y + Math.cos(time * (.27 + index % 5 * .025) + phase * .7) * (4 + (index + 2) % 5),
  }
  if (event === 'countdown' || event === 'positioning' || event.startsWith('p2-') || event.startsWith('p3-') || !beamAngles.length) return roaming
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

export function moveRelativeToCamera(position: Point, keys: Set<string>, speed: number, dt: number, forward: Point, bounds: { minX: number; maxX: number; minY: number; maxY: number }): Point {
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
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x + dx / inputLength * speed * dt)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y + dy / inputLength * speed * dt)),
  }
}
export function moveWithIncreasingPull(position: Point, keys: Set<string>, speed: number, dt: number, forward: Point, bounds: { minX: number; maxX: number; minY: number; maxY: number }, center: Point, progress: number): Point {
  const moved = moveRelativeToCamera(position, keys, speed, dt, forward, bounds)
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

export function healthEmergencyLimit(difficulty: Difficulty): number {
  return difficulty === 'hard' ? 2 : difficulty === 'normal' ? 1 : 0
}

export function difficultySettings(difficulty: Difficulty) {
  return { test: { telegraph: 2.5, helper: true, speed: 120 }, easy: { telegraph: 2.2, helper: true, speed: 120 }, normal: { telegraph: 1.5, helper: false, speed: 136 }, hard: { telegraph: 0.95, helper: false, speed: 156 } }[difficulty]
}
