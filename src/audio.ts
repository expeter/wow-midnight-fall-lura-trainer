import {
  P1_FINAL_RECOVERY_SECONDS,
  P2_BEAM_SECONDS,
  P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS,
  P2_ORB_RETURN_GLOW_SECONDS,
  P2_ORB_RETURN_SECONDS,
  P2_ORB_RETURN_TRAVEL_SECONDS,
  P2_PULL_SECONDS,
  P3_MEMORY_START_SECONDS,
  P3_FINAL_SECTOR_MOVE_SECONDS,
  P4_SPLINTER_DETONATION_SECONDS,
  P4_SPLINTER_INTERVAL_SECONDS,
  p4SplinterStartSeconds,
  type Role,
} from './game'

export interface TtsCue {
  id: string
  text: string
}

export interface TtsCueState {
  event: string
  eventTime: number
  cycle: number
  p2Cycle: number
  p2OrbReturnAge: number
  p3Round: number
  p3ArchangelDuty: 1 | 2 | null
  p3SoaksCleared: boolean
  p3MemoryComplete: boolean
  p4Cycle: number
  p4PatternSeed: number
  assignment: number
  role: Role
  difficulty: 'test' | 'easy' | 'normal' | 'hard'
}

export function ttsCuesForState(state: TtsCueState): TtsCue[] {
  const cues: TtsCue[] = []

  const directCountdownEvents = new Set(['countdown', 'p2-countdown', 'p3-countdown', 'p4-countdown'])
  if (directCountdownEvents.has(state.event)) {
    const count = Math.max(1, Math.ceil(3 - state.eventTime))
    cues.push({ id: `${state.event}-${count}`, text: String(count) })
  }

  if (state.difficulty === 'easy' && state.event === 'beam') cues.push({ id: `p1-${state.cycle}-dodge`, text: 'Dodge' })
  if (state.difficulty === 'easy' && state.event === 'splinter' && state.role === 'carrier') cues.push({ id: `p1-${state.cycle}-drop`, text: 'Drop crystal' })
  if (state.event === 'p1-recover' && state.eventTime >= P1_FINAL_RECOVERY_SECONDS - 1) {
    cues.push({ id: 'transition-p2', text: 'Phase 2' })
  }

  if (state.event === 'p2-orbs') {
    cues.push({ id: `p2-${state.p2Cycle}-soak`, text: 'Soak beam' })
    if (state.role === 'carrier' && state.eventTime >= P2_BEAM_SECONDS - 3) {
      cues.push({ id: `p2-${state.p2Cycle}-drop`, text: 'Drop crystal' })
    }
  }
  if (state.event === 'p2-pull' && state.eventTime >= P2_PULL_SECONDS - 1) {
    cues.push({ id: `p2-${state.p2Cycle}-spread`, text: 'Spread' })
  }
  const p2OrbImpact = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS
  if (state.event.startsWith('p2-') && state.p2OrbReturnAge >= p2OrbImpact - 3) {
    cues.push({ id: `p2-${state.p2Cycle}-dodge`, text: 'Dodge' })
  }
  if (state.event === 'p2-wait' && state.p2Cycle >= 3 && state.p2OrbReturnAge >= P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - 1) {
    cues.push({ id: 'transition-p3', text: 'Phase 3' })
    cues.push({ id: 'transition-p3-soak-crystal', text: 'Soak crystal' })
  }

  if (state.event === 'p3-light-pools') {
    cues.push({ id: `p3-${state.p3Round}-soaks`, text: 'Soaks' })
    if (state.eventTime >= P3_MEMORY_START_SECONDS - 1) cues.push({ id: `p3-${state.p3Round}-memory`, text: 'Memory game' })
  }
  if ((state.event === 'p3-light-pools' || state.event === 'p3-pools-overlap') && state.p3SoaksCleared) {
    cues.push({ id: `p3-${state.p3Round}-soaks-cleared`, text: 'Soaks cleared' })
  }
  if (state.event.startsWith('p3-') && state.p3MemoryComplete) {
    cues.push({ id: `p3-${state.p3Round}-memory-done`, text: 'Memory game done' })
  }
  if (state.event === 'p3-archangel-position' && state.eventTime >= 1) {
    cues.push({ id: `p3-${state.p3Round}-stack`, text: 'Stack' })
  }
  if (state.event === 'p3-archangel' && state.role === 'carrier' && state.p3ArchangelDuty === state.p3Round) {
    cues.push({ id: `p3-${state.p3Round}-drop`, text: 'Drop crystal' })
  }
  if (state.event === 'p3-archangel' && state.eventTime >= 5) {
    cues.push({ id: `p3-${state.p3Round}-move`, text: 'Move' })
  }
  if (state.event === 'p3-sector-move' && state.p3Round >= 2 && state.eventTime >= P3_FINAL_SECTOR_MOVE_SECONDS - 1) {
    cues.push({ id: 'transition-p4-stack', text: 'Phase 4 stack' })
  }

  if (state.event === 'p4-cycle') {
    const splinterStarts = p4SplinterStartSeconds(state.p4Cycle)
    for (const ordinal of [0, 1, 2]) {
      const callAt = splinterStarts + ordinal * P4_SPLINTER_INTERVAL_SECONDS - 1
      if (state.eventTime >= callAt) {
        cues.push({
          id: `p4-${state.p4Cycle}-splinter-${ordinal}`,
          text: ordinal === 1 ? 'Right' : 'Left',
        })
      }
    }
    const finalSplinterEnds = splinterStarts
      + P4_SPLINTER_INTERVAL_SECONDS * 2
      + P4_SPLINTER_DETONATION_SECONDS
    if (state.eventTime >= finalSplinterEnds - 1) cues.push({ id: `p4-${state.p4Cycle}-move`, text: 'Move' })
  }

  return cues
}
