import type { PlayerClass, Point } from './game'

export type CombatProjectileShape = 'bolt' | 'orb' | 'shard'

export interface NpcProjectileShot {
  age: number
  npcOrdinal: number
}

export const COMBAT_PROJECTILE_TRAVEL_SECONDS = .72
export const NPC_PROJECTILE_INTERVAL_SECONDS = .52
export const MAX_VISIBLE_NPC_PROJECTILES = 3

const ORB_CLASSES = new Set<PlayerClass>(['mage', 'priest', 'shaman', 'monk'])
const SHARD_CLASSES = new Set<PlayerClass>(['warlock', 'death-knight', 'demon-hunter', 'hunter'])

export function combatProjectileShape(playerClass: PlayerClass): CombatProjectileShape {
  if (ORB_CLASSES.has(playerClass)) return 'orb'
  if (SHARD_CLASSES.has(playerClass)) return 'shard'
  return 'bolt'
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
  const newestCycle = Math.floor(time / NPC_PROJECTILE_INTERVAL_SECONDS)
  const shots: NpcProjectileShot[] = []
  for (let offset = 0; offset < MAX_VISIBLE_NPC_PROJECTILES; offset += 1) {
    const cycle = newestCycle - offset
    if (cycle < 0) continue
    const age = time - cycle * NPC_PROJECTILE_INTERVAL_SECONDS
    if (age > COMBAT_PROJECTILE_TRAVEL_SECONDS) continue
    shots.push({ age, npcOrdinal: (cycle * 7 + 3) % npcCount })
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
