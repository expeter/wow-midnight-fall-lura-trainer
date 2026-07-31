import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { CRYSTAL_GROUND_EXPLOSION_SECONDS, isCommittedP3ProtectionCrystal } from './game'
import { bossBeamHitsPlayer, canPickupCrystalDuringEvent, canRecoverFromWipe, crystalWipeReason, difficultySettings, distance, distanceToSegment, isOnAssignedP3Side, isP3ConsumedSectorLethal, isInSafeAnnulus, isP3ProtectionCrystalPlaced, isProtectedByP3Bubble, isProtectedByP3Light, moveRelativeToCamera, moveWithIncreasingPull, npcEntryPosition, OPENING_BOOST_SECONDS, orientedAssignments, p1PositioningWipeReason, p2BeamHitsAssignedOrb, p2BeamPlayers, p2BeamTargetOrbIndices, p2NpcCrystalDrops, p2OrbPosition, p2PhaseTransitionCountdown, p2PostBeamEvent, p2ReturningOrbPositions, P1_FINAL_RECOVERY_SECONDS, P1_STAR_LENGTH, P2_BEAM_SECONDS, P2_FETCH_SECONDS, P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS, P2_ORBIT_SPEED, P2_ORB_GLOW_LEAD_SECONDS, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P2_PERSONAL_CIRCLE_OUTER_RADIUS, P2_POSITIONING_SECONDS, P2_PULL_SECONDS, P2_SPREAD_SECONDS, p3ActiveCrystalAssignments, P3_APPROACH_SECONDS, p3ArchangelStackPosition, p3AssignmentForRound, p3BossPosition, p3FlightPosition, P3_FINAL_SECTOR_MOVE_SECONDS, P3_FLIGHT_SECONDS, p3LandingPlanIndex, p3LandingPosition, p3LandingHealthRate, p3LandingSoakOccupied, p3LandingSoakPositions, p3LightCenters, p3LightHealthRate, p3MemoryResolved, p3PoolCenters, p3PoolSoakRate, p3ProtectionBubbleCenter, p3RuneDeadline, p3RuneEdges, p3RuneOrbs, p3RuneStepAt, p3SectorMovementSpeed, p3SideForPosition, p3StarsTiming, p3UnsafePenaltyTicks, p3WrongRuneContact, P3_LANDING_SOAK_RADIUS, P3_MEMORY_PANEL_SECONDS, P3_MEMORY_START_SECONDS, P3_MEMORY_STEP_SECONDS, P3_OUTER_RADIUS, P3_POOL_HEALTH, P3_POOL_RADIUS, P3_SAFE_ZONE_PENALTY_PER_SECOND, P3_SECTOR_MOVE_SECONDS, P3_SECTOR_SECONDS, p4BossHealth, p4EncounterBoxStates, p4FrontSoakerPosition, p4GroupPosition, p4NpcSplinterPosition, p4PlayerSplinterDuty, p4RelocationProgress, p4SplinterAge, p4SplinterHitsGroup, p4SplinterResolutionActive, p4SplinterRotation, p4SplinterStartSeconds, p4StackPosition, p4TankConeActive, p4TankConeHitsBox, p4TransitionStartPosition, P4_CYCLE_SECONDS, P4_HEAVEN_START_SECONDS, P4_KNOCKUP_SECONDS, P4_MOVEMENT_MULTIPLIER, P4_PROTECTION_RADIUS, P4_SPLINTER_DETONATION_SECONDS, P4_SPLINTER_INTERVAL_SECONDS, P4_TANK_CONE_DURATION_SECONDS, P4_TANK_CONE_INTERVAL_SECONDS, personalCircleHitsCrystal, personalCircleHitsPlayer, PLAYER_COLLISION_PENALTY, randomCrystalDropDuty, randomizeP3PoolLayout, roamingNpcPosition, safestStarsplinterRotation, scoreExhaustionWipeReason, setP3BossPlan, shouldCheckIntermissionVoid, shouldShowP2OrbReturnCounter, starsplinterHitsPoint, translateSelectedPoints, walkTowards, WIPE_PENALTY, type Difficulty, type PlayerClass, type PlayerProfile, type Point, type Role, type RuneSymbol } from './game'
import { buildPhaseResult, completionImageCardLayout, completionPhasePresentation, completionResultTitle, completionShareText, isFullSequenceCompletion, signedPhaseContribution, wrapTextByWidth, type PhaseKey, type PhaseResult } from './completion'
import { bossDamageScoreBonus, isInsideP3Pool, p4BossHealthWithPlayerDamage, p4NpcOrdinalForProfile, p4NpcProfileIndices, p4NpcSplinterActorOrdinals, p4ProtectionCenter, p4RenderedNpcSplinterOrigin, p4StartingBossState, p4TankKillsBox, PRE_P4_BOSS_HEALTH_BUDGET, preP4BossHealth, shouldSuppressRepeatedWipe, shouldTriggerP3EarlyClear, starsplinterHitsCrystalCarrier } from './game'
import { p4UnsafePenaltyTicks, P4_SAFE_ZONE_HEALTH_DRAIN_PER_SECOND, P4_SAFE_ZONE_PENALTY_PER_SECOND } from './game'
import { canPickupCrystalAlongPath, INTERMISSION_POSITIONING_SECONDS } from './game'
import { p4TimedVoiceCues, timedVoiceDelaySeconds, timedVoiceSupported, ttsCuesForState, type P4VoiceClip } from './audio'
import AchievementCollection, { AchievementBadgeSummary, AchievementUnlockPopups } from './AchievementLedger'
import { ACHIEVEMENT_STORAGE_KEY, achievementAccountStorageKey, collectibleAchievements, collectionFromVerifiedAchievements, emptyCollection, mergeAchievementCollections, mergeEarnedAchievements, newlyEarnedAchievements, parseAchievementCollection, serializeAchievementCollection, type AchievementCollectionData, type AchievementDefinition } from './achievementCollection'
import { FEATURE_FLAGS } from './features'
import { normalizeP1PlanAssignments } from './game'
import GameScene from './GameScene'
import { advanceMainAbilityCast, idleMainAbilityCast, mainAbilityElapsedSeconds, MAIN_ABILITY_CAST_SECONDS, requestMainAbilityCast, type MainAbilityCastState } from './mainAbility'
import { encounterSoundCuesForState, playEncounterSound } from './encounterSounds'
import { approachHealthTarget, healthBand, healthChangeRate, randomHealthTarget, unusedRecoveryPenalty } from './healthRecovery'
import { P1_BEAM_POSITION_SECONDS, P1_CRYSTAL_PICKUP_SECONDS, P1_DEFAULT_INTERRUPT_KEY, P1_GLAIVE_CONTACT_RADIUS, P1_GLAIVE_INITIAL_SPEED_MULTIPLIER, P1_GLAIVE_RETURN_SPEED_MULTIPLIER, P1_GLAIVE_TELEGRAPH_SECONDS, P1_INNER_RADIUS, P1_INTERMISSION_POSITION_SECONDS, P1_INTERRUPT_CAST_COUNT, P1_INTERRUPT_CAST_SECONDS, P1_MEMORY_DELAY_SECONDS, P1_MEMORY_POSITION_SECONDS, P1_MEMORY_SWEEP_SECONDS, P1_OUTER_RADIUS, P1_PLAYER_INTERRUPT_WINDOW_SECONDS, P1_PULL_DELAY_SECONDS, P1_REACTIVE_SOAK_RADIUS, P1_REACTIVE_SOAK_SECONDS, P1_ROTATING_BEAM_ACTIVE_SECONDS, P1_ROTATING_BEAM_TELEGRAPH_SECONDS, P1_SEQUENCE_COUNT, p1AddGlaiveSet, p1AdvanceGlaiveSet, p1BeamHitResolution, p1BossEncounterPosition, p1ContinuousBeamTime, p1CrystalPickupSequence, p1CrystalSpawnPosition, p1CrystalTouchResolution, p1GlaiveContactStarted, p1GlaiveSet, p1HasCollectedCrystal, p1InterruptAssignment, p1InterruptState, p1IsInPlayableArena, p1MemoryOrder, p1MemoryPlayerVerdict, p1NpcInterruptSeconds, p1ReactiveSoaks, p1RotatingBeamHitsPoint, p1RotatingBeams, p1WrongCrystalDropExpired, type P1GlaiveSet, type P1ReactiveSoak, type P1Rune } from './p1'
import { advanceTankMechanic, createTankMechanicState, prepareTankDefensive, requestTankTaunt, tankMechanicActiveForEvent, type TankIndex, type TankMechanicEvent, type TankMechanicState } from './tank'
import OnlinePanel, { BestRunsSummary, GlobalRankingSummary, OnlineStandingSummary, PublicProfileOverlay } from './OnlinePanel'
import { canRecordOnlineWipe, completeOnlineAttempt, configurationFingerprint, issueOnlineAttempt, loadActivityFeed, loadOnlineAchievements, loadOnlineSession, logoutOnline, newActivityRows, recentActivityRows, recordOnlineWipe, type ActivityFeedRow, type OnlineSession, type RunAttributionMode } from './online'
import { resultProofClaim, resultProofFromJson, serializeResultProof, serializeResultProofBundle, type ResultProof } from './resultProof'
import './styles.css'

type Screen = 'menu' | 'game' | 'results'
type EventKind = 'p1-countdown' | 'p1-pull' | 'p1-interrupts' | 'p1-crystals' | 'p1-glaives' | 'p1-memory-position' | 'p1-memory-sweep' | 'p1-beam-position' | 'p1-beam-telegraph' | 'p1-beams' | 'p1-soaks' | 'p1-transition' | 'countdown' | 'positioning' | 'beam' | 'splinter' | 'p1-recover' | 'p2-countdown' | 'p2-jump' | 'p2-positioning' | 'p2-orbs' | 'p2-recover' | 'p2-pull' | 'p2-spread' | 'p2-fetch' | 'p2-wait' | 'p3-countdown' | 'p3-flight' | 'p3-landing' | 'p3-approach' | 'p3-light-pools' | 'p3-rune-preview' | 'p3-lattice-memory' | 'p3-lattice-second' | 'p3-pools-overlap' | 'p3-big-boom' | 'p3-archangel-position' | 'p3-archangel' | 'p3-sector-move' | 'p4-countdown' | 'p4-transition' | 'p4-cycle'
type EntryMode = 'arena0' | 'arena1' | 'arena2' | 'arena3' | 'arena4'
type P1RunePanelOrientation = 'pentagram' | 'positional'
interface GameStats { score: number; hits: number; crystalDropped: boolean; time: number }
interface Assignment { x: number; y: number }
interface Mistake { id: number; time: number; label: string; penalty: number }
interface PhaseStart { key: PhaseKey; score: number; time: number; hits: number }
interface ActiveOnlineAttempt {
  attemptId: string
  nonce: string
  buildId: string
  configurationFingerprint: string
  optionalChallenges: string[]
}
type RecoveryStatus = 'disabled' | 'pending' | 'passed' | 'missed'
interface PhaseCrystalAssignments { p1: number[]; intermission: number[]; p2: number[]; p3: number[] }
interface RaidPlan { p1Positions: Assignment[]; p1BossPosition: Assignment; positions: Assignment[]; p2Positions: Assignment[]; p2SpreadPositions: Assignment[]; p3Positions: Assignment[]; p3BossPositions: Assignment[]; startSlots: Assignment[]; profiles: PlayerProfile[]; crystalAssignments: PhaseCrystalAssignments; tankAssignments: [number, number] }
interface VersionManifest { version: string; revision: string; builtAt: string }
interface KeyBindings { forward: string; backward: string; left: string; right: string; turnLeft: string; turnRight: string; jump: string; crystal: string; interrupt: string; taunt: string; pause: string; healthPot: string; shield: string; mainAbility: string }
type HudElement = 'mechanic' | 'beam' | 'crystal' | 'playerHealth' | 'bossHealth' | 'castbar' | 'actions'
type HudLayout = Record<HudElement, Point>

const WORLD = { width: 960, height: 540, center: { x: 480, y: 270 }, innerRadius: 102, outerRadius: 169 }
const P2_RADIUS = WORLD.innerRadius * .54
const P2_ASSIGNMENT_RADIUS = P2_RADIUS - 6
const P2_CRYSTAL_SPREAD_RADIUS = 28

function scrollToSetupSection(event: ReactMouseEvent<HTMLAnchorElement>, sectionId: string) {
  event.preventDefault()
  const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(sectionId)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}
const P2_MAP_SCALE = { x: 3.34, y: 1.88 }
const P2_PLANNER_CIRCLE_DIAMETER = P2_PERSONAL_CIRCLE_OUTER_RADIUS * 2 / P2_MAP_SCALE.x
const STAR_LENGTH = P1_STAR_LENGTH
const CREATOR_AVATAR = new URL('../images/pestivator-avatar.jpg', import.meta.url).href
const SOLANA_ADDRESS = 'E684K1q1gzodtZK3xgdBXfTeRQbWWhSu8kVbzZNiw9Cz'
const PROJECT_URL = 'https://github.com/expeter/wow-midnight-fall-lura-trainer'
const CHANGELOG_URL = `${PROJECT_URL}/blob/main/CHANGELOG.md`
const RECENT_RELEASE_CHANGES = [
  'Live public wipe activity with privacy cleanup and Raider.IO links.',
  'Raid-plan saves now confirm directly on the Save button.',
  'Crystal-duty changes no longer move Phase 2 assignments.',
  'Intermission NPC Starsplinters protect dropped player crystals.',
]
const ISSUE_URL = `${PROJECT_URL}/issues/new/choose`
const RAIDER_IO_PROFILE = 'https://raider.io/characters/eu/antonidas/Pestivator'
const ASGARD_RAID_PLAN_ASSET = `${import.meta.env.BASE_URL}raidplans/asgard.txt`
const AUDIO_CUES_URL = `${PROJECT_URL}/blob/main/docs/audio-cues.md`
const P4_VOICE_CUE_URLS: Record<P4VoiceClip, string> = {
  left: new URL('../sounds/tts/left.wav', import.meta.url).href,
  right: new URL('../sounds/tts/right.wav', import.meta.url).href,
  move: new URL('../sounds/tts/move.wav', import.meta.url).href,
}
const MUSIC_TRACKS = [
  { id: 'criminal', label: 'Criminal Dark Tech · 8:03', src: new URL('../sounds/pixabay/voldemarsf-criminal-dark-tech-surveillance-police-patrol-454563.mp3', import.meta.url).href },
  { id: 'beast', label: 'GYM · Beast Mode ON · 8:07', src: new URL('../sounds/pixabay/ejah_music-gym-beast-mode-on-438605.mp3', import.meta.url).href },
] as const
type MusicTrackId = typeof MUSIC_TRACKS[number]['id']
const DEFAULT_MUSIC_TRACK: MusicTrackId = 'criminal'
const DEFAULT_MUSIC_VOLUME = .2
const DEFAULT_ENCOUNTER_SOUND_VOLUME = .65
const NO_CRYSTAL_ASSIGNMENTS: number[] = []
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.6.0'
const APP_BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : new Date().toISOString()
const APP_GIT_REVISION = typeof __GIT_REVISION__ === 'string' ? __GIT_REVISION__ : 'unknown'
const PERSONAL_JUMP_SECONDS = .65
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
const DEFAULT_P3_ASSIGNMENTS: Assignment[] = Array.from({ length: 20 }, (_, index) => {
  const side: -1 | 1 = index < 10 ? -1 : 1
  const sideIndex = index % 10
  const boss = p3BossPosition(side, WORLD.center, 1)
  const bossRadius = distance(boss, WORLD.center)
  const radial = { x: (boss.x - WORLD.center.x) / bossRadius, y: (boss.y - WORLD.center.y) / bossRadius }
  const tangent = { x: -radial.y, y: radial.x }
  return {
    x: boss.x + radial.x * (sideIndex % 2 ? 12 : 2) + tangent.x * (sideIndex - 4.5) * 10,
    y: boss.y + radial.y * (sideIndex % 2 ? 12 : 2) + tangent.y * (sideIndex - 4.5) * 10,
  }
})
const DEFAULT_P3_BOSS_POSITIONS: Assignment[] = [{ x: 406, y: 398 }, { x: 554, y: 398 }]
const P3_PLANNER_SCALE = 2.8
const P3_PLANNER_CENTER: Point = { x: WORLD.center.x, y: 390 }
const DEFAULT_START_SLOTS: Assignment[] = [
  { x: WORLD.center.x, y: WORLD.center.y + 222 },
  { x: WORLD.center.x - 222, y: WORLD.center.y },
  { x: WORLD.center.x, y: WORLD.center.y - 222 },
  { x: WORLD.center.x + 222, y: WORLD.center.y },
]
const DEFAULT_P1_ASSIGNMENTS: Assignment[] = [
  { x: 368.5307864874153, y: 462.59201659297275 },
  { x: 360.72379912663755, y: 478.1602983988356 },
  { x: 378.7225201269101, y: 469.32514581863927 },
  { x: 418.0971615720524, y: 493.26946870451235 },
  { x: 380.8548034934497, y: 449.9565138282387 },
  { x: 378.33905284792047, y: 432.1040717020427 },
  { x: 379.1059874058998, y: 500.4066613180652 },
  { x: 397.96615720524017, y: 491.2549126637555 },
  { x: 398.9727074235807, y: 441.89828966521105 },
  { x: 364.75, y: 437.86917758369725 },
  { x: 391.9268558951965, y: 419.738173216885 },
  { x: 408.0316593886463, y: 478.1602983988356 },
  { x: 415.07751091703057, y: 430.81823144104806 },
  { x: 351.6648471615721, y: 460.02929403202336 },
  { x: 399.4297531923521, y: 462.8018647878955 },
  { x: 331.53384279475983, y: 448.9492358078603 },
  { x: 400.985807860262, y: 422.7600072780204 },
  { x: 407.8660333301249, y: 462.41814237432243 },
  { x: 371.7958515283843, y: 422.7600072780204 },
  { x: 417.06924802587685, y: 462.03441996074923 },
]
function normalizeP1Assignments(points: Assignment[]): Assignment[] {
  return normalizeP1PlanAssignments(points, DEFAULT_P1_ASSIGNMENTS, WORLD.center, P1_INNER_RADIUS, P1_OUTER_RADIUS)
}
const DEFAULT_P1_BOSS_POSITION: Assignment = { x: 378.84170305676855, y: 473.1239082969432 }
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
  { value: 'monk', label: 'Monk', color: '#00a98f' },
]
const DEFAULT_PROFILES: PlayerProfile[] = Array.from({ length: 20 }, (_, index) => ({
  name: `Player ${index + 1}`,
  playerClass: CLASS_OPTIONS[index % CLASS_OPTIONS.length].value,
  crystal: [1, 4, 7, 10, 13, 16].includes(index),
}))
const DEFAULT_TANK_ASSIGNMENTS: [number, number] = [0, 1]
const DEFAULT_KEY_BINDINGS: KeyBindings = { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', turnLeft: 'KeyQ', turnRight: 'KeyE', jump: 'Space', crystal: 'KeyC', interrupt: P1_DEFAULT_INTERRUPT_KEY, taunt: 'Numpad1', pause: 'KeyP', healthPot: 'NumpadDecimal', shield: 'Numpad7', mainAbility: 'KeyF' }
const DEFAULT_HUD_LAYOUT: HudLayout = {
  mechanic: { x: 43, y: 23 },
  beam: { x: 57, y: 23 },
  crystal: { x: 50, y: 78 },
  playerHealth: { x: 21, y: 53 },
  bossHealth: { x: 79, y: 53 },
  castbar: { x: 50, y: 65 },
  actions: { x: 50, y: 68 },
}
const KEY_BIND_LABELS: { action: keyof KeyBindings; label: string }[] = [
  { action: 'forward', label: 'Forward' }, { action: 'backward', label: 'Backward' },
  { action: 'left', label: 'Strafe left' }, { action: 'right', label: 'Strafe right' },
  { action: 'turnLeft', label: 'Rotate left' }, { action: 'turnRight', label: 'Rotate right' },
  { action: 'jump', label: 'Jump' },
  { action: 'crystal', label: 'Drop crystal' }, { action: 'pause', label: '(Un)pause' },
  { action: 'interrupt', label: 'Interrupt' },
  { action: 'taunt', label: 'Taunt / tank action' },
  { action: 'healthPot', label: 'Health potion' }, { action: 'shield', label: 'Shield' },
  { action: 'mainAbility', label: 'Main ability' },
]
function loadKeyBindings(): KeyBindings {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-keybindings') || 'null')
    if (saved) {
      const legacyPause = typeof saved.jump !== 'string' && saved.pause === 'Space'
      const legacyTurning = typeof saved.turnLeft !== 'string' || typeof saved.turnRight !== 'string'
      return Object.fromEntries(Object.entries(DEFAULT_KEY_BINDINGS).map(([key, fallback]) => {
        if (legacyPause && key === 'pause') return [key, 'KeyP']
        if (legacyTurning && key === 'crystal' && saved.crystal === 'KeyE') return [key, 'KeyC']
        if (legacyTurning && key === 'healthPot' && saved.healthPot === 'KeyQ') return [key, 'NumpadDecimal']
        if (legacyTurning && key === 'shield' && saved.shield === 'KeyR') return [key, 'Numpad7']
        return [key, typeof saved[key] === 'string' ? saved[key] : fallback]
      })) as unknown as KeyBindings
    }
  } catch { /* use defaults */ }
  return { ...DEFAULT_KEY_BINDINGS }
}
function loadBoolean(key: string, fallback: boolean) {
  const saved = localStorage.getItem(key)
  return saved === null ? fallback : saved === 'true'
}

