import { describe, expect, it } from 'vitest'
import { P4_SPLINTER_VOICE_LEAD_SECONDS, P4_TIMED_VOICE_LEAD_SECONDS, p4TimedVoiceCues, timedVoiceDelaySeconds, ttsCuesForState, type TtsCueState } from './audio'
import { P1_FINAL_RECOVERY_SECONDS, P2_BEAM_SECONDS, P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P2_PULL_SECONDS, P3_FINAL_SECTOR_MOVE_SECONDS, P3_MEMORY_START_SECONDS, P4_SPLINTER_DETONATION_SECONDS, P4_SPLINTER_INTERVAL_SECONDS, p4SplinterStartSeconds } from './game'

const base: TtsCueState = {
  event: 'countdown',
  eventTime: 0,
  cycle: 1,
  p2Cycle: 1,
  p2OrbReturnAge: -1,
  p3Round: 1,
  p3ArchangelDuty: null,
  p3SoaksCleared: false,
  p3MemoryComplete: false,
  p4Cycle: 1,
  p4PatternSeed: 123,
  assignment: 0,
  role: 'non-carrier',
  difficulty: 'normal',
}

describe('raid-lead TTS cues', () => {
  it('keeps Intermission dodge and crystal-drop coaching exclusive to Easy', () => {
    expect(ttsCuesForState({ ...base, event: 'beam', difficulty: 'easy' })).toContainEqual({ id: 'p1-1-dodge', text: 'Dodge' })
    expect(ttsCuesForState({ ...base, event: 'splinter', role: 'carrier', difficulty: 'easy' })).toContainEqual({ id: 'p1-1-drop', text: 'Drop crystal' })
    expect(ttsCuesForState({ ...base, event: 'beam' })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'splinter', role: 'carrier' })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'splinter' })).toEqual([])
  })

  it('counts down direct phase entries but stays silent during transitions', () => {
    for (const event of ['countdown', 'p2-countdown', 'p3-countdown', 'p4-countdown']) {
      expect(ttsCuesForState({ ...base, event, eventTime: 0 })).toContainEqual({ id: `${event}-3`, text: '3' })
      expect(ttsCuesForState({ ...base, event, eventTime: 1 })).toContainEqual({ id: `${event}-2`, text: '2' })
      expect(ttsCuesForState({ ...base, event, eventTime: 2 })).toContainEqual({ id: `${event}-1`, text: '1' })
    }
    expect(ttsCuesForState({ ...base, event: 'p2-jump' })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'p3-flight' })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'p4-transition' })).toEqual([])
  })

  it('announces each seamless phase transition exactly one second beforehand', () => {
    expect(ttsCuesForState({ ...base, event: 'p1-recover', eventTime: P1_FINAL_RECOVERY_SECONDS - 1.01 })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'p1-recover', eventTime: P1_FINAL_RECOVERY_SECONDS - 1 })).toContainEqual({ id: 'transition-p2', text: 'Phase 2' })

    const p3At = P2_NEXT_BEAM_AFTER_RESOLUTION_SECONDS - 1
    expect(ttsCuesForState({ ...base, event: 'p2-wait', p2Cycle: 3, p2OrbReturnAge: p3At - .01 }).map(cue => cue.text)).not.toContain('Phase 3')
    const p3Transition = ttsCuesForState({ ...base, event: 'p2-wait', p2Cycle: 3, p2OrbReturnAge: p3At })
    expect(p3Transition).toContainEqual({ id: 'transition-p3', text: 'Phase 3' })
    expect(p3Transition).toContainEqual({ id: 'transition-p3-soak-crystal', text: 'Soak crystal' })
    expect(ttsCuesForState({ ...base, event: 'p2-wait', p2Cycle: 2, p2OrbReturnAge: p3At })).not.toContainEqual({ id: 'transition-p3', text: 'Phase 3' })

    const p4At = P3_FINAL_SECTOR_MOVE_SECONDS - 1
    expect(ttsCuesForState({ ...base, event: 'p3-sector-move', p3Round: 2, eventTime: p4At - .01 }).map(cue => cue.text)).not.toContain('Phase 4 stack')
    expect(ttsCuesForState({ ...base, event: 'p3-sector-move', p3Round: 2, eventTime: p4At })).toContainEqual({ id: 'transition-p4-stack', text: 'Phase 4 stack' })
    expect(ttsCuesForState({ ...base, event: 'p3-sector-move', p3Round: 1, eventTime: p4At }).map(cue => cue.text)).not.toContain('Phase 4 stack')
  })

  it('times P2 soak, carrier drop, spread, and orb-return dodge calls', () => {
    expect(ttsCuesForState({ ...base, event: 'p2-orbs' }).map(cue => cue.text)).toEqual(['Soak beam'])
    expect(ttsCuesForState({ ...base, event: 'p2-orbs', eventTime: P2_BEAM_SECONDS - 3, role: 'carrier' }).map(cue => cue.text)).toEqual(['Soak beam', 'Drop crystal'])
    expect(ttsCuesForState({ ...base, event: 'p2-pull', eventTime: P2_PULL_SECONDS - 1.01 }).map(cue => cue.text)).not.toContain('Spread')
    expect(ttsCuesForState({ ...base, event: 'p2-pull', eventTime: P2_PULL_SECONDS - 1 }).map(cue => cue.text)).toContain('Spread')
    expect(ttsCuesForState({ ...base, event: 'p2-spread' }).map(cue => cue.text)).not.toContain('Spread')
    const dodgeAt = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS - 3
    expect(ttsCuesForState({ ...base, event: 'p2-fetch', p2OrbReturnAge: dodgeAt - .01 }).map(cue => cue.text)).not.toContain('Dodge')
    expect(ttsCuesForState({ ...base, event: 'p2-fetch', p2OrbReturnAge: dodgeAt }).map(cue => cue.text)).toContain('Dodge')
  })

  it('calls P3 Soaks, memory, assigned crystal drop, and movement', () => {
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools' }).map(cue => cue.text)).toEqual(['Soaks'])
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools', eventTime: P3_MEMORY_START_SECONDS - 1.01 }).map(cue => cue.text)).toEqual(['Soaks'])
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools', eventTime: P3_MEMORY_START_SECONDS - 1 }).map(cue => cue.text)).toEqual(['Soaks', 'Memory game'])
    expect(ttsCuesForState({ ...base, event: 'p3-archangel', role: 'carrier', p3ArchangelDuty: 1 }).map(cue => cue.text)).toEqual(['Drop crystal'])
    expect(ttsCuesForState({ ...base, event: 'p3-archangel', role: 'carrier', p3ArchangelDuty: 2 })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'p3-archangel', eventTime: 4.99 }).map(cue => cue.text)).not.toContain('Move')
    expect(ttsCuesForState({ ...base, event: 'p3-archangel', eventTime: 5 }).map(cue => cue.text)).toContain('Move')
  })

  it('confirms completed P3 mechanics and calls the stack three seconds before Archangel', () => {
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools', p3SoaksCleared: true }).map(cue => cue.text)).toEqual(['Soaks', 'Soaks cleared'])
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools', p3MemoryComplete: true }).map(cue => cue.text)).toEqual(['Soaks', 'Memory game done'])
    expect(ttsCuesForState({ ...base, event: 'p3-archangel-position', eventTime: .99 }).map(cue => cue.text)).not.toContain('Stack')
    expect(ttsCuesForState({ ...base, event: 'p3-archangel-position', eventTime: 1 }).map(cue => cue.text)).toContain('Stack')
  })

  it('schedules every P4 direction and movement on an exact shared rhythm', () => {
    const start = p4SplinterStartSeconds(base.p4Cycle)
    const finalEnd = start + P4_SPLINTER_INTERVAL_SECONDS * 2 + P4_SPLINTER_DETONATION_SECONDS
    const cues = p4TimedVoiceCues(base.p4Cycle)
    expect(P4_TIMED_VOICE_LEAD_SECONDS).toBe(1)
    expect(P4_SPLINTER_VOICE_LEAD_SECONDS).toBe(0)
    expect(cues.map(cue => cue.clip)).toEqual(['left', 'right', 'left', 'move'])
    expect(cues.slice(0, 3).map(cue => cue.at)).toEqual([
      start,
      start + P4_SPLINTER_INTERVAL_SECONDS,
      start + P4_SPLINTER_INTERVAL_SECONDS * 2,
    ])
    expect(cues[1].at - cues[0].at).toBeCloseTo(P4_SPLINTER_INTERVAL_SECONDS)
    expect(cues[2].at - cues[1].at).toBeCloseTo(P4_SPLINTER_INTERVAL_SECONDS)
    expect(cues[3].at).toBeCloseTo(finalEnd - 1)
    expect(timedVoiceDelaySeconds(cues[1].at, cues[0].at, 1)).toBeCloseTo(P4_SPLINTER_INTERVAL_SECONDS)
    expect(timedVoiceDelaySeconds(cues[1].at, cues[0].at, 2.5)).toBeCloseTo(P4_SPLINTER_INTERVAL_SECONDS / 2.5)
    expect(timedVoiceDelaySeconds(cues[2].at, cues[1].at - .25, 1)).toBeCloseTo(P4_SPLINTER_INTERVAL_SECONDS + .25)
    expect(ttsCuesForState({ ...base, event: 'p4-cycle', eventTime: finalEnd })).toEqual([])
  })
})
