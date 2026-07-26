import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const soundboard = readFileSync(join(process.cwd(), 'tools/voice-soundboard/index.html'), 'utf8')

describe('audio review soundboard', () => {
  it('covers the complete catalog with four candidates for active cues and explicit silence elsewhere', () => {
    const cueRows = [...soundboard.matchAll(/^\s+\["([^"]+)", "[^"]+", "[^"]+", (auditions\("[^"]+", "[^"]+"\)|\[\])\],?$/gm)]
    expect(cueRows).toHaveLength(20)
    expect(cueRows.filter(([, , candidates]) => candidates.startsWith('auditions'))).toHaveLength(14)
    expect(cueRows.filter(([, , candidates]) => candidates === '[]')).toHaveLength(6)
    expect(soundboard).toContain('No effect by design')
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
})
