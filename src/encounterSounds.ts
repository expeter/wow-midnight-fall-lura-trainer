import {
  P2_ORB_RETURN_GLOW_SECONDS,
  P2_ORB_RETURN_SECONDS,
  P2_BEAM_SECONDS,
  P2_SPREAD_SECONDS,
  P4_SPLINTER_DETONATION_SECONDS,
  P4_SPLINTER_INTERVAL_SECONDS,
  p3StarsTiming,
  p4SplinterStartSeconds,
  type RuneSymbol,
} from './game'
import laserWhooshUrl from '../tools/voice-soundboard/sfx/laser-magical-whoosh.wav?url'
import starsConnectUrl from '../tools/voice-soundboard/sfx/midnight-laser-fire-rift.wav?url'
import splinterDetonateUrl from '../tools/voice-soundboard/sfx/laser-prismatic-cut.wav?url'
import orbReturnUrl from '../tools/voice-soundboard/sfx/orb-arcane-laser.wav?url'
import personalCircleUrl from '../tools/voice-soundboard/sfx/success-small-bell.wav?url'
import runeClearUrl from '../tools/voice-soundboard/sfx/success-rune-clear.wav?url'
import archangelChargeUrl from '../tools/voice-soundboard/sfx/midnight-archangel-charge-veil.wav?url'
import protectionActiveUrl from '../tools/voice-soundboard/sfx/cast-crystal-spark.wav?url'
import errorPulseUrl from '../tools/voice-soundboard/sfx/error-pulse-fast.wav?url'

export type EncounterSoundName =
  | 'laser-charge'
  | 'stars-connect'
  | 'splinter-detonate'
  | 'orb-return'
  | 'personal-circle'
  | 'rune-match'
  | 'archangel-charge'
  | 'protection-active'
  | 'mistake'
  | 'wipe'

export interface EncounterSoundSpec {
  url: string
  volume: number
  playbackRate?: number
}

export const ENCOUNTER_SOUND_SPECS: Record<EncounterSoundName, EncounterSoundSpec> = {
  'laser-charge': { url: laserWhooshUrl, volume: .78, playbackRate: .5 },
  'stars-connect': { url: starsConnectUrl, volume: .72, playbackRate: 2.2 },
  'splinter-detonate': { url: splinterDetonateUrl, volume: .82, playbackRate: 2 },
  'orb-return': { url: orbReturnUrl, volume: .78 },
  'personal-circle': { url: personalCircleUrl, volume: .72 },
  'rune-match': { url: runeClearUrl, volume: .66, playbackRate: 1.08 },
  'archangel-charge': { url: archangelChargeUrl, volume: .72 },
  'protection-active': { url: protectionActiveUrl, volume: .82 },
  mistake: { url: errorPulseUrl, volume: .78, playbackRate: 1.18 },
  wipe: { url: errorPulseUrl, volume: 1, playbackRate: .82 },
}

export const LASER_CHARGE_SOUND_SECONDS = 1.86
export const INTERMISSION_BEAM_FIRE_SECONDS = 2.78
export const ORB_RETURN_SOUND_DELAY_SECONDS = 1
export const ARCHANGEL_SOUND_DELAY_SECONDS = 1
export const SPLINTER_SOUND_TRANSIENT_LEAD_SECONDS = .02
export const INTERMISSION_SPLINTER_VISUAL_END_SECONDS = 3

export interface EncounterSoundCue {
  id: string
  sound: EncounterSoundName
}

export interface EncounterSoundState {
  event: string
  eventTime: number
  cycle: number
  p2Cycle: number
  p2OrbReturnAge: number
  p3Round: number
  p3PoolHealth: number[]
  p3ResolvedRunes: RuneSymbol[]
  p4Cycle: number
  crystalOnGround: boolean
  latestMistakeId: number | null
  wipeReason: string
}