function createTtsUtterance(text: string, gameSpeed: number, voice?: SpeechSynthesisVoice) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = voice?.lang || 'en-US'
  utterance.rate = Math.min(1.5, Math.max(1, gameSpeed))
  utterance.volume = 1
  if (voice) utterance.voice = voice
  return utterance
}
function loadHudLayout(): HudLayout {
  const keys: HudElement[] = ['mechanic', 'beam', 'crystal', 'playerHealth', 'bossHealth', 'castbar', 'actions']
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
function loadMusicTrack(): MusicTrackId {
  const saved = localStorage.getItem('lura-music-track')
  return MUSIC_TRACKS.some(track => track.id === saved) ? saved as MusicTrackId : DEFAULT_MUSIC_TRACK
}
function loadMusicVolume() {
  const stored = localStorage.getItem('lura-music-volume')
  if (stored === null) return DEFAULT_MUSIC_VOLUME
  const saved = Number(stored)
  return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : DEFAULT_MUSIC_VOLUME
}
function loadEncounterSoundVolume() {
  const stored = localStorage.getItem('lura-encounter-sounds-volume')
  if (stored === null) return DEFAULT_ENCOUNTER_SOUND_VOLUME
  const saved = Number(stored)
  return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : DEFAULT_ENCOUNTER_SOUND_VOLUME
}
function keyLabel(code: string) {
  if (!code) return 'Unbound'
  if (code === 'Space') return 'Space'
  if (code === 'NumpadDecimal') return 'Num Del'
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ')
}
function p1LiveRunePositions(
  player: Point,
  npcPositions: readonly Point[],
  assignment: number,
  profileCount: number,
): Partial<Record<P1Rune, Point>> {
  const runes = ['T', 'X', 'O', 'V', '+'] as P1Rune[]
  return Object.fromEntries(runes.flatMap((rune, runeIndex) => {
    if (assignment % runes.length === runeIndex) return [[rune, player]]
    const profileIndex = Array.from({ length: profileCount }, (_, index) => index)
      .find(index => index !== assignment && index % runes.length === runeIndex)
    if (profileIndex === undefined) return []
    const npcOrdinal = profileIndex < assignment ? profileIndex : profileIndex - 1
    const point = npcPositions[npcOrdinal]
    return point ? [[rune, point]] : []
  })) as Partial<Record<P1Rune, Point>>
}
function assignUniqueKey(current: KeyBindings, action: keyof KeyBindings, code: string): KeyBindings {
  return Object.fromEntries(Object.entries(current).map(([key, value]) => [key, key === action ? code : value === code ? '' : value])) as unknown as KeyBindings
}
const ARENA_BACKGROUND = new URL('../images/midnight_falls.png', import.meta.url).href
function loadPositions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-player-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved
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
function loadP1Positions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p1-player-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return normalizeP1Assignments(saved)
  } catch { /* use maintained guild fallback */ }
  return DEFAULT_P1_ASSIGNMENTS.map(point => ({ ...point }))
}
function loadP1BossPosition(): Assignment {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p1-boss-position') || 'null')
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) return saved
  } catch { /* use default */ }
  return { ...DEFAULT_P1_BOSS_POSITION }
}
function loadP2SpreadPositions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p2-spread-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved.map(clampToP2Arena)
  } catch { /* use defaults */ }
  return DEFAULT_P2_SPREAD_ASSIGNMENTS.map(point => ({ ...point }))
}
function clampToP3Arena(point: Assignment): Assignment {
  const margin = 8
  return {
    x: Math.max(WORLD.center.x - P3_OUTER_RADIUS + margin, Math.min(WORLD.center.x + P3_OUTER_RADIUS - margin, point.x)),
    y: Math.max(WORLD.center.y - P3_OUTER_RADIUS + margin, Math.min(WORLD.center.y + P3_OUTER_RADIUS - margin, point.y)),
  }
}
function orientP3OpeningSouth(points: Assignment[]): Assignment[] {
  if (!points.length || points.reduce((sum, point) => sum + point.y, 0) / points.length >= WORLD.center.y) return points
  return points.map(point => ({ x: point.x, y: WORLD.center.y * 2 - point.y }))
}
function loadP3Positions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p3-player-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 20 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return orientP3OpeningSouth(saved).map(clampToP3Arena)
  } catch { /* use defaults */ }
  return DEFAULT_P3_ASSIGNMENTS.map(point => ({ ...point }))
}
function loadP3BossPositions(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-p3-boss-positions') || 'null')
    if (Array.isArray(saved) && saved.length === 2 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return orientP3OpeningSouth(saved)
  } catch { /* use defaults */ }
  return DEFAULT_P3_BOSS_POSITIONS.map(point => ({ ...point }))
}
function loadCrystalAssignments(): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-crystal-assignments') || 'null')
    if (Array.isArray(saved)) return saved.filter(value => Number.isInteger(value) && value >= 0 && value < 20)
  } catch { /* use defaults */ }
  return [1, 4, 7, 10, 13, 16]
}
function normalizeCrystalAssignments(values: unknown, fallback = loadCrystalAssignments()): number[] {
  const valid = Array.isArray(values) ? values.filter(value => Number.isInteger(value) && value >= 0 && value < 20) as number[] : []
  const unique = [...new Set(valid)]
  for (const value of [...fallback, ...Array.from({ length: 20 }, (_, index) => index)]) {
    if (unique.length >= 6) break
    if (!unique.includes(value)) unique.push(value)
  }
  return unique.slice(0, 6)
}
function loadPhaseCrystalAssignments(key: keyof PhaseCrystalAssignments, legacy: number[]): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem(`lura-${key}-crystal-assignments`) || 'null')
    if (Array.isArray(saved)) return normalizeCrystalAssignments(saved, legacy)
  } catch { /* use legacy roster */ }
  return normalizeCrystalAssignments(legacy)
}
function updateCrystalAssignmentSlot(assignments: number[], slot: number, playerIndex: number): number[] {
  const next = [...assignments]
  const duplicateSlot = next.indexOf(playerIndex)
  if (duplicateSlot >= 0) next[duplicateSlot] = next[slot]
  next[slot] = playerIndex
  return normalizeCrystalAssignments(next, assignments)
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
function normalizeTankAssignments(value: unknown): [number, number] {
  if (!Array.isArray(value)) return [...DEFAULT_TANK_ASSIGNMENTS]
  const valid = value.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < 20)
  if (valid.length < 2 || valid[0] === valid[1]) return [...DEFAULT_TANK_ASSIGNMENTS]
  return [valid[0], valid[1]]
}
function updateTankAssignment(assignments: [number, number], slot: TankIndex, playerIndex: number): [number, number] {
  const next: [number, number] = [...assignments]
  const other: TankIndex = slot === 0 ? 1 : 0
  if (next[other] === playerIndex) next[other] = next[slot]
  next[slot] = playerIndex
  return next
}
function decodeRaidPlan(value: string): RaidPlan | null {
  try {
    const raw = value.includes('#raidplan=') ? value.split('#raidplan=')[1] : value
    const plan = JSON.parse(decodeURIComponent(atob(raw.trim())))
    if (!Array.isArray(plan.positions) || plan.positions.length !== 20 || !Array.isArray(plan.startSlots) || plan.startSlots.length !== 4 || !Array.isArray(plan.profiles) || plan.profiles.length !== 20) return null
    if (!plan.positions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) || !plan.startSlots.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y))) return null
    if (!plan.profiles.every((profile: PlayerProfile) => typeof profile.name === 'string' && typeof profile.crystal === 'boolean' && CLASS_OPTIONS.some(option => option.value === profile.playerClass))) return null
    const p2Positions = Array.isArray(plan.p2Positions) && plan.p2Positions.length === 20 && plan.p2Positions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? plan.p2Positions : DEFAULT_P2_ASSIGNMENTS
    const p1Positions = Array.isArray(plan.p1Positions) && plan.p1Positions.length === 20 && plan.p1Positions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? normalizeP1Assignments(plan.p1Positions) : DEFAULT_P1_ASSIGNMENTS
    const p1BossPosition = Number.isFinite(plan.p1BossPosition?.x) && Number.isFinite(plan.p1BossPosition?.y)
      ? plan.p1BossPosition
      : DEFAULT_P1_BOSS_POSITION
    const p2SpreadPositions = Array.isArray(plan.p2SpreadPositions) && plan.p2SpreadPositions.length === 20 && plan.p2SpreadPositions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? plan.p2SpreadPositions : DEFAULT_P2_SPREAD_ASSIGNMENTS
    const p3Positions = Array.isArray(plan.p3Positions) && plan.p3Positions.length === 20 && plan.p3Positions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? plan.p3Positions : DEFAULT_P3_ASSIGNMENTS
    const p3BossPositions = Array.isArray(plan.p3BossPositions) && plan.p3BossPositions.length === 2 && plan.p3BossPositions.every((point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)) ? plan.p3BossPositions : DEFAULT_P3_BOSS_POSITIONS
    const legacyCrystals = normalizeCrystalAssignments(plan.profiles.map((profile: PlayerProfile, index: number) => profile.crystal ? index : -1))
    const crystalAssignments = {
      p1: normalizeCrystalAssignments(plan.crystalAssignments?.p1, legacyCrystals),
      intermission: normalizeCrystalAssignments(plan.crystalAssignments?.intermission, legacyCrystals),
      p2: normalizeCrystalAssignments(plan.crystalAssignments?.p2, legacyCrystals),
      p3: normalizeCrystalAssignments(plan.crystalAssignments?.p3, legacyCrystals),
    }
    return { ...plan, p1Positions, p1BossPosition, p2Positions, p2SpreadPositions, p3Positions, p3BossPositions, crystalAssignments, tankAssignments: normalizeTankAssignments(plan.tankAssignments) }
  } catch { return null }
}
function normalizeRaidPlanForUse(plan: RaidPlan): RaidPlan {
  return {
    p1Positions: normalizeP1Assignments(plan.p1Positions),
    p1BossPosition: { ...plan.p1BossPosition },
    positions: plan.positions.map(point => ({ ...point })),
    p2Positions: plan.p2Positions.map(clampToP2Arena),
    p2SpreadPositions: plan.p2SpreadPositions.map(clampToP2Arena),
    p3Positions: orientP3OpeningSouth(plan.p3Positions).map(clampToP3Arena),
    p3BossPositions: orientP3OpeningSouth(plan.p3BossPositions),
    startSlots: plan.startSlots.map(clampStartSlot),
    profiles: plan.profiles.map((profile, index) => ({ ...profile, crystal: plan.crystalAssignments.intermission.includes(index) })),
    crystalAssignments: plan.crystalAssignments,
    tankAssignments: normalizeTankAssignments(plan.tankAssignments),
  }
}
function persistRaidPlan(plan: RaidPlan) {
  localStorage.setItem('lura-p1-player-positions', JSON.stringify(plan.p1Positions))
  localStorage.setItem('lura-p1-boss-position', JSON.stringify(plan.p1BossPosition))
  localStorage.setItem('lura-player-positions', JSON.stringify(plan.positions))
  localStorage.setItem('lura-p2-player-positions', JSON.stringify(plan.p2Positions))
  localStorage.setItem('lura-p2-spread-positions', JSON.stringify(plan.p2SpreadPositions))
  localStorage.setItem('lura-p3-player-positions', JSON.stringify(plan.p3Positions))
  localStorage.setItem('lura-p3-boss-positions', JSON.stringify(plan.p3BossPositions))
  localStorage.setItem('lura-player-profiles', JSON.stringify(plan.profiles))
  localStorage.setItem('lura-crystal-assignments', JSON.stringify(plan.crystalAssignments.intermission))
  localStorage.setItem('lura-p1-crystal-assignments', JSON.stringify(plan.crystalAssignments.p1))
  localStorage.setItem('lura-intermission-crystal-assignments', JSON.stringify(plan.crystalAssignments.intermission))
  localStorage.setItem('lura-p2-crystal-assignments', JSON.stringify(plan.crystalAssignments.p2))
  localStorage.setItem('lura-p3-crystal-assignments', JSON.stringify(plan.crystalAssignments.p3))
  localStorage.setItem('lura-tank-assignments', JSON.stringify(plan.tankAssignments))
  localStorage.setItem('lura-start-slots', JSON.stringify(plan.startSlots))
}
function loadStartSlots(): Assignment[] {
  try {
    const saved = JSON.parse(localStorage.getItem('lura-start-slots') || 'null')
    if (Array.isArray(saved) && saved.length === 4 && saved.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) return saved.map(clampStartSlot)
  } catch { /* use defaults */ }
  return DEFAULT_START_SLOTS.map(point => ({ ...point }))
}
function loadTankAssignments(): [number, number] {
  try {
    return normalizeTankAssignments(JSON.parse(localStorage.getItem('lura-tank-assignments') || 'null'))
  } catch {
    return [...DEFAULT_TANK_ASSIGNMENTS]
  }
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

function phaseForEntry(entryMode: EntryMode): PhaseKey {
  if (entryMode === 'arena0') return 'p1'
  if (entryMode === 'arena2') return 'p2'
  if (entryMode === 'arena3') return 'p3'
  if (entryMode === 'arena4') return 'p4'
  return 'intermission'
}

function loadEntryMode(): EntryMode {
  const saved = localStorage.getItem('lura-entry-mode')
  return saved === 'arena0' || saved === 'arena1' || saved === 'arena2' || saved === 'arena3' || saved === 'arena4'
    ? saved
    : 'arena0'
}

function loadInitialSharedRaidPlan(): RaidPlan | null {
  if (!window.location.hash.startsWith('#raidplan=')) return null
  const decoded = decodeRaidPlan(window.location.hash)
  if (!decoded) return null
  const plan = normalizeRaidPlanForUse(decoded)
  persistRaidPlan(plan)
  return plan
}

function LiveActivityToast({ row }: { row: ActivityFeedRow | undefined }) {
  if (!row) return null
  const message = row.type === 'achievement'
    ? `earned ${row.achievementTitle}`
    : row.type === 'completion'
      ? `completed a ${row.difficulty} ${row.duty === 'crystal' ? 'crystal' : 'non-crystal'} full run · ${row.score} points · ${((row.durationMs ?? 0) / 1000).toFixed(1)}s`
      : `wiped in ${row.phase} · ${row.reason}`
  return <aside className={`live-activity-toast ${row.type}`} role="status" aria-live="polite"><span>LIVE ACTIVITY</span><strong>{row.displayName}</strong><p>{message}</p></aside>
}
export function activityFeedRowClass(id: string, newIds: Set<string>): string {
  return newIds.has(id) ? 'new-activity' : ''
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [entryMode, setEntryMode] = useState<EntryMode>(loadEntryMode)
  const [initialSharedPlan] = useState(loadInitialSharedRaidPlan)
  const [useAsgardAsInitialPlan] = useState(() => !initialSharedPlan && !localStorage.getItem('lura-player-positions'))
  const [movementSpeed, setMovementSpeed] = useState(18)
  const [gameSpeed, setGameSpeed] = useState(() => {
    const saved = Number(localStorage.getItem('lura-game-speed'))
    return Number.isFinite(saved) && saved >= 1 && saved <= 2.5 ? saved : 1
  })
  const movementBonus = true
  const [invertCameraX, setInvertCameraX] = useState(() => loadBoolean('lura-invert-camera-x', false))
  const [invertCameraY, setInvertCameraY] = useState(() => loadBoolean('lura-invert-camera-y', true))
  const [rotationSpeed, setRotationSpeed] = useState(() => {
    const saved = Number(localStorage.getItem('lura-player-rotation-speed'))
    return Number.isFinite(saved) && saved >= 45 && saved <= 270 ? saved : 150
  })
  const [hudLayout, setHudLayout] = useState(loadHudLayout)
  const [hudActionButtonsEnabled, setHudActionButtonsEnabled] = useState(() => loadBoolean('lura-hud-action-buttons-enabled', false))
  const [liveActivityNotificationsEnabled, setLiveActivityNotificationsEnabled] = useState(() => loadBoolean('lura-live-activity-notifications-enabled', true))
  const [p1RunePanelOrientation, setP1RunePanelOrientation] = useState<P1RunePanelOrientation>(() =>
    localStorage.getItem('lura-p1-rune-panel-orientation') === 'positional' ? 'positional' : 'pentagram')
  const [combatProjectilesEnabled, setCombatProjectilesEnabled] = useState(() => loadBoolean('lura-combat-projectiles-enabled', true))
  const [musicTrack, setMusicTrack] = useState<MusicTrackId>(loadMusicTrack)
  const [musicVolume, setMusicVolume] = useState(loadMusicVolume)
  const [musicMuted, setMusicMuted] = useState(() => !loadBoolean('lura-music-enabled', false))
  const [musicPreviewing, setMusicPreviewing] = useState(false)
  const [encounterSoundsEnabled, setEncounterSoundsEnabled] = useState(() => FEATURE_FLAGS.encounterSounds && loadBoolean('lura-encounter-sounds-enabled', false))
  const [encounterSoundVolume, setEncounterSoundVolume] = useState(loadEncounterSoundVolume)
  const [ttsEnabled, setTtsEnabled] = useState(() => loadBoolean('lura-tts-enabled', false))
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([])
  const [ttsVoiceId, setTtsVoiceId] = useState(() => localStorage.getItem('lura-tts-voice') || '')
  const [timedVoiceReady, setTimedVoiceReady] = useState(false)
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(loadKeyBindings)
  const [assignment, setAssignment] = useState(loadAssignment)
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('lura-player-name') || '')
  const [playerNameSource, setPlayerNameSource] = useState<'raid' | 'profile' | 'custom'>(() => {
    const saved = localStorage.getItem('lura-player-name-source')
    if (saved === 'profile' || saved === 'custom') return saved
    return localStorage.getItem('lura-player-name') ? 'custom' : 'raid'
  })
  const [p1Positions, setP1Positions] = useState<Assignment[]>(() => initialSharedPlan?.p1Positions ?? loadP1Positions())
  const [p1BossOpening, setP1BossOpeningState] = useState<Assignment>(() => initialSharedPlan?.p1BossPosition ?? loadP1BossPosition())
  const [positions, setPositions] = useState<Assignment[]>(() => initialSharedPlan?.positions ?? loadPositions())
  const [phasePositions, setPhasePositions] = useState<Assignment[]>(positions)
  const [p2Positions, setP2Positions] = useState<Assignment[]>(() => initialSharedPlan?.p2Positions ?? loadP2Positions())
  const [p2SpreadPositions, setP2SpreadPositions] = useState<Assignment[]>(() => initialSharedPlan?.p2SpreadPositions ?? loadP2SpreadPositions())
  const [p3Positions, setP3Positions] = useState<Assignment[]>(() => initialSharedPlan?.p3Positions ?? loadP3Positions())
  const [p3BossPositions, setP3BossPositions] = useState<Assignment[]>(() => initialSharedPlan?.p3BossPositions ?? loadP3BossPositions())
  const [startSlots, setStartSlots] = useState<Assignment[]>(() => initialSharedPlan?.startSlots ?? loadStartSlots())
  const [tankAssignments, setTankAssignments] = useState<[number, number]>(() => initialSharedPlan?.tankAssignments ?? loadTankAssignments())
  const setP1BossOpening = (point: Assignment) => {
    setP1BossOpeningState(point)
    setStartSlots(current => current.map((slot, index) => index === 0 ? point : slot))
  }
  const [profiles, setProfiles] = useState<PlayerProfile[]>(() => initialSharedPlan?.profiles ?? loadProfiles())
  const legacyCrystalAssignments = profiles.map((profile, index) => profile.crystal ? index : -1).filter(index => index >= 0)
  const [p1CrystalAssignments, setP1CrystalAssignments] = useState(() => initialSharedPlan?.crystalAssignments.p1 ?? loadPhaseCrystalAssignments('p1', legacyCrystalAssignments))
  const [intermissionCrystalAssignments, setIntermissionCrystalAssignments] = useState(() => initialSharedPlan?.crystalAssignments.intermission ?? loadPhaseCrystalAssignments('intermission', legacyCrystalAssignments))
  const [p2CrystalAssignments, setP2CrystalAssignments] = useState(() => initialSharedPlan?.crystalAssignments.p2 ?? loadPhaseCrystalAssignments('p2', legacyCrystalAssignments))
  const [p3CrystalAssignments, setP3CrystalAssignments] = useState(() => initialSharedPlan?.crystalAssignments.p3 ?? loadPhaseCrystalAssignments('p3', legacyCrystalAssignments))
  const [shareInput, setShareInput] = useState(() => initialSharedPlan ? window.location.href : '')
  const [shareStatus, setShareStatus] = useState(() => initialSharedPlan ? 'Shared raid plan loaded' : '')
  const [layoutSaveConfirmed, setLayoutSaveConfirmed] = useState(false)
  const [stats, setStats] = useState<GameStats>({ score: 1000, hits: 0, crystalDropped: false, time: 0 })
  const [phaseResults, setPhaseResults] = useState<PhaseResult[]>([])
  const [completionCopyStatus, setCompletionCopyStatus] = useState('')
  const [completionPreview, setCompletionPreview] = useState(false)
  const [completionProof, setCompletionProof] = useState<ResultProof | null>(null)
  const [localAchievementCollection, setLocalAchievementCollection] = useState<AchievementCollectionData>(() => {
    const collection = parseAchievementCollection(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY))
    const { verifiedProgress: _verifiedProgress, ...localCollection } = collection
    return {
      ...localCollection,
      records: collection.records.map(record => ({ ...record, verified: false })),
    }
  })
  const [accountAchievementCollection, setAccountAchievementCollection] = useState(emptyCollection)
  const achievementCollection = mergeAchievementCollections(localAchievementCollection, accountAchievementCollection)
  const [achievementPopups, setAchievementPopups] = useState<AchievementDefinition[]>([])
  const [resultAchievements, setResultAchievements] = useState<AchievementDefinition[]>([])
  const [attemptNumber, setAttemptNumber] = useState(() => Math.max(0, Number(localStorage.getItem('lura-attempt-count')) || 0))
  const [onlineSession, setOnlineSession] = useState<OnlineSession>({ authenticated: false })
  const [achievementSyncRevision, setAchievementSyncRevision] = useState(0)
  const [setupTab, setSetupTab] = useState<'game' | 'keyboard' | 'hud' | 'raidplan' | 'leaderboard' | 'profile'>(() => window.location.hash.startsWith('#raidplan=') ? 'raidplan' : 'game')
  const [onlineAttempt, setOnlineAttempt] = useState<ActiveOnlineAttempt | null>(null)
  const [runAttribution, setRunAttribution] = useState<RunAttributionMode>('local')
  const runAttributionRef = useRef<RunAttributionMode>('local')
  const [onlineResultStatus, setOnlineResultStatus] = useState('')
  const [activityFeed, setActivityFeed] = useState<ActivityFeedRow[]>([])
  const [activityProfileId, setActivityProfileId] = useState<string | null>(null)
  const [activityNotificationQueue, setActivityNotificationQueue] = useState<ActivityFeedRow[]>([])
  const [newActivityFeedIds, setNewActivityFeedIds] = useState<Set<string>>(new Set())
  const seenActivityIdsRef = useRef<Set<string> | null>(null)
  const onlineCompletionStartedRef = useRef('')
  const layoutSaveFeedbackTimerRef = useRef<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [player, setPlayer] = useState<Point>(positions[0])
  const [crystal, setCrystal] = useState<Point | null>(null)
  const [crystalSpent, setCrystalSpent] = useState(false)
  const [event, setEvent] = useState<EventKind>('beam')
  const [eventTime, setEventTime] = useState(0)
  const [beamAngles, setBeamAngles] = useState<number[]>(createBossBeams())
  const [beamPattern, setBeamPattern] = useState<'line' | 'gap'>('line')
  const [npcSplinters, setNpcSplinters] = useState<number[]>([])
  const [npcCrystals, setNpcCrystals] = useState<Point[]>([])
  const [npcCarrier, setNpcCarrier] = useState<number | null>(null)
  const [npcCrystalAge, setNpcCrystalAge] = useState(0)
  const [playerSplinterRotation, setPlayerSplinterRotation] = useState(0)
  const [crystalAge, setCrystalAge] = useState(0)
  const [failureFlash, setFailureFlash] = useState(false)
  const [wipeReason, setWipeReason] = useState('')
  const [softWipeNotice, setSoftWipeNotice] = useState('')
  const [crystalDutyNotice, setCrystalDutyNotice] = useState('')
  const [cycle, setCycle] = useState(1)
  const [p2Cycle, setP2Cycle] = useState(1)
  const [p2Soaked, setP2Soaked] = useState(false)
  const [p2OrbReturnAge, setP2OrbReturnAge] = useState(-1)
  const [p2BeamAssignees, setP2BeamAssignees] = useState<number[]>([])
  const [p2BeamOrbIndices, setP2BeamOrbIndices] = useState<number[]>([])
  const [p2ReturningOrbIndices, setP2ReturningOrbIndices] = useState<number[]>([])
  const [p2ResolvedOrbIndices, setP2ResolvedOrbIndices] = useState<number[]>([])
  const [p2BeamImpactAngle, setP2BeamImpactAngle] = useState(0)
  const [p3Round, setP3Round] = useState(1)
  const [p4Cycle, setP4Cycle] = useState(1)
  const [p4PatternSeed, setP4PatternSeed] = useState(() => Math.floor(Math.random() * 2147483647))
  const [p3ArchangelDuty, setP3ArchangelDuty] = useState<1 | 2>(randomCrystalDropDuty)
  const [p3PoolHealth, setP3PoolHealth] = useState(Array(6).fill(P3_POOL_HEALTH))
  const [p3RuneOrder, setP3RuneOrder] = useState<RuneSymbol[]>(['T', 'X', 'O'])
  const [p3RuneStep, setP3RuneStep] = useState(0)
  const [p3ResolvedRunes, setP3ResolvedRunes] = useState<RuneSymbol[]>([])
  const [health, setHealth] = useState(100)
  const [healthPotUsed, setHealthPotUsed] = useState(false)
  const [shieldUsed, setShieldUsed] = useState(false)
  const [tankMechanic, setTankMechanic] = useState<TankMechanicState>(createTankMechanicState)
  const [p4PlayerConeUntil, setP4PlayerConeUntil] = useState(0)
  const [bossHealth, setBossHealth] = useState(100)
  const [mainCastState, setMainCastState] = useState<MainAbilityCastState>(idleMainAbilityCast)
  const [mainAbilityUsed, setMainAbilityUsed] = useState(false)
  const [luraKilledEarly, setLuraKilledEarly] = useState(false)
  const [p3DamageClear, setP3DamageClear] = useState(false)
  const [mainProjectileFiredAt, setMainProjectileFiredAt] = useState<number | null>(null)
  const [personalJumpProgress, setPersonalJumpProgress] = useState(0)
  const [startSlot, setStartSlot] = useState(0)
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [p1Sequence, setP1Sequence] = useState(1)
  const [p1Seed, setP1Seed] = useState(() => Math.floor(Math.random() * 2147483647))
  const [p1InterruptCast, setP1InterruptCast] = useState(0)
  const [p1InterruptPressed, setP1InterruptPressed] = useState(false)
  const [p1MemoryOrderState, setP1MemoryOrderState] = useState<P1Rune[]>(['T', 'X', 'O', 'V', '+'])
  const [p1FailedMemoryRune, setP1FailedMemoryRune] = useState<P1Rune | null>(null)
  const [p1GlaiveSets, setP1GlaiveSets] = useState<P1GlaiveSet[]>([])
  const [p1Soaks, setP1Soaks] = useState<P1ReactiveSoak[]>([])
  const [p1SoakResolved, setP1SoakResolved] = useState<number[]>([])
  const [p1CrystalCollected, setP1CrystalCollected] = useState(false)
  const [p1WrongCrystalHeld, setP1WrongCrystalHeld] = useState(false)
  const [p1StolenCrystalSlot, setP1StolenCrystalSlot] = useState<number | null>(null)
  const [p1WrongCrystalDeadline, setP1WrongCrystalDeadline] = useState<number | null>(null)
  const phaseCrystalAssignments: PhaseCrystalAssignments = { p1: p1CrystalAssignments, intermission: intermissionCrystalAssignments, p2: p2CrystalAssignments, p3: p3CrystalAssignments }
  const activeCrystalAssignments = event.startsWith('p1-') ? p1CrystalAssignments : event.startsWith('p2-') ? p2CrystalAssignments : event.startsWith('p3-') ? p3CrystalAssignments : event.startsWith('p4-') ? NO_CRYSTAL_ASSIGNMENTS : intermissionCrystalAssignments
  const entryCrystalAssignments = entryMode === 'arena0' ? p1CrystalAssignments : entryMode === 'arena2' ? p2CrystalAssignments : entryMode === 'arena3' ? p3CrystalAssignments : entryMode === 'arena4' ? NO_CRYSTAL_ASSIGNMENTS : intermissionCrystalAssignments
  const activeCrystalCarriers = crystalNpcOrdinals(activeCrystalAssignments, assignment)
  const controlledTank = (FEATURE_FLAGS.tankRoles && tankAssignments.indexOf(assignment) >= 0 ? tankAssignments.indexOf(assignment) : null) as TankIndex | null
  const hitRef = useRef(false)
  const unsafeRef = useRef(false)
  const wipeRef = useRef(false)
  const lastWipeAtRef = useRef(-Infinity)
  const wipeCountRef = useRef(0)
  const cameraForward = useRef<Point>({ x: 0, y: -1 })
  const playerRef = useRef<Point>(positions[0])
  const crystalAgeRef = useRef(0)
  const eventTimeRef = useRef(0)
  const timeRef = useRef(0)
  const statsRef = useRef(stats)
  const phaseResultsRef = useRef<PhaseResult[]>([])
  const phaseStartRef = useRef<PhaseStart>({ key: 'intermission', score: 1000, time: 0, hits: 0 })
  const phaseRecoveryRef = useRef<{ key: PhaseKey; status: RecoveryStatus }>({ key: 'intermission', status: 'disabled' })
  const droppedForPackRef = useRef(false)
  const healthRef = useRef(100)
  const healthTargetRef = useRef(100)
  const nextHealthTargetRef = useRef(Infinity)
  const healthPotUsedRef = useRef(false)
  const shieldUsedRef = useRef(false)
  const tankMechanicRef = useRef<TankMechanicState>(createTankMechanicState())
  const tankHudSignatureRef = useRef('')
  const tankFailureCountRef = useRef(0)
  const tankRolePlayedRef = useRef(false)
  const tankCrystalRolePlayedRef = useRef(false)
  const p4ConeTankPlayedRef = useRef(false)
  const p4ProtectionTankPlayedRef = useRef(false)
  const p4PlayerConeUntilRef = useRef(0)
  const p4PlayerConeReadyAtRef = useRef(0)
  const recoveryUseCountRef = useRef(0)
  const mainAbilityCastRef = useRef<MainAbilityCastState>(idleMainAbilityCast())
  const mainAbilityCastCountRef = useRef(0)
  const playerCrystalFailuresRef = useRef(0)
  const playerRuneFailuresRef = useRef(0)
  const playerPauseStartedRef = useRef(false)
  const playerPauseCycleRef = useRef(false)
  const bossHealthRef = useRef(100)
  const bossPlayerDamageRef = useRef(0)
  const jumpUntilRef = useRef(0)
  const jumpKeysRef = useRef(new Set<string>())
  const jumpCameraForwardRef = useRef<Point>({ x: 0, y: -1 })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsSpokenRef = useRef(new Set<string>())
  const encounterSoundPlayedRef = useRef(new Set<string>())
  const activeEncounterSoundsRef = useRef(new Set<HTMLAudioElement>())
  const timedVoiceAudiosRef = useRef<Partial<Record<P4VoiceClip, HTMLAudioElement>>>({})
  const timedVoiceTimersRef = useRef<number[]>([])
  const jumpOriginRef = useRef<Point>(positions[0])
  const pullOriginRef = useRef<Point>(WORLD.center)
  const p3FlightOriginRef = useRef<Point>(WORLD.center)
  const p3RuneCheckedRef = useRef(false)
  const p3RuneContactRef = useRef(false)
  const p3WrongRuneContactRef = useRef(false)
  const p3WrongRuneSinceRef = useRef<{ rune: RuneSymbol | null; since: number }>({ rune: null, since: 0 })
  const p3RuneContactsRef = useRef<RuneSymbol[]>([])
  const p3ResolvedRunesRef = useRef<RuneSymbol[]>([])
  const p3RuneFailedRef = useRef(false)
  const p3StarsCycleRef = useRef(-1)
  const p2OrbReturnAgeRef = useRef(-1)
  const p2OrbitAngleRef = useRef(0)
  const p2SeedRef = useRef(Math.floor(Math.random() * 2147483647))
  const p2BeamOrbIndicesRef = useRef<number[]>([])
  const p2ResolvedOrbIndicesRef = useRef<number[]>([])
  const p2OrbReturnHitRef = useRef(false)
  const p2OrbPlayerHitRef = useRef(false)
  const p2ReturnSoakCheckedRef = useRef(false)
  const p3LandingRequiredRef = useRef(false)
  const p4CycleRef = useRef(1)
  const renderedNpcPositionsRef = useRef<Point[]>([])
  const lastMistakeRef = useRef<{ label: string; time: number }>({ label: '', time: -Infinity })
  const p3PoolOccupancyRef = useRef([0, 0, 0, 0, 0, 0])
  const p3NpcLightCentersRef = useRef<Point[]>([])
  const p3UnsafeSecondsRef = useRef(0)
  const p4UnsafeSecondsRef = useRef(0)
  const p3DamageClearRef = useRef(false)
  const p4SplinterCheckedRef = useRef(-1)
  const p4NpcSplinterCheckedRef = useRef(new Set<string>())
  const p4LastBoxHitRef = useRef(-Infinity)
  const p4DestroyedBoxIdsRef = useRef(new Set<number>())
  const p1InterruptAssignmentRef = useRef(0)
  const p1InterruptPressedRef = useRef(false)
  const p1InterruptFailureTriggeredRef = useRef(false)
  const p1WrongCrystalHeldRef = useRef(false)
  const p1WrongCrystalPickedAtRef = useRef(-Infinity)
  const p1StolenCrystalSlotRef = useRef<number | null>(null)
  const p1TouchedCrystalSlotsRef = useRef(new Set<number>())
  const p1GlaiveSetsRef = useRef<P1GlaiveSet[]>([])
  const p1GlaiveContactRef = useRef(false)
  const p1SoakHitRef = useRef(false)
  const p1MemoryPlayerVerdictRef = useRef<boolean | null>(null)
  const p1MemoryFailureTriggeredRef = useRef(false)
  const crystalNoticeTimerRef = useRef<number | null>(null)
  const keysHeld = useRef(new Set<string>())
  statsRef.current = stats
  bossHealthRef.current = bossHealth

  useEffect(() => { localStorage.setItem('lura-selected-position', String(assignment)) }, [assignment])
  useEffect(() => { localStorage.setItem('lura-entry-mode', entryMode) }, [entryMode])
  useEffect(() => { localStorage.setItem('lura-player-name', playerName) }, [playerName])
  useEffect(() => { localStorage.setItem('lura-player-name-source', playerNameSource) }, [playerNameSource])
  useEffect(() => { localStorage.setItem('lura-keybindings', JSON.stringify(keyBindings)) }, [keyBindings])
  useEffect(() => { localStorage.setItem('lura-p1-crystal-assignments', JSON.stringify(p1CrystalAssignments)) }, [p1CrystalAssignments])
  useEffect(() => { localStorage.setItem('lura-intermission-crystal-assignments', JSON.stringify(intermissionCrystalAssignments)) }, [intermissionCrystalAssignments])
  useEffect(() => { localStorage.setItem('lura-p2-crystal-assignments', JSON.stringify(p2CrystalAssignments)) }, [p2CrystalAssignments])
  useEffect(() => { localStorage.setItem('lura-p3-crystal-assignments', JSON.stringify(p3CrystalAssignments)) }, [p3CrystalAssignments])
  useEffect(() => { localStorage.removeItem('lura-opening-speed-bonus') }, [])
  useEffect(() => { localStorage.setItem('lura-invert-camera-x', String(invertCameraX)) }, [invertCameraX])
  useEffect(() => { localStorage.setItem('lura-invert-camera-y', String(invertCameraY)) }, [invertCameraY])
  useEffect(() => { localStorage.setItem('lura-player-rotation-speed', String(rotationSpeed)) }, [rotationSpeed])
  useEffect(() => { localStorage.setItem('lura-game-speed', String(gameSpeed)) }, [gameSpeed])
  useEffect(() => { localStorage.setItem('lura-hud-layout', JSON.stringify(hudLayout)) }, [hudLayout])
  useEffect(() => { localStorage.setItem('lura-hud-action-buttons-enabled', String(hudActionButtonsEnabled)) }, [hudActionButtonsEnabled])
  useEffect(() => { localStorage.setItem('lura-live-activity-notifications-enabled', String(liveActivityNotificationsEnabled)) }, [liveActivityNotificationsEnabled])
  useEffect(() => { localStorage.setItem('lura-p1-rune-panel-orientation', p1RunePanelOrientation) }, [p1RunePanelOrientation])
  useEffect(() => {
    localStorage.removeItem('lura-health-pot-enabled')
    localStorage.removeItem('lura-shield-enabled')
  }, [])
  useEffect(() => {
    localStorage.setItem('lura-combat-projectiles-enabled', String(combatProjectilesEnabled))
    localStorage.removeItem('lura-main-ability-enabled')
  }, [combatProjectilesEnabled])
  useEffect(() => { localStorage.setItem('lura-music-track', musicTrack) }, [musicTrack])
  useEffect(() => { localStorage.setItem('lura-music-volume', String(musicVolume)) }, [musicVolume])
  useEffect(() => {
    localStorage.setItem('lura-music-enabled', String(!musicMuted))
    localStorage.removeItem('lura-music-muted')
  }, [musicMuted])
  useEffect(() => { localStorage.setItem('lura-tts-enabled', String(ttsEnabled)) }, [ttsEnabled])
  useEffect(() => {
    if (ttsVoiceId) localStorage.setItem('lura-tts-voice', ttsVoiceId)
    else localStorage.removeItem('lura-tts-voice')
  }, [ttsVoiceId])
  useEffect(() => {
    if (FEATURE_FLAGS.encounterSounds) localStorage.setItem('lura-encounter-sounds-enabled', String(encounterSoundsEnabled))
  }, [encounterSoundsEnabled])
  useEffect(() => {
    if (FEATURE_FLAGS.encounterSounds) localStorage.setItem('lura-encounter-sounds-volume', String(encounterSoundVolume))
  }, [encounterSoundVolume])
  useEffect(() => { setP3BossPlan(p3BossPositions) }, [p3BossPositions])
  useEffect(() => { p3ResolvedRunesRef.current = p3ResolvedRunes }, [p3ResolvedRunes])
  useEffect(() => {
    if (event === 'p4-countdown' || event === 'p4-transition') p4DestroyedBoxIdsRef.current.clear()
  }, [event, p3Round])
  useEffect(() => {
    if (!FEATURE_FLAGS.backgroundMusic) return
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'none'
    audioRef.current = audio
    return () => { audio.pause(); audio.removeAttribute('src'); audioRef.current = null }
  }, [])
  useEffect(() => {
    if (!FEATURE_FLAGS.backgroundMusic) return
    const audio = audioRef.current
    if (!audio) return
    const track = MUSIC_TRACKS.find(candidate => candidate.id === musicTrack) ?? MUSIC_TRACKS[0]
    if (audio.src !== track.src) { audio.src = track.src; audio.currentTime = 0 }
    audio.volume = musicVolume
    audio.muted = musicMuted
    if ((screen === 'game' || musicPreviewing) && !musicMuted) void audio.play().catch(() => { /* browser requires another user gesture */ })
    else audio.pause()
  }, [musicTrack, musicVolume, musicMuted, musicPreviewing, screen])
  const ttsAvailable = FEATURE_FLAGS.textToSpeech
    && typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof SpeechSynthesisUtterance !== 'undefined'
  const timedVoiceAvailable = timedVoiceSupported(
    FEATURE_FLAGS.textToSpeech,
    typeof Audio !== 'undefined',
  )
  const raidleadAvailable = ttsAvailable || timedVoiceAvailable
  const selectedTtsVoice = ttsVoices.find(voice => voice.voiceURI === ttsVoiceId)
  useEffect(() => {
    if (!ttsAvailable) return
    const refreshVoices = () => {
      setTtsVoices(window.speechSynthesis.getVoices()
        .filter(voice => /^en(?:-|_)/i.test(voice.lang))
        .sort((left, right) => left.lang.localeCompare(right.lang) || left.name.localeCompare(right.name)))
    }
    refreshVoices()
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
  }, [ttsAvailable])
  const automaticTtsVoice = ttsVoices.find(voice => voice.name.toLowerCase() === 'google us english')
  const activeTtsVoice = selectedTtsVoice || (!ttsVoiceId ? automaticTtsVoice : undefined)
  useEffect(() => {
    if (!timedVoiceAvailable) return
    timedVoiceAudiosRef.current = Object.fromEntries(
      (Object.entries(P4_VOICE_CUE_URLS) as [P4VoiceClip, string][]).map(([clip, url]) => {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audio.load()
        return [clip, audio]
      }),
    )
    setTimedVoiceReady(true)
    return () => {
      Object.values(timedVoiceAudiosRef.current).forEach(audio => {
        audio.pause()
        audio.removeAttribute('src')
      })
      timedVoiceAudiosRef.current = {}
    }
  }, [timedVoiceAvailable])
  useEffect(() => {
    const stopScheduledVoice = () => {
      timedVoiceTimersRef.current.forEach(timer => window.clearTimeout(timer))
      timedVoiceTimersRef.current = []
      Object.values(timedVoiceAudiosRef.current).forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    }
    stopScheduledVoice()
    if (!timedVoiceReady || !ttsEnabled || screen !== 'game' || paused || wipeReason || event !== 'p4-cycle') {
      return stopScheduledVoice
    }
    for (const cue of p4TimedVoiceCues(p4Cycle)) {
      const remainingRealSeconds = timedVoiceDelaySeconds(cue.at, eventTime, gameSpeed)
      if (remainingRealSeconds < -.05) continue
      const timer = window.setTimeout(() => {
        const audio = timedVoiceAudiosRef.current[cue.clip]
        if (!audio) return
        audio.currentTime = 0
        audio.playbackRate = gameSpeed
        audio.preservesPitch = true
        void audio.play().catch(() => {
          if (!ttsAvailable) return
          window.speechSynthesis.speak(createTtsUtterance(cue.clip, gameSpeed, activeTtsVoice))
        })
      }, Math.max(0, remainingRealSeconds) * 1000)
      timedVoiceTimersRef.current.push(timer)
    }
    return stopScheduledVoice
  }, [timedVoiceReady, ttsAvailable, ttsEnabled, screen, paused, wipeReason, event, p4Cycle, gameSpeed, activeTtsVoice])
  useEffect(() => {
    if (!ttsAvailable || !ttsEnabled || screen !== 'game' || paused || wipeReason) {
      if (ttsAvailable) window.speechSynthesis.cancel()
      return
    }
    const cues = ttsCuesForState({
      event,
      eventTime,
      cycle,
      p1Sequence,
      p2Cycle,
      p2OrbReturnAge,
      p3Round,
      p3ArchangelDuty: activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null,
      p3SoaksCleared: p3PoolHealth.every(value => value <= .5),
      p3MemoryComplete: p3MemoryResolved(p3RuneOrder, p3ResolvedRunes),
      p4Cycle,
      p4PatternSeed,
      assignment,
      role: activeCrystalAssignments.includes(assignment) ? 'carrier' : 'non-carrier',
      difficulty,
    }).filter(cue => !ttsSpokenRef.current.has(cue.id))
    if (cues.length === 0) return
    window.speechSynthesis.cancel()
    cues.forEach(cue => {
      ttsSpokenRef.current.add(cue.id)
      window.speechSynthesis.speak(createTtsUtterance(cue.text, gameSpeed, activeTtsVoice))
    })
  }, [ttsAvailable, ttsEnabled, screen, paused, wipeReason, event, eventTime, cycle, p1Sequence, p2Cycle, p2OrbReturnAge, p3Round, p3ArchangelDuty, p3PoolHealth, p3RuneOrder, p3ResolvedRunes, p4Cycle, p4PatternSeed, assignment, activeCrystalAssignments, difficulty, gameSpeed, activeTtsVoice])
  useEffect(() => {
    const stopActiveSounds = () => {
      activeEncounterSoundsRef.current.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
      activeEncounterSoundsRef.current.clear()
    }
    if (!FEATURE_FLAGS.encounterSounds || !encounterSoundsEnabled || screen !== 'game' || paused && !wipeReason) {
      stopActiveSounds()
      return
    }
    const cues = encounterSoundCuesForState({
      event,
      eventTime,
      cycle,
      p2Cycle,
      p2OrbReturnAge,
      p3Round,
      p3PoolHealth,
      p3ResolvedRunes,
      p4Cycle,
      crystalOnGround: crystal !== null,
      latestMistakeId: mistakes[0]?.id ?? null,
      wipeReason,
    }).filter(cue => !encounterSoundPlayedRef.current.has(cue.id))
    cues.forEach(cue => {
      encounterSoundPlayedRef.current.add(cue.id)
      const audio = playEncounterSound(cue.sound, encounterSoundVolume, gameSpeed)
      activeEncounterSoundsRef.current.add(audio)
      audio.addEventListener('ended', () => activeEncounterSoundsRef.current.delete(audio), { once: true })
    })
  }, [encounterSoundsEnabled, encounterSoundVolume, gameSpeed, screen, paused, wipeReason, event, eventTime, cycle, p2Cycle, p2OrbReturnAge, p3Round, p3PoolHealth, p3ResolvedRunes, p4Cycle, crystal, mistakes])
  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    if (layoutSaveFeedbackTimerRef.current !== null) window.clearTimeout(layoutSaveFeedbackTimerRef.current)
    timedVoiceTimersRef.current.forEach(timer => window.clearTimeout(timer))
    Object.values(timedVoiceAudiosRef.current).forEach(audio => audio.pause())
    activeEncounterSoundsRef.current.forEach(audio => audio.pause())
    activeEncounterSoundsRef.current.clear()
  }, [])
  useEffect(() => {
    if (import.meta.env.MODE === 'test' && !new URLSearchParams(window.location.search).has('wipe-feed-test')) return
    let active = true
    const refresh = () => {
      void loadActivityFeed(20)
        .then(result => {
          if (!active || !Array.isArray(result.rows)) return
          const recent = recentActivityRows(result.rows)
          setActivityFeed(recent)
          const nextIds = new Set(recent.map(row => row.id))
          if (seenActivityIdsRef.current) {
            const newRows = newActivityRows(recent, seenActivityIdsRef.current)
            if (newRows.length) {
              setNewActivityFeedIds(new Set(newRows.map(row => row.id)))
              if (liveActivityNotificationsEnabled) setActivityNotificationQueue(current => [...current, ...newRows])
            }
          }
          seenActivityIdsRef.current = nextIds
        })
        .catch(() => undefined)
    }
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [liveActivityNotificationsEnabled])
  useEffect(() => {
    if (!liveActivityNotificationsEnabled) {
      setActivityNotificationQueue(current => current.length ? [] : current)
      return
    }
    if (!activityNotificationQueue.length) return
    const timer = window.setTimeout(() => setActivityNotificationQueue(current => current.slice(1)), 4600)
    return () => window.clearTimeout(timer)
  }, [liveActivityNotificationsEnabled, activityNotificationQueue])
  useEffect(() => {
    if (!newActivityFeedIds.size) return
    const timer = window.setTimeout(() => setNewActivityFeedIds(new Set()), 4600)
    return () => window.clearTimeout(timer)
  }, [newActivityFeedIds])
  useEffect(() => {
    if (screen !== 'menu') return
    void loadOnlineSession().then(setOnlineSession).catch(() => setOnlineSession({ authenticated: false }))
  }, [screen])
  useEffect(() => {
    if (!onlineSession.authenticated || !onlineSession.achievementSyncKey) {
      setAccountAchievementCollection(emptyCollection())
      return
    }
    const storageKey = achievementAccountStorageKey(onlineSession.achievementSyncKey)
    setAccountAchievementCollection(parseAchievementCollection(localStorage.getItem(storageKey)))
    let active = true
    void loadOnlineAchievements().then(result => {
      if (!active) return
      const synchronized = collectionFromVerifiedAchievements(result.rows, result.progress)
      localStorage.setItem(storageKey, serializeAchievementCollection(synchronized))
      setAccountAchievementCollection(synchronized)
    }).catch(() => { /* retain the last account-scoped cache while offline */ })
    return () => { active = false }
  }, [onlineSession.authenticated, onlineSession.achievementSyncKey, achievementSyncRevision])
  useEffect(() => {
    const loadHashPlan = () => {
      const hashPlan = window.location.hash.startsWith('#raidplan=') ? decodeRaidPlan(window.location.hash) : null
      if (!hashPlan) return
      loadRaidPlanIntoApp(hashPlan)
      setShareInput(window.location.href)
      setShareStatus('Shared raid plan loaded')
    }
    loadHashPlan()
    window.addEventListener('hashchange', loadHashPlan)
    return () => window.removeEventListener('hashchange', loadHashPlan)
  }, [])
  useEffect(() => {
    if (!useAsgardAsInitialPlan) return
    void loadAsgardRaidPlan()
  }, [useAsgardAsInitialPlan])
  useEffect(() => {
    if (screen !== 'game') return
    const togglePause = (event: KeyboardEvent) => {
      if (event.code !== keyBindings.pause || event.repeat || wipeRef.current) return
      event.preventDefault()
      keysHeld.current.clear()
      setPaused(current => !current)
    }
    window.addEventListener('keydown', togglePause)
    return () => window.removeEventListener('keydown', togglePause)
  }, [screen, keyBindings.pause])
  useEffect(() => {
    if (screen !== 'game' || wipeRef.current) return
    if (paused) playerPauseStartedRef.current = true
    else if (playerPauseStartedRef.current) playerPauseCycleRef.current = true
  }, [screen, paused])
  useEffect(() => {
    if (event === 'countdown' || event === 'p2-countdown' || event === 'p3-countdown' || event === 'p4-countdown' || event === 'p3-flight') keysHeld.current.clear()
    lastWipeAtRef.current = -Infinity
    if (event.startsWith('p3-')) hitRef.current = false
  }, [event])

  function restartMusic() {
    if (!FEATURE_FLAGS.backgroundMusic) return
    const audio = audioRef.current
    if (!audio) return
    if (musicMuted) { audio.pause(); return }
    const track = MUSIC_TRACKS.find(candidate => candidate.id === musicTrack) ?? MUSIC_TRACKS[0]
    audio.src = track.src
    audio.currentTime = 0
    audio.volume = musicVolume
    audio.muted = musicMuted
    void audio.play().catch(() => { /* browser requires another user gesture */ })
  }
  function toggleMusicPreview() {
    if (!FEATURE_FLAGS.backgroundMusic) return
    const audio = audioRef.current
    if (!audio || musicMuted) return
    if (musicPreviewing) {
      audio.pause()
      setMusicPreviewing(false)
      return
    }
    const track = MUSIC_TRACKS.find(candidate => candidate.id === musicTrack) ?? MUSIC_TRACKS[0]
    audio.src = track.src
    audio.currentTime = 0
    audio.volume = musicVolume
    audio.muted = false
    void audio.play().catch(() => { /* browser rejected playback */ })
    setMusicPreviewing(true)
  }
  function resetPhaseRecovery(key: PhaseKey) {
    phaseRecoveryRef.current = { key, status: 'pending' }
    healthPotUsedRef.current = false
    shieldUsedRef.current = false
    setHealthPotUsed(false)
    setShieldUsed(false)
    healthRef.current = 100
    setHealth(100)
    healthTargetRef.current = 100
    nextHealthTargetRef.current = timeRef.current + 1 + Math.random()
  }
  function settleUnplayedRecovery(key: PhaseKey) {
    if (phaseRecoveryRef.current.key !== key || phaseRecoveryRef.current.status !== 'pending') return
    const penalty = unusedRecoveryPenalty(difficulty)
    if (!penalty) {
      phaseRecoveryRef.current.status = 'disabled'
      return
    }
    phaseRecoveryRef.current.status = 'missed'
    const nextScore = Math.max(0, statsRef.current.score - penalty)
    statsRef.current = { ...statsRef.current, score: nextScore, hits: statsRef.current.hits + 1 }
    setStats(statsRef.current)
    const mistake: Mistake = { id: Date.now() + Math.random(), time: timeRef.current, label: `Missed the mandatory ${key === 'intermission' ? 'Intermission' : key.toUpperCase()} recovery`, penalty }
    setMistakes(current => [mistake, ...current])
  }
  function finishTrackedPhase(key: PhaseKey): PhaseResult[] {
    const start = phaseStartRef.current
    if (start.key !== key || phaseResultsRef.current.some(result => result.key === key)) return phaseResultsRef.current
    settleUnplayedRecovery(key)
    const recovery = phaseRecoveryRef.current.key === key && (phaseRecoveryRef.current.status === 'passed' || phaseRecoveryRef.current.status === 'missed')
      ? phaseRecoveryRef.current.status
      : undefined
    const result = buildPhaseResult(key, start.score, statsRef.current.score, start.time, timeRef.current, recovery, statsRef.current.hits - start.hits)
    const next = [...phaseResultsRef.current, result]
    phaseResultsRef.current = next
    setPhaseResults(next)
    return next
  }
  function beginTrackedPhase(key: PhaseKey) {
    const active = phaseStartRef.current
    if (active.key === key) return
    finishTrackedPhase(active.key)
    phaseStartRef.current = { key, score: statsRef.current.score, time: timeRef.current, hits: statsRef.current.hits }
    resetPhaseRecovery(key)
  }
  function finishP4AndShowResults(killedEarly = false) {
    finishTrackedPhase('p4')
    setBossHealth(0)
    bossHealthRef.current = 0
    setLuraKilledEarly(killedEarly)
    setCompletionCopyStatus('')
    setCompletionPreview(false)
    setScreen('results')
  }
  function beginP3DamageClear() {
    if (p3DamageClearRef.current) return
    p3DamageClearRef.current = true
    bossPlayerDamageRef.current = PRE_P4_BOSS_HEALTH_BUDGET
    bossHealthRef.current = 0
    setBossHealth(0)
    setP3DamageClear(true)
    setP3Round(2)
    setCrystal(null)
    setCrystalAge(0)
    crystalAgeRef.current = 0
    setNpcCrystals([])
    setNpcCarrier(null)
    setNpcCrystalAge(0)
    setStats(current => ({ ...current, crystalDropped: false }))
    eventTimeRef.current = 0
    setEventTime(0)
    setEvent('p3-sector-move')
  }
  function announceCrystalDuty(previousAssignments: number[], nextAssignments: number[], phaseLabel: string, initial = false) {
    const previouslyAssigned = previousAssignments.includes(assignment)
    const newlyAssigned = nextAssignments.includes(assignment)
    const message = newlyAssigned
      ? previouslyAssigned && !initial ? `Crystal retained · ${phaseLabel}` : `You received a crystal · ${phaseLabel}`
      : previouslyAssigned ? `Your crystal was removed · ${phaseLabel}` : `No crystal assigned · ${phaseLabel}`
    setCrystalDutyNotice(message)
    if (crystalNoticeTimerRef.current !== null) window.clearTimeout(crystalNoticeTimerRef.current)
    crystalNoticeTimerRef.current = window.setTimeout(() => setCrystalDutyNotice(''), 2600)
  }
  const initializeAttempt = (preserveScore = false) => {
    setCompletionPreview(false)
    setCompletionProof(null)
    setResultAchievements([])
    p1WrongCrystalHeldRef.current = false
    p1WrongCrystalPickedAtRef.current = -Infinity
    p1StolenCrystalSlotRef.current = null
    p1TouchedCrystalSlotsRef.current.clear()
    setP1WrongCrystalHeld(false)
    setP1StolenCrystalSlot(null)
    setP1WrongCrystalDeadline(null)
    p3DamageClearRef.current = false
    setP3DamageClear(false)
    setP4Cycle(1)
    p4CycleRef.current = 1
    p4NpcSplinterCheckedRef.current.clear()
    ttsSpokenRef.current.clear()
    encounterSoundPlayedRef.current.clear()
    activeEncounterSoundsRef.current.forEach(audio => audio.pause())
    activeEncounterSoundsRef.current.clear()
    if (ttsAvailable) window.speechSynthesis.cancel()
    setP4PatternSeed(Math.floor(Math.random() * 2147483647))
    randomizeP3PoolLayout()
    keysHeld.current.clear()
    p3PoolOccupancyRef.current = [0, 0, 0, 0, 0, 0]
    const slot = entryMode === 'arena0' || difficulty === 'easy' || difficulty === 'test' ? 0 : Math.floor(Math.random() * startSlots.length)
    if (entryMode === 'arena0') setStartSlots(current => current.map((start, index) => index === 0 ? p1BossOpening : start))
    const intermissionStart = startSlots[slot]
    const oriented = orientedAssignments(positions, intermissionStart, WORLD.center)
    const startPosition = entryMode === 'arena0' ? p1Positions[assignment] : entryMode === 'arena1' ? intermissionStart : entryMode === 'arena4' ? p4StackPosition(1, WORLD.center) : WORLD.center
    const preservedBossHealth = bossHealthRef.current
    if (!preserveScore) {
      bossHealthRef.current = 100
      bossPlayerDamageRef.current = 0
      setLuraKilledEarly(false)
    }
    const initialTankState = createTankMechanicState()
    tankMechanicRef.current = initialTankState
    tankHudSignatureRef.current = ''
    setTankMechanic(initialTankState)
    tankFailureCountRef.current = 0
    tankRolePlayedRef.current = controlledTank !== null
    tankCrystalRolePlayedRef.current = controlledTank !== null && entryCrystalAssignments.includes(assignment)
    p4ConeTankPlayedRef.current = false
    p4ProtectionTankPlayedRef.current = false
    p4PlayerConeUntilRef.current = 0
    p4PlayerConeReadyAtRef.current = 0
    setP4PlayerConeUntil(0)
    jumpUntilRef.current = 0; jumpKeysRef.current.clear(); p4LastBoxHitRef.current = -Infinity; p4UnsafeSecondsRef.current = 0; setPersonalJumpProgress(0); setMusicPreviewing(false); restartMusic()
    setPhasePositions(entryMode === 'arena0' ? p1Positions : oriented); setStartSlot(slot); playerRef.current = startPosition; jumpOriginRef.current = startPosition; pullOriginRef.current = startPosition; p3FlightOriginRef.current = startPosition; crystalAgeRef.current = 0; eventTimeRef.current = 0; p3UnsafeSecondsRef.current = 0; if (!preserveScore) timeRef.current = 0; droppedForPackRef.current = false; healthRef.current = 100; healthTargetRef.current = 100; nextHealthTargetRef.current = Infinity; healthPotUsedRef.current = false; shieldUsedRef.current = false; mainAbilityCastRef.current = idleMainAbilityCast(); setMainCastState(mainAbilityCastRef.current); setHealth(100); setHealthPotUsed(false); setShieldUsed(false); setBossHealth(100); if (!preserveScore) setMainAbilityUsed(false); setMainProjectileFiredAt(null); setPlayer(startPosition); setCrystal(null); setCrystalSpent(false); setCrystalAge(0); setNpcSplinters([]); setNpcCrystals([]); setNpcCarrier(null); setNpcCrystalAge(0); setPlayerSplinterRotation(0); setP3ArchangelDuty(randomCrystalDropDuty()); if (preserveScore) setStats(current => ({ ...current, crystalDropped: false })); else { statsRef.current = { score: 1000, hits: 0, crystalDropped: false, time: 0 }; setStats(statsRef.current); setMistakes([]); wipeCountRef.current = 0; mainAbilityCastCountRef.current = 0; recoveryUseCountRef.current = 0; playerCrystalFailuresRef.current = 0; playerRuneFailuresRef.current = 0; playerPauseStartedRef.current = false; playerPauseCycleRef.current = false; phaseResultsRef.current = []; setPhaseResults([]); phaseStartRef.current = { key: phaseForEntry(entryMode), score: 1000, time: 0, hits: 0 }; resetPhaseRecovery(phaseForEntry(entryMode)); const nextAttempt = Math.max(0, Number(localStorage.getItem('lura-attempt-count')) || 0) + 1; localStorage.setItem('lura-attempt-count', String(nextAttempt)); setAttemptNumber(nextAttempt); setCompletionCopyStatus('') } lastMistakeRef.current = { label: '', time: -Infinity }; setWipeReason(''); setSoftWipeNotice(''); announceCrystalDuty([], entryCrystalAssignments, entryMode === 'arena0' ? 'P1' : entryMode === 'arena1' ? 'Intermission' : entryMode === 'arena2' ? 'P2' : entryMode === 'arena3' ? 'P3' : 'P4', true); setEvent(entryMode === 'arena0' ? 'p1-countdown' : entryMode === 'arena2' ? 'p2-countdown' : entryMode === 'arena3' ? 'p3-countdown' : entryMode === 'arena4' ? 'p4-countdown' : 'countdown'); setEventTime(0); setCycle(1); setP2Cycle(1); setP2Soaked(false); setP2OrbReturnAge(-1); setP2BeamAssignees([]); setP2BeamOrbIndices([]); setP2ReturningOrbIndices([]); setP2ResolvedOrbIndices([]); p2SeedRef.current = Math.floor(Math.random() * 2147483647); p2BeamOrbIndicesRef.current = []; p2ResolvedOrbIndicesRef.current = []; p2OrbPlayerHitRef.current = false; p2OrbReturnAgeRef.current = -1; p2OrbReturnHitRef.current = false; p2ReturnSoakCheckedRef.current = false; setP3Round(1); setP3PoolHealth(Array(6).fill(P3_POOL_HEALTH)); setP3RuneOrder(shuffledRunes()); setP3RuneStep(0); p3ResolvedRunesRef.current = []; setP3ResolvedRunes([]); p3RuneCheckedRef.current = false; setP3ResolvedRunes([]); p3RuneCheckedRef.current = false; p3RuneContactRef.current = false; p3WrongRuneSinceRef.current = { rune: null, since: 0 }; p3WrongRuneContactRef.current = false; p3RuneFailedRef.current = false; p3StarsCycleRef.current = -1; p3LandingRequiredRef.current = difficulty === 'hard' || difficulty === 'normal' && Math.random() < .5; setP1Sequence(1); const nextP1Seed = Math.floor(Math.random() * 2147483647); setP1Seed(nextP1Seed); p1InterruptAssignmentRef.current = p1InterruptAssignment(nextP1Seed + assignment); setP1InterruptCast(0); p1InterruptPressedRef.current = false; setP1InterruptPressed(false); setP1MemoryOrderState(p1MemoryOrder(nextP1Seed, 1)); setP1FailedMemoryRune(null); p1MemoryFailureTriggeredRef.current = false; p1GlaiveSetsRef.current = []; p1GlaiveContactRef.current = false; setP1GlaiveSets([]); setP1Soaks([]); setP1SoakResolved([]); p1SoakHitRef.current = false; setP1CrystalCollected(false); hitRef.current = false; unsafeRef.current = false; wipeRef.current = false; lastWipeAtRef.current = -Infinity; chooseBossPattern(oriented[assignment]); setPaused(false); setScreen('game')
    if (preserveScore) {
      bossHealthRef.current = preservedBossHealth
      setBossHealth(preservedBossHealth)
    }
  }
  const start = async () => {
    setOnlineAttempt(null)
    runAttributionRef.current = 'local'
    setRunAttribution('local')
    setOnlineResultStatus('')
    onlineCompletionStartedRef.current = ''
    let currentSession = onlineSession
    let runWarning = ''
    try {
      currentSession = await loadOnlineSession()
      setOnlineSession(currentSession)
    } catch {
      runWarning = 'Could not verify the online session. Continuing as local practice; this run cannot enter the leaderboard.'
      setOnlineResultStatus(runWarning)
      initializeAttempt(false)
      setSoftWipeNotice(runWarning)
      return
    }
    if (onlineSession.authenticated && !currentSession.authenticated) {
      runWarning = 'Your online session expired. Please log in again before the next run; this run is local practice.'
      setOnlineResultStatus(runWarning)
    } else if (currentSession.authenticated && !currentSession.privacy?.selectedCharacterId) {
      runWarning = 'Select an active Battle.net character before the next run; this run is local practice.'
      setOnlineResultStatus(runWarning)
    }
    const selectedCharacter = currentSession.privacy?.selectedCharacterId
    let nextAttribution: RunAttributionMode = currentSession.authenticated ? 'local' : 'anonymous'
    if (
      currentSession.authenticated
      && currentSession.csrfToken
      && selectedCharacter
    ) {
      try {
        const buildId = APP_GIT_REVISION === 'unknown' ? `local-${APP_VERSION}` : APP_GIT_REVISION
        const fingerprint = await configurationFingerprint({
          assignment,
          p1Positions,
          positions,
          p2Positions,
          p2SpreadPositions,
          p3Positions,
          p3BossPositions,
          tankAssignments,
          crystalAssignments: {
            p1: p1CrystalAssignments,
            intermission: intermissionCrystalAssignments,
            p2: p2CrystalAssignments,
            p3: p3CrystalAssignments,
          },
        })
        const crystalDuty = [
          p1CrystalAssignments,
          intermissionCrystalAssignments,
          p2CrystalAssignments,
          p3CrystalAssignments,
        ].some(assignments => assignments.includes(assignment))
        const issued = await issueOnlineAttempt(currentSession.csrfToken, {
          difficulty,
          duty: crystalDuty ? 'crystal' : 'non-crystal',
          entryMode,
          phaseScope: entryMode === 'arena0' ? 'full' : phaseForEntry(entryMode),
          trainerVersion: APP_VERSION,
          buildId,
          configurationFingerprint: fingerprint,
          optionalChallenges: ['recovery', 'main-ability'],
        })
        setOnlineAttempt({
          attemptId: issued.attemptId,
          nonce: issued.nonce,
          buildId,
          configurationFingerprint: fingerprint,
          optionalChallenges: ['recovery', 'main-ability'],
        })
        nextAttribution = 'verified'
        setOnlineResultStatus('Online-eligible attempt active.')
      } catch (error) {
        if (error instanceof Error && error.message === 'not_authenticated') {
          setOnlineSession({ authenticated: false })
          runWarning = 'Your online session expired. Please log in again before the next run; this run is local practice.'
          setOnlineResultStatus(runWarning)
        } else if (error instanceof Error && error.message === 'character_required') {
          setOnlineSession({ ...currentSession, privacy: currentSession.privacy ? { ...currentSession.privacy, selectedCharacterId: null } : undefined, selectedCharacter: undefined })
          runWarning = 'Select an active Battle.net character before the next run; this run is local practice.'
          setOnlineResultStatus(runWarning)
        } else {
          runWarning = 'Could not issue an online attempt. Continuing as local practice.'
          setOnlineResultStatus(runWarning)
        }
      }
    }
    runAttributionRef.current = nextAttribution
    setRunAttribution(nextAttribution)
    initializeAttempt(false)
    if (runWarning) setSoftWipeNotice(runWarning)
  }
  function previewCompletionScreen() {
    const previewResults: PhaseResult[] = [
      { key: 'p1', label: 'Phase 1', points: 990, time: 64.8 },
      { key: 'intermission', label: 'Intermission', points: 980, time: 58.4 },
      { key: 'p2', label: 'Phase 2', points: 950, time: 76.2 },
      { key: 'p3', label: 'Phase 3', points: 1020, time: 130.1 },
      { key: 'p4', label: 'Phase 4', points: 910, time: 92 },
    ]
    const previewStats: GameStats = { score: 850, hits: 3, crystalDropped: false, time: 421.5 }
    const previewMistakes: Mistake[] = [
      { id: 1, time: 41.2, label: 'Hit by another player’s Starsplinter', penalty: 50 },
      { id: 2, time: 164.8, label: 'Outside the Phase 3 light zone', penalty: 50 },
      { id: 3, time: 301.5, label: 'Touched an approaching fragment', penalty: 50 },
    ]
    phaseResultsRef.current = previewResults
    statsRef.current = previewStats
    setPhaseResults(previewResults)
    setStats(previewStats)
    setMistakes(previewMistakes)
    setAttemptNumber(current => Math.max(1, current))
    setCompletionCopyStatus('')
    setCompletionProof(null)
    setResultAchievements([])
    setCompletionPreview(true)
    setScreen('results')
  }
  const resolveP3Rune = (rune: RuneSymbol) => {
    if (p3ResolvedRunesRef.current.includes(rune)) return
    p3ResolvedRunesRef.current = [...p3ResolvedRunesRef.current, rune]
    setP3ResolvedRunes(p3ResolvedRunesRef.current)
  }

  useEffect(() => {
    if (screen !== 'game' || paused) return
    const keys = keysHeld.current
    const movementActions: [keyof KeyBindings, string][] = [['forward', 'w'], ['backward', 's'], ['left', 'a'], ['right', 'd']]
    const down = (e: KeyboardEvent) => {
      const movement = movementActions.find(([action]) => keyBindings[action] === e.code)
      if (movement) {
        e.preventDefault()
        if (event !== 'countdown' && event !== 'p2-countdown' && event !== 'p3-countdown' && event !== 'p4-countdown' && event !== 'p3-flight') keys.add(movement[1])
      }
      if (!e.repeat && e.code === keyBindings.jump && event !== 'countdown' && event !== 'p2-countdown' && event !== 'p2-jump' && event !== 'p3-countdown' && event !== 'p3-flight' && jumpUntilRef.current <= timeRef.current) {
        e.preventDefault()
        jumpUntilRef.current = timeRef.current + PERSONAL_JUMP_SECONDS
        jumpKeysRef.current = new Set(keys)
        jumpCameraForwardRef.current = { ...cameraForward.current }
        setPersonalJumpProgress(.001)
      }
      if (!e.repeat && e.code === keyBindings.crystal) toggleCrystal()
      if (!e.repeat && e.code === keyBindings.healthPot) useRecovery('healthPot')
      if (!e.repeat && e.code === keyBindings.shield) useRecovery('shield')
      if (!e.repeat && e.code === keyBindings.mainAbility) useMainAbility()
      if (!e.repeat && e.code === keyBindings.interrupt) { e.preventDefault(); useInterrupt() }
      if (!e.repeat && e.code === keyBindings.taunt) { e.preventDefault(); useTankAction() }
    }
    const up = (e: KeyboardEvent) => { const movement = movementActions.find(([action]) => keyBindings[action] === e.code); if (movement) keys.delete(movement[1]) }
    const clearMovement = () => keys.clear()
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clearMovement)
    let frame = 0; let previous = performance.now()
    const tick = (now: number) => {
      const elapsedSeconds = Math.max(0, (now - previous) / 1000)
      const dt = Math.min(elapsedSeconds, .05) * gameSpeed
      const mainAbilityDt = mainAbilityElapsedSeconds(previous, now, gameSpeed)
      previous = now
      eventTimeRef.current += dt; setEventTime(eventTimeRef.current); timeRef.current += dt; setStats(s => ({ ...s, time: s.time + dt }))
      const tankResult = advanceTankMechanic(tankMechanicRef.current, dt, {
        active: FEATURE_FLAGS.tankRoles && tankMechanicActiveForEvent(event),
        controlledTank,
        controlledTankHasCrystal: controlledTank !== null && activeCrystalAssignments.includes(assignment) && !crystalSpent,
        heroic: difficulty === 'hard',
      })
      tankMechanicRef.current = tankResult.state
      const tankHudSignature = `${tankResult.state.stage}:${tankResult.state.activeTank}:${tankResult.state.counter}:${tankResult.state.impactIndex}:${tankResult.state.impaledStacks.join(',')}:${Math.ceil(tankResult.state.playerShieldCooldown * 10)}`
      if (tankHudSignature !== tankHudSignatureRef.current) {
        tankHudSignatureRef.current = tankHudSignature
        setTankMechanic(tankResult.state)
      }
      if (controlledTank !== null && activeCrystalAssignments.includes(assignment)) tankCrystalRolePlayedRef.current = true
      if (event === 'p4-cycle' && controlledTank === 0) p4ConeTankPlayedRef.current = true
      if (event === 'p4-cycle' && controlledTank === 1) p4ProtectionTankPlayedRef.current = true
      handleTankMechanicEvents(tankResult.events)
      if (event === 'p1-interrupts') {
        setP1InterruptCast(Math.min(P1_INTERRUPT_CAST_COUNT - 1, Math.floor(eventTimeRef.current / P1_INTERRUPT_CAST_SECONDS)))
        const assignedCastEndsAt = (p1InterruptAssignmentRef.current + 1) * P1_INTERRUPT_CAST_SECONDS
        if (!p1InterruptPressedRef.current && !p1InterruptFailureTriggeredRef.current && eventTimeRef.current >= assignedCastEndsAt) {
          p1InterruptFailureTriggeredRef.current = true
          if (triggerWipe(`Missed assigned interrupt ${p1InterruptAssignmentRef.current + 1}`)) return
        }
      }
      if (event === 'p1-memory-sweep' && p1MemoryPlayerVerdictRef.current === null) {
        const rune = (['T', 'X', 'O', 'V', '+'] as P1Rune[])[assignment % 5]
        const memoryBoss = p1BossEncounterPosition(p1BossOpening, p1Positions.slice(0, 2), p1Sequence, event, eventTimeRef.current, WORLD.center)
        const outwardAngle = Math.atan2(memoryBoss.y - WORLD.center.y, memoryBoss.x - WORLD.center.x)
        const verdict = p1MemoryPlayerVerdict(
          null,
          playerRef.current,
          memoryBoss,
          p1MemoryOrderState,
          rune,
          eventTimeRef.current,
          outwardAngle,
          p1LiveRunePositions(playerRef.current, renderedNpcPositionsRef.current, assignment, profiles.length),
        )
        p1MemoryPlayerVerdictRef.current = verdict
        if (verdict === false && !p1MemoryFailureTriggeredRef.current) {
          p1MemoryFailureTriggeredRef.current = true
          setP1FailedMemoryRune(rune)
          if (triggerWipe(`Rune ${rune} was out of order around L’ura`)) return
        }
      }
      if (p1GlaiveSetsRef.current.length) {
        p1GlaiveSetsRef.current = p1GlaiveSetsRef.current
          .map(set => p1AdvanceGlaiveSet(set, timeRef.current - dt, timeRef.current, WORLD.center, P1_OUTER_RADIUS - 5, P1_INNER_RADIUS + 5))
          .filter(set => set.expiresAt > timeRef.current)
        setP1GlaiveSets(p1GlaiveSetsRef.current)
        const hitByGlaive = p1GlaiveSetsRef.current.some(set =>
          timeRef.current >= set.launchesAt && set.glaives.some(glaive => distance(playerRef.current, glaive.position) <= P1_GLAIVE_CONTACT_RADIUS))
        if (p1GlaiveContactStarted(hitByGlaive, p1GlaiveContactRef.current)) triggerWipe('Hit by a roaming Heaven Glaive')
        p1GlaiveContactRef.current = hitByGlaive
      }
      if (p1WrongCrystalDropExpired(p1WrongCrystalHeldRef.current, p1WrongCrystalPickedAtRef.current, timeRef.current)) {
        p1WrongCrystalHeldRef.current = false
        setP1WrongCrystalHeld(false)
        setP1WrongCrystalDeadline(null)
        if (triggerWipe(`Wrong ${event.startsWith('p1-') ? 'Phase 1' : event.startsWith('p2-') ? 'Phase 2' : 'raid'} crystal was not dropped within five seconds`)) return
        p1StolenCrystalSlotRef.current = null
        setP1StolenCrystalSlot(null)
      }
      if (event.startsWith('p1-') && crystal && crystalAgeRef.current >= 1 && !p1WrongCrystalHeldRef.current && p1StolenCrystalSlotRef.current !== null) {
        const currentAssignments = activeCrystalAssignments.slice((p1Sequence - 1) * 3, p1Sequence * 3)
        const owner = currentAssignments[p1StolenCrystalSlotRef.current]
        const npcOrdinal = owner < assignment ? owner : owner - 1
        const npcPosition = renderedNpcPositionsRef.current[npcOrdinal]
        if (npcPosition && distance(npcPosition, crystal) <= 4) {
          setCrystal(null)
          setCrystalAge(0)
          crystalAgeRef.current = 0
          p1StolenCrystalSlotRef.current = null
          setP1StolenCrystalSlot(null)
          setStats(s => ({ ...s, crystalDropped: false }))
        }
      }
      if (event === 'p1-beams' && !p1SoakHitRef.current) {
        const p1Boss = p1BossEncounterPosition(p1BossOpening, p1Positions.slice(0, 2), p1Sequence, 'p1-beam-telegraph', 0, WORLD.center)
        const beams = p1RotatingBeams(p1Seed, p1Sequence, 0, Math.PI / 16, Math.atan2(p1Boss.y - WORLD.center.y, p1Boss.x - WORLD.center.x))
        const currentBeamTime = p1ContinuousBeamTime(event, eventTimeRef.current)
        const previousBeamTime = p1ContinuousBeamTime(event, Math.max(0, eventTimeRef.current - dt))
        const beamHit = p1RotatingBeamHitsPoint(
          playerRef.current,
          WORLD.center,
          beams,
          previousBeamTime,
          currentBeamTime,
          P1_OUTER_RADIUS,
        )
        if (beamHit) {
          p1SoakHitRef.current = true
          const hasCollectedCrystal = p1HasCollectedCrystal(p1CrystalAssignments, assignment, p1Sequence, p1CrystalCollected)
          if (p1BeamHitResolution(hasCollectedCrystal) === 'points') {
            recordMistake('Hit by a Phase 1 rotating beam', PLAYER_COLLISION_PENALTY, 0)
          } else {
            const soaks = p1ReactiveSoaks(p1Seed + p1Sequence, playerRef.current, 0, 18)
            setP1Soaks(soaks)
            setP1SoakResolved([0])
            eventTimeRef.current = 0
            setEventTime(0)
            setEvent('p1-soaks')
          }
        }
      }
      if (event === 'p4-cycle') {
        const scriptedBossHealth = p4BossHealth(p4CycleRef.current, eventTimeRef.current)
        const nextBossHealth = p4BossHealthWithPlayerDamage(p4CycleRef.current, eventTimeRef.current, bossPlayerDamageRef.current)
        bossHealthRef.current = nextBossHealth
        setBossHealth(nextBossHealth)
        if (nextBossHealth <= 0) {
          keys.clear()
          finishP4AndShowResults(scriptedBossHealth > 0)
          return
        }
      }
      if (shouldTriggerP3EarlyClear(event, bossPlayerDamageRef.current, p3Round)) {
        keys.clear()
        beginP3DamageClear()
        return
      }
      if (event === 'p3-light-pools') {
        const stars = p3StarsTiming(eventTimeRef.current)
        if (stars.active && stars.cycle !== p3StarsCycleRef.current) {
          p3StarsCycleRef.current = stars.cycle
          hitRef.current = false
        }
      }
      if (p2OrbReturnAgeRef.current >= 0 && p2OrbReturnAgeRef.current < P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS + .5) {
        const nextOrbAge = p2OrbReturnAgeRef.current + dt
        p2OrbReturnAgeRef.current = nextOrbAge
        setP2OrbReturnAge(nextOrbAge)
        const returnFlightStarts = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS
        const returnFlightEnds = returnFlightStarts + P2_ORB_RETURN_TRAVEL_SECONDS
        if (nextOrbAge >= returnFlightStarts && nextOrbAge < returnFlightEnds && !p2OrbPlayerHitRef.current) {
          const returningOrbs = p2ReturningOrbPositions(nextOrbAge, p2Cycle, p2OrbitAngleRef.current, WORLD.center, 82, p2ReturningOrbIndices)
          if (returningOrbs.some(orb => distance(playerRef.current, orb) <= 8)) {
            p2OrbPlayerHitRef.current = true
            recordMistake('Hit by a returning orb', PLAYER_COLLISION_PENALTY)
          }
        }
        if (nextOrbAge >= returnFlightEnds && !p2OrbReturnHitRef.current) {
          p2OrbReturnHitRef.current = true
          if (crystal && distance(crystal, WORLD.center) <= 15) triggerPlayerCrystalFailure('Returning orbs exploded into the dropped crystal')
        }
        if (nextOrbAge >= P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS && event === 'p2-wait') {
          p2OrbReturnAgeRef.current = -1
          p2OrbReturnHitRef.current = false
          p2OrbPlayerHitRef.current = false
          setP2OrbReturnAge(-1)
          if (p2Cycle >= 3) {
            beginP3()
          } else {
            const nextCycle = p2Cycle + 1
            setP2Cycle(nextCycle)
            prepareP2Beam(nextCycle, P2_BEAM_SECONDS)
            droppedForPackRef.current = false
            setEvent('p2-orbs')
            eventTimeRef.current = 0
            setEventTime(0)
          }
        }
      }
      if (event === 'p3-lattice-memory') {
        const stepDuration = 10 / 3
        const step = Math.min(2, Math.floor(eventTimeRef.current / stepDuration))
        setP3RuneStep(step)
        const activeRune = p3RuneOrder[step]
        const nextRune = p3RuneOrder.find(rune => !p3ResolvedRunesRef.current.includes(rune))
        if (activeRune === nextRune && activeRune !== playerRune(assignment) && eventTimeRef.current - step * stepDuration >= .9) {
          resolveP3Rune(activeRune)
        }
      }
      if (event === 'p3-light-pools' && eventTimeRef.current >= P3_MEMORY_START_SECONDS) {
        const step = p3RuneStepAt(eventTimeRef.current)
        setP3RuneStep(step)
        const requiredRune = playerRune(assignment)
        p3RuneOrder.forEach((rune, index) => {
          const npcResolution = P3_MEMORY_START_SECONDS + index * P3_MEMORY_STEP_SECONDS + 3
          const nextRune = p3RuneOrder.find(candidate => !p3ResolvedRunesRef.current.includes(candidate))
          if (rune === nextRune && rune !== requiredRune && eventTimeRef.current >= npcResolution) resolveP3Rune(rune)
        })
        if (!p3RuneCheckedRef.current && !p3RuneFailedRef.current && eventTimeRef.current >= p3RuneDeadline(p3RuneOrder, requiredRune) + .4) {
          p3RuneFailedRef.current = true
          playerRuneFailuresRef.current += 1
          const ended = triggerWipe(`Missed rune ${requiredRune} during its turn`)
          if (!ended) {
            p3RuneCheckedRef.current = true
            resolveP3Rune(requiredRune)
          }
        }
      }
      const scriptedP4Jump = event === 'p4-transition'
      if (scriptedP4Jump) keys.clear()
      const jumpRemaining = Math.max(0, jumpUntilRef.current - timeRef.current)
      const jumping = jumpRemaining > 0
      setPersonalJumpProgress(jumping ? 1 - jumpRemaining / PERSONAL_JUMP_SECONDS : 0)
      const mainCastAdvance = advanceMainAbilityCast(mainAbilityCastRef.current, mainAbilityDt)
      mainAbilityCastRef.current = mainCastAdvance.state
      setMainCastState(mainCastAdvance.state)
      if (mainCastAdvance.completed > 0) {
        mainAbilityCastCountRef.current += mainCastAdvance.completed
        const previousDamage = bossPlayerDamageRef.current
        const nextDamage = Math.min(event === 'p4-cycle' ? 100 : PRE_P4_BOSS_HEALTH_BUDGET, previousDamage + .5)
        const damageBonus = bossDamageScoreBonus(previousDamage, nextDamage)
        bossPlayerDamageRef.current = nextDamage
        const nextBossHealth = event === 'p4-cycle'
          ? p4BossHealthWithPlayerDamage(p4CycleRef.current, eventTimeRef.current, nextDamage)
          : preP4BossHealth(nextDamage, p3Round < 2)
        bossHealthRef.current = nextBossHealth
        setBossHealth(nextBossHealth)
        setStats(current => ({ ...current, score: current.score + 1 + damageBonus }))
        setMainAbilityUsed(true)
        setMainProjectileFiredAt(timeRef.current)
        if (FEATURE_FLAGS.encounterSounds && encounterSoundsEnabled) {
          const audio = playEncounterSound('main-ability-release', encounterSoundVolume, gameSpeed)
          activeEncounterSoundsRef.current.add(audio)
          audio.addEventListener('ended', () => activeEncounterSoundsRef.current.delete(audio), { once: true })
        }
      }
      updateHealth(dt)
      if (crystal) setCrystalAge(age => { const next = age + dt; crystalAgeRef.current = next; return next })
      if (npcCrystals.length) setNpcCrystalAge(age => age + dt)
      setPlayer(p => { const speedBonusActive = movementBonus && (event === 'positioning' || event === 'p1-transition') && eventTimeRef.current <= OPENING_BOOST_SECONDS; const openingSpeed = movementSpeed * (speedBonusActive ? 1.4 : 1); const p4Speed = event === 'p4-cycle' ? openingSpeed * P4_MOVEMENT_MULTIPLIER : openingSpeed; const activeMovementSpeed = event === 'p3-sector-move' ? p3SectorMovementSpeed(openingSpeed) : event === 'p3-approach' && eventTimeRef.current < 5 ? openingSpeed * 1.4 : p4Speed; const backwardMultiplier = event === 'p3-sector-move' ? 1 : difficulty === 'hard' ? .5 : 1; const bounds = { minX: 30, maxX: WORLD.width - 30, minY: 30, maxY: WORLD.height - 30 }; const movementKeys = scriptedP4Jump ? new Set<string>() : jumping ? jumpKeysRef.current : keys; const movementForward = jumping ? jumpCameraForwardRef.current : cameraForward.current; let next: Point; if (event === 'p1-countdown' || event === 'countdown' || event === 'p2-countdown' || event === 'p3-countdown' || event === 'p4-countdown') next = p; else if (event === 'p2-jump') { const progress = Math.min(1, eventTimeRef.current / 1.4); const eased = 1 - Math.pow(1 - progress, 3); next = { x: jumpOriginRef.current.x + (WORLD.center.x - jumpOriginRef.current.x) * eased, y: jumpOriginRef.current.y + (WORLD.center.y - jumpOriginRef.current.y) * eased } } else if (event === 'p3-flight') next = p3FlightPosition(p3FlightOriginRef.current, p3LandingPosition(p3LandingPlanIndex(assignment, p3Positions, WORLD.center), WORLD.center), eventTimeRef.current); else if (event === 'p2-pull') next = moveWithIncreasingPull(p, movementKeys, activeMovementSpeed, dt, movementForward, bounds, WORLD.center, eventTimeRef.current / P2_PULL_SECONDS, backwardMultiplier); else next = moveRelativeToCamera(p, movementKeys, activeMovementSpeed, dt, movementForward, bounds, backwardMultiplier); playerRef.current = next; const currentP1Crystals = activeCrystalAssignments.slice((p1Sequence - 1) * 3, p1Sequence * 3); const p1Boss = p1BossEncounterPosition(p1BossOpening, p1Positions.slice(0, 2), p1Sequence, event, eventTimeRef.current, WORLD.center); if (event === 'p1-crystals') handleP1CrystalPickup(next, p1Boss, currentP1Crystals); if (event === 'p1-soaks') { const playerSoak = p1Soaks.find(soak => soak.assignee === 'player'); if (playerSoak && distance(next, playerSoak.position) <= P1_REACTIVE_SOAK_RADIUS) setP1SoakResolved(current => current.includes(playerSoak.id) ? current : [...current, playerSoak.id]) } if (event === 'p2-orbs') { const playerBeamSlot = p2BeamAssignees.indexOf(assignment); if (playerBeamSlot >= 0) { const orb = p2OrbPosition(p2BeamOrbIndices[playerBeamSlot], p2OrbitAngleRef.current, WORLD.center); setP2Soaked(p2BeamHitsAssignedOrb(next, orb, WORLD.center)) } } if (npcCrystals.length && !p1WrongCrystalHeldRef.current) { const touchedNpcCrystal = npcCrystals.findIndex(target => canPickupCrystalAlongPath(p, next, target, npcCrystalAge)); if (touchedNpcCrystal >= 0) { setNpcCrystals(current => current.filter((_, index) => index !== touchedNpcCrystal)); const wrongPickup = !event.startsWith('p2-') || !activeCrystalAssignments.includes(assignment); if (wrongPickup) { recordMistake(`Picked up another player's ${event.startsWith('p2-') ? 'Phase 2' : event.startsWith('p1-') ? 'Phase 1' : 'raid'} crystal`, 50); p1WrongCrystalHeldRef.current = true; p1WrongCrystalPickedAtRef.current = timeRef.current; p1StolenCrystalSlotRef.current = touchedNpcCrystal; setP1WrongCrystalHeld(true); setP1StolenCrystalSlot(touchedNpcCrystal); setP1WrongCrystalDeadline(timeRef.current + 5) } } } const protectionStack = p3ArchangelStackPosition(p3SideForPosition(p3Positions[assignment], WORLD.center), WORLD.center, p3Round); const committedToProtection = isCommittedP3ProtectionCrystal({ event, crystal, stack: protectionStack, duty: activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null, round: p3Round, droppedForProtection: droppedForPackRef.current }); if (crystal && canPickupCrystalDuringEvent(event, committedToProtection) && canPickupCrystalAlongPath(p, next, crystal, crystalAgeRef.current)) { if (p1StolenCrystalSlotRef.current !== null && !p1CrystalCollected) { p1WrongCrystalHeldRef.current = true; p1WrongCrystalPickedAtRef.current = timeRef.current; setP1WrongCrystalHeld(true); setP1WrongCrystalDeadline(timeRef.current + 5) } setCrystal(null); setCrystalAge(0); crystalAgeRef.current = 0; setStats(s => ({ ...s, crystalDropped: false })) } updateP3Pools(next, dt); updateP3LandingHealth(next, dt); updateP3PositionHealth(next, dt); checkHazards(next, dt); return next })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clearMovement) }
  }, [screen, paused, movementSpeed, movementBonus, gameSpeed, event, beamAngles, npcSplinters, crystal, npcCrystals, keyBindings, difficulty, assignment, controlledTank, activeCrystalAssignments, crystalSpent, p1Sequence, p1Seed, p1Soaks, p1Positions, p1BossOpening, p1MemoryOrderState, p2BeamAssignees, p2BeamOrbIndices, p3Round, p3RuneOrder, p3ResolvedRunes, p3Positions, p4PatternSeed, encounterSoundsEnabled, encounterSoundVolume])

  useEffect(() => {
    if (screen !== 'game' || paused) return
    const duration = event === 'p1-countdown' ? 3 : event === 'p1-pull' ? P1_PULL_DELAY_SECONDS : event === 'p1-interrupts' ? P1_INTERRUPT_CAST_COUNT * P1_INTERRUPT_CAST_SECONDS : event === 'p1-crystals' ? P1_CRYSTAL_PICKUP_SECONDS : event === 'p1-glaives' ? P1_GLAIVE_TELEGRAPH_SECONDS + P1_MEMORY_DELAY_SECONDS : event === 'p1-memory-position' ? P1_MEMORY_POSITION_SECONDS : event === 'p1-memory-sweep' ? P1_MEMORY_SWEEP_SECONDS : event === 'p1-beam-position' ? P1_BEAM_POSITION_SECONDS : event === 'p1-beam-telegraph' ? P1_ROTATING_BEAM_TELEGRAPH_SECONDS : event === 'p1-beams' ? P1_ROTATING_BEAM_ACTIVE_SECONDS : event === 'p1-soaks' ? P1_REACTIVE_SOAK_SECONDS : event === 'p1-transition' ? P1_INTERMISSION_POSITION_SECONDS : event === 'positioning' ? INTERMISSION_POSITIONING_SECONDS : event === 'p1-recover' ? P1_FINAL_RECOVERY_SECONDS : event === 'p2-jump' ? 1.4 : event === 'p2-positioning' ? P2_POSITIONING_SECONDS : event === 'p2-orbs' ? P2_BEAM_SECONDS : event === 'p2-recover' ? 0 : event === 'p2-fetch' ? P2_FETCH_SECONDS : event === 'p2-spread' ? P2_SPREAD_SECONDS : event === 'p2-pull' ? P2_PULL_SECONDS : event === 'p2-wait' ? Infinity : event === 'p3-flight' ? P3_FLIGHT_SECONDS : event === 'p3-landing' ? 3 : event === 'p3-approach' ? P3_APPROACH_SECONDS : event === 'p3-light-pools' ? P3_SECTOR_SECONDS : event === 'p3-pools-overlap' ? 15 : event === 'p3-rune-preview' ? 2 : event === 'p3-lattice-memory' ? 10 : event === 'p3-lattice-second' ? 4.5 : event === 'p3-big-boom' ? 1 : event === 'p3-archangel-position' ? 4 : event === 'p3-archangel' ? 6 : event === 'p3-sector-move' ? p3Round >= 2 ? P3_FINAL_SECTOR_MOVE_SECONDS : P3_SECTOR_MOVE_SECONDS : event === 'p4-countdown' ? 3 : event === 'p4-transition' ? P4_KNOCKUP_SECONDS : event === 'p4-cycle' ? P4_CYCLE_SECONDS : 3
    if (eventTime < duration) return
    eventTimeRef.current = 0
    setEventTime(0)
    if (event === 'p1-countdown') {
      setEvent('p1-pull')
    } else if (event === 'p1-pull') {
      setP1InterruptCast(0)
      p1InterruptFailureTriggeredRef.current = false
      p1WrongCrystalHeldRef.current = false
      p1StolenCrystalSlotRef.current = null
      p1TouchedCrystalSlotsRef.current.clear()
      setP1WrongCrystalHeld(false)
      setP1WrongCrystalDeadline(null)
      setP1StolenCrystalSlot(null)
      setEvent('p1-interrupts')
    } else if (event === 'p1-interrupts') {
      if (!p1InterruptPressedRef.current && !p1InterruptFailureTriggeredRef.current && triggerWipe(`Missed assigned interrupt ${p1InterruptAssignmentRef.current + 1}`)) return
      setP1CrystalCollected(!activeCrystalAssignments.slice((p1Sequence - 1) * 3, p1Sequence * 3).includes(assignment))
      setEvent('p1-crystals')
    } else if (event === 'p1-crystals') {
      const assignedPickup = activeCrystalAssignments.slice((p1Sequence - 1) * 3, p1Sequence * 3).includes(assignment)
      if (assignedPickup && !p1CrystalCollected && triggerWipe('Assigned Phase 1 crystal was not collected within five seconds')) return
      const p1Boss = p1BossEncounterPosition(p1BossOpening, p1Positions.slice(0, 2), p1Sequence, event, eventTimeRef.current, WORLD.center)
      const set = p1GlaiveSet(p1Seed, p1Sequence, p1Boss, timeRef.current, {
        speed: movementSpeed * P1_GLAIVE_INITIAL_SPEED_MULTIPLIER,
        reflectedSpeed: movementSpeed * P1_GLAIVE_RETURN_SPEED_MULTIPLIER,
      })
      p1GlaiveSetsRef.current = p1AddGlaiveSet(p1GlaiveSetsRef.current, set, timeRef.current)
      setP1GlaiveSets(p1GlaiveSetsRef.current)
      hitRef.current = false
      setEvent('p1-glaives')
    } else if (event === 'p1-glaives') {
      setEvent('p1-memory-position')
    } else if (event === 'p1-memory-position') {
      p1MemoryPlayerVerdictRef.current = null
      p1MemoryFailureTriggeredRef.current = false
      setP1FailedMemoryRune(null)
      setEvent('p1-memory-sweep')
    } else if (event === 'p1-memory-sweep') {
      const rune = (['T', 'X', 'O', 'V', '+'] as P1Rune[])[assignment % 5]
      const memoryBoss = p1BossEncounterPosition(p1BossOpening, p1Positions.slice(0, 2), p1Sequence, event, eventTimeRef.current, WORLD.center)
      const outwardAngle = Math.atan2(memoryBoss.y - WORLD.center.y, memoryBoss.x - WORLD.center.x)
      const verdict = p1MemoryPlayerVerdict(
        p1MemoryPlayerVerdictRef.current,
        playerRef.current,
        memoryBoss,
        p1MemoryOrderState,
        rune,
        P1_MEMORY_SWEEP_SECONDS,
        outwardAngle,
        p1LiveRunePositions(playerRef.current, renderedNpcPositionsRef.current, assignment, profiles.length),
      )
      if (verdict !== true && !p1MemoryFailureTriggeredRef.current) {
        p1MemoryFailureTriggeredRef.current = true
        setP1FailedMemoryRune(rune)
        if (triggerWipe(`Rune ${rune} was out of order around L’ura`)) return
      }
      setEvent('p1-beam-position')
      p1GlaiveContactRef.current = false
    } else if (event === 'p1-beam-position') {
      setEvent('p1-beam-telegraph')
    } else if (event === 'p1-beam-telegraph') {
      p1SoakHitRef.current = false
      setEvent('p1-beams')
    } else if (event === 'p1-beams') {
      if (p1Sequence >= P1_SEQUENCE_COUNT) {
        setPhasePositions(orientedAssignments(positions, startSlots[startSlot], WORLD.center))
        announceCrystalDuty(p1CrystalAssignments, intermissionCrystalAssignments, 'Intermission')
        setEvent('p1-transition')
      } else {
        const nextSequence = p1Sequence + 1
        setP1Sequence(nextSequence)
        setP1MemoryOrderState(p1MemoryOrder(p1Seed, nextSequence))
        p1InterruptAssignmentRef.current = p1InterruptAssignment(p1Seed + assignment + nextSequence * 31)
        p1InterruptPressedRef.current = false
        p1InterruptFailureTriggeredRef.current = false
        p1WrongCrystalHeldRef.current = false
        p1StolenCrystalSlotRef.current = null
        p1TouchedCrystalSlotsRef.current.clear()
        setP1WrongCrystalHeld(false)
        setP1StolenCrystalSlot(null)
        setP1WrongCrystalDeadline(null)
        setP1InterruptPressed(false)
        setP1InterruptCast(0)
        setP1CrystalCollected(false)
        setEvent('p1-interrupts')
      }
    } else if (event === 'p1-soaks') {
      if (!p1SoakResolved.includes(1) && triggerWipe('Failed the reactive Phase 1 Soak')) return
      setP1Soaks([])
      setP1SoakResolved([])
      if (p1Sequence >= P1_SEQUENCE_COUNT) {
        setPhasePositions(orientedAssignments(positions, startSlots[startSlot], WORLD.center))
        announceCrystalDuty(p1CrystalAssignments, intermissionCrystalAssignments, 'Intermission')
        setEvent('p1-transition')
      } else {
        const nextSequence = p1Sequence + 1
        setP1Sequence(nextSequence)
        setP1MemoryOrderState(p1MemoryOrder(p1Seed, nextSequence))
        p1InterruptAssignmentRef.current = p1InterruptAssignment(p1Seed + assignment + nextSequence * 31)
        p1InterruptPressedRef.current = false
        p1InterruptFailureTriggeredRef.current = false
        p1WrongCrystalHeldRef.current = false
        p1StolenCrystalSlotRef.current = null
        p1TouchedCrystalSlotsRef.current.clear()
        setP1WrongCrystalHeld(false)
        setP1StolenCrystalSlot(null)
        setP1WrongCrystalDeadline(null)
        setP1InterruptPressed(false)
        setP1InterruptCast(0)
        setP1CrystalCollected(false)
        setEvent('p1-interrupts')
      }
    } else if (event === 'p1-transition') {
      const positioningFailure = p1PositioningWipeReason(playerRef.current, WORLD.center, WORLD.innerRadius, WORLD.outerRadius)
      if (positioningFailure && triggerWipe(positioningFailure)) return
      p1GlaiveSetsRef.current = []
      setP1GlaiveSets([])
      p1GlaiveContactRef.current = false
      beginTrackedPhase('intermission')
      setEvent('beam')
      setCycle(1)
      chooseBossPattern(playerRef.current)
      hitRef.current = false
    } else if (event === 'p4-countdown') {
      const stack = p4TransitionStartPosition(WORLD.center)
      playerRef.current = stack
      setPlayer(stack)
      setEvent('p4-transition')
    } else if (event === 'p1-recover') {
      if (crystal) {
        if (triggerWipe('Crystal was not recovered before the Phase 2 transition')) return
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      jumpOriginRef.current = player
      setNpcCrystals([])
      setNpcCarrier(null)
      beginTrackedPhase('p2')
      announceCrystalDuty(intermissionCrystalAssignments, p2CrystalAssignments, 'P2')
      prepareP2Beam(1, 1.4 + P2_POSITIONING_SECONDS + P2_BEAM_SECONDS)
      setEvent('p2-jump')
      hitRef.current = false
    } else if (event === 'p2-countdown') {
      prepareP2Beam(1, P2_POSITIONING_SECONDS + P2_BEAM_SECONDS)
      setEvent('p2-positioning')
    } else if (event === 'p2-jump') {
      playerRef.current = WORLD.center
      setPlayer(WORLD.center)
      setEvent('p2-positioning')
      hitRef.current = false
    } else if (event === 'p2-positioning') {
      droppedForPackRef.current = false
      if (!p2BeamOrbIndicesRef.current.length) prepareP2Beam(p2Cycle, P2_BEAM_SECONDS)
      setEvent('p2-orbs')
    } else if (event === 'p2-orbs') {
      const playerBeamSlot = p2BeamAssignees.indexOf(assignment)
      if (playerBeamSlot >= 0) {
        const orbIndex = p2BeamOrbIndicesRef.current[playerBeamSlot]
        const orb = p2OrbPosition(orbIndex, p2OrbitAngleRef.current, WORLD.center)
        if (!p2BeamHitsAssignedOrb(playerRef.current, orb, WORLD.center) && triggerWipe('Your Phase 2 beam missed its assigned orb')) return
      }
      const isCarrier = activeCrystalAssignments.includes(assignment)
      const crystalFailure = isCarrier && !droppedForPackRef.current
        ? 'Orb beam resolved before you dropped the crystal'
        : isCarrier && !crystal
          ? 'The cross beam hit your carried crystal'
          : ''
      if (crystalFailure && triggerPlayerCrystalFailure(crystalFailure)) return
      const resolvedOrbs = [...p2ResolvedOrbIndicesRef.current, ...p2BeamOrbIndicesRef.current]
      p2ResolvedOrbIndicesRef.current = resolvedOrbs
      setP2ResolvedOrbIndices(resolvedOrbs)
      setP2ReturningOrbIndices(p2BeamOrbIndicesRef.current)
      p2OrbReturnAgeRef.current = 0
      p2OrbReturnHitRef.current = false
      p2OrbPlayerHitRef.current = false
      setP2OrbReturnAge(0)
      beginP2Pull()
    } else if (event === 'p2-recover') {
      if (crystal) {
        if (triggerWipe('Crystal was not recovered within 6 seconds')) return
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      beginP2Pull()
    } else if (event === 'p2-pull') {
      droppedForPackRef.current = false
      setNpcCrystals(p2NpcCrystalDrops(WORLD.center, activeCrystalAssignments.filter(index => index !== assignment).length))
      setNpcCrystalAge(0)
      setNpcCarrier(null)
      setEvent('p2-spread')
    } else if (event === 'p2-spread') {
      const isCarrier = activeCrystalAssignments.includes(assignment)
      const npcSpreadPositions = p2SpreadPositions
        .filter((_, index) => index !== assignment)
        .map(target => walkTowards(WORLD.center, target, P2_SPREAD_SECONDS, movementSpeed))
      if (personalCircleHitsPlayer(player, npcSpreadPositions)) recordMistake('Personal circle hit another player', PLAYER_COLLISION_PENALTY)
      const placementFailure = isCarrier && (!droppedForPackRef.current || !crystal || distance(crystal, WORLD.center) > 11)
      const circleHitCrystal = Boolean(crystal && [player, ...npcSpreadPositions].some(target => distance(target, crystal) < P2_PERSONAL_CIRCLE_OUTER_RADIUS))
      const playerHitNpcCrystal = personalCircleHitsCrystal(player, npcCrystals)
      const crystalFailure = placementFailure ? 'Crystal was not dropped in the middle before the circles' : playerHitNpcCrystal ? 'Your personal circle hit another player’s crystal' : circleHitCrystal ? 'A personal circle hit the crystal' : ''
      if (crystalFailure && triggerPlayerCrystalFailure(crystalFailure)) return
      if (crystalFailure) {
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      setNpcCrystals([])
      setNpcCrystalAge(0)
      setEvent(isCarrier && !crystalFailure ? 'p2-fetch' : 'p2-wait')
    } else if (event === 'p2-fetch') {
      if (crystal) {
        if (triggerWipe('Crystal was not fetched after the personal circles')) return
        setCrystal(null)
        setCrystalAge(0)
        crystalAgeRef.current = 0
      }
      setEvent('p2-wait')
    } else if (event === 'p3-countdown') {
      beginP3(false)
    } else if (event === 'p3-flight') {
      const target = p3LandingPosition(p3LandingPlanIndex(assignment, p3Positions, WORLD.center), WORLD.center)
      playerRef.current = target
      setPlayer(target)
      setEvent('p3-landing')
    } else if (event === 'p3-landing') {
      const soaks = p3LandingSoakPositions(p3LandingPlanIndex(assignment, p3Positions, WORLD.center), WORLD.center, p4PatternSeed)
      if (p3LandingRequiredRef.current && !p3LandingSoakOccupied(soaks, player, renderedNpcPositionsRef.current)) {
        if (triggerWipe('Missed the initial yellow landing soak')) return
      }
      setP3RuneOrder(shuffledRunes())
      setP3RuneStep(0)
      p3ResolvedRunesRef.current = []
      setP3ResolvedRunes([])
      setP3PoolHealth(Array(6).fill(P3_POOL_HEALTH))
      p3RuneCheckedRef.current = false
      p3RuneContactRef.current = false
      p3WrongRuneContactRef.current = false
      p3WrongRuneSinceRef.current = { rune: null, since: 0 }
      p3RuneFailedRef.current = false
      p3StarsCycleRef.current = -1
      setEvent('p3-approach')
    } else if (event === 'p3-approach') {
      if (!isOnAssignedP3Side(playerRef.current, p3Positions[assignment], WORLD.center)) {
        recordMistake('Wrong Phase 3 side after positioning', PLAYER_COLLISION_PENALTY)
      }
      setP3PoolHealth(Array(6).fill(P3_POOL_HEALTH))
      p3PoolOccupancyRef.current = [0, 0, 0, 0, 0, 0]
      p3RuneCheckedRef.current = false
      p3RuneContactRef.current = false
      p3WrongRuneContactRef.current = false
      p3WrongRuneSinceRef.current = { rune: null, since: 0 }
      p3RuneFailedRef.current = false
      setEvent('p3-light-pools')
    } else if (event === 'p3-light-pools') {
      if (p3PoolHealth.some(value => value > .5) && triggerWipe('Big boom resolved before every Soak was completed')) return
      if (!p3MemoryResolved(p3RuneOrder, p3ResolvedRunesRef.current)) {
        if (triggerWipe('Big boom resolved before the memory game was completed')) return
        p3ResolvedRunesRef.current = [...p3RuneOrder]
        setP3ResolvedRunes([...p3RuneOrder])
      }
      if (!p3RuneCheckedRef.current) {
        playerRuneFailuresRef.current += 1
        if (triggerWipe(`Failed to match rune ${playerRune(assignment)} in order`)) return
      }
      setP3RuneStep(3)
      setEvent('p3-big-boom')
    } else if (event === 'p3-big-boom') {
      setEvent('p3-archangel-position')
    } else if (event === 'p3-rune-preview') {
      setEvent('p3-lattice-memory')
    } else if (event === 'p3-lattice-memory') {
      if (!p3RuneCheckedRef.current) {
        playerRuneFailuresRef.current += 1
        if (triggerWipe(`Failed to match rune ${playerRune(assignment)} in order`)) return
      }
      setP3RuneStep(3)
      setEvent('p3-lattice-second')
    } else if (event === 'p3-lattice-second') {
      setP3PoolHealth(Array(6).fill(P3_POOL_HEALTH))
      setEvent('p3-pools-overlap')
    } else if (event === 'p3-pools-overlap') {
      if (p3PoolHealth.some(value => value > .5) && triggerWipe('An overlapping Soak was not completed')) return
      setEvent('p3-archangel-position')
    } else if (event === 'p3-archangel-position') {
      droppedForPackRef.current = false
      setEvent('p3-archangel')
    } else if (event === 'p3-archangel') {
      const bubble = p3ArchangelStackPosition(p3SideForPosition(p3Positions[assignment], WORLD.center), WORLD.center, p3Round)
      const duty = activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null
      const protectionCenter = p3ProtectionBubbleCenter(bubble, crystal, duty, p3Round)
      const protectedByBubble = isProtectedByP3Bubble(player, protectionCenter)
      const failure = duty === p3Round && (!droppedForPackRef.current || !crystal)
        ? 'Dark Archangel resolved before your assigned crystal protection'
        : duty === p3Round && crystal && !isP3ProtectionCrystalPlaced(crystal, bubble)
          ? 'The protection crystal was dropped away from the raid stack'
        : !protectedByBubble
          ? 'Dark Archangel hit you outside the protection bubble'
          : ''
      if (failure && triggerWipe(failure)) return
      if (duty === p3Round && crystal) setCrystalSpent(true)
      setCrystal(null); setCrystalAge(0); crystalAgeRef.current = 0
      setStats(current => ({ ...current, crystalDropped: false }))
      setEvent('p3-sector-move')
    } else if (event === 'p3-sector-move') {
      if (p3Round >= 2) {
        const stack = p4TransitionStartPosition(WORLD.center)
        const p4Boss = p4StartingBossState()
        playerRef.current = stack
        setPlayer(stack)
        bossPlayerDamageRef.current = p4Boss.playerDamage
        bossHealthRef.current = p4Boss.health
        setBossHealth(p4Boss.health)
        beginTrackedPhase('p4')
        announceCrystalDuty(p3CrystalAssignments, [], 'P4')
        p4CycleRef.current = 1
        setP4Cycle(1)
        setEvent('p4-transition')
        return
      }
      setP3Round(2)
      setP3PoolHealth(Array(6).fill(P3_POOL_HEALTH))
      p3PoolOccupancyRef.current = [0, 0, 0, 0, 0, 0]
      setP3RuneOrder(shuffledRunes())
      setP3RuneStep(0)
      p3ResolvedRunesRef.current = []
      setP3ResolvedRunes([])
      p3RuneCheckedRef.current = false
      p3RuneContactRef.current = false
      p3WrongRuneContactRef.current = false
      p3WrongRuneSinceRef.current = { rune: null, since: 0 }
      p3RuneFailedRef.current = false
      p3StarsCycleRef.current = -1
      setEvent('p3-light-pools')
    } else if (event === 'p4-transition') {
      p4SplinterCheckedRef.current = -1
      eventTimeRef.current = P4_KNOCKUP_SECONDS
      setEventTime(P4_KNOCKUP_SECONDS)
      setEvent('p4-cycle')
    } else if (event === 'p4-cycle') {
      if (p4Cycle >= 5) { finishP4AndShowResults(); return }
      setP4PatternSeed(Math.floor(Math.random() * 2147483647))
      setP4Cycle(current => {
        const next = current + 1
        p4CycleRef.current = next
        return next
      })
      setEvent('p4-cycle')
    } else if (event === 'countdown') {
      setEvent('positioning')
    } else if (event === 'positioning') {
      const positioningFailure = p1PositioningWipeReason(player, WORLD.center, WORLD.innerRadius, WORLD.outerRadius)
      if (positioningFailure && triggerWipe(positioningFailure)) return
      setEvent('beam'); chooseBossPattern(player); hitRef.current = false
    } else if (event === 'beam') {
      const carrier = !npcCrystals.length && Math.random() < .65 ? nearestNpc(player, stats.time, phasePositions, assignment, activeCrystalCarriers, event, eventTime, beamAngles, startSlots[startSlot], movementSpeed, movementBonus) : null
      const marked = cycle === 6 ? Array.from({ length: 19 }, (_, index) => index) : pickNpcSplinters(carrier)
      const radialAngle = Math.atan2(player.y - WORLD.center.y, player.x - WORLD.center.x)
      setEvent('splinter'); setNpcSplinters(marked); setPlayerSplinterRotation(radialAngle + (Math.random() < .5 ? 0 : Math.PI / 6)); if (carrier !== null) { setNpcCarrier(carrier); setNpcCrystalAge(0); setNpcCrystals([npcPosition(carrier, stats.time, phasePositions, assignment, event, eventTime, beamAngles, startSlots[startSlot], movementSpeed, movementBonus)]) } hitRef.current = false
    } else {
      if (cycle >= 6) { setNpcSplinters([]); setEvent('p1-recover'); hitRef.current = false; return }
      droppedForPackRef.current = false; setEvent('beam'); setNpcSplinters([]); chooseBossPattern(player); setCycle(c => c + 1); hitRef.current = false
    }
  }, [eventTime, screen, paused, event, stats.time, player, cycle, p1Sequence, p1Seed, p1CrystalCollected, p1MemoryOrderState, p1SoakResolved, p2Cycle, p2Soaked, p2BeamAssignees, p2ReturningOrbIndices, p3Round, p3PoolHealth, p4Cycle, crystal])

  useEffect(() => {
    if (!crystal || crystalAge < CRYSTAL_GROUND_EXPLOSION_SECONDS) return
    const stack = p3ArchangelStackPosition(p3SideForPosition(p3Positions[assignment], WORLD.center), WORLD.center, p3Round)
    const committedToProtection = isCommittedP3ProtectionCrystal({
      event,
      crystal,
      stack,
      duty: activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null,
      round: p3Round,
      droppedForProtection: droppedForPackRef.current,
    })
    if (committedToProtection) return
    setCrystal(null); setCrystalAge(0); crystalAgeRef.current = 0; setStats(s => ({ ...s, crystalDropped: false }))
    triggerWipe(crystalWipeReason({ assigned: true, splinterResolving: false, dropped: true, crystalHit: false, expired: true })!)
  }, [activeCrystalAssignments, assignment, crystal, crystalAge, event, p3ArchangelDuty, p3Positions, p3Round])
  useEffect(() => { if (!npcCrystals.length || npcCrystalAge < CRYSTAL_GROUND_EXPLOSION_SECONDS) return; setNpcCrystals([]); setNpcCarrier(null); setNpcCrystalAge(0) }, [npcCrystals, npcCrystalAge])

  function handleTankMechanicEvents(events: TankMechanicEvent[]) {
    events.forEach(tankEvent => {
      if (tankEvent.type === 'failure') {
        tankFailureCountRef.current += 1
        if (tankFailureCountRef.current >= 2) triggerWipe(`${tankEvent.reason} (tank strike 2/2)`, WIPE_PENALTY, true)
        else recordMistake(`${tankEvent.reason} (tank strike 1/2)`, 250, 0)
      }
      if (tankEvent.type === 'tears') {
        recordMistake('Crystal tank triggered Tears of L’ura during Heaven’s Lance', 50, 0)
      }
    })
  }
  function useTankAction() {
    if (jumpUntilRef.current > timeRef.current || controlledTank === null) return
    if (event === 'p4-cycle') {
      if (controlledTank !== 0) return
      if (timeRef.current < p4PlayerConeReadyAtRef.current) return
      p4PlayerConeUntilRef.current = timeRef.current + P4_TANK_CONE_DURATION_SECONDS
      p4PlayerConeReadyAtRef.current = timeRef.current + P4_TANK_CONE_INTERVAL_SECONDS
      setP4PlayerConeUntil(p4PlayerConeUntilRef.current)
      return
    }
    const result = requestTankTaunt(tankMechanicRef.current, controlledTank)
    tankMechanicRef.current = result.state
    setTankMechanic(result.state)
    handleTankMechanicEvents(result.events)
  }
  function useRecovery(action: 'healthPot' | 'shield') {
    if (jumpUntilRef.current > timeRef.current) return
    const usedRef = action === 'healthPot' ? healthPotUsedRef : shieldUsedRef
    const recurringTankShield = action === 'shield' && controlledTank !== null
    if (recurringTankShield) {
      const prepared = prepareTankDefensive(tankMechanicRef.current, controlledTank)
      if (prepared === tankMechanicRef.current) return
      tankMechanicRef.current = prepared
      setTankMechanic(prepared)
    } else if (usedRef.current) return
    const firstUseThisPhase = !usedRef.current
    usedRef.current = true
    recoveryUseCountRef.current += 1
    if (action === 'healthPot') setHealthPotUsed(true)
    else setShieldUsed(true)
    const reactedInTime = firstUseThisPhase && healthRef.current < 30 && phaseRecoveryRef.current.status === 'pending'
    if (reactedInTime) {
      phaseRecoveryRef.current.status = 'passed'
      statsRef.current = { ...statsRef.current, score: statsRef.current.score + 50 }
      setStats(statsRef.current)
    }
    healthRef.current = 100
    setHealth(100)
    healthTargetRef.current = 100
    nextHealthTargetRef.current = timeRef.current + .5 + Math.random()
  }
  function updateHealth(dt: number) {
    if (wipeRef.current) return
    if (event === 'countdown' || event === 'p2-countdown' || event === 'p3-countdown' || event === 'p3-flight' || event === 'p4-countdown' || event === 'p4-transition') {
      if (Number.isFinite(nextHealthTargetRef.current)) nextHealthTargetRef.current += dt
      return
    }
    if (event.startsWith('p3-') && event !== 'p3-landing' && event !== 'p3-approach') {
      return
    }
    if (timeRef.current >= nextHealthTargetRef.current) {
      const target = randomHealthTarget(!healthPotUsedRef.current || !shieldUsedRef.current)
      healthTargetRef.current = target.value
      nextHealthTargetRef.current = timeRef.current + Math.abs(target.value - healthRef.current) / healthChangeRate(healthRef.current, target.value) + target.holdSeconds
    }
    healthRef.current = approachHealthTarget(healthRef.current, healthTargetRef.current, dt)
    setHealth(healthRef.current)
  }
  function beginP2Pull() {
    pullOriginRef.current = playerRef.current
    setEvent(p2PostBeamEvent())
  }
  function prepareP2Beam(nextCycle: number, leadSeconds: number) {
    const impactAngle = p2OrbitAngleRef.current + P2_ORBIT_SPEED * leadSeconds
    const blockedAssignees = FEATURE_FLAGS.p2PlayerBeamDuty
      ? p2CrystalAssignments
      : [...p2CrystalAssignments, assignment]
    const assignees = p2BeamPlayers(p2SeedRef.current, nextCycle, blockedAssignees, profiles.length)
    const orbIndices = p2BeamTargetOrbIndices(p2ResolvedOrbIndicesRef.current, impactAngle)
    p2BeamOrbIndicesRef.current = orbIndices
    setP2BeamAssignees(assignees)
    setP2BeamOrbIndices(orbIndices)
    setP2BeamImpactAngle(impactAngle)
    setP2Soaked(!assignees.includes(assignment))
  }
  function beginP3(transitioningFromP2 = true) {
    beginTrackedPhase('p3')
    if (transitioningFromP2) announceCrystalDuty(p2CrystalAssignments, p3CrystalAssignments, 'P3')
    setCrystal(null)
    setCrystalAge(0)
    crystalAgeRef.current = 0
    setCrystalSpent(false)
    eventTimeRef.current = 0
    setEventTime(0)
    p2OrbReturnAgeRef.current = -1
    setP2OrbReturnAge(-1)
    p3FlightOriginRef.current = playerRef.current
    setNpcCrystals([])
    setNpcCarrier(null)
    setP3Round(1)
    setP3PoolHealth(Array(6).fill(P3_POOL_HEALTH))
    setP3RuneOrder(shuffledRunes())
    setP3RuneStep(0)
    p3ResolvedRunesRef.current = []
    setP3ResolvedRunes([])
    p3RuneCheckedRef.current = false
    p3RuneContactRef.current = false
    p3RuneFailedRef.current = false
    p3StarsCycleRef.current = -1
    p3LandingRequiredRef.current = true
    setEvent('p3-flight')
  }
  function updateP3Pools(position: Point, dt: number) {
    if (event !== 'p3-light-pools' && event !== 'p3-pools-overlap') return
    const side = p3SideForPosition(p3Positions[assignment], WORLD.center)
    const centers = p3PoolCenters(side, WORLD.center, p3Round)
    setP3PoolHealth(current => current.map((healthValue, index) => {
      const poolSide: -1 | 1 = index < 3 ? -1 : 1
      const localIndex = index % 3
      const playerInside = poolSide === side && isInsideP3Pool(position, centers[localIndex], P3_POOL_RADIUS)
      const occupants = p3PoolOccupancyRef.current[index] + (playerInside ? 1 : 0)
      const rate = p3PoolSoakRate(occupants)
      return Math.max(0, healthValue - rate * dt)
    }))
  }
  function updateP3LandingHealth(position: Point, dt: number) {
    if (event !== 'p3-landing') return
    const soaks = p3LandingSoakPositions(p3LandingPlanIndex(assignment, p3Positions, WORLD.center), WORLD.center, p4PatternSeed)
    const inYellowPool = soaks.some(soak => distance(position, soak) <= P3_LANDING_SOAK_RADIUS)
    healthRef.current = Math.max(0, Math.min(100, healthRef.current + p3LandingHealthRate(inYellowPool) * dt))
    setHealth(healthRef.current)
  }
  function updateP3PositionHealth(position: Point, dt: number) {
    if (!event.startsWith('p3-') || event === 'p3-countdown' || event === 'p3-flight' || event === 'p3-landing' || event === 'p3-approach' || wipeRef.current) {
      p3UnsafeSecondsRef.current = 0
      return
    }
    const inArena = distance(position, WORLD.center) >= WORLD.innerRadius && distance(position, WORLD.center) <= P3_OUTER_RADIUS
    const inConsumedSector = isP3ConsumedSectorLethal(position, WORLD.center, WORLD.innerRadius, P3_OUTER_RADIUS, p3Round, event, eventTimeRef.current)
    const playerSide = p3SideForPosition(p3Positions[assignment], WORLD.center)
    const activeP3Crystals = p3ActiveCrystalAssignments(activeCrystalAssignments, assignment, activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null, crystalSpent, p3Round, event, p4PatternSeed, p3Positions, WORLD.center)
    const fallbackLights = activeP3Crystals.filter(index => index !== assignment && p3SideForPosition(p3Positions[index], WORLD.center) === playerSide).map(index => {
      const sideAssignments = activeCrystalAssignments.filter(candidate => p3SideForPosition(p3Positions[candidate], WORLD.center) === playerSide)
      return p3LightCenters(playerSide, WORLD.center, p3Round)[sideAssignments.indexOf(index) % 3]
    })
    const carrierLights = p3NpcLightCentersRef.current.length ? p3NpcLightCentersRef.current : fallbackLights
    const protectedByLight = isProtectedByP3Light(position, activeP3Crystals.includes(assignment), carrierLights)
    const archangelStack = p3ArchangelStackPosition(playerSide, WORLD.center, p3Round)
    const duty = activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null
    const correctlyPositioned = event === 'p3-archangel' || event === 'p3-archangel-position'
      ? isProtectedByP3Bubble(position, p3ProtectionBubbleCenter(archangelStack, crystal, duty, p3Round))
      : inArena && !inConsumedSector && protectedByLight
    if (correctlyPositioned) {
      p3UnsafeSecondsRef.current = 0
    } else {
      const previousUnsafeSeconds = p3UnsafeSecondsRef.current
      const nextUnsafeSeconds = previousUnsafeSeconds + dt
      p3UnsafeSecondsRef.current = nextUnsafeSeconds
      const penaltyTicks = p3UnsafePenaltyTicks(previousUnsafeSeconds, nextUnsafeSeconds)
      if (penaltyTicks) recordMistake('Outside a Phase 3 safe zone', penaltyTicks * P3_SAFE_ZONE_PENALTY_PER_SECOND, 0)
    }
    healthRef.current = Math.max(0, Math.min(100, healthRef.current + p3LightHealthRate(correctlyPositioned) * dt))
    setHealth(healthRef.current)
    if (healthRef.current <= 0) {
      const ended = triggerWipe('Your health reached zero outside the Phase 3 light')
      if (!ended) { healthRef.current = 100; setHealth(100) }
    }
  }
  function useMainAbility() {
    if (screen !== 'game' || paused || wipeRef.current || jumpUntilRef.current > timeRef.current) return
    mainAbilityCastRef.current = requestMainAbilityCast(mainAbilityCastRef.current)
    setMainCastState(mainAbilityCastRef.current)
  }
  function useInterrupt() {
    if (event !== 'p1-interrupts') return
    const cast = Math.min(P1_INTERRUPT_CAST_COUNT - 1, Math.floor(eventTimeRef.current / P1_INTERRUPT_CAST_SECONDS))
    const castElapsed = eventTimeRef.current - cast * P1_INTERRUPT_CAST_SECONDS
    if (cast === p1InterruptAssignmentRef.current && castElapsed <= P1_PLAYER_INTERRUPT_WINDOW_SECONDS) {
      p1InterruptPressedRef.current = true
      setP1InterruptPressed(true)
    } else {
      recordMistake(`Interrupted cast ${cast + 1} instead of assigned cast ${p1InterruptAssignmentRef.current + 1}`, 50)
    }
  }
  function handleP1CrystalPickup(position: Point, boss: Point, currentAssignments: number[]) {
    if (event !== 'p1-crystals' || p1WrongCrystalHeldRef.current) return
    const slot = currentAssignments.findIndex((_, index) =>
      distance(position, p1CrystalSpawnPosition(boss, WORLD.center, index)) <= 7)
    if (slot < 0 || p1TouchedCrystalSlotsRef.current.has(slot) || p1StolenCrystalSlotRef.current === slot) return
    const resolution = p1CrystalTouchResolution(p1CrystalAssignments, assignment, p1Sequence, slot)
    if (resolution === 'assigned') {
      setP1CrystalCollected(true)
      p1StolenCrystalSlotRef.current = slot
      setP1StolenCrystalSlot(slot)
      return
    }
    const owner = currentAssignments[slot]
    p1TouchedCrystalSlotsRef.current.add(slot)
    recordMistake(`Picked up P1 crystal assigned to ${profiles[owner]?.name ?? `player ${owner + 1}`}`, 50)
    if (resolution === 'penalty-only') return
    p1WrongCrystalHeldRef.current = true
    p1WrongCrystalPickedAtRef.current = timeRef.current
    p1StolenCrystalSlotRef.current = slot
    setP1WrongCrystalHeld(true)
    setP1StolenCrystalSlot(slot)
    setP1WrongCrystalDeadline(timeRef.current + 5)
  }
  function toggleCrystal() {
    if (p1WrongCrystalHeldRef.current && screen === 'game' && !crystal && jumpUntilRef.current <= timeRef.current) {
      p1WrongCrystalHeldRef.current = false
      setP1WrongCrystalHeld(false)
      setP1WrongCrystalDeadline(null)
      setCrystal(playerRef.current)
      setCrystalAge(0)
      crystalAgeRef.current = 0
      setStats(s => ({ ...s, crystalDropped: true }))
      return
    }
    const carryingAssignedP1Crystal = event.startsWith('p1-') && p1CrystalCollected
    if ((!carryingAssignedP1Crystal && (event.startsWith('p1-') || !activeCrystalAssignments.includes(assignment) || crystalSpent))
      || screen !== 'game' || crystal || jumpUntilRef.current > timeRef.current) return
    droppedForPackRef.current = true
    setCrystal(playerRef.current)
    setCrystalAge(0)
    crystalAgeRef.current = 0
    setStats(s => ({ ...s, crystalDropped: true }))
  }
  function checkHazards(position: Point, dt: number) {
    if (event.startsWith('p4-')) {
      const scriptedStack = event === 'p4-cycle'
        ? p4GroupPosition(p4CycleRef.current, eventTimeRef.current, WORLD.center)
        : p4StackPosition(1, WORLD.center)
      const npcProfileIndices = p4NpcProfileIndices(profiles.length, assignment)
      const stack = event === 'p4-cycle'
        ? FEATURE_FLAGS.tankRoles
          ? p4ProtectionCenter(scriptedStack, position, controlledTank, renderedNpcPositionsRef.current, npcProfileIndices, tankAssignments)
          : scriptedStack
        : scriptedStack
      if (event === 'p4-cycle') {
        const splinterActorOrdinals = FEATURE_FLAGS.tankRoles ? p4NpcSplinterActorOrdinals(npcProfileIndices, tankAssignments) : [1, 4, 7]
        const encounterBoxes = p4EncounterBoxStates(p4CycleRef.current, eventTimeRef.current, WORLD.center)
        const destroyBoxesHitBySplinter = (origin: Point, rotation: number) => encounterBoxes.forEach(box => {
          if (box.active && p4SplinterHitsGroup(origin, rotation, box.position, box.size) && !p4DestroyedBoxIdsRef.current.has(box.id)) {
            p4DestroyedBoxIdsRef.current.add(box.id)
          }
        })
        const duty = controlledTank === null ? p4PlayerSplinterDuty(assignment, p4CycleRef.current, p4PatternSeed) : -1
        if (duty >= 0) {
          const age = p4SplinterAge(p4CycleRef.current, eventTimeRef.current, duty)
          const checkId = p4CycleRef.current * 10 + duty
          if (p4SplinterResolutionActive(age) && p4SplinterCheckedRef.current !== checkId) {
            p4SplinterCheckedRef.current = checkId
            const rotation = p4SplinterRotation(p4CycleRef.current, duty, p4PatternSeed)
            destroyBoxesHitBySplinter(position, rotation)
          }
        }
        for (let ordinal = 0; ordinal < 3; ordinal += 1) {
          if (ordinal === duty) continue
          const npcAge = p4SplinterAge(p4CycleRef.current, eventTimeRef.current, ordinal)
          const npcCheckId = `${p4CycleRef.current}:${ordinal}`
          if (!p4SplinterResolutionActive(npcAge) || p4NpcSplinterCheckedRef.current.has(npcCheckId)) continue
          p4NpcSplinterCheckedRef.current.add(npcCheckId)
          const rotation = p4SplinterRotation(p4CycleRef.current, ordinal, p4PatternSeed)
          const fallbackOrigin = p4NpcSplinterPosition(stack, WORLD.center, ordinal, npcAge, rotation)
          const origin = p4RenderedNpcSplinterOrigin(renderedNpcPositionsRef.current, ordinal, fallbackOrigin, splinterActorOrdinals)
          destroyBoxesHitBySplinter(origin, rotation)
        }
        const coneTankOrdinal = FEATURE_FLAGS.tankRoles ? p4NpcOrdinalForProfile(npcProfileIndices, tankAssignments[0]) : null
        const frontSoaker = !FEATURE_FLAGS.tankRoles
          ? p4FrontSoakerPosition(stack, WORLD.center)
          : controlledTank === 0
            ? position
            : coneTankOrdinal === null
              ? p4FrontSoakerPosition(stack, WORLD.center)
              : renderedNpcPositionsRef.current[coneTankOrdinal] ?? p4FrontSoakerPosition(stack, WORLD.center)
        const frontConeActive = FEATURE_FLAGS.tankRoles && controlledTank === 0 ? timeRef.current < p4PlayerConeUntilRef.current : p4TankConeActive(eventTimeRef.current)
        const frontConeAngle = FEATURE_FLAGS.tankRoles && controlledTank === 0
          ? Math.atan2(cameraForward.current.y, cameraForward.current.x)
          : Math.atan2(WORLD.center.y - frontSoaker.y, WORLD.center.x - frontSoaker.x)
        encounterBoxes.forEach(box => {
          const tankDestroyed = p4TankKillsBox(box.position, frontSoaker)
            || frontConeActive && p4TankConeHitsBox(box.position, frontSoaker, frontConeAngle, box.size / 2)
          if (box.active && tankDestroyed && !p4DestroyedBoxIdsRef.current.has(box.id)) {
            p4DestroyedBoxIdsRef.current.add(box.id)
          }
        })
        const hitBox = encounterBoxes.find(box =>
          box.active
          && !p4DestroyedBoxIdsRef.current.has(box.id)
          && !box.aimedAtGroup
          && distance(position, box.position) <= box.size / 2 + 2.5
        )
        if (hitBox && timeRef.current - p4LastBoxHitRef.current > 1) {
          p4LastBoxHitRef.current = timeRef.current
          triggerWipe('Hit by an add from the middle')
          return
        }
      }
      if (event === 'p4-cycle' && distance(position, stack) > P4_PROTECTION_RADIUS) {
        const previousUnsafeSeconds = p4UnsafeSecondsRef.current
        const nextUnsafeSeconds = previousUnsafeSeconds + dt
        p4UnsafeSecondsRef.current = nextUnsafeSeconds
        const penaltyTicks = p4UnsafePenaltyTicks(previousUnsafeSeconds, nextUnsafeSeconds)
        if (penaltyTicks) recordMistake('Outside the Phase 4 protected stack', penaltyTicks * P4_SAFE_ZONE_PENALTY_PER_SECOND, 0)
        healthRef.current = Math.max(0, healthRef.current - P4_SAFE_ZONE_HEALTH_DRAIN_PER_SECOND * dt)
        setHealth(healthRef.current)
        if (healthRef.current <= 0) {
          const ended = triggerWipe('Heaven and Hell caught you outside the protected stack')
          if (!ended) { healthRef.current = 100; setHealth(100) }
        }
      } else p4UnsafeSecondsRef.current = 0
      return
    }
    if (event.startsWith('p3-')) {
      if (event === 'p3-countdown' || event === 'p3-flight') return
      const radius = distance(position, WORLD.center)
      const consumedSectorLethal = isP3ConsumedSectorLethal(position, WORLD.center, WORLD.innerRadius, P3_OUTER_RADIUS, p3Round, event, eventTimeRef.current)
      if (consumedSectorLethal) {
        healthRef.current = Math.max(0, healthRef.current - 20 * dt)
        setHealth(healthRef.current)
        if (healthRef.current <= 0) {
          const ended = triggerWipe('Your health reached zero in the consumed Phase 3 sector')
          if (!ended) { healthRef.current = 100; setHealth(100) }
        }
      }
      if (radius < WORLD.innerRadius || radius > P3_OUTER_RADIUS) {
        if (!unsafeRef.current) recordMistake('Entered the Phase 3 void zone', 50)
        unsafeRef.current = true
      } else unsafeRef.current = false
      const starsTiming = p3StarsTiming(eventTimeRef.current)
      const latticeActive = event === 'p3-light-pools' && starsTiming.active && starsTiming.localTime >= 2.5 && starsTiming.localTime <= 4.5
        || event === 'p3-lattice-second' && eventTimeRef.current >= 2.5 && eventTimeRef.current <= 4.5
        || event === 'p3-pools-overlap' && eventTimeRef.current >= 6.5 && eventTimeRef.current <= 8.5
      if (latticeActive && !hitRef.current) {
        const side = p3SideForPosition(p3Positions[assignment], WORLD.center)
        const orbs = p3RuneOrbs(side, WORLD.center, p3Round, event === 'p3-light-pools' ? starsTiming.cycle : 0)
        const hit = p3RuneEdges(side, WORLD.center, p3Round, orbs).some(([from, to]) => distanceToSegment(position, orbs[from], orbs[to]) < 2.8)
        if (hit) { hitRef.current = true; triggerWipe('Touched a Stars beam') }
      }
      if (event === 'p3-light-pools' && eventTimeRef.current >= P3_MEMORY_START_SECONDS) {
        const requiredRune = playerRune(assignment)
        const resolvedRunes = p3ResolvedRunesRef.current
        const playerHasRune = !resolvedRunes.includes(requiredRune)
        const nextRune = p3RuneOrder.find(rune => !resolvedRunes.includes(rune))
        const touchingRunes = p3RuneContactsRef.current.filter(rune => !resolvedRunes.includes(rune))
        const touchingPartner = touchingRunes.includes(requiredRune)
        const wrongRune = playerHasRune ? p3WrongRuneContact(touchingRunes, requiredRune) : null
        if (!wrongRune) {
          p3WrongRuneContactRef.current = false
          p3WrongRuneSinceRef.current = { rune: null, since: 0 }
        } else {
          if (p3WrongRuneSinceRef.current.rune !== wrongRune) {
            p3WrongRuneSinceRef.current = { rune: wrongRune, since: timeRef.current }
            p3WrongRuneContactRef.current = false
          } else if (!p3WrongRuneContactRef.current && timeRef.current - p3WrongRuneSinceRef.current.since >= .2) {
            playerRuneFailuresRef.current += 1
            recordMistake(`Bumped into wrong rune ${wrongRune}`, PLAYER_COLLISION_PENALTY)
            p3WrongRuneContactRef.current = true
          }
        }
        if (playerHasRune && touchingPartner && !p3RuneCheckedRef.current && !p3RuneFailedRef.current) {
          if (nextRune === requiredRune) {
            p3RuneCheckedRef.current = true
            resolveP3Rune(requiredRune)
          } else {
            p3RuneFailedRef.current = true
            playerRuneFailuresRef.current += 1
            const ended = triggerWipe(`Matched rune ${requiredRune} out of order`)
            if (!ended) {
              p3RuneCheckedRef.current = true
              resolveP3Rune(requiredRune)
            }
          }
        }
        p3RuneContactRef.current = touchingPartner
      } else if (event === 'p3-lattice-memory') {
        const requiredRune = playerRune(assignment)
        if (!p3ResolvedRunesRef.current.includes(requiredRune) && p3RuneContactsRef.current.includes(requiredRune)) {
          p3RuneCheckedRef.current = true
          resolveP3Rune(requiredRune)
        }
      }
      return
    }
    if (event.startsWith('p1-')) {
      const unsafe = !p1IsInPlayableArena(position, WORLD.center)
      if (unsafe) {
        if (!unsafeRef.current) recordMistake('Entered the Phase 1 void zone', 50)
        unsafeRef.current = true
      } else unsafeRef.current = false
      return
    }
    if (event.startsWith('p2-')) {
      if (event === 'p2-orbs' && eventTimeRef.current >= P2_BEAM_SECONDS - .35 && crystal && (Math.abs(crystal.x - WORLD.center.x) < 7 || Math.abs(crystal.y - WORLD.center.y) < 7)) triggerPlayerCrystalFailure('The cross beam hit the crystal')
      return
    }
    if (!shouldCheckIntermissionVoid(event)) return
    const unsafe = !isInSafeAnnulus(position, WORLD.center, WORLD.innerRadius, WORLD.outerRadius)
    if (unsafe && timeRef.current >= 18) {
      setStats(s => ({ ...s, score: Math.max(0, s.score - 25 * dt), hits: s.hits + (unsafeRef.current ? 0 : 1) }))
      if (!unsafeRef.current) setMistakes(current => [{ id: Date.now() + Math.random(), time: timeRef.current, label: 'Entered the void zone', penalty: 0 }, ...current])
      unsafeRef.current = true
    } else unsafeRef.current = false
    if (hitRef.current) return
    const liveEventTime = eventTimeRef.current
    const allNpcs = renderedNpcPositionsRef.current
    const npcOrigins = npcSplinters.map(index => allNpcs[index]).filter((point): point is Point => Boolean(point))
    const obstacles = [position, ...allNpcs, ...(crystal ? [crystal] : []), ...npcCrystals]
    const npcRotations = npcOrigins.map(origin => safestStarsplinterRotation(origin, obstacles, crystal ? [crystal] : []))
    const splinterResolving = event === 'splinter' && liveEventTime >= 2.65
    const bossHit = event === 'beam' && bossBeamHitsPlayer(position, WORLD.center, beamAngles, 12, liveEventTime)
    const hitByNpcSplinter = splinterResolving && npcOrigins.some((origin, index) => starsplinterHitsPoint(position, origin, npcRotations[index]))
    const playerHitsNpc = splinterResolving && allNpcs.some(target => starsplinterHitsPoint(target, position, playerSplinterRotation))
    const playerHitsCrystalCarrier = splinterResolving && starsplinterHitsCrystalCarrier(
      allNpcs,
      activeCrystalAssignments,
      assignment,
      position,
      playerSplinterRotation,
      10,
      STAR_LENGTH,
      npcCarrier !== null && npcCrystals.length ? [npcCarrier] : [],
    )
    const playerHitsOwnCrystal = Boolean(crystal && splinterResolving && rayHitsAny(crystal, position, playerSplinterRotation))
    const playerHitsRaidCrystal = splinterResolving && npcCrystals.some(target => rayHitsAny(target, position, playerSplinterRotation))
    const npcHitsPlayerCrystal = Boolean(crystal && splinterResolving && npcOrigins.some((origin, index) => rayHitsAny(crystal, origin, npcRotations[index])))
    const bossHitsPlayerCrystal = Boolean(event === 'beam' && crystal && bossBeamHitsPlayer(crystal, WORLD.center, beamAngles, 12, liveEventTime))
    const playerCrystalFailure = crystalWipeReason({ assigned: activeCrystalAssignments.includes(assignment), splinterResolving, dropped: droppedForPackRef.current, crystalHit: playerHitsOwnCrystal, expired: false })
    if (bossHitsPlayerCrystal) { hitRef.current = true; triggerPlayerCrystalFailure('A boss beam hit your crystal'); return }
    if (playerCrystalFailure) { hitRef.current = true; triggerPlayerCrystalFailure(playerCrystalFailure); return }
    if (playerHitsCrystalCarrier) { triggerPlayerCrystalFailure('Your Starsplinter hit a crystal carrier'); return }
    if (playerHitsRaidCrystal) { triggerPlayerCrystalFailure('Your Starsplinter hit another player’s crystal'); return }
    if (npcHitsPlayerCrystal) { hitRef.current = true; triggerWipe('Another player’s Starsplinter hit your crystal'); return }
    if (hitByNpcSplinter && activeCrystalAssignments.includes(assignment) && !crystal) { triggerWipe('Another player’s Starsplinter hit you while carrying the crystal'); return }
    if (bossHit || hitByNpcSplinter || playerHitsNpc) {
      hitRef.current = true
      if (playerHitsNpc) recordMistake('Your Starsplinter hit another player', PLAYER_COLLISION_PENALTY)
      else if (hitByNpcSplinter) recordMistake('Another player’s Starsplinter hit you', PLAYER_COLLISION_PENALTY)
      else recordMistake(event === 'beam' ? 'Hit by a boss beam' : 'Hit by Starsplinter', 60)
    }
  }
  function recordMistake(label: string, penalty: number, cooldownSeconds = 3) {
    if (lastMistakeRef.current.label === label && timeRef.current - lastMistakeRef.current.time < cooldownSeconds) return
    lastMistakeRef.current = { label, time: timeRef.current }
    setMistakes(current => [{ id: Date.now() + Math.random(), time: timeRef.current, label, penalty }, ...current])
    setStats(s => ({ ...s, score: Math.max(0, s.score - penalty), hits: s.hits + 1 }))
  }
  function triggerWipe(label: string, penalty = WIPE_PENALTY, forceTerminal = false): boolean {
    if (wipeRef.current) return true
    if (shouldSuppressRepeatedWipe(lastWipeAtRef.current, timeRef.current)) return false
    lastWipeAtRef.current = timeRef.current
    if (difficulty === 'test') {
      setFailureFlash(true)
      window.setTimeout(() => setFailureFlash(false), 420)
      recordMistake(`${label} — would wipe`, penalty, 0)
      const notice = `TEST MODE · ${label}`
      setSoftWipeNotice(notice)
      window.setTimeout(() => setSoftWipeNotice(current => current === notice ? '' : current), 1800)
      return false
    }
    if (canRecordOnlineWipe(runAttributionRef.current, difficulty)) {
      const recordedDifficulty = difficulty === 'hard' ? 'hard' : 'normal'
      const phase = event.startsWith('p1-') ? 'Phase 1'
        : event.startsWith('p2-') ? 'Phase 2'
          : event.startsWith('p3-') ? 'Phase 3'
            : event.startsWith('p4-') ? 'Phase 4'
              : 'Intermission'
      void recordOnlineWipe(onlineSession.csrfToken, {
        phase,
        difficulty: recordedDifficulty,
        reason: label,
        trainerVersion: APP_VERSION,
        attemptId: onlineAttempt?.attemptId,
        nonce: onlineAttempt?.nonce,
      }).catch(error => {
        if (error instanceof Error && error.message === 'not_authenticated') {
          setOnlineSession({ authenticated: false })
          setOnlineResultStatus('Your online session expired. This wipe was not published anonymously. Log in again before the next run.')
        } else if (error instanceof Error && error.message === 'character_required') {
          setOnlineSession(current => ({
            ...current,
            privacy: current.privacy ? { ...current.privacy, selectedCharacterId: null } : undefined,
            selectedCharacter: undefined,
          }))
          setOnlineResultStatus('Your active Battle.net character is missing. This wipe was not published anonymously; select a character before the next run.')
        }
      })
    }
    wipeCountRef.current += 1
    const canRecover = !forceTerminal && canRecoverFromWipe(difficulty, wipeCountRef.current, stats.score, penalty)
    setFailureFlash(true)
    window.setTimeout(() => setFailureFlash(false), 420)
    recordMistake(`${label} — wipe`, penalty, 0)
    if (canRecover) {
      setSoftWipeNotice(label)
      window.setTimeout(() => setSoftWipeNotice(''), 2600)
      return false
    }
    wipeRef.current = true
    setWipeReason(label)
    setPaused(true)
    return true
  }
  function triggerPlayerCrystalFailure(label: string, penalty = WIPE_PENALTY): boolean {
    playerCrystalFailuresRef.current += 1
    return triggerWipe(label, penalty)
  }
  useEffect(() => {
    if (screen !== 'game' || wipeRef.current) return
    const reason = scoreExhaustionWipeReason(difficulty, stats.score)
    if (reason) triggerWipe(reason, 0)
  }, [screen, difficulty, stats.score])
  const fullSequenceComplete = isFullSequenceCompletion(phaseResults)
  const completionPhases = completionPhasePresentation(phaseResults)
  const resultProfile = profiles[assignment]
  const effectivePlayerName = playerNameSource === 'profile' && onlineSession.selectedCharacter
    ? onlineSession.selectedCharacter.name
    : playerNameSource === 'custom'
      ? playerName.trim() || resultProfile.name
      : resultProfile.name
  const playedPositionLabel = `${resultProfile.name} — Spot ${assignment + 1}`
  const gameProfiles = profiles.map((profile, index) => ({ ...profile, name: index === assignment ? effectivePlayerName : profile.name, crystal: activeCrystalAssignments.includes(index) }))
  const resultClass = CLASS_OPTIONS.find(option => option.value === resultProfile.playerClass)?.label ?? resultProfile.playerClass
  const recoveryPasses = phaseResults.filter(result => result.recovery === 'passed').length
  const recoveryChallenges = phaseResults.filter(result => result.recovery).length
  const enabledExtras = [
    recoveryUseCountRef.current ? `${recoveryUseCountRef.current} recovery item${recoveryUseCountRef.current === 1 ? '' : 's'} used` : '',
    mainAbilityUsed ? 'Main ability used' : '',
    tankRolePlayedRef.current ? tankCrystalRolePlayedRef.current ? 'Tank + crystal duty' : 'Tank duty' : '',
    bossPlayerDamageRef.current >= 10 ? `${Math.floor(bossPlayerDamageRef.current / 10) * 10}% boss damage · +${Math.floor(bossPlayerDamageRef.current / 10) * 50} points` : '',
  ].filter(Boolean)
  const extrasSummary = enabledExtras.length
    ? `${enabledExtras.join(' + ')}${recoveryChallenges ? ` · health responses ${recoveryPasses}/${recoveryChallenges}` : ''}`
    : 'Standard movement mechanics'
  const resultCrystalPlayer = p1CrystalAssignments.includes(assignment)
    || intermissionCrystalAssignments.includes(assignment)
    || p2CrystalAssignments.includes(assignment)
    || p3CrystalAssignments.includes(assignment)
  const achievementSummary = {
    difficulty: `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`,
    crystalPlayer: resultCrystalPlayer,
    fullSequence: fullSequenceComplete,
    fullRunAttempt: entryMode === 'arena0' || entryMode === 'arena1',
    mistakes: stats.hits,
    totalScore: stats.score,
    healthPotEnabled: true,
    shieldEnabled: true,
    mainAbilityEnabled: mainAbilityUsed,
    mainAbilityCasts: mainAbilityCastCountRef.current,
    phaseResults,
    wipeCount: wipeCountRef.current,
    pauseCycle: playerPauseCycleRef.current,
    crystalFailures: playerCrystalFailuresRef.current,
    runeFailures: playerRuneFailuresRef.current,
    allPhaseRecovery: fullSequenceComplete && phaseResults.every(result => result.recovery === 'passed'),
    recoveryUses: recoveryUseCountRef.current,
    earlyKill: luraKilledEarly,
    p3EarlyClear: p3DamageClear,
    tankRole: tankRolePlayedRef.current,
    tankCrystalRole: tankCrystalRolePlayedRef.current,
    p4ConeTankRole: p4ConeTankPlayedRef.current,
    p4ProtectionTankRole: p4ProtectionTankPlayedRef.current,
  }
  const collectibleAwards = collectibleAchievements(achievementSummary, achievementCollection, attemptNumber)
  const newCollectibleAwards = newlyEarnedAchievements(collectibleAwards, achievementCollection)
  const achievements = resultAchievements.length ? resultAchievements : newCollectibleAwards
  const collectibleAwardSignature = newCollectibleAwards.map(achievement => achievement.key).join('|')
  const completionProofJson = serializeResultProof(resultProofClaim({
    preview: completionPreview,
    trainerVersion: APP_VERSION,
    buildId: APP_GIT_REVISION,
    playerName: effectivePlayerName,
    playedPosition: playedPositionLabel,
    playerClass: resultClass,
    difficulty,
    duty: resultCrystalPlayer ? 'crystal' : 'non-crystal',
    attempt: attemptNumber,
    fullSequence: fullSequenceComplete,
    totalScore: stats.score,
    totalTime: stats.time,
    mistakes: stats.hits,
    extras: extrasSummary,
    phases: completionPhases,
    achievements,
  }))
  useEffect(() => {
    if (screen !== 'results') {
      setCompletionProof(null)
      return
    }
    let active = true
    void resultProofFromJson(completionProofJson).then(proof => {
      if (active) setCompletionProof(proof)
    })
    return () => { active = false }
  }, [screen, completionProofJson])
  useEffect(() => {
    if (screen !== 'results' || completionPreview) return
    if (newCollectibleAwards.length) {
      setAchievementPopups(newCollectibleAwards)
      setResultAchievements(current => current.length ? current : newCollectibleAwards)
    }
    setLocalAchievementCollection(current => {
      const updated = mergeEarnedAchievements(current, collectibleAwards, new Date().toISOString(), {
        attempt: attemptNumber,
        playerName: effectivePlayerName,
        summary: achievementSummary,
      })
      if (updated !== current) localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, serializeAchievementCollection(updated))
      return updated
    })
  }, [screen, completionPreview, collectibleAwardSignature])
  useEffect(() => {
    if (!achievementPopups.length) return
    const timeout = window.setTimeout(() => setAchievementPopups([]), 5000)
    return () => window.clearTimeout(timeout)
  }, [achievementPopups])
  useEffect(() => {
    if (
      screen !== 'results'
      || completionPreview
      || !onlineAttempt
      || onlineCompletionStartedRef.current === onlineAttempt.attemptId
    ) return
    onlineCompletionStartedRef.current = onlineAttempt.attemptId
    const casts = mainAbilityCastCountRef.current
    const penaltyTotal = mistakes.reduce((total, mistake) => total + Math.max(0, Math.round(mistake.penalty)), 0)
    const scoreBeforeContinuousPenalty = 1000 - penaltyTotal + recoveryPasses * 50 + casts + Math.floor(casts / 20) * 50
    const continuousPenalty = Math.max(0, Math.min(1000, scoreBeforeContinuousPenalty - Math.round(stats.score)))
    setOnlineResultStatus('Submitting verified result…')
    void resultProofFromJson(completionProofJson).then(proof => completeOnlineAttempt(onlineSession.csrfToken, onlineAttempt.attemptId, {
      clientRunId: proof.code,
      nonce: onlineAttempt.nonce,
      configurationFingerprint: onlineAttempt.configurationFingerprint,
      optionalChallenges: onlineAttempt.optionalChallenges,
      durationMs: Math.round(stats.time * 1000),
      phaseResults: phaseResults.map(result => ({
        key: result.key,
        durationMs: Math.round(result.time * 1000),
        mistakes: result.mistakes ?? 0,
        recovery: result.recovery ?? 'missed',
      })),
      mistakes: mistakes.slice().reverse().map(mistake => ({
        code: mistake.label.slice(0, 80),
        timeMs: Math.round(mistake.time * 1000),
        penalty: Math.max(0, Math.round(mistake.penalty)),
      })),
      actions: {
        recoveryPasses,
        mainAbilityCasts: casts,
        continuousPenalty,
      },
      achievementInputs: {
        wipeCount: wipeCountRef.current,
        crystalFailures: playerCrystalFailuresRef.current,
        runeFailures: playerRuneFailuresRef.current,
        pauseCycle: playerPauseCycleRef.current,
        earlyKill: luraKilledEarly,
        p3EarlyClear: p3DamageClear,
        tankRole: tankRolePlayedRef.current,
        tankCrystalRole: tankCrystalRolePlayedRef.current,
        p4ConeTankRole: p4ConeTankPlayedRef.current,
        p4ProtectionTankRole: p4ProtectionTankPlayedRef.current,
      },
      submittedScore: Math.round(stats.score),
      trainerVersion: APP_VERSION,
      buildId: onlineAttempt.buildId,
    })).then(result => {
      setOnlineResultStatus(`Verified online result posted · ${result.score} points · ${result.clientRunId}`)
      setOnlineAttempt(null)
      setAchievementSyncRevision(current => current + 1)
    }).catch(() => {
      setOnlineResultStatus('Online verification rejected this result. The local result is unchanged.')
    })
  }, [screen, completionPreview, onlineAttempt?.attemptId, completionProofJson])
  const primaryAchievement = achievements.find(achievement => achievement.id === 'superhuman-both-duties')
    ?? achievements.find(achievement => achievement.id === 'hard-score-flawless')
    ?? achievements.find(achievement => achievement.id === 'not-a-scratch')
    ?? achievements[0]
  async function copyCompletion() {
    const proof = completionProof ?? await resultProofFromJson(completionProofJson)
    const text = `${completionPreview ? 'PREVIEW DATA — NOT A COMPLETED RUN\n' : ''}${completionShareText({
      playerName: effectivePlayerName,
      playedPosition: playedPositionLabel,
      playerClass: resultClass,
      difficulty: `${difficulty[0].toUpperCase()}${difficulty.slice(1)}`,
      totalScore: stats.score,
      totalTime: stats.time,
      mistakes: stats.hits,
      attempt: attemptNumber,
      extras: extrasSummary,
      fullSequence: fullSequenceComplete,
      results: phaseResults,
      achievements,
    })}\nRun-ID: ${proof.code}\nProof JSON: ${proof.json}\n${window.location.origin}${window.location.pathname}`
    try {
      await navigator.clipboard.writeText(text)
      setCompletionCopyStatus('Completion copied — ready for Discord')
    } catch {
      setCompletionCopyStatus('Clipboard access was blocked')
    }
  }
  async function copyCompletionProof() {
    const proof = completionProof ?? await resultProofFromJson(completionProofJson)
    try {
      await navigator.clipboard.writeText(serializeResultProofBundle(proof))
      setCompletionCopyStatus('Run proof JSON copied')
    } catch {
      setCompletionCopyStatus('Clipboard access was blocked')
    }
  }
  async function shareCompletionImage() {
    const proof = completionProof ?? await resultProofFromJson(completionProofJson)
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 760
    const context = canvas.getContext('2d')
    if (!context) { setCompletionCopyStatus('Image export is unavailable in this browser'); return }
    const gradient = context.createLinearGradient(0, 0, 1200, 760)
    gradient.addColorStop(0, fullSequenceComplete ? '#202238' : '#15243a')
    gradient.addColorStop(1, '#080b16')
    context.fillStyle = gradient
    context.fillRect(0, 0, 1200, 760)
    context.strokeStyle = fullSequenceComplete ? '#ffd978' : '#73e0c1'
    context.lineWidth = 3
    context.strokeRect(28, 28, 1144, 704)
    context.fillStyle = fullSequenceComplete ? '#ffd978' : '#73e0c1'
    context.font = '600 24px sans-serif'
    context.fillText(completionPreview ? 'RESULT SCREEN PREVIEW · NOT A COMPLETED RUN' : fullSequenceComplete ? `FULL RUN COMPLETE${achievements.length ? ' · ACHIEVEMENT UNLOCKED' : ''}` : 'L’URA PRACTICE COMPLETE', 70, 92)
    context.fillStyle = '#f7f5ee'
    const imageTitle = primaryAchievement?.label ?? completionResultTitle(fullSequenceComplete, stats.hits)
    context.font = '800 64px sans-serif'
    const imageTitleWidth = context.measureText(imageTitle).width
    if (imageTitleWidth > 1060) context.font = `800 ${Math.floor(64 * 1060 / imageTitleWidth)}px sans-serif`
    context.fillText(imageTitle, 70, 165)
    context.fillStyle = '#f7f5ee'
    context.font = '700 34px sans-serif'
    context.fillText(effectivePlayerName, 72, 211)
    context.fillStyle = '#aeb8d0'
    context.font = '500 19px sans-serif'
    context.fillText(`Played position: ${playedPositionLabel} · ${resultClass} · ${difficulty.toUpperCase()} · ATTEMPT #${attemptNumber}`, 72, 243)
    context.fillStyle = '#f7f5ee'
    context.font = '700 38px sans-serif'
    context.fillText(`${Math.round(stats.score)} POINTS`, 72, 286)
    context.fillText(`${stats.time.toFixed(1)}s`, 340, 286)
    context.fillText(`${stats.hits} MISTAKE${stats.hits === 1 ? '' : 'S'}`, 530, 286)
    const cards = completionImageCardLayout(phaseResults.length)
    completionPhases.forEach((result, index) => {
      const { x, width: cardWidth } = cards[index]
      context.fillStyle = 'rgba(7, 11, 22, .7)'
      context.fillRect(x, 330, cardWidth, 150)
      context.strokeStyle = '#33415f'
      context.lineWidth = 1
      context.strokeRect(x, 330, cardWidth, 150)
      context.fillStyle = '#f7f5ee'
      context.font = '700 24px sans-serif'
      context.fillText(result.label, x + 18, 370)
      context.fillStyle = '#73e0c1'
      context.font = '700 29px sans-serif'
      context.fillText(`${result.cumulativePoints} pts`, x + 18, 414)
      context.fillStyle = '#9ba8c2'
      context.font = '500 15px sans-serif'
      context.fillText(`Phase contribution ${signedPhaseContribution(result.contribution)}`, x + 18, 444)
      context.fillText(`${result.time.toFixed(1)}s${result.recovery ? ` · Recovery ${result.recovery === 'passed' ? '+50' : '−50'}` : ''}`, x + 18, 466)
    })
    context.fillStyle = '#c7cfdf'
    context.font = '500 21px sans-serif'
    const achievementLines = wrapTextByWidth(
      `NEW ACHIEVEMENTS · ${achievements.map(achievement => achievement.label).join(' · ') || 'None this run'}`,
      1056,
      value => context.measureText(value).width,
    )
    achievementLines.forEach((line, index) => context.fillText(line, 72, 525 + index * 27))
    const extrasStart = 525 + achievementLines.length * 27 + 6
    const extrasLines = wrapTextByWidth(
      `OPTIONAL CHALLENGES · ${extrasSummary}`,
      1056,
      value => context.measureText(value).width,
    )
    extrasLines.forEach((line, index) => context.fillText(line, 72, extrasStart + index * 27))
    context.fillStyle = '#73819e'
    context.font = '500 16px monospace'
    context.fillText(`Run-ID: ${proof.code}`, 72, 676)
    context.font = '500 18px sans-serif'
    context.fillText(`${window.location.host}${window.location.pathname} · Client checksum`, 72, 706)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) { setCompletionCopyStatus('Could not create the result image'); return }
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCompletionCopyStatus('Result image copied — paste it into Discord')
        return
      }
    } catch { /* fall back to a download */ }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `lura-${fullSequenceComplete ? 'movement-master' : 'practice'}-attempt-${attemptNumber}.png`
    link.click()
    URL.revokeObjectURL(link.href)
    setCompletionCopyStatus('Result image downloaded')
  }
  const intermissionProfiles = profiles.map((profile, index) => ({ ...profile, crystal: intermissionCrystalAssignments.includes(index) }))
  const p2Profiles = profiles.map((profile, index) => ({ ...profile, crystal: p2CrystalAssignments.includes(index) }))
  const p3Profiles = profiles.map((profile, index) => ({ ...profile, crystal: p3CrystalAssignments.includes(index) }))
  function openPersonalAchievements() {
    setSetupTab('profile')
    window.requestAnimationFrame(() => document.getElementById('personal-achievements')?.scrollIntoView({ block: 'start' }))
  }

  if (screen === 'menu') return <main className="shell setup-shell" id="setup-top">
    <LiveActivityToast row={activityNotificationQueue[0]} />
    {activityProfileId && <PublicProfileOverlay profileId={activityProfileId} onClose={() => setActivityProfileId(null)} />}
    <BuildIndicator />
    <aside className="recruitment-banner">We are looking for German-speaking players for Season 2: <a href="https://raider.io/guilds/eu/blackrock/IAsgardI" target="_blank" rel="noreferrer">I Asgard I on Raider.IO</a></aside>
    <CreatorCard />
    <header><p className="eyebrow">MIDNIGHT FALLS · MOVEMENT PRACTICE</p><h1>L’ura Trainer</h1><p className="lede">Choose your assigned player below. Its WoW class determines its body color; crystal duty is configured independently beneath each phase plan.</p></header>
    {activityFeed.length > 0 && <section className="wipe-feed" aria-label="Recent public activity">
      <header><div><p className="eyebrow">LIVE ACTIVITY</p><h2>Recent activity</h2></div><span>Refreshes every 5s</span></header>
      <ol>{activityFeed.map(row => <li key={row.id} className={activityFeedRowClass(row.id, newActivityFeedIds)}>
        <time dateTime={row.occurredAt}>{new Date(row.occurredAt).toLocaleString()}</time>
        {row.profileId
          ? <button type="button" className="profile-name-button" onClick={() => setActivityProfileId(row.profileId!)}>{row.character && row.realm ? `${row.character}—${row.realm}` : row.displayName}</button>
          : <strong>{row.displayName}</strong>}
        <span>{row.type === 'achievement'
          ? <>earned achievement: <strong>{row.achievementTitle}</strong></>
          : row.type === 'completion'
            ? <>completed full run: {row.difficulty} · {row.duty} · <strong>{row.score} points · {((row.durationMs ?? 0) / 1000).toFixed(1)}s</strong></>
            : <>wiped on: {row.phase} · {row.difficulty} · <strong>{row.reason}</strong></>}</span>
      </li>)}</ol>
    </section>}
    <div className="entry-choice"><span>Practice target</span>{FEATURE_FLAGS.phaseOne ? <button className={entryMode === 'arena0' ? 'selected' : ''} onClick={() => setEntryMode('arena0')}>P1</button> : <button className="coming-soon" aria-label="P1 — Coming soon" title="P1 is planned but not playable yet" disabled>P1 · Soon</button>}<button className={entryMode === 'arena1' ? 'selected' : ''} onClick={() => setEntryMode('arena1')}>Intermission</button><button className={entryMode === 'arena2' ? 'selected' : ''} onClick={() => setEntryMode('arena2')}>P2</button><button className={entryMode === 'arena3' ? 'selected' : ''} onClick={() => setEntryMode('arena3')}>P3</button><button className={entryMode === 'arena4' ? 'selected' : ''} onClick={() => setEntryMode('arena4')}>P4</button>{difficulty === 'test' && <button className="secondary preview-results" onClick={previewCompletionScreen}>Preview final screen</button>}<button aria-label={entryMode === 'arena0' ? 'Enter P1' : entryMode === 'arena1' ? 'Enter Arena 1 — Enter Intermission' : entryMode === 'arena2' ? 'Enter Arena 2 — Enter P2' : entryMode === 'arena3' ? 'Enter Arena 3 — Enter P3' : 'Enter Arena 4 — Enter P4'} className="start entry-start" onClick={start}>Enter {entryMode === 'arena0' ? 'P1' : entryMode === 'arena1' ? 'Intermission' : entryMode === 'arena2' ? 'P2' : entryMode === 'arena3' ? 'P3' : 'P4'}</button></div>
    <p className="current-run-summary" aria-label="Current practice configuration"><strong>Current:</strong> {difficulty[0].toUpperCase() + difficulty.slice(1)} · {entryCrystalAssignments.includes(assignment) ? 'Crystal carrier' : 'Non-crystal'} · {profiles[assignment].name || `Player ${assignment + 1}`} · Spot {assignment + 1}</p>
    <GlobalRankingSummary />
    <div className="setup-overview"><AchievementBadgeSummary collection={achievementCollection} onOpen={openPersonalAchievements} /><BestRunsSummary session={onlineSession} onOpen={() => setSetupTab('leaderboard')} /><OnlineStandingSummary session={onlineSession} onManage={() => setSetupTab('profile')} onLogout={onlineSession.csrfToken ? () => { void logoutOnline(onlineSession.csrfToken!).then(() => setOnlineSession({ authenticated: false })) } : undefined} /></div>
    <nav className="setup-tabs" aria-label="Setup sections">
      <button className={setupTab === 'game' ? 'selected' : ''} aria-current={setupTab === 'game' ? 'page' : undefined} onClick={() => setSetupTab('game')}>Game settings</button>
      <button className={setupTab === 'keyboard' ? 'selected' : ''} aria-current={setupTab === 'keyboard' ? 'page' : undefined} onClick={() => setSetupTab('keyboard')}>Keys &amp; Mouse</button>
      <button className={setupTab === 'hud' ? 'selected' : ''} aria-current={setupTab === 'hud' ? 'page' : undefined} onClick={() => setSetupTab('hud')}>HUD</button>
      <button className={setupTab === 'raidplan' ? 'selected' : ''} aria-current={setupTab === 'raidplan' ? 'page' : undefined} onClick={() => setSetupTab('raidplan')}>Raid plan</button>
      <button className={setupTab === 'leaderboard' ? 'selected' : ''} aria-current={setupTab === 'leaderboard' ? 'page' : undefined} onClick={() => setSetupTab('leaderboard')}>Leaderboard</button>
      <button className={setupTab === 'profile' ? 'selected' : ''} aria-current={setupTab === 'profile' ? 'page' : undefined} onClick={() => setSetupTab('profile')}>Profile</button>
    </nav>
    <section className="setup-tab-panel" aria-label="Game settings" hidden={setupTab !== 'game'}>
    <div className="plan-heading setup-section-heading" id="game-settings"><p className="eyebrow">GAME SETTINGS</p><h2>Practice configuration</h2><p className="hint">Choose the difficulty, controlled raid position, movement tuning, and optional combat challenges.</p><a className="setup-back-to-top" href="#setup-top" aria-label="Back to top from Game settings" onClick={event => scrollToSetupSection(event, 'setup-top')}>↑ Top</a></div>
    <section className="menu-grid setup-grid">
      <fieldset><legend>Difficulty & movement</legend><div className="difficulty-row">{(['test', 'easy', 'normal', 'hard'] as Difficulty[]).map(value => <button key={value} className={difficulty === value ? 'selected compact' : 'compact'} onClick={() => setDifficulty(value)}>{value}</button>)}</div><label className="speed-control">Movement speed <strong>{movementSpeed}</strong><input aria-label="Movement speed" type="range" min="8" max="35" step="1" value={movementSpeed} onChange={e => setMovementSpeed(Number(e.target.value))} /></label><label className="speed-control">Global timing <strong>{gameSpeed.toFixed(2)}×</strong><input aria-label="Global game speed" type="range" min="1" max="2.5" step=".25" value={gameSpeed} onChange={e => setGameSpeed(Number(e.target.value))} /></label><p className="hint">The 40% opening movement boost is always active for the first 5s of the positioning timer. {difficultySettings(difficulty).helper ? 'Full assignment guides enabled.' : difficulty === 'normal' ? 'Target ring appears within 45 yards; no guide arrow.' : 'Target ring appears within 22 yards; no guide arrow.'} {difficulty === 'test' ? 'Mechanics and penalties are recorded, but wipes never stop the run.' : difficulty === 'hard' ? 'A wipe ends the attempt immediately.' : 'The first wipe costs 500 points and the current sequence continues; the second ends it.'}</p></fieldset>
      <fieldset><legend>Character to play</legend><label className="profile-control">Raid character<select aria-label="Character to play" value={assignment} onChange={event => setAssignment(Number(event.target.value))}>{profiles.map((profile, index) => <option key={index} value={index}>{profile.name || `Player ${index + 1}`} — Spot {index + 1}</option>)}</select></label><p className="assignment">Spot {assignment + 1}<span>This selects the character and raid-plan position controlled in practice.</span></p><div className="practice-identity-status"><span>{onlineSession.authenticated ? `Signed in${onlineSession.selectedCharacter ? ` as ${onlineSession.selectedCharacter.name}—${onlineSession.selectedCharacter.realmSlug}` : ''}` : 'Online profile not connected'}</span><button type="button" onClick={() => setSetupTab('profile')}>{onlineSession.authenticated ? 'Open profile' : 'Login or manage profile'}</button></div><label className="profile-control">Name used in practice<select aria-label="Name used in practice" value={playerNameSource} onChange={event => setPlayerNameSource(event.target.value as typeof playerNameSource)}><option value="raid">Raid-plan name — {profiles[assignment].name}</option>{onlineSession.authenticated && onlineSession.selectedCharacter && <option value="profile">Battle.net character — {onlineSession.selectedCharacter.name}</option>}<option value="custom">Custom name</option></select></label>{playerNameSource === 'custom' && <label className="profile-control">Custom practice name<input aria-label="Custom practice name" maxLength={18} value={playerName} onChange={event => setPlayerName(event.target.value)} placeholder={profiles[assignment].name} /></label>}<label className="profile-control">Raid position name<input aria-label="Raid position name" maxLength={18} value={profiles[assignment].name} onChange={event => updateProfile({ name: event.target.value })} /></label><label className="profile-control">WoW class / color<select aria-label="Player class and color" value={profiles[assignment].playerClass} onChange={event => updateProfile({ playerClass: event.target.value as PlayerClass })}>{CLASS_OPTIONS.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label></fieldset>
      <fieldset><legend>Combat actions</legend><p className="hint">Health remains under steady combat pressure and only occasionally drops into a critical recovery window. Potion and shield each restore full health once per phase and refill at every transition. A successful low-health recovery earns +50 points; Hard requires one in every phase.</p><p className="always-available-action"><strong>Health potion · {keyLabel(keyBindings.healthPot)}</strong><span>Always available · one charge per phase · instant full heal.</span></p><p className="always-available-action"><strong>Shield · {keyLabel(keyBindings.shield)}</strong><span>Always available · one charge per phase · instant full heal.</span></p><p className="always-available-action"><strong>Main ability · {keyLabel(keyBindings.mainAbility)}</strong><span>Always available · one-second cast · +1 point when the cast completes.</span></p><label className="checkbox-control"><input aria-label="Show combat projectiles" type="checkbox" checked={combatProjectilesEnabled} onChange={event => setCombatProjectilesEnabled(event.target.checked)} /><span>Combat projectiles<span>Cosmetic, class-colored player and NPC attacks. No encounter mechanics are changed.</span></span></label></fieldset>
    </section>
    <div className="plan-heading audio-settings-heading"><p className="eyebrow">AUDIO</p><h2>Music &amp; encounter assistance</h2><p className="hint">Music is opt-in. Encounter effects and raid-lead speech remain separate so each channel can be enabled independently.</p></div>
    <section className="audio-settings-grid">
      {FEATURE_FLAGS.backgroundMusic && <fieldset aria-label="Music settings"><legend>Music</legend><label className="checkbox-control"><input aria-label="Enable background music" type="checkbox" checked={!musicMuted} onChange={event => { setMusicMuted(!event.target.checked); if (!event.target.checked) setMusicPreviewing(false) }} /><span>Enable music<span>Off by default · loops through the complete attempt.</span></span></label><label className="profile-control">Track<select aria-label="Background music track" value={musicTrack} onChange={event => setMusicTrack(event.target.value as MusicTrackId)}>{MUSIC_TRACKS.map(track => <option value={track.id} key={track.id}>{track.label}</option>)}</select></label><button type="button" className="music-preview" disabled={musicMuted} onClick={toggleMusicPreview}>{musicMuted ? 'Enable music to preview' : musicPreviewing ? '■ Stop preview' : '▶ Play preview'}</button><label className="speed-control">Volume <strong>{Math.round(musicVolume * 100)}%</strong><input aria-label="Background music volume" type="range" min="0" max="1" step=".05" value={musicVolume} onChange={event => setMusicVolume(Number(event.target.value))} /></label></fieldset>}
      <fieldset aria-label="Encounter sound settings"><legend>Sounds</legend><label className="checkbox-control"><input aria-label="Enable encounter sounds" type="checkbox" checked={encounterSoundsEnabled} disabled={!FEATURE_FLAGS.encounterSounds} onChange={event => setEncounterSoundsEnabled(event.target.checked)} /><span>Encounter sound effects<span>Main ability release only · off by default.</span></span></label>{FEATURE_FLAGS.encounterSounds && <label className="speed-control">Volume <strong>{Math.round(encounterSoundVolume * 100)}%</strong><input aria-label="Encounter sound volume" type="range" min="0" max="1" step=".05" value={encounterSoundVolume} onChange={event => setEncounterSoundVolume(Number(event.target.value))} /></label>}<p className="hint">Only the Main ability release sound is active; mechanic and failure effects remain deferred in the soundboard.</p><a className="audio-cue-link" href={AUDIO_CUES_URL} target="_blank" rel="noreferrer">View sound cue review ↗</a></fieldset>
      <fieldset aria-label="TTS settings"><legend>TTS</legend><label className="checkbox-control"><input aria-label="Enable raid lead TTS" type="checkbox" checked={ttsEnabled} disabled={!raidleadAvailable} onChange={event => setTtsEnabled(event.target.checked)} /><span>Raid-lead voice cues<span>{raidleadAvailable ? 'Off by default · browser speech with preloaded, clocked P4 calls.' : 'Raid-lead audio is unavailable in this browser.'}</span></span></label><label className="profile-control">Raidlead voice<select aria-label="Raidlead voice" value={selectedTtsVoice?.voiceURI || (!ttsVoiceId ? automaticTtsVoice?.voiceURI : '') || ''} disabled={!ttsAvailable} onChange={event => setTtsVoiceId(event.target.value)}><option value="">Automatic · English system default</option>{ttsVoices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}{voice.default ? ' · Default' : ''}</option>)}</select></label><button type="button" className="music-preview" disabled={!ttsAvailable} onClick={() => { window.speechSynthesis.cancel(); window.speechSynthesis.speak(createTtsUtterance('Raid lead ready', 1, activeTtsVoice)) }}>▶ Preview voice</button><p className="hint">Only installed English voices are listed. Google US English is selected automatically when available; otherwise the browser chooses its English default. P4 directions use pre-rendered clips for exact rhythm. Intermission Dodge and Drop Crystal coaching is Easy-only; P2 Drop Crystal coaching is disabled on Hard.</p><a className="audio-cue-link" href={AUDIO_CUES_URL} target="_blank" rel="noreferrer">Review active calls ↗</a></fieldset>
    </section>
    </section>
    <section className="setup-tab-panel" aria-label="Keyboard settings" hidden={setupTab !== 'keyboard'}>
    <div className="plan-heading setup-section-heading" id="keyboard-settings"><p className="eyebrow">KEYBOARD SETTINGS</p><h2>Keyboard &amp; mouse controls</h2><p className="hint">Configure movement and action bindings, keyboard turning, and mouse-camera behavior.</p><a className="setup-back-to-top" href="#setup-top" aria-label="Back to top from Keyboard settings" onClick={event => scrollToSetupSection(event, 'setup-top')}>↑ Top</a></div>
    <section className="practice-settings">
      <fieldset className="input-settings"><legend>Input bindings</legend><div className="input-settings-layout"><section className="keyboard-settings"><header><h3>Keyboard</h3><p>Click a binding, then press its new key. Reusing a key leaves the previous action unbound.</p></header><label className="speed-control rotation-speed-control">Rotation speed <strong>{rotationSpeed}°/s</strong><input aria-label="Keyboard rotation speed" type="range" min="45" max="270" step="15" value={rotationSpeed} onChange={event => setRotationSpeed(Number(event.target.value))} /></label><div className="keybind-grid">{KEY_BIND_LABELS.filter(binding => FEATURE_FLAGS.tankRoles || binding.action !== 'taunt').map(binding => { const value = keyBindings[binding.action]; return <label className="keybind-control" key={binding.action}><span>{binding.label}</span><input aria-label={`${binding.label} keybind`} aria-invalid={!value} className={!value ? 'missing-keybind' : ''} placeholder="Unbound" readOnly value={value ? keyLabel(value) : ''} onKeyDown={event => { event.preventDefault(); event.stopPropagation(); setKeyBindings(current => assignUniqueKey(current, binding.action, event.code)) }} /></label> })}</div><button className="reset-keys" onClick={() => setKeyBindings({ ...DEFAULT_KEY_BINDINGS })}>Reset keybindings</button></section><section className="mouse-settings"><header><h3>Mouse camera</h3><p>Left-drag looks around. Right-drag changes the view and player facing. The wheel controls zoom.</p></header><div className="camera-invert-controls"><label className="checkbox-control"><input aria-label="Invert camera horizontal" type="checkbox" checked={invertCameraX} onChange={event => setInvertCameraX(event.target.checked)} /><span>Invert camera X<span>Reverse left/right mouse look.</span></span></label><label className="checkbox-control"><input aria-label="Invert camera vertical" type="checkbox" checked={invertCameraY} onChange={event => setInvertCameraY(event.target.checked)} /><span>Invert camera Y<span>Reverse up/down mouse look.</span></span></label></div></section></div></fieldset>
    </section>
    </section>
    <section className="setup-tab-panel" aria-label="HUD settings" hidden={setupTab !== 'hud'}>
    <div className="plan-heading" id="hud-settings"><p className="eyebrow">INTERFACE</p><h2>HUD positions</h2><p className="hint">Drag the mechanic counters, castbar, and player/boss health bars around the Phase 2 preview. Their positions are saved automatically.</p><a className="setup-back-to-top" href="#setup-top" aria-label="Back to top from HUD settings" onClick={event => scrollToSetupSection(event, 'setup-top')}>↑ Top</a></div>
    <fieldset className="hud-display-settings"><legend>Phase 1 HUD</legend><label className="checkbox-control"><input aria-label="Show HUD action buttons" type="checkbox" checked={hudActionButtonsEnabled} onChange={event => setHudActionButtonsEnabled(event.target.checked)} /><span>Action buttons<span>Off by default · shows the existing keyboard actions below the cast bar.</span></span></label><label className="checkbox-control"><input aria-label="Show live activity notifications" type="checkbox" checked={liveActivityNotificationsEnabled} onChange={event => setLiveActivityNotificationsEnabled(event.target.checked)} /><span>Live activity messages<span>On by default · briefly shows new public activity in the bottom-right corner.</span></span></label><label className="profile-control">P1 rune panel orientation<select aria-label="P1 rune panel orientation" value={p1RunePanelOrientation} onChange={event => setP1RunePanelOrientation(event.target.value as P1RunePanelOrientation)}><option value="pentagram">Raid pentagram · 5/1 top</option><option value="positional">Positional · 3 top</option></select></label><p className="hint">Choose how the five-rune memory reference is arranged in the lower HUD.</p></fieldset>
    <HudLayoutEditor layout={hudLayout} onChange={(counter, point) => setHudLayout(current => ({ ...current, [counter]: point }))} onReset={() => setHudLayout(structuredClone(DEFAULT_HUD_LAYOUT))} />
    </section>
    <section className="setup-tab-panel" aria-label="Raid plan" hidden={setupTab !== 'raidplan'}>
    <div className="plan-heading raid-planning-heading" id="raid-planning"><p className="eyebrow">RAID PLANNING</p><h2>Layouts and sharing</h2><p className="hint">Load a guild layout, exchange a complete plan, or configure each phase below.</p><a className="setup-back-to-top" href="#setup-top" aria-label="Back to top from Raid planning" onClick={event => scrollToSetupSection(event, 'setup-top')}>↑ Top</a></div>
    <fieldset className="raid-share-settings" aria-label="Raid-plan sharing"><legend>Raid-plan sharing</legend><p className="assignment">Save, load, or share the complete plan<span>Names, classes, crystal roles, all phase positions, and start slots are included.</span></p><div className="editor-actions"><button className={layoutSaveConfirmed ? 'save-confirmed' : ''} onClick={savePositions}>{layoutSaveConfirmed ? '✓ Layout saved' : 'Save layout'}</button><button onClick={resetPositions}>Reset</button></div><button className="asgard-plan-link" type="button" onClick={loadAsgardRaidPlan}>Load I Asgard I raid plan<span>Bundled guild layout · loads here and saves to this browser</span></button><label className="profile-control">Share link or code<input aria-label="Raid plan share code" value={shareInput} onChange={event => setShareInput(event.target.value)} placeholder="Paste a shared plan here" /></label><div className="editor-actions"><button onClick={copyRaidPlan}>Copy share link</button><button onClick={applyRaidPlan}>Load shared plan</button></div>{shareStatus && <p className="share-status" role="status">{shareStatus}</p>}</fieldset>
    {FEATURE_FLAGS.tankRoles && <TankAssignmentEditor assignments={tankAssignments} profiles={profiles} onChange={(slot, playerIndex) => setTankAssignments(current => updateTankAssignment(current, slot, playerIndex))} />}
    {FEATURE_FLAGS.phaseOne && <><div className="plan-heading"><p className="eyebrow">PHASE 1 RAID PLAN</p><h2>Interrupt and crystal positions</h2><p className="hint">P1 uses the wider outer arena. Player assignments must remain between the central void and outer wall; L’ura’s opening position remains freely assignable.</p></div><P2PositionMap phaseOne bossPosition={p1BossOpening} onBossChange={setP1BossOpening} mapLabel="Phase 1 position map" buttonLabel="P1" assignment={assignment} positions={p1Positions} profiles={profiles.map((profile, index) => ({ ...profile, crystal: p1CrystalAssignments.includes(index) }))} onChange={(index, point) => { setAssignment(index); setP1Positions(current => normalizeP1Assignments(current.map((position, positionIndex) => positionIndex === index ? point : position))) }} /><CrystalAssignmentEditor phaseLabel="Phase 1" assignments={p1CrystalAssignments} profiles={profiles} onChange={(slot, playerIndex) => setP1CrystalAssignments(current => updateCrystalAssignmentSlot(current, slot, playerIndex))} /></>}
    <div className="plan-heading"><p className="eyebrow">INTERMISSION RAID PLAN</p><h2>Opening positions</h2><p className="hint">Drag all 20 players into the playable ring and place the four start-slot orientation anchors.</p></div>
    <PositionMap assignment={assignment} positions={positions} startSlots={startSlots} profiles={intermissionProfiles} onPositionChange={(index, point) => { setAssignment(index); setPositions(current => current.map((position, positionIndex) => positionIndex === index ? point : position)) }} onStartSlotChange={(index, point) => setStartSlots(current => current.map((slot, slotIndex) => slotIndex === index ? clampStartSlot(point) : slot))} />
    <CrystalAssignmentEditor phaseLabel="Intermission" assignments={intermissionCrystalAssignments} profiles={profiles} onChange={(slot, playerIndex) => setIntermissionCrystalAssignments(current => updateCrystalAssignmentSlot(current, slot, playerIndex))} />
    <div className="plan-heading"><p className="eyebrow">PHASE 2 ASSIGNMENT</p><h2>Cross positioning</h2><p className="hint">Drag the same 20 players onto their Phase 2 positions across the fixed marker axes.</p></div>
    <P2PositionMap mapLabel="Phase 2 soak position map" buttonLabel="P2 soak" assignment={assignment} positions={p2Positions} profiles={p2Profiles} onChange={(index, point) => { setAssignment(index); setP2Positions(current => current.map((position, positionIndex) => positionIndex === index ? clampToP2Arena(point) : position)) }} />
    <CrystalAssignmentEditor phaseLabel="Phase 2" assignments={p2CrystalAssignments} profiles={profiles} onChange={(slot, playerIndex) => setP2CrystalAssignments(current => updateCrystalAssignmentSlot(current, slot, playerIndex))} />
    <div className="plan-heading"><p className="eyebrow">PHASE 2 PERSONAL CIRCLES</p><h2>Spread positioning</h2><p className="hint">After the center pull, each player moves to this second P2 assignment before their personal circle resolves. The blue rings use the same 12.16-yard outer radius as the in-game simulation.</p></div>
    <P2PositionMap showPersonalCircles mapLabel="Phase 2 spread position map" buttonLabel="P2 spread" assignment={assignment} positions={p2SpreadPositions} profiles={p2Profiles} onChange={(index, point) => { setAssignment(index); setP2SpreadPositions(current => current.map((position, positionIndex) => positionIndex === index ? clampToP2Arena(point) : position)) }} />
    <div className="plan-heading"><p className="eyebrow">PHASE 3 ASSIGNMENT</p><h2>Initial sector positioning</h2><p className="hint">The enlarged planner keeps your saved world coordinates unchanged. Drag each half-raid freely within its room half, including the planner’s inner area, to compensate for perspective and translation. The actual in-game center dome remains lethal. In sector two, these positions rotate toward the south.</p></div>
    <P3PositionMap assignment={assignment} positions={p3Positions} bossPositions={p3BossPositions} profiles={p3Profiles} onChange={(index, point) => { setAssignment(index); setP3Positions(current => current.map((position, positionIndex) => positionIndex === index ? clampToP3Arena(point) : position)) }} onBossChange={(index, point) => setP3BossPositions(current => current.map((position, positionIndex) => positionIndex === index ? point : position))} />
    <CrystalAssignmentEditor phaseLabel="Phase 3" assignments={p3CrystalAssignments} profiles={profiles} onChange={(slot, playerIndex) => setP3CrystalAssignments(current => updateCrystalAssignmentSlot(current, slot, playerIndex))} />
    <p className="scope-note">{entryMode === 'arena0' ? 'Start at Phase 1, then continue through the complete encounter.' : entryMode === 'arena4' ? 'Start at the Phase 4 north regroup.' : entryMode === 'arena3' ? 'Start with the Phase 3 outward flight.' : entryMode === 'arena2' ? 'Start stacked in Phase 2, then transition into Phase 3.' : 'Positioning opener → Intermission → Phase 2 → Phase 3 → Phase 4.'} · {keyLabel(keyBindings.forward)}/{keyLabel(keyBindings.left)}/{keyLabel(keyBindings.backward)}/{keyLabel(keyBindings.right)} move · {keyLabel(keyBindings.pause)} pause</p>
    </section>
    <section className="setup-tab-panel" aria-label="Leaderboard" hidden={setupTab !== 'leaderboard'}>
    {setupTab === 'leaderboard' && <OnlinePanel view="leaderboard" difficulty="hard" duty="crystal" onSession={setOnlineSession} />}
    </section>
    <section className="setup-tab-panel" aria-label="Profile" hidden={setupTab !== 'profile'}>
    {setupTab === 'profile' && <OnlinePanel view="profile" onSession={setOnlineSession} />}
    <div id="personal-achievements"><AchievementCollection collection={achievementCollection} /></div>
    </section>
  </main>
  if (screen === 'results') return <main className="shell results">
    <LiveActivityToast row={activityNotificationQueue[0]} />
    <BuildIndicator />
    <AchievementUnlockPopups achievements={achievementPopups} />
    <section className={`completion-card ${fullSequenceComplete ? 'achievement-unlocked' : ''} ${completionPreview ? 'result-preview' : ''}`}>
      <div className="completion-glow" aria-hidden="true">✦</div>
      <p className="eyebrow">{completionPreview ? 'RESULT SCREEN PREVIEW' : fullSequenceComplete ? `FULL RUN COMPLETE${achievements.length ? ' · ACHIEVEMENT UNLOCKED' : ''}` : 'PRACTICE COMPLETE'}</p>
      <h1>{fullSequenceComplete ? 'L’ura conquered!' : 'Phase clear!'}</h1>
      <h2 className="completion-player-name">{effectivePlayerName}</h2>
      <p className="completion-played-position">Played position: {playedPositionLabel}</p>
      <p className="lede">{fullSequenceComplete ? `${phaseResults.map(result => result.label).join(', ')} cleared in one continuous run.` : `${phaseResults.map(result => result.label).join(' → ')} completed. Clear every available phase in one run to unlock the full achievement.`}</p>
      {completionPreview && <p className="completion-preview-note">Preview data only — this is not stored or presented as a completed attempt.</p>}
      <div className="achievement-badge">
        <span aria-hidden="true">{fullSequenceComplete ? '🏆' : '✦'}</span>
        <div><strong>{primaryAchievement?.label ?? completionResultTitle(fullSequenceComplete, stats.hits)}</strong><small>{primaryAchievement?.detail ?? (completionPreview ? `${resultClass} · ${difficulty}` : 'No new achievements this run')}</small></div>
      </div>
      {achievements.length > 1 && <div className="achievement-list" aria-label="Achievements">{achievements.map(achievement => <span key={achievement.id}><strong>{achievement.label}</strong><small>{achievement.detail}</small></span>)}</div>}
      <div className="completion-summary">
        <div><strong>{Math.round(stats.score)}</strong><span>Total points</span></div>
        <div><strong>{stats.time.toFixed(1)}s</strong><span>Time in arena</span></div>
        <div><strong>{stats.hits}</strong><span>Mistakes · Attempt #{attemptNumber}</span></div>
      </div>
      <div className="phase-results" aria-label="Phase results">
        {completionPhases.map((result, index) => <article key={result.key}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <h2>{result.label}</h2>
          <strong>{result.cumulativePoints} pts</strong>
          <small>Phase contribution {signedPhaseContribution(result.contribution)}</small>
          <small>{result.time.toFixed(1)}s{result.recovery ? ` · Recovery ${result.recovery === 'passed' ? '+50' : '−50'}` : ''}</small>
        </article>)}
      </div>
      <p className="completion-extras"><strong>Optional challenges</strong>{extrasSummary}</p>
      <p className="completion-run-id" title="Browser-generated checksum of the displayed result values. It helps detect ordinary screenshot edits but is not a server signature.">
        Run-ID: <code>{completionProof?.code ?? 'Generating…'}</code>
        <button type="button" onClick={copyCompletionProof} disabled={!completionProof}>Copy proof</button>
      </p>
      {onlineResultStatus && <p className="online-result-status" role="status">{onlineResultStatus}</p>}
      <div className="completion-actions">
        <button className="copy-completion" onClick={shareCompletionImage}>Copy result image</button>
        <button className="secondary" onClick={copyCompletion}>Copy result text</button>
        {completionCopyStatus && <span role="status">{completionCopyStatus}</span>}
      </div>
    </section>
    <details className="result-mistakes">
      <summary>Attempt details · {mistakes.length} recorded mistake{mistakes.length === 1 ? '' : 's'}</summary>
      {mistakes.length ? <ol>{mistakes.slice().reverse().map(mistake => <li key={mistake.id}><time>{mistake.time.toFixed(1)}s</time><span>{mistake.label}</span><b>{mistake.penalty > 0 ? `−${mistake.penalty}` : 'movement'}</b></li>)}</ol> : <p>Flawless movement. No mistakes recorded.</p>}
    </details>
    <div className="actions"><button onClick={start}>Run it again</button><button className="secondary" onClick={() => setScreen('menu')}>Change setup</button></div>
  </main>
  function updateProfile(update: Partial<PlayerProfile>) { setProfiles(current => current.map((profile, index) => index === assignment ? { ...profile, ...update } : profile)) }
  function currentRaidPlan(): RaidPlan { return normalizeRaidPlanForUse({ p1Positions, p1BossPosition: p1BossOpening, positions, p2Positions, p2SpreadPositions, p3Positions, p3BossPositions, startSlots, profiles, crystalAssignments: phaseCrystalAssignments, tankAssignments }) }
  function loadRaidPlanIntoApp(sourcePlan: RaidPlan) { const plan = normalizeRaidPlanForUse(sourcePlan); persistRaidPlan(plan); setP1Positions(plan.p1Positions); setP1BossOpening(plan.p1BossPosition); setPositions(plan.positions); setPhasePositions(plan.positions); setP2Positions(plan.p2Positions); setP2SpreadPositions(plan.p2SpreadPositions); setP3Positions(plan.p3Positions); setP3BossPositions(plan.p3BossPositions); setStartSlots(plan.startSlots); setProfiles(plan.profiles); setTankAssignments(plan.tankAssignments); setP1CrystalAssignments(plan.crystalAssignments.p1); setIntermissionCrystalAssignments(plan.crystalAssignments.intermission); setP2CrystalAssignments(plan.crystalAssignments.p2); setP3CrystalAssignments(plan.crystalAssignments.p3) }
  function savePositions() {
    persistRaidPlan(currentRaidPlan())
    setShareStatus('Layout saved')
    setLayoutSaveConfirmed(true)
    if (layoutSaveFeedbackTimerRef.current !== null) window.clearTimeout(layoutSaveFeedbackTimerRef.current)
    layoutSaveFeedbackTimerRef.current = window.setTimeout(() => {
      setLayoutSaveConfirmed(false)
      layoutSaveFeedbackTimerRef.current = null
    }, 2400)
  }
  function resetPositions() {
    const defaults = DEFAULT_ASSIGNMENTS.map(point => ({ ...point }))
    const defaultP2 = DEFAULT_P2_ASSIGNMENTS.map(point => ({ ...point }))
    const defaultP2Spread = DEFAULT_P2_SPREAD_ASSIGNMENTS.map(point => ({ ...point }))
    const defaultP3 = DEFAULT_P3_ASSIGNMENTS.map(point => ({ ...point }))
    const defaultStarts = DEFAULT_START_SLOTS.map(point => ({ ...point }))
    const defaultProfiles = DEFAULT_PROFILES.map(profile => ({ ...profile }))
    const defaultCrystals = normalizeCrystalAssignments(DEFAULT_PROFILES.map((profile, index) => profile.crystal ? index : -1))
    const defaultP1 = DEFAULT_P1_ASSIGNMENTS.map(point => ({ ...point }))
    setP1Positions(defaultP1)
    setP1BossOpening({ ...DEFAULT_P1_BOSS_POSITION })
    setPositions(defaults)
    setP2Positions(defaultP2)
    setP2SpreadPositions(defaultP2Spread)
    setP3Positions(defaultP3)
    setStartSlots(defaultStarts)
    setProfiles(defaultProfiles)
    setP1CrystalAssignments(defaultCrystals)
    setIntermissionCrystalAssignments(defaultCrystals)
    setP2CrystalAssignments(defaultCrystals)
    setP3CrystalAssignments(defaultCrystals)
    setTankAssignments([...DEFAULT_TANK_ASSIGNMENTS])
    persistRaidPlan({
      p1Positions: defaultP1,
      p1BossPosition: { ...DEFAULT_P1_BOSS_POSITION },
      positions: defaults,
      p2Positions: defaultP2,
      p2SpreadPositions: defaultP2Spread,
      p3Positions: defaultP3,
      p3BossPositions: DEFAULT_P3_BOSS_POSITIONS.map(point => ({ ...point })),
      startSlots: defaultStarts,
      profiles: defaultProfiles,
      crystalAssignments: { p1: defaultCrystals, intermission: defaultCrystals, p2: defaultCrystals, p3: defaultCrystals },
      tankAssignments: [...DEFAULT_TANK_ASSIGNMENTS],
    })
    setShareStatus('Default layout restored')
  }
  function raidPlanCode() { return encodeRaidPlan(currentRaidPlan()) }
  async function copyRaidPlan() { const link = `${window.location.origin}${window.location.pathname}#raidplan=${raidPlanCode()}`; setShareInput(link); try { await navigator.clipboard?.writeText(link); setShareStatus('Share link copied') } catch { setShareStatus('Share link ready to copy') } }
  async function loadAsgardRaidPlan() {
    setShareStatus('Loading I Asgard I raid plan…')
    try {
      const response = await fetch(ASGARD_RAID_PLAN_ASSET, { cache: 'no-store' })
      if (!response.ok) throw new Error('Raid-plan asset unavailable')
      const plan = decodeRaidPlan(await response.text())
      if (!plan) throw new Error('Raid-plan asset invalid')
      loadRaidPlanIntoApp(plan)
      const localShareLink = `${window.location.origin}${window.location.pathname}#raidplan=${encodeRaidPlan(normalizeRaidPlanForUse(plan))}`
      setShareInput(localShareLink)
      setShareStatus('I Asgard I raid plan loaded and saved')
    } catch {
      setShareStatus('Could not load the bundled I Asgard I raid plan')
    }
  }
  function applyRaidPlan() { const plan = decodeRaidPlan(shareInput); if (!plan) { setShareStatus('Invalid raid-plan code'); return } loadRaidPlanIntoApp(plan); setShareStatus('Shared raid plan loaded and saved') }
  function chooseBossPattern(target: Point) { const pattern = Math.random() < .5 ? 'line' : 'gap'; const count = Math.random() < .5 ? 11 : 13; const spacing = Math.PI * 2 / count; const targetAngle = Math.atan2(target.y - WORLD.center.y, target.x - WORLD.center.x); setBeamPattern(pattern); setBeamAngles(Array.from({ length: count }, (_, index) => { const anchor = targetAngle + (pattern === 'gap' ? spacing / 2 : 0) + index * spacing; const preservePlayerPattern = index === 0 || pattern === 'gap' && index === count - 1; return anchor + (preservePlayerPattern ? 0 : (Math.random() - .5) * spacing * .42) })) }
  const activePositions = event.startsWith('p1-') && event !== 'p1-transition' ? p1Positions : event.startsWith('p3-') ? p3Positions.map(point => p3AssignmentForRound(point, WORLD.center, p3Round)) : event === 'p2-spread' || event === 'p2-fetch' || event === 'p2-wait' ? p2SpreadPositions : event.startsWith('p2-') ? p2Positions : phasePositions
  const mainCastRemaining = mainCastState.phase === 'casting'
    ? mainCastState.remaining
    : 0
  const hudActionCallbacks = {
    activityNotification: activityNotificationQueue[0],
    playerDisplayName: effectivePlayerName,
    verifiedCharacterLabel: runAttribution === 'verified' && onlineSession.selectedCharacter
      ? `${onlineSession.selectedCharacter.name}—${onlineSession.selectedCharacter.realmSlug}`
      : null,
    runAttribution,
    onMainAbility: useMainAbility,
    onInterrupt: useInterrupt,
    onTankAction: useTankAction,
    onHealthPot: () => useRecovery('healthPot'),
    onShield: () => useRecovery('shield'),
  }
  return <GameArena hudActionButtonsEnabled={hudActionButtonsEnabled} {...hudActionCallbacks} tankMechanic={tankMechanic} controlledTank={controlledTank} tankAssignments={tankAssignments} p4PlayerConeActive={p4PlayerConeUntil > stats.time} p4PlayerConeCooldown={Math.max(0, p4PlayerConeReadyAtRef.current - stats.time)} p4PlayerConeAngle={Math.atan2(cameraForward.current.y, cameraForward.current.x)} p1Sequence={p1Sequence} p1Seed={p1Seed} p1BossOpening={p1BossOpening} p1InterruptAssignment={p1InterruptAssignmentRef.current} p1InterruptCast={p1InterruptCast} p1InterruptPressed={p1InterruptPressed} p1RunePanelOrientation={p1RunePanelOrientation} p1MemoryOrder={p1MemoryOrderState} p1FailedMemoryRune={p1FailedMemoryRune} p1GlaiveSets={p1GlaiveSets} p1Soaks={p1Soaks} p1SoakResolved={p1SoakResolved} p1CrystalAssignments={p1CrystalAssignments} p1CrystalCollected={p1CrystalCollected} p1WrongCrystalHeld={p1WrongCrystalHeld} p1StolenCrystalSlot={p1StolenCrystalSlot} p1WrongCrystalDeadline={p1WrongCrystalDeadline} combatProjectilesEnabled={combatProjectilesEnabled} mainProjectileFiredAt={mainProjectileFiredAt} bossHealth={bossHealth} mainCastRemaining={mainCastRemaining} personalJumpProgress={personalJumpProgress} musicMuted={musicMuted} encounterSoundsEnabled={encounterSoundsEnabled} ttsAvailable={raidleadAvailable} ttsEnabled={ttsEnabled} softWipeNotice={softWipeNotice} crystalDutyNotice={crystalDutyNotice} hudLayout={hudLayout} positions={activePositions} intermissionPositions={phasePositions} p2SoakPositions={p2Positions} p2SpreadPositions={p2SpreadPositions} p3Positions={p3Positions} p3FlightOrigin={p3FlightOriginRef.current} profiles={gameProfiles} raidStart={startSlots[startSlot]} movementSpeed={movementSpeed} movementBonus={movementBonus} gameSpeed={gameSpeed} p2Cycle={p2Cycle} p2Soaked={p2Soaked} p2OrbReturnAge={p2OrbReturnAge} p2BeamAssignees={p2BeamAssignees} p2BeamOrbIndices={p2BeamOrbIndices} p2ReturningOrbIndices={p2ReturningOrbIndices} p2ResolvedOrbIndices={p2ResolvedOrbIndices} p2BeamImpactAngle={p2BeamImpactAngle} onP2OrbitAngle={angle => { p2OrbitAngleRef.current = angle }} p3Round={p3Round} p3ArchangelDuty={activeCrystalAssignments.includes(assignment) ? p3ArchangelDuty : null} crystalSpent={crystalSpent} p4Cycle={p4Cycle} p4PatternSeed={p4PatternSeed} p3PoolHealth={p3PoolHealth} onP3PoolOccupancy={occupancy => { p3PoolOccupancyRef.current = occupancy }} onP3LightCenters={centers => { p3NpcLightCentersRef.current = centers }} onP3RuneContacts={runes => { p3RuneContactsRef.current = runes }} onNpcPositions={positions => { renderedNpcPositionsRef.current = positions }} onP4SplinterHit={reason => triggerWipe(reason)} p3RuneOrder={p3RuneOrder} p3RuneStep={p3RuneStep} p3ResolvedRunes={p3ResolvedRunes} health={health} healthPotUsed={healthPotUsed} shieldUsed={shieldUsed} keyBindings={keyBindings} crystalCarriers={activeCrystalCarriers} beamPattern={beamPattern} failureFlash={failureFlash} wipeReason={wipeReason} player={player} crystal={crystal} npcCrystals={npcCrystals} npcCarrier={npcCarrier} npcCrystalAge={npcCrystalAge} playerSplinterRotation={playerSplinterRotation} crystalAge={crystalAge} role={activeCrystalAssignments.includes(assignment) ? 'carrier' : 'non-carrier'} difficulty={difficulty} assignment={assignment} stats={stats} mistakes={mistakes} startSlotName={`S${startSlot + 1}`} paused={paused} event={event} eventTime={eventTime} beamAngles={beamAngles} npcSplinters={npcSplinters} cycle={cycle} setPaused={setPaused} setMusicMuted={setMusicMuted} setEncounterSoundsEnabled={setEncounterSoundsEnabled} setTtsEnabled={setTtsEnabled} onRetry={start} onExit={() => setScreen('menu')} onDrop={toggleCrystal} onCameraDirection={direction => { cameraForward.current = direction }} />
}

