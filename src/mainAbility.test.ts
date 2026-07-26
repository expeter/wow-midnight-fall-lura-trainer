import { describe, expect, it } from 'vitest'
import { advanceMainAbilityCast, idleMainAbilityCast, mainAbilityCastProgress, mainAbilityElapsedSeconds, requestMainAbilityCast } from './mainAbility'

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

  it('never buffers spam into another cast', () => {
    const casting = requestMainAbilityCast(idleMainAbilityCast())
    const ignoredSpam = requestMainAbilityCast(requestMainAbilityCast(casting))
    const queueWindow = advanceMainAbilityCast(ignoredSpam, .91).state
    const stillCasting = requestMainAbilityCast(requestMainAbilityCast(queueWindow))
    const first = advanceMainAbilityCast(stillCasting, .09)
    expect(first.completed).toBe(1)
    expect(first.state).toMatchObject({ phase: 'cooldown' })
    expect(first.state.remaining).toBeCloseTo(.1)
    const ignoredCooldownSpam = requestMainAbilityCast(requestMainAbilityCast(first.state))
    const settled = advanceMainAbilityCast(ignoredCooldownSpam, .1)
    expect(settled.completed).toBe(0)
    expect(settled.state).toEqual(idleMainAbilityCast())
  })

  it('fires exactly once per completed press across repeated casts', () => {
    let state = idleMainAbilityCast()
    let completed = 0
    for (let cast = 0; cast < 4; cast += 1) {
      state = requestMainAbilityCast(state)
      const result = advanceMainAbilityCast(state, 1.1)
      completed += result.completed
      state = result.state
      expect(state).toEqual(idleMainAbilityCast())
    }
    expect(completed).toBe(4)
  })

  it('uses real elapsed time for casts even when rendering frames are delayed', () => {
    const sparseFrameElapsed = mainAbilityElapsedSeconds(1_000, 1_600, 2)
    expect(sparseFrameElapsed).toBe(1.2)
    const result = advanceMainAbilityCast(requestMainAbilityCast(idleMainAbilityCast()), sparseFrameElapsed)
    expect(result.completed).toBe(1)
    expect(result.state).toEqual(idleMainAbilityCast())
  })
})
