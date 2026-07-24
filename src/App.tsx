import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { bossBeamHitsPlayer, canPickupCrystal, canRecoverFromWipe, crystalCarrierPosition, crystalWipeReason, difficultySettings, distance, healthEmergencyLimit, isInSafeAnnulus, moveRelativeToCamera, moveWithIncreasingPull, npcEntryPosition, OPENING_BOOST_SECONDS, orientedAssignments, PLAYER_COLLISION_PENALTY, roamingNpcPosition, WIPE_PENALTY, type Difficulty, type PlayerClass, type PlayerProfile, type Point, type Role } from './game'
import GameScene from './GameScene'
import './styles.css'

type Screen = 'menu' | 'game' | 'results'
type EventKind = 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait'
type EntryMode = 'arena1' | 'arena2'
const HEALTH_REACTION_EVENTS = new Set<EventKind>(['beam', 'splinter', 'p2-orbs', 'p2-recover', 'p2-pull', 'p2-spread', 'p2-fetch'])
interface GameStats { score: number; hits: number; crystalDropped: boolean; time: number }
interface Assignment { x: number; y: number }
interface Mistake { id: number; time: number; label: string; penalty: number }
interface KeyBindings { forward: string; backward: string; left: string; right: string; crystal: string; pause: string; healthPot: string; shield: string; mainAbility: string }
type HudElement = 'mechanic' | 'beam' | 'crystal' | 'playerHealth' | 'bossHealth'
type HudLayout = Record<HudElement, Point>

