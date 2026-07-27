export type HealthBand = 'healthy' | 'wounded' | 'critical'

export interface HealthTarget {
  value: number
  holdSeconds: number
}

export function healthBand(health: number): HealthBand {
  if (health > 75) return 'healthy'
  if (health >= 30) return 'wounded'
  return 'critical'
}

export function randomHealthTarget(random = Math.random): HealthTarget {
  const roll = random()
  if (roll < .24) return { value: 18 + random() * 6, holdSeconds: 2.5 + random() * 3 }
  if (roll < .68) return { value: 32 + random() * 42, holdSeconds: .8 + random() * 1.8 }
  return { value: 77 + random() * 23, holdSeconds: .8 + random() * 1.8 }
}

export function approachHealthTarget(current: number, target: number, deltaSeconds: number, rate = 24): number {
  const step = Math.max(0, deltaSeconds) * rate
  if (Math.abs(target - current) <= step) return target
  return Math.max(0, Math.min(100, current + Math.sign(target - current) * step))
}

export function unusedRecoveryPenalty(difficulty: string): number {
  return difficulty.trim().toLowerCase() === 'hard' ? 50 : 0
}