function rayHitsAny(point: Point, origin: Point, rotation = 0, minimumLength = 10, maximumLength = STAR_LENGTH): boolean { return starsplinterHitsPoint(point, origin, rotation, minimumLength, maximumLength) }
function pickNpcSplinters(required: number | null): number[] { const candidates = Array.from({ length: 19 }, (_, i) => i).filter(index => index !== required); for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]] } return required === null ? candidates.slice(0, 9) : [required, ...candidates.slice(0, 8)] }
function crystalNpcOrdinals(crystalPositionIndices: number[], playerAssignment: number): number[] { const npcPositionIndices = Array.from({ length: 20 }, (_, index) => index).filter(index => index !== playerAssignment); return crystalPositionIndices.filter(index => index !== playerAssignment).map(index => npcPositionIndices.indexOf(index)).filter(index => index >= 0) }
function createBossBeams(): number[] { const count = 11; return Array.from({ length: count }, (_, index) => index * Math.PI * 2 / count) }
function npcPosition(index: number, time: number, positions: Assignment[], playerAssignment: number, event: EventKind, eventTime: number, beamAngles: number[], raidStart: Point, movementSpeed: number, movementBonus: boolean): Point { const baseIndex = positions.map((_, positionIndex) => positionIndex).filter(positionIndex => positionIndex !== playerAssignment)[index]; const target = positions[baseIndex]; const positioningTime = Math.max(0, time - 3); const travelTime = positioningTime + (movementBonus ? Math.min(positioningTime, OPENING_BOOST_SECONDS) * .4 : 0); const entering = npcEntryPosition(target, raidStart, index, travelTime, movementSpeed); return distance(entering, target) > .1 ? entering : roamingNpcPosition(target, index, time, event, eventTime, beamAngles, WORLD.center) }
function nearestNpc(player: Point, time: number, positions: Assignment[], playerAssignment: number, candidates: number[], event: EventKind, eventTime: number, beamAngles: number[], raidStart: Point, movementSpeed: number, movementBonus: boolean): number | null { let best: number | null = null; let bestDistance = Infinity; for (const index of candidates) { const candidate = distance(player, npcPosition(index, time, positions, playerAssignment, event, eventTime, beamAngles, raidStart, movementSpeed, movementBonus)); if (candidate < bestDistance) { bestDistance = candidate; best = index } } return best }
function shuffledRunes(): RuneSymbol[] { const runes: RuneSymbol[] = ['T', 'X', 'O']; return runes.sort(() => Math.random() - .5) }
function playerRune(assignment: number): RuneSymbol { return (['T', 'X', 'O'] as RuneSymbol[])[assignment % 3] }
function CrystalAssignmentEditor({ phaseLabel, assignments, profiles, onChange }: { phaseLabel: string; assignments: number[]; profiles: PlayerProfile[]; onChange: (slot: number, playerIndex: number) => void }) {
  return <section className="phase-crystal-editor" aria-label={`${phaseLabel} crystal assignments`}>
    <header><div><p className="eyebrow">{phaseLabel.toUpperCase()} CRYSTALS</p><h3>Six crystal carriers</h3></div><p>Each dropdown assigns crystal duty to one raid-plan spot for this phase only.</p></header>
    <div className="phase-crystal-grid">
      {assignments.map((playerIndex, slot) => <label key={slot}><span><i aria-hidden="true">◆</i> Crystal <b>{String(slot + 1).padStart(2, '0')}</b></span><select aria-label={`${phaseLabel} crystal ${slot + 1}`} value={playerIndex} onChange={event => onChange(slot, Number(event.target.value))}>{profiles.map((profile, index) => <option value={index} key={index}>Spot {index + 1} · {profile.name}</option>)}</select></label>)}
    </div>
  </section>
}