const WORLD = { width: 960, height: 540, center: { x: 480, y: 270 }, innerRadius: 102, outerRadius: 169 }
const P2_RADIUS = WORLD.innerRadius * .54
const P2_ASSIGNMENT_RADIUS = P2_RADIUS - 6
const P2_CRYSTAL_SPREAD_RADIUS = 28
const P2_MAP_SCALE = { x: 3.34, y: 1.88 }
const STAR_LENGTH = WORLD.outerRadius * 2 * .1
const DEFAULT_ASSIGNMENTS: Assignment[] = [
  ...Array.from({ length: 8 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 8; return { x: WORLD.center.x + Math.cos(a) * 125, y: WORLD.center.y + Math.sin(a) * 125 } }),
  ...Array.from({ length: 12 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 12; return { x: WORLD.center.x + Math.cos(a) * 153, y: WORLD.center.y + Math.sin(a) * 153 } }),
]
const DEFAULT_P2_ASSIGNMENTS: Assignment[] = [
  ...[9, 19, 29, 39, 49].map(radius => ({ x: WORLD.center.x - radius, y: WORLD.center.y })),
  ...[9, 19, 29, 39, 49].map(radius => ({ x: WORLD.center.x + radius, y: WORLD.center.y })),
  ...[9, 19, 29, 39, 49].map(radius => ({ x: WORLD.center.x, y: WORLD.center.y - radius })),
  ...[9, 19, 29, 39, 49].map(radius => ({ x: WORLD.center.x, y: WORLD.center.y + radius })),
]
const DEFAULT_P2_SPREAD_ASSIGNMENTS: Assignment[] = [
  ...Array.from({ length: 20 }, (_, index) => {
    const crystalOrdinal = [1, 4, 7, 10, 13, 16].indexOf(index)
    const nonCrystalIndices = Array.from({ length: 20 }, (__, playerIndex) => playerIndex).filter(playerIndex => ![1, 4, 7, 10, 13, 16].includes(playerIndex))
    const nonCrystalOrdinal = nonCrystalIndices.indexOf(index)
    const isCrystal = crystalOrdinal >= 0
    const count = isCrystal ? 6 : 14
    const ordinal = isCrystal ? crystalOrdinal : nonCrystalOrdinal
    const radius = isCrystal ? P2_CRYSTAL_SPREAD_RADIUS : 49
    const angle = -Math.PI / 2 + ordinal * Math.PI * 2 / count
    return { x: WORLD.center.x + Math.cos(angle) * radius, y: WORLD.center.y + Math.sin(angle) * radius }
  }),
]
const DEFAULT_START_SLOTS: Assignment[] = [
  { x: WORLD.center.x, y: WORLD.center.y + 222 },
  { x: WORLD.center.x - 222, y: WORLD.center.y },
  { x: WORLD.center.x, y: WORLD.center.y - 222 },
  { x: WORLD.center.x + 222, y: WORLD.center.y },
]
const CLASS_OPTIONS: { value: PlayerClass; label: string; color: string }[] = [
  { value: 'mage', label: 'Mage', color: '#3fc7eb' },
  { value: 'warlock', label: 'Warlock', color: '#8788ee' },
  { value: 'augmentation', label: 'Augmentation', color: '#33937f' },
  { value: 'priest', label: 'Priest', color: '#ffffff' },
  { value: 'death-knight', label: 'Death Knight', color: '#c41e3a' },
  { value: 'demon-hunter', label: 'Demon Hunter', color: '#a330c9' },
  { value: 'warrior', label: 'Warrior', color: '#c69b6d' },
  { value: 'paladin', label: 'Paladin', color: '#f48cba' },
  { value: 'druid', label: 'Druid', color: '#ff7c0a' },
  { value: 'evoker', label: 'Evoker', color: '#33937f' },
  { value: 'shaman', label: 'Shaman', color: '#0070dd' },
  { value: 'hunter', label: 'Hunter', color: '#aad372' },
  { value: 'monk', label: 'Monk', color: '#00ff98' },
]
const DEFAULT_PROFILES: PlayerProfile[] = Array.from({ length: 20 }, (_, index) => ({
  name: `Player ${index + 1}`,
  playerClass: CLASS_OPTIONS[index % CLASS_OPTIONS.length].value,
  crystal: [1, 4, 7, 10, 13, 16].includes(index),
}))
const DEFAULT_KEY_BINDINGS: KeyBindings = { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', crystal: 'KeyE', pause: 'Space', healthPot: 'KeyQ', shield: 'KeyR', mainAbility: 'KeyF' }
const DEFAULT_HUD_LAYOUT: HudLayout = {
  mechanic: { x: 50, y: 24 },
  beam: { x: 50, y: 39 },
  crystal: { x: 50, y: 74 },
  playerHealth: { x: 50, y: 86 },
  bossHealth: { x: 50, y: 10 },
}
const KEY_BIND_LABELS: { action: keyof KeyBindings; label: string }[] = [
  { action: 'forward', label: 'Forward' }, { action: 'backward', label: 'Backward' },
  { action: 'left', label: 'Strafe left' }, { action: 'right', label: 'Strafe right' },
  { action: 'crystal', label: 'Drop crystal' }, { action: 'pause', label: 'Pause / resume' },
  { action: 'healthPot', label: 'Health potion' }, { action: 'shield', label: 'Shield' },
  { action: 'mainAbility', label: 'Main ability' },
]
function loadKeyBindings(): KeyBindings {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-keybindings') || 'null')
    if (saved) return Object.fromEntries(Object.entries(DEFAULT_KEY_BINDINGS).map(([key, fallback]) => [key, typeof saved[key] === 'string' ? saved[key] : fallback])) as unknown as KeyBindings
  } catch { /* use defaults */ }
  return { ...DEFAULT_KEY_BINDINGS }
}
function loadBoolean(key: string, fallback: boolean) {
  const saved = localStorage.getItem(key)
  return saved === null ? fallback : saved === 'true'
}
function loadHudLayout(): HudLayout {
  const keys: HudElement[] = ['mechanic', 'beam', 'crystal', 'playerHealth', 'bossHealth']
  try {
    const saved = JSON.parse(localStorage.getItem('lura-hud-layout') || 'null')
    if (saved) {
      return Object.fromEntries(keys.map(key => [key, {
        x: Math.max(5, Math.min(95, Number.isFinite(saved[key]?.x) ? saved[key].x : DEFAULT_HUD_LAYOUT[key].x)),
        y: Math.max(7, Math.min(93, Number.isFinite(saved[key]?.y) ? saved[key].y : DEFAULT_HUD_LAYOUT[key].y)),
      }])) as HudLayout
    }
  } catch { /* use defaults */ }
  return structuredClone(DEFAULT_HUD_LAYOUT)
}
function keyLabel(code: string) {
  return code === 'Space' ? 'Space' : code.replace(/^Key/, '').replace(/^Digit/, '')
}
const ARENA_BACKGROUND = new URL('../images/midnight_falls.png', import.meta.url).href
function loadPositions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-player-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved.map(clampToSafeBand)
  } catch { /* use defaults */ }
  return DEFAULT_ASSIGNMENTS.map(point => ({ ...point }))
}
function loadP2Positions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p2-player-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved.map(clampToP2Arena)
  } catch { /* use defaults */ }
  return DEFAULT_P2_ASSIGNMENTS.map(point => ({ ...point }))
}
function loadP2SpreadPositions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p2-spread-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved.map(clampToP2Arena)
  } catch { /* use defaults */ }
  return DEFAULT_P2_SPREAD_ASSIGNMENTS.map(point => ({ ...point }))
}
function clampToSafeBand(point: Assignment): Assignment {
  const dx = point.x - WORLD.center.x
  const dy = point.y - WORLD.center.y
  const radius = Math.hypot(dx, dy) || 1
  const safeRadius = Math.max(WORLD.innerRadius + 16, Math.min(WORLD.outerRadius - 13, radius))
  return { x: WORLD.center.x + dx / radius * safeRadius, y: WORLD.center.y + dy / radius * safeRadius }
}
function loadCrystalAssignments(): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-crystal-assignments') || 'null')
    if (Array.isArray(saved)) return saved.filter(value => Number.isInteger(value) && value >= 0 && value < 20)
  } catch { /* use defaults */ }
  return [1, 4, 7, 10, 13, 16]
}
function loadProfiles(): PlayerProfile[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-player-profiles') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(profile => typeof profile.name === 'string' && typeof profile.crystal === 'boolean' && CLASS_OPTIONS.some(option => option.value === profile.playerClass))) return saved
  } catch { /* use defaults */ }
  const legacyCrystals = loadCrystalAssignments()
  return DEFAULT_PROFILES.map((profile, index) => ({ ...profile, crystal: legacyCrystals.includes(index) }))
}
function loadAssignment(): number {
  const saved = Number(localStorage.getItem('lura-selected-position'))
  return Number.isInteger(saved) && saved >= 0 && saved < 20 ? saved : 0
}
function encodeRaidPlan(value: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(value)))
}
function decodeRaidPlan(value: string): { positions: Assignment[]; p2Positions: Assignment[]; p2SpreadPositions: Assignment[]; startSlots: Assignment[]; profiles: PlayerProfile[] } | null {
  try {
    const raw = value.includes('#raidplan=') ? value.split('#raidplan=')[1] : value
    const plan = JSON.parse(decodeURIComponent(atob(raw.trim())))
    if (!Array.isArray(plan.positions) || plan.positions.length !== 20 || !Array.isArray(plan.startSlots) || plan.startSlots.length !== 4 || !Array.isArray(plan.profiles) || plan.profiles.length !== 20) return null
    if (!plan.positions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) || !plan.startSlots.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y))) return null
    if (!plan.profiles.every((profile: PlayerProfile) => typeof profile.name === 'string' && typeof profile.crystal === 'boolean' && CLASS_OPTIONS.some(option => option.value === profile.playerClass))) return null
    const p2Positions = Array.isArray(plan.p2Positions) && plan.p2Positions.length === 20 && plan.p2Positions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? plan.p2Positions : DEFAULT_P2_ASSIGNMENTS
    const p2SpreadPositions = Array.isArray(plan.p2SpreadPositions) && plan.p2SpreadPositions.length === 20 && plan.p2SpreadPositions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? plan.p2SpreadPositions : DEFAULT_P2_SPREAD_ASSIGNMENTS
    return { ...plan, p2Positions, p2SpreadPositions }
  } catch { return null }
}
function loadStartSlots(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-start-slots') || 'null')
    if (Array.isArray(saved) && saved.length === 4 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved.map(clampStartSlot)
  } catch { /* use defaults */ }
  return DEFAULT_START_SLOTS.map(point => ({ ...point }))
}
function clampStartSlot(point: Assignment): Assignment {
  const dx = point.x - WORLD.center.x
  const dy = point.y - WORLD.center.y
  const radius = Math.hypot(dx, dy) || 1
  const outsideRadius = Math.max(WORLD.outerRadius + 28, Math.min(240, radius))
  return { x: WORLD.center.x + dx / radius * outsideRadius, y: WORLD.center.y + dy / radius * outsideRadius }
}
function clampToP2Arena(point: Assignment): Assignment {
  const dx = point.x - WORLD.center.x
  const dy = point.y - WORLD.center.y
  const radius = Math.hypot(dx, dy) || 1
  if (radius <= P2_ASSIGNMENT_RADIUS) return point
  return { x: WORLD.center.x + dx / radius * P2_ASSIGNMENT_RADIUS, y: WORLD.center.y + dy / radius * P2_ASSIGNMENT_RADIUS }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [entryMode, setEntryMode] = useState<EntryMode>('arena1')
  const [movementSpeed, setMovementSpeed] = useState(15)
  const [gameSpeed, setGameSpeed] = useState(() => {
    const saved = Number(localStorage.getItem('lura-game-speed'))
    return Number.isFinite(saved) && saved >= 1 && saved <= 2.5 ? saved : 1
  })
  const [movementBonus, setMovementBonus] = useState(() => loadBoolean('lura-opening-speed-bonus', true))
  const [hudLayout, setHudLayout] = useState(loadHudLayout)
  const [healthPotEnabled, setHealthPotEnabled] = useState(() => loadBoolean('lura-health-pot-enabled', false))
  const [shieldEnabled, setShieldEnabled] = useState(() => loadBoolean('lura-shield-enabled', false))
  const [mainAbilityEnabled, setMainAbilityEnabled] = useState(() => loadBoolean('lura-main-ability-enabled', false))
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(loadKeyBindings)
  const [assignment, setAssignment] = useState(loadAssignment)
  const [positions, setPositions] = useState<Assignment[]>(loadPositions)
  const [phasePositions, setPhasePositions] = useState<Assignment[]>(positions)
  const [p2Positions, setP2Positions] = useState<Assignment[]>(loadP2Positions)
  const [p2SpreadPositions, setP2SpreadPositions] = useState<Assignment[]>(loadP2SpreadPositions)
  const [startSlots, setStartSlots] = useState<Assignment[]>(loadStartSlots)
  const [profiles, setProfiles] = useState<PlayerProfile[]>(loadProfiles)
  const [shareInput, setShareInput] = useState('')
  const [shareStatus, setShareStatus] = useState('')
  const crystalAssignments = profiles.map((profile, index) => profile.crystal ? index : -1).filter(index => index >= 0)
  const [stats, setStats] = useState<GameStats>({ score: 1000, hits: 0, crystalDropped: false, time: 0 })
  const [paused, setPaused] = useState(false)
  const [player, setPlayer] = useState<Point>(positions[0])
  const [crystal, setCrystal] = useState<Point | null>(null)
  const [event, setEvent] = useState<EventKind>('beam')
  const [eventTime, setEventTime] = useState(0)
  const [beamAngles, setBeamAngles] = useState<number[]>(createBossBeams())
  const [beamPattern, setBeamPattern] = useState<'line' | 'gap'>('line')
  const [npcSplinters, setNpcSplinters] = useState<number[]>([])
  const [npcCrystals, setNpcCrystals] = useState<Point[]>([])
  const [npcCarrier, setNpcCarrier] = useState<number | null>(null)
  const [crystalCarriers, setCrystalCarriers] = useState<number[]>([])
  const [npcCrystalAge, setNpcCrystalAge] = useState(0)
  const [playerSplinterRotation, setPlayerSplinterRotation] = useState(0)
  const [crystalAge, setCrystalAge] = useState(0)
  const [failureFlash, setFailureFlash] = useState(false)
  const [wipeReason, setWipeReason] = useState('')
  const [softWipeNotice, setSoftWipeNotice] = useState('')
  const [cycle, setCycle] = useState(1)
  const [p2Cycle, setP2Cycle] = useState(1)
  const [p2Soaked, setP2Soaked] = useState(false)
  const [health, setHealth] = useState(100)
  const [criticalRemaining, setCriticalRemaining] = useState(0)
  const [healthPotUsed, setHealthPotUsed] = useState(false)
  const [shieldUsed, setShieldUsed] = useState(false)
  const [bossHealth, setBossHealth] = useState(100)
  const [mainCastRemaining, setMainCastRemaining] = useState(0)
  const [startSlot, setStartSlot] = useState(0)
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const hitRef = useRef(false)
  const unsafeRef = useRef(false)
  const wipeRef = useRef(false)
  const softWipeGuardRef = useRef(false)
  const wipeCountRef = useRef(0)
  const cameraForward = useRef<Point>({ x: 0, y: -1 })
  const playerRef = useRef<Point>(positions[0])
  const crystalAgeRef = useRef(0)
  const eventTimeRef = useRef(0)
  const timeRef = useRef(0)
  const droppedForPackRef = useRef(false)
  const healthRef = useRef(100)
  const criticalDeadlineRef = useRef(0)
  const nextCriticalRef = useRef(Infinity)
  const healthEmergencyCountRef = useRef(0)
  const healthPotUsedRef = useRef(false)
  const shieldUsedRef = useRef(false)
  const mainAbilityReadyAtRef = useRef(0)
  const jumpOriginRef = useRef<Point>(positions[0])
  const pullOriginRef = useRef<Point>(WORLD.center)
  const keysHeld = useRef(new Set<string>())

  useEffect(() => { localStorage.setItem('lura-selected-position', String(assignment)) }, [assignment])
  useEffect(() => { localStorage.setItem('lura-keybindings', JSON.stringify(keyBindings)) }, [keyBindings])
  useEffect(() => { localStorage.setItem('lura-opening-speed-bonus', String(movementBonus)) }, [movementBonus])
  useEffect(() => { localStorage.setItem('lura-game-speed', String(gameSpeed)) }, [gameSpeed])
  useEffect(() => { localStorage.setItem('lura-hud-layout', JSON.stringify(hudLayout)) }, [hudLayout])
  useEffect(() => { localStorage.setItem('lura-health-pot-enabled', String(healthPotEnabled)) }, [healthPotEnabled])
  useEffect(() => { localStorage.setItem('lura-shield-enabled', String(shieldEnabled)) }, [shieldEnabled])
  useEffect(() => { localStorage.setItem('lura-main-ability-enabled', String(mainAbilityEnabled)) }, [mainAbilityEnabled])
  useEffect(() => {
    setP2SpreadPositions(current => {
      let changed = false
      const next = current.map((point, index) => {
        if (!profiles[index].crystal) return clampToP2Arena(point)
        const dx = point.x - WORLD.center.x
        const dy = point.y - WORLD.center.y
        const radius = Math.hypot(dx, dy) || 1
        if (radius <= P2_CRYSTAL_SPREAD_RADIUS) return point
        changed = true
        return { x: WORLD.center.x + dx / radius * P2_CRYSTAL_SPREAD_RADIUS, y: WORLD.center.y + dy / radius * P2_CRYSTAL_SPREAD_RADIUS }
      })
      return changed ? next : current
    })
  }, [profiles])
  useEffect(() => {
    const hashPlan = window.location.hash.startsWith('#raidplan=') ? decodeRaidPlan(window.location.hash) : null
    if (!hashPlan) return
    setPositions(hashPlan.positions.map(clampToSafeBand))
    setP2Positions(hashPlan.p2Positions.map(clampToP2Arena))
    setP2SpreadPositions(hashPlan.p2SpreadPositions.map(clampToP2Arena))
    setStartSlots(hashPlan.startSlots.map(clampStartSlot))
    setProfiles(hashPlan.profiles)
    setShareStatus('Shared raid plan loaded')
  }, [])
  useEffect(() => {
    if (screen !== 'game') return
    const togglePause = (event: KeyboardEvent) => {
      if (event.code !== keyBindings.pause || wipeRef.current) return
      event.preventDefault()
      keysHeld.current.clear()
      setPaused(current => !current)
    }
    window.addEventListener('keydown', togglePause)
    return () => window.removeEventListener('keydown', togglePause)
  }, [screen, keyBindings.pause])
  useEffect(() => {
    if (event === 'countdown' || event === 'p2-countdown') keysHeld.current.clear()
    softWipeGuardRef.current = false
  }, [event])

  const initializeAttempt = (preserveScore = false) => {
    keysHeld.current.clear()
    const slot = difficulty === 'easy' ? 0 : Math.floor(Math.random() * startSlots.length)
    const intermissionStart = startSlots[slot]
    const oriented = orientedAssignments(positions, intermissionStart, WORLD.center)
    const startPosition = entryMode === 'arena2' ? WORLD.center : intermissionStart
    setPhasePositions(oriented); setStartSlot(slot); playerRef.current = startPosition; jumpOriginRef.current = startPosition; pullOriginRef.current = startPosition; crystalAgeRef.current = 0; eventTimeRef.current = 0; if (!preserveScore) timeRef.current = 0; droppedForPackRef.current = false; healthRef.current = 100; criticalDeadlineRef.current = 0; nextCriticalRef.current = difficulty === 'easy' || !healthPotEnabled && !shieldEnabled ? Infinity : 16 + Math.random() * 9; healthEmergencyCountRef.current = 0; healthPotUsedRef.current = false; shieldUsedRef.current = false; mainAbilityReadyAtRef.current = 0; setHealth(100); setCriticalRemaining(0); setHealthPotUsed(false); setShieldUsed(false); setBossHealth(100); setMainCastRemaining(0); setPlayer(startPosition); setCrystal(null); setCrystalAge(0); setNpcSplinters([]); setNpcCrystals([]); setNpcCarrier(null); setCrystalCarriers(crystalNpcOrdinals(crystalAssignments, assignment)); setNpcCrystalAge(0); setPlayerSplinterRotation(0); if (preserveScore) setStats(current => ({ ...current, crystalDropped: false })); else { setStats({ score: 1000, hits: 0, crystalDropped: false, time: 0 }); setMistakes([]); wipeCountRef.current = 0 } setWipeReason(''); setSoftWipeNotice(''); setEvent(entryMode === 'arena2' ? 'p2-countdown' : 'countdown'); setEventTime(0); setCycle(1); setP2Cycle(1); setP2Soaked(false); hitRef.current = false; unsafeRef.current = false; wipeRef.current = false; softWipeGuardRef.current = false; chooseBossPattern(oriented[assignment]); setPaused(false); setScreen('game')
  }
  const start = () => initializeAttempt(false)

  useEffect(() => {
    if (screen !== 'game' || paused) return
    const keys = keysHeld.current
    const movementActions: [keyof KeyBindings, string][] = [['forward', 'w'], ['backward', 's'], ['left', 'a'], ['right', 'd']]
    const down = (e: KeyboardEvent) => {
      const movement = movementActions.find(([action]) => keyBindings[action] === e.code)
      if (movement) {
        e.preventDefault()
        if (event !== 'countdown' && event !== 'p2-countdown') keys.add(movement[1])
      }
      if (!e.repeat && e.code === keyBindings.crystal) toggleCrystal()
      if (!e.repeat && e.code === keyBindings.healthPot) useRecovery('healthPot')
      if (!e.repeat && e.code === keyBindings.shield) useRecovery('shield')
      if (!e.repeat && e.code === keyBindings.mainAbility) useMainAbility()
    }
    const up = (e: KeyboardEvent) => { const movement = movementActions.find(([action]) => keyBindings[action] === e.code); if (movement) keys.delete(movement[1]) }
    const clearMovement = () => keys.clear()
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clearMovement)
    let frame = 0; let previous = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05) * gameSpeed; previous = now
      eventTimeRef.current += dt; setEventTime(eventTimeRef.current); timeRef.current += dt; setStats(s => ({ ...s, time: s.time + dt }))
      setMainCastRemaining(Math.max(0, mainAbilityReadyAtRef.current - timeRef.current))
      updateHealth(dt)
      if (crystal) setCrystalAge(age => { const next = age + dt; crystalAgeRef.current = next; return next })
      if (npcCrystals.length) setNpcCrystalAge(age => age + dt)
      setPlayer(p => { const speedBonusActive = movementBonus && event === 'positioning' && eventTimeRef.current <= OPENING_BOOST_SECONDS; const openingSpeed = movementSpeed * (speedBonusActive ? 1.4 : 1); const bounds = { minX: 30, maxX: WORLD.width - 30, minY: 30, maxY: WORLD.height - 30 }; let next: Point; if (event === 'countdown' || event === 'p2-countdown') next = p; else if (event === 'p2-jump') { const progress = Math.min(1, eventTimeRef.current / 1.4); const eased = 1 - Math.pow(1 - progress, 3); next = { x: jumpOriginRef.current.x + (WORLD.center.x - jumpOriginRef.current.x) * eased, y: jumpOriginRef.current.y + (WORLD.center.y - jumpOriginRef.current.y) * eased } } else if (event === 'p2-pull') next = moveWithIncreasingPull(p, keys, openingSpeed, dt, cameraForward.current, bounds, WORLD.center, eventTimeRef.current / 5); else next = moveRelativeToCamera(p, keys, openingSpeed, dt, cameraForward.current, bounds); playerRef.current = next; if (event === 'p2-orbs' && eventTimeRef.current >= 5 && distance(next, p2Positions[assignment]) <= 8) setP2Soaked(true); if (crystal && canPickupCrystal(next, crystal, crystalAgeRef.current)) { setCrystal(null); setCrystalAge(0); crystalAgeRef.current = 0; setStats(s => ({ ...s, crystalDropped: false })) } checkHazards(next, now / 1000, dt); return next })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clearMovement) }
  }, [screen, paused, movementSpeed, movementBonus, gameSpeed, event, beamAngles, npcSplinters, crystal, npcCrystals, keyBindings, difficulty, healthPotEnabled, shieldEnabled, mainAbilityEnabled])

  useEffect(() => {
    if (screen !== 'game' || paused) return
    const duration = event === 'positioning' ? 10 : event === 'p1-recover' ? 2 : event === 'p2-jump' ? 1.4 : event === 'p2-positioning' ? 4 : event === 'p2-orbs' ? 6 : event === 'p2-recover' || event === 'p2-fetch' ? crystal ? Infinity : 0 : event === 'p2-spread' ? 3 : event === 'p2-pull' ? 5 : event === 'p2-wait' ? 2 : 3
    if (eventTime < duration) return
    eventTimeRef.current = 0
    setEventTime(0)
    if (event === 'p1-recover') {
      if (crystal) {
        if (triggerWipe('Crystal was not recovered before the Phase 2 transition')) return
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      jumpOriginRef.current = player
      setNpcCrystals([])
      setNpcCarrier(null)
      setEvent('p2-jump')
      hitRef.current = false
    } else if (event === 'p2-countdown') {
      setEvent('p2-positioning')
    } else if (event === 'p2-jump') {
      playerRef.current = WORLD.center
      setPlayer(WORLD.center)
      setEvent('p2-positioning')
      hitRef.current = false
    } else if (event === 'p2-positioning') {
      droppedForPackRef.current = false
      setP2Soaked(false)
      setEvent('p2-orbs')
    } else if (event === 'p2-orbs') {
      if (!p2Soaked) recordMistake('Missed the cross-beam soak', 100)
      const isCarrier = crystalAssignments.includes(assignment)
      const crystalFailure = isCarrier && !droppedForPackRef.current
        ? 'Orb beam resolved before you dropped the crystal'
        : isCarrier && !crystal
          ? 'The cross beam hit your carried crystal'
          : ''
      if (crystalFailure && triggerWipe(crystalFailure)) return
      if (isCarrier && crystal) setEvent('p2-recover')
      else beginP2Pull()
    } else if (event === 'p2-recover') {
      if (crystal) {
        if (triggerWipe('Crystal was not recovered within 6 seconds')) return
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      beginP2Pull()
    } else if (event === 'p2-pull') {
      playerRef.current = WORLD.center
      setPlayer(WORLD.center)
      droppedForPackRef.current = false
      setEvent('p2-spread')
    } else if (event === 'p2-spread') {
      const isCarrier = crystalAssignments.includes(assignment)
      const npcSpreadPositions = p2SpreadPositions.filter((_, index) => index !== assignment)
      if (npcSpreadPositions.some(target => distance(player, target) < 21)) recordMistake('Personal circle overlapped another player', 100)
      const placementFailure = isCarrier && (!droppedForPackRef.current || !crystal || distance(crystal, WORLD.center) > 11)
      const circleHitCrystal = Boolean(crystal && [player, ...npcSpreadPositions].some(target => distance(target, crystal) < 12))
      const crystalFailure = placementFailure ? 'Crystal was not dropped in the middle before the circles' : circleHitCrystal ? 'A personal circle hit the crystal' : ''
      if (crystalFailure && triggerWipe(crystalFailure)) return
      if (crystalFailure) {
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      setEvent(isCarrier && !crystalFailure ? 'p2-fetch' : 'p2-wait')
    } else if (event === 'p2-fetch') {
      if (crystal) {
        if (triggerWipe('Crystal was not fetched after the personal circles')) return
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      setEvent('p2-wait')
    } else if (event === 'p2-wait') {
      if (p2Cycle >= 3) { setScreen('results'); return }
      setP2Cycle(current => current + 1)
      setP2Soaked(false)
      droppedForPackRef.current = false
      setEvent('p2-orbs')
    } else if (event === 'countdown') {
      setEvent('positioning')
    } else if (event === 'positioning') {
      setEvent('beam'); chooseBossPattern(player); hitRef.current = false
    } else if (event === 'beam') {
      const carrier = !npcCrystals.length && Math.random() < .65 ? nearestNpc(player, stats.time, phasePositions, assignment, crystalCarriers, event, eventTime, beamAngles, startSlots[startSlot], movementSpeed, movementBonus) : null
      const marked = cycle === 6 ? Array.from({ length: 19 }, (_, index) => index) : pickNpcSplinters(carrier)
      const radialAngle = Math.atan2(player.y - WORLD.center.y, player.x - WORLD.center.x)
      setEvent('splinter'); setNpcSplinters(marked); setPlayerSplinterRotation(radialAngle + (Math.random() < .5 ? 0 : Math.PI / 6)); if (carrier !== null) { setNpcCarrier(carrier); setNpcCrystalAge(0); setNpcCrystals([npcPosition(carrier, stats.time, phasePositions, assignment, event, eventTime, beamAngles, startSlots[startSlot], movementSpeed, movementBonus)]) } hitRef.current = false
    } else {
      if (cycle >= 6) { setNpcSplinters([]); setEvent('p1-recover'); hitRef.current = false; return }
      droppedForPackRef.current = false; setEvent('beam'); setNpcSplinters([]); chooseBossPattern(player); setCycle(c => c + 1); hitRef.current = false
    }
  }, [eventTime, screen, paused, event, stats.time, player, cycle, p2Cycle, p2Soaked, crystal])

  useEffect(() => {
    if (!crystal || crystalAge < 6) return
    setCrystal(null); setCrystalAge(0); crystalAgeRef.current = 0; setStats(s => ({ ...s, crystalDropped: false }))
    triggerWipe(crystalWipeReason({ assigned: true, splinterResolving: false, dropped: true, crystalHit: false, expired: true })!)
  }, [crystal, crystalAge, event])
  useEffect(() => { if (!npcCrystals.length || npcCrystalAge < 6) return; setNpcCrystals([]); setNpcCarrier(null); setNpcCrystalAge(0) }, [npcCrystals, npcCrystalAge])

  function useRecovery(action: 'healthPot' | 'shield') {
    if (difficulty === 'easy') return
    const enabled = action === 'healthPot' ? healthPotEnabled : shieldEnabled
    const usedRef = action === 'healthPot' ? healthPotUsedRef : shieldUsedRef
    if (!enabled || usedRef.current) return
    usedRef.current = true
    if (action === 'healthPot') setHealthPotUsed(true)
    else setShieldUsed(true)
    healthRef.current = 100
    setHealth(100)
    criticalDeadlineRef.current = 0
    setCriticalRemaining(0)
    const anotherAvailable = healthPotEnabled && !healthPotUsedRef.current || shieldEnabled && !shieldUsedRef.current
    const emergencyLimit = healthEmergencyLimit(difficulty)
    nextCriticalRef.current = anotherAvailable && healthEmergencyCountRef.current < emergencyLimit ? timeRef.current + 8 + Math.random() * 10 : Infinity
  }
  function updateHealth(dt: number) {
    if (difficulty === 'easy' || !healthPotEnabled && !shieldEnabled || wipeRef.current) return
    if (!HEALTH_REACTION_EVENTS.has(event)) {
      if (criticalDeadlineRef.current > 0) criticalDeadlineRef.current += dt
      if (Number.isFinite(nextCriticalRef.current)) nextCriticalRef.current += dt
      return
    }
    if (criticalDeadlineRef.current > 0) {
      const remaining = Math.max(0, criticalDeadlineRef.current - timeRef.current)
      setCriticalRemaining(remaining)
      if (remaining <= 0) {
        criticalDeadlineRef.current = 0
        healthRef.current = 0
        setHealth(0)
        triggerWipe('Health response missed')
      }
      return
    }
    const drift = Math.sin(timeRef.current * .63) > .48 ? .9 : -.42
    healthRef.current = Math.max(30, Math.min(100, healthRef.current + drift * dt))
    setHealth(healthRef.current)
    const recoveryAvailable = healthPotEnabled && !healthPotUsedRef.current || shieldEnabled && !shieldUsedRef.current
    const emergencyLimit = healthEmergencyLimit(difficulty)
    if (recoveryAvailable && healthEmergencyCountRef.current < emergencyLimit && timeRef.current >= nextCriticalRef.current) {
      healthEmergencyCountRef.current += 1
      healthRef.current = 12 + Math.random() * 7
      setHealth(healthRef.current)
      criticalDeadlineRef.current = timeRef.current + 3
      setCriticalRemaining(3)
      nextCriticalRef.current = Infinity
    }
  }
  function beginP2Pull() {
    pullOriginRef.current = playerRef.current
    setEvent('p2-pull')
  }
  function useMainAbility() {
    if (!mainAbilityEnabled || screen !== 'game' || paused || wipeRef.current || timeRef.current < mainAbilityReadyAtRef.current) return
    mainAbilityReadyAtRef.current = timeRef.current + 1
    setMainCastRemaining(1)
    setBossHealth(current => Math.max(1, current - .5))
    setStats(current => ({ ...current, score: current.score + 1 }))
  }
  function toggleCrystal() { if (!crystalAssignments.includes(assignment) || screen !== 'game' || crystal) return; droppedForPackRef.current = true; setCrystal(playerRef.current); setCrystalAge(0); crystalAgeRef.current = 0; setStats(s => ({ ...s, crystalDropped: true })) }
  function checkHazards(position: Point, motionTime: number, dt: number) {
    if (event.startsWith('p2-')) {
      if (event === 'p2-orbs' && eventTimeRef.current >= 5.65 && crystal && (Math.abs(crystal.x - WORLD.center.x) < 7 || Math.abs(crystal.y - WORLD.center.y) < 7)) triggerWipe('The cross beam hit the crystal')
      return
    }
    if (event === 'countdown' || event === 'positioning') return
    const unsafe = !isInSafeAnnulus(position, WORLD.center, WORLD.innerRadius, WORLD.outerRadius)
    if (unsafe && timeRef.current >= 18) {
      setStats(s => ({ ...s, score: Math.max(0, s.score - 25 * dt), hits: s.hits + (unsafeRef.current ? 0 : 1) }))
      if (!unsafeRef.current) setMistakes(current => [{ id: Date.now() + Math.random(), time: timeRef.current, label: 'Entered the void zone', penalty: 0 }, ...current])
      unsafeRef.current = true
    } else unsafeRef.current = false
    if (hitRef.current) return
    const liveEventTime = eventTimeRef.current
    const allNpcs = Array.from({ length: 19 }, (_, index) => npcPositionWithCarrier(index, motionTime, npcCrystalAge, npcCarrier, npcCrystals[0], phasePositions, assignment, event, liveEventTime, beamAngles, startSlots[startSlot], movementSpeed, movementBonus))
    const npcOrigins = npcSplinters.map(index => allNpcs[index])
    const obstacles = [position, ...allNpcs, ...(crystal ? [crystal] : []), ...npcCrystals]
    const npcRotations = npcOrigins.map(origin => safestSplinterRotation(origin, obstacles))
    const splinterResolving = event === 'splinter' && liveEventTime >= 2.65
    const bossHit = event === 'beam' && bossBeamHitsPlayer(position, WORLD.center, beamAngles, 12, liveEventTime)
    const hitByNpcSplinter = splinterResolving && npcOrigins.some((origin, index) => rayHitsAny(position, origin, npcRotations[index]))
    const playerHitsNpc = splinterResolving && allNpcs.some(target => rayHitsAny(target, position, playerSplinterRotation))
    const playerHitsOwnCrystal = Boolean(crystal && splinterResolving && rayHitsAny(crystal, position, playerSplinterRotation))
    const playerHitsRaidCrystal = splinterResolving && npcCrystals.some(target => rayHitsAny(target, position, playerSplinterRotation))
    const npcHitsPlayerCrystal = Boolean(crystal && splinterResolving && npcOrigins.some((origin, index) => rayHitsAny(crystal, origin, npcRotations[index])))
    const bossHitsPlayerCrystal = Boolean(event === 'beam' && crystal && bossBeamHitsPlayer(crystal, WORLD.center, beamAngles, 12, liveEventTime))
    const playerCrystalFailure = crystalWipeReason({ assigned: crystalAssignments.includes(assignment), splinterResolving, dropped: droppedForPackRef.current, crystalHit: playerHitsOwnCrystal, expired: false })
    if (bossHitsPlayerCrystal) { triggerWipe('A boss beam hit your crystal'); return }
    if (playerCrystalFailure) { triggerWipe(playerCrystalFailure); return }
    if (playerHitsRaidCrystal) { triggerWipe('Your Starsplinter hit another player’s crystal'); return }
    if (npcHitsPlayerCrystal) { triggerWipe('Another player’s Starsplinter hit your crystal'); return }
    if (hitByNpcSplinter && crystalAssignments.includes(assignment) && !crystal) { triggerWipe('Another player’s Starsplinter hit you while carrying the crystal'); return }
    if (bossHit || hitByNpcSplinter || playerHitsNpc) {
      hitRef.current = true
      if (playerHitsNpc) recordMistake('Your Starsplinter hit another player', PLAYER_COLLISION_PENALTY)
      else if (hitByNpcSplinter) recordMistake('Another player’s Starsplinter hit you', PLAYER_COLLISION_PENALTY)
      else recordMistake(event === 'beam' ? 'Hit by a boss beam' : 'Hit by Starsplinter', 60)
    }
  }
  function recordMistake(label: string, penalty: number) {
    setMistakes(current => [{ id: Date.now() + Math.random(), time: timeRef.current, label, penalty }, ...current])
    setStats(s => ({ ...s, score: Math.max(0, s.score - penalty), hits: s.hits + 1 }))
  }
  function triggerWipe(label: string, penalty = WIPE_PENALTY): boolean {
    if (wipeRef.current) return true
    if (softWipeGuardRef.current) return false
    wipeCountRef.current += 1
    const canRecover = canRecoverFromWipe(difficulty, wipeCountRef.current, stats.score, penalty)
    setFailureFlash(true)
    window.setTimeout(() => setFailureFlash(false), 420)
    recordMistake(`${label} — wipe`, penalty)
    if (canRecover) {
      softWipeGuardRef.current = true
      setSoftWipeNotice(label)
      window.setTimeout(() => setSoftWipeNotice(''), 2600)
      return false
    }
    wipeRef.current = true
    setWipeReason(label)
    setPaused(true)
    return true
  }

  if (screen === 'menu') return <main className="shell">
    <header><p className="eyebrow">MIDNIGHT FALLS · MOVEMENT PRACTICE</p><h1>L’ura Trainer</h1><p className="lede">Choose your assigned player below. Its WoW class determines its body color, while crystal duty is assigned directly to that spot.</p></header>
    <div className="entry-choice"><span>Practice target</span><button className={entryMode === 'arena1' ? 'selected' : ''} onClick={() => setEntryMode('arena1')}>Arena 1 → Arena 2</button><button className={entryMode === 'arena2' ? 'selected' : ''} onClick={() => setEntryMode('arena2')}>Arena 2 only</button><button className="start entry-start" onClick={start}>Enter {entryMode === 'arena2' ? 'Arena 2' : 'Arena 1'}</button></div>
    <section className="menu-grid setup-grid">
      <fieldset><legend>Difficulty & movement</legend><div className="difficulty-row">{(['easy', 'normal', 'hard'] as Difficulty[]).map(value => <button key={value} className={difficulty === value ? 'selected compact' : 'compact'} onClick={() => setDifficulty(value)}>{value}</button>)}</div><label className="speed-control">Movement speed <strong>{movementSpeed}</strong><input aria-label="Movement speed" type="range" min="8" max="35" step="1" value={movementSpeed} onChange={e => setMovementSpeed(Number(e.target.value))} /></label><label className="speed-control">Global timing <strong>{gameSpeed.toFixed(2)}×</strong><input aria-label="Global game speed" type="range" min="1" max="2.5" step=".25" value={gameSpeed} onChange={e => setGameSpeed(Number(e.target.value))} /></label><label className="checkbox-control"><input aria-label="Opening movement bonus" type="checkbox" checked={movementBonus} onChange={event => setMovementBonus(event.target.checked)} /><span>40% opening boost<span>First 5s of the 10s positioning timer.</span></span></label><p className="hint">{difficultySettings(difficulty).helper ? 'S1 is fixed; full assignment guide enabled.' : difficulty === 'normal' ? 'Target ring appears within 45 yards; no guide arrow.' : 'Target ring appears within 22 yards; no guide arrow.'} {difficulty === 'hard' ? 'A wipe ends the attempt immediately.' : 'The first wipe costs 500 points and the current sequence continues; the second ends it.'}</p></fieldset>
      <fieldset><legend>Selected assignment</legend><p className="assignment">Spot {assignment + 1}<span>Drag a player below or use the position slider.</span></p><input aria-label="Assignment position" type="range" min="0" max="19" value={assignment} onChange={e => setAssignment(Number(e.target.value))} /><label className="profile-control">Name<input aria-label="Player name" maxLength={18} value={profiles[assignment].name} onChange={event => updateProfile({ name: event.target.value })} /></label><label className="profile-control">WoW class / color<select aria-label="Player class and color" value={profiles[assignment].playerClass} onChange={event => updateProfile({ playerClass: event.target.value as PlayerClass })}>{CLASS_OPTIONS.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><button className={profiles[assignment].crystal ? 'crystal-toggle selected' : 'crystal-toggle'} onClick={() => updateProfile({ crystal: !profiles[assignment].crystal })}>{profiles[assignment].crystal ? '◆ Crystal assigned' : '◇ No crystal'}</button></fieldset>
      <fieldset><legend>Layout</legend><p className="assignment">Raid-plan sharing<span>Names, classes, Intermission/P2 positions, and start slots are included.</span></p><div className="editor-actions"><button onClick={savePositions}>Save layout</button><button onClick={resetPositions}>Reset</button></div><label className="profile-control">Share link or code<input aria-label="Raid plan share code" value={shareInput} onChange={event => setShareInput(event.target.value)} placeholder="Paste a shared plan here" /></label><div className="editor-actions"><button onClick={copyRaidPlan}>Copy share link</button><button onClick={applyRaidPlan}>Load shared plan</button></div>{shareStatus && <p className="share-status" role="status">{shareStatus}</p>}</fieldset>
    </section>
    <section className="practice-settings">
      <fieldset><legend>Optional combat actions</legend><p className="hint">Health emergencies only occur during active mechanics: once on Normal and twice on Hard across the complete run. Each recovery ability has one use.</p><label className="checkbox-control disabled-on-easy"><input aria-label="Enable health potion" type="checkbox" disabled={difficulty === 'easy'} checked={healthPotEnabled} onChange={event => setHealthPotEnabled(event.target.checked)} /><span>Health potion<span>{keyLabel(keyBindings.healthPot)} · restores full health · one use</span></span></label><label className="checkbox-control disabled-on-easy"><input aria-label="Enable shield" type="checkbox" disabled={difficulty === 'easy'} checked={shieldEnabled} onChange={event => setShieldEnabled(event.target.checked)} /><span>Shield<span>{keyLabel(keyBindings.shield)} · restores full health · one use</span></span></label><label className="checkbox-control"><input aria-label="Enable main ability" type="checkbox" checked={mainAbilityEnabled} onChange={event => setMainAbilityEnabled(event.target.checked)} /><span>Main ability<span>{keyLabel(keyBindings.mainAbility)} · one-second cast · +1 point per hit · available on every difficulty</span></span></label></fieldset>
      <fieldset><legend>Keybindings</legend><div className="keybind-grid">{KEY_BIND_LABELS.map(binding => <label className="keybind-control" key={binding.action}><span>{binding.label}</span><input aria-label={`${binding.label} keybind`} readOnly value={keyLabel(keyBindings[binding.action])} onKeyDown={event => { event.preventDefault(); event.stopPropagation(); setKeyBindings(current => ({ ...current, [binding.action]: event.code })) }} /></label>)}</div><button className="reset-keys" onClick={() => setKeyBindings({ ...DEFAULT_KEY_BINDINGS })}>Reset keybindings</button></fieldset>
    </section>
    <div className="plan-heading"><p className="eyebrow">INTERFACE</p><h2>HUD positions</h2><p className="hint">Drag the mechanic counters and player/boss health bars around the Phase 2 preview. Their positions are saved automatically.</p></div>
    <HudLayoutEditor layout={hudLayout} onChange={(counter, point) => setHudLayout(current => ({ ...current, [counter]: point }))} onReset={() => setHudLayout(structuredClone(DEFAULT_HUD_LAYOUT))} />
    <PositionMap assignment={assignment} positions={positions} startSlots={startSlots} profiles={profiles} onPositionChange={(index, point) => { setAssignment(index); setPositions(current => current.map((position, positionIndex) => positionIndex === index ? clampToSafeBand(point) : position)) }} onStartSlotChange={(index, point) => setStartSlots(current => current.map((slot, slotIndex) => slotIndex === index ? clampStartSlot(point) : slot))} />
    <div className="plan-heading"><p className="eyebrow">PHASE 2 ASSIGNMENT</p><h2>Cross positioning</h2><p className="hint">Drag the same 20 players onto their Phase 2 positions across the fixed marker axes.</p></div>
    <P2PositionMap mapLabel="Phase 2 soak position map" buttonLabel="P2 soak" assignment={assignment} positions={p2Positions} profiles={profiles} onChange={(index, point) => { setAssignment(index); setP2Positions(current => current.map((position, positionIndex) => positionIndex === index ? clampToP2Arena(point) : position)) }} />
    <div className="plan-heading"><p className="eyebrow">PHASE 2 PERSONAL CIRCLES</p><h2>Spread positioning</h2><p className="hint">After the center pull, each player moves to this second P2 assignment before their personal circle resolves.</p></div>
    <P2PositionMap mapLabel="Phase 2 spread position map" buttonLabel="P2 spread" assignment={assignment} positions={p2SpreadPositions} profiles={profiles} onChange={(index, point) => { setAssignment(index); setP2SpreadPositions(current => current.map((position, positionIndex) => positionIndex === index ? clampToP2Arena(point) : position)) }} />
    <p className="scope-note">{entryMode === 'arena2' ? 'Start stacked in Phase 2.' : 'Positioning opener → six Intermission packs → Phase 2.'} · {keyLabel(keyBindings.forward)}/{keyLabel(keyBindings.left)}/{keyLabel(keyBindings.backward)}/{keyLabel(keyBindings.right)} move · {keyLabel(keyBindings.pause)} pause</p>
  </main>
  if (screen === 'results') return <main className="shell results"><p className="eyebrow">{wipeRef.current ? 'ATTEMPT ENDED' : event.startsWith('p2-') ? 'PHASE 2 COMPLETE' : 'INTERMISSION COMPLETE'}</p><h1>Movement review.</h1><p className="lede">{event.startsWith('p2-') ? 'Review the three-cycle orb, pull, spread, and crystal sequence.' : 'The cycle ended. Use the score to spot where your movement needs work.'}</p><div className="result-card"><strong>{Math.round(stats.score)}</strong><span>practice score</span><div className="result-row"><span>Time in arena</span><b>{stats.time.toFixed(1)}s</b></div><div className="result-row"><span>Recorded mistakes</span><b>{stats.hits}</b></div></div><section className="result-mistakes"><h2>Exact mistakes</h2>{mistakes.length ? <ol>{mistakes.slice().reverse().map(mistake => <li key={mistake.id}><time>{mistake.time.toFixed(1)}s</time><span>{mistake.label}</span><b>{mistake.penalty > 0 ? `−${mistake.penalty}` : 'movement'}</b></li>)}</ol> : <p>No mistakes recorded.</p>}</section><div className="actions"><button onClick={start}>Play again</button><button className="secondary" onClick={() => setScreen('menu')}>Change setup</button></div></main>
  function updateProfile(update: Partial<PlayerProfile>) { setProfiles(current => current.map((profile, index) => index === assignment ? { ...profile, ...update } : profile)) }
  function savePositions() { localStorage.setItem('lura-player-positions', JSON.stringify(positions)); localStorage.setItem('lura-p2-player-positions', JSON.stringify(p2Positions)); localStorage.setItem('lura-p2-spread-positions', JSON.stringify(p2SpreadPositions)); localStorage.setItem('lura-player-profiles', JSON.stringify(profiles)); localStorage.setItem('lura-crystal-assignments', JSON.stringify(crystalAssignments)); localStorage.setItem('lura-start-slots', JSON.stringify(startSlots)); setShareStatus('Layout saved') }
  function resetPositions() { const defaults = DEFAULT_ASSIGNMENTS.map(point => ({ ...point })); const defaultP2 = DEFAULT_P2_ASSIGNMENTS.map(point => ({ ...point })); const defaultP2Spread = DEFAULT_P2_SPREAD_ASSIGNMENTS.map(point => ({ ...point })); const defaultStarts = DEFAULT_START_SLOTS.map(point => ({ ...point })); const defaultProfiles = DEFAULT_PROFILES.map(profile => ({ ...profile })); setPositions(defaults); setP2Positions(defaultP2); setP2SpreadPositions(defaultP2Spread); setStartSlots(defaultStarts); setProfiles(defaultProfiles); localStorage.setItem('lura-player-positions', JSON.stringify(defaults)); localStorage.setItem('lura-p2-player-positions', JSON.stringify(defaultP2)); localStorage.setItem('lura-p2-spread-positions', JSON.stringify(defaultP2Spread)); localStorage.setItem('lura-player-profiles', JSON.stringify(defaultProfiles)); localStorage.setItem('lura-start-slots', JSON.stringify(defaultStarts)); setShareStatus('Default layout restored') }
  function raidPlanCode() { return encodeRaidPlan({ positions, p2Positions, p2SpreadPositions, startSlots, profiles }) }
  async function copyRaidPlan() { const link = `${window.location.origin}${window.location.pathname}#raidplan=${raidPlanCode()}`; setShareInput(link); try { await navigator.clipboard?.writeText(link); setShareStatus('Share link copied') } catch { setShareStatus('Share link ready to copy') } }
  function applyRaidPlan() { const plan = decodeRaidPlan(shareInput); if (!plan) { setShareStatus('Invalid raid-plan code'); return } setPositions(plan.positions.map(clampToSafeBand)); setP2Positions(plan.p2Positions.map(clampToP2Arena)); setP2SpreadPositions(plan.p2SpreadPositions.map(clampToP2Arena)); setStartSlots(plan.startSlots.map(clampStartSlot)); setProfiles(plan.profiles); setShareStatus('Shared raid plan loaded') }
  function chooseBossPattern(target: Point) { const pattern = Math.random() < .5 ? 'line' : 'gap'; const count = Math.random() < .5 ? 11 : 13; const spacing = Math.PI * 2 / count; const targetAngle = Math.atan2(target.y - WORLD.center.y, target.x - WORLD.center.x); setBeamPattern(pattern); setBeamAngles(Array.from({ length: count }, (_, index) => { const anchor = targetAngle + (pattern === 'gap' ? spacing / 2 : 0) + index * spacing; const preservePlayerPattern = index === 0 || pattern === 'gap' && index === count - 1; return anchor + (preservePlayerPattern ? 0 : (Math.random() - .5) * spacing * .42) })) }
  const activePositions = event === 'p2-spread' || event === 'p2-fetch' || event === 'p2-wait' ? p2SpreadPositions : event.startsWith('p2-') ? p2Positions : phasePositions
  return <GameArena mainAbilityEnabled={mainAbilityEnabled} bossHealth={bossHealth} mainCastRemaining={mainCastRemaining} softWipeNotice={softWipeNotice} hudLayout={hudLayout} positions={activePositions} intermissionPositions={phasePositions} p2SoakPositions={p2Positions} p2SpreadPositions={p2SpreadPositions} profiles={profiles} raidStart={startSlots[startSlot]} movementSpeed={movementSpeed} movementBonus={movementBonus} gameSpeed={gameSpeed} p2Cycle={p2Cycle} p2Soaked={p2Soaked} health={health} criticalRemaining={criticalRemaining} healthPotEnabled={difficulty !== 'easy' && healthPotEnabled} shieldEnabled={difficulty !== 'easy' && shieldEnabled} healthPotUsed={healthPotUsed} shieldUsed={shieldUsed} keyBindings={keyBindings} crystalCarriers={crystalCarriers} beamPattern={beamPattern} failureFlash={failureFlash} wipeReason={wipeReason} player={player} crystal={crystal} npcCrystals={npcCrystals} npcCarrier={npcCarrier} npcCrystalAge={npcCrystalAge} playerSplinterRotation={playerSplinterRotation} crystalAge={crystalAge} role={crystalAssignments.includes(assignment) ? 'carrier' : 'non-carrier'} difficulty={difficulty} assignment={assignment} stats={stats} mistakes={mistakes} startSlotName={`S${startSlot + 1}`} paused={paused} event={event} eventTime={eventTime} beamAngles={beamAngles} npcSplinters={npcSplinters} cycle={cycle} setPaused={setPaused} onRetry={start} onExit={() => setScreen('menu')} onDrop={toggleCrystal} onCameraDirection={direction => { cameraForward.current = direction }} />
}

function rayHitsAny(point: Point, origin: Point, rotation = 0): boolean { const dx = point.x - origin.x; const dy = point.y - origin.y; const length = Math.hypot(dx, dy); if (length < 10 || length > STAR_LENGTH) return false; const angle = Math.atan2(dy, dx); return Array.from({ length: 6 }, (_, i) => Math.abs(Math.atan2(Math.sin(angle - rotation - i * Math.PI / 3), Math.cos(angle - rotation - i * Math.PI / 3))) < .12).some(Boolean) }
function pickNpcSplinters(required: number | null): number[] { const candidates = Array.from({ length: 19 }, (_, i) => i).filter(index => index !== required); for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]] } return required === null ? candidates.slice(0, 9) : [required, ...candidates.slice(0, 8)] }
function crystalNpcOrdinals(crystalPositionIndices: number[], playerAssignment: number): number[] { const npcPositionIndices = Array.from({ length: 20 }, (_, index) => index).filter(index => index !== playerAssignment); return crystalPositionIndices.filter(index => index !== playerAssignment).map(index => npcPositionIndices.indexOf(index)).filter(index => index >= 0) }
function createBossBeams(): number[] { const count = 11; return Array.from({ length: count }, (_, index) => index * Math.PI * 2 / count) }
function npcPosition(index: number, time: number, positions: Assignment[], playerAssignment: number, event: EventKind, eventTime: number, beamAngles: number[], raidStart: Point, movementSpeed: number, movementBonus: boolean): Point { const baseIndex = positions.map((_, positionIndex) => positionIndex).filter(positionIndex => positionIndex !== playerAssignment)[index]; const target = positions[baseIndex]; const positioningTime = Math.max(0, time - 3); const travelTime = positioningTime + (movementBonus ? Math.min(positioningTime, OPENING_BOOST_SECONDS) * .4 : 0); const entering = npcEntryPosition(target, raidStart, index, travelTime, movementSpeed); return distance(entering, target) > .1 ? entering : roamingNpcPosition(target, index, time, event, eventTime, beamAngles, WORLD.center) }
function npcPositionWithCarrier(index: number, time: number, crystalGroundTime: number, carrier: number | null, dropped: Point | undefined, positions: Assignment[], playerAssignment: number, event: EventKind, eventTime: number, beamAngles: number[], raidStart: Point, movementSpeed: number, movementBonus: boolean): Point { const normal = npcPosition(index, time, positions, playerAssignment, event, eventTime, beamAngles, raidStart, movementSpeed, movementBonus); return index === carrier && dropped ? crystalCarrierPosition(normal, dropped, crystalGroundTime, index, WORLD.center, movementSpeed) : normal }
function nearestNpc(player: Point, time: number, positions: Assignment[], playerAssignment: number, candidates: number[], event: EventKind, eventTime: number, beamAngles: number[], raidStart: Point, movementSpeed: number, movementBonus: boolean): number | null { let best: number | null = null; let bestDistance = Infinity; for (const index of candidates) { const candidate = distance(player, npcPosition(index, time, positions, playerAssignment, event, eventTime, beamAngles, raidStart, movementSpeed, movementBonus)); if (candidate < bestDistance) { bestDistance = candidate; best = index } } return best }
function safestSplinterRotation(origin: Point, obstacles: Point[]): number { let best = 0; let bestHits = Infinity; for (let step = 0; step < 12; step++) { const rotation = step * Math.PI / 36; const hits = obstacles.filter(point => distance(point, origin) > 9 && rayHitsAny(point, origin, rotation)).length; if (hits < bestHits) { best = rotation; bestHits = hits } } return best }

function PositionMap({ assignment, positions, startSlots, profiles, onPositionChange, onStartSlotChange }: { assignment: number; positions: Assignment[]; startSlots: Assignment[]; profiles: PlayerProfile[]; onPositionChange: (index: number, point: Assignment) => void; onStartSlotChange: (index: number, point: Assignment) => void }) {
  const [dragging, setDragging] = useState<{ kind: 'player' | 'start'; index: number } | null>(null)
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragging === null) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const left = Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100))
    const top = Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100))
    const point = { x: WORLD.center.x + (left - 50) * 9.22, y: WORLD.center.y + (top - 50) * 5.19 }
    if (dragging.kind === 'player') onPositionChange(dragging.index, point)
    else onStartSlotChange(dragging.index, point)
  }
  return <div className="position-map" aria-label="Intermission position map" onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)} style={{ backgroundImage: `linear-gradient(rgba(7,9,22,.3), rgba(7,9,22,.3)), url(${ARENA_BACKGROUND})` }}><span className="map-boss">L’URA</span><span className="map-marker skull">☠</span><span className="map-marker cross">✕</span><span className="map-marker star">★</span><span className="map-marker orange">●</span>{startSlots.map((p, i) => <button type="button" aria-label={`Move S${i + 1} start slot`} title={`S${i + 1} orientation anchor`} key={`start-${i}`} onPointerDown={event => { event.preventDefault(); setDragging({ kind: 'start', index: i }); event.currentTarget.setPointerCapture(event.pointerId) }} className="map-start-slot" style={{ left: `${50 + (p.x - WORLD.center.x) / 9.22}%`, top: `${50 + (p.y - WORLD.center.y) / 5.19}%` }}>S{i + 1}</button>)}{positions.map((p, i) => <button type="button" aria-label={`Move player ${i + 1}`} title={`${profiles[i].name} · ${CLASS_OPTIONS.find(option => option.value === profiles[i].playerClass)?.label}${profiles[i].crystal ? ' · Crystal' : ''}`} key={i} onPointerDown={event => { event.preventDefault(); setDragging({ kind: 'player', index: i }); event.currentTarget.setPointerCapture(event.pointerId) }} className={`${i === assignment ? 'map-player selected-map' : 'map-player'}${profiles[i].crystal ? ' crystal-map-player' : ''}`} style={{ left: `${50 + (p.x - WORLD.center.x) / 9.22}%`, top: `${50 + (p.y - WORLD.center.y) / 5.19}%`, backgroundColor: CLASS_OPTIONS.find(option => option.value === profiles[i].playerClass)?.color }}>{i + 1}</button>)}</div>
}

