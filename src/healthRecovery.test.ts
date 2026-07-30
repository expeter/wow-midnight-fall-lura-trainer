import { describe, expect, it } from 'vitest'
import { approachHealthTarget, healthBand, healthChangeRate, randomHealthTarget, unusedRecoveryPenalty } from './healthRecovery'

describe('health recovery helpers', () => {
  it('uses the requested green, orange, and red health thresholds', () => {
    expect(healthBand(76)).toBe('healthy')
    expect(healthBand(75)).toBe('wounded')
    expect(healthBand(30)).toBe('wounded')
    expect(healthBand(29.9)).toBe('critical')
  })

  it('occasionally creates a held recovery window around twenty percent', () => {
    const values = [.1, .5]
    const target = randomHealthTarget(true, () => values.shift() ?? .5)
    expect(target.value).toBe(21)
    expect(target.holdSeconds).toBe(2)
  })

  it('keeps health out of red after both recovery actions are spent', () => {
    const values = [.1, .5, .5]
    expect(randomHealthTarget(false, () => values.shift() ?? .5)).toEqual({ value: 58, holdSeconds: .8 })
  })

  it('keeps ordinary combat health under pressure without entering recovery range', () => {
    const woundedValues = [.5, .5, .5]
    expect(randomHealthTarget(true, () => woundedValues.shift() ?? .5)).toEqual({ value: 58, holdSeconds: .8 })
    const healthyValues = [.9, .5, .5]
    expect(randomHealthTarget(true, () => healthyValues.shift() ?? .5)).toEqual({ value: 82, holdSeconds: .8 })
  })

  it('moves toward changing targets without overshooting', () => {
    expect(healthChangeRate(100, 20)).toBe(48)
    expect(healthChangeRate(20, 80)).toBe(24)
    expect(approachHealthTarget(100, 20, 1)).toBe(52)
    expect(approachHealthTarget(22, 20, 1)).toBe(20)
    expect(approachHealthTarget(20, 80, .5)).toBe(32)
  })

  it('requires a recovery response only on Hard', () => {
    expect(unusedRecoveryPenalty('Hard')).toBe(50)
    expect(unusedRecoveryPenalty('normal')).toBe(0)
    expect(unusedRecoveryPenalty('easy')).toBe(0)
    expect(unusedRecoveryPenalty('test')).toBe(0)
  })
})
