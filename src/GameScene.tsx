import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { angleToward, assignmentRevealDistance, constrainP3NpcTargetToSide, crystalCarrierPosition, distance, distanceToSegment, hasActiveP3CrystalLight, isActiveP3RuneDuty, jumpHeights, keepP3CrystalPoolCovered, keepP3NpcInSoak, keepP4NpcInProtection, npcEntryPosition, OPENING_BOOST_SECONDS, P1_STAR_LENGTH, P2_BEAM_SECONDS, P2_ORBIT_SPEED, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P2_PERSONAL_CIRCLE_INNER_RADIUS, P2_PERSONAL_CIRCLE_OUTER_RADIUS, P2_PULL_SECONDS, P2_SPREAD_SECONDS, p2NpcRoamingPosition, p2NpcShouldReturnToSoak, p2OrbPosition, p2OrbReturnState, p2ReturningOrbPositions, p3ActiveCrystalAssignments, P3_APPROACH_NPC_SPEED_MULTIPLIER, p3ArchangelStackPosition, p3BossPosition, p3CrystalPoolCoverageTargets, p3FlightPosition, P3_FLIGHT_SECONDS, p3LandingGroupIndex, p3LandingPlanIndex, p3LandingPosition, p3LandingSoakPositions, p3LightCenters, p3NpcPoolAssignment, p3NpcRuneReactionDelay, p3NpcSoaksActive, p3PoolCenters, p3PoolLayoutId, p3ProtectionBubbleCenter, p3RuneEdges, p3RuneOrbs, p3RunePartnerPosition, p3SideForPosition, p3StarsTiming, playerCarriesCrystal, P3_LANDING_SOAK_RADIUS, P3_LIGHT_RADIUS, P3_MEMORY_PANEL_SECONDS, P3_MEMORY_START_SECONDS, P3_OUTER_RADIUS, P3_POOL_HEALTH, P3_POOL_RADIUS, p4EncounterBoxStates, p4FrontSoakerPosition, p4GroupPosition, p4NpcRelocationPace, p4NpcSplinterPosition, p4PlayerSplinterDuty, p4RelocationProgress, p4SplinterAge, p4SplinterHitsGroup, p4SplinterResolutionActive, p4SplinterRotation, p4StackPosition, p4TankAvoidSplinters, p4TankConeActive, p4TankConeHitsBox, p4TransitionStartPosition, P4_FRONT_CONE_RANGE, P4_HEAVEN_MOVE_SECONDS, P4_HEAVEN_START_SECONDS, P4_KNOCKUP_SECONDS, P4_MOVEMENT_MULTIPLIER, P4_PROTECTION_RADIUS, P4_SPLINTER_DETONATION_SECONDS, roamingNpcPosition, safestStarsplinterRotation, separateP3NpcTarget, shouldApplyP3NpcDisplacement, shouldHoldP3RunePartner, type Difficulty, type PlayerClass, type PlayerProfile, type Point, type RuneSymbol } from './game'
import { p3SectorMovementSpeed, p3SpreadPosition, p4PlayerSplinterHitsNpc, p4RenderedNpcSplinterHitsPlayer, p4RenderedNpcSplinterOrigin, p4TankKillsBox } from './game'
import { isP3RaidMemberVisible } from './game'
import { isInsideP3Pool } from './game'
import { combatProjectileBossCenter, combatProjectileHeight, combatProjectileImpactPoint, combatProjectilePosition, combatProjectileShape, combatProjectileTargetHeight, combatProjectileTravelSeconds, combatProjectilesActive, COMBAT_PROJECTILE_IMPACT_SECONDS, MAX_VISIBLE_NPC_PROJECTILES, npcProjectileShots, type CombatProjectileShape } from './projectiles'
import { P1_INNER_RADIUS, P1_INTERMISSION_POSITION_SECONDS, P1_MEMORY_BEAM_LENGTH, P1_MEMORY_BEAM_WIDTH_SCALE, P1_MEMORY_RADIUS, P1_OUTER_RADIUS, P1_REACTIVE_SOAK_RADIUS, p1BeamAngles, p1BossEncounterPosition, p1ClampNpcToArena, p1ContinuousBeamTime, p1CrystalSpawnPosition, p1MemoryRuneVisible, p1MemorySlotAngle, p1MemorySweepAngle, p1NpcBeamPosition, p1NpcBeamWaitingPosition, p1NpcCrystalPickupReleased, p1NpcCrystalTargetSlot, p1NpcGlaiveDodgePosition, p1NpcInterruptSeconds, p1NpcMayDodgeGlaive, p1NpcMemoryPosition, p1NpcRoamingPosition, p1PreferredCrystalSlot, p1RotatingBeams, type P1GlaiveSet, type P1ReactiveSoak, type P1Rune } from './p1'

interface SceneProps {
  p1Sequence: number
  p1Seed: number
  p1InterruptAssignment: number
  p1InterruptCast: number
  p1InterruptPressed: boolean
  p1MemoryOrder: P1Rune[]
  p1GlaiveSets: P1GlaiveSet[]
  p1Soaks: P1ReactiveSoak[]
  p1SoakResolved: number[]
  p1CrystalAssignments: number[]
  p1CrystalCollected: boolean
  p1WrongCrystalHeld: boolean
  p1StolenCrystalSlot: number | null
  combatProjectilesEnabled: boolean
  mainProjectileFiredAt: number | null
  positions: Point[]
  intermissionPositions: Point[]
  p2SoakPositions: Point[]
  p2SpreadPositions: Point[]
  profiles: PlayerProfile[]
  raidStart: Point
  p1BossOpening: Point
  movementSpeed: number
  movementBonus: boolean
  difficulty: Difficulty
  paused: boolean
  wipeReason: string
  p2Cycle: number
  p2OrbReturnAge: number
  onP2OrbitAngle: (angle: number) => void
  p3Round: number
  p3ArchangelDuty: 1 | 2 | null
  p4Cycle: number
  p4PatternSeed: number
  p3PoolHealth: number[]
  onP3PoolOccupancy: (occupancy: number[]) => void
  onP3LightCenters: (centers: Point[]) => void
  onP3RuneContacts: (runes: RuneSymbol[]) => void
  onNpcPositions: (positions: Point[]) => void
  onP4SplinterHit: (reason: string) => void
  p3RuneOrder: RuneSymbol[]
  p3RuneStep: number
  p3ResolvedRunes: RuneSymbol[]
  crystalCarriers: number[]
  playerIsCrystal: boolean
  playerCrystalSpent: boolean
  player: Point
  crystal: Point | null
  npcCrystals: Point[]
  npcCarrier: number | null
  npcCrystalAge: number
  playerSplinterRotation: number
  personalJumpProgress: number
  crystalAge: number
  event: 'p1-countdown' | 'p1-pull' | 'p1-interrupts' | 'p1-crystals' | 'p1-glaives' | 'p1-memory-position' | 'p1-memory-sweep' | 'p1-beam-position' | 'p1-beam-telegraph' | 'p1-beams' | 'p1-soaks' | 'p1-transition' | 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait' | 'p3-countdown' | 'p3-flight' | 'p3-landing' | 'p3-approach' | 'p3-light-pools' | 'p3-rune-preview' | 'p3-lattice-memory' | 'p3-lattice-second' | 'p3-pools-overlap' | 'p3-big-boom' | 'p3-archangel-position' | 'p3-archangel' | 'p3-sector-move' | 'p4-countdown' | 'p4-transition' | 'p4-cycle'
  eventTime: number
  beamAngles: number[]
  npcSplinters: number[]
  time: number
  assignment: number
  easy: boolean
  onCameraDirection: (direction: Point) => void
  onZoomChange: (zoom: number) => void
}

const WORLD = { width: 960, height: 540, center: { x: 480, y: 270 }, innerRadius: 102, outerRadius: 169 }
const P2_RADIUS = WORLD.innerRadius * .54
const STAR_LENGTH = P1_STAR_LENGTH
const DIM_OPPOSITE_P3_SIDE = true
interface CameraSettings { yaw: number; pitch: number; zoom: number }
function loadCameraSettings(): CameraSettings {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-camera-settings') || 'null')
    if (Number.isFinite(saved?.yaw) && Number.isFinite(saved?.pitch) && Number.isFinite(saved?.zoom)) return {
      yaw: saved.yaw,
      pitch: THREE.MathUtils.clamp(saved.pitch, THREE.MathUtils.degToRad(2), THREE.MathUtils.degToRad(80)),
      zoom: THREE.MathUtils.clamp(saved.zoom, 8, 24),
    }
  } catch { /* use defaults */ }
  return { yaw: 0, pitch: THREE.MathUtils.degToRad(70), zoom: 16 }
}
const CLASS_COLORS: Record<PlayerClass, number> = {
  mage: 0x3fc7eb, warlock: 0x8788ee, augmentation: 0x33937f, priest: 0xffffff,
  'death-knight': 0xc41e3a, 'demon-hunter': 0xa330c9, warrior: 0xc69b6d,
  paladin: 0xf48cba, druid: 0xff7c0a, evoker: 0x33937f, shaman: 0x0070dd, hunter: 0xaad372, monk: 0x00a98f,
}

