import { describe, expect, it } from 'vitest'
import { featureFlagsForHost, isLocalPreviewHost } from './features'

describe('feature gates', () => {
  it('recognizes loopback hosts without enabling public deployments', () => {
    expect(isLocalPreviewHost('localhost')).toBe(true)
    expect(isLocalPreviewHost('127.0.0.1')).toBe(true)
    expect(isLocalPreviewHost('[::1]')).toBe(true)
    expect(isLocalPreviewHost('expeter.github.io')).toBe(false)
  })

  it('publishes the reviewed P1 encounter and encounter sound on every host', () => {
    expect(featureFlagsForHost('localhost')).toMatchObject({
      phaseOne: true,
      encounterSounds: true,
    })
    expect(featureFlagsForHost('expeter.github.io')).toMatchObject({
      phaseOne: true,
      encounterSounds: true,
    })
  })
})
