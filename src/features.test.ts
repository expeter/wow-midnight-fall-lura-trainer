import { describe, expect, it } from 'vitest'
import { featureFlagsForHost, isLocalPreviewHost } from './features'

describe('local preview feature gates', () => {
  it('recognizes loopback hosts without enabling public deployments', () => {
    expect(isLocalPreviewHost('localhost')).toBe(true)
    expect(isLocalPreviewHost('127.0.0.1')).toBe(true)
    expect(isLocalPreviewHost('[::1]')).toBe(true)
    expect(isLocalPreviewHost('expeter.github.io')).toBe(false)
  })

  it('keeps unfinished P1 local while publishing the reviewed encounter sound', () => {
    expect(featureFlagsForHost('localhost')).toMatchObject({
      phaseOne: true,
      encounterSounds: true,
    })
    expect(featureFlagsForHost('expeter.github.io')).toMatchObject({
      phaseOne: false,
      encounterSounds: true,
    })
  })
})
