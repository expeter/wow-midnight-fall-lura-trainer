import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { angleToward, assignmentRevealDistance, crystalCarrierPosition, distance, distanceToSegment, hasActiveP3CrystalLight, jumpHeights, npcEntryPosition, OPENING_BOOST_SECONDS, P1_STAR_LENGTH, P2_BEAM_SECONDS, P2_ORBIT_SPEED, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P2_PERSONAL_CIRCLE_INNER_RADIUS, P2_PERSONAL_CIRCLE_OUTER_RADIUS, P2_PULL_SECONDS, P2_SPREAD_SECONDS, p2NpcRoamingPosition, p2NpcShouldReturnToSoak, p2OrbReturnState, p2ReturningOrbPositions, p3ArchangelStackPosition, p3BossPosition, p3FlightPosition, P3_FLIGHT_SECONDS, p3LandingGroupIndex, p3LandingPosition, p3LandingSoakPositions, p3LightCenters, p3NpcPoolAssignment, p3NpcRuneReactionDelay, p3NpcSoaksActive, p3PoolCenters, p3ProtectionBubbleCenter, p3RuneEdges, p3RuneOrbs, p3RunePartnerPosition, p3StarsTiming, P3_LANDING_SOAK_RADIUS, P3_LIGHT_RADIUS, P3_MEMORY_PANEL_SECONDS, P3_MEMORY_START_SECONDS, P3_OUTER_RADIUS, P3_POOL_HEALTH, P3_POOL_RADIUS, p4EncounterBoxStates, p4FrontSoakerPosition, p4GroupPosition, p4NpcRelocationPace, p4NpcSplinterPosition, p4PlayerSplinterDuty, p4RelocationProgress, p4SplinterAge, p4SplinterRotation, p4StackPosition, p4TankConeActive, P4_FRONT_CONE_RANGE, P4_HEAVEN_MOVE_SECONDS, P4_HEAVEN_START_SECONDS, P4_KNOCKUP_SECONDS, P4_MOVEMENT_MULTIPLIER, P4_PROTECTION_RADIUS, P4_SPLINTER_DETONATION_SECONDS, roamingNpcPosition, separateP3NpcTarget, type Difficulty, type PlayerClass, type PlayerProfile, type Point, type RuneSymbol } from './game'
import { p3SpreadPosition, p4TankKillsBox } from './game'

