import type { PlayerClass, Point } from './game'

export type CombatProjectileShape = 'firebolt' | 'frostbolt' | 'lightning' | 'arrow' | 'spear' | 'shadowbolt' | 'naturebolt' | 'holybolt'

export interface NpcProjectileShot {
  age: number
  npcOrdinal: number
  shotOrdinal: number
}

export const COMBAT_PROJECTILE_TRAVEL_SECONDS = .72
export const NPC_PROJECTILE_MIN_INTERVAL_SECONDS = 1
export const NPC_PROJECTILE_MAX_INTERVAL_SECONDS = 3
export const MAX_VISIBLE_NPC_PROJECTILES = 20

function deterministicUnit(seed: number) {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
  value = Math.imul(value ^ value >>> 13, 0xc2b2ae35)
  return ((value ^ value >>> 16) >>> 0) / 0x100000000
}

export function combatProjectileShape(playerClass: PlayerClass, shotOrdinal = 0): CombatProjectileShape {
  if (playerClass === 'mage') return shotOrdinal % 2 === 0 ? 'firebolt' : 'frostbolt'
  if (playerClass === 'shaman' || playerClass === 'augmentation' || playerClass === 'evoker') return 'lightning'
  if (playerClass === 'hunter') return 'arrow'
  if (playerClass === 'warrior' || playerClass === 'death-knight' || playerClass === 'demon-hunter') return 'spear'
  if (playerClass === 'warlock') return 'shadowbolt'
  if (playerClass === 'druid' || playerClass === 'monk') return 'naturebolt'
  return 'holybolt'
}

export function npcProjectileIntervalSeconds(npcOrdinal: number): number {
  return NPC_PROJECTILE_MIN_INTERVAL_SECONDS
    + deterministicUnit(npcOrdinal * 17 + 11) * (NPC_PROJECTILE_MAX_INTERVAL_SECONDS - NPC_PROJECTILE_MIN_INTERVAL_SECONDS)
}

export function combatProjectilePosition(origin: Point, target: Point, age: number): Point {
  const progress = Math.max(0, Math.min(1, age / COMBAT_PROJECTILE_TRAVEL_SECONDS))
  const eased = 1 - (1 - progress) * (1 - progress)
  return {
    x: origin.x + (target.x - origin.x) * eased,
    y: origin.y + (target.y - origin.y) * eased,
  }
}

export function npcProjectileShots(time: number, npcCount: number): NpcProjectileShot[] {
  if (npcCount <= 0 || time < 0) return []
  const shots: NpcProjectileShot[] = []
  for (let npcOrdinal = 0; npcOrdinal < Math.min(npcCount, MAX_VISIBLE_NPC_PROJECTILES); npcOrdinal += 1) {
    const interval = npcProjectileIntervalSeconds(npcOrdinal)
    const firstShot = .05 + deterministicUnit(npcOrdinal * 31 + 7) * (interval - .05)
    if (time < firstShot) continue
    const shotOrdinal = Math.floor((time - firstShot) / interval)
    const age = time - (firstShot + shotOrdinal * interval)
    if (age <= COMBAT_PROJECTILE_TRAVEL_SECONDS) shots.push({ age, npcOrdinal, shotOrdinal })
  }
  return shots
}

export function combatProjectilesActive(event: string) {
  return !event.includes('countdown')
    && event !== 'positioning'
    && event !== 'p2-jump'
    && event !== 'p3-flight'
    && event !== 'p4-transition'
}