function TankAssignmentEditor({ assignments, profiles, onChange }: { assignments: [number, number]; profiles: PlayerProfile[]; onChange: (slot: TankIndex, playerIndex: number) => void }) {
  return <section className="phase-crystal-editor tank-assignment-editor" aria-label="Tank assignments">
    <header><div><p className="eyebrow">TANK ROLE</p><h3>Two Heaven’s Lance tanks</h3></div><p>The selected raid-plan spots alternate the boss in P1, P2, and P3. A controlled tank plays the frontal cone in P4 instead of Starsplinter.</p></header>
    <div className="phase-crystal-grid tank-assignment-grid">
      {assignments.map((playerIndex, slot) => <label key={slot}><span><i aria-hidden="true">🛡</i> Tank <b>{slot + 1}</b></span><select aria-label={`Tank ${slot + 1}`} value={playerIndex} onChange={event => onChange(slot as TankIndex, Number(event.target.value))}>{profiles.map((profile, index) => <option value={index} key={index}>Spot {index + 1} · {profile.name}</option>)}</select></label>)}
    </div>
  </section>
}

function PositionMap({ assignment, positions, startSlots, profiles, onPositionChange, onStartSlotChange }: { assignment: number; positions: Assignment[]; startSlots: Assignment[]; profiles: PlayerProfile[]; onPositionChange: (index: number, point: Assignment) => void; onStartSlotChange: (index: number, point: Assignment) => void }) {
  const [dragging, setDragging] = useState<{ kind: 'player' | 'start'; index: number } | null>(null)
  const [selectionStart, setSelectionStart] = useState<Point | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  function mapPercent(event: ReactPointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
    }
  }
  function worldPoint(percent: Point): Point {
    return { x: WORLD.center.x + (percent.x - 50) * 9.22, y: WORLD.center.y + (percent.y - 50) * 5.19 }
  }
  function beginSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || dragging !== null) return
    const point = mapPercent(event)
    setSelectionStart(point)
    setSelectionEnd(point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function placeSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (!selected.length) return
    event.preventDefault()
    event.stopPropagation()
    const moved = translateSelectedPoints(positions, selected, worldPoint(mapPercent(event)))
    selected.forEach(index => onPositionChange(index, moved[index]))
    setSelected([])
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (selectionStart) {
      setSelectionEnd(mapPercent(event))
      return
    }
    if (dragging === null) return
    const point = worldPoint(mapPercent(event))
    if (dragging.kind === 'player') onPositionChange(dragging.index, point)
    else onStartSlotChange(dragging.index, point)
  }
  function finishSelection() {
    setDragging(null)
    if (!selectionStart || !selectionEnd) return
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    setSelected(positions.map((point, index) => ({ index, x: 50 + (point.x - WORLD.center.x) / 9.22, y: 50 + (point.y - WORLD.center.y) / 5.19 }))
      .filter(point => point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY)
      .map(point => point.index))
    setSelectionStart(null)
    setSelectionEnd(null)
  }
  const selectionBox = selectionStart && selectionEnd ? { left: `${Math.min(selectionStart.x, selectionEnd.x)}%`, top: `${Math.min(selectionStart.y, selectionEnd.y)}%`, width: `${Math.abs(selectionEnd.x - selectionStart.x)}%`, height: `${Math.abs(selectionEnd.y - selectionStart.y)}%` } : undefined
  return <div className={`position-map${selected.length ? ' placing-group' : ''}`} aria-label="Intermission position map" onPointerDownCapture={placeSelection} onPointerDown={beginSelection} onPointerMove={move} onPointerUp={finishSelection} onPointerLeave={() => { if (!selectionStart) setDragging(null) }} style={{ backgroundImage: `linear-gradient(rgba(7,9,22,.3), rgba(7,9,22,.3)), url(${ARENA_BACKGROUND})` }}><span className="map-boss">L’URA</span><span className="map-marker skull">☠</span><span className="map-marker cross">✕</span><span className="map-marker star">★</span><span className="map-marker orange">●</span><span className="p3-group-help">{selected.length ? `${selected.length} selected · click their destination` : 'Drag empty space to select a group'}</span>{selectionBox && <span className="p3-selection-box" style={selectionBox} />}{startSlots.map((p, i) => <button type="button" aria-label={`Move S${i + 1} start slot`} title={`S${i + 1} orientation anchor`} key={`start-${i}`} onPointerDown={event => { event.preventDefault(); setSelected([]); setDragging({ kind: 'start', index: i }); event.currentTarget.setPointerCapture(event.pointerId) }} className="map-start-slot" style={{ left: `${50 + (p.x - WORLD.center.x) / 9.22}%`, top: `${50 + (p.y - WORLD.center.y) / 5.19}%` }}>S{i + 1}</button>)}{positions.map((p, i) => <button type="button" aria-label={`Move player ${i + 1}`} title={`${profiles[i].name} · ${CLASS_OPTIONS.find(option => option.value === profiles[i].playerClass)?.label}${profiles[i].crystal ? ' · Crystal' : ''}`} key={i} onPointerDown={event => { event.preventDefault(); setSelected([]); setDragging({ kind: 'player', index: i }); event.currentTarget.setPointerCapture(event.pointerId) }} className={`${i === assignment ? 'map-player selected-map' : 'map-player'}${profiles[i].crystal ? ' crystal-map-player' : ''}${selected.includes(i) ? ' group-selected' : ''}`} style={{ left: `${50 + (p.x - WORLD.center.x) / 9.22}%`, top: `${50 + (p.y - WORLD.center.y) / 5.19}%`, backgroundColor: CLASS_OPTIONS.find(option => option.value === profiles[i].playerClass)?.color }}>{i + 1}</button>)}</div>
}

