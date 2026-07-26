import { describe, expect, it } from 'vitest'
import { P2_BEAM_SECONDS, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P3_POOL_HEALTH, P4_SPLINTER_DETONATION_SECONDS, p4SplinterStartSeconds } from './game'
import { ARCHANGEL_SOUND_DELAY_SECONDS, encounterSoundCuesForState, ENCOUNTER_SOUND_SPECS, INTERMISSION_BEAM_FIRE_SECONDS, INTERMISSION_SPLINTER_VISUAL_END_SECONDS, LASER_CHARGE_SOUND_SECONDS, ORB_RETURN_SOUND_DELAY_SECONDS, SPLINTER_SOUND_TRANSIENT_LEAD_SECONDS } from './encounterSounds'

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
    expect(ENCOUNTER_SOUND_SPECS['laser-charge'].playbackRate).toBe(.5)
    expect(ENCOUNTER_SOUND_SPECS['stars-connect'].volume).toBe(.72)
    expect(ENCOUNTER_SOUND_SPECS['stars-connect'].playbackRate).toBe(2.2)
    expect(ENCOUNTER_SOUND_SPECS['splinter-detonate'].playbackRate).toBe(2)
    expect(ENCOUNTER_SOUND_SPECS.mistake.playbackRate).toBeGreaterThan(1)
  })

  it('starts the doubled Intermission beam charge so it ends when the beam fires', () => {
    const start = INTERMISSION_BEAM_FIRE_SECONDS - LASER_CHARGE_SOUND_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'beam', eventTime: start - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'beam', eventTime: start })).toContainEqual(expect.objectContaining({ sound: 'laser-charge' }))
  })

  it('aligns the Starsplinter transient with each phase visual disappearing', () => {
    const intermissionSoundAt = INTERMISSION_SPLINTER_VISUAL_END_SECONDS - SPLINTER_SOUND_TRANSIENT_LEAD_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: intermissionSoundAt - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: intermissionSoundAt }).map(cue => cue.sound)).toEqual(['splinter-detonate'])

    const p4SoundAt = p4SplinterStartSeconds(1) + P4_SPLINTER_DETONATION_SECONDS - SPLINTER_SOUND_TRANSIENT_LEAD_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: p4SoundAt - .01 }).some(cue => cue.sound === 'splinter-detonate')).toBe(false)
    expect(encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: p4SoundAt }).filter(cue => cue.sound === 'splinter-detonate')).toHaveLength(1)
  })

  it('ends the doubled P2 beam charge at cross-beam resolution instead of its appearance', () => {
    const start = P2_BEAM_SECONDS - LASER_CHARGE_SOUND_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p2-orbs', eventTime: start - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p2-orbs', eventTime: start })).toContainEqual(expect.objectContaining({ sound: 'laser-charge' }))
  })

  it('delays the orb-return sound until one second into the inward flight', () => {
    const soundAt = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + ORB_RETURN_SOUND_DELAY_SECONDS
    const before = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: soundAt - .01 })
    const during = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: soundAt })
    expect(before.some(cue => cue.sound === 'orb-return')).toBe(false)
    expect(during.some(cue => cue.sound === 'orb-return')).toBe(true)
  })

  it('keeps completed P3 Soaks silent while tracking rune matches', () => {
    const cues = encounterSoundCuesForState({
      ...base,
      event: 'p3-light-pools',
      p3PoolHealth: [0, 0, P3_POOL_HEALTH, P3_POOL_HEALTH, P3_POOL_HEALTH, P3_POOL_HEALTH],
      p3ResolvedRunes: ['T'],
    })
    expect(cues.some(cue => cue.id.includes('soaks'))).toBe(false)
    expect(cues).toContainEqual(expect.objectContaining({ id: 'p3-1-rune-T', sound: 'rune-match' }))
  })

  it('gives each P4 Starsplinter its own detonation cue', () => {
    const start = p4SplinterStartSeconds(1)
    const first = encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: start + P4_SPLINTER_DETONATION_SECONDS })
    expect(first.filter(cue => cue.sound === 'splinter-detonate')).toHaveLength(1)
  })

  it('keeps disappearing P4 adds silent even while Starsplinters resolve', () => {
    const cues = encounterSoundCuesForState({
      ...base,
      event: 'p4-cycle',
      eventTime: p4SplinterStartSeconds(1) + P4_SPLINTER_DETONATION_SECONDS,
    })
    expect(cues.map(cue => cue.sound)).toEqual(['splinter-detonate'])
  })

  it('delays Dark Archangel by one second so its five-second cue ends on impact', () => {
    expect(encounterSoundCuesForState({ ...base, event: 'p3-archangel', eventTime: ARCHANGEL_SOUND_DELAY_SECONDS - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p3-archangel', eventTime: ARCHANGEL_SOUND_DELAY_SECONDS }))
      .toContainEqual(expect.objectContaining({ sound: 'archangel-charge' }))
  })
})
