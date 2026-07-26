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

  it('ignores early spam and allows one queued cast in the final 0.1 second window', () => {
    const casting = requestMainAbilityCast(idleMainAbilityCast())
    const ignoredSpam = requestMainAbilityCast(requestMainAbilityCast(casting))
    expect(ignoredSpam.queued).toBe(false)
    const queueWindow = advanceMainAbilityCast(ignoredSpam, .91).state
    const queuedOnce = requestMainAbilityCast(queueWindow)
    const queuedRepeatedly = requestMainAbilityCast(requestMainAbilityCast(queuedOnce))
    expect(queuedRepeatedly.queued).toBe(true)
    const first = advanceMainAbilityCast(queuedRepeatedly, .09)
    expect(first.completed).toBe(1)
    expect(first.state).toMatchObject({ phase: 'cooldown', queued: true })
    expect(first.state.remaining).toBeCloseTo(.1)
    const secondStarted = advanceMainAbilityCast(first.state, .1)
    expect(secondStarted.state).toMatchObject({ phase: 'casting', remaining: 1, queued: false })
  })
})