function P2PositionMap({ mapLabel, buttonLabel, assignment, positions, profiles, showPersonalCircles = false, phaseOne = false, bossPosition, onBossChange, onChange }: { mapLabel: string; buttonLabel: string; assignment: number; positions: Assignment[]; profiles: PlayerProfile[]; showPersonalCircles?: boolean; phaseOne?: boolean; bossPosition?: Assignment; onBossChange?: (point: Assignment) => void; onChange: (index: number, point: Assignment) => void }) {
  const [dragging, setDragging] = useState<number | 'boss' | null>(null)
  const [selectionStart, setSelectionStart] = useState<Point | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const mapScale = phaseOne ? { x: 9.22, y: 5.19 } : P2_MAP_SCALE
  function mapPercent(event: ReactPointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
    }
  }
  function worldPoint(percent: Point): Point {
    return { x: WORLD.center.x + (percent.x - 50) * mapScale.x, y: WORLD.center.y + (percent.y - 50) * mapScale.y }
  }
  function beginSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || dragging !== null) return
    const point = mapPercent(event)
    setSelectionStart(point)
    setSelectionEnd(point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function placeSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (!selected.length) return
    event.preventDefault()
    event.stopPropagation()
    const moved = translateSelectedPoints(positions, selected, worldPoint(mapPercent(event)))
    selected.forEach(index => onChange(index, moved[index]))
    setSelected([])
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (selectionStart) {
      setSelectionEnd(mapPercent(event))
      return
    }
    if (dragging === null) return
    const point = worldPoint(mapPercent(event))
    if (dragging === 'boss') onBossChange?.(point)
    else onChange(dragging, point)
  }
  function finishSelection() {
    setDragging(null)
    if (!selectionStart || !selectionEnd) return
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    setSelected(positions.map((point, index) => ({ index, x: 50 + (point.x - WORLD.center.x) / mapScale.x, y: 50 + (point.y - WORLD.center.y) / mapScale.y }))
      .filter(point => point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY)
      .map(point => point.index))
    setSelectionStart(null)
    setSelectionEnd(null)
  }
  const selectionBox = selectionStart && selectionEnd ? { left: `${Math.min(selectionStart.x, selectionEnd.x)}%`, top: `${Math.min(selectionStart.y, selectionEnd.y)}%`, width: `${Math.abs(selectionEnd.x - selectionStart.x)}%`, height: `${Math.abs(selectionEnd.y - selectionStart.y)}%` } : undefined
  return <div className={`position-map p2-position-map${phaseOne ? ' p1-position-map' : ''}${showPersonalCircles ? ' personal-circle-map' : ''}${selected.length ? ' placing-group' : ''}`} aria-label={mapLabel} onPointerDownCapture={placeSelection} onPointerDown={beginSelection} onPointerMove={move} onPointerUp={finishSelection} onPointerLeave={() => { if (!selectionStart) setDragging(null) }} style={{ backgroundImage: `linear-gradient(rgba(7,9,22,.46), rgba(7,9,22,.46)), url(${ARENA_BACKGROUND})` }}>{!phaseOne && <><span className="p2-cross horizontal" /><span className="p2-cross vertical" /></>}<span className="map-boss">{phaseOne ? 'INNER BUBBLE' : 'L’URA'}</span>{phaseOne && bossPosition && <button type="button" className="p1-planner-boss" aria-label="Move Phase 1 L’ura" onPointerDown={event => { event.preventDefault(); setSelected([]); setDragging('boss'); event.currentTarget.setPointerCapture(event.pointerId) }} style={{ left: `${50 + (bossPosition.x - WORLD.center.x) / mapScale.x}%`, top: `${50 + (bossPosition.y - WORLD.center.y) / mapScale.y}%` }}>L’URA</button>}<span className="map-marker skull">☠</span><span className="map-marker cross">✕</span><span className="map-marker star">★</span><span className="map-marker orange">●</span><span className="p3-group-help">{selected.length ? `${selected.length} selected · click their destination` : 'Drag empty space to select a group'}</span>{selectionBox && <span className="p3-selection-box" style={selectionBox} />}{positions.map((point, index) => {
    const left = 50 + (point.x - WORLD.center.x) / mapScale.x
    const top = 50 + (point.y - WORLD.center.y) / mapScale.y
    return <span className="p2-player-assignment" key={index}>{showPersonalCircles && <i className={index === assignment ? 'planner-personal-circle selected-circle' : 'planner-personal-circle'} aria-hidden="true" style={{ left: `${left}%`, top: `${top}%`, width: `${P2_PLANNER_CIRCLE_DIAMETER}%` }} />}<button type="button" aria-label={`Move ${buttonLabel} player ${index + 1}`} title={`${profiles[index].name} · ${buttonLabel} · ${P2_PERSONAL_CIRCLE_OUTER_RADIUS.toFixed(2)} yd circle radius`} onPointerDown={event => { event.preventDefault(); setSelected([]); setDragging(index); event.currentTarget.setPointerCapture(event.pointerId) }} className={`${index === assignment ? 'map-player selected-map' : 'map-player'}${profiles[index].crystal ? ' crystal-map-player' : ''}${selected.includes(index) ? ' group-selected' : ''}`} style={{ left: `${left}%`, top: `${top}%`, backgroundColor: CLASS_OPTIONS.find(option => option.value === profiles[index].playerClass)?.color }}>{index + 1}</button></span>
  })}</div>
}

