import { describe, expect, it } from 'vitest'
import { ttsCuesForState, type TtsCueState } from './audio'
import { P2_BEAM_SECONDS, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P3_MEMORY_START_SECONDS, P4_SPLINTER_DETONATION_SECONDS, P4_SPLINTER_INTERVAL_SECONDS, p4PlayerSplinterDuty, p4SplinterStartSeconds } from './game'

const base: TtsCueState = {
  event: 'countdown',
  eventTime: 0,
  cycle: 1,
  p2Cycle: 1,
  p2OrbReturnAge: -1,
  p3Round: 1,
  p3ArchangelDuty: null,
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

  it('times P2 soak, carrier drop, spread, and orb-return dodge calls', () => {
    expect(ttsCuesForState({ ...base, event: 'p2-orbs' }).map(cue => cue.text)).toEqual(['Soak beam'])
    expect(ttsCuesForState({ ...base, event: 'p2-orbs', eventTime: P2_BEAM_SECONDS - 3, role: 'carrier' }).map(cue => cue.text)).toEqual(['Soak beam', 'Drop crystal'])
    expect(ttsCuesForState({ ...base, event: 'p2-spread' }).map(cue => cue.text)).toContain('Spread')
    const dodgeAt = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS - 3
    expect(ttsCuesForState({ ...base, event: 'p2-fetch', p2OrbReturnAge: dodgeAt - .01 }).map(cue => cue.text)).not.toContain('Dodge')
    expect(ttsCuesForState({ ...base, event: 'p2-fetch', p2OrbReturnAge: dodgeAt }).map(cue => cue.text)).toContain('Dodge')
  })

  it('calls P3 Soaks, memory, assigned crystal drop, and movement', () => {
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools' }).map(cue => cue.text)).toEqual(['Soaks'])
    expect(ttsCuesForState({ ...base, event: 'p3-light-pools', eventTime: P3_MEMORY_START_SECONDS }).map(cue => cue.text)).toEqual(['Soaks', 'Memory game'])
    expect(ttsCuesForState({ ...base, event: 'p3-archangel', role: 'carrier', p3ArchangelDuty: 1 }).map(cue => cue.text)).toEqual(['Drop crystal'])
    expect(ttsCuesForState({ ...base, event: 'p3-archangel', role: 'carrier', p3ArchangelDuty: 2 })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'p3-sector-move' }).map(cue => cue.text)).toEqual(['Move'])
  })

  it('calls only the player P4 splinter direction and movement after the final detonation', () => {
    const duty = p4PlayerSplinterDuty(base.assignment, base.p4Cycle, base.p4PatternSeed)
    const start = p4SplinterStartSeconds(base.p4Cycle) + duty * P4_SPLINTER_INTERVAL_SECONDS
    expect(ttsCuesForState({ ...base, event: 'p4-cycle', eventTime: start - .01 })).toEqual([])
    expect(ttsCuesForState({ ...base, event: 'p4-cycle', eventTime: start }).map(cue => cue.text)).toEqual([duty === 1 ? 'Right' : 'Left'])
    const finalEnd = p4SplinterStartSeconds(base.p4Cycle) + P4_SPLINTER_INTERVAL_SECONDS * 2 + P4_SPLINTER_DETONATION_SECONDS
    expect(ttsCuesForState({ ...base, event: 'p4-cycle', eventTime: finalEnd }).map(cue => cue.text)).toContain('Move')
  })
})