function npcPosition(index: number, time: number, positions: Point[], playerAssignment: number, event: SceneProps['event'], eventTime: number, beamAngles: number[], raidStart: Point, movementSpeed: number, movementBonus: boolean): Point {
  const baseIndex = positions.map((_, positionIndex) => positionIndex).filter(positionIndex => positionIndex !== playerAssignment)[index]
  const target = positions[baseIndex]
  const positioningTime = Math.max(0, time - 3)
  const travelTime = positioningTime + (movementBonus ? Math.min(positioningTime, OPENING_BOOST_SECONDS) * .4 : 0)
  const entering = npcEntryPosition(target, raidStart, index, travelTime, movementSpeed)
  return distance(entering, target) > .1 ? entering : roamingNpcPosition(target, index, time, event, eventTime, beamAngles, WORLD.center)
}
function walkTowards(origin: Point, target: Point, seconds: number, speed: number): Point {
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const length = Math.hypot(dx, dy) || 1
  const travelled = Math.min(length, Math.max(0, seconds) * speed)
  return { x: origin.x + dx / length * travelled, y: origin.y + dy / length * travelled }
}
function pointAlongArenaArc(origin: Point, target: Point, center: Point, progress: number, minimumRadius = WORLD.innerRadius + 8): Point {
  const originRadius = Math.max(minimumRadius, distance(origin, center))
  const targetRadius = Math.max(minimumRadius, distance(target, center))
  const originAngle = Math.atan2(origin.y - center.y, origin.x - center.x)
  const targetAngle = Math.atan2(target.y - center.y, target.x - center.x)
  const angleDelta = Math.atan2(Math.sin(targetAngle - originAngle), Math.cos(targetAngle - originAngle))
  const amount = THREE.MathUtils.clamp(progress, 0, 1)
  const angle = originAngle + angleDelta * amount
  const radius = THREE.MathUtils.lerp(originRadius, targetRadius, amount)
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }
}
function walkAroundArena(origin: Point, target: Point, seconds: number, speed: number): Point {
  const averageRadius = (distance(origin, WORLD.center) + distance(target, WORLD.center)) / 2
  const originAngle = Math.atan2(origin.y - WORLD.center.y, origin.x - WORLD.center.x)
  const targetAngle = Math.atan2(target.y - WORLD.center.y, target.x - WORLD.center.x)
  const angleDelta = Math.abs(Math.atan2(Math.sin(targetAngle - originAngle), Math.cos(targetAngle - originAngle)))
  const pathLength = Math.hypot(angleDelta * averageRadius, distance(origin, WORLD.center) - distance(target, WORLD.center)) || 1
  return pointAlongArenaArc(origin, target, WORLD.center, seconds * speed / pathLength)
}
type P3StarsField = { orbs: Point[]; edges: Array<[number, number]> }
const p3StarsFieldCache = new Map<string, P3StarsField>()
const transientGeometryCache = new Map<string, THREE.BufferGeometry>()
function p3StarsField(side: -1 | 1, round: number, cycle: number): P3StarsField {
  const key = `${p3PoolLayoutId()}:${side}:${round}:${cycle}`
  const cached = p3StarsFieldCache.get(key)
  if (cached) return cached
  const orbs = p3RuneOrbs(side, WORLD.center, round, cycle)
  const field = { orbs, edges: p3RuneEdges(side, WORLD.center, round, orbs) }
  p3StarsFieldCache.set(key, field)
  return field
}
function cachedTransientGeometry<T extends THREE.BufferGeometry>(key: string, create: () => T): T {
  const cached = transientGeometryCache.get(key)
  if (cached) return cached as T
  const geometry = create()
  geometry.userData.transientCache = true
  transientGeometryCache.set(key, geometry)
  return geometry
}
function avoidP3Stars(position: Point, target: Point, field: P3StarsField, index: number): Point {
  const { orbs, edges } = field
  const nearby = edges.find(([from, to]) => distanceToSegment(position, orbs[from], orbs[to]) < 8 || distanceToSegment(target, orbs[from], orbs[to]) < 5)
  if (!nearby) return target
  const start = orbs[nearby[0]]
  const end = orbs[nearby[1]]
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy) || 1
  const direction = index % 2 ? 1 : -1
  return { x: target.x - dy / length * 13 * direction, y: target.y + dx / length * 13 * direction }
}
function p3NpcTarget(index: number, crystal: boolean, round: number, event: SceneProps['event'], eventTime: number, landingSeed = 0, crystalSlot = -1, assignedSide?: -1 | 1, landingIndex = index): Point {
  const side: -1 | 1 = assignedSide ?? (index < 10 ? -1 : 1)
  const landing = p3LandingPosition(landingIndex, WORLD.center)
  if (event === 'p3-countdown') return WORLD.center
  if (event === 'p3-flight') {
    return p3FlightPosition(WORLD.center, landing, eventTime)
  }
  if (event === 'p3-landing') {
    const sideIndex = index % 10
    const group = Math.min(2, Math.floor(sideIndex / 3))
    const member = sideIndex - group * 3
    const soaks = p3LandingSoakPositions(landingIndex, WORLD.center, landingSeed)
    return member < 2 ? soaks[member] : landing
  }
  const generatedSpread = p3SpreadPosition(index, crystal, WORLD.center, round, crystalSlot, side)
  const safeCenter = p3LightCenters(side, WORLD.center, round)[crystal && crystalSlot >= 0 ? crystalSlot % 3 : index % 3]
  const safeOffset = distance(generatedSpread, safeCenter)
  const safeSpread = safeOffset <= P3_LIGHT_RADIUS - 1
    ? generatedSpread
    : {
        x: safeCenter.x + (generatedSpread.x - safeCenter.x) / safeOffset * (P3_LIGHT_RADIUS - 1),
        y: safeCenter.y + (generatedSpread.y - safeCenter.y) / safeOffset * (P3_LIGHT_RADIUS - 1),
      }
  if (event === 'p3-approach') return safeSpread
  if (event === 'p3-light-pools' || event === 'p3-pools-overlap') {
    return safeSpread
  }
  if (event === 'p3-rune-preview' || event === 'p3-lattice-memory' || event === 'p3-lattice-second') {
    return safeSpread
  }
  if (event === 'p3-big-boom') return safeSpread
  if (event === 'p3-archangel-position' || event === 'p3-archangel') return p3ArchangelStackPosition(side, WORLD.center, round)
  if (event === 'p3-sector-move') {
    if (round >= 2) return p4TransitionStartPosition(WORLD.center)
    return p3NpcTarget(index, crystal, Math.min(2, round + 1), 'p3-light-pools', 0, landingSeed, crystalSlot, side, landingIndex)
  }
  if (event === 'p4-transition' || event === 'p4-cycle') {
    return p4TransitionStartPosition(WORLD.center)
  }
  return landing
}
function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children.pop()!
    const mesh = child as THREE.Mesh
    if (!mesh.geometry?.userData.transientCache) mesh.geometry?.dispose()
    const material = mesh.material
    if (Array.isArray(material)) material.forEach(item => item.dispose())
    else material?.dispose()
  }
}
function setEntityDimmed(entity: THREE.Object3D, dimmed: boolean) {
  entity.traverse(object => {
    const material = (object as THREE.Mesh | THREE.Sprite).material
    if (!material || Array.isArray(material)) return
    if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity
    const baseOpacity = material.userData.baseOpacity as number
    material.transparent = dimmed || baseOpacity < 1
    material.opacity = baseOpacity * (dimmed ? .35 : 1)
  })
}
function addFlatBeam(group: THREE.Group, origin: Point, angle: number, length: number, width: number, color: number, opacity: number) {
  const geometry = new THREE.PlaneGeometry(length, width)
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide })
  const beam = new THREE.Mesh(geometry, material)
  beam.rotation.x = -Math.PI / 2
  beam.rotation.z = -angle
  beam.position.set(origin.x + Math.cos(angle) * length / 2, 2.4, origin.y + Math.sin(angle) * length / 2)
  group.add(beam)
}
function addLaserBeam(group: THREE.Group, origin: Point, angle: number, length: number, width: number, color: number, opacity: number) {
  const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
  const midpoint = new THREE.Vector3(origin.x + direction.x * length / 2, 4.4, origin.y + direction.z * length / 2)
  const addLayer = (radius: number, layerColor: number, layerOpacity: number, order: number) => {
    const beam = new THREE.Mesh(
      cachedTransientGeometry(`laser:${radius}:${length}`, () => new THREE.CylinderGeometry(radius, radius, length, 10, 1, true)),
      new THREE.MeshBasicMaterial({ color: layerColor, transparent: true, opacity: layerOpacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    )
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    beam.position.copy(midpoint)
    beam.renderOrder = order
    group.add(beam)
  }
  addLayer(width * 1.25, color, opacity * .16, 11)
  addLayer(width * .45, color, opacity * .72, 12)
  addLayer(Math.max(.18, width * .12), 0xd9f8ff, Math.min(1, opacity * 1.25), 13)
}
function addFrontalCone(group: THREE.Group, origin: Point, angle: number, radius: number, color: number, opacity: number) {
  const geometry = cachedTransientGeometry(`cone:${radius}:${angle}`, () => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    for (let step = 0; step <= 20; step++) {
      const rayAngle = angle - Math.PI / 4 + step / 20 * Math.PI / 2
      shape.lineTo(Math.cos(rayAngle) * radius, -Math.sin(rayAngle) * radius)
    }
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  })
  const cone = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
  cone.rotation.x = -Math.PI / 2
  cone.position.set(origin.x, 3.4, origin.y)
  cone.renderOrder = 10
  group.add(cone)
}
function addGroundRing(group: THREE.Group, point: Point, inner: number, outer: number, color: number, opacity: number, height = 2.7, cacheGeometry = true) {
  const geometry = cacheGeometry
    ? cachedTransientGeometry(`ring:${inner}:${outer}`, () => new THREE.RingGeometry(inner, outer, 48))
    : new THREE.RingGeometry(inner, outer, 48)
  const ring = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide }))
  ring.rotation.x = -Math.PI / 2
  ring.position.set(point.x, height, point.y)
  ring.renderOrder = 8
  group.add(ring)
}
function addGroundProgress(group: THREE.Group, point: Point, radius: number, width: number, progress: number, color: number, opacity: number, height = 3) {
  const amount = THREE.MathUtils.clamp(progress, 0, 1)
  if (amount <= 0) return
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 64, 1, -Math.PI / 2, Math.PI * 2 * amount), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide }))
  ring.rotation.x = -Math.PI / 2
  ring.position.set(point.x, height, point.y)
  ring.renderOrder = 9
  group.add(ring)
}
function addGroundDisc(group: THREE.Group, point: Point, radius: number, color: number, opacity: number, height = 2.35) {
  const geometry = cachedTransientGeometry(`disc:${radius}`, () => new THREE.CircleGeometry(radius, 48))
  const disc = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide }))
  disc.rotation.x = -Math.PI / 2
  disc.position.set(point.x, height, point.y)
  disc.renderOrder = 7
  group.add(disc)
}
function addRuneMarker(group: THREE.Group, point: Point, texture: THREE.Texture, active = false) {
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: active ? 1 : .96, depthWrite: false, depthTest: false }))
  marker.scale.set(active ? 16 : 14, active ? 8 : 7, 1)
  marker.position.set(point.x, active ? 22 : 20, point.y)
  marker.renderOrder = 24
  group.add(marker)
  addGroundRing(group, point, 5, 5.8, 0x78cfff, active ? .92 : .48)
}
function addBossRune(group: THREE.Group, point: Point, texture: THREE.Texture, opacity: number) {
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false }))
  marker.scale.set(28, 14, 1)
  marker.position.set(point.x, 29, point.y)
  group.add(marker)
}
function addOrb(group: THREE.Group, point: Point, color = 0xb170ff, size = 5.4, opacity = .92) {
  const orb = new THREE.Mesh(cachedTransientGeometry(`orb:${size}`, () => new THREE.SphereGeometry(size, 20, 12)), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false }))
  orb.position.set(point.x, size + 1.5, point.y)
  orb.renderOrder = 11
  group.add(orb)
  addGroundRing(group, point, size + .6, size + 2.4, color, opacity * .42)
}
function addGroundCrystal(group: THREE.Group, point: Point, playerDuty = false) {
  const box = new THREE.Mesh(
    cachedTransientGeometry('ground-crystal-box', () => new THREE.BoxGeometry(4.2, 5.2, 4.2)),
    new THREE.MeshBasicMaterial({ color: playerDuty ? 0xffff82 : 0xd8b928 }),
  )
  box.rotation.set(.12, Math.PI / 4, .12)
  box.position.set(point.x, 5.2, point.y)
  box.renderOrder = 12
  group.add(box)
  const glow = new THREE.Mesh(
    cachedTransientGeometry('ground-crystal-glow', () => new THREE.SphereGeometry(5.5, 20, 12)),
    new THREE.MeshBasicMaterial({ color: 0xffdc48, transparent: true, opacity: playerDuty ? .34 : .12, depthWrite: false }),
  )
  glow.position.set(point.x, 5.2, point.y)
  glow.renderOrder = 11
  group.add(glow)
  addGroundRing(group, point, 3.8, playerDuty ? 8.4 : 7.2, 0xffe55c, playerDuty ? .94 : .52, 2.95)
}
function addFlyingSaucer(group: THREE.Group, point: Point, rotation: number, color = 0x89cfff) {
  const body = new THREE.Mesh(
    cachedTransientGeometry('p1-glaive-saucer-body-large', () => new THREE.CylinderGeometry(11.4, 11.4, 1.35, 28)),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .94, depthWrite: true }),
  )
  body.position.set(point.x, 8.2, point.y)
  body.renderOrder = 12
  group.add(body)
  const crown = new THREE.Mesh(
    cachedTransientGeometry('p1-glaive-saucer-crown-large', () => new THREE.CylinderGeometry(4.8, 6.75, 2.2, 24)),
    new THREE.MeshBasicMaterial({ color: 0xd8f5ff, transparent: true, opacity: .9, depthWrite: true }),
  )
  crown.position.set(point.x, 9.55, point.y)
  crown.renderOrder = 13
  group.add(crown)
  const rim = new THREE.Mesh(
    cachedTransientGeometry('p1-glaive-saucer-rim-large', () => new THREE.TorusGeometry(11.3, .62, 8, 32)),
    new THREE.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: .96, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  rim.rotation.x = Math.PI / 2
  rim.position.set(point.x, 8.2, point.y)
  rim.renderOrder = 14
  group.add(rim)
  for (let markerIndex = 0; markerIndex < 3; markerIndex += 1) {
    const angle = rotation + markerIndex * Math.PI * 2 / 3
    const marker = new THREE.Mesh(
      cachedTransientGeometry('p1-glaive-saucer-spin-marker', () => new THREE.BoxGeometry(4.8, .35, 1.2)),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, depthWrite: false }),
    )
    marker.rotation.y = -angle
    marker.position.set(point.x + Math.cos(angle) * 7.1, 9.05, point.y + Math.sin(angle) * 7.1)
    marker.renderOrder = 15
    group.add(marker)
  }
}
function addInterruptCastOrbs(
  group: THREE.Group,
  boss: Point,
  time: number,
  progress: number,
  conesVisible: boolean,
  dropProgress = 0,
  dropTargets: readonly Point[] = [],
) {
  for (let index = 0; index < 3; index += 1) {
    const angle = time * 2.4 + index * Math.PI * 2 / 3
    const orbitPoint = { x: boss.x + Math.cos(angle) * 17, y: boss.y + Math.sin(angle) * 17 }
    const target = dropTargets[index] ?? orbitPoint
    const easedDrop = dropProgress * dropProgress * (3 - 2 * dropProgress)
    const point = {
      x: orbitPoint.x + (target.x - orbitPoint.x) * easedDrop,
      y: orbitPoint.y + (target.y - orbitPoint.y) * easedDrop,
    }
    const orb = new THREE.Mesh(
      cachedTransientGeometry('p1-interrupt-cast-orb', () => new THREE.SphereGeometry(2.5, 14, 10)),
      new THREE.MeshBasicMaterial({ color: 0xff4c76, transparent: true, opacity: .68 + progress * .3, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    orb.position.set(point.x, (11 + Math.sin(time * 7 + index) * 1.4) * (1 - easedDrop) + 3.8 * easedDrop, point.y)
    orb.renderOrder = 16
    group.add(orb)
    if (conesVisible) addFrontalCone(group, point, angle, 58, 0xff315f, .055 + progress * .15)
  }
}
function makeMarkerTexture(symbol: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')!
  context.fillStyle = 'rgba(5,6,16,.88)'
  context.beginPath()
  context.arc(64, 64, 55, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = color
  context.lineWidth = 8
  context.stroke()
  context.fillStyle = color
  context.font = 'bold 72px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(symbol, 64, 67)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
function addBeamMarker(group: THREE.Group, origin: Point, angle: number, texture: THREE.Texture) {
  const marker = new THREE.Mesh(cachedTransientGeometry('beam-marker', () => new THREE.PlaneGeometry(20, 20)), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
  marker.rotation.x = -Math.PI / 2
  marker.position.set(origin.x + Math.cos(angle) * 145, 4.2, origin.y + Math.sin(angle) * 145)
  group.add(marker)
}
function addSplinterWedge(group: THREE.Group, origin: Point, angle: number, length: number, color: number, opacity: number, widthScale = 1) {
  const addLayer = (startWidth: number, endWidth: number, layerColor: number, layerOpacity: number, height: number) => {
    const scaledStartWidth = startWidth * widthScale
    const scaledEndWidth = endWidth * widthScale
    const shape = new THREE.Shape()
    shape.moveTo(0, -scaledStartWidth / 2)
    shape.lineTo(length, -scaledEndWidth / 2)
    shape.lineTo(length, scaledEndWidth / 2)
    shape.lineTo(0, scaledStartWidth / 2)
    shape.closePath()
    const geometry = cachedTransientGeometry(`splinter:${length}:${scaledStartWidth}:${scaledEndWidth}`, () => new THREE.ShapeGeometry(shape))
    const wedge = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: layerColor, transparent: true, opacity: layerOpacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
    wedge.rotation.x = -Math.PI / 2
    wedge.rotation.z = -angle
    wedge.position.set(origin.x, height, origin.y)
    group.add(wedge)
  }
  addLayer(7.2, 2.35, color, opacity * .2, 2.35)
  addLayer(4.9, 1.25, color, opacity * .72, 2.5)
  addLayer(1.35, .4, 0xd9f8ff, Math.min(1, opacity * 1.2), 2.65)
}
function makeTextTexture(text: string, color: string, plate = false) {
  const canvas = document.createElement('canvas')
  canvas.width = plate ? 256 : 128
  canvas.height = 64
  const context = canvas.getContext('2d')!
  if (plate) {
    context.fillStyle = 'rgba(5,6,14,.72)'
    context.roundRect(3, 5, canvas.width - 6, canvas.height - 10, 12)
    context.fill()
  } else {
    context.fillStyle = color
    context.roundRect(6, 5, 116, 54, 12)
    context.fill()
  }
  context.fillStyle = plate ? color : '#071018'
  context.font = `700 ${plate ? 25 : 30}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, canvas.width / 2, 33)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
function classInitials(playerClass: PlayerClass) {
  return ({ mage: 'MA', warlock: 'WL', augmentation: 'AUG', priest: 'PR', 'death-knight': 'DK', 'demon-hunter': 'DH', warrior: 'WA', paladin: 'PA', druid: 'DR', evoker: 'EV', shaman: 'SH', hunter: 'HU', monk: 'MO' } as Record<PlayerClass, string>)[playerClass]
}
function makeEntity(profile: PlayerProfile, player = false) {
  const group = new THREE.Group()
  const color = CLASS_COLORS[profile.playerClass]
  const body = new THREE.Mesh(new THREE.BoxGeometry(player ? 5.67 : 4.5, player ? 10.53 : 8.1, player ? 5.67 : 4.5), new THREE.MeshBasicMaterial({ color }))
  body.name = 'role-body'
  body.userData.baseColor = color
  body.position.y = player ? 5.27 : 4.05
  group.add(body)
  if (player) {
    const facingMarker = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 2.2), new THREE.MeshBasicMaterial({ color: 0xe8fff8 }))
    facingMarker.position.set(3.45, 6.2, 0)
    group.add(facingMarker)
  }
  const badgeSize = player ? 6.48 : 5.27
  const colorCss = `#${color.toString(16).padStart(6, '0')}`
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(badgeSize, badgeSize * .56), new THREE.MeshBasicMaterial({ map: makeTextTexture(classInitials(profile.playerClass), colorCss), transparent: true, depthTest: true, side: THREE.DoubleSide }))
  badge.rotation.x = -Math.PI / 2
  badge.position.y = player ? 10.57 : 8.14
  group.add(badge)
  const nameplate = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeTextTexture(profile.name || 'Player', colorCss, true), transparent: true, depthTest: true }))
  nameplate.scale.set(player ? 10 : 8, player ? 2.5 : 2, 1)
  nameplate.position.y = player ? 13.4 : 10.5
  group.add(nameplate)
  const carriedCrystal = new THREE.Group()
  carriedCrystal.name = 'carried-crystal'
  carriedCrystal.position.set(player ? 4.4 : 3.6, player ? 7.8 : 6.1, 0)
  const carriedBox = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.1, 2.5), new THREE.MeshBasicMaterial({ color: 0xffe13d }))
  carriedBox.rotation.set(.18, Math.PI / 4, .18)
  carriedCrystal.add(carriedBox)
  const carriedGlow = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffdc48, transparent: true, opacity: .2, depthWrite: false }))
  carriedCrystal.add(carriedGlow)
  carriedCrystal.visible = profile.crystal
  group.add(carriedCrystal)
  const glow = new THREE.Mesh(new THREE.RingGeometry(player ? 6.5 : 5.5, player ? 9 : 8, 32), new THREE.MeshBasicMaterial({ color: 0xffdf55, transparent: true, opacity: .46, side: THREE.DoubleSide }))
  glow.name = 'crystal-glow'
  glow.rotation.x = -Math.PI / 2
  glow.position.y = .35
  glow.visible = false
  group.add(glow)
  group.scale.setScalar(.77)
  return group
}

function makeArenaGroundTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')!
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 512, 512)
  context.strokeStyle = 'rgba(42, 48, 78, .3)'
  context.lineWidth = 1
  for (let coordinate = 0; coordinate <= 512; coordinate += 64) {
    context.beginPath()
    context.moveTo(coordinate, 0)
    context.lineTo(coordinate, 512)
    context.moveTo(0, coordinate)
    context.lineTo(512, coordinate)
    context.stroke()
  }
  let seed = 0x51a7
  const random = () => {
    seed = seed * 1664525 + 1013904223 >>> 0
    return seed / 0x100000000
  }
  context.strokeStyle = 'rgba(24, 25, 48, .38)'
  context.lineWidth = 2
  for (let crack = 0; crack < 36; crack += 1) {
    let x = random() * 512
    let y = random() * 512
    context.beginPath()
    context.moveTo(x, y)
    const heading = random() * Math.PI * 2
    for (let segment = 0; segment < 4 + Math.floor(random() * 4); segment += 1) {
      const angle = heading + (random() - .5) * 1.2
      const length = 8 + random() * 22
      x += Math.cos(angle) * length
      y += Math.sin(angle) * length
      context.lineTo(x, y)
    }
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

function makeCrystal() {
  const crystal = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.2, 4.2), new THREE.MeshBasicMaterial({ color: 0xffe13d }))
  box.rotation.set(.12, Math.PI / 4, .12)
  crystal.add(box)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(5.5, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffdc48, transparent: true, opacity: .18, depthWrite: false }))
  crystal.add(glow)
  const groundGlow = new THREE.Mesh(new THREE.RingGeometry(3.8, 7.5, 32), new THREE.MeshBasicMaterial({ color: 0xffe55c, transparent: true, opacity: .78, depthWrite: false, side: THREE.DoubleSide }))
  groundGlow.rotation.x = -Math.PI / 2
  groundGlow.position.y = -2.25
  crystal.add(groundGlow)
  return crystal
}
interface CombatProjectileVisual {
  group: THREE.Group
  impact: THREE.Mesh
  materials: THREE.MeshBasicMaterial[]
  shapes: Record<CombatProjectileShape, THREE.Object3D>
}
const COMBAT_PROJECTILE_COLORS: Record<CombatProjectileShape, number> = {
  firebolt: 0xff5b22,
  frostbolt: 0x69caff,
  lightning: 0x9be8ff,
  arrow: 0xe4c789,
  spear: 0xbec8d8,
  shadowbolt: 0x9a63e8,
  naturebolt: 0x71d66a,
  holybolt: 0xffe887,
}
function makeCombatProjectile(): CombatProjectileVisual {
  const group = new THREE.Group()
  const materials: THREE.MeshBasicMaterial[] = []
  const material = (shape: CombatProjectileShape) => {
    const next = new THREE.MeshBasicMaterial({ color: COMBAT_PROJECTILE_COLORS[shape], transparent: true, opacity: .94, depthWrite: false })
    materials.push(next)
    return next
  }
  const magicBolt = (shape: CombatProjectileShape) => {
    const bolt = new THREE.Group()
    const core = new THREE.Mesh(new THREE.CylinderGeometry(.42, .56, 3.1, 8), material(shape))
    core.rotation.z = Math.PI / 2
    core.position.x = .55
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.5, 3.4, 8), material(shape))
    tail.rotation.z = -Math.PI / 2
    tail.position.x = -2.05
    bolt.add(core, tail)
    return bolt
  }
  const thrownWeapon = (shape: 'arrow' | 'spear', length: number) => {
    const weapon = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shape === 'arrow' ? .12 : .2, shape === 'arrow' ? .12 : .2, length, 7), material(shape))
    shaft.rotation.z = Math.PI / 2
    const tip = new THREE.Mesh(new THREE.ConeGeometry(shape === 'arrow' ? .42 : .7, shape === 'arrow' ? 1.2 : 1.8, 6), material(shape))
    tip.rotation.z = -Math.PI / 2
    tip.position.x = length / 2 + .55
    weapon.add(shaft, tip)
    return weapon
  }
  const lightningPoints = [
    new THREE.Vector3(-3.4, 0, 0),
    new THREE.Vector3(-2.1, .5, -.25),
    new THREE.Vector3(-.8, -.45, .2),
    new THREE.Vector3(.6, .55, -.2),
    new THREE.Vector3(2, -.35, .25),
    new THREE.Vector3(3.4, 0, 0),
  ]
  const lightning = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lightningPoints), 14, .18, 5, false), material('lightning'))
  const shapes: Record<CombatProjectileShape, THREE.Object3D> = {
    firebolt: magicBolt('firebolt'),
    frostbolt: magicBolt('frostbolt'),
    lightning,
    arrow: thrownWeapon('arrow', 4.4),
    spear: thrownWeapon('spear', 5.2),
    shadowbolt: magicBolt('shadowbolt'),
    naturebolt: magicBolt('naturebolt'),
    holybolt: magicBolt('holybolt'),
  }
  Object.values(shapes).forEach(shape => group.add(shape))
  group.visible = false
  const impactMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: false })
  const impact = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 7), impactMaterial)
  impact.visible = false
  materials.push(impactMaterial)
  return { group, impact, materials, shapes }
}
function updateCombatProjectile(visual: CombatProjectileVisual, origin: Point, target: Point, impactTarget: Point, targetHeight: number, age: number, playerClass: PlayerClass, scale = 1, shotOrdinal = 0) {
  const shape = combatProjectileShape(playerClass, shotOrdinal)
  const travelSeconds = combatProjectileTravelSeconds(shape)
  const projectileActive = age >= 0 && age < travelSeconds
  const impactAge = age - travelSeconds
  const impactActive = impactAge >= 0 && impactAge <= COMBAT_PROJECTILE_IMPACT_SECONDS
  visual.group.visible = projectileActive
  visual.impact.visible = impactActive
  if (!projectileActive && !impactActive) return
  Object.entries(visual.shapes).forEach(([name, mesh]) => { mesh.visible = name === shape })
  const position = combatProjectilePosition(origin, target, age, travelSeconds)
  const progress = Math.max(0, Math.min(1, age / travelSeconds))
  visual.group.position.set(position.x, combatProjectileHeight(shape, progress, targetHeight, shotOrdinal), position.y)
  visual.group.rotation.y = -Math.atan2(target.y - origin.y, target.x - origin.x)
  visual.group.scale.setScalar(scale)
  if (impactActive) {
    const pulse = Math.sin(impactAge / COMBAT_PROJECTILE_IMPACT_SECONDS * Math.PI)
    const impactMaterial = visual.impact.material as THREE.MeshBasicMaterial
    impactMaterial.color.setHex(COMBAT_PROJECTILE_COLORS[shape])
    impactMaterial.opacity = pulse * (shape === 'arrow' || shape === 'spear' ? .55 : .9)
    visual.impact.position.set(impactTarget.x, targetHeight, impactTarget.y)
    visual.impact.scale.setScalar(scale * pulse * (shape === 'lightning' ? 1.8 : shape === 'arrow' || shape === 'spear' ? .7 : 1.25))
  }
}
function disposeCombatProjectile(visual: CombatProjectileVisual) {
  Object.values(visual.shapes).forEach(shape => shape.traverse(child => {
    if (child instanceof THREE.Mesh) child.geometry.dispose()
  }))
  visual.impact.geometry.dispose()
  visual.materials.forEach(material => material.dispose())
}
export default function GameScene(props: SceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  latest.current = props

  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) } catch { return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(element.clientWidth || 760, element.clientHeight || 540)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.draggable = false
    element.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05060d)
    scene.fog = new THREE.Fog(0x05060d, 290, 620)
    const camera = new THREE.PerspectiveCamera(55, (element.clientWidth || 760) / (element.clientHeight || 540), .1, 1400)
    const groundTexture = makeArenaGroundTexture()
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width, WORLD.height), new THREE.MeshBasicMaterial({ color: 0x05060d, map: groundTexture }))
    floor.rotation.x = -Math.PI / 2
    floor.position.set(WORLD.width / 2, 0, WORLD.height / 2)
    scene.add(floor)
    const playableFloor = new THREE.Mesh(new THREE.RingGeometry(WORLD.innerRadius, WORLD.outerRadius, 128), new THREE.MeshBasicMaterial({ color: 0x272342, map: groundTexture, transparent: true, opacity: .96, side: THREE.DoubleSide }))
    playableFloor.rotation.x = -Math.PI / 2
    playableFloor.position.set(WORLD.center.x, 1, WORLD.center.y)
    scene.add(playableFloor)
    const p1Floor = new THREE.Mesh(new THREE.RingGeometry(P1_INNER_RADIUS, P1_OUTER_RADIUS, 128), new THREE.MeshBasicMaterial({ color: 0x272342, map: groundTexture, transparent: true, opacity: .96, side: THREE.DoubleSide }))
    p1Floor.rotation.x = -Math.PI / 2
    p1Floor.position.set(WORLD.center.x, 1.02, WORLD.center.y)
    p1Floor.visible = false
    scene.add(p1Floor)

    const voidMaterial = new THREE.MeshBasicMaterial({ color: 0x03040b, transparent: true, opacity: .58, side: THREE.DoubleSide })
    const innerVoid = new THREE.Mesh(new THREE.CircleGeometry(WORLD.innerRadius, 96), voidMaterial)
    innerVoid.rotation.x = -Math.PI / 2
    innerVoid.position.set(WORLD.center.x, 1.2, WORLD.center.y)
    scene.add(innerVoid)
    const p2Floor = new THREE.Mesh(new THREE.CircleGeometry(P2_RADIUS, 128), new THREE.MeshBasicMaterial({ color: 0x211e3a, map: groundTexture, transparent: true, opacity: .96, side: THREE.DoubleSide }))
    p2Floor.rotation.x = -Math.PI / 2
    p2Floor.position.set(WORLD.center.x, 1.1, WORLD.center.y)
    p2Floor.visible = false
    scene.add(p2Floor)
    const p3Floor = new THREE.Mesh(new THREE.RingGeometry(WORLD.innerRadius, P3_OUTER_RADIUS, 128), new THREE.MeshBasicMaterial({ color: 0x211d3a, map: groundTexture, transparent: true, opacity: .96, side: THREE.DoubleSide }))
    p3Floor.rotation.x = -Math.PI / 2
    p3Floor.position.set(WORLD.center.x, 1.05, WORLD.center.y)
    p3Floor.visible = false
    scene.add(p3Floor)
    const arenaRings: THREE.Mesh[] = []
    for (const radius of [WORLD.innerRadius, WORLD.outerRadius]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 1.4, 8, 128), new THREE.MeshBasicMaterial({ color: 0xb7b0e5, transparent: true, opacity: .55 }))
      ring.rotation.x = Math.PI / 2
      ring.position.set(WORLD.center.x, 1.8, WORLD.center.y)
      scene.add(ring)
      arenaRings.push(ring)
    }

    const boss = new THREE.Mesh(new THREE.SphereGeometry(WORLD.innerRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x38143f, transparent: true, opacity: .58, depthWrite: false, side: THREE.DoubleSide }))
    boss.position.set(WORLD.center.x, 0, WORLD.center.y)
    scene.add(boss)
    const p2Boss = new THREE.Mesh(new THREE.SphereGeometry(10.5, 32, 20), new THREE.MeshBasicMaterial({ color: 0x9b4d9b, transparent: false, opacity: 1, depthWrite: true, depthTest: true }))
    p2Boss.position.set(WORLD.center.x, 10.5, WORLD.center.y)
    p2Boss.renderOrder = 7
    p2Boss.visible = false
    scene.add(p2Boss)
    const p1OuterRing = new THREE.Mesh(new THREE.TorusGeometry(P1_OUTER_RADIUS, 1.6, 8, 128), new THREE.MeshBasicMaterial({ color: 0xb7b0e5, transparent: true, opacity: .62 }))
    p1OuterRing.rotation.x = Math.PI / 2
    p1OuterRing.position.set(WORLD.center.x, 1.8, WORLD.center.y)
    p1OuterRing.visible = false
    scene.add(p1OuterRing)
    const p3Bosses = [-1, 1].map((side, index) => {
      const object = new THREE.Mesh(new THREE.SphereGeometry(10.5, 32, 20), new THREE.MeshBasicMaterial({ color: index ? 0x744d9b : 0xb14d94, transparent: false, opacity: 1, depthWrite: true }))
      const position = p3BossPosition(side as -1 | 1, WORLD.center, 1)
      object.position.set(position.x, 10.5, position.y)
      object.visible = false
      scene.add(object)
      return object
    })
    const p3OuterRing = new THREE.Mesh(new THREE.TorusGeometry(P3_OUTER_RADIUS, 1.5, 8, 128), new THREE.MeshBasicMaterial({ color: 0xb7b0e5, transparent: true, opacity: .62 }))
    p3OuterRing.rotation.x = Math.PI / 2
    p3OuterRing.position.set(WORLD.center.x, 1.8, WORLD.center.y)
    p3OuterRing.visible = false
    scene.add(p3OuterRing)
    const dividerBox = new THREE.BoxGeometry(2.2, 15, P3_OUTER_RADIUS * 2)
    const divider = new THREE.LineSegments(new THREE.EdgesGeometry(dividerBox), new THREE.LineBasicMaterial({ color: 0xf0ddff, transparent: true, opacity: .42, depthWrite: false }))
    dividerBox.dispose()
    divider.position.set(WORLD.center.x, 7.5, WORLD.center.y)
    divider.visible = false
    scene.add(divider)

    const beamMarkerTextures = [
      makeMarkerTexture('✕', '#ff5757'),
      makeMarkerTexture('☠', '#f1f1f1'),
      makeMarkerTexture('★', '#ffe064'),
      makeMarkerTexture('●', '#ff923d'),
    ]
    const runeTextures = {
      T: makeTextTexture('T', '#70d9ff', true),
      X: makeTextTexture('X', '#70d9ff', true),
      O: makeTextTexture('O', '#70d9ff', true),
    }
    const p1RuneTextures: Record<P1Rune, THREE.Texture> = {
      T: makeTextTexture('T', '#95e8ff', true),
      X: makeTextTexture('X', '#95e8ff', true),
      O: makeTextTexture('O', '#95e8ff', true),
      V: makeTextTexture('V', '#95e8ff', true),
      '+': makeTextTexture('+', '#95e8ff', true),
    }
    const markerData = [
      [480, 217, 0xef5350], [533, 270, 0xe8e8e8], [427, 270, 0xf4d35e], [480, 323, 0xff8a30],
    ] as const
    const floatingMarkers: Array<{ icon: THREE.Sprite; glow: THREE.Mesh }> = []
    markerData.forEach(([x, z, color], index) => {
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 28, 12, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide }))
      marker.position.set(x, 14, z)
      scene.add(marker)
      const glow = new THREE.Mesh(new THREE.SphereGeometry(4.2, 20, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .24, depthWrite: false }))
      glow.position.set(x, 31, z)
      scene.add(glow)
      const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: beamMarkerTextures[index], transparent: true, opacity: .74, depthWrite: false }))
      icon.scale.set(5, 5, 1)
      icon.position.set(x, 31, z)
      scene.add(icon)
      floatingMarkers.push({ icon, glow })
    })

    const initial = latest.current
    const player = makeEntity(initial.profiles[initial.assignment], true)
    scene.add(player)
    const npcProfileIndices = initial.profiles.map((_, index) => index).filter(index => index !== initial.assignment)
    const npcs = Array.from({ length: 19 }, (_, i) => {
      const entity = makeEntity(initial.profiles[npcProfileIndices[i]])
      scene.add(entity)
      return entity
    })
    const playerProjectile = makeCombatProjectile()
    const npcProjectiles = Array.from({ length: MAX_VISIBLE_NPC_PROJECTILES }, makeCombatProjectile)
    scene.add(playerProjectile.group, playerProjectile.impact)
    npcProjectiles.forEach(projectile => scene.add(projectile.group, projectile.impact))
    const crystal = makeCrystal()
    crystal.visible = false
    scene.add(crystal)
    const npcCrystalSprites = Array.from({ length: 19 }, () => { const object = makeCrystal(); object.scale.setScalar(.9); object.visible = false; scene.add(object); return object })
    const helper = new THREE.Mesh(new THREE.RingGeometry(22, 25, 40), new THREE.MeshBasicMaterial({ color: 0x73e0c1, transparent: true, opacity: .8, side: THREE.DoubleSide }))
    helper.rotation.x = -Math.PI / 2
    scene.add(helper)

    const hazards = new THREE.Group()
    scene.add(hazards)
    let animation = 0
    const renderedNpcPositions: Array<Point | null> = Array.from({ length: 19 }, () => null)
    let previousSimulationTime = initial.time
    let p3OpeningReached = false
    let p3PlayerSoakEngagedRound = 0
    let previousRenderTime = performance.now()
    let orbitAngle = 0
    let orbitSoakStart = 0
    let orbitSoakTarget = 0
    let previousEvent: SceneProps['event'] = initial.event
    const destroyedP4BoxIds = new Set<number>()
    const resolvedP4VisualSplinters = new Set<number>()
    const p4VisualSplinterSnapshots = new Map<number, { origin: Point; npcPositions: Point[]; player: Point }>()
    const resize = () => {
      const width = element.clientWidth || 760
      const height = element.clientHeight || 540
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    let leftHeld = false
    let rightHeld = false
    let previousX = 0
    let previousY = 0
    const savedCamera = loadCameraSettings()
    let yawOffset = savedCamera.yaw
    let pitch = savedCamera.pitch
    let zoomYards = savedCamera.zoom
    const invertCameraX = localStorage.getItem('lura-invert-camera-x') === 'true'
    const invertCameraY = localStorage.getItem('lura-invert-camera-y') !== 'false'
    let turnLeftKey = 'KeyQ'
    let turnRightKey = 'KeyE'
    try {
      const savedBindings = JSON.parse(localStorage.getItem('lura-keybindings') || 'null')
      if (typeof savedBindings?.turnLeft === 'string') turnLeftKey = savedBindings.turnLeft
      if (typeof savedBindings?.turnRight === 'string') turnRightKey = savedBindings.turnRight
    } catch { /* use defaults */ }
    const storedRotationSpeed = Number(localStorage.getItem('lura-player-rotation-speed'))
    const rotationSpeed = THREE.MathUtils.degToRad(Number.isFinite(storedRotationSpeed) ? THREE.MathUtils.clamp(storedRotationSpeed, 45, 270) : 150)
    const turnKeys = new Set<string>()
    let cameraBaseAngle: number | null = null
    let facingAngle: number | null = null
    let currentCameraForwardAngle = -Math.PI / 2
    const horizontalViewAngle = () => cameraBaseAngle === null ? currentCameraForwardAngle : cameraBaseAngle + yawOffset + Math.PI
    const applyFacing = (angle: number) => {
      facingAngle = angle
      player.rotation.y = -angle
      latest.current.onCameraDirection({ x: Math.cos(angle), y: Math.sin(angle) })
    }
    if (initial.event === 'countdown' || initial.event === 'positioning') applyFacing(angleToward(initial.player, WORLD.center))
    initial.onZoomChange(Math.round(zoomYards * 10) / 10)
    const saveCamera = () => localStorage.setItem('lura-camera-settings', JSON.stringify({ yaw: yawOffset, pitch, zoom: zoomYards }))
    const updateZoom = (next: number) => { zoomYards = THREE.MathUtils.clamp(next, 8, 24); initial.onZoomChange(Math.round(zoomYards * 10) / 10); saveCamera() }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.button !== 2) return
      event.preventDefault()
      if (event.button === 0) leftHeld = true
      if (event.button === 2) {
        rightHeld = true
        applyFacing(horizontalViewAngle())
      }
      previousX = event.clientX
      previousY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!leftHeld && !rightHeld) return
      event.preventDefault()
      const dx = event.clientX - previousX
      const dy = event.clientY - previousY
      if (leftHeld || rightHeld) {
        yawOffset += dx * .006 * (invertCameraX ? -1 : 1)
        pitch = THREE.MathUtils.clamp(pitch - dy * .004 * (invertCameraY ? -1 : 1), THREE.MathUtils.degToRad(2), THREE.MathUtils.degToRad(80))
      }
      if (rightHeld) {
        applyFacing(horizontalViewAngle())
      }
      previousX = event.clientX
      previousY = event.clientY
      saveCamera()
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.type === 'pointercancel') { leftHeld = false; rightHeld = false }
      if (event.button === 0) leftHeld = false
      if (event.button === 2) rightHeld = false
      if (!leftHeld && !rightHeld && renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
    }
    const onWheel = (event: WheelEvent) => { event.preventDefault(); updateZoom(zoomYards + event.deltaY * .008) }
    const onContextMenu = (event: MouseEvent) => event.preventDefault()
    const preventNativeDrag = (event: Event) => event.preventDefault()
    const onTurnKeyDown = (event: KeyboardEvent) => {
      if (event.code !== turnLeftKey && event.code !== turnRightKey) return
      event.preventDefault()
      turnKeys.add(event.code)
    }
    const onTurnKeyUp = (event: KeyboardEvent) => turnKeys.delete(event.code)
    const clearTurnKeys = () => turnKeys.clear()
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('contextmenu', onContextMenu)
    renderer.domElement.addEventListener('dragstart', preventNativeDrag)
    renderer.domElement.addEventListener('selectstart', preventNativeDrag)
    window.addEventListener('keydown', onTurnKeyDown)
    window.addEventListener('keyup', onTurnKeyUp)
    window.addEventListener('blur', clearTurnKeys)

    const render = () => {
      const state = latest.current
      const p4VisualCycle = state.p4Cycle
      renderer.domElement.dataset.p4Cycle = String(p4VisualCycle)
      const p3SideOf = (profileIndex: number) => p3SideForPosition(state.positions[profileIndex], WORLD.center)
      const p3LandingIndexOf = (profileIndex: number) => p3LandingPlanIndex(profileIndex, state.positions, WORLD.center)
      const playerP3Side = p3SideOf(state.assignment)
      if (state.time < previousSimulationTime) {
        renderedNpcPositions.fill(null)
        p3OpeningReached = false
        p3PlayerSoakEngagedRound = 0
      }
      const simulationDelta = state.paused ? 0 : Math.min(.15, Math.max(0, state.time - previousSimulationTime))
      previousSimulationTime = state.time
      const renderTime = performance.now()
      const renderDelta = state.paused ? 0 : Math.min((renderTime - previousRenderTime) / 1000, .05)
      previousRenderTime = renderTime
      if (state.event !== previousEvent) {
        if (state.event === 'p4-countdown' || state.event === 'p4-transition') {
          destroyedP4BoxIds.clear()
          resolvedP4VisualSplinters.clear()
          p4VisualSplinterSnapshots.clear()
        }
        if (state.event === 'p2-orbs') {
          orbitSoakStart = orbitAngle
          const baseTarget = -(state.p2Cycle - 1) * Math.PI / 6
          orbitSoakTarget = baseTarget + Math.ceil((orbitAngle - baseTarget) / (Math.PI / 2)) * Math.PI / 2
        }
        if (state.event === 'p3-landing') {
          const landing = p3LandingPosition(p3LandingIndexOf(state.assignment), WORLD.center)
          const assignedBoss = p3BossPosition(playerP3Side, WORLD.center, 1)
          const desiredFacing = angleToward(landing, assignedBoss)
          cameraBaseAngle = desiredFacing - yawOffset - Math.PI
          applyFacing(desiredFacing)
        }
        previousEvent = state.event
      }
      if (state.event === 'p2-orbs') {
        const progress = THREE.MathUtils.clamp(state.eventTime / P2_BEAM_SECONDS, 0, 1)
        const eased = progress * progress * (3 - 2 * progress)
        orbitAngle = THREE.MathUtils.lerp(orbitSoakStart, orbitSoakTarget, eased)
      } else if (state.event.startsWith('p2-')) orbitAngle += renderDelta * P2_ORBIT_SPEED
      if (state.event.startsWith('p2-')) state.onP2OrbitAngle(orbitAngle)
      const jumpProgress = state.event === 'p2-jump' ? Math.min(1, state.eventTime / 1.4) : 0
      const heights = jumpHeights(jumpProgress, state.personalJumpProgress)
      const phaseOne = state.event.startsWith('p1-') && state.event !== 'p1-recover'
      const phaseTwo = state.event.startsWith('p2-')
      const phaseThree = state.event.startsWith('p3-')
      const phaseFour = state.event.startsWith('p4-')
      const turnLocked = state.personalJumpProgress > 0 || state.event === 'p1-countdown' || state.event === 'countdown' || state.event === 'p2-countdown' || state.event === 'p2-jump' || state.event === 'p3-countdown' || state.event === 'p3-flight' || state.event === 'p4-countdown' || state.event === 'p4-transition'
      if (!turnLocked) {
        const turnDirection = (turnKeys.has(turnRightKey) ? 1 : 0) - (turnKeys.has(turnLeftKey) ? 1 : 0)
        if (turnDirection) applyFacing((facingAngle ?? currentCameraForwardAngle) + turnDirection * rotationSpeed * renderDelta)
      }
      if ((state.event === 'p3-light-pools' || state.event === 'p3-pools-overlap') && p3PlayerSoakEngagedRound !== state.p3Round) {
        if (p3PoolCenters(playerP3Side, WORLD.center, state.p3Round).some(pool => distance(state.player, pool) <= P3_POOL_RADIUS)) p3PlayerSoakEngagedRound = state.p3Round
      }
      const p4JumpHeight = state.event === 'p4-transition' ? Math.sin(Math.min(1, state.eventTime / P4_KNOCKUP_SECONDS) * Math.PI) * 30 : 0
      const p3FlightHeight = state.event === 'p3-flight' ? Math.sin(Math.min(1, state.eventTime / P3_FLIGHT_SECONDS) * Math.PI) * 46 : 0
      player.position.set(state.player.x, heights.player + p3FlightHeight + p4JumpHeight, state.player.y)
      player.rotation.z = state.wipeReason ? Math.PI / 2 : 0
      boss.visible = !phaseTwo && !phaseFour
      ;(boss.material as THREE.MeshBasicMaterial).opacity = phaseThree ? .42 : .58
      ;(boss.material as THREE.MeshBasicMaterial).depthWrite = phaseThree
      const centralBossVisible = phaseOne || phaseTwo || phaseFour || !phaseThree
      p2Boss.visible = centralBossVisible
      const enlargedCentralBoss = phaseFour || !phaseOne && !phaseTwo && !phaseThree
      p2Boss.scale.setScalar(enlargedCentralBoss ? 1.52 : 1)
      const p1Boss = p1BossEncounterPosition(state.p1BossOpening, state.positions.slice(0, 2), state.p1Sequence, state.event, state.eventTime, WORLD.center)
      const p1OutwardAngle = Math.atan2(p1Boss.y - WORLD.center.y, p1Boss.x - WORLD.center.x)
      p2Boss.position.set(phaseOne ? p1Boss.x : WORLD.center.x, enlargedCentralBoss ? 16 : 10.5, phaseOne ? p1Boss.y : WORLD.center.y)
      const p1WarpOpacity = state.event === 'p1-transition'
        ? THREE.MathUtils.smoothstep(state.eventTime, .18, .5)
        : 1
      ;(p2Boss.material as THREE.MeshBasicMaterial).opacity = p1WarpOpacity
      p3Bosses.forEach((object, index) => {
        object.visible = phaseThree
        const side: -1 | 1 = index === 0 ? -1 : 1
        const origin = p3BossPosition(side, WORLD.center, state.p3Round)
        const destination = p3BossPosition(side, WORLD.center, Math.min(2, state.p3Round + 1))
        const moving = state.event === 'p3-sector-move' && state.p3Round < 2 ? THREE.MathUtils.smoothstep(state.eventTime, 0, 5) : 0
        const position = pointAlongArenaArc(origin, destination, WORLD.center, moving)
        object.position.set(position.x, 10.5, position.y)
      })
      innerVoid.visible = !phaseTwo && !phaseFour
      const p1Collapsing = phaseOne && state.event === 'p1-transition'
      const collapseProgress = p1Collapsing
        ? THREE.MathUtils.smoothstep(state.eventTime, 0, P1_INTERMISSION_POSITION_SECONDS)
        : 0
      const p1ArenaScale = THREE.MathUtils.lerp(1, WORLD.outerRadius / P1_OUTER_RADIUS, collapseProgress)
      playableFloor.visible = !phaseTwo && !phaseThree && !phaseFour && (!phaseOne || p1Collapsing)
      arenaRings[1].visible = !phaseTwo && !phaseThree && !phaseFour && (!phaseOne || p1Collapsing)
      p1Floor.visible = phaseOne
      p1Floor.scale.setScalar(p1ArenaScale)
      p1OuterRing.visible = phaseOne
      p1OuterRing.scale.setScalar(p1ArenaScale)
      p2Floor.visible = phaseTwo
      p3Floor.visible = phaseThree || phaseFour
      p3OuterRing.visible = phaseThree || phaseFour
      divider.visible = phaseThree
      floatingMarkers.forEach(({ icon, glow }, index) => {
        const height = 31 + Math.sin(state.time * 3.6 + index * 1.4) * 2.5
        icon.position.y = height
        glow.position.y = height
        glow.scale.setScalar(1 + Math.sin(state.time * 3.6 + index * 1.4) * .08)
      })
      const playerBody = player.getObjectByName('role-body') as THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
      playerBody.material.color.setHex(playerBody.userData.baseColor)
      const playerCarriedCrystal = player.getObjectByName('carried-crystal')
      const playerP1CrystalCollected = state.p1CrystalAssignments.slice(
        0,
        state.event === 'p1-countdown' || state.event === 'p1-interrupts' || state.event === 'p1-crystals'
          ? (state.p1Sequence - 1) * 3
          : state.p1Sequence * 3,
      ).includes(state.assignment)
        || state.event === 'p1-crystals'
          && state.p1CrystalCollected
          && state.p1CrystalAssignments.slice((state.p1Sequence - 1) * 3, state.p1Sequence * 3).includes(state.assignment)
      const playerHasCarriedCrystal = playerCarriesCrystal({
        phaseOne,
        p1AssignedAndCollected: playerP1CrystalCollected,
        p1WrongCrystalHeld: state.p1WrongCrystalHeld,
        assigned: state.playerIsCrystal,
        spent: state.playerCrystalSpent,
        dropped: Boolean(state.crystal),
        phaseFour,
      })
      if (playerCarriedCrystal) playerCarriedCrystal.visible = playerHasCarriedCrystal
      const playerCrystalGlow = player.getObjectByName('crystal-glow')
      if (playerCrystalGlow) playerCrystalGlow.visible = playerHasCarriedCrystal
      const partnerNpcOrdinal = npcProfileIndices.findIndex(profileIndex => p3SideOf(profileIndex) === playerP3Side)
      const markedNpcOrdinals = npcProfileIndices.map((profileIndex, ordinal) => ({ profileIndex, ordinal }))
        .filter(candidate => p3SideOf(candidate.profileIndex) === playerP3Side && candidate.ordinal !== partnerNpcOrdinal)
        .slice(0, 4)
        .map(candidate => candidate.ordinal)
      const assignedP3Crystals = state.profiles
        .map((profile, profileIndex) => profile.crystal ? profileIndex : -1)
        .filter(profileIndex => profileIndex >= 0)
      const activeP3Crystals = phaseThree
        ? p3ActiveCrystalAssignments(assignedP3Crystals, state.assignment, state.p3ArchangelDuty, state.playerCrystalSpent, state.p3Round, state.event, state.p4PatternSeed, state.positions, WORLD.center)
        : assignedP3Crystals
      const p3CrystalSlot = (profileIndex: number) => assignedP3Crystals
        .filter(candidate => p3SideOf(candidate) === p3SideOf(profileIndex))
        .indexOf(profileIndex)
      const plannedP3Pools = [[0, 0, 0], [0, 0, 0]]
      const playerLightActive = phaseThree
        ? activeP3Crystals.includes(state.assignment)
        : hasActiveP3CrystalLight(state.playerIsCrystal, state.playerCrystalSpent)
      const plannedP3Targets: Array<{ point: Point; crystal: boolean }> = [{ point: state.player, crystal: playerLightActive }]
      const playerP1Rune = (['T', 'X', 'O', 'V', '+'] as P1Rune[])[state.assignment % 5]
      const p1MarkedProfiles = new Map<P1Rune, number>([[playerP1Rune, state.assignment]])
      ;(['T', 'X', 'O', 'V', '+'] as P1Rune[]).forEach(rune => {
        if (p1MarkedProfiles.has(rune)) return
        const profileIndex = state.profiles.findIndex((_, index) => index !== state.assignment && index % 5 === (['T', 'X', 'O', 'V', '+'] as P1Rune[]).indexOf(rune))
        if (profileIndex >= 0) p1MarkedProfiles.set(rune, profileIndex)
      })
      const p3CrystalPoolSupport = new Map<number, { pool: Point; target: Point }>()
      if (state.event === 'p3-light-pools') {
        for (const side of [-1, 1] as const) {
          const sidePoolHealth = state.p3PoolHealth.slice(side < 0 ? 0 : 3, side < 0 ? 3 : 6)
          const activePools = p3PoolCenters(side, WORLD.center, state.p3Round).filter((_, poolIndex) => sidePoolHealth[poolIndex] > .5)
          if (!activePools.length) continue
          const npcCarriers = activeP3Crystals.filter(profileIndex => profileIndex !== state.assignment && p3SideOf(profileIndex) === side)
          const playerLights = playerLightActive && playerP3Side === side ? [state.player] : []
          const supportTargets = p3CrystalPoolCoverageTargets(activePools, npcCarriers.map(profileIndex => state.positions[profileIndex]), playerLights)
          npcCarriers.forEach((profileIndex, carrierIndex) => {
            const target = supportTargets[carrierIndex]
            const pool = activePools.reduce((nearest, candidate) => distance(target, candidate) < distance(target, nearest) ? candidate : nearest)
            p3CrystalPoolSupport.set(profileIndex, { pool, target })
          })
        }
      }
      const npcPositions = npcs.map((sprite, index) => {
        const baseIndex = npcProfileIndices[index]
        const npcP3Side = p3SideOf(baseIndex)
        const npcP3CrystalActive = activeP3Crystals.includes(baseIndex)
        const crystalSlot = p3CrystalSlot(baseIndex)
        const localP3Member = isP3RaidMemberVisible(state.positions[state.assignment], state.positions[baseIndex], WORLD.center, phaseThree)
        sprite.visible = true
        setEntityDimmed(sprite, DIM_OPPOSITE_P3_SIDE && phaseThree && !localP3Member)
        const soakTarget = state.p2SoakPositions[baseIndex]
        const spreadTarget = state.p2SpreadPositions[baseIndex]
        const intermissionPosition = npcPosition(index, state.time, state.intermissionPositions, state.assignment, state.event, state.eventTime, state.beamAngles, state.raidStart, state.movementSpeed, state.movementBonus)
        const spreadResolutionPosition = walkTowards(WORLD.center, spreadTarget, P2_SPREAD_SECONDS, state.movementSpeed)
        const recoveredSoakPosition = state.p2Cycle === 1 ? soakTarget : walkTowards(spreadResolutionPosition, soakTarget, 8, state.movementSpeed)
        const p2WaitTarget = p2NpcShouldReturnToSoak(state.p2OrbReturnAge)
          ? soakTarget
          : p2NpcRoamingPosition(soakTarget, index, state.time, p2ReturningOrbPositions(state.p2OrbReturnAge, state.p2Cycle, orbitAngle, WORLD.center), WORLD.center, P2_RADIUS - 2)
        let p1Target = state.positions[baseIndex]
        const currentP1CrystalAssignments = state.p1CrystalAssignments.slice((state.p1Sequence - 1) * 3, state.p1Sequence * 3)
        const p1CrystalSlot = currentP1CrystalAssignments.indexOf(baseIndex)
        let p1CanDodgeGlaives = false
        const p1NpcRoams = ['p1-pull', 'p1-interrupts', 'p1-crystals', 'p1-glaives', 'p1-soaks'].includes(state.event)
        if (p1NpcRoams) {
          p1Target = p1NpcRoamingPosition(state.positions[baseIndex], p1Boss, index, state.time, state.p1Seed + state.p1Sequence * 1009)
          p1CanDodgeGlaives = p1NpcMayDodgeGlaive('idle')
        }
        if (state.event === 'p1-crystals' && currentP1CrystalAssignments.includes(baseIndex)) {
          const pickupsReleased = p1NpcCrystalPickupReleased(state.p1CrystalAssignments, state.assignment, state.p1Sequence, state.p1CrystalCollected)
          const reassignedSlot = p1NpcCrystalTargetSlot(
            currentP1CrystalAssignments,
            state.assignment,
            baseIndex,
            state.p1CrystalCollected ? state.p1StolenCrystalSlot : null,
          ) ?? p1CrystalSlot
          p1Target = pickupsReleased
            ? p1CrystalSpawnPosition(p1Boss, WORLD.center, reassignedSlot)
            : state.positions[baseIndex]
          p1CanDodgeGlaives = false
        } else if (state.event === 'p1-memory-position' || state.event === 'p1-memory-sweep') {
          const markedRune = [...p1MarkedProfiles.entries()].find(([, profileIndex]) => profileIndex === baseIndex)?.[0]
          if (markedRune) {
            const angle = p1MemorySlotAngle(state.p1MemoryOrder, markedRune, p1OutwardAngle)
            p1Target = {
              x: p1Boss.x + Math.cos(angle) * P1_MEMORY_RADIUS,
              y: p1Boss.y + Math.sin(angle) * P1_MEMORY_RADIUS,
            }
          } else {
            p1Target = p1NpcRoamingPosition(state.positions[baseIndex], p1Boss, index, state.time, state.p1Seed + state.p1Sequence * 1009)
            p1CanDodgeGlaives = state.event === 'p1-memory-position' && p1NpcMayDodgeGlaive('idle')
          }
          p1Target = p1NpcMemoryPosition(p1Target, index, state.eventTime, state.event === 'p1-memory-position')
        } else if (state.event === 'p1-beam-position') {
          p1Target = p1NpcBeamWaitingPosition(index, state.time, p1Boss, WORLD.center)
          p1CanDodgeGlaives = p1NpcMayDodgeGlaive('idle')
        } else if (state.event === 'p1-beam-telegraph' || state.event === 'p1-beams') {
          const openingBoss = p1BossEncounterPosition(state.p1BossOpening, state.positions.slice(0, 2), state.p1Sequence, 'p1-beam-telegraph', 0, WORLD.center)
          const beams = p1RotatingBeams(state.p1Seed, state.p1Sequence, 0, Math.PI / 16, Math.atan2(openingBoss.y - WORLD.center.y, openingBoss.x - WORLD.center.x))
          const elapsed = p1ContinuousBeamTime(state.event, state.eventTime)
          p1Target = p1NpcBeamPosition(index, elapsed, p1Boss, p1BeamAngles(beams, elapsed)[0], WORLD.center, state.player)
          p1CanDodgeGlaives = p1NpcMayDodgeGlaive('beam-follow')
        } else if (state.event === 'p1-transition') {
          p1Target = state.intermissionPositions[baseIndex]
        }
        const stolenAssignments = state.p1CrystalAssignments.slice((state.p1Sequence - 1) * 3, state.p1Sequence * 3)
        if (state.p1StolenCrystalSlot !== null && state.crystal
          && stolenAssignments[state.p1StolenCrystalSlot] === baseIndex) {
          p1Target = state.crystal
          p1CanDodgeGlaives = false
        }
        if (p1CanDodgeGlaives) {
          p1Target = p1NpcGlaiveDodgePosition(
            { x: sprite.position.x, y: sprite.position.z },
            p1Target,
            state.p1GlaiveSets,
            state.time,
            index,
          )
        }
        if (phaseOne) p1Target = p1ClampNpcToArena(p1Target, WORLD.center)
        let p3Target = p3NpcTarget(baseIndex, npcP3CrystalActive, state.p3Round, state.event, state.eventTime, state.p4PatternSeed, crystalSlot, npcP3Side, p3LandingIndexOf(baseIndex))
        if (phaseThree && ['p3-approach', 'p3-light-pools', 'p3-pools-overlap', 'p3-rune-preview', 'p3-lattice-memory', 'p3-lattice-second', 'p3-big-boom'].includes(state.event)) {
          p3Target = state.positions[baseIndex]
        }
        let p4SplinterReturnBoost = false
        let p3RunePartnerApproach = false
        let p3RunePairApproach = false
        let p3PoolTarget: Point | null = null
        if (phaseFour) {
          p3Target = state.event === 'p4-cycle'
            ? p4GroupPosition(p4VisualCycle, state.eventTime, WORLD.center)
            : p4StackPosition(1, WORLD.center)
          if (state.event === 'p4-cycle' && index === 0) {
            const front = p4FrontSoakerPosition(p3Target, WORLD.center)
            const radialAngle = Math.atan2(p3Target.y - WORLD.center.y, p3Target.x - WORLD.center.x)
            const interceptOffset = Math.sin(state.time * 1.8) * 3
            const desired = { x: front.x - Math.sin(radialAngle) * interceptOffset, y: front.y + Math.cos(radialAngle) * interceptOffset }
            const hazards = [0, 1, 2].flatMap(ordinal => {
              const age = p4SplinterAge(p4VisualCycle, state.eventTime, ordinal)
              if (age < 0 || age > P4_SPLINTER_DETONATION_SECONDS) return []
              const rotation = p4SplinterRotation(p4VisualCycle, ordinal, state.p4PatternSeed)
              const origin = p4PlayerSplinterDuty(state.assignment, p4VisualCycle, state.p4PatternSeed) === ordinal
                ? state.player
                : p4NpcSplinterPosition(p3Target, WORLD.center, ordinal, age, rotation)
              return [{ origin, rotation }]
            })
            p3Target = p4TankAvoidSplinters(
              { x: sprite.position.x, y: sprite.position.z },
              desired,
              p3Target,
              hazards,
            )
          }
          const splinterOrdinal = [1, 4, 7].indexOf(index)
          const splinterAge = p4SplinterAge(p4VisualCycle, state.eventTime, splinterOrdinal)
          p4SplinterReturnBoost = state.event === 'p4-cycle' && splinterOrdinal >= 0 && splinterAge > P4_SPLINTER_DETONATION_SECONDS && splinterAge <= P4_SPLINTER_DETONATION_SECONDS + 2
          if (state.event === 'p4-cycle' && splinterOrdinal >= 0 && p4PlayerSplinterDuty(state.assignment, p4VisualCycle, state.p4PatternSeed) !== splinterOrdinal && splinterAge >= 0 && splinterAge <= P4_SPLINTER_DETONATION_SECONDS) {
            const rotation = p4SplinterRotation(p4VisualCycle, splinterOrdinal, state.p4PatternSeed)
            p3Target = p4NpcSplinterPosition(p3Target, WORLD.center, splinterOrdinal, splinterAge, rotation)
          }
        }
        if (state.event === 'p3-approach') p3Target = state.positions[baseIndex]
        if (state.event === 'p3-landing') {
          const playerGroup = p3LandingGroupIndex(p3LandingIndexOf(state.assignment))
          const npcGroup = p3LandingGroupIndex(p3LandingIndexOf(baseIndex))
          const groupMembers = state.profiles.map((_, profileIndex) => profileIndex).filter(profileIndex => p3LandingGroupIndex(p3LandingIndexOf(profileIndex)) === npcGroup)
          const nonCrystalMembers = groupMembers.filter(profileIndex => !state.profiles[profileIndex].crystal)
          const crystalMember = groupMembers.find(profileIndex => state.profiles[profileIndex].crystal)
          const helperCandidates = [...nonCrystalMembers, ...groupMembers.filter(profileIndex => state.profiles[profileIndex].crystal)].filter(profileIndex => profileIndex !== state.assignment)
          const soaks = p3LandingSoakPositions(p3LandingIndexOf(baseIndex), WORLD.center, state.p4PatternSeed)
          if (npcGroup === playerGroup) {
            const playerIsCrystal = state.profiles[state.assignment].crystal
            const helper = playerIsCrystal ? helperCandidates[0] : crystalMember !== undefined && crystalMember !== state.assignment ? crystalMember : helperCandidates[0]
            p3Target = baseIndex === helper ? soaks[playerIsCrystal ? 0 : 1] : state.positions[baseIndex]
          } else {
            const farHelper = nonCrystalMembers[0]
            p3Target = baseIndex === crystalMember ? soaks[1] : baseIndex === farHelper ? soaks[0] : state.positions[baseIndex]
          }
        }
        if (state.event === 'p3-light-pools') {
          const side = npcP3Side
          const sidePlayers = state.profiles
            .map((profile, profileIndex) => ({ profile, profileIndex }))
            .filter(candidate => p3SideOf(candidate.profileIndex) === side && candidate.profileIndex !== state.assignment)
            .map(candidate => candidate.profileIndex)
          const sideOrdinal = sidePlayers.indexOf(baseIndex)
          const playerSide = side === playerP3Side
          const requiredPlayerPool = state.assignment % 3
          const sidePoolHealth = state.p3PoolHealth.slice(side < 0 ? 0 : 3, side < 0 ? 3 : 6)
          const npcSoaksActive = p3NpcSoaksActive(p3PlayerSoakEngagedRound === state.p3Round, state.p3Round, state.eventTime)
          const plannedCounts = plannedP3Pools[side < 0 ? 0 : 1]
          const crystalSupport = p3CrystalPoolSupport.get(baseIndex)
          const poolIndex = !npcP3CrystalActive && npcSoaksActive ? p3NpcPoolAssignment(sideOrdinal, playerSide, requiredPlayerPool, sidePoolHealth, plannedCounts) : null
          if (poolIndex !== null) plannedCounts[poolIndex] += 1
          const poolCenter = poolIndex === null ? null : p3PoolCenters(side, WORLD.center, state.p3Round)[poolIndex]
          p3PoolTarget = poolCenter
          const spreadAngle = Math.max(0, sideOrdinal) * 2.399963
          p3Target = crystalSupport
            ? crystalSupport.target
            : poolCenter
            ? { x: poolCenter.x + Math.cos(spreadAngle) * 6, y: poolCenter.y + Math.sin(spreadAngle) * 6 }
            : p3NpcTarget(baseIndex, npcP3CrystalActive, state.p3Round, state.event, state.eventTime, state.p4PatternSeed, crystalSlot, npcP3Side)
        }
        if (state.event === 'p3-archangel-position' || state.event === 'p3-archangel') {
          const spreadOrigin = p3NpcTarget(baseIndex, npcP3CrystalActive, state.p3Round, 'p3-big-boom', 0, state.p4PatternSeed, crystalSlot, npcP3Side)
          const travelTime = state.eventTime + (state.event === 'p3-archangel' ? 4 : 0)
          p3Target = walkTowards(spreadOrigin, p3Target, travelTime, state.movementSpeed)
        } else if (state.event === 'p3-sector-move') {
          const stackOrigin = p3ArchangelStackPosition(npcP3Side, WORLD.center, state.p3Round)
          const transitionTarget = state.p3Round >= 2 ? p4StackPosition(1, WORLD.center) : p3Target
          p3Target = walkAroundArena(stackOrigin, transitionTarget, state.eventTime, p3SectorMovementSpeed(state.movementSpeed))
        }
        const runePartnerDelay = p3NpcRuneReactionDelay(state.p4PatternSeed, state.assignment, state.p3Round)
        if (state.event === 'p3-lattice-memory' && state.difficulty !== 'hard' && index === partnerNpcOrdinal && state.eventTime >= runePartnerDelay) {
          p3Target = p3RunePartnerPosition(state.assignment, WORLD.center, state.p3Round, playerP3Side)
          p3RunePartnerApproach = true
        }
        if (state.event === 'p3-light-pools' && state.difficulty !== 'hard' && state.eventTime >= P3_MEMORY_START_SECONDS && index === partnerNpcOrdinal) {
          const playerRune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
          const activeRune = state.p3RuneOrder[state.p3RuneStep]
          if (activeRune === playerRune && !state.p3ResolvedRunes.includes(playerRune) && state.eventTime >= P3_MEMORY_PANEL_SECONDS + runePartnerDelay) {
            const bossPoint = p3BossPosition(playerP3Side, WORLD.center, state.p3Round)
            const towardBoss = { x: bossPoint.x - state.player.x, y: bossPoint.y - state.player.y }
            const towardBossLength = Math.hypot(towardBoss.x, towardBoss.y) || 1
            p3Target = { x: state.player.x + towardBoss.x / towardBossLength * 4, y: state.player.y + towardBoss.y / towardBossLength * 4 }
            p3RunePartnerApproach = true
          }
        }
        if (index === partnerNpcOrdinal) {
          const playerRune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
          if (!p3RunePartnerApproach && shouldHoldP3RunePartner(state.event, state.p3RuneOrder[state.p3RuneStep], playerRune, state.p3ResolvedRunes)) {
            p3Target = renderedNpcPositions[index] ?? p3Target
            p3RunePartnerApproach = true
          }
        }
        const pairOrdinal = markedNpcOrdinals.indexOf(index)
        if (state.event === 'p3-light-pools' && state.eventTime >= P3_MEMORY_PANEL_SECONDS && pairOrdinal >= 0) {
          const pair = Math.floor(pairOrdinal / 2)
          const playerRune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
          const otherRunes = (['T', 'X', 'O'] as RuneSymbol[]).filter(symbol => symbol !== playerRune)
          const pairRune = otherRunes[pair]
          if (state.eventTime >= P3_MEMORY_START_SECONDS && isActiveP3RuneDuty(state.event, state.p3RuneOrder[state.p3RuneStep], pairRune, state.p3ResolvedRunes)) {
            p3RunePairApproach = true
            if (pairOrdinal % 2 === 1) {
              const stationaryNpc = markedNpcOrdinals[pairOrdinal - 1]
              p3Target = renderedNpcPositions[stationaryNpc] ?? p3Target
            } else {
              p3Target = renderedNpcPositions[index] ?? p3Target
            }
          }
        }
        const keepP3Formation = phaseThree
          && state.event !== 'p3-countdown'
          && state.event !== 'p3-flight'
          && state.event !== 'p3-landing'
          && state.event !== 'p3-approach'
          && state.event !== 'p3-archangel-position'
          && state.event !== 'p3-archangel'
          && state.event !== 'p3-sector-move'
          && !p3RunePartnerApproach
          && !p3RunePairApproach
        const p3NpcDisplacementAllowed = shouldApplyP3NpcDisplacement(p3RunePartnerApproach, p3RunePairApproach)
        if (keepP3Formation) p3Target = separateP3NpcTarget(p3Target, npcP3CrystalActive, plannedP3Targets, baseIndex)
        if (p3PoolTarget && p3NpcDisplacementAllowed) p3Target = keepP3NpcInSoak(p3Target, p3PoolTarget)
        const crystalPoolSupport = p3CrystalPoolSupport.get(baseIndex)
        if (crystalPoolSupport && p3NpcDisplacementAllowed) p3Target = keepP3CrystalPoolCovered(p3Target, crystalPoolSupport.pool)
        if (phaseThree) plannedP3Targets.push({ point: p3Target, crystal: npcP3CrystalActive })
        if (state.event === 'p3-light-pools' && p3NpcDisplacementAllowed) {
          const stars = p3StarsTiming(state.eventTime)
          if (stars.active && stars.localTime >= 2.5 && stars.localTime <= 4.5) {
            const current = renderedNpcPositions[index] ?? p3Target
            p3Target = avoidP3Stars(current, p3Target, p3StarsField(npcP3Side, state.p3Round, stars.cycle), index)
          }
        }
        if (phaseThree && state.event !== 'p3-flight' && state.event !== 'p3-landing' && p3NpcDisplacementAllowed) {
          p3Target = constrainP3NpcTargetToSide(p3Target, npcP3Side, WORLD.center, npcP3CrystalActive ? P3_LIGHT_RADIUS + 2 : 3, state.event, state.p3Round)
        }
        const normal = phaseOne
          ? p1Target
          : phaseThree || phaseFour
          ? p3Target
          : state.event === 'p2-countdown'
          ? WORLD.center
          : state.event === 'p2-positioning'
            ? walkTowards(WORLD.center, soakTarget, state.eventTime, state.movementSpeed)
            : state.event === 'p2-orbs'
              ? state.p2Cycle === 1
                ? soakTarget
                : walkTowards(spreadResolutionPosition, soakTarget, 2 + state.eventTime, state.movementSpeed)
              : state.event === 'p2-recover'
                ? soakTarget
                : state.event === 'p2-pull'
                  ? walkTowards(recoveredSoakPosition, WORLD.center, Math.pow(state.eventTime / P2_PULL_SECONDS, 3) * distance(recoveredSoakPosition, WORLD.center) / state.movementSpeed, state.movementSpeed)
                  : state.event === 'p2-spread'
                    ? walkTowards(WORLD.center, spreadTarget, state.eventTime, state.movementSpeed)
                    : state.event === 'p2-fetch'
                      ? spreadResolutionPosition
                      : state.event === 'p2-wait'
                        ? p2WaitTarget
                        : phaseTwo ? soakTarget : intermissionPosition
        let position = state.event === 'p2-jump'
          ? { x: intermissionPosition.x + (WORLD.center.x - intermissionPosition.x) * (1 - Math.pow(1 - jumpProgress, 3)), y: intermissionPosition.y + (WORLD.center.y - intermissionPosition.y) * (1 - Math.pow(1 - jumpProgress, 3)) }
          : normal
        const dropped = state.npcCrystals[0]
        if (index === state.npcCarrier && dropped) {
          position = crystalCarrierPosition(normal, dropped, state.npcCrystalAge, index, WORLD.center, state.movementSpeed)
        }
        const previousPosition = renderedNpcPositions[index]
        const forcedMovement = state.event === 'p2-jump' || state.event === 'p2-pull' || state.event === 'p3-flight' || state.event === 'p4-transition'
        const p4Relocation = state.event === 'p4-cycle' ? p4RelocationProgress(p4VisualCycle, state.eventTime) : null
        const openingMultiplier = state.event === 'p1-transition'
          ? state.eventTime <= OPENING_BOOST_SECONDS ? 1.4 : 1
          : phaseOne && (state.event === 'p1-beam-telegraph' || state.event === 'p1-beams')
          ? 2.2
          : state.event === 'p3-sector-move'
          ? 2
          : state.event === 'p3-approach' ? P3_APPROACH_NPC_SPEED_MULTIPLIER
          : state.event === 'p4-transition' ? 4
          : p4SplinterReturnBoost ? 1
          : p3RunePartnerApproach ? .75
          : p4Relocation !== null ? p4NpcRelocationPace(p4Relocation * P4_HEAVEN_MOVE_SECONDS)
          : state.movementBonus && state.event === 'positioning' && state.eventTime <= OPENING_BOOST_SECONDS ? 1.4 : 1
        const phaseMovementSpeed = state.movementSpeed * (phaseFour && state.event === 'p4-cycle' ? P4_MOVEMENT_MULTIPLIER : 1)
        if (previousPosition && !forcedMovement) position = walkTowards(previousPosition, position, simulationDelta, phaseMovementSpeed * openingMultiplier)
        if (phaseFour && state.event === 'p4-cycle') {
          position = keepP4NpcInProtection(position, p4GroupPosition(p4VisualCycle, state.eventTime, WORLD.center))
        }
        renderedNpcPositions[index] = position
        sprite.position.set(position.x, heights.npc + p3FlightHeight + p4JumpHeight, position.y)
        sprite.rotation.z = state.wipeReason ? (index % 2 ? 1 : -1) * Math.PI / 2 : 0
        const pathTarget = phaseOne && (state.event === 'p1-beam-telegraph' || state.event === 'p1-beams')
          ? p1Boss
          : phaseOne ? p1Target : phaseThree ? p3Target : state.event === 'p2-wait' ? p2WaitTarget : state.event === 'p2-orbs' ? soakTarget : state.event === 'p2-spread' ? spreadTarget : state.event === 'p2-pull' || state.event === 'p2-jump' ? WORLD.center : null
        if (!state.wipeReason && pathTarget && distance(position, pathTarget) > .1) sprite.rotation.y = -Math.atan2(pathTarget.y - position.y, pathTarget.x - position.x)
        const glow = sprite.getObjectByName('crystal-glow')
        const p1CollectedAssignments = state.p1CrystalAssignments.slice(
          0,
          state.event === 'p1-countdown' || state.event === 'p1-interrupts' || state.event === 'p1-crystals'
            ? (state.p1Sequence - 1) * 3
            : state.p1Sequence * 3,
        )
        const npcCollectedCurrentP1Crystal = state.event === 'p1-crystals'
          && currentP1CrystalAssignments.includes(baseIndex)
          && distance(position, p1CrystalSpawnPosition(p1Boss, WORLD.center, currentP1CrystalAssignments.indexOf(baseIndex))) <= 4
        const npcCrystalVisible = phaseOne
          ? p1CollectedAssignments.includes(baseIndex) || npcCollectedCurrentP1Crystal
          : phaseThree ? npcP3CrystalActive : state.crystalCarriers.includes(index)
        if (glow) glow.visible = !phaseOne && !phaseFour && npcCrystalVisible
        const body = sprite.getObjectByName('role-body') as THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
        body.material.color.setHex(body.userData.baseColor)
        const carriedCrystal = sprite.getObjectByName('carried-crystal')
        if (carriedCrystal) {
          const droppedForP2Spread = state.event === 'p2-spread' && state.npcCrystals.length > 0
          carriedCrystal.visible = !phaseFour && npcCrystalVisible && !droppedForP2Spread && !(index === state.npcCarrier && state.npcCrystals.length)
        }
        return position
      })
      const npcP3LightCenters = phaseThree
        ? npcPositions.filter((_, npcIndex) => isP3RaidMemberVisible(state.positions[state.assignment], state.positions[npcProfileIndices[npcIndex]], WORLD.center, true) && activeP3Crystals.includes(npcProfileIndices[npcIndex]))
        : []
      state.onP3LightCenters(npcP3LightCenters)
      state.onNpcPositions(npcPositions)
      const playerProjectileVisible = state.combatProjectilesEnabled && combatProjectilesActive(state.event)
      const projectilesVisible = state.combatProjectilesEnabled && combatProjectilesActive(state.event)
      const projectileBossCenter = combatProjectileBossCenter(state.event, p1Boss, p3BossPosition(playerP3Side, WORLD.center, state.p3Round), WORLD.center)
      const projectileBossRadius = phaseThree || phaseTwo ? 10.5 : 16
      const projectileBossHeight = phaseThree || phaseTwo ? 10.5 : 16
      const playerProjectileAge = state.mainProjectileFiredAt === null ? Infinity : state.time - state.mainProjectileFiredAt
      const playerShotSeed = state.assignment + Math.floor((state.mainProjectileFiredAt ?? 0) * 10)
      const playerProjectileImpact = combatProjectileImpactPoint(state.player, projectileBossCenter, projectileBossRadius, playerShotSeed)
      const playerProjectileTarget = combatProjectileImpactPoint(state.player, projectileBossCenter, projectileBossRadius * .18, playerShotSeed)
      const playerProjectileTargetHeight = combatProjectileTargetHeight(projectileBossHeight, playerShotSeed)
      if (playerProjectileVisible) updateCombatProjectile(playerProjectile, state.player, playerProjectileTarget, playerProjectileImpact, playerProjectileTargetHeight, playerProjectileAge, state.profiles[state.assignment].playerClass, 1.12)
      else {
        playerProjectile.group.visible = false
        playerProjectile.impact.visible = false
      }
      const ambientShots = projectilesVisible ? npcProjectileShots(state.time, npcs.length) : []
      npcProjectiles.forEach((visual, slot) => {
        const shot = ambientShots[slot]
        if (!shot) {
          visual.group.visible = false
          visual.impact.visible = false
          return
        }
        const profileIndex = npcProfileIndices[shot.npcOrdinal]
        const visibleOnPlayerSide = !phaseThree || isP3RaidMemberVisible(state.positions[state.assignment], state.positions[profileIndex], WORLD.center, true)
        if (!visibleOnPlayerSide) {
          visual.group.visible = false
          visual.impact.visible = false
          return
        }
        const origin = npcPositions[shot.npcOrdinal]
        const shotSeed = profileIndex * 101 + shot.shotOrdinal
        const impact = combatProjectileImpactPoint(origin, projectileBossCenter, projectileBossRadius, shotSeed)
        const target = combatProjectileImpactPoint(origin, projectileBossCenter, projectileBossRadius * .18, shotSeed)
        const targetHeight = combatProjectileTargetHeight(projectileBossHeight, shotSeed)
        updateCombatProjectile(visual, origin, target, impact, targetHeight, shot.age, state.profiles[profileIndex].playerClass, .88, shot.shotOrdinal)
      })
      if (state.event === 'p3-light-pools' || state.event === 'p3-pools-overlap') {
        const occupancy = ([-1, 1] as const).flatMap(side => p3PoolCenters(side, WORLD.center, state.p3Round).map(pool => npcPositions.filter(position => isInsideP3Pool(position, pool)).length))
        state.onP3PoolOccupancy(occupancy)
      }
      if (state.event === 'p3-light-pools' && state.eventTime >= P3_MEMORY_START_SECONDS || state.event === 'p3-lattice-memory') {
        const rune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
        const contacts: RuneSymbol[] = []
        if (distance(state.player, npcPositions[partnerNpcOrdinal]) <= 4.5) contacts.push(rune)
        const otherRunes = (['T', 'X', 'O'] as RuneSymbol[]).filter(symbol => symbol !== rune)
        const localNpcOrdinals = npcPositions
          .map((_, npcIndex) => npcIndex)
          .filter(npcIndex => npcIndex !== partnerNpcOrdinal && p3SideOf(npcProfileIndices[npcIndex]) === playerP3Side)
          .slice(0, 4)
        localNpcOrdinals.forEach((npcIndex, index) => {
          if (distance(state.player, npcPositions[npcIndex]) <= 4.5) contacts.push(otherRunes[Math.floor(index / 2)])
        })
        state.onP3RuneContacts([...new Set(contacts)])
      } else state.onP3RuneContacts([])
      crystal.visible = !phaseFour && Boolean(state.crystal)
      if (state.crystal) crystal.position.set(state.crystal.x, 2.5, state.crystal.y)
      npcCrystalSprites.forEach((sprite, index) => { const point = state.npcCrystals[index]; sprite.visible = !phaseFour && Boolean(point); if (point) sprite.position.set(point.x, 2.25, point.y) })
      const recurringP2Guide = state.p2Cycle > 1 && (state.event === 'p2-wait' || state.event === 'p2-orbs' && state.eventTime < 2.5)
      const p2SpreadGuide = state.event === 'p2-spread'
      const p4Stack = state.event === 'p4-cycle'
        ? p4GroupPosition(p4VisualCycle, state.eventTime, WORLD.center)
        : p4StackPosition(1, WORLD.center)
      const p1MemoryBoss = p1BossEncounterPosition(state.p1BossOpening, state.positions.slice(0, 2), state.p1Sequence, state.event, state.eventTime, WORLD.center)
      const p1MemoryAssignment = {
        x: p1MemoryBoss.x + Math.cos(p1MemorySlotAngle(state.p1MemoryOrder, playerP1Rune, p1OutwardAngle)) * P1_MEMORY_RADIUS,
        y: p1MemoryBoss.y + Math.sin(p1MemorySlotAngle(state.p1MemoryOrder, playerP1Rune, p1OutwardAngle)) * P1_MEMORY_RADIUS,
      }
      const assigned = phaseOne
        ? state.event === 'p1-transition'
          ? state.intermissionPositions[state.assignment]
          : state.event === 'p1-memory-position' ? p1MemoryAssignment : state.positions[state.assignment]
        : phaseFour ? p4Stack : p2SpreadGuide ? state.p2SpreadPositions[state.assignment] : recurringP2Guide ? state.p2SoakPositions[state.assignment] : state.positions[state.assignment]
      if (state.event === 'p3-approach' && distance(state.player, assigned) <= 14) p3OpeningReached = true
      const p3Opening = phaseThree && state.event === 'p3-approach' && !p3OpeningReached
      const opening = state.event === 'p1-countdown' || state.event === 'p1-memory-position' || state.event === 'p1-transition' || state.event === 'countdown' || state.event === 'positioning' || state.event === 'p2-countdown' || state.event === 'p2-positioning' || state.event === 'p4-transition' || p2SpreadGuide || recurringP2Guide || p3Opening
      const revealDistance = phaseTwo ? state.difficulty === 'normal' ? 14 : state.difficulty === 'hard' ? 7 : Infinity : assignmentRevealDistance(state.difficulty)
      helper.visible = opening && (state.easy || distance(state.player, assigned) <= revealDistance)
      helper.scale.setScalar(phaseTwo ? .55 : phaseThree ? .45 : 1)
      helper.position.set(assigned.x, 2.2, assigned.y)

      clearGroup(hazards)
      const fade = Math.min(1, state.eventTime / .16, (3 - state.eventTime) / .16)
      if (state.easy && opening) {
        const guideDx = assigned.x - state.player.x
        const guideDy = assigned.y - state.player.y
        const guideLength = Math.hypot(guideDx, guideDy)
        if (guideLength > 4) addFlatBeam(hazards, state.player, Math.atan2(guideDy, guideDx), guideLength, 1.7, 0x73e0c1, .72)
      }
      if (phaseOne) {
        if (state.event === 'p1-interrupts') {
          const castElapsed = state.eventTime % 2
          const assignedCast = state.p1InterruptCast === state.p1InterruptAssignment
          const interrupted = assignedCast
            ? state.p1InterruptPressed
            : castElapsed >= p1NpcInterruptSeconds(state.p1Seed, state.p1Sequence, state.p1InterruptCast)
          const progress = Math.min(1, castElapsed / 2)
          const dropProgress = state.p1InterruptCast === 4
            ? Math.max(0, Math.min(1, (castElapsed - 1.7) / .3))
            : 0
          const dropTargets = Array.from({ length: 3 }, (_, index) =>
            p1CrystalSpawnPosition(p1Boss, WORLD.center, index))
          addInterruptCastOrbs(hazards, p1Boss, state.time, progress, !interrupted, dropProgress, dropTargets)
        }
        if (state.event === 'p1-crystals') {
          const activeAssignments = state.p1CrystalAssignments.slice((state.p1Sequence - 1) * 3, state.p1Sequence * 3)
          const playerPlannedSlot = p1PreferredCrystalSlot(activeAssignments, state.assignment)
          activeAssignments.forEach(profileIndex => {
            const slot = activeAssignments.indexOf(profileIndex)
            if (state.p1StolenCrystalSlot === slot) return
            if (profileIndex === state.assignment && state.p1CrystalCollected) return
            const point = p1CrystalSpawnPosition(p1Boss, WORLD.center, slot)
            const npcOrdinal = npcProfileIndices.indexOf(profileIndex)
            if (npcOrdinal >= 0 && distance(npcPositions[npcOrdinal], point) <= 4) return
            addGroundCrystal(hazards, point, slot === playerPlannedSlot)
          })
        }
        state.p1GlaiveSets.forEach(set => {
          if (state.time < set.telegraphStartsAt || state.time > set.expiresAt) return
          if (state.time < set.launchesAt) {
            const pulse = .4 + .35 * Math.sin(state.time * 9)
            set.glaives.forEach(glaive => {
              const angle = Math.atan2(glaive.direction.y, glaive.direction.x)
              addLaserBeam(hazards, set.origin, angle, P1_OUTER_RADIUS * 1.8, 1.6, 0xa8e7ff, pulse)
              addFlyingSaucer(hazards, glaive.position, state.time * 18 + glaive.id * .8)
            })
          } else {
            set.glaives.forEach(glaive => {
              addFlyingSaucer(hazards, glaive.position, state.time * 18 + glaive.id * .8)
            })
          }
        })
        if (state.event === 'p1-memory-position' || state.event === 'p1-memory-sweep') {
          const runeStillVisible = (rune: P1Rune) => state.event === 'p1-memory-position'
            || p1MemoryRuneVisible(state.p1MemoryOrder, rune, state.eventTime)
          if (runeStillVisible(playerP1Rune)) addRuneMarker(hazards, state.player, p1RuneTextures[playerP1Rune], true)
          p1MarkedProfiles.forEach((profileIndex, rune) => {
            if (profileIndex === state.assignment || !runeStillVisible(rune)) return
            const npcOrdinal = npcProfileIndices.indexOf(profileIndex)
            if (npcOrdinal >= 0) addRuneMarker(hazards, npcPositions[npcOrdinal], p1RuneTextures[rune], true)
          })
          if (state.event === 'p1-memory-sweep') {
            const angle = p1MemorySweepAngle(0, state.eventTime, p1OutwardAngle)
            addSplinterWedge(hazards, p1MemoryBoss, angle, P1_MEMORY_BEAM_LENGTH, 0x2864c7, 1, P1_MEMORY_BEAM_WIDTH_SCALE)
            addLaserBeam(hazards, p1MemoryBoss, angle, P1_MEMORY_BEAM_LENGTH, .9, 0x2864c7, .72)
          }
        }
        if (state.event === 'p1-beam-telegraph' || state.event === 'p1-beams') {
          const openingBoss = p1BossEncounterPosition(state.p1BossOpening, state.positions.slice(0, 2), state.p1Sequence, 'p1-beam-telegraph', 0, WORLD.center)
          const beams = p1RotatingBeams(state.p1Seed, state.p1Sequence, 0, Math.PI / 16, Math.atan2(openingBoss.y - WORLD.center.y, openingBoss.x - WORLD.center.x))
          const angles = p1BeamAngles(beams, p1ContinuousBeamTime(state.event, state.eventTime))
          const active = state.event === 'p1-beams'
          angles.forEach(angle => {
            if (active) addLaserBeam(hazards, WORLD.center, angle, P1_OUTER_RADIUS, 3.3, 0x45aaff, .9)
            else addFlatBeam(hazards, WORLD.center, angle, P1_OUTER_RADIUS, 4.2, 0xa8d7ff, .42)
          })
        }
        if (state.event === 'p1-soaks') {
          state.p1Soaks.forEach(soak => {
            const resolved = state.p1SoakResolved.includes(soak.id)
            const pulse = .55 + Math.sin(state.time * 5 + soak.id) * .25
            addGroundDisc(hazards, soak.position, P1_REACTIVE_SOAK_RADIUS, resolved ? 0xf3bd16 : 0xffee8a, resolved ? .3 : .16 + pulse * .12, 2.5)
            addGroundRing(hazards, soak.position, P1_REACTIVE_SOAK_RADIUS - (resolved ? 1.6 : 2.4), P1_REACTIVE_SOAK_RADIUS, resolved ? 0xffc928 : 0xffffc2, resolved ? .86 : pulse, 2.8)
          })
        }
      }
      if (!phaseOne) {
        state.p1GlaiveSets.forEach(set => {
          if (state.time < set.launchesAt || state.time > set.expiresAt) return
          set.glaives.forEach(glaive => addFlyingSaucer(hazards, glaive.position, state.time * 18 + glaive.id * .8))
        })
      }
      if (state.event === 'beam') {
        state.beamAngles.forEach(angle => {
          addFlatBeam(hazards, WORLD.center, angle, 440, 24, 0xf04482, .78 * Math.max(0, fade))
          addFlatBeam(hazards, WORLD.center, angle, 440, 3.5, 0xffd4e3, .92 * Math.max(0, fade))
        })
        beamMarkerTextures.forEach((texture, index) => {
          const beamIndex = Math.floor(index * state.beamAngles.length / beamMarkerTextures.length)
          addBeamMarker(hazards, WORLD.center, state.beamAngles[beamIndex], texture)
        })
      }
      if (state.event === 'splinter') {
        const origins = [state.player, ...state.npcSplinters.map(index => npcPositions[index])]
        origins.forEach((origin, originIndex) => {
          const obstacles = [state.player, ...npcPositions, ...(state.crystal ? [state.crystal] : []), ...state.npcCrystals]
          let rotation = originIndex === 0 ? state.playerSplinterRotation : 0
          if (originIndex > 0) {
            rotation = safestStarsplinterRotation(origin, obstacles, state.crystal ? [state.crystal] : [])
          }
          for (let i = 0; i < 6; i++) addSplinterWedge(hazards, origin, rotation + i * Math.PI / 3, STAR_LENGTH, 0x67baff, .9 * Math.max(0, fade))
        })
      }
      if (phaseTwo) {
        const afterOrbResolution = state.event === 'p2-recover' || state.event === 'p2-pull' || state.event === 'p2-spread' || state.event === 'p2-fetch' || state.event === 'p2-wait'
        const firstVisibleOrb = Math.min(12, (state.p2Cycle - 1 + (afterOrbResolution ? 1 : 0)) * 4)
        for (let index = firstVisibleOrb; index < 12; index++) {
          const currentBeamTarget = state.event === 'p2-orbs' && index < state.p2Cycle * 4
          addOrb(hazards, p2OrbPosition(index, orbitAngle, WORLD.center), currentBeamTarget ? 0x70edff : 0xb170ff)
        }
        const returning = p2OrbReturnState(state.p2OrbReturnAge)
        if (returning.phase === 'orbiting' || returning.phase === 'charging' || returning.phase === 'returning') {
          p2ReturningOrbPositions(state.p2OrbReturnAge, state.p2Cycle, orbitAngle, WORLD.center).forEach((point, localIndex) => {
            const pulse = returning.phase === 'charging'
              ? 1 + Math.sin(state.time * 15 + localIndex) * .25
              : .75 + Math.sin(state.time * 9 + localIndex) * .2
            addOrb(hazards, point, 0xffe66d, 6.2, pulse)
            addGroundRing(hazards, point, 8, 10, 0xfff2a6, pulse * .75, 3)
            if (returning.phase === 'returning') addFlatBeam(hazards, point, Math.atan2(WORLD.center.y - point.y, WORLD.center.x - point.x), returning.radius, 2.2, 0xffe88a, .68)
          })
        } else {
          const returnImpact = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS
          if (state.p2OrbReturnAge >= returnImpact && state.p2OrbReturnAge < returnImpact + .5) {
            const pulseRadius = 8 + (state.p2OrbReturnAge - returnImpact) * 55
            addGroundRing(hazards, WORLD.center, pulseRadius - 2, pulseRadius + 2, 0xffefa2, 1 - (state.p2OrbReturnAge - returnImpact) * 1.5, 4, false)
          }
        }
      }
      if (state.event === 'p2-orbs') {
        if (state.eventTime >= 1) {
          const beamOpacity = THREE.MathUtils.clamp((state.eventTime - 1) / .35, 0, 1) * .82
          for (let index = 0; index < 4; index++) {
            const angle = index * Math.PI / 2
            addFlatBeam(hazards, WORLD.center, angle, 90, 11, 0x57dffc, beamOpacity)
            addFlatBeam(hazards, WORLD.center, angle, 90, 2, 0xf1fdff, beamOpacity)
          }
        }
      }
      if (state.event === 'p2-pull') {
        const pullProgress = THREE.MathUtils.clamp(state.eventTime / P2_PULL_SECONDS, 0, 1)
        addGroundRing(hazards, WORLD.center, 8 + pullProgress * 15, 10 + pullProgress * 15, 0xd981ff, .72)
      }
      if (state.event === 'p2-spread') {
        addGroundRing(hazards, state.player, P2_PERSONAL_CIRCLE_INNER_RADIUS, P2_PERSONAL_CIRCLE_OUTER_RADIUS, 0x4ea8ff, .88)
        npcPositions.forEach(point => addGroundRing(hazards, point, P2_PERSONAL_CIRCLE_INNER_RADIUS, P2_PERSONAL_CIRCLE_OUTER_RADIUS, 0x4ea8ff, .58))
        if (state.playerIsCrystal) addGroundRing(hazards, WORLD.center, 4, 8, 0xffe05a, .65)
      }
      if (phaseThree) {
        const playerSide = playerP3Side
        const landingGroups = new Set([p3LandingGroupIndex(p3LandingIndexOf(state.assignment)), ...state.profiles.map((profile, index) => profile.crystal ? p3LandingGroupIndex(p3LandingIndexOf(index)) : -1).filter(group => group >= 0)])
        const landingSoaks = [...landingGroups].flatMap(group => {
          const representative = state.profiles.findIndex((_, index) => p3LandingGroupIndex(p3LandingIndexOf(index)) === group)
          return p3LandingSoakPositions(p3LandingIndexOf(representative), WORLD.center, state.p4PatternSeed)
        })
        const landingVisible = state.event === 'p3-landing' || state.event === 'p3-approach' && state.eventTime < .25
        const landingFade = state.event === 'p3-approach' ? Math.max(0, 1 - state.eventTime / .25) : 1
        if (landingVisible) landingSoaks.forEach((point, index) => {
          const occupied = [state.player, ...npcPositions].some(playerPoint => distance(playerPoint, point) <= P3_LANDING_SOAK_RADIUS)
          const emptyPulse = .55 + Math.sin(state.time * 5 + index) * .25
          addGroundDisc(hazards, point, P3_LANDING_SOAK_RADIUS, occupied ? 0xf3bd16 : 0xffee8a, (occupied ? .3 : .16 + emptyPulse * .12) * landingFade)
          addGroundRing(hazards, point, P3_LANDING_SOAK_RADIUS - (occupied ? 1.6 : 2.4), P3_LANDING_SOAK_RADIUS, occupied ? 0xffc928 : 0xffffc2, (occupied ? .86 : emptyPulse) * landingFade)
          if (state.event === 'p3-landing') {
            const drop = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffe66c }))
            drop.position.set(point.x, Math.max(3, 55 * (1 - state.eventTime / 3)) + index * 4, point.y)
            hazards.add(drop)
          }
        })
        if (state.event === 'p3-light-pools' || state.event === 'p3-pools-overlap') {
          ;([-1, 1] as const).forEach((side, sideIndex) => {
            p3PoolCenters(side, WORLD.center, state.p3Round).forEach((point, poolIndex) => {
              const health = state.p3PoolHealth[sideIndex * 3 + poolIndex]
              if (health <= .5) return
              const occupants = [state.player, ...npcPositions].filter(playerPoint => distance(playerPoint, point) <= P3_POOL_RADIUS).length
              const correctlySoaked = occupants >= 3
              const emptyPulse = .55 + Math.sin(state.time * 5.4 + poolIndex * 1.7) * .28
              const validPulse = .68 + Math.sin(state.time * 7.2 + poolIndex) * .18
              addGroundDisc(hazards, point, P3_POOL_RADIUS, correctlySoaked ? 0x0b347a : 0x06142d, correctlySoaked ? .9 : occupants ? .7 : .58, 2.55)
              addGroundRing(hazards, point, P3_POOL_RADIUS - 1, P3_POOL_RADIUS, correctlySoaked ? 0x6fe7ff : occupants ? 0x369dff : 0x8bcdff, correctlySoaked ? 1 : occupants ? .72 : emptyPulse, 2.9)
              if (correctlySoaked) addGroundRing(hazards, point, P3_POOL_RADIUS + .35, P3_POOL_RADIUS + 1.8, 0x35bfff, validPulse, 3)
              if (state.easy) addGroundProgress(hazards, point, P3_POOL_RADIUS + 2, 2, health / P3_POOL_HEALTH, correctlySoaked ? 0x83efff : occupants ? 0x5bb1ff : 0xd3ebff, correctlySoaked ? 1 : occupants ? .88 : emptyPulse, 3.05)
              const beacon = new THREE.Mesh(new THREE.CylinderGeometry(P3_POOL_RADIUS * .86, P3_POOL_RADIUS * .86, 3.5, 32, 1, true), new THREE.MeshBasicMaterial({ color: correctlySoaked ? 0x29a7ff : occupants ? 0x135ec9 : 0x75b8ff, transparent: true, opacity: correctlySoaked ? .24 : occupants ? .12 : .08 + emptyPulse * .08, depthWrite: false, side: THREE.DoubleSide }))
              beacon.position.set(point.x, 4.1, point.y)
              hazards.add(beacon)
            })
          })
        }
        if (state.event !== 'p3-countdown' && state.event !== 'p3-flight' && state.event !== 'p3-landing') {
          const carrierLights = [...npcP3LightCenters]
          if (playerLightActive) carrierLights.push(state.player)
          carrierLights.forEach(point => {
            addGroundDisc(hazards, point, P3_LIGHT_RADIUS, 0xffd94a, .13, 3.1)
            addGroundRing(hazards, point, P3_LIGHT_RADIUS - 1.35, P3_LIGHT_RADIUS, 0xffefa1, .58, 3.25)
          })
        }
        const starsTiming = p3StarsTiming(state.eventTime)
        const firstPoolLattice = state.event === 'p3-light-pools' && starsTiming.active
        const lattice = state.event === 'p3-lattice-second'
        const overlapLattice = state.event === 'p3-pools-overlap' && state.eventTime >= 4 && state.eventTime <= 9
        if (firstPoolLattice || lattice || overlapLattice) {
          const localTime = firstPoolLattice ? starsTiming.localTime : overlapLattice ? state.eventTime - 4 : state.eventTime
          ;([-1, 1] as const).forEach(side => {
            const field = p3StarsField(side, state.p3Round, firstPoolLattice ? starsTiming.cycle : 0)
            const orbs = field.orbs
            const beamsVisible = localTime >= 2.5 && localTime <= 4.5
            orbs.forEach(point => {
              addOrb(hazards, point, 0x17477f, 3.05, .88)
              addGroundRing(hazards, point, 4.25, 5.05, 0x3fa5ff, beamsVisible ? .38 : .62, 2.8)
            })
            if (beamsVisible) field.edges.forEach(([from, to]) => {
              const start = orbs[from]
              const end = orbs[to]
              addLaserBeam(hazards, start, Math.atan2(end.y - start.y, end.x - start.x), distance(start, end), 2.2, 0x258dff, .76)
            })
          })
        }
        if (state.event === 'p3-light-pools' && state.eventTime >= P3_MEMORY_PANEL_SECONDS && state.eventTime < P3_MEMORY_PANEL_SECONDS + 3) {
          const revealTime = state.eventTime - P3_MEMORY_PANEL_SECONDS
          const runeIndex = Math.floor(revealTime)
          const opacity = Math.sin((revealTime - runeIndex) * Math.PI)
          const bossPoint = p3BossPosition(playerSide, WORLD.center, state.p3Round)
          addBossRune(hazards, bossPoint, runeTextures[state.p3RuneOrder[runeIndex]], opacity)
        }
        const memoryVisible = state.event === 'p3-lattice-memory' || state.event === 'p3-light-pools' && state.eventTime >= P3_MEMORY_START_SECONDS
        if (memoryVisible) {
          const rune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
          const playerRuneResolved = state.p3ResolvedRunes.includes(rune)
          const activeRune = state.event === 'p3-light-pools' && state.eventTime < P3_MEMORY_START_SECONDS ? null : state.p3RuneOrder[state.p3RuneStep]
          if (!playerRuneResolved) {
            addRuneMarker(hazards, state.player, runeTextures[rune], activeRune === rune)
            addRuneMarker(hazards, npcPositions[partnerNpcOrdinal], runeTextures[rune], activeRune === rune)
          }
          const otherRunes = (['T', 'X', 'O'] as RuneSymbol[]).filter(symbol => symbol !== rune)
          const npcRunes: RuneSymbol[] = [otherRunes[0], otherRunes[0], otherRunes[1], otherRunes[1]]
          const localNpcs = npcPositions.filter((_, npcIndex) => {
            if (npcIndex === partnerNpcOrdinal) return false
            const baseIndex = npcProfileIndices[npcIndex]
            return p3SideOf(baseIndex) === playerSide
          }).slice(0, 4)
          localNpcs.forEach((point, index) => {
            const npcRune = npcRunes[index]
            if (!state.p3ResolvedRunes.includes(npcRune)) addRuneMarker(hazards, point, runeTextures[npcRune], activeRune === npcRune)
          })
        }
        if (state.event === 'p3-big-boom') {
          const progress = THREE.MathUtils.clamp(state.eventTime, 0, 1)
          addGroundRing(hazards, WORLD.center, WORLD.innerRadius + progress * (P3_OUTER_RADIUS - WORLD.innerRadius) - 4, WORLD.innerRadius + progress * (P3_OUTER_RADIUS - WORLD.innerRadius) + 4, 0xd999ff, .92 - progress * .45, 4, false)
        }
        if (state.p3Round > 1 || state.event === 'p3-sector-move') {
          const armProgress = state.p3Round > 1 ? 1 : THREE.MathUtils.clamp(state.eventTime / 4.5, 0, 1)
          const pulse = .04 * Math.sin(state.time * 7)
          const consumedGeometry = cachedTransientGeometry('p3-consumed-sector', () => new THREE.RingGeometry(WORLD.innerRadius, P3_OUTER_RADIUS, 64, 1, Math.PI * 7 / 6, Math.PI * 2 / 3))
          const consumed = new THREE.Mesh(consumedGeometry, new THREE.MeshBasicMaterial({ color: 0x8f1aac, transparent: true, opacity: .18 + armProgress * .42 + pulse, depthWrite: false, side: THREE.DoubleSide }))
          consumed.rotation.x = -Math.PI / 2
          consumed.position.set(WORLD.center.x, 3.05, WORLD.center.y)
          hazards.add(consumed)
        }
        if (state.event === 'p3-archangel-position' || state.event === 'p3-archangel') {
          const stack = p3ArchangelStackPosition(playerSide, WORLD.center, state.p3Round)
          addGroundRing(hazards, stack, 7, 10, 0xffe56c, .85)
          if (state.event === 'p3-archangel') {
            addFlatBeam(hazards, WORLD.center, Math.atan2(stack.y - WORLD.center.y, stack.x - WORLD.center.x), 250, 24, 0xa23eda, .78)
            const bubbleCenter = p3ProtectionBubbleCenter(stack, state.crystal, state.p3ArchangelDuty, state.p3Round)
            const bubble = new THREE.Mesh(new THREE.SphereGeometry(P3_LIGHT_RADIUS, 32, 18), new THREE.MeshBasicMaterial({ color: 0xffe66c, transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide }))
            bubble.position.set(bubbleCenter.x, 0, bubbleCenter.y)
            hazards.add(bubble)
          }
        }
      }
      if (phaseFour) {
        const stack = state.event === 'p4-cycle'
          ? p4GroupPosition(p4VisualCycle, state.eventTime, WORLD.center)
          : p4StackPosition(1, WORLD.center)
        addGroundDisc(hazards, stack, P4_PROTECTION_RADIUS, 0xffdf55, .2, 2.2)
        addGroundRing(hazards, stack, P4_PROTECTION_RADIUS - 1, P4_PROTECTION_RADIUS, 0xffef8d, .82, 2.5)
        if (state.event === 'p4-cycle') {
          const frontSoaker = p4FrontSoakerPosition(stack, WORLD.center)
          const frontConeAngle = Math.atan2(WORLD.center.y - frontSoaker.y, WORLD.center.x - frontSoaker.x)
          const boxes = p4EncounterBoxStates(p4VisualCycle, state.eventTime, WORLD.center)
          const playerDuty = p4PlayerSplinterDuty(state.assignment, p4VisualCycle, state.p4PatternSeed)
          for (let ordinal = 0; ordinal < 3; ordinal += 1) {
            const age = p4SplinterAge(p4VisualCycle, state.eventTime, ordinal)
            const splinterId = p4VisualCycle * 10 + ordinal
            const rotation = p4SplinterRotation(p4VisualCycle, ordinal, state.p4PatternSeed)
            const fallbackOrigin = p4NpcSplinterPosition(stack, WORLD.center, ordinal, age, rotation)
            const currentOrigin = ordinal === playerDuty
              ? state.player
              : p4RenderedNpcSplinterOrigin(npcPositions, ordinal, fallbackOrigin)
            if (age >= 0 && age <= P4_SPLINTER_DETONATION_SECONDS) {
              p4VisualSplinterSnapshots.set(splinterId, {
                origin: { ...currentOrigin },
                npcPositions: npcPositions.map(position => ({ ...position })),
                player: { ...state.player },
              })
            }
            if (!p4SplinterResolutionActive(age) || resolvedP4VisualSplinters.has(splinterId)) continue
            resolvedP4VisualSplinters.add(splinterId)
            const snapshot = p4VisualSplinterSnapshots.get(splinterId) ?? {
              origin: currentOrigin,
              npcPositions,
              player: state.player,
            }
            const origin = snapshot.origin
            if (ordinal === playerDuty) {
              if (p4PlayerSplinterHitsNpc(snapshot.npcPositions, origin, rotation)) {
                state.onP4SplinterHit('Your Phase 4 Starsplinter hit another player')
              }
            } else {
              if (p4RenderedNpcSplinterHitsPlayer(snapshot.npcPositions, ordinal, origin, rotation, snapshot.player)) {
                state.onP4SplinterHit('Another player’s Phase 4 Starsplinter hit you')
              }
            }
            boxes.forEach(boxState => {
              if (boxState.active && p4SplinterHitsGroup(origin, rotation, boxState.position, boxState.size)) destroyedP4BoxIds.add(boxState.id)
            })
          }
          const frontConeActive = p4TankConeActive(state.eventTime)
          if (frontConeActive) addFrontalCone(hazards, frontSoaker, frontConeAngle, P4_FRONT_CONE_RANGE, 0xffdc67, .46)
          for (const boxState of boxes) {
            if (!boxState.active) continue
            if (p4TankKillsBox(boxState.position, frontSoaker)) destroyedP4BoxIds.add(boxState.id)
            if (frontConeActive && p4TankConeHitsBox(boxState.position, frontSoaker, frontConeAngle, boxState.size / 2)) {
              destroyedP4BoxIds.add(boxState.id)
            }
            if (destroyedP4BoxIds.has(boxState.id)) continue
            const height = boxState.size * .5
            const boxGeometry = cachedTransientGeometry(`p4-box:${boxState.size}`, () => new THREE.BoxGeometry(boxState.size, height, boxState.size))
            const box = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x9edaff, transparent: true, opacity: .76 }))
            box.position.set(boxState.position.x, height / 2 + 2.6, boxState.position.y)
            hazards.add(box)
          }
          for (let ordinal = 0; ordinal < 3; ordinal++) {
            const age = p4SplinterAge(p4VisualCycle, state.eventTime, ordinal)
            if (age < 0 || age > P4_SPLINTER_DETONATION_SECONDS) continue
            const playerDuty = p4PlayerSplinterDuty(state.assignment, p4VisualCycle, state.p4PatternSeed) === ordinal
            const rotation = p4SplinterRotation(p4VisualCycle, ordinal, state.p4PatternSeed)
            const fallbackOrigin = p4NpcSplinterPosition(stack, WORLD.center, ordinal, age, rotation)
            const origin = playerDuty ? state.player : p4RenderedNpcSplinterOrigin(npcPositions, ordinal, fallbackOrigin)
            const explosionOpacity = age < P4_SPLINTER_DETONATION_SECONDS - .45 ? .11 : .95 - (age - (P4_SPLINTER_DETONATION_SECONDS - .45)) / .45 * .5
            for (let ray = 0; ray < 6; ray++) addSplinterWedge(hazards, origin, rotation + ray * Math.PI / 3, 42, 0x67cfff, explosionOpacity)
          }
          const consumedCycles = p4VisualCycle - 1 + (state.eventTime >= P4_HEAVEN_START_SECONDS ? 1 : 0)
          for (let consumedCycle = 1; consumedCycle <= consumedCycles; consumedCycle++) {
            const sectorGap = .035
            const sectorStart = Math.PI / 4 + (consumedCycle - 1) * Math.PI / 2 + sectorGap / 2
            const voidGeometry = cachedTransientGeometry(`p4-void:${consumedCycle}`, () => new THREE.RingGeometry(WORLD.innerRadius, P3_OUTER_RADIUS, 64, 1, sectorStart, Math.PI / 2 - sectorGap))
            const voidZone = new THREE.Mesh(voidGeometry, new THREE.MeshBasicMaterial({ color: 0x7d164f, transparent: true, opacity: .48, depthWrite: false, side: THREE.DoubleSide }))
            voidZone.rotation.x = -Math.PI / 2
            voidZone.position.set(WORLD.center.x, 2.7, WORLD.center.y)
            hazards.add(voidZone)
          }
        }
      }

      const radialAngle = Math.atan2(state.player.y - WORLD.center.y, state.player.x - WORLD.center.x)
      if (cameraBaseAngle === null) cameraBaseAngle = distance(state.player, WORLD.center) > 1 ? radialAngle : Math.PI / 2
      const baseAngle = cameraBaseAngle
      const cameraAngle = baseAngle + yawOffset
      const cameraDistance = zoomYards * 4.4
      const groundDistance = Math.cos(pitch) * cameraDistance
      const cameraHeight = Math.sin(pitch) * cameraDistance
      const cameraX = state.player.x + Math.cos(cameraAngle) * groundDistance
      const cameraZ = state.player.y + Math.sin(cameraAngle) * groundDistance
      camera.position.set(cameraX, cameraHeight, cameraZ)
      const forwardX = state.player.x - cameraX
      const forwardY = state.player.y - cameraZ
      const forwardLength = Math.hypot(forwardX, forwardY) || 1
      const normalizedForward = { x: forwardX / forwardLength, y: forwardY / forwardLength }
      currentCameraForwardAngle = Math.atan2(normalizedForward.y, normalizedForward.x)
      if (facingAngle === null) applyFacing(currentCameraForwardAngle)
      player.rotation.y = -(facingAngle ?? currentCameraForwardAngle)
      camera.lookAt(state.player.x, heights.player + 5, state.player.y)
      renderer.render(scene, camera)
      animation = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(animation)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('contextmenu', onContextMenu)
      renderer.domElement.removeEventListener('dragstart', preventNativeDrag)
      renderer.domElement.removeEventListener('selectstart', preventNativeDrag)
      window.removeEventListener('keydown', onTurnKeyDown)
      window.removeEventListener('keyup', onTurnKeyUp)
      window.removeEventListener('blur', clearTurnKeys)
      clearGroup(hazards)
      transientGeometryCache.forEach(geometry => geometry.dispose())
      transientGeometryCache.clear()
      p3StarsFieldCache.clear()
      beamMarkerTextures.forEach(texture => texture.dispose())
      disposeCombatProjectile(playerProjectile)
      npcProjectiles.forEach(disposeCombatProjectile)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={host} className="scene-3d" aria-label="3D L'ura Intermission arena" data-combat-projectiles={props.combatProjectilesEnabled ? 'on' : 'off'} data-p1-boss-opening={`${props.p1BossOpening.x},${props.p1BossOpening.y}`} data-defeated={Boolean(props.wipeReason)} data-ground-texture="grid-cracks" />
}