export function encounterSoundCuesForState(state: EncounterSoundState): EncounterSoundCue[] {
  const cues: EncounterSoundCue[] = []

  if (state.event === 'beam' && state.eventTime >= INTERMISSION_BEAM_FIRE_SECONDS - LASER_CHARGE_SOUND_SECONDS) {
    cues.push({ id: `intermission-${state.cycle}-laser-charge`, sound: 'laser-charge' })
  }
  if (state.event === 'splinter' && state.eventTime >= INTERMISSION_SPLINTER_VISUAL_END_SECONDS - SPLINTER_SOUND_TRANSIENT_LEAD_SECONDS) {
    cues.push({ id: `intermission-${state.cycle}-splinter-detonate`, sound: 'splinter-detonate' })
  }

  if (state.event === 'p2-orbs' && state.eventTime >= P2_BEAM_SECONDS - LASER_CHARGE_SOUND_SECONDS) {
    cues.push({ id: `p2-${state.p2Cycle}-laser-charge`, sound: 'laser-charge' })
  }
  if (state.p2OrbReturnAge >= P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + ORB_RETURN_SOUND_DELAY_SECONDS) {
    cues.push({ id: `p2-${state.p2Cycle}-orb-return`, sound: 'orb-return' })
  }
  if (state.event === 'p2-spread' && state.eventTime >= P2_SPREAD_SECONDS - .15) {
    cues.push({ id: `p2-${state.p2Cycle}-personal-circle`, sound: 'personal-circle' })
  }

  if (state.event === 'p3-light-pools') {
    const stars = p3StarsTiming(state.eventTime)
    if (stars.active && stars.localTime >= 2.5) {
      cues.push({ id: `p3-${state.p3Round}-stars-${stars.cycle}`, sound: 'stars-connect' })
    }
  } else if (state.event === 'p3-lattice-second' && state.eventTime >= 2.5) {
    cues.push({ id: `p3-${state.p3Round}-stars-second`, sound: 'stars-connect' })
  } else if (state.event === 'p3-pools-overlap' && state.eventTime >= 6.5) {
    cues.push({ id: `p3-${state.p3Round}-stars-overlap`, sound: 'stars-connect' })
  }
  state.p3ResolvedRunes.forEach(rune => {
    cues.push({ id: `p3-${state.p3Round}-rune-${rune}`, sound: 'rune-match' })
  })
  if (state.event === 'p3-archangel' && state.eventTime >= ARCHANGEL_SOUND_DELAY_SECONDS) {
    cues.push({ id: `p3-${state.p3Round}-archangel-charge`, sound: 'archangel-charge' })
    if (state.crystalOnGround) cues.push({ id: `p3-${state.p3Round}-protection-active`, sound: 'protection-active' })
  }

  if (state.event === 'p4-cycle') {
    const splinterStart = p4SplinterStartSeconds(state.p4Cycle)
    for (let ordinal = 0; ordinal < 3; ordinal += 1) {
      const detonation = splinterStart + ordinal * P4_SPLINTER_INTERVAL_SECONDS + P4_SPLINTER_DETONATION_SECONDS
      if (state.eventTime >= detonation - SPLINTER_SOUND_TRANSIENT_LEAD_SECONDS) {
        cues.push({ id: `p4-${state.p4Cycle}-splinter-${ordinal}`, sound: 'splinter-detonate' })
      }
    }
  }

  if (state.latestMistakeId !== null && !state.wipeReason) {
    cues.push({ id: `mistake-${state.latestMistakeId}`, sound: 'mistake' })
  }
  if (state.wipeReason) cues.push({ id: 'wipe', sound: 'wipe' })

  return cues
}

export function playEncounterSound(name: EncounterSoundName, channelVolume: number, gameSpeed = 1): HTMLAudioElement {
  const spec = ENCOUNTER_SOUND_SPECS[name]
  const audio = new Audio(spec.url)
  audio.preload = 'auto'
  audio.volume = Math.max(0, Math.min(1, channelVolume * spec.volume))
  audio.playbackRate = (spec.playbackRate ?? 1) * gameSpeed
  void audio.play().catch(() => { /* playback may still require a user gesture */ })
  return audio
}
