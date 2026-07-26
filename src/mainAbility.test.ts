import { describe, expect, it } from 'vitest'
import { advanceMainAbilityCast, idleMainAbilityCast, mainAbilityCastProgress, requestMainAbilityCast } from './mainAbility'

describe('Main Ability cast state', () => {
  it('fills for one second and only completes at 100%', () => {
    const started = requestMainAbilityCast(idleMainAbilityCast())
    const halfway = advanceMainAbilityCast(started, .5)
    expect(halfway.completed).toBe(0)
    expect(mainAbilityCastProgress(halfway.state)).toBe(.5)
    const completed = advanceMainAbilityCast(halfway.state, .5)
    expect(completed.completed).toBe(1)
    expect(completed.state.phase).toBe('cooldown')
    expect(mainAbilityCastProgress(completed.state)).toBe(1)
  })

  it('collapses button spam into one queued cast after the 0.1 second gap', () => {
    const casting = requestMainAbilityCast(idleMainAbilityCast())
    const queuedOnce = requestMainAbilityCast(casting)
    const queuedRepeatedly = requestMainAbilityCast(requestMainAbilityCast(queuedOnce))
    expect(queuedRepeatedly.queued).toBe(true)
    const first = advanceMainAbilityCast(queuedRepeatedly, 1)
    expect(first.completed).toBe(1)
    expect(first.state).toMatchObject({ phase: 'cooldown', remaining: .1, queued: true })
    const secondStarted = advanceMainAbilityCast(first.state, .1)
    expect(secondStarted.state).toMatchObject({ phase: 'casting', remaining: 1, queued: false })
  })
})