function P2PositionMap({ mapLabel, buttonLabel, assignment, positions, profiles, onChange }: { mapLabel: string; buttonLabel: string; assignment: number; positions: Assignment[]; profiles: PlayerProfile[]; onChange: (index: number, point: Assignment) => void }) {
  const [dragging, setDragging] = useState<number | null>(null)
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragging === null) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const left = Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100))
    const top = Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100))
    onChange(dragging, { x: WORLD.center.x + (left - 50) * P2_MAP_SCALE.x, y: WORLD.center.y + (top - 50) * P2_MAP_SCALE.y })
  }
  return <div className="position-map p2-position-map" aria-label={mapLabel} onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)} style={{ backgroundImage: `linear-gradient(rgba(7,9,22,.46), rgba(7,9,22,.46)), url(${ARENA_BACKGROUND})` }}><span className="p2-cross horizontal" /><span className="p2-cross vertical" /><span className="map-boss">L’URA</span><span className="map-marker skull">☠</span><span className="map-marker cross">✕</span><span className="map-marker star">★</span><span className="map-marker orange">●</span>{positions.map((point, index) => <button type="button" aria-label={`Move ${buttonLabel} player ${index + 1}`} title={`${profiles[index].name} · ${buttonLabel}`} key={index} onPointerDown={event => { event.preventDefault(); setDragging(index); event.currentTarget.setPointerCapture(event.pointerId) }} className={`${index === assignment ? 'map-player selected-map' : 'map-player'}${profiles[index].crystal ? ' crystal-map-player' : ''}`} style={{ left: `${50 + (point.x - WORLD.center.x) / P2_MAP_SCALE.x}%`, top: `${50 + (point.y - WORLD.center.y) / P2_MAP_SCALE.y}%`, backgroundColor: CLASS_OPTIONS.find(option => option.value === profiles[index].playerClass)?.color }}>{index + 1}</button>)}</div>
}