function P3PositionMap({ assignment, positions, bossPositions, profiles, onChange, onBossChange }: { assignment: number; positions: Assignment[]; bossPositions: Assignment[]; profiles: PlayerProfile[]; onChange: (index: number, point: Assignment) => void; onBossChange: (index: number, point: Assignment) => void }) {
  const [dragging, setDragging] = useState<number | null>(null)
  const [selectionStart, setSelectionStart] = useState<Point | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const scale = P3_PLANNER_SCALE
  function mapPercent(event: ReactPointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
    }
  }
  function worldPoint(percent: Point): Point {
    return { x: P3_PLANNER_CENTER.x + (percent.x - 50) * scale, y: P3_PLANNER_CENTER.y + (percent.y - 50) * scale }
  }
  function beginSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || dragging !== null) return
    event.preventDefault()
    const point = mapPercent(event)
    setSelectionStart(point)
    setSelectionEnd(point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function placeSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (!selected.length) return
    event.preventDefault()
    event.stopPropagation()
    const moved = translateSelectedPoints(positions, selected, worldPoint(mapPercent(event)))
    selected.forEach(index => onChange(index, moved[index]))
    setSelected([])
  }
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const percent = mapPercent(event)
    if (selectionStart) {
      setSelectionEnd(percent)
      return
    }
    if (dragging === null) return
    const point = worldPoint(percent)
    if (dragging >= 20) onBossChange(dragging - 20, point)
    else onChange(dragging, point)
  }
  function finishSelection() {
    setDragging(null)
    if (!selectionStart || !selectionEnd) return
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)
    setSelected(positions.map((point, index) => ({ index, x: 50 + (point.x - P3_PLANNER_CENTER.x) / scale, y: 50 + (point.y - P3_PLANNER_CENTER.y) / scale }))
      .filter(point => point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY)
      .map(point => point.index))
    setSelectionStart(null)
    setSelectionEnd(null)
  }
  const selectionBox = selectionStart && selectionEnd ? {
    left: `${Math.min(selectionStart.x, selectionEnd.x)}%`,
    top: `${Math.min(selectionStart.y, selectionEnd.y)}%`,
    width: `${Math.abs(selectionEnd.x - selectionStart.x)}%`,
    height: `${Math.abs(selectionEnd.y - selectionStart.y)}%`,
  } : undefined
  const arenaCenterTop = 50 + (WORLD.center.y - P3_PLANNER_CENTER.y) / scale
  return <div className={`position-map p3-position-map${selected.length ? ' placing-group' : ''}`} data-planner-scale={scale} data-background-zoom="325%" aria-label="Phase 3 initial position map" onPointerDownCapture={placeSelection} onPointerDown={beginSelection} onPointerMove={move} onPointerUp={finishSelection} onPointerLeave={() => { if (!selectionStart) setDragging(null) }} style={{ backgroundImage: `linear-gradient(rgba(7,9,22,.38), rgba(7,9,22,.38)), url(${ARENA_BACKGROUND})`, '--p3-arena-center-top': `${arenaCenterTop}%` } as CSSProperties}>
    <span className="p2-cross vertical" />
    <span className="p3-group-help">{selected.length ? `${selected.length} selected · click their destination` : 'Drag empty space to select a group'}</span>
    {selectionBox && <span className="p3-selection-box" style={selectionBox} />}
    {bossPositions.map((boss, index) => <button type="button" aria-label={`Move P3 ${index ? 'image' : 'Lura'} boss`} title={`Drag ${index ? 'the image' : 'L’ura'} to its Phase 3 boss position`} className="map-boss p3-boss-handle" key={index} onPointerDown={event => { event.preventDefault(); setSelected([]); setDragging(20 + index); event.currentTarget.setPointerCapture(event.pointerId) }} style={{ left: `${50 + (boss.x - P3_PLANNER_CENTER.x) / scale}%`, top: `${50 + (boss.y - P3_PLANNER_CENTER.y) / scale}%` }}><i aria-hidden="true" /><span>{index ? 'IMAGE' : 'L’URA'}</span></button>)}
    {positions.map((point, index) => <button type="button" aria-label={`Move P3 player ${index + 1}`} title={`${profiles[index].name} · P3 initial sector`} key={index} onPointerDown={event => { event.preventDefault(); setSelected([]); setDragging(index); event.currentTarget.setPointerCapture(event.pointerId) }} className={`${index === assignment ? 'map-player selected-map' : 'map-player'}${profiles[index].crystal ? ' crystal-map-player' : ''}${selected.includes(index) ? ' group-selected' : ''}`} style={{ left: `${50 + (point.x - P3_PLANNER_CENTER.x) / scale}%`, top: `${50 + (point.y - P3_PLANNER_CENTER.y) / scale}%`, backgroundColor: CLASS_OPTIONS.find(option => option.value === profiles[index].playerClass)?.color }}>{index + 1}</button>)}
  </div>
}

