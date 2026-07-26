import { describe, expect, it } from 'vitest'
import { P2_ORB_RETURN_GLOW_SECONDS, P2_ORB_RETURN_SECONDS, P3_POOL_HEALTH, P4_SPLINTER_DETONATION_SECONDS, p4SplinterStartSeconds } from './game'
import { encounterSoundCuesForState, ENCOUNTER_SOUND_SPECS } from './encounterSounds'

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
  p4DestroyedBoxCount: 0,
  crystalOnGround: false,
  latestMistakeId: null,
  wipeReason: '',
}

describe('encounter sound cues', () => {
  it('uses the approved production transformations', () => {
    expect(ENCOUNTER_SOUND_SPECS['stars-connect'].volume).toBe(.9)
    expect(ENCOUNTER_SOUND_SPECS['splinter-detonate'].playbackRate).toBe(2)
    expect(ENCOUNTER_SOUND_SPECS['add-destroyed'].volume).toBe(.5)
    expect(ENCOUNTER_SOUND_SPECS.mistake.playbackRate).toBeGreaterThan(1)
  })

  it('synchronizes intermission beam and Starsplinter sounds', () => {
    expect(encounterSoundCuesForState({ ...base, event: 'beam' }).map(cue => cue.sound)).toEqual(['laser-charge'])
    expect(encounterSoundCuesForState({ ...base, event: 'beam', eventTime: 2.78 }).map(cue => cue.sound)).toEqual(['laser-charge', 'laser-fire'])
    expect(encounterSoundCuesForState({ ...base, event: 'splinter', eventTime: 2.65 }).map(cue => cue.sound)).toEqual(['splinter-detonate'])
  })

  it('fires the orb-return sound when the inward movement begins', () => {
    const before = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS - .01 })
    const during = encounterSoundCuesForState({ ...base, event: 'p2-wait', p2OrbReturnAge: P2_ORB_RETURN_SECONDS + P2_ORB_RETURN_GLOW_SECONDS })
    expect(before.some(cue => cue.sound === 'orb-return')).toBe(false)
    expect(during.some(cue => cue.sound === 'orb-return')).toBe(true)
  })

  it('tracks completed P3 Soaks and runes without replay-dependent state', () => {
    const cues = encounterSoundCuesForState({
      ...base,
      event: 'p3-light-pools',
      p3PoolHealth: [0, 0, P3_POOL_HEALTH, P3_POOL_HEALTH, P3_POOL_HEALTH, P3_POOL_HEALTH],
      p3ResolvedRunes: ['T'],
    })
    expect(cues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'p3-1-soaks-2', sound: 'soak-complete' }),
      expect.objectContaining({ id: 'p3-1-rune-T', sound: 'rune-match' }),
    ]))
  })

  it('gives each P4 Starsplinter its own detonation cue', () => {
    const start = p4SplinterStartSeconds(1)
    const first = encounterSoundCuesForState({ ...base, event: 'p4-cycle', eventTime: start + P4_SPLINTER_DETONATION_SECONDS })
    expect(first.filter(cue => cue.sound === 'splinter-detonate')).toHaveLength(1)
  })

  it('plays one cue for each newly destroyed P4 add', () => {
    const cues = encounterSoundCuesForState({ ...base, event: 'p4-cycle', p4DestroyedBoxCount: 2 })
    expect(cues).toContainEqual({ id: 'p4-add-destroyed-2', sound: 'add-destroyed' })
  })
})