interface SceneProps {
  positions: Point[]
  intermissionPositions: Point[]
  p2SoakPositions: Point[]
  p2SpreadPositions: Point[]
  profiles: PlayerProfile[]
  raidStart: Point
  movementSpeed: number
  movementBonus: boolean
  difficulty: Difficulty
  paused: boolean
  p2Cycle: number
  p2OrbReturnAge: number
  p3Round: number
  p3ArchangelDuty: 1 | 2 | null
  p4PatternSeed: number
  p3PoolHealth: number[]
  onP3PoolOccupancy: (occupancy: number[]) => void
  onP3LightCenters: (centers: Point[]) => void
  onP3RuneContacts: (runes: RuneSymbol[]) => void
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
  event: 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait' | 'p3-countdown' | 'p3-flight' | 'p3-landing' | 'p3-approach' | 'p3-light-pools' | 'p3-rune-preview' | 'p3-lattice-memory' | 'p3-lattice-second' | 'p3-pools-overlap' | 'p3-big-boom' | 'p3-archangel-position' | 'p3-archangel' | 'p3-sector-move' | 'p4-countdown' | 'p4-transition' | 'p4-cycle'
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
  paladin: 0xf48cba, druid: 0xff7c0a, evoker: 0x33937f, shaman: 0x0070dd, hunter: 0xaad372, monk: 0x00ff98,
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
  const key = `${side}:${round}:${cycle}`
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
function p3NpcTarget(index: number, crystal: boolean, round: number, event: SceneProps['event'], eventTime: number, landingSeed = 0): Point {
  const side: -1 | 1 = index < 10 ? -1 : 1
  const landing = p3LandingPosition(index, WORLD.center)
  if (event === 'p3-countdown') return WORLD.center
  if (event === 'p3-flight') {
    return p3FlightPosition(WORLD.center, landing, eventTime)
  }
  if (event === 'p3-landing') {
    const sideIndex = index % 10
    const group = Math.min(2, Math.floor(sideIndex / 3))
    const member = sideIndex - group * 3
    const soaks = p3LandingSoakPositions(index, WORLD.center, landingSeed)
    return member < 2 ? soaks[member] : landing
  }
  const generatedSpread = p3SpreadPosition(index, crystal, WORLD.center, round)
  const safeCenter = p3LightCenters(side, WORLD.center, round)[index % 3]
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
    return p3NpcTarget(index, crystal, Math.min(2, round + 1), 'p3-light-pools', 0, landingSeed)
  }
  if (event === 'p4-transition' || event === 'p4-cycle') {
    const lane = (index % 10 - 4.5) * 3.2
    return { x: WORLD.center.x + lane, y: WORLD.center.y - 150 + (index % 2) * 5 }
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
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  for (let step = 0; step <= 20; step++) {
    const rayAngle = angle - Math.PI / 4 + step / 20 * Math.PI / 2
    shape.lineTo(Math.cos(rayAngle) * radius, -Math.sin(rayAngle) * radius)
  }
  shape.closePath()
  const cone = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
  cone.rotation.x = -Math.PI / 2
  cone.position.set(origin.x, 3.4, origin.y)
  cone.renderOrder = 10
  group.add(cone)
}
function addGroundRing(group: THREE.Group, point: Point, inner: number, outer: number, color: number, opacity: number, height = 2.7) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide }))
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
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide }))
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
  const marker = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
  marker.rotation.x = -Math.PI / 2
  marker.position.set(origin.x + Math.cos(angle) * 145, 4.2, origin.y + Math.sin(angle) * 145)
  group.add(marker)
}
function addSplinterWedge(group: THREE.Group, origin: Point, angle: number, length: number, color: number, opacity: number) {
  const addLayer = (startWidth: number, endWidth: number, layerColor: number, layerOpacity: number, height: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(0, -startWidth / 2)
    shape.lineTo(length, -endWidth / 2)
    shape.lineTo(length, endWidth / 2)
    shape.lineTo(0, startWidth / 2)
    shape.closePath()
    const wedge = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: layerColor, transparent: true, opacity: layerOpacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }))
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
  if (!player) {
    const glow = new THREE.Mesh(new THREE.RingGeometry(5.5, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffdf55, transparent: true, opacity: .46, side: THREE.DoubleSide }))
    glow.name = 'crystal-glow'
    glow.rotation.x = -Math.PI / 2
    glow.position.y = .35
    glow.visible = false
    group.add(glow)
  }
  group.scale.setScalar(.77)
  return group
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
function rayHits(point: Point, origin: Point, rotation: number) {
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  const length = Math.hypot(dx, dy)
  if (length < 9 || length > STAR_LENGTH) return false
  const angle = Math.atan2(dy, dx)
  return Array.from({ length: 6 }, (_, i) => Math.abs(Math.atan2(Math.sin(angle - rotation - i * Math.PI / 3), Math.cos(angle - rotation - i * Math.PI / 3))) < .12).some(Boolean)
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
    scene.background = new THREE.Color(0x070812)
    scene.fog = new THREE.Fog(0x070812, 290, 620)
    const camera = new THREE.PerspectiveCamera(55, (element.clientWidth || 760) / (element.clientHeight || 540), .1, 1400)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width, WORLD.height), new THREE.MeshBasicMaterial({ color: 0x070812 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.set(WORLD.width / 2, 0, WORLD.height / 2)
    scene.add(floor)
    const playableFloor = new THREE.Mesh(new THREE.RingGeometry(WORLD.innerRadius, WORLD.outerRadius, 128), new THREE.MeshBasicMaterial({ color: 0x302c52, transparent: true, opacity: .96, side: THREE.DoubleSide }))
    playableFloor.rotation.x = -Math.PI / 2
    playableFloor.position.set(WORLD.center.x, 1, WORLD.center.y)
    scene.add(playableFloor)

    const voidMaterial = new THREE.MeshBasicMaterial({ color: 0x03040b, transparent: true, opacity: .58, side: THREE.DoubleSide })
    const innerVoid = new THREE.Mesh(new THREE.CircleGeometry(WORLD.innerRadius, 96), voidMaterial)
    innerVoid.rotation.x = -Math.PI / 2
    innerVoid.position.set(WORLD.center.x, 1.2, WORLD.center.y)
    scene.add(innerVoid)
    const p2Floor = new THREE.Mesh(new THREE.CircleGeometry(P2_RADIUS, 128), new THREE.MeshBasicMaterial({ color: 0x29264a, transparent: true, opacity: .96, side: THREE.DoubleSide }))
    p2Floor.rotation.x = -Math.PI / 2
    p2Floor.position.set(WORLD.center.x, 1.1, WORLD.center.y)
    p2Floor.visible = false
    scene.add(p2Floor)
    const p3Floor = new THREE.Mesh(new THREE.RingGeometry(WORLD.innerRadius, P3_OUTER_RADIUS, 128), new THREE.MeshBasicMaterial({ color: 0x282344, transparent: true, opacity: .96, side: THREE.DoubleSide }))
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
    const p2Boss = new THREE.Mesh(new THREE.SphereGeometry(10.5, 32, 20), new THREE.MeshBasicMaterial({ color: 0x9b4d9b, transparent: true, opacity: .48, depthWrite: false }))
    p2Boss.position.set(WORLD.center.x, 10.5, WORLD.center.y)
    p2Boss.visible = false
    scene.add(p2Boss)
    const p3Bosses = [-1, 1].map((side, index) => {
      const object = new THREE.Mesh(new THREE.SphereGeometry(10.5, 32, 20), new THREE.MeshBasicMaterial({ color: index ? 0x744d9b : 0xb14d94, transparent: true, opacity: .9, depthWrite: true }))
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
    let previousEventTime = initial.eventTime
    let p4VisualCycle = 1
    const destroyedP4BoxIds = new Set<number>()
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
        yawOffset += dx * .006
        pitch = THREE.MathUtils.clamp(pitch - dy * .004, THREE.MathUtils.degToRad(2), THREE.MathUtils.degToRad(80))
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
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointercancel', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('contextmenu', onContextMenu)
    renderer.domElement.addEventListener('dragstart', preventNativeDrag)
    renderer.domElement.addEventListener('selectstart', preventNativeDrag)

    const render = () => {
      const state = latest.current
      if (state.event === 'p4-cycle' && previousEvent === 'p4-cycle' && state.eventTime < previousEventTime) p4VisualCycle = Math.min(5, p4VisualCycle + 1)
      if (state.event === 'p4-countdown' || state.event === 'p4-transition') p4VisualCycle = 1
      previousEventTime = state.eventTime
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
        if (state.event === 'p4-countdown' || state.event === 'p4-transition') destroyedP4BoxIds.clear()
        if (state.event === 'p2-orbs') {
          orbitSoakStart = orbitAngle
          const baseTarget = -(state.p2Cycle - 1) * Math.PI / 6
          orbitSoakTarget = baseTarget + Math.round((orbitAngle - baseTarget) / (Math.PI / 2)) * Math.PI / 2
        }
        if (state.event === 'p3-landing') {
          const side = state.assignment < 10 ? -1 : 1
          const landing = p3LandingPosition(state.assignment, WORLD.center)
          const assignedBoss = p3BossPosition(side, WORLD.center, 1)
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
      const jumpProgress = state.event === 'p2-jump' ? Math.min(1, state.eventTime / 1.4) : 0
      const heights = jumpHeights(jumpProgress, state.personalJumpProgress)
      const phaseTwo = state.event.startsWith('p2-')
      const phaseThree = state.event.startsWith('p3-')
      const phaseFour = state.event.startsWith('p4-')
      if ((state.event === 'p3-light-pools' || state.event === 'p3-pools-overlap') && p3PlayerSoakEngagedRound !== state.p3Round) {
        const playerSide: -1 | 1 = state.assignment < 10 ? -1 : 1
        if (p3PoolCenters(playerSide, WORLD.center, state.p3Round).some(pool => distance(state.player, pool) <= P3_POOL_RADIUS)) p3PlayerSoakEngagedRound = state.p3Round
      }
      const p4JumpHeight = state.event === 'p4-transition' ? Math.sin(Math.min(1, state.eventTime / P4_KNOCKUP_SECONDS) * Math.PI) * 30 : 0
      const p3FlightHeight = state.event === 'p3-flight' ? Math.sin(Math.min(1, state.eventTime / P3_FLIGHT_SECONDS) * Math.PI) * 46 : 0
      player.position.set(state.player.x, heights.player + p3FlightHeight + p4JumpHeight, state.player.y)
      boss.visible = !phaseTwo && !phaseFour
      ;(boss.material as THREE.MeshBasicMaterial).opacity = phaseThree ? .42 : .58
      ;(boss.material as THREE.MeshBasicMaterial).depthWrite = phaseThree
      p2Boss.visible = phaseTwo
      if (phaseFour) {
        p2Boss.visible = true
        p2Boss.position.set(WORLD.center.x, 10.5, WORLD.center.y)
      }
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
      playableFloor.visible = !phaseTwo && !phaseThree && !phaseFour
      arenaRings[1].visible = !phaseTwo && !phaseThree && !phaseFour
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
      if (playerCarriedCrystal) playerCarriedCrystal.visible = !phaseFour && state.playerIsCrystal && !state.playerCrystalSpent && !state.crystal
      const partnerNpcOrdinal = npcProfileIndices.findIndex(profileIndex => (profileIndex < 10) === (state.assignment < 10))
      const markedNpcOrdinals = npcProfileIndices.map((profileIndex, ordinal) => ({ profileIndex, ordinal }))
        .filter(candidate => (candidate.profileIndex < 10) === (state.assignment < 10) && candidate.ordinal !== partnerNpcOrdinal)
        .slice(0, 4)
        .map(candidate => candidate.ordinal)
      const plannedP3Pools = [[0, 0, 0], [0, 0, 0]]
      const playerLightActive = hasActiveP3CrystalLight(state.playerIsCrystal, state.playerCrystalSpent)
      const plannedP3Targets: Array<{ point: Point; crystal: boolean }> = [{ point: state.player, crystal: playerLightActive }]
      const npcPositions = npcs.map((sprite, index) => {
        const baseIndex = npcProfileIndices[index]
        const soakTarget = state.p2SoakPositions[baseIndex]
        const spreadTarget = state.p2SpreadPositions[baseIndex]
        const intermissionPosition = npcPosition(index, state.time, state.intermissionPositions, state.assignment, state.event, state.eventTime, state.beamAngles, state.raidStart, state.movementSpeed, state.movementBonus)
        const spreadResolutionPosition = walkTowards(WORLD.center, spreadTarget, P2_SPREAD_SECONDS, state.movementSpeed)
        const recoveredSoakPosition = state.p2Cycle === 1 ? soakTarget : walkTowards(spreadResolutionPosition, soakTarget, 8, state.movementSpeed)
        const p2WaitTarget = p2NpcShouldReturnToSoak(state.p2OrbReturnAge)
          ? soakTarget
          : p2NpcRoamingPosition(soakTarget, index, state.time, p2ReturningOrbPositions(state.p2OrbReturnAge, state.p2Cycle, state.time, WORLD.center), WORLD.center, P2_RADIUS - 2)
        let p3Target = p3NpcTarget(baseIndex, state.profiles[baseIndex].crystal, state.p3Round, state.event, state.eventTime, state.p4PatternSeed)
        let p4SplinterReturnBoost = false
        let p3RunePartnerApproach = false
        let p3RunePairApproach = false
        if (phaseFour) {
          p3Target = state.event === 'p4-cycle'
            ? p4GroupPosition(p4VisualCycle, state.eventTime, WORLD.center)
            : p4StackPosition(1, WORLD.center)
          if (state.event === 'p4-cycle' && index === 0) {
            const front = p4FrontSoakerPosition(p3Target, WORLD.center)
            const radialAngle = Math.atan2(p3Target.y - WORLD.center.y, p3Target.x - WORLD.center.x)
            const interceptOffset = Math.sin(state.time * 1.8) * 3
            p3Target = { x: front.x - Math.sin(radialAngle) * interceptOffset, y: front.y + Math.cos(radialAngle) * interceptOffset }
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
          const playerGroup = p3LandingGroupIndex(state.assignment)
          const npcGroup = p3LandingGroupIndex(baseIndex)
          const groupMembers = state.profiles.map((_, profileIndex) => profileIndex).filter(profileIndex => p3LandingGroupIndex(profileIndex) === npcGroup)
          const nonCrystalMembers = groupMembers.filter(profileIndex => !state.profiles[profileIndex].crystal)
          const crystalMember = groupMembers.find(profileIndex => state.profiles[profileIndex].crystal)
          const helperCandidates = [...nonCrystalMembers, ...groupMembers.filter(profileIndex => state.profiles[profileIndex].crystal)].filter(profileIndex => profileIndex !== state.assignment)
          const soaks = p3LandingSoakPositions(baseIndex, WORLD.center, state.p4PatternSeed)
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
          const side: -1 | 1 = baseIndex < 10 ? -1 : 1
          const sidePlayers = state.profiles
            .map((profile, profileIndex) => ({ profile, profileIndex }))
            .filter(candidate => (candidate.profileIndex < 10 ? -1 : 1) === side && candidate.profileIndex !== state.assignment)
            .map(candidate => candidate.profileIndex)
          const sideOrdinal = sidePlayers.indexOf(baseIndex)
          const playerSide = side === (state.assignment < 10 ? -1 : 1)
          const requiredPlayerPool = state.assignment % 3
          const sidePoolHealth = state.p3PoolHealth.slice(side < 0 ? 0 : 3, side < 0 ? 3 : 6)
          const npcSoaksActive = p3NpcSoaksActive(p3PlayerSoakEngagedRound === state.p3Round, state.p3Round, state.eventTime)
          const plannedCounts = plannedP3Pools[side < 0 ? 0 : 1]
          const poolIndex = npcSoaksActive ? p3NpcPoolAssignment(sideOrdinal, playerSide, requiredPlayerPool, sidePoolHealth, plannedCounts) : null
          if (poolIndex !== null) plannedCounts[poolIndex] += 1
          const poolCenter = poolIndex === null ? null : p3PoolCenters(side, WORLD.center, state.p3Round)[poolIndex]
          const spreadAngle = Math.max(0, sideOrdinal) * 2.399963
          p3Target = poolCenter
            ? { x: poolCenter.x + Math.cos(spreadAngle) * 6, y: poolCenter.y + Math.sin(spreadAngle) * 6 }
            : p3NpcTarget(baseIndex, state.profiles[baseIndex].crystal, state.p3Round, state.event, state.eventTime, state.p4PatternSeed)
        }
        if (state.event === 'p3-archangel-position' || state.event === 'p3-archangel') {
          const spreadOrigin = p3NpcTarget(baseIndex, state.profiles[baseIndex].crystal, state.p3Round, 'p3-big-boom', 0, state.p4PatternSeed)
          const travelTime = state.eventTime + (state.event === 'p3-archangel' ? 4 : 0)
          p3Target = walkTowards(spreadOrigin, p3Target, travelTime, state.movementSpeed)
        } else if (state.event === 'p3-sector-move') {
          const side: -1 | 1 = baseIndex < 10 ? -1 : 1
          const stackOrigin = p3ArchangelStackPosition(side, WORLD.center, state.p3Round)
          const transitionTarget = state.p3Round >= 2 ? p4StackPosition(1, WORLD.center) : p3Target
          p3Target = walkAroundArena(stackOrigin, transitionTarget, state.eventTime, state.movementSpeed * 2)
        }
        const runePartnerDelay = p3NpcRuneReactionDelay(state.p4PatternSeed, state.assignment, state.p3Round)
        if (state.event === 'p3-lattice-memory' && state.difficulty !== 'hard' && index === partnerNpcOrdinal && state.eventTime >= runePartnerDelay) p3Target = p3RunePartnerPosition(state.assignment, WORLD.center, state.p3Round)
        if (state.event === 'p3-light-pools' && state.difficulty !== 'hard' && state.eventTime >= P3_MEMORY_START_SECONDS && index === partnerNpcOrdinal) {
          const playerRune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
          const activeRune = state.p3RuneOrder[state.p3RuneStep]
          if (activeRune === playerRune && !state.p3ResolvedRunes.includes(playerRune) && state.eventTime >= P3_MEMORY_PANEL_SECONDS + runePartnerDelay) {
            const bossPoint = p3BossPosition(state.assignment < 10 ? -1 : 1, WORLD.center, state.p3Round)
            const towardBoss = { x: bossPoint.x - state.player.x, y: bossPoint.y - state.player.y }
            const towardBossLength = Math.hypot(towardBoss.x, towardBoss.y) || 1
            p3Target = { x: state.player.x + towardBoss.x / towardBossLength * 4, y: state.player.y + towardBoss.y / towardBossLength * 4 }
            p3RunePartnerApproach = true
          }
        }
        const pairOrdinal = markedNpcOrdinals.indexOf(index)
        if (state.event === 'p3-light-pools' && state.eventTime >= P3_MEMORY_PANEL_SECONDS && pairOrdinal >= 0) {
          const pair = Math.floor(pairOrdinal / 2)
          const playerRune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
          const otherRunes = (['T', 'X', 'O'] as RuneSymbol[]).filter(symbol => symbol !== playerRune)
          if (pairOrdinal % 2 === 1 && state.eventTime >= P3_MEMORY_START_SECONDS && state.p3RuneOrder[state.p3RuneStep] === otherRunes[pair]) {
            const stationaryNpc = markedNpcOrdinals[pairOrdinal - 1]
            p3Target = renderedNpcPositions[stationaryNpc] ?? p3Target
            p3RunePairApproach = true
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
        if (keepP3Formation) p3Target = separateP3NpcTarget(p3Target, state.profiles[baseIndex].crystal, plannedP3Targets, baseIndex)
        if (phaseThree) plannedP3Targets.push({ point: p3Target, crystal: state.profiles[baseIndex].crystal })
        if (state.event === 'p3-light-pools') {
          const stars = p3StarsTiming(state.eventTime)
          if (stars.active && stars.localTime >= 2.5 && stars.localTime <= 4.5) {
            const current = renderedNpcPositions[index] ?? p3Target
            p3Target = avoidP3Stars(current, p3Target, p3StarsField(baseIndex < 10 ? -1 : 1, state.p3Round, stars.cycle), index)
          }
        }
        const normal = phaseThree || phaseFour
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
        const forcedMovement = state.event === 'p2-jump' || state.event === 'p2-pull' || state.event === 'p3-flight'
        const p4Relocation = state.event === 'p4-cycle' ? p4RelocationProgress(p4VisualCycle, state.eventTime) : null
        const openingMultiplier = state.event === 'p3-sector-move'
          ? 2
          : state.event === 'p3-approach' ? 1.4
          : state.event === 'p4-transition' ? 4
          : p4SplinterReturnBoost ? 1
          : p3RunePartnerApproach ? .75
          : p4Relocation !== null ? p4NpcRelocationPace(p4Relocation * P4_HEAVEN_MOVE_SECONDS)
          : state.movementBonus && state.event === 'positioning' && state.eventTime <= OPENING_BOOST_SECONDS ? 1.4 : 1
        const phaseMovementSpeed = state.movementSpeed * (phaseFour && state.event === 'p4-cycle' ? P4_MOVEMENT_MULTIPLIER : 1)
        if (previousPosition && !forcedMovement) position = walkTowards(previousPosition, position, simulationDelta, phaseMovementSpeed * openingMultiplier)
        renderedNpcPositions[index] = position
        sprite.position.set(position.x, heights.npc + p3FlightHeight + p4JumpHeight, position.y)
        const pathTarget = phaseThree ? p3Target : state.event === 'p2-wait' ? p2WaitTarget : state.event === 'p2-orbs' ? soakTarget : state.event === 'p2-spread' ? spreadTarget : state.event === 'p2-pull' || state.event === 'p2-jump' ? WORLD.center : null
        if (pathTarget && distance(position, pathTarget) > .1) sprite.rotation.y = -Math.atan2(pathTarget.y - position.y, pathTarget.x - position.x)
        const glow = sprite.getObjectByName('crystal-glow')
        if (glow) glow.visible = !phaseFour && state.crystalCarriers.includes(index)
        const body = sprite.getObjectByName('role-body') as THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
        body.material.color.setHex(body.userData.baseColor)
        const carriedCrystal = sprite.getObjectByName('carried-crystal')
        if (carriedCrystal) {
          const droppedForP2Spread = state.event === 'p2-spread' && state.npcCrystals.length > 0
          carriedCrystal.visible = !phaseFour && state.crystalCarriers.includes(index) && !droppedForP2Spread && !(index === state.npcCarrier && state.npcCrystals.length)
        }
        return position
      })
      const npcP3LightCenters = phaseThree
        ? npcPositions.filter((_, npcIndex) => state.profiles[npcProfileIndices[npcIndex]].crystal)
        : []
      state.onP3LightCenters(npcP3LightCenters)
      if (state.event === 'p3-light-pools' || state.event === 'p3-pools-overlap') {
        const occupancy = ([-1, 1] as const).flatMap(side => p3PoolCenters(side, WORLD.center, state.p3Round).map(pool => npcPositions.filter(position => distance(position, pool) <= P3_POOL_RADIUS).length))
        state.onP3PoolOccupancy(occupancy)
      }
      if (state.event === 'p3-light-pools' && state.eventTime >= P3_MEMORY_START_SECONDS || state.event === 'p3-lattice-memory') {
        const rune = (['T', 'X', 'O'] as RuneSymbol[])[state.assignment % 3]
        const contacts: RuneSymbol[] = []
        if (distance(state.player, npcPositions[partnerNpcOrdinal]) <= 4.5) contacts.push(rune)
        const otherRunes = (['T', 'X', 'O'] as RuneSymbol[]).filter(symbol => symbol !== rune)
        const localNpcOrdinals = npcPositions
          .map((_, npcIndex) => npcIndex)
          .filter(npcIndex => npcIndex !== partnerNpcOrdinal && (npcProfileIndices[npcIndex] < 10) === (state.assignment < 10))
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
      const assigned = phaseFour ? p4Stack : p2SpreadGuide ? state.p2SpreadPositions[state.assignment] : recurringP2Guide ? state.p2SoakPositions[state.assignment] : state.positions[state.assignment]
      if (state.event === 'p3-approach' && distance(state.player, assigned) <= 14) p3OpeningReached = true
      const p3Opening = phaseThree && state.event === 'p3-approach' && !p3OpeningReached
      const opening = state.event === 'countdown' || state.event === 'positioning' || state.event === 'p2-countdown' || state.event === 'p2-positioning' || state.event === 'p4-transition' || p2SpreadGuide || recurringP2Guide || p3Opening
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
            let bestHits = Infinity
            for (let step = 0; step < 12; step++) {
              const candidate = step * Math.PI / 36
              const hits = obstacles.filter(point => rayHits(point, origin, candidate)).length
              if (hits < bestHits) { bestHits = hits; rotation = candidate }
            }
          }
          for (let i = 0; i < 6; i++) addSplinterWedge(hazards, origin, rotation + i * Math.PI / 3, STAR_LENGTH, 0x67baff, .9 * Math.max(0, fade))
        })
      }
      if (phaseTwo) {
        const afterOrbResolution = state.event === 'p2-recover' || state.event === 'p2-pull' || state.event === 'p2-spread' || state.event === 'p2-fetch' || state.event === 'p2-wait'
        const firstVisibleOrb = Math.min(12, (state.p2Cycle - 1 + (afterOrbResolution ? 1 : 0)) * 4)
        for (let index = firstVisibleOrb; index < 12; index++) {
          const angle = index % 4 * Math.PI / 2 + Math.floor(index / 4) * Math.PI / 6 + orbitAngle
          const currentBeamTarget = state.event === 'p2-orbs' && index < state.p2Cycle * 4
          addOrb(hazards, { x: WORLD.center.x + Math.cos(angle) * 82, y: WORLD.center.y + Math.sin(angle) * 82 }, currentBeamTarget ? 0x70edff : 0xb170ff)
        }
        const returning = p2OrbReturnState(state.p2OrbReturnAge)
        if (returning.phase === 'orbiting' || returning.phase === 'charging' || returning.phase === 'returning') {
          p2ReturningOrbPositions(state.p2OrbReturnAge, state.p2Cycle, state.time, WORLD.center).forEach((point, localIndex) => {
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
            addGroundRing(hazards, WORLD.center, pulseRadius - 2, pulseRadius + 2, 0xffefa2, 1 - (state.p2OrbReturnAge - returnImpact) * 1.5, 4)
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
        const playerSide: -1 | 1 = state.assignment < 10 ? -1 : 1
        const landingGroups = new Set([p3LandingGroupIndex(state.assignment), ...state.profiles.map((profile, index) => profile.crystal ? p3LandingGroupIndex(index) : -1).filter(group => group >= 0)])
        const landingSoaks = [...landingGroups].flatMap(group => {
          const representative = state.profiles.findIndex((_, index) => p3LandingGroupIndex(index) === group)
          return p3LandingSoakPositions(representative, WORLD.center, state.p4PatternSeed)
        })
        if (state.event === 'p3-landing') landingSoaks.forEach((point, index) => {
          const occupied = [state.player, ...npcPositions].some(playerPoint => distance(playerPoint, point) <= P3_LANDING_SOAK_RADIUS)
          const emptyPulse = .55 + Math.sin(state.time * 5 + index) * .25
          addGroundDisc(hazards, point, P3_LANDING_SOAK_RADIUS, occupied ? 0xf3bd16 : 0xffee8a, occupied ? .3 : .16 + emptyPulse * .12)
          addGroundRing(hazards, point, P3_LANDING_SOAK_RADIUS - (occupied ? 1.6 : 2.4), P3_LANDING_SOAK_RADIUS, occupied ? 0xffc928 : 0xffffc2, occupied ? .86 : emptyPulse)
          const drop = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffe66c }))
          drop.position.set(point.x, Math.max(3, 55 * (1 - state.eventTime / 3)) + index * 4, point.y)
          hazards.add(drop)
        })
        if (state.event !== 'p3-countdown' && state.event !== 'p3-flight' && state.event !== 'p3-landing') {
          const carrierLights = [...npcP3LightCenters]
          if (playerLightActive) carrierLights.push(state.player)
          carrierLights.forEach(point => {
            addGroundDisc(hazards, point, P3_LIGHT_RADIUS, 0xffd94a, .09, 2.1)
            addGroundRing(hazards, point, P3_LIGHT_RADIUS - 1.1, P3_LIGHT_RADIUS, 0xffefa1, .36, 2.25)
          })
        }
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
            return (baseIndex < 10 ? -1 : 1) === playerSide
          }).slice(0, 4)
          localNpcs.forEach((point, index) => {
            const npcRune = npcRunes[index]
            if (!state.p3ResolvedRunes.includes(npcRune)) addRuneMarker(hazards, point, runeTextures[npcRune], activeRune === npcRune)
          })
        }
        if (state.event === 'p3-big-boom') {
          const progress = THREE.MathUtils.clamp(state.eventTime, 0, 1)
          addGroundRing(hazards, WORLD.center, WORLD.innerRadius + progress * (P3_OUTER_RADIUS - WORLD.innerRadius) - 4, WORLD.innerRadius + progress * (P3_OUTER_RADIUS - WORLD.innerRadius) + 4, 0xd999ff, .92 - progress * .45, 4)
        }
        if (state.p3Round > 1 || state.event === 'p3-sector-move') {
          const armProgress = state.p3Round > 1 ? 1 : THREE.MathUtils.clamp(state.eventTime / 4.5, 0, 1)
          const pulse = .04 * Math.sin(state.time * 7)
          const consumed = new THREE.Mesh(new THREE.RingGeometry(WORLD.innerRadius, P3_OUTER_RADIUS, 64, 1, Math.PI * 7 / 6, Math.PI * 2 / 3), new THREE.MeshBasicMaterial({ color: 0x8f1aac, transparent: true, opacity: .18 + armProgress * .42 + pulse, depthWrite: false, side: THREE.DoubleSide }))
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
          const frontConeActive = p4TankConeActive(state.eventTime)
          if (frontConeActive) addFrontalCone(hazards, frontSoaker, frontConeAngle, P4_FRONT_CONE_RANGE, 0xffdc67, .46)
          for (const boxState of boxes) {
            if (!boxState.active) continue
            if (p4TankKillsBox(boxState.position, frontSoaker)) destroyedP4BoxIds.add(boxState.id)
            if (destroyedP4BoxIds.has(boxState.id)) continue
            if (boxState.aimedAtGroup && distance(boxState.position, frontSoaker) <= P4_FRONT_CONE_RANGE) continue
            const height = boxState.size * .5
            const box = new THREE.Mesh(new THREE.BoxGeometry(boxState.size, height, boxState.size), new THREE.MeshBasicMaterial({ color: 0x9edaff, transparent: true, opacity: .76 }))
            box.position.set(boxState.position.x, height / 2 + 2.6, boxState.position.y)
            hazards.add(box)
          }
          for (let ordinal = 0; ordinal < 3; ordinal++) {
            const age = p4SplinterAge(p4VisualCycle, state.eventTime, ordinal)
            if (age < 0 || age > P4_SPLINTER_DETONATION_SECONDS) continue
            const playerDuty = p4PlayerSplinterDuty(state.assignment, p4VisualCycle, state.p4PatternSeed) === ordinal
            const origin = playerDuty ? state.player : npcPositions[Math.min(npcPositions.length - 1, ordinal * 3 + 1)]
            const rotation = p4SplinterRotation(p4VisualCycle, ordinal, state.p4PatternSeed)
            const explosionOpacity = age < P4_SPLINTER_DETONATION_SECONDS - .45 ? .11 : .95 - (age - (P4_SPLINTER_DETONATION_SECONDS - .45)) / .45 * .5
            for (let ray = 0; ray < 6; ray++) addSplinterWedge(hazards, origin, rotation + ray * Math.PI / 3, 42, 0x67cfff, explosionOpacity)
          }
          const consumedCycles = p4VisualCycle - 1 + (state.eventTime >= P4_HEAVEN_START_SECONDS ? 1 : 0)
          for (let consumedCycle = 1; consumedCycle <= consumedCycles; consumedCycle++) {
            const sectorGap = .035
            const sectorStart = Math.PI / 4 + (consumedCycle - 1) * Math.PI / 2 + sectorGap / 2
            const voidZone = new THREE.Mesh(new THREE.RingGeometry(WORLD.innerRadius, P3_OUTER_RADIUS, 64, 1, sectorStart, Math.PI / 2 - sectorGap), new THREE.MeshBasicMaterial({ color: 0x7d164f, transparent: true, opacity: .48, depthWrite: false, side: THREE.DoubleSide }))
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
      clearGroup(hazards)
      transientGeometryCache.forEach(geometry => geometry.dispose())
      transientGeometryCache.clear()
      p3StarsFieldCache.clear()
      beamMarkerTextures.forEach(texture => texture.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={host} className="scene-3d" aria-label="3D L'ura Intermission arena" />
}
