import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const soundboard = readFileSync(join(process.cwd(), 'tools/voice-soundboard/index.html'), 'utf8')

describe('audio review soundboard', () => {
  it('covers the complete sound cue catalog with four candidates per row', () => {
    const cueRows = [...soundboard.matchAll(/^\s+\["([^"]+)", "[^"]+", "[^"]+", \[([^\]]+)\]\],?$/gm)]
    expect(cueRows).toHaveLength(20)
    cueRows.forEach(([, , candidates]) => {
      expect([...candidates.matchAll(/"[^"]+"/g)]).toHaveLength(4)
    })
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
    expect(soundboard).toContain('"main-ability-release": { pick: "cast-light-loud"')
    expect(soundboard).toContain('"mistake": { pick: "error-pulse-fast"')
  })
})
