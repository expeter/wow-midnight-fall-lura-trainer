import { describe, expect, it } from 'vitest'
import { combatProjectilePosition, combatProjectileShape, combatProjectilesActive, COMBAT_PROJECTILE_TRAVEL_SECONDS, MAX_VISIBLE_NPC_PROJECTILES, npcProjectileShots } from './projectiles'

describe('cosmetic combat projectiles', () => {
  it('uses lightweight class-specific shape families', () => {
    expect(combatProjectileShape('mage')).toBe('orb')
    expect(combatProjectileShape('warlock')).toBe('shard')
    expect(combatProjectileShape('warrior')).toBe('bolt')
  })

  it('travels from the caster to the boss only after a shot exists', () => {
    expect(combatProjectilePosition({ x: 10, y: 20 }, { x: 110, y: 70 }, 0)).toEqual({ x: 10, y: 20 })
    expect(combatProjectilePosition({ x: 10, y: 20 }, { x: 110, y: 70 }, COMBAT_PROJECTILE_TRAVEL_SECONDS)).toEqual({ x: 110, y: 70 })
  })

  it('caps the ambient NPC stream and pauses it during transitions', () => {
    expect(npcProjectileShots(10, 19).length).toBeLessThanOrEqual(MAX_VISIBLE_NPC_PROJECTILES)
    expect(new Set(npcProjectileShots(10, 19).map(shot => shot.npcOrdinal)).size).toBe(npcProjectileShots(10, 19).length)
    expect(combatProjectilesActive('beam')).toBe(true)
    expect(combatProjectilesActive('p3-flight')).toBe(false)
    expect(combatProjectilesActive('p4-countdown')).toBe(false)
  })
})