function CreatorCard() {
  return <aside className="creator-card" aria-label="About Pestivator">
    <a className="creator-avatar-link" href={RAIDER_IO_PROFILE} target="_blank" rel="noreferrer" aria-label="Pestivator on Raider.IO"><img src={CREATOR_AVATAR} alt="Pestivator's gnome avatar" /></a>
    <div><span>Created by</span><strong>Pestivator</strong><a className="battle-tag-link" href={RAIDER_IO_PROFILE} target="_blank" rel="noreferrer" title="BattleTag · open Pestivator on Raider.IO">pestivator#2515</a>
      <nav aria-label="Pestivator links"><a href={RAIDER_IO_PROFILE} target="_blank" rel="noreferrer">Raider.IO ↗</a><a href="https://twitch.tv/pestivator" target="_blank" rel="noreferrer" aria-label="Pestivator on Twitch">Twitch.tv ↗</a><a className="coffee-link" href={`solana:${SOLANA_ADDRESS}?label=Pestivator&message=Thanks%20for%20the%20Lura%20Trainer`} title={`Send SOL to ${SOLANA_ADDRESS}`}>☕ Buy me a coffee</a></nav>
    </div>
  </aside>
}

function BuildIndicator({ inGame = false }: { inGame?: boolean }) {
  const [availableVersion, setAvailableVersion] = useState<VersionManifest | null>(null)
  const [dismissedRevision, setDismissedRevision] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const built = new Date(APP_BUILD_TIME)
  const timestamp = Number.isNaN(built.getTime())
    ? APP_BUILD_TIME
    : `${built.toISOString().slice(0, 16).replace('T', ' ')} UTC`
  useEffect(() => {
    let active = true
    async function checkForUpdate() {
      try {
        const response = await fetch(new URL('version.json', document.baseURI), { cache: 'no-store' })
        if (!response.ok) return
        const manifest = await response.json() as VersionManifest
        if (active && manifest.revision && manifest.revision !== 'unknown' && manifest.revision !== APP_GIT_REVISION) setAvailableVersion(manifest)
      } catch { /* development, offline use, and tests may not expose a manifest */ }
    }
    void checkForUpdate()
    const timer = window.setInterval(checkForUpdate, 5 * 60 * 1000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])
  const showUpdate = availableVersion && availableVersion.revision !== dismissedRevision
  const buildLabel = `v${APP_VERSION} · ${APP_GIT_REVISION} · ${timestamp}`
  async function copyBuildVersion() {
    try {
      await navigator.clipboard.writeText(buildLabel)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
    window.setTimeout(() => setCopyStatus(''), 1600)
  }
  return <>
    {showUpdate && <aside className="update-banner" role="alert"><span><strong>New trainer version available</strong> · {availableVersion.revision}</span><details><summary>What’s changed</summary><ul>{RECENT_RELEASE_CHANGES.map(change => <li key={change}>{change}</li>)}</ul><a href={CHANGELOG_URL} target="_blank" rel="noreferrer">Full changelog ↗</a></details><button onClick={() => window.location.reload()}>Load new version</button><button className="secondary" onClick={() => setDismissedRevision(availableVersion.revision)}>Later</button></aside>}
    <aside className={`build-indicator${inGame ? ' game-build-indicator' : ''}`} aria-label="Build information" title={`Built ${Number.isNaN(built.getTime()) ? APP_BUILD_TIME : built.toISOString()}`}>
      <button className="build-copy" type="button" onClick={copyBuildVersion} title="Copy build version">{copyStatus || `${buildLabel} · Copy`}</button>
      <nav aria-label="Project links"><a href={PROJECT_URL} target="_blank" rel="noreferrer">GitHub ↗</a><a className="changelog-link" href={CHANGELOG_URL} target="_blank" rel="noreferrer">Changelog ↗</a><a className="issue-link" href={ISSUE_URL} target="_blank" rel="noreferrer">File an issue ↗</a></nav>
    </aside>
  </>
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
    { key: 'castbar', label: 'MAIN ABILITY', value: '0.6s' },
    { key: 'actions', label: 'ACTION BUTTONS', value: 'F · NUM 2 · C' },
  ]
  return <section className="hud-layout-editor">
    <div className="hud-preview" aria-label="Phase 2 HUD layout preview" onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
      <div className="hud-preview-arena"><span className="preview-caption">Static P2 view · drag the HUD boxes</span><i className="preview-cross horizontal" /><i className="preview-cross vertical" /><i className="preview-boss"><b>L’URA</b></i>{Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI * 2 / 12; return <i key={index} className="preview-player" style={{ left: `${50 + Math.cos(angle) * 32}%`, top: `${50 + Math.sin(angle) * 32}%` }} /> })}<i className="preview-you"><b>YOU</b></i></div>
      {counters.map(counter => <button type="button" key={counter.key} aria-label={`Move ${counter.label.toLowerCase()} counter`} className={`hud-preview-counter ${counter.key}`} style={{ left: `${layout[counter.key].x}%`, top: `${layout[counter.key].y}%` }} onPointerDown={event => { event.preventDefault(); setDragging(counter.key); event.currentTarget.setPointerCapture(event.pointerId) }}><span>{counter.label}</span><strong>{counter.value}</strong></button>)}
    </div>
    <button type="button" className="secondary hud-reset" onClick={onReset}>Reset counter positions</button>
  </section>
}

export function failureAdvice(label: string): string {
  if (/missed assigned interrupt/i.test(label)) return 'L’ura casts five times in order. Your KICK ORDER number is the cast you must stop: wait through the earlier casts, then press Interrupt during your assigned cast’s green two-second KICK window.'
  if (/interrupted cast/i.test(label)) return 'Interrupt only the cast matching your KICK ORDER number. Red means wait, orange means your turn is next, and green means press Interrupt now.'
  if (/heaven glaive/i.test(label)) return 'Track the roaming glaive discs after they launch from L’ura. Leave their travel lane and keep watching after each wall or center-bubble ricochet.'
  if (/reactive phase 1 soak/i.test(label)) return 'Two yellow impact circles appear after the rotating beams. NPCs cover one; move into the other open yellow circle and remain there until it resolves.'
  if (/phase 2 beam|cross-beam/i.test(label)) return 'Only four non-crystal players receive each beam set. If assigned, move until the ray from L’ura through your rendered position intersects your highlighted moving orb, then hold that aim through resolution.'
  if (/outside.*phase 3|yellow landing|phase 3 light/i.test(label)) return 'Stand inside an active yellow Phase 3 light. For landing Soaks, remain in one yellow circle until it is filled; afterward, rotate into the surviving lit sector before the old sector is consumed.'
  if (/outside.*phase 4|heaven and hell/i.test(label)) return 'Stay inside the moving yellow protection circle in Phase 4. Follow its quarter-arena rotation and never remain in a sector after that quarter is consumed.'
  if (/starsplinter|splinter/i.test(label)) return 'If marked, move your six-ray Starsplinter away from the group and crystal carriers. If unmarked, watch every marked player and stand between their six rays until detonation.'
  if (/returning orb/i.test(label)) return 'After the cross beam, watch the struck outside orbs glow and return to the middle. Be clear of their path and recover any center crystal before they arrive.'
  if (/boss beam|rotating beam|hit by a phase 1 rotating beam/i.test(label)) return 'Use the telegraphed ray directions to identify a gap, then cross into that gap before the beams activate. Keep moving with rotating beams instead of crossing an active ray.'
  if (/personal circle/i.test(label)) return 'Use the full spread window to reach your assigned outer position. Keep the complete circle clear of players and every dropped crystal until it disappears.'
  if (/wrong.*crystal|another player.*crystal|assigned phase 1 crystal/i.test(label)) return 'Pick up only the crystal assigned to your raid position. If you take another player’s crystal, drop it within five seconds and move away so its assigned NPC can recover it.'
  if (/recover|fetched|fetch|expired/i.test(label) && /crystal/i.test(label)) return 'After the dangerous beam or circle resolves, walk directly over your dropped crystal before its recovery timer expires; do not leave it in another hazard.'
  if (/crystal/i.test(label)) return 'Confirm whether your current phase assigns you a crystal. Drop it in the mechanic’s safe location and timing window, move clear, then walk over it again before the recovery deadline.'
  if (/rune/i.test(label)) return 'Memorize the displayed rune order. Move onto your own assigned rune only when that symbol is the active step, then leave it clear for the remaining symbols.'
  if (/wrong phase 3 side/i.test(label)) return 'During Phase 3 positioning, route around the center void to the same side as your assigned raid-plan position and arrive before the approach timer ends.'
  if (/void zone|add from the middle/i.test(label)) return 'The center is lethal and cannot be crossed. Route around the middle void along the playable ring; keep clear of adds emerging from the center edge.'
  if (/soak|big boom/i.test(label)) return 'Each active yellow Soak needs a player or NPC standing inside until its pool is fully depleted. Check every remaining yellow circle before Big Boom resolves.'
  return 'Identify the highlighted danger or assignment, move to the required safe position before resolution, and remain there until the mechanic visibly completes.'
}