function HudLayoutEditor({ layout, onChange, onReset }: { layout: HudLayout; onChange: (counter: HudElement, point: Point) => void; onReset: () => void }) {
  const [dragging, setDragging] = useState<HudElement | null>(null)
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const bounds = event.currentTarget.getBoundingClientRect()
    onChange(dragging, {
      x: Math.max(5, Math.min(95, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(7, Math.min(93, (event.clientY - bounds.top) / bounds.height * 100)),
    })
  }
  const counters: Array<{ key: HudElement; label: string; value: string }> = [
    { key: 'mechanic', label: 'PHASE 2 · CYCLE', value: '2 / 3' },
    { key: 'beam', label: 'BEAM IN', value: '3' },
    { key: 'crystal', label: 'PICK UP IN', value: '6' },
    { key: 'playerHealth', label: 'PLAYER HEALTH', value: '78%' },
    { key: 'bossHealth', label: 'L’URA', value: '99.5%' },
  ]
  return <section className="hud-layout-editor">
    <div className="hud-preview" aria-label="Phase 2 HUD layout preview" onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
      <div className="hud-preview-arena"><i className="preview-boss" />{Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI * 2 / 12; return <i key={index} className="preview-player" style={{ left: `${50 + Math.cos(angle) * 32}%`, top: `${50 + Math.sin(angle) * 32}%` }} /> })}<i className="preview-you" /></div>
      {counters.map(counter => <button type="button" key={counter.key} aria-label={`Move ${counter.label.toLowerCase()} counter`} className={`hud-preview-counter ${counter.key}`} style={{ left: `${layout[counter.key].x}%`, top: `${layout[counter.key].y}%` }} onPointerDown={event => { event.preventDefault(); setDragging(counter.key); event.currentTarget.setPointerCapture(event.pointerId) }}><span>{counter.label}</span><strong>{counter.value}</strong></button>)}
    </div>
    <button type="button" className="secondary hud-reset" onClick={onReset}>Reset counter positions</button>
  </section>
}

