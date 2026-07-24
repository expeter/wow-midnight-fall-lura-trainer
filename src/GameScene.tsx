import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { assignmentRevealDistance, crystalCarrierPosition, distance, npcEntryPosition, OPENING_BOOST_SECONDS, roamingNpcPosition, type Difficulty, type PlayerClass, type PlayerProfile, type Point } from './game'

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
  p2Cycle: number
  crystalCarriers: number[]
  playerIsCrystal: boolean
  player: Point
  crystal: Point | null
  npcCrystals: Point[]
  npcCarrier: number | null
  npcCrystalAge: number
  playerSplinterRotation: number
  crystalAge: number
  event: 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait'
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
const P2_ORBIT_SPEED = .12
const STAR_LENGTH = WORLD.outerRadius * .2
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
function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children.pop()!
    const mesh = child as THREE.Mesh
    mesh.geometry?.dispose()
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
function addGroundRing(group: THREE.Group, point: Point, inner: number, outer: number, color: number, opacity: number) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }))
  ring.rotation.x = -Math.PI / 2
  ring.position.set(point.x, 2.7, point.y)
  group.add(ring)
}
function addOrb(group: THREE.Group, point: Point, color = 0xb170ff) {
  const orb = new THREE.Mesh(new THREE.SphereGeometry(5.4, 20, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .92 }))
  orb.position.set(point.x, 7, point.y)
  group.add(orb)
  addGroundRing(group, point, 6, 9, color, .42)
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
  const shape = new THREE.Shape()
  shape.moveTo(0, -3.6)
  shape.lineTo(length, -.72)
  shape.lineTo(length, .72)
  shape.lineTo(0, 3.6)
  shape.closePath()
  const wedge = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }))
  wedge.rotation.x = -Math.PI / 2
  wedge.rotation.z = -angle
  wedge.position.set(origin.x, 2.5, origin.y)
  group.add(wedge)
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
  group.scale.setScalar(.95)
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
    const camera = new THREE.PerspectiveCamera(55, (element.clientWidth || 760) / (element.clientHeight || 540), 1, 1400)
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

    const beamMarkerTextures = [
      makeMarkerTexture('✕', '#ff5757'),
      makeMarkerTexture('☠', '#f1f1f1'),
      makeMarkerTexture('★', '#ffe064'),
      makeMarkerTexture('●', '#ff923d'),
    ]
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
    const npcCrystalSprites = Array.from({ length: 2 }, () => { const object = makeCrystal(); object.scale.setScalar(.9); object.visible = false; scene.add(object); return object })
    const helper = new THREE.Mesh(new THREE.RingGeometry(22, 25, 40), new THREE.MeshBasicMaterial({ color: 0x73e0c1, transparent: true, opacity: .8, side: THREE.DoubleSide }))
    helper.rotation.x = -Math.PI / 2
    scene.add(helper)

    const hazards = new THREE.Group()
    scene.add(hazards)
    let animation = 0
    const renderedNpcPositions: Array<Point | null> = Array.from({ length: 19 }, () => null)
    let previousSimulationTime = initial.time
    let previousRenderTime = performance.now()
    let orbitAngle = 0
    let orbitSoakStart = 0
    let orbitSoakTarget = 0
    let previousEvent: SceneProps['event'] = initial.event
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
      if (state.time < previousSimulationTime) renderedNpcPositions.fill(null)
      const simulationDelta = Math.min(.15, Math.max(0, state.time - previousSimulationTime))
      previousSimulationTime = state.time
      const renderTime = performance.now()
      const renderDelta = Math.min((renderTime - previousRenderTime) / 1000, .05)
      previousRenderTime = renderTime
      if (state.event !== previousEvent) {
        if (state.event === 'p2-orbs') {
          orbitSoakStart = orbitAngle
          const baseTarget = -(state.p2Cycle - 1) * Math.PI / 6
          orbitSoakTarget = baseTarget + Math.round((orbitAngle - baseTarget) / (Math.PI / 2)) * Math.PI / 2
        }
        previousEvent = state.event
      }
      if (state.event === 'p2-orbs') {
        const progress = THREE.MathUtils.clamp(state.eventTime / 6, 0, 1)
        const eased = progress * progress * (3 - 2 * progress)
        orbitAngle = THREE.MathUtils.lerp(orbitSoakStart, orbitSoakTarget, eased)
      } else if (state.event.startsWith('p2-')) orbitAngle += renderDelta * P2_ORBIT_SPEED
      const jumpProgress = state.event === 'p2-jump' ? Math.min(1, state.eventTime / 1.4) : 0
      const jumpHeight = state.event === 'p2-jump' ? Math.sin(jumpProgress * Math.PI) * 42 : 0
      player.position.set(state.player.x, jumpHeight, state.player.y)
      const phaseTwo = state.event.startsWith('p2-')
      boss.visible = !phaseTwo
      p2Boss.visible = phaseTwo
      innerVoid.visible = !phaseTwo
      playableFloor.visible = !phaseTwo
      arenaRings[1].visible = !phaseTwo
      p2Floor.visible = phaseTwo
      floatingMarkers.forEach(({ icon, glow }, index) => {
        const height = 31 + Math.sin(state.time * 3.6 + index * 1.4) * 2.5
        icon.position.y = height
        glow.position.y = height
        glow.scale.setScalar(1 + Math.sin(state.time * 3.6 + index * 1.4) * .08)
      })
      const playerBody = player.getObjectByName('role-body') as THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
      playerBody.material.color.setHex(playerBody.userData.baseColor)
      const playerCarriedCrystal = player.getObjectByName('carried-crystal')
      if (playerCarriedCrystal) playerCarriedCrystal.visible = state.playerIsCrystal && !state.crystal
      const npcPositions = npcs.map((sprite, index) => {
        const baseIndex = Array.from({ length: 20 }, (_, positionIndex) => positionIndex).filter(positionIndex => positionIndex !== state.assignment)[index]
        const soakTarget = state.p2SoakPositions[baseIndex]
        const spreadTarget = state.p2SpreadPositions[baseIndex]
        const intermissionPosition = npcPosition(index, state.time, state.intermissionPositions, state.assignment, state.event, state.eventTime, state.beamAngles, state.raidStart, state.movementSpeed, state.movementBonus)
        const spreadResolutionPosition = walkTowards(WORLD.center, spreadTarget, 3, state.movementSpeed)
        const recoveredSoakPosition = state.p2Cycle === 1 ? soakTarget : walkTowards(spreadResolutionPosition, soakTarget, 8, state.movementSpeed)
        const normal = state.event === 'p2-countdown'
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
                  ? walkTowards(recoveredSoakPosition, WORLD.center, Math.pow(state.eventTime / 5, 3) * distance(recoveredSoakPosition, WORLD.center) / state.movementSpeed, state.movementSpeed)
                  : state.event === 'p2-spread'
                    ? walkTowards(WORLD.center, spreadTarget, state.eventTime, state.movementSpeed)
                    : state.event === 'p2-fetch'
                      ? spreadResolutionPosition
                      : state.event === 'p2-wait'
                        ? walkTowards(spreadResolutionPosition, soakTarget, state.eventTime, state.movementSpeed)
                        : phaseTwo ? soakTarget : intermissionPosition
        let position = state.event === 'p2-jump'
          ? { x: intermissionPosition.x + (WORLD.center.x - intermissionPosition.x) * (1 - Math.pow(1 - jumpProgress, 3)), y: intermissionPosition.y + (WORLD.center.y - intermissionPosition.y) * (1 - Math.pow(1 - jumpProgress, 3)) }
          : normal
        const dropped = state.npcCrystals[0]
        if (index === state.npcCarrier && dropped) {
          position = crystalCarrierPosition(normal, dropped, state.npcCrystalAge, index, WORLD.center, state.movementSpeed)
        }
        const previousPosition = renderedNpcPositions[index]
        const forcedMovement = state.event === 'p2-jump' || state.event === 'p2-pull'
        const openingMultiplier = state.movementBonus && state.event === 'positioning' && state.eventTime <= OPENING_BOOST_SECONDS ? 1.4 : 1
        if (previousPosition && !forcedMovement) position = walkTowards(previousPosition, position, simulationDelta, state.movementSpeed * openingMultiplier)
        renderedNpcPositions[index] = position
        sprite.position.set(position.x, jumpHeight, position.y)
        const pathTarget = state.event === 'p2-wait' || state.event === 'p2-orbs' ? soakTarget : state.event === 'p2-spread' ? spreadTarget : state.event === 'p2-pull' || state.event === 'p2-jump' ? WORLD.center : null
        if (pathTarget && distance(position, pathTarget) > .1) sprite.rotation.y = -Math.atan2(pathTarget.y - position.y, pathTarget.x - position.x)
        const glow = sprite.getObjectByName('crystal-glow')
        if (glow) glow.visible = state.crystalCarriers.includes(index)
        const body = sprite.getObjectByName('role-body') as THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
        body.material.color.setHex(body.userData.baseColor)
        const carriedCrystal = sprite.getObjectByName('carried-crystal')
        if (carriedCrystal) carriedCrystal.visible = state.crystalCarriers.includes(index) && !(index === state.npcCarrier && state.npcCrystals.length)
        return position
      })
      crystal.visible = Boolean(state.crystal)
      if (state.crystal) crystal.position.set(state.crystal.x, 2.5, state.crystal.y)
      npcCrystalSprites.forEach((sprite, index) => { const point = state.npcCrystals[index]; sprite.visible = Boolean(point); if (point) sprite.position.set(point.x, 2.25, point.y) })
      const recurringP2Guide = state.p2Cycle > 1 && (state.event === 'p2-wait' || state.event === 'p2-orbs' && state.eventTime < 2.5)
      const assigned = recurringP2Guide ? state.p2SoakPositions[state.assignment] : state.positions[state.assignment]
      const opening = state.event === 'countdown' || state.event === 'positioning' || state.event === 'p2-countdown' || state.event === 'p2-positioning' || recurringP2Guide
      const revealDistance = phaseTwo ? state.difficulty === 'normal' ? 14 : state.difficulty === 'hard' ? 7 : Infinity : assignmentRevealDistance(state.difficulty)
      helper.visible = opening && (state.easy || distance(state.player, assigned) <= revealDistance)
      helper.scale.setScalar(phaseTwo ? .55 : 1)
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
        const pullProgress = THREE.MathUtils.clamp(state.eventTime / 5, 0, 1)
        addGroundRing(hazards, WORLD.center, 8 + pullProgress * 15, 10 + pullProgress * 15, 0xd981ff, .72)
      }
      if (state.event === 'p2-spread') {
        addGroundRing(hazards, state.player, 11.55, 12.16, 0xff6f9e, .82)
        npcPositions.forEach(point => addGroundRing(hazards, point, 11.55, 12.16, 0xff6f9e, .52))
        if (state.playerIsCrystal) addGroundRing(hazards, WORLD.center, 4, 8, 0xffe05a, .65)
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
      camera.lookAt(state.player.x, jumpHeight + 5, state.player.y)
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
      beamMarkerTextures.forEach(texture => texture.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={host} className="scene-3d" aria-label="3D L'ura Intermission arena" />
}
