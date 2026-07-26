import { describe, expect, it } from 'vitest'
import soundboardHtml from '../tools/voice-soundboard/index.html?raw'

const voices = ['slt', 'rms', 'awb', 'kal', 'kal16']
const words = ['left', 'right', 'move']
const clips = import.meta.glob('../tools/voice-soundboard/audio/*.wav', {
  eager: true,
  query: '?url',
  import: 'default',
})

describe('local voice soundboard', () => {
  it('ships every selectable voice command', () => {
    const filenames = Object.keys(clips)
    expect(filenames).toHaveLength(voices.length * words.length)
    for (const voice of voices) {
      for (const word of words) {
        expect(filenames.some(filename => filename.endsWith(`/${voice}-${word}.wav`))).toBe(true)
      }
    }
  })

  it('exposes all candidates and schedules the rhythm from one audio-clock anchor', () => {
    voices.forEach(voice => expect(soundboardHtml).toContain(`id: "${voice}"`))
    expect(soundboardHtml).toContain('const start = ctx.currentTime + .08')
    expect(soundboardHtml).toContain('source.start(start + index)')
    expect(soundboardHtml).toContain('name="preferred"')
    expect(soundboardHtml).toContain('lura-voice-notes')
  })
})
