export const MAIN_ABILITY_CAST_SECONDS = 1
export const MAIN_ABILITY_COOLDOWN_SECONDS = .1

export type MainAbilityPhase = 'idle' | 'casting' | 'cooldown'

export interface MainAbilityCastState {
  phase: MainAbilityPhase
  remaining: number
  queued: boolean
}

export interface MainAbilityAdvance {
  state: MainAbilityCastState
  completed: number
}

export function idleMainAbilityCast(): MainAbilityCastState {
  return { phase: 'idle', remaining: 0, queued: false }
}

export function requestMainAbilityCast(state: MainAbilityCastState): MainAbilityCastState {
  if (state.phase === 'idle') return { phase: 'casting', remaining: MAIN_ABILITY_CAST_SECONDS, queued: false }
  const queueWindowOpen = state.phase === 'cooldown'
    || state.phase === 'casting' && state.remaining <= MAIN_ABILITY_COOLDOWN_SECONDS
  return !queueWindowOpen || state.queued ? state : { ...state, queued: true }
}

export function advanceMainAbilityCast(state: MainAbilityCastState, elapsed: number): MainAbilityAdvance {
  let next = state
  let remainingElapsed = Math.max(0, elapsed)
  let completed = 0
  while (remainingElapsed > 0 && next.phase !== 'idle') {
    if (remainingElapsed < next.remaining) {
      next = { ...next, remaining: next.remaining - remainingElapsed }
      remainingElapsed = 0
      continue
    }
    remainingElapsed -= next.remaining
    if (next.phase === 'casting') {
      completed += 1
      next = { phase: 'cooldown', remaining: MAIN_ABILITY_COOLDOWN_SECONDS, queued: next.queued }
    } else if (next.queued) {
      next = { phase: 'casting', remaining: MAIN_ABILITY_CAST_SECONDS, queued: false }
    } else {
      next = idleMainAbilityCast()
    }
  }
  return { state: next, completed }
}

export function mainAbilityCastProgress(state: MainAbilityCastState): number {
  if (state.phase === 'cooldown') return 1
  if (state.phase !== 'casting') return 0
  return Math.max(0, Math.min(1, 1 - state.remaining / MAIN_ABILITY_CAST_SECONDS))
}
