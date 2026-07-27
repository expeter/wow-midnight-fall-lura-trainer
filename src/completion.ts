export type PhaseKey = 'intermission' | 'p2' | 'p3' | 'p4'

export interface PhaseResult {
  key: PhaseKey
  label: string
  points: number
  time: number
  recovery?: 'passed' | 'missed'
  mistakes?: number
}

export const PHASE_LABELS: Record<PhaseKey, string> = {
  intermission: 'Intermission',
  p2: 'Phase 2',
  p3: 'Phase 3',
  p4: 'Phase 4',
}

export function buildPhaseResult(key: PhaseKey, startScore: number, endScore: number, startTime: number, endTime: number, recovery?: 'passed' | 'missed', mistakes?: number): PhaseResult {
  return {
    key,
    label: PHASE_LABELS[key],
    points: Math.max(0, Math.round(1000 + endScore - startScore)),
    time: Math.max(0, endTime - startTime),
    ...(recovery ? { recovery } : {}),
    ...(typeof mistakes === 'number' ? { mistakes: Math.max(0, Math.round(mistakes)) } : {}),
  }
}

export function isFullSequenceCompletion(results: PhaseResult[]): boolean {
  const required: PhaseKey[] = ['intermission', 'p2', 'p3', 'p4']
  return results.length === required.length && results.every((result, index) => result.key === required[index])
}

export interface Achievement {
  id: string
  label: string
  detail: string
}

export interface AchievementSummary {
  difficulty: string
  crystalPlayer: boolean
  fullSequence: boolean
  mistakes: number
  totalScore: number
  healthPotEnabled: boolean
  shieldEnabled: boolean
  mainAbilityEnabled: boolean
  earlyKill?: boolean
  p3EarlyClear?: boolean
  phaseResults?: PhaseResult[]
  wipeCount?: number
  pauseCycle?: boolean
  crystalFailures?: number
  runeFailures?: number
  allPhaseRecovery?: boolean
  recoveryUses?: number
  mainAbilityCasts?: number
}

export function completionAchievements(summary: AchievementSummary): Achievement[] {
  const achievements: Achievement[] = []
  const duty = summary.crystalPlayer ? 'Crystal player' : 'Non-crystal player'
  const flawless = summary.mistakes === 0
  const allOptions = Boolean(summary.allPhaseRecovery) && summary.mainAbilityEnabled
  achievements.push(summary.fullSequence
    ? { id: 'movement-master', label: 'L’URA MOVEMENT MASTER', detail: `${summary.difficulty} · ${duty}` }
    : { id: 'practice-clear', label: 'L’URA PRACTICE CLEAR', detail: `${summary.difficulty} · ${duty}` })
  if (flawless) achievements.push({ id: 'flawless', label: `FLAWLESS · ${summary.difficulty.toUpperCase()}`, detail: duty })
  if (allOptions) achievements.push({ id: 'all-options', label: 'ALL COMBAT CHALLENGES', detail: 'Every-phase recovery · Main ability' })
  if (summary.fullSequence && flawless && allOptions && summary.totalScore > 1100 && summary.crystalPlayer) {
    achievements.push({ id: 'superhuman-flawless', label: 'SUPERHUMAN FLAWLESS', detail: `${summary.difficulty} · Crystal player · 1100+ points` })
  }
  if (summary.earlyKill) achievements.push({ id: 'early-kill', label: 'L’URA DEFEATED EARLY', detail: 'Boss reached 0% before the fourth Heaven & Hell finished' })
  if (summary.p3EarlyClear) achievements.push({ id: 'p3-early-clear', label: 'THE STARS CAN WAIT', detail: 'L’ura reached 0% before Phase 3 completed' })
  return achievements
}

interface ShareSummary {
  playerName: string
  playedPosition?: string
  playerClass: string
  difficulty: string
  totalScore: number
  totalTime: number
  mistakes: number
  attempt: number
  extras: string
  fullSequence: boolean
  results: PhaseResult[]
  achievements?: Achievement[]
}

export function completionShareText(summary: ShareSummary): string {
  const heading = summary.fullSequence ? '🏆 L’URA MOVEMENT MASTER' : '✨ L’ura practice complete'
  const phases = summary.results.map(result => `${result.label}: ${result.points} pts · ${result.time.toFixed(1)}s`)
  return [
    heading,
    `${summary.playerName} · ${summary.playerClass} · ${summary.difficulty} · Attempt #${summary.attempt}`,
    ...(summary.playedPosition ? [`Played position: ${summary.playedPosition}`] : []),
    ...phases.map((phase, index) => `${phase}${summary.results[index].recovery ? ` · Recovery ${summary.results[index].recovery === 'passed' ? '+50' : '−50'}` : ''}`),
    `Optional challenges: ${summary.extras}`,
    ...(summary.achievements?.length ? [`Achievements: ${summary.achievements.map(achievement => achievement.label).join(' · ')}`] : []),
    `Total: ${Math.round(summary.totalScore)} pts · ${summary.totalTime.toFixed(1)}s · ${summary.mistakes} mistake${summary.mistakes === 1 ? '' : 's'}`,
  ].join('\n')
}
