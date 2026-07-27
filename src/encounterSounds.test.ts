import { describe, expect, it } from 'vitest'
import { P2_BEAM_SECONDS, P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P2_ORB_RETURN_TRAVEL_SECONDS, P3_POOL_HEALTH, P4_SPLINTER_DETONATION_SECONDS, p4SplinterStartSeconds } from './game'
import { ARCHANGEL_SOUND_START_OFFSET_SECONDS, encounterSoundCuesForState, ENCOUNTER_SOUND_SPECS, INTERMISSION_BEAM_VISUAL_END_SECONDS, INTERMISSION_SPLINTER_VISUAL_END_SECONDS, LASER_CHARGE_START_OFFSET_SECONDS, ORB_RETURN_SOUND_START_OFFSET_SECONDS, SPLINTER_SOUND_START_OFFSET_SECONDS, STARS_CONNECT_START_OFFSET_SECONDS } from './encounterSounds'

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
    expect(ENCOUNTER_SOUND_SPECS['splinter-detonate'].startOffsetMs).toBe(-240)
    expect(ENCOUNTER_SOUND_SPECS['personal-circle'].startOffsetMs).toBe(-70)
    expect(ENCOUNTER_SOUND_SPECS['archangel-charge'].playbackRate).toBe(1.01)
    expect(ENCOUNTER_SOUND_SPECS['archangel-charge'].startOffsetMs).toBe(125)
    expect(ENCOUNTER_SOUND_SPECS['protection-active'].playbackRate).toBe(1.2)
    expect(ENCOUNTER_SOUND_SPECS.mistake.playbackRate).toBeGreaterThan(1)
  })

  it('contains the Intermission beam sound within the beam mechanic', () => {
    const soundAt = INTERMISSION_BEAM_VISUAL_END_SECONDS + LASER_CHARGE_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'beam', eventTime: soundAt - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'beam', eventTime: soundAt }))
      .toContainEqual(expect.objectContaining({ sound: 'laser-charge' }))
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: 0 }).some(cue => cue.sound === 'laser-charge')).toBe(false)
  })

  it('aligns the Starsplinter transient with each phase visual disappearing', () => {
    const intermissionSoundAt = INTERMISSION_SPLINTER_VISUAL_END_SECONDS + SPLINTER_SOUND_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: intermissionSoundAt - .01 }).some(cue => cue.sound === 'splinter-detonate')).toBe(false)
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: intermissionSoundAt }).map(cue => cue.sound))
      .toContain('splinter-detonate')

    const p4SoundAt = p4SplinterStartSeconds(1) + P4_SPLINTER_DETONATION_SECONDS + SPLINTER_SOUND_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: p4SoundAt - .01 }).some(cue => cue.sound === 'splinter-detonate')).toBe(false)
    expect(encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: p4SoundAt }).filter(cue => cue.sound === 'splinter-detonate')).toHaveLength(1)
  })

  it('contains the P2 beam sound within the cross-beam mechanic', () => {
    const soundAt = P2_BEAM_SECONDS + LASER_CHARGE_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p2-orbs', eventTime: soundAt - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p2-orbs', eventTime: soundAt }))
      .toContainEqual(expect.objectContaining({ sound: 'laser-charge' }))
    expect(encounterSoundCuesForState({ ...base, event: 'p2-pull', p2OrbReturnAge: 0 }).some(cue => cue.sound === 'laser-charge')).toBe(false)
  })

  it('starts the orb-return cue 271ms before the orbs reach L’ura', () => {
    const soundAt = P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS + P2_ORB_RETURN_TRAVEL_SECONDS + ORB_RETURN_SOUND_START_OFFSET_SECONDS
    const before = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: soundAt - .01 })
    const during = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: soundAt })
    expect(before.some(cue => cue.sound === 'orb-return')).toBe(false)
    expect(during.some(cue => cue.sound === 'orb-return')).toBe(true)
  })

  it('starts the Stars connection pop 95ms before each lattice appears', () => {
    const soundAt = 2.5 + STARS_CONNECT_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p3-lattice-second', eventTime: soundAt - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p3-lattice-second', eventTime: soundAt }))
      .toContainEqual(expect.objectContaining({ sound: 'stars-connect' }))
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

  it('plays Dark Archangel 125ms after impact in the following movement event', () => {
    const soundAt = ARCHANGEL_SOUND_START_OFFSET_SECONDS
    expect(encounterSoundCuesForState({ ...base, event: 'p3-archangel', eventTime: 6 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p3-sector-move', eventTime: soundAt - .01 })).toEqual([])
    expect(encounterSoundCuesForState({ ...base, event: 'p3-sector-move', eventTime: soundAt }))
      .toContainEqual(expect.objectContaining({ sound: 'archangel-charge' }))
  })

  it('plays protection immediately when the crystal bubble appears', () => {
    expect(encounterSoundCuesForState({ ...base, event: 'p3-archangel', crystalOnGround: true }))
      .toContainEqual(expect.objectContaining({ sound: 'protection-active' }))
  })
})
