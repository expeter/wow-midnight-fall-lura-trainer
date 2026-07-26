import { describe, expect, it } from 'vitest'
import { combatProjectileHeight, combatProjectileImpactPoint, combatProjectilePosition, combatProjectileShape, combatProjectileTargetHeight, combatProjectileTravelSeconds, combatProjectilesActive, COMBAT_PROJECTILE_TRAVEL_SECONDS, MAX_VISIBLE_NPC_PROJECTILES, NPC_PROJECTILE_MAX_INTERVAL_SECONDS, NPC_PROJECTILE_MIN_INTERVAL_SECONDS, npcProjectileIntervalSeconds, npcProjectileShots } from './projectiles'

describe('cosmetic combat projectiles', () => {
  it('uses recognizable class-specific attacks', () => {
    expect(combatProjectileShape('mage', 0)).toBe('firebolt')
    expect(combatProjectileShape('mage', 1)).toBe('frostbolt')
    expect(combatProjectileShape('shaman')).toBe('lightning')
    expect(combatProjectileShape('hunter')).toBe('arrow')
    expect(combatProjectileShape('warrior')).toBe('spear')
    expect(combatProjectileShape('warlock')).toBe('shadowbolt')
  })

  it('travels from the caster to the boss only after a shot exists', () => {
    expect(combatProjectilePosition({ x: 10, y: 20 }, { x: 110, y: 70 }, 0)).toEqual({ x: 10, y: 20 })
    expect(combatProjectilePosition({ x: 10, y: 20 }, { x: 110, y: 70 }, COMBAT_PROJECTILE_TRAVEL_SECONDS)).toEqual({ x: 110, y: 70 })
  })

  it('makes arrows slowest, thrown weapons intermediate, and magical bolts fastest', () => {
    expect(combatProjectileTravelSeconds('arrow')).toBeGreaterThan(combatProjectileTravelSeconds('spear'))
    expect(combatProjectileTravelSeconds('spear')).toBeGreaterThan(combatProjectileTravelSeconds('firebolt'))
    expect(combatProjectileTravelSeconds('lightning')).toBeGreaterThan(combatProjectileTravelSeconds('frostbolt'))
  })

  it('fans impacts across the boss surface instead of aiming through its center', () => {
    const center = { x: 480, y: 270 }
    const first = combatProjectileImpactPoint({ x: 400, y: 350 }, center, 16, 1)
    const second = combatProjectileImpactPoint({ x: 400, y: 350 }, center, 16, 2)
    expect(Math.hypot(first.x - center.x, first.y - center.y)).toBeCloseTo(16)
    expect(first).not.toEqual(second)
  })

  it('aims at varied torso heights without making magical attacks fall downward', () => {
    const torsoHeights = Array.from({ length: 12 }, (_, shot) => combatProjectileTargetHeight(16, shot))
    expect(Math.min(...torsoHeights)).toBeGreaterThan(12)
    expect(Math.max(...torsoHeights)).toBeLessThan(19)
    const targetHeight = combatProjectileTargetHeight(16, 4)
    const directMidpoint = 7 + (targetHeight - 7) * .5
    expect(combatProjectileHeight('lightning', .5, targetHeight, 4)).toBeCloseTo(directMidpoint)
    expect(combatProjectileHeight('arrow', .5, targetHeight, 4)).toBeGreaterThan(directMidpoint)
  })

  it('gives every NPC its own one-to-three-second attack cadence', () => {
    const intervals = Array.from({ length: 19 }, (_, npcOrdinal) => npcProjectileIntervalSeconds(npcOrdinal))
    expect(Math.min(...intervals)).toBeGreaterThanOrEqual(NPC_PROJECTILE_MIN_INTERVAL_SECONDS)
    expect(Math.max(...intervals)).toBeLessThanOrEqual(NPC_PROJECTILE_MAX_INTERVAL_SECONDS)
    for (let npcOrdinal = 0; npcOrdinal < 19; npcOrdinal += 1) {
      const visibleAtLeastOnce = Array.from({ length: 121 }, (_, step) => npcProjectileShots(step * .025, 19))
        .some(shots => shots.some(shot => shot.npcOrdinal === npcOrdinal))
      expect(visibleAtLeastOnce).toBe(true)
    }
  })

  it('caps the ambient NPC stream and pauses it during transitions', () => {
    expect(npcProjectileShots(10, 19).length).toBeLessThanOrEqual(MAX_VISIBLE_NPC_PROJECTILES)
    expect(new Set(npcProjectileShots(10, 19).map(shot => shot.npcOrdinal)).size).toBe(npcProjectileShots(10, 19).length)
    expect(combatProjectilesActive('beam')).toBe(true)
    expect(combatProjectilesActive('p3-flight')).toBe(false)
    expect(combatProjectilesActive('p4-countdown')).toBe(false)
  })

  it('keeps transition suppression scoped to ambient NPC shots', () => {
    expect(combatProjectilesActive('countdown')).toBe(false)
    expect(combatProjectilesActive('positioning')).toBe(false)
  })
})
