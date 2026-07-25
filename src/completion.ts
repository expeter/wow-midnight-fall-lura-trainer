export type PhaseKey = 'intermission' | 'p2' | 'p3' | 'p4'

export interface PhaseResult {
  key: PhaseKey
  label: string
  points: number
  time: number
  recovery?: 'passed' | 'missed'
}

export const PHASE_LABELS: Record<PhaseKey, string> = {
  intermission: 'Intermission',
  p2: 'Phase 2',
  p3: 'Phase 3',
  p4: 'Phase 4',
}

export function buildPhaseResult(key: PhaseKey, startScore: number, endScore: number, startTime: number, endTime: number, recovery?: 'passed' | 'missed'): PhaseResult {
  return {
    key,
    label: PHASE_LABELS[key],
    points: Math.max(0, Math.round(1000 + endScore - startScore)),
    time: Math.max(0, endTime - startTime),
    ...(recovery ? { recovery } : {}),
  }
}

export function isFullSequenceCompletion(results: PhaseResult[]): boolean {
  const required: PhaseKey[] = ['intermission', 'p2', 'p3', 'p4']
  return results.length === required.length && results.every((result, index) => result.key === required[index])
}

interface ShareSummary {
  playerName: string
  playerClass: string
  difficulty: string
  totalScore: number
  totalTime: number
  mistakes: number
  attempt: number
  extras: string
  fullSequence: boolean
  results: PhaseResult[]
}

export function completionShareText(summary: ShareSummary): string {
  const heading = summary.fullSequence ? '🏆 L’URA MOVEMENT MASTER' : '✨ L’ura practice complete'
  const phases = summary.results.map(result => `${result.label}: ${result.points} pts · ${result.time.toFixed(1)}s`)
  return [
    heading,
    `${summary.playerName} · ${summary.playerClass} · ${summary.difficulty} · Attempt #${summary.attempt}`,
    ...phases.map((phase, index) => `${phase}${summary.results[index].recovery ? ` · Recovery ${summary.results[index].recovery === 'passed' ? '+50' : '−50'}` : ''}`),
    `Optional challenges: ${summary.extras}`,
    `Total: ${Math.round(summary.totalScore)} pts · ${summary.totalTime.toFixed(1)}s · ${summary.mistakes} mistake${summary.mistakes === 1 ? '' : 's'}`,
  ].join('\n')
}