function GameArena(props: { activityNotification: ActivityFeedRow | undefined; hudActionButtonsEnabled: boolean; onMainAbility: () => void; onInterrupt: () => void; onTankAction: () => void; onHealthPot: () => void; onShield: () => void; tankMechanic: TankMechanicState; controlledTank: TankIndex | null; tankAssignments: [number, number]; p4PlayerConeActive: boolean; p4PlayerConeCooldown: number; p4PlayerConeAngle: number; p1Sequence: number; p1Seed: number; p1BossOpening: Point; p1InterruptAssignment: number; p1InterruptCast: number; p1InterruptPressed: boolean; p1RunePanelOrientation: P1RunePanelOrientation; p1MemoryOrder: P1Rune[]; p1FailedMemoryRune: P1Rune | null; p1GlaiveSets: P1GlaiveSet[]; p1Soaks: P1ReactiveSoak[]; p1SoakResolved: number[]; p1CrystalAssignments: number[]; p1CrystalCollected: boolean; p1WrongCrystalHeld: boolean; p1StolenCrystalSlot: number | null; p1WrongCrystalDeadline: number | null; combatProjectilesEnabled: boolean; mainProjectileFiredAt: number | null; bossHealth: number; mainCastRemaining: number; personalJumpProgress: number; musicMuted: boolean; encounterSoundsEnabled: boolean; ttsAvailable: boolean; ttsEnabled: boolean; softWipeNotice: string; crystalDutyNotice: string; hudLayout: HudLayout; positions: Assignment[]; intermissionPositions: Assignment[]; p2SoakPositions: Assignment[]; p2SpreadPositions: Assignment[]; p3Positions: Assignment[]; p3FlightOrigin: Point; profiles: PlayerProfile[]; raidStart: Point; movementSpeed: number; movementBonus: boolean; gameSpeed: number; p2Cycle: number; p2Soaked: boolean; p2OrbReturnAge: number; p2BeamAssignees: number[]; p2BeamOrbIndices: number[]; p2ReturningOrbIndices: number[]; p2ResolvedOrbIndices: number[]; p2BeamImpactAngle: number; onP2OrbitAngle: (angle: number) => void; p3Round: number; p3ArchangelDuty: 1 | 2 | null; crystalSpent: boolean; p4Cycle: number; p4PatternSeed: number; p3PoolHealth: number[]; onP3PoolOccupancy: (occupancy: number[]) => void; onP3LightCenters: (centers: Point[]) => void; onP3RuneContacts: (runes: RuneSymbol[]) => void; onNpcPositions: (positions: Point[]) => void; onP4SplinterHit: (reason: string) => void; p3RuneOrder: RuneSymbol[]; p3RuneStep: number; p3ResolvedRunes: RuneSymbol[]; health: number; healthPotUsed: boolean; shieldUsed: boolean; keyBindings: KeyBindings; crystalCarriers: number[]; beamPattern: 'line' | 'gap'; failureFlash: boolean; wipeReason: string; player: Point; crystal: Point | null; npcCrystals: Point[]; npcCarrier: number | null; npcCrystalAge: number; playerSplinterRotation: number; crystalAge: number; role: Role; difficulty: Difficulty; assignment: number; stats: GameStats; mistakes: Mistake[]; startSlotName: string; paused: boolean; event: EventKind; eventTime: number; beamAngles: number[]; npcSplinters: number[]; cycle: number; setPaused: (p: boolean) => void; setMusicMuted: (muted: boolean) => void; setEncounterSoundsEnabled: (enabled: boolean) => void; setTtsEnabled: (enabled: boolean) => void; onRetry: () => void; onExit: () => void; onDrop: () => void; onCameraDirection: (direction: Point) => void }) {
  const identityProps = props as typeof props & {
    playerDisplayName: string
    verifiedCharacterLabel: string | null
    runAttribution: RunAttributionMode
  }
  const [zoomDisplay, setZoomDisplay] = useState(16)
  const [wipeMinimized, setWipeMinimized] = useState(false)
  const [failureLogCopied, setFailureLogCopied] = useState(false)
  const [failureHelpId, setFailureHelpId] = useState<number | null>(null)
  useEffect(() => { if (props.wipeReason) setWipeMinimized(false) }, [props.wipeReason])
  async function copyFailureLog() {
    const text = props.mistakes.length
      ? props.mistakes.slice(0, 5).map(mistake => `${mistake.time.toFixed(1)}s · ${mistake.label}`).join('\n')
      : 'No failures yet.'
    try {
      await navigator.clipboard.writeText(text)
      setFailureLogCopied(true)
      window.setTimeout(() => setFailureLogCopied(false), 1800)
    } catch { setFailureLogCopied(false) }
  }
  const countdown = props.event === 'countdown'
  const positioning = props.event === 'positioning'
  const finalRecovery = props.event === 'p1-recover'
  const phaseOne = props.event.startsWith('p1-') && props.event !== 'p1-recover'
  const phaseTwo = props.event.startsWith('p2-')
  const phaseThree = props.event.startsWith('p3-')
  const phaseFour = props.event.startsWith('p4-')
  const playerP2BeamSlot = props.p2BeamAssignees.indexOf(props.assignment)
  const p2PhaseTransitionRemaining = p2PhaseTransitionCountdown(props.event, props.p2Cycle, props.p2OrbReturnAge)
  const p2Copy: Partial<Record<EventKind, { title: string; mechanic: string; detail: string; counter: string; duration: number }>> = {
    'p2-countdown': { title: 'Get ready for Phase 2.', mechanic: 'CENTER STACK', detail: 'The raid begins stacked in the middle.', counter: 'STARTING', duration: 3 },
    'p2-jump': { title: 'Into the center.', mechanic: 'FORCED CENTER STACK', detail: 'The whole raid is jumping into one stack in the middle.', counter: 'STACK', duration: 1.4 },
    'p2-positioning': { title: playerP2BeamSlot >= 0 ? 'Aim your assigned beam.' : 'Dodge the assigned beams.', mechanic: playerP2BeamSlot >= 0 ? `BEAM ${playerP2BeamSlot + 1} / 4` : 'NO BEAM DUTY', detail: playerP2BeamSlot >= 0 ? 'Move from the stack until your beam lines up with its moving outside orb.' : 'Four non-crystal players are assigned this beam set. Stay clear while they aim.', counter: 'POSITION', duration: P2_POSITIONING_SECONDS },
    'p2-orbs': { title: playerP2BeamSlot < 0 ? 'Dodge the cross beams.' : props.p2Soaked ? 'Orb lined up.' : 'Aim through your assigned orb.', mechanic: playerP2BeamSlot < 0 ? 'NO BEAM DUTY' : props.p2Soaked ? 'ORB TARGETED' : `BEAM ${playerP2BeamSlot + 1} / 4`, detail: playerP2BeamSlot < 0 ? 'Stay clear while all four assigned players intercept their moving orbs.' : 'Your beam follows your position. Keep its ray through the assigned moving orb until resolution.', counter: playerP2BeamSlot < 0 ? 'DODGE' : props.p2Soaked ? 'ALIGNED' : 'BEAM', duration: P2_BEAM_SECONDS },
    'p2-recover': { title: 'Recover the crystal.', mechanic: 'CRYSTAL RECOVERY', detail: 'Walk onto the crystal before its six-second ground timer expires. The struck orbs keep glowing and orbiting.', counter: 'RECOVER', duration: 6 },
    'p2-pull': { title: 'Pulled to the center.', mechanic: 'INCREASING PULL', detail: 'The five-second pull starts weak enough to move against, then becomes overwhelming while the struck orbs continue orbiting.', counter: 'PULL', duration: P2_PULL_SECONDS },
    'p2-spread': { title: 'Spread your circle.', mechanic: 'PERSONAL CIRCLES', detail: 'Use the full five-second spread window to reach your assignment. A carrier leaves the crystal in the center, then recovers it before the orbs return.', counter: 'SPREAD', duration: P2_SPREAD_SECONDS },
    'p2-fetch': { title: 'Fetch the crystal.', mechanic: 'CRYSTAL RECOVERY', detail: 'Return to the middle and pick the crystal up before the returning orbs explode there.', counter: 'FETCH', duration: P2_FETCH_SECONDS },
    'p2-wait': p2PhaseTransitionRemaining === null
      ? { title: 'Orbs return to the middle.', mechanic: 'ORB RETURN', detail: 'Twenty-one seconds after the cross begins, the struck orbs glow and fly inward. Cross beams repeat every thirty seconds.', counter: 'NEXT BEAM', duration: P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS }
      : { title: 'Return to your personal circle.', mechanic: 'PHASE 3 POSITION', detail: 'Reach your configured personal-circle marker. The outward launch begins from every player’s visible position without restacking in the middle.', counter: 'PHASE 3', duration: P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS },
  }
  const p2 = p2Copy[props.event]
  const p3Copy: Partial<Record<EventKind, { title: string; detail: string; counter: string; duration: number }>> = {
    'p3-countdown': { title: 'Get ready for Phase 3.', detail: 'The raid will be flung back into its two arena halves.', counter: 'STARTING', duration: 3 },
    'p3-flight': { title: 'Thrown into the split arena.', detail: 'Follow the outward flight and orient toward your assigned boss.', counter: 'FLIGHT', duration: 2 },
    'p3-landing': { title: 'Catch the open yellow impact.', detail: 'One nearby NPC covers the first impact. You must reach the other yellow circle before it lands.', counter: 'LANDING SOAKS', duration: 3 },
    'p3-approach': { title: 'Reach your opening side.', detail: 'Cross the divider if needed and reach the assigned half of the arena. The marker is only a rough orientation point.', counter: 'APPROACH', duration: P3_APPROACH_SECONDS },
    'p3-light-pools': {
      title: props.eventTime < P3_MEMORY_PANEL_SECONDS ? 'Complete the Soaks.' : props.eventTime < P3_MEMORY_START_SECONDS ? 'Memorize the rune order.' : props.eventTime < P3_MEMORY_START_SECONDS + P3_MEMORY_STEP_SECONDS * 3 ? 'Resolve the memory game.' : 'Survive the repeating Stars.',
      detail: `Move with your group around the boss; the opening assignment is no longer fixed. Each Soak needs at least three players for 14 seconds, with every extra player accelerating it. Finish every Soak before Big Boom; they remain active throughout the 15-second memory-game overlap. Each Stars pattern disappears for three seconds before the next one. At 20 seconds the memory panel appears; from 25–40 seconds, spread and bump your matching NPC only during your rune’s turn.`,
      counter: 'BIG BOOM',
      duration: P3_SECTOR_SECONDS,
    },
    'p3-rune-preview': { title: 'Memorize the rune order.', detail: 'Match T, X, and O pairs in the displayed order.', counter: 'MEMORIZE', duration: 2 },
    'p3-lattice-memory': { title: 'Resolve the memory marks.', detail: 'Touch only the NPC carrying your matching rune when that symbol is active. Resolved pairs disappear.', counter: 'RUNES', duration: 10 },
    'p3-lattice-second': { title: 'Stars repeat.', detail: 'Reposition before the nearest-neighbor Stars beams connect again.', counter: 'STARS', duration: 4.5 },
    'p3-pools-overlap': { title: 'Complete Soaks through the overlap.', detail: 'Keep soaking while another Stars pattern resolves.', counter: 'OVERLAP', duration: 15 },
    'p3-big-boom': { title: 'Big boom.', detail: 'The Soak check has resolved. Regroup for Dark Archangel.', counter: 'BOOM', duration: 1 },
    'p3-archangel-position': { title: 'Stack behind your boss.', detail: 'Move to the edge stack before Dark Archangel.', counter: 'STACK', duration: 4 },
    'p3-archangel': { title: 'Dark Archangel.', detail: 'Stand in the yellow protection bubble. Assigned carriers drop their crystal now.', counter: 'PROTECTION', duration: 6 },
    'p3-sector-move': { title: 'The sector is consumed.', detail: props.p3Round >= 2 ? 'The divider falls. Move north now; this leads directly into the raid jump, fifteen seconds after Dark Archangel.' : 'Move into the next third of your side.', counter: 'MOVE', duration: props.p3Round >= 2 ? P3_FINAL_SECTOR_MOVE_SECONDS : P3_SECTOR_MOVE_SECONDS },
  }
  const p3 = p3Copy[props.event]
  const p1PickupSequence = p1CrystalPickupSequence(props.p1CrystalAssignments, props.assignment)
  const playerP1Rune = (['T', 'X', 'O', 'V', '+'] as P1Rune[])[props.assignment % 5]
  const p1Copy: Partial<Record<EventKind, { title: string; detail: string; counter: string; duration: number }>> = {
    'p1-countdown': { title: `Kick ${props.p1InterruptAssignment + 1} · ${p1PickupSequence ? `Crystal pickup ${p1PickupSequence}` : 'No crystal pickup'}.`, detail: `Kick cast ${props.p1InterruptAssignment + 1} of 5 with ${keyLabel(props.keyBindings.interrupt)}. ${p1PickupSequence ? `Your assigned ground crystal belongs to sequence ${p1PickupSequence}; collect it before the NPCs move.` : 'You have no ground-crystal pickup in either demonstrated sequence.'}`, counter: 'STARTING', duration: 3 },
    'p1-pull': { title: 'Engage L’ura.', detail: 'The first interrupt begins four seconds after the pull.', counter: 'PULL', duration: P1_PULL_DELAY_SECONDS },
    'p1-interrupts': { title: `Interrupt cast ${props.p1InterruptAssignment + 1}.`, detail: 'Five consecutive two-second casts resolve. Red is not yours, yellow means next, and green is your interrupt window.', counter: 'CAST', duration: P1_INTERRUPT_CAST_COUNT * P1_INTERRUPT_CAST_SECONDS },
    'p1-crystals': { title: 'Collect the assigned crystals.', detail: 'Three assigned carriers have five seconds to collect their crystals from the Phase 1 raid plan.', counter: 'PICKUP', duration: P1_CRYSTAL_PICKUP_SECONDS },
    'p1-glaives': { title: 'Heaven Glaives.', detail: 'Five fast spinning discs launch from L’ura, slow after their first impact, and ricochet between the outer wall and middle bubble for sixty-five seconds.', counter: 'GLAIVES', duration: P1_GLAIVE_TELEGRAPH_SECONDS + P1_MEMORY_DELAY_SECONDS },
    'p1-memory-position': { title: 'Arrange the memory order.', detail: 'Use the TXOV+ panel to take your correct clockwise slot around L’ura. Radial distance does not matter.', counter: 'POSITION', duration: P1_MEMORY_POSITION_SECONDS },
    'p1-memory-sweep': { title: 'Memory sweep.', detail: 'The rotating beam checks every rune in the displayed order.', counter: 'SWEEP', duration: P1_MEMORY_SWEEP_SECONDS },
    'p1-beam-position': { title: 'Hold behind L’ura.', detail: 'The raid keeps fighting and roaming naturally; judge the hidden beam opening yourself.', counter: 'POSITION', duration: P1_BEAM_POSITION_SECONDS },
    'p1-beam-telegraph': { title: 'Move beam.', detail: 'Eight rotating beams are safe during their two-second telegraph. Move into the center of the nearest safe lane.', counter: 'TELEGRAPH', duration: P1_ROTATING_BEAM_TELEGRAPH_SECONDS },
    'p1-beams': { title: 'Follow the rotating beam.', detail: 'Fight L’ura while staying centered between two rays through the 45-degree sweep and continuing to dodge Heaven Glaives.', counter: 'BEAMS', duration: P1_ROTATING_BEAM_ACTIVE_SECONDS },
    'p1-soaks': { title: 'Soak the open circle.', detail: 'NPCs immediately cover one yellow impact. Reach the remaining yellow Soak before it expires.', counter: 'SOAK', duration: P1_REACTIVE_SOAK_SECONDS },
    'p1-transition': { title: 'Reach your Intermission position.', detail: 'The P1 sequence is complete. You have twenty-four seconds to reach the existing Intermission assignment.', counter: 'INTERMISSION', duration: P1_INTERMISSION_POSITION_SECONDS },
  }
  const p1 = p1Copy[props.event]
  const memoryGameActive = props.event === 'p3-light-pools' && props.eventTime >= P3_MEMORY_START_SECONDS
  const p4SplinterStart = p4SplinterStartSeconds(props.p4Cycle)
  const p4HeavenCountdown = props.eventTime < P4_HEAVEN_START_SECONDS
    ? P4_HEAVEN_START_SECONDS - props.eventTime
    : P4_CYCLE_SECONDS + P4_HEAVEN_START_SECONDS - props.eventTime
  const p4SplinterActive = props.event === 'p4-cycle' && props.eventTime >= p4SplinterStart && props.eventTime < p4SplinterStart + P4_SPLINTER_INTERVAL_SECONDS * 2 + P4_SPLINTER_DETONATION_SECONDS
  const p4NextSplinterCountdown = props.eventTime < p4SplinterStart
    ? p4SplinterStart - props.eventTime
    : P4_CYCLE_SECONDS - props.eventTime + p4SplinterStartSeconds(props.p4Cycle + 1)
  const phaseLabel = phaseOne
    ? `PHASE 1 · SEQUENCE ${props.p1Sequence} / 2 · ${props.role === 'carrier' ? 'CRYSTAL CARRIER' : 'NON-CARRIER'}`
    : phaseFour
    ? 'PHASE 4 · RAID STACK · HEAVEN & HELL'
    : phaseThree
      ? `PHASE 3 · SECTOR ${props.p3Round} / 2 · ${p3SideForPosition(props.positions[props.assignment], WORLD.center) < 0 ? 'L’URA SIDE' : 'IMAGE SIDE'} · ${props.role === 'carrier' ? 'CRYSTAL CARRIER' : 'NON-CARRIER'}`
      : phaseTwo
        ? `PHASE 2 · CYCLE ${props.p2Cycle} / 3 · ${playerP2BeamSlot >= 0 ? `BEAM ${playerP2BeamSlot + 1} / 4` : 'NO BEAM'} · ${props.role === 'carrier' ? 'CRYSTAL CARRIER' : 'NON-CARRIER'}`
        : `INTERMISSION · ${countdown || positioning ? `${props.startSlotName.toUpperCase()} START` : `PACK ${props.cycle} / 6`} · ${props.role === 'carrier' ? 'CRYSTAL CARRIER' : 'NON-CARRIER'}`
  const phaseTitle = phaseOne
    ? p1?.title ?? 'Phase 1'
    : phaseFour
    ? props.event === 'p4-countdown' ? 'Get ready for Phase 4.' : props.event === 'p4-transition' ? 'Knocked into Phase 4.' : 'Starsplinter into Heaven and Hell.'
    : p3?.title ?? p2?.title ?? (countdown ? 'Get ready.' : positioning ? 'Take your position.' : finalRecovery ? 'Recover your crystal.' : props.event === 'beam' ? 'Find the gap.' : 'Clear the crystals.')
  const p1CastElapsed = props.eventTime % P1_INTERRUPT_CAST_SECONDS
  const p1AssignedCastActive = props.p1InterruptCast === props.p1InterruptAssignment
  const p1NpcInterruptAt = p1NpcInterruptSeconds(props.p1Seed, props.p1Sequence, props.p1InterruptCast)
  const p1CastInterrupted = p1AssignedCastActive ? props.p1InterruptPressed : p1CastElapsed >= p1NpcInterruptAt
  const p1KickWindowOpen = p1AssignedCastActive && !props.p1InterruptPressed && p1CastElapsed <= P1_PLAYER_INTERRUPT_WINDOW_SECONDS
  const p1DisplayState = p1AssignedCastActive && !p1KickWindowOpen && !props.p1InterruptPressed
    ? 'red'
    : p1InterruptState(props.p1InterruptAssignment, props.p1InterruptCast)
  const tankMechanicVisible = FEATURE_FLAGS.tankRoles && props.tankMechanic.stage !== 'suspended'
  const activeTankProfile = props.profiles[props.tankAssignments[props.tankMechanic.activeTank]]
  const playerIsActiveTank = props.controlledTank === props.tankMechanic.activeTank
  const tankCallout = props.tankMechanic.stage === 'burst'
    ? playerIsActiveTank ? 'DEFENSIVE — HOLD BOSS' : 'HOLD — BURST ACTIVE'
    : props.tankMechanic.stage === 'swap'
      ? playerIsActiveTank ? 'HOLD — OTHER TANK TAUNTS' : 'OTHER TANK TAUNT'
      : props.tankMechanic.counter >= 4
        ? playerIsActiveTank ? 'LANCE NEXT — PREPARE DEFENSIVE' : 'READY TO TAUNT AFTER BURST'
        : 'BUILDING HEAVEN’S LANCE'
  const tankShieldCooling = props.controlledTank !== null && props.tankMechanic.playerShieldCooldown > 0
  const shieldUnavailable = props.controlledTank === null ? props.shieldUsed : tankShieldCooling
  return <main className="game-shell">
    <LiveActivityToast row={props.activityNotification} />
    <div className="game-top">
      <p className="eyebrow game-phase-label">{phaseLabel} · {props.gameSpeed.toFixed(2)}×</p>
      <h1>{phaseTitle}</h1>
      <div className="game-actions">{FEATURE_FLAGS.backgroundMusic && <button aria-label={props.musicMuted ? 'Enable music' : 'Disable music'} onClick={() => props.setMusicMuted(!props.musicMuted)}>{props.musicMuted ? '♫ Music off' : '♫ Music on'}</button>}{FEATURE_FLAGS.encounterSounds && <button aria-label={props.encounterSoundsEnabled ? 'Disable encounter sounds' : 'Enable encounter sounds'} onClick={() => props.setEncounterSoundsEnabled(!props.encounterSoundsEnabled)}>{props.encounterSoundsEnabled ? '🔊 Sounds on' : '🔇 Sounds off'}</button>}{props.ttsAvailable && <button aria-label={props.ttsEnabled ? 'Mute raid lead' : 'Enable raid lead'} onClick={() => props.setTtsEnabled(!props.ttsEnabled)}>{props.ttsEnabled ? '🎙 Raidlead on' : '🔇 Raidlead muted'}</button>}<button disabled={Boolean(props.wipeReason)} onClick={() => props.setPaused(!props.paused)}>{props.wipeReason ? 'Wiped' : props.paused ? 'Resume' : 'Pause'}</button><button className="secondary" onClick={props.onExit}>Exit</button></div>
    </div>
    <div className="game-layout">
      <div
        className={`arena-wrap${props.failureFlash ? ' failure-flash' : ''}${props.personalJumpProgress > 0 ? ' personal-jump' : ''}`}
        data-personal-jump={props.personalJumpProgress > 0}
        data-event={props.event}
        data-event-time={props.eventTime.toFixed(2)}
        data-active-assignment={`${props.positions[props.assignment].x},${props.positions[props.assignment].y}`}
        data-intermission-assignment={`${props.intermissionPositions[props.assignment].x},${props.intermissionPositions[props.assignment].y}`}
        data-p2-soak-assignment={`${props.p2SoakPositions[props.assignment].x},${props.p2SoakPositions[props.assignment].y}`}
        data-p2-spread-assignment={`${props.p2SpreadPositions[props.assignment].x},${props.p2SpreadPositions[props.assignment].y}`}
        data-p2-beam-assignees={props.p2BeamAssignees.join(',')}
        data-p2-beam-orbs={props.p2BeamOrbIndices.join(',')}
        data-p2-resolved-orbs={props.p2ResolvedOrbIndices.join(',')}
        data-p2-cycle={props.p2Cycle}
        data-p2-orb-return-age={props.p2OrbReturnAge.toFixed(2)}
        data-p3-assignment={`${props.p3Positions[props.assignment].x},${props.p3Positions[props.assignment].y}`}
        data-player-position={`${props.player.x},${props.player.y}`}
        data-p3-flight-origin={`${props.p3FlightOrigin.x},${props.p3FlightOrigin.y}`}
        data-p3-pool-health={props.p3PoolHealth.join(',')}
        data-p1-glaive-sets={props.p1GlaiveSets.length}
        data-p1-glaive-set-ids={props.p1GlaiveSets.map(set => set.id).join(',')}
        data-run-attribution={identityProps.runAttribution}
        data-played-name={identityProps.playerDisplayName}
        data-verified-character={identityProps.verifiedCharacterLabel ?? ''}
        data-player-profile={`${props.profiles[props.assignment].name}|${props.profiles[props.assignment].playerClass}`}
        data-tank-role={FEATURE_FLAGS.tankRoles ? props.controlledTank === null ? 'none' : `tank-${props.controlledTank + 1}` : undefined}
        data-lance-stage={FEATURE_FLAGS.tankRoles ? props.tankMechanic.stage : undefined}
        data-lance-counter={FEATURE_FLAGS.tankRoles ? props.tankMechanic.counter : undefined}
        data-lance-impact={FEATURE_FLAGS.tankRoles ? props.tankMechanic.impactIndex : undefined}
        data-active-tank={FEATURE_FLAGS.tankRoles ? props.tankAssignments[props.tankMechanic.activeTank] : undefined}
        data-tank-shield-cooldown={FEATURE_FLAGS.tankRoles ? props.tankMechanic.playerShieldCooldown.toFixed(2) : undefined}
        data-p4-player-splinter-duty={props.controlledTank === null ? p4PlayerSplinterDuty(props.assignment, props.p4Cycle, props.p4PatternSeed) : -1}
        data-p4-tank-cone-active={props.p4PlayerConeActive}
        data-p4-tank-cone-cooldown={props.p4PlayerConeCooldown.toFixed(2)}
      >
        <GameScene
          playerDisplayName={identityProps.playerDisplayName}
          verifiedCharacterLabel={identityProps.verifiedCharacterLabel}
          runAttribution={identityProps.runAttribution}
          p1Sequence={props.p1Sequence}
          p1Seed={props.p1Seed}
          p1InterruptAssignment={props.p1InterruptAssignment}
          p1InterruptCast={props.p1InterruptCast}
          p1InterruptPressed={props.p1InterruptPressed}
          p1MemoryOrder={props.p1MemoryOrder}
          p1GlaiveSets={props.p1GlaiveSets}
          p1Soaks={props.p1Soaks}
          p1SoakResolved={props.p1SoakResolved}
          p1CrystalAssignments={props.p1CrystalAssignments}
          p1CrystalCollected={props.p1CrystalCollected}
          p1WrongCrystalHeld={props.p1WrongCrystalHeld}
          p1StolenCrystalSlot={props.p1StolenCrystalSlot}
          combatProjectilesEnabled={props.combatProjectilesEnabled}
          mainProjectileFiredAt={props.mainProjectileFiredAt}
          positions={props.positions}
          intermissionPositions={props.intermissionPositions}
          p2SoakPositions={props.p2SoakPositions}
          p2SpreadPositions={props.p2SpreadPositions}
          profiles={props.profiles}
          raidStart={props.raidStart}
          p1BossOpening={props.p1BossOpening}
          movementSpeed={props.movementSpeed}
          movementBonus={props.movementBonus}
          difficulty={props.difficulty}
          paused={props.paused}
          p2Cycle={props.p2Cycle}
          p2OrbReturnAge={props.p2OrbReturnAge}
          p2BeamAssignees={props.p2BeamAssignees}
          p2BeamOrbIndices={props.p2BeamOrbIndices}
          p2ReturningOrbIndices={props.p2ReturningOrbIndices}
          p2ResolvedOrbIndices={props.p2ResolvedOrbIndices}
          p2BeamImpactAngle={props.p2BeamImpactAngle}
          onP2OrbitAngle={props.onP2OrbitAngle}
          p3Round={props.p3Round}
          p3ArchangelDuty={props.p3ArchangelDuty}
          p4Cycle={props.p4Cycle}
          p4PatternSeed={props.p4PatternSeed}
          p3PoolHealth={props.p3PoolHealth}
          onP3PoolOccupancy={props.onP3PoolOccupancy}
          onP3LightCenters={props.onP3LightCenters}
          onP3RuneContacts={props.onP3RuneContacts}
          onNpcPositions={props.onNpcPositions}
          onP4SplinterHit={props.onP4SplinterHit}
          playerTankRole={props.controlledTank}
          tankAssignments={props.tankAssignments}
          playerTankConeActive={props.p4PlayerConeActive}
          playerTankConeAngle={props.p4PlayerConeAngle}
          p3RuneOrder={props.p3RuneOrder}
          p3RuneStep={props.p3RuneStep}
          p3ResolvedRunes={props.p3ResolvedRunes}
          crystalCarriers={props.crystalCarriers}
          playerIsCrystal={props.role === 'carrier'}
          playerCrystalSpent={props.crystalSpent}
          player={props.player}
          crystal={props.crystal}
          npcCrystals={props.npcCrystals}
          npcCarrier={props.npcCarrier}
          npcCrystalAge={props.npcCrystalAge}
          playerSplinterRotation={props.playerSplinterRotation}
          personalJumpProgress={props.personalJumpProgress}
          crystalAge={props.crystalAge}
          event={props.event}
          eventTime={props.eventTime}
          beamAngles={props.beamAngles}
          npcSplinters={props.npcSplinters}
          time={props.stats.time}
          assignment={props.assignment}
          easy={props.difficulty === 'easy' || props.difficulty === 'test'}
          wipeReason={props.wipeReason}
          onCameraDirection={props.onCameraDirection}
          onZoomChange={setZoomDisplay}
        />
        <div className="score-overlay"><span>Points</span><strong>{Math.round(props.stats.score)}</strong></div>
        <aside className="test-failure-log selectable-log" aria-label={props.difficulty === 'test' ? 'Test mode recent failures' : 'Recent failures'}>
          <header><span>{props.difficulty === 'test' ? 'TEST FAILURES' : 'RECENT FAILURES'}</span><span className="failure-log-actions"><time>{props.stats.time.toFixed(1)}s</time><button type="button" aria-label={failureLogCopied ? 'Failure log copied' : 'Copy failure log'} title="Copy failure log" onClick={copyFailureLog}>{failureLogCopied ? '✓' : '📋'}</button></span></header>
          {props.mistakes.length ? <ol>{props.mistakes.slice(0, 5).map(mistake => <li key={mistake.id}><time>{mistake.time.toFixed(1)}s</time><span>{mistake.label}</span><button type="button" className="failure-help" aria-label={`Help for ${mistake.label}`} aria-expanded={failureHelpId === mistake.id} onClick={() => setFailureHelpId(current => current === mistake.id ? null : mistake.id)}>i</button>{failureHelpId === mistake.id && <small className="failure-advice" role="status">{failureAdvice(mistake.label)}</small>}</li>)}</ol> : <p>No failures yet.</p>}
        </aside>
        {props.softWipeNotice && <div className="soft-wipe-notice" role="status"><span>{props.difficulty === 'test' ? 'Test mode · run continues' : 'Strike 1 / 2 · −500 points'}</span><strong>{props.softWipeNotice}</strong><small>Practice continues</small></div>}
        {props.crystalDutyNotice && <div className="crystal-duty-notice" role="status"><span>PHASE CRYSTAL DUTY</span><strong>{props.crystalDutyNotice}</strong></div>}
        {tankMechanicVisible && <aside className={`tank-mechanic-hud stage-${props.tankMechanic.stage}`} aria-label="Heaven's Lance tank mechanic">
          <header><span>HEAVEN’S LANCE</span><strong>{props.tankMechanic.stage === 'burst' ? `${props.tankMechanic.impactIndex} / 5` : `${props.tankMechanic.counter} / 5`}</strong></header>
          <p>{tankCallout}</p>
          <small>Active: {activeTankProfile?.name ?? `Tank ${props.tankMechanic.activeTank + 1}`} · Impaled {props.tankMechanic.impaledStacks[0]} / {props.tankMechanic.impaledStacks[1]}</small>
          {props.controlledTank !== null && <small>Shield {tankShieldCooling ? `${props.tankMechanic.playerShieldCooldown.toFixed(1)}s` : 'ready'} · Taunt {keyLabel(props.keyBindings.taunt)}</small>}
        </aside>}
        {phaseFour && props.controlledTank === 0 && <aside className="tank-mechanic-hud p4-tank-duty" aria-label="Phase 4 tank cone">
          <header><span>TANK 1 · FRONTAL CONE</span><strong>{props.p4PlayerConeActive ? 'ACTIVE' : props.p4PlayerConeCooldown > 0 ? `${props.p4PlayerConeCooldown.toFixed(1)}s` : 'READY'}</strong></header>
          <p>Face the incoming adds and fire the 30-yard cone.</p>
          <small>{keyLabel(props.keyBindings.taunt)} · You will not receive Starsplinter.</small>
        </aside>}
        {phaseFour && props.controlledTank === 1 && <aside className="tank-mechanic-hud p4-tank-duty" aria-label="Phase 4 protection tank">
          <header><span>TANK 2 · PROTECTION ZONE</span><strong>FOLLOWED</strong></header>
          <p>Your position carries the yellow safe zone. Lead the raid through Heaven &amp; Hell.</p>
          <small>You will not receive Starsplinter.</small>
        </aside>}
        {phaseOne && (props.event === 'p1-memory-position' || props.event === 'p1-memory-sweep') && <div className={`rune-order p1-rune-order ${props.p1RunePanelOrientation}`} role="status"><span>MEMORY ORDER</span><div className="p1-rune-grid">{props.p1MemoryOrder.map((rune, index) => <strong className={`${props.p1FailedMemoryRune === rune ? 'failed' : props.event === 'p1-memory-sweep' && index <= Math.floor(props.eventTime / P1_MEMORY_SWEEP_SECONDS * 5) ? 'active' : ''}${rune === playerP1Rune ? ' personal' : ''}`} key={`${rune}-${index}`}><small>{index + 1}</small><b>{rune}</b></strong>)}</div></div>}
        {phaseThree && (props.event === 'p3-rune-preview' || props.event === 'p3-lattice-memory' || props.event === 'p3-light-pools' && props.eventTime >= P3_MEMORY_PANEL_SECONDS + 3 && props.eventTime < P3_MEMORY_START_SECONDS + P3_MEMORY_STEP_SECONDS * 3) && <div className="rune-order" role="status"><span>RUNE ORDER</span>{props.p3RuneOrder.map((rune, index) => <strong className={props.p3ResolvedRunes.includes(rune) ? 'done' : memoryGameActive && index === props.p3RuneStep ? 'active' : memoryGameActive && index < props.p3RuneStep ? 'done' : ''} key={`${rune}-${index}`}>{rune}</strong>)}</div>}
        {props.event === 'p2-orbs' && (props.difficulty === 'easy' || props.difficulty === 'test' || props.eventTime >= 2) && <div className={`beam-drop-counter${props.eventTime >= 2 ? ' safe' : ''}`} style={{ left: `${props.hudLayout.beam.x}%`, top: `${props.hudLayout.beam.y}%` }}>{props.eventTime < 2 ? <strong>WAIT TO DROP</strong> : <>{props.difficulty === 'easy' || props.difficulty === 'test' ? 'SAFE TO DROP · ' : ''}BEAM IN <strong>{Math.max(1, Math.ceil(P2_BEAM_SECONDS - props.eventTime))}</strong></>}</div>}
        {shouldShowP2OrbReturnCounter(props.event, props.p2OrbReturnAge) && <div className="beam-drop-counter orb-return-counter" style={{ left: `${props.hudLayout.beam.x}%`, top: `${props.hudLayout.beam.y}%` }}>{props.p2OrbReturnAge < P2_ORB_RETURN_SECONDS - P2_ORB_GLOW_LEAD_SECONDS ? <>ORBS RETURN IN <strong>{Math.max(1, Math.ceil(P2_ORB_RETURN_SECONDS - P2_ORB_GLOW_LEAD_SECONDS - props.p2OrbReturnAge))}</strong></> : props.p2OrbReturnAge < P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS ? <strong>ORBS CHARGING</strong> : <strong>ORBS RETURNING</strong>}</div>}
        {props.wipeReason && (wipeMinimized
          ? <div className="wipe-minimized" role="alert"><span>WIPED</span><strong>{props.wipeReason}</strong><button type="button" onClick={() => setWipeMinimized(false)}>Restore wipe details</button></div>
          : <div className="wipe-overlay" role="alert"><section className="wipe-dialog"><button className="wipe-minimize" type="button" aria-label="Minimize wipe details" onClick={() => setWipeMinimized(true)}>−</button><p>Raid wiped</p><h2>Wiped due to:</h2><strong>{props.wipeReason}</strong><div><button onClick={props.onRetry}>Try again</button><button className="secondary" onClick={props.onExit}>Change setup</button></div></section></div>)}
        {(props.event === 'p1-countdown' || countdown || props.event === 'p2-countdown' || props.event === 'p3-countdown' || props.event === 'p4-countdown') && <div className="start-countdown">{Math.max(1, Math.ceil(3 - props.eventTime))}</div>}
        {phaseOne && props.event === 'p1-interrupts' && <>{!p1CastInterrupted && <div className="p1-boss-cast" role="progressbar" aria-label={`Dangerous cone cast ${props.p1InterruptCast + 1}`} aria-valuemin={0} aria-valuemax={2} aria-valuenow={p1CastElapsed}><span>DANGEROUS CONE</span><i style={{ width: `${Math.min(100, p1CastElapsed / P1_INTERRUPT_CAST_SECONDS * 100)}%` }} /></div>}<div
          className={`p1-interrupt-display ${p1DisplayState}`}
          role="status"
          aria-label={`Interrupt state ${p1DisplayState}`}
        ><span>KICK ORDER</span><div>{Array.from({ length: P1_INTERRUPT_CAST_COUNT }, (_, index) => <i className={`${index === props.p1InterruptCast ? 'current ' : ''}${index === props.p1InterruptAssignment ? 'assigned' : ''}${index < props.p1InterruptCast || index === props.p1InterruptCast && p1CastInterrupted ? ' resolved' : ''}`} key={index}>{index + 1}</i>)}</div><strong>{p1AssignedCastActive && !p1KickWindowOpen && !props.p1InterruptPressed ? 'MISSED' : p1CastInterrupted ? 'INTERRUPTED' : props.p1InterruptPressed ? '✓' : p1InterruptState(props.p1InterruptAssignment, props.p1InterruptCast) === 'yellow' ? 'NEXT' : p1KickWindowOpen ? 'KICK' : 'WAIT'}</strong></div></>}
        <div className={`splinter-counter${phaseFour ? ' p4-timers' : phaseThree && props.role === 'carrier' ? ' p3-duty-counter' : phaseOne && props.event === 'p1-interrupts' ? ' p1-interrupt-counter' : ''}`} style={{ left: `${props.hudLayout.mechanic.x}%`, top: `${props.hudLayout.mechanic.y}%` }}>
          {phaseOne && p1
            ? props.event === 'p1-interrupts'
              ? <><span>INTERRUPTS</span><strong>{props.p1InterruptCast + 1} / 5</strong></>
              : <>{p1.counter} <strong>{Math.max(0, p1.duration - props.eventTime).toFixed(1)}s</strong></>
            : phaseFour
            ? props.event === 'p4-countdown'
              ? <>STARTING <strong>{Math.max(0, 3 - props.eventTime).toFixed(1)}s</strong></>
              : props.event === 'p4-transition'
              ? <><span>HEAVEN &amp; HELL <strong>{Math.max(0, P4_HEAVEN_START_SECONDS - props.eventTime).toFixed(1)}s</strong></span><span>KNOCKUP <strong>{Math.max(0, P4_KNOCKUP_SECONDS - props.eventTime).toFixed(1)}s</strong></span></>
              : <><span>HEAVEN &amp; HELL <strong>{Math.max(0, p4HeavenCountdown).toFixed(1)}s</strong></span><span>{p4SplinterActive ? <>SPLINTER <strong>{Math.min(3, Math.max(1, Math.floor((props.eventTime - p4SplinterStart) / P4_SPLINTER_INTERVAL_SECONDS) + 1))} / 3</strong></> : <>SPLINTER IN <strong>{Math.max(0, p4NextSplinterCountdown).toFixed(1)}s</strong></>}</span></>
            : p3
              ? <><span>{p3.counter} <strong>{Math.max(0, p3.duration - props.eventTime).toFixed(1)}s</strong></span>{props.role === 'carrier' && <span className={props.crystalSpent ? 'spent' : ''}>{props.crystalSpent ? 'CRYSTAL SPENT' : `CRYSTAL · DROP ${props.p3ArchangelDuty}`}</span>}</>
              : p2
                ? <>{p2PhaseTransitionRemaining !== null ? 'PHASE 3' : p2.counter} <strong>{props.event === 'p2-recover' ? Math.max(0, 6 - props.crystalAge).toFixed(1) : props.event === 'p2-wait' ? (p2PhaseTransitionRemaining ?? Math.max(0, P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - props.p2OrbReturnAge)).toFixed(1) : Math.max(0, p2.duration - props.eventTime).toFixed(1)}s</strong></>
                : countdown
                  ? <>STARTING <strong>{Math.max(0, 3 - props.eventTime).toFixed(1)}s</strong></>
                  : positioning
                    ? <>POSITIONING <strong>{Math.max(0, INTERMISSION_POSITIONING_SECONDS - props.eventTime).toFixed(1)}s</strong></>
                    : finalRecovery
                      ? <>FINAL PICKUP <strong>{Math.max(0, 2 - props.eventTime).toFixed(1)}s</strong></>
                      : <>SPLINTER SET <strong>{props.cycle}/6</strong></>}
        </div>
        {props.p1WrongCrystalDeadline !== null && <div className="crystal-countdown wrong-p1-crystal"><>DROP WRONG CRYSTAL<br /><strong>{Math.max(1, Math.ceil(props.p1WrongCrystalDeadline - props.stats.time))}</strong></></div>}
        {props.crystal && <div className="crystal-countdown" style={{ left: `${props.hudLayout.crystal.x}%`, top: `${props.hudLayout.crystal.y}%` }}>{props.event === 'p3-archangel' ? <>PROTECTION<br /><strong>{Math.max(1, Math.ceil(6 - props.eventTime))}</strong></> : <>PICK UP IN<br /><strong>{finalRecovery ? Math.max(1, Math.ceil(2 - props.eventTime)) : Math.max(1, Math.ceil(6 - props.crystalAge))}</strong></>}</div>}
        <div className={`player-health health-${healthBand(props.health)}`} style={{ left: `${props.hudLayout.playerHealth.x}%`, top: `${props.hudLayout.playerHealth.y}%` }}><div className="health-abilities" aria-label="Recovery charges"><b className={props.healthPotUsed ? 'used' : ''} title={props.healthPotUsed ? 'Health potion used until next phase' : 'Health potion ready'}>🧪 <span>{keyLabel(props.keyBindings.healthPot)}</span></b><b className={shieldUnavailable ? 'used' : ''} title={props.controlledTank !== null ? tankShieldCooling ? `Tank shield recharging for ${props.tankMechanic.playerShieldCooldown.toFixed(1)} seconds` : 'Tank shield ready' : props.shieldUsed ? 'Shield used until next phase' : 'Shield ready'}>🛡 <span>{props.controlledTank !== null && tankShieldCooling ? props.tankMechanic.playerShieldCooldown.toFixed(1) : keyLabel(props.keyBindings.shield)}</span></b></div><div className="health-track"><i style={{ width: `${props.health}%` }} /></div><span>{Math.round(props.health)}%</span></div>
        <><div className="boss-health" style={{ left: `${props.hudLayout.bossHealth.x}%`, top: `${props.hudLayout.bossHealth.y}%` }}><span>L’URA · {props.bossHealth.toFixed(1)}%{!phaseFour && props.p3Round < 2 && props.bossHealth <= 3 ? <em className="boss-health-shield"> ◈ VEIL PROTECTION</em> : null}</span><div className="boss-health-track"><i style={{ width: `${props.bossHealth}%` }} /></div><small>{phaseFour ? 'L’URA falls steadily over the 88-second phase' : !phaseFour && props.p3Round < 2 && props.bossHealth <= 3 ? 'Damage and points continue · protection ends with P3 sequence two' : 'The veil shudders with every step.'}</small></div>{props.mainCastRemaining > 0 && <div className="player-castbar main-cast" style={{ left: `${props.hudLayout.castbar.x}%`, top: `${props.hudLayout.castbar.y}%` }}><i className="main-cast-fill" style={{ animationDuration: `${MAIN_ABILITY_CAST_SECONDS / Math.max(.01, props.gameSpeed)}s`, animationPlayState: props.paused ? 'paused' : 'running' }} /><b>MAIN ABILITY · {props.mainCastRemaining.toFixed(1)}s</b></div>}</>
        <div className="controls"><span className="controls-copy">{keyLabel(props.keyBindings.forward)}/{keyLabel(props.keyBindings.left)}/{keyLabel(props.keyBindings.backward)}/{keyLabel(props.keyBindings.right)} move · {keyLabel(props.keyBindings.jump)} jump · {keyLabel(props.keyBindings.pause)} pause · left-drag look · right-drag view + face · wheel zoom · Zoom {zoomDisplay.toFixed(1)} yd · {phaseOne ? p1?.detail : phaseFour ? props.event === 'p4-countdown' ? 'Movement unlocks after the countdown and raid knockup.' : props.event === 'p4-transition' ? 'The 21-second Heaven & Hell clock is running; adds begin when the raid lands.' : p4SplinterActive ? 'Three players alternate left, right, left with Starsplinter; Heaven & Hell remains on its global timer.' : p4RelocationProgress(props.p4Cycle, props.eventTime) !== null ? 'Move with the yellow protection zone and leave the consumed quarter behind.' : props.p4Cycle >= 5 ? 'No safe quarter remains. Hold until Lura falls.' : 'Stack safely; Heaven & Hell resolves every 21 seconds.' : p3 ? p3.detail : p2 ? p2.detail : countdown ? `Wait for the timer at ${props.startSlotName}` : positioning ? props.difficulty === 'easy' || props.difficulty === 'test' ? `Follow the teal guide to Spot ${props.assignment + 1}` : `Find Spot ${props.assignment + 1}; its ring appears only when close` : finalRecovery ? 'Two seconds to recover the final crystal before the Phase 2 center jump' : props.role === 'carrier' ? `${keyLabel(props.keyBindings.crystal)} drops the crystal anywhere · move away · pick up in time` : props.cycle === 6 ? 'Final set: all 20 players marked' : 'Dodge the ten marked Starsplinters'}</span><BuildIndicator inGame /></div>
        {props.hudActionButtonsEnabled && <div className="hud-action-buttons" aria-label="HUD action buttons" style={{ left: `${props.hudLayout.actions.x}%`, top: `${props.hudLayout.actions.y}%` }}><button type="button" onClick={props.onMainAbility} disabled={props.paused || !!props.wipeReason}>Main ability <kbd>{keyLabel(props.keyBindings.mainAbility)}</kbd></button><button type="button" onClick={props.onInterrupt} disabled={props.paused || !!props.wipeReason || props.event !== 'p1-interrupts'}>Interrupt <kbd>{keyLabel(props.keyBindings.interrupt)}</kbd></button>{props.controlledTank !== null && (!phaseFour || props.controlledTank === 0) && <button type="button" onClick={props.onTankAction} disabled={props.paused || !!props.wipeReason || (phaseFour && props.p4PlayerConeCooldown > 0)}>{phaseFour ? 'Tank cone' : 'Taunt'} <kbd>{keyLabel(props.keyBindings.taunt)}</kbd></button>}<button type="button" onClick={props.onShield} disabled={props.paused || !!props.wipeReason || shieldUnavailable}>Shield <kbd>{keyLabel(props.keyBindings.shield)}</kbd></button><button type="button" onClick={props.onHealthPot} disabled={props.paused || !!props.wipeReason || props.healthPotUsed}>Health potion <kbd>{keyLabel(props.keyBindings.healthPot)}</kbd></button><button type="button" onClick={props.onDrop} disabled={props.paused || !!props.wipeReason || !!props.crystal || (!props.p1WrongCrystalHeld && (phaseOne ? !props.p1CrystalCollected : props.role !== 'carrier' || props.crystalSpent))}>Crystal drop <kbd>{keyLabel(props.keyBindings.crystal)}</kbd></button></div>}
      </div>
    </div>
  </main>
}
