import { describe, expect, it } from 'vitest'
import { P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P3_POOL_HEALTH, P4_SPLINTER_DETONATION_SECONDS, p4SplinterStartSeconds } from './game'
import { ACTIVE_ENCOUNTER_SOUNDS, encounterSoundCuesForState, ENCOUNTER_SOUND_SPECS, INTERMISSION_SPLINTER_VISUAL_END_SECONDS, ORB_RETURN_SOUND_START_OFFSET_SECONDS, SPLINTER_SOUND_START_OFFSET_SECONDS } from './encounterSounds'

const base = {
  event: 'countdown',
  eventTime: 0,
  cycle: 1,
  p2Cycle: 1,
  p2OrbReturnAge: -1,
  p3Round: 1,
  p3PoolHealth: Array(6).fill(P3_POOL_HEALTH),
  p3ResolvedRunes: [],
  p4Cycle: 1,
  crystalOnGround: false,
  latestMistakeId: null,
  wipeReason: '',
}

describe('encounter sound cues', () => {
  it('uses the approved production transformations', () => {
    expect(ENCOUNTER_SOUND_SPECS['laser-charge'].playbackRate).toBe(1.88)
    expect(ENCOUNTER_SOUND_SPECS['laser-charge'].startOffsetMs).toBe(-479)
    expect(ENCOUNTER_SOUND_SPECS['stars-connect'].volume).toBe(.72)
    expect(ENCOUNTER_SOUND_SPECS['stars-connect'].playbackRate).toBe(2.25)
    expect(ENCOUNTER_SOUND_SPECS['stars-connect'].startOffsetMs).toBe(-95)
    expect(ENCOUNTER_SOUND_SPECS['splinter-detonate'].playbackRate).toBe(2)
    expect(ENCOUNTER_SOUND_SPECS['splinter-detonate'].startOffsetMs).toBe(-260)
    expect(ENCOUNTER_SOUND_SPECS['splinter-detonate']).toMatchObject({
      bassBoostDb: 6,
      trebleReductionDb: 5,
    })
    expect(ENCOUNTER_SOUND_SPECS['orb-return'].bassBoostDb).toBeUndefined()
    expect(ENCOUNTER_SOUND_SPECS['personal-circle'].startOffsetMs).toBe(-70)
    expect(ENCOUNTER_SOUND_SPECS['archangel-charge'].playbackRate).toBe(1.01)
    expect(ENCOUNTER_SOUND_SPECS['archangel-charge'].startOffsetMs).toBe(125)
    expect(ENCOUNTER_SOUND_SPECS['protection-active'].playbackRate).toBe(1.2)
    expect(ENCOUNTER_SOUND_SPECS['main-ability-release']).toMatchObject({
      playbackRate: 7,
      startOffsetMs: -10,
    })
    expect(ENCOUNTER_SOUND_SPECS.mistake.playbackRate).toBeGreaterThan(1)
    expect([...ACTIVE_ENCOUNTER_SOUNDS]).toEqual(['main-ability-release'])
  })

  it('keeps the reviewed Starsplinter timing available for the soundboard but silent in play', () => {
    const intermissionSoundAt = INTERMISSION_SPLINTER_VISUAL_END_SECONDS + SPLINTER_SOUND_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: intermissionSoundAt - .01 }).some(cue => cue.sound === 'splinter-detonate')).toBe(false)
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: intermissionSoundAt })).toEqual([])

    const p4SoundAt = p4SplinterStartSeconds(1) + P4_SPLINTER_DETONATION_SECONDS + SPLINTER_SOUND_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: p4SoundAt - .01 }).some(cue => cue.sound === 'splinter-detonate')).toBe(false)
    expect(encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: p4SoundAt })).toEqual([])
  })

  it('keeps the reviewed orb-return timing available for the soundboard but silent in play', () => {
    const soundAt = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS + ORB_RETURN_SOUND_START_OFFSET_SECONDS
    const before = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: soundAt - .01 })
    const during = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: soundAt })
    expect(before.some(cue => cue.sound === 'orb-return')).toBe(false)
    expect(during).toEqual([])
  })

  it('keeps all unapproved P3 mechanic sounds silent', () => {
    const cues = encounterSoundCuesForState({
      ...base,
      event: 'p3-light-pools',
      eventTime: 10,
      p3PoolHealth: [0, 0, P3_POOL_HEALTH, P3_POOL_HEALTH, P3_POOL_HEALTH, P3_POOL_HEALTH],
      p3ResolvedRunes: ['T'],
    })
    expect(cues).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p3-archangel', crystalOnGround: true })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p3-sector-move', eventTime: 1 })).toEqual([])
  })

  it('keeps P4 Starsplinter detonations silent', () => {
    const start = p4SplinterStartSeconds(1)
    const first = encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: start + P4_SPLINTER_DETONATION_SECONDS })
    expect(first).toEqual([])
  })

  it('keeps disappearing P4 adds silent even while Starsplinters resolve', () => {
    const cues = encounterSoundCuesForState({
      ...base,
      event: 'p4-cycle',
      eventTime: p4SplinterStartSeconds(1) + P4_SPLINTER_DETONATION_SECONDS,
    })
    expect(cues).toEqual([])
  })

  it('keeps mistake and wipe effects silent', () => {
    expect(encounterSoundCuesForState({ ...base, latestMistakeId: 12 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, wipeReason: 'Failed mechanic' })).toEqual([])
  })
})