function GameArena(props: { mainAbilityEnabled: boolean; bossHealth: number; mainCastRemaining: number; softWipeNotice: string; hudLayout: HudLayout; positions: Assignment[]; intermissionPositions: Assignment[]; p2SoakPositions: Assignment[]; p2SpreadPositions: Assignment[]; profiles: PlayerProfile[]; raidStart: Point; movementSpeed: number; movementBonus: boolean; gameSpeed: number; p2Cycle: number; p2Soaked: boolean; health: number; criticalRemaining: number; healthPotEnabled: boolean; shieldEnabled: boolean; healthPotUsed: boolean; shieldUsed: boolean; keyBindings: KeyBindings; crystalCarriers: number[]; beamPattern: 'line' | 'gap'; failureFlash: boolean; wipeReason: string; player: Point; crystal: Point | null; npcCrystals: Point[]; npcCarrier: number | null; npcCrystalAge: number; playerSplinterRotation: number; crystalAge: number; role: Role; difficulty: Difficulty; assignment: number; stats: GameStats; mistakes: Mistake[]; startSlotName: string; paused: boolean; event: EventKind; eventTime: number; beamAngles: number[]; npcSplinters: number[]; cycle: number; setPaused: (p: boolean) => void; onRetry: () => void; onExit: () => void; onDrop: () => void; onCameraDirection: (direction: Point) => void }) {
  const [zoomDisplay, setZoomDisplay] = useState(16)
  const countdown = props.event === 'countdown'
  const positioning = props.event === 'positioning'
  const finalRecovery = props.event === 'p1-recover'
  const phaseTwo = props.event.startsWith('p2-')
  const p2Copy: Partial<Record<EventKind, { title: string; mechanic: string; detail: string; counter: string; duration: number }>> = {
    'p2-countdown': { title: 'Get ready for Phase 2.', mechanic: 'CENTER STACK', detail: 'The raid begins stacked in the middle.', counter: 'STARTING', duration: 3 },
    'p2-jump': { title: 'Into the center.', mechanic: 'FORCED CENTER STACK', detail: 'The whole raid is jumping into one stack in the middle.', counter: 'STACK', duration: 1.4 },
    'p2-positioning': { title: 'Find your soak position.', mechanic: 'CROSS POSITIONING', detail: 'Move from the stack to your cross-beam assignment.', counter: 'POSITION', duration: 4 },
    'p2-orbs': { title: props.p2Soaked ? 'Beam soaked.' : 'Soak your assigned beam.', mechanic: props.p2Soaked ? 'BEAM SOAKED' : 'CROSS-BEAM SOAK', detail: 'Stand on your cross assignment while the beam destroys its outside orb. Crystal carriers must time their drop so the crystal remains down at resolution.', counter: props.p2Soaked ? 'SOAKED' : 'BEAM', duration: 6 },
    'p2-recover': { title: 'Recover the crystal.', mechanic: 'CRYSTAL RECOVERY', detail: 'Walk onto the crystal before its six-second ground timer expires.', counter: 'RECOVER', duration: 6 },
    'p2-pull': { title: 'Pulled to the center.', mechanic: 'INCREASING PULL', detail: 'The five-second pull starts weak enough to move against, then becomes overwhelming.', counter: 'PULL', duration: 5 },
    'p2-spread': { title: 'Spread your circle.', mechanic: 'PERSONAL CIRCLES', detail: 'Move to your spread-plan assignment. A carrier leaves the crystal in the center.', counter: 'SPREAD', duration: 3 },
    'p2-fetch': { title: 'Fetch the crystal.', mechanic: 'CRYSTAL RECOVERY', detail: 'Return to the middle and pick the crystal up before its six-second ground timer expires.', counter: 'FETCH', duration: 6 },
    'p2-wait': { title: 'Prepare for the next cycle.', mechanic: 'CYCLE RESET', detail: 'The next orb cross begins in two seconds.', counter: 'NEXT', duration: 2 },
  }
  const p2 = p2Copy[props.event]
  return <main className="game-shell">
    <div className="game-top">
      <div><p className="eyebrow">{phaseTwo ? `PHASE 2 · CYCLE ${props.p2Cycle} / 3` : 'INTERMISSION'} · {phaseTwo ? `SPOT ${props.assignment + 1}` : countdown || positioning ? `${props.startSlotName.toUpperCase()} START` : `PACK ${props.cycle} / 6`} · {props.role === 'carrier' ? 'CRYSTAL CARRIER' : 'NON-CARRIER'} · {props.gameSpeed.toFixed(2)}×</p><h1>{p2?.title ?? (countdown ? 'Get ready.' : positioning ? 'Take your position.' : finalRecovery ? 'Recover your crystal.' : props.event === 'beam' ? 'Find the gap.' : 'Clear the crystals.')}</h1></div>
      <div className="game-actions"><button disabled={Boolean(props.wipeReason)} onClick={() => props.setPaused(!props.paused)}>{props.wipeReason ? 'Wiped' : props.paused ? 'Resume' : 'Pause'}</button><button className="secondary" onClick={props.onExit}>Exit</button></div>
    </div>
    <div className="game-layout">
      <div className={`arena-wrap${props.failureFlash ? ' failure-flash' : ''}`}><GameScene positions={props.positions} intermissionPositions={props.intermissionPositions} p2SoakPositions={props.p2SoakPositions} p2SpreadPositions={props.p2SpreadPositions} profiles={props.profiles} raidStart={props.raidStart} movementSpeed={props.movementSpeed} movementBonus={props.movementBonus} difficulty={props.difficulty} p2Cycle={props.p2Cycle} crystalCarriers={props.crystalCarriers} playerIsCrystal={props.role === 'carrier'} player={props.player} crystal={props.crystal} npcCrystals={props.npcCrystals} npcCarrier={props.npcCarrier} npcCrystalAge={props.npcCrystalAge} playerSplinterRotation={props.playerSplinterRotation} crystalAge={props.crystalAge} event={props.event} eventTime={props.eventTime} beamAngles={props.beamAngles} npcSplinters={props.npcSplinters} time={props.stats.time} assignment={props.assignment} easy={props.difficulty === 'easy'} onCameraDirection={props.onCameraDirection} onZoomChange={setZoomDisplay} /><div className="score-overlay"><span>Points</span><strong>{Math.round(props.stats.score)}</strong></div>{props.softWipeNotice && <div className="soft-wipe-notice" role="status"><span>Strike 1 / 2 · −500 points</span><strong>{props.softWipeNotice}</strong><small>Practice continues</small></div>}{props.event === 'p2-orbs' && (props.difficulty === 'easy' || props.eventTime >= 2) && <div className={`beam-drop-counter${props.eventTime >= 2 ? ' safe' : ''}`} style={{ left: `${props.hudLayout.beam.x}%`, top: `${props.hudLayout.beam.y}%` }}>{props.eventTime < 2 ? <strong>WAIT TO DROP</strong> : <>{props.difficulty === 'easy' ? 'SAFE TO DROP · ' : ''}BEAM IN <strong>{Math.max(1, Math.ceil(6 - props.eventTime))}</strong></>}</div>}{props.wipeReason && <div className="wipe-overlay" role="alert"><p>Raid wiped</p><h2>Wiped due to:</h2><strong>{props.wipeReason}</strong><div><button onClick={props.onRetry}>Try again</button><button className="secondary" onClick={props.onExit}>Change setup</button></div></div>}{(countdown || props.event === 'p2-countdown') && <div className="start-countdown">{Math.max(1, Math.ceil(3 - props.eventTime))}</div>}<div className="splinter-counter" style={{ left: `${props.hudLayout.mechanic.x}%`, top: `${props.hudLayout.mechanic.y}%` }}>{p2 ? <>{p2.counter} <strong>{props.event === 'p2-recover' || props.event === 'p2-fetch' ? Math.max(0, 6 - props.crystalAge).toFixed(1) : Math.max(0, p2.duration - props.eventTime).toFixed(1)}s</strong></> : countdown ? <>STARTING <strong>{Math.max(0, 3 - props.eventTime).toFixed(1)}s</strong></> : positioning ? <>POSITIONING <strong>{Math.max(0, 10 - props.eventTime).toFixed(1)}s</strong></> : finalRecovery ? <>FINAL PICKUP <strong>{Math.max(0, 2 - props.eventTime).toFixed(1)}s</strong></> : <>SPLINTER SET <strong>{props.cycle}/6</strong></>}</div>{props.crystal && <div className="crystal-countdown" style={{ left: `${props.hudLayout.crystal.x}%`, top: `${props.hudLayout.crystal.y}%` }}>PICK UP IN<br /><strong>{finalRecovery ? Math.max(1, Math.ceil(2 - props.eventTime)) : Math.max(1, Math.ceil(6 - props.crystalAge))}</strong></div>}{(props.healthPotEnabled || props.shieldEnabled) && <div className={`player-health${props.criticalRemaining > 0 ? ' critical-health' : ''}`} style={{ left: `${props.hudLayout.playerHealth.x}%`, top: `${props.hudLayout.playerHealth.y}%` }}><div className="health-track"><i style={{ width: `${props.health}%` }} /></div><span>{Math.round(props.health)}%{props.criticalRemaining > 0 ? ` · REACT ${props.criticalRemaining.toFixed(1)}s` : ''}</span><div className="health-abilities">{props.healthPotEnabled && <b className={props.healthPotUsed ? 'used' : ''}>{keyLabel(props.keyBindings.healthPot)} POT</b>}{props.shieldEnabled && <b className={props.shieldUsed ? 'used' : ''}>{keyLabel(props.keyBindings.shield)} SHIELD</b>}</div></div>}{props.mainAbilityEnabled && <div className="boss-health" style={{ left: `${props.hudLayout.bossHealth.x}%`, top: `${props.hudLayout.bossHealth.y}%` }}><span>L’URA · {props.bossHealth.toFixed(1)}%</span><div className="boss-health-track"><i style={{ width: `${props.bossHealth}%` }} /></div>{props.mainCastRemaining > 0 ? <div className="main-cast"><i style={{ width: `${(1 - props.mainCastRemaining) * 100}%` }} /><b>MAIN ABILITY · {props.mainCastRemaining.toFixed(1)}s</b></div> : <small>{keyLabel(props.keyBindings.mainAbility)} · MAIN ABILITY READY</small>}</div>}<div className="controls">{keyLabel(props.keyBindings.forward)}/{keyLabel(props.keyBindings.left)}/{keyLabel(props.keyBindings.backward)}/{keyLabel(props.keyBindings.right)} move · {keyLabel(props.keyBindings.pause)} pause · left-drag look · right-drag view + face · wheel zoom · Zoom {zoomDisplay.toFixed(1)} yd · {p2 ? p2.detail : countdown ? `Wait for the timer at ${props.startSlotName}` : positioning ? props.difficulty === 'easy' ? `Follow the teal guide to Spot ${props.assignment + 1}` : `Find Spot ${props.assignment + 1}; its ring appears only when close` : finalRecovery ? 'Two seconds to recover the final crystal before the Phase 2 center jump' : props.role === 'carrier' ? `${keyLabel(props.keyBindings.crystal)} drops the crystal anywhere · move away · pick up in time` : props.cycle === 6 ? 'Final set: all 20 players marked' : 'Dodge the ten marked Starsplinters'}</div></div>
    </div>
  </main>
}
