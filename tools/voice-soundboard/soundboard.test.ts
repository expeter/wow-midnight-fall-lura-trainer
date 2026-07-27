import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const soundboard = readFileSync(join(process.cwd(), 'tools/voice-soundboard/index.html'), 'utf8')

describe('audio review soundboard', () => {
  it('covers the complete catalog with candidates for active cues and explicit silence elsewhere', () => {
    const cueRows = [...soundboard.matchAll(/^\s+\["([^"]+)", "[^"]+", "[^"]+", (auditions\("[^"]+", "[^"]+"\)|\[\])\],?$/gm)]
    expect(cueRows).toHaveLength(20)
    expect(cueRows.filter(([, , candidates]) => candidates.startsWith('auditions'))).toHaveLength(14)
    expect(cueRows.filter(([, , candidates]) => candidates === '[]')).toHaveLength(6)
    expect(soundboard).toContain('No effect by design')
  })

  it('ships fifteen original fine-tuning variants for the weakest mechanic cues', () => {
    const variants = [
      'laser-ion-snap', 'laser-neon-buzz', 'laser-void-sizzle',
      'splinter-glass-break', 'splinter-arc-pop', 'splinter-prism-collapse',
      'soak-deep-hum', 'soak-ward-resonance', 'soak-heartbeat-bed',
      'archangel-doom-rise', 'archangel-veil-tear', 'archangel-impact-tail',
      'ward-aegis-bloom', 'ward-crystal-shell', 'ward-holy-pulse',
    ]
    expect(variants).toHaveLength(15)
    variants.forEach(variant => {
      expect(existsSync(join(process.cwd(), 'tools/voice-soundboard/sfx', `tune-${variant}.wav`))).toBe(true)
      expect(soundboard).toContain(`tune-${variant}`)
    })
  })

  it('ships three generated mechanic-length Midnight variants for every active cue', () => {
    const midnightCues = [
      'laser-charge', 'laser-fire', 'stars-connect', 'splinter-detonate',
      'orb-return', 'personal-circle', 'soak-progress', 'soak-complete',
      'rune-match', 'archangel-charge', 'protection-active', 'add-destroyed',
      'mistake', 'wipe',
    ]
    expect(midnightCues).toHaveLength(14)
    midnightCues.forEach(cue => {
      for (const variant of ['veil', 'rift', 'abyss']) {
        expect(existsSync(join(process.cwd(), 'tools/voice-soundboard/sfx', `midnight-${cue}-${variant}.wav`))).toBe(true)
      }
    })
    expect(soundboard).toContain('"archangel-charge": 5')
    expect(soundboard).toContain('"orb-return": 1')
  })

  it('persists a pick and comment for every cue and exports one review table', () => {
    expect(soundboard).toContain('lura-sfx-row-review')
    expect(soundboard).toContain('data-pick')
    expect(soundboard).toContain('data-comment')
    expect(soundboard).toContain('| Cue | Pick | Comment |')
  })

  it('carries the approved starting feedback into the relevant rows', () => {
    expect(soundboard).toContain('"laser-fire": { pick: "laser-magical-whoosh"')
    expect(soundboard).toContain('"orb-return": { pick: "orb-arcane-laser"')
    expect(soundboard).toContain('["main-ability-release", "Main Ability cast completes", "Intentionally silent')
    expect(soundboard).toContain('"mistake": { pick: "error-pulse-fast"')
  })

  it('provides a persistent looping visual timing lab for every enabled encounter cue', () => {
    expect(soundboard).toContain('aria-label="Sound timing lab"')
    expect(soundboard).toContain('id="timing-offset"')
    expect(soundboard).toContain('id="timing-offset-number"')
    expect(soundboard).toContain('id="timing-rate"')
    expect(soundboard).toContain('lura-sfx-timing-review')
    expect(soundboard).toContain('Copy tuning')
    const timingRows = [...soundboard.matchAll(/\{ id: "([^"]+)", label: "[^"]+", sound: "[^"]+", visual: "[^"]+", moment: [^,]+, loop: [^,]+, offset: [^,]+, rate: [^ }]+ \}/g)]
    expect(timingRows.map(([, id]) => id)).toEqual([
      'laser-charge',
      'stars-connect',
      'splinter-detonate',
      'orb-return',
      'personal-circle',
      'rune-match',
      'archangel-charge',
      'protection-active',
      'mistake',
      'wipe',
    ])
  })

  it('allows exact millisecond timing offsets and keeps the number field synchronized with the slider', () => {
    expect(soundboard).toContain('id="timing-offset" type="range" min="-6000" max="1000" step="1"')
    expect(soundboard).toContain('id="timing-offset-number" type="number" min="-6000" max="1000" step="1"')
    expect(soundboard).toContain('timingOffsetNumber.value = timingOffset.value')
    expect(soundboard).toContain('timingOffset.value = timingOffsetNumber.value')
    expect(soundboard).toContain('offset: Number(timingOffsetNumber.value) / 1000')
  })

  it('fine-tunes candidate, offset, and rate against visible event and sound boundaries', () => {
    expect(soundboard).toContain('id="timing-sound"')
    expect(soundboard).toContain('id="timing-rate-number"')
    expect(soundboard).toContain('data-offset-nudge="-1"')
    expect(soundboard).toContain('data-offset-nudge="1"')
    expect(soundboard).toContain('class="timing-sound-marker"')
    expect(soundboard).toContain('timingSaved[preset.id] = { offset, rate, sound }')
    expect(soundboard).toContain('| Cue | Sound | Start offset | Playback rate |')
  })

  it('makes the complete effect library available while explaining each mechanic preview', () => {
    expect(soundboard).toContain('id="timing-mechanic-explanation"')
    expect(soundboard).toContain('const timingVisualDescriptions = {')
    expect(soundboard).toContain('Suggested for this mechanic')
    expect(soundboard).toContain('Complete sound library · ${effects.length} clips')
    expect(soundboard).toContain('effects.filter(effect => !suggestedSet.has(effect.id))')

    const explicitEffectIds = [...soundboard.matchAll(/\{ id: "([^"]+)", name: "[^"]+"/g)]
      .map(([, id]) => id)
    explicitEffectIds.forEach(id => expect(soundboard).toContain(`id: "${id}"`))
  })
})
