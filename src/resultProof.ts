import { completionPhasePresentation, type Achievement, type PhaseResult } from './completion'

export const RESULT_PROOF_KEY = 'LURA-RESULT-V1'

export interface ResultProofInput {
  preview: boolean
  trainerVersion: string
  buildId: string
  playerName: string
  playedPosition: string
  playerClass: string
  difficulty: string
  duty: 'crystal' | 'non-crystal'
  attempt: number
  fullSequence: boolean
  totalScore: number
  totalTime: number
  mistakes: number
  extras: string
  phases: PhaseResult[]
  achievements: Array<Pick<Achievement, 'id' | 'label'>>
}

export interface ResultProofClaim {
  schema: 'lura-result-v1'
  preview: boolean
  trainer: { version: string; build: string }
  player: { name: string; position: string; class: string }
  run: {
    difficulty: string
    duty: 'crystal' | 'non-crystal'
    attempt: number
    fullSequence: boolean
    score: number
    durationMs: number
    mistakes: number
    extras: string
  }
  phases: Array<{
    key: string
    label: string
    cumulativePoints: number
    contribution: number
    durationMs: number
    mistakes: number
    recovery: 'passed' | 'missed' | null
  }>
  achievements: Array<{ id: string; label: string }>
}

export interface ResultProof {
  code: string
  json: string
}

export function resultProofClaim(input: ResultProofInput): ResultProofClaim {
  return {
    schema: 'lura-result-v1',
    preview: input.preview,
    trainer: {
      version: input.trainerVersion.trim(),
      build: input.buildId.trim(),
    },
    player: {
      name: input.playerName.trim(),
      position: input.playedPosition.trim(),
      class: input.playerClass.trim(),
    },
    run: {
      difficulty: input.difficulty.trim().toLowerCase(),
      duty: input.duty,
      attempt: Math.max(0, Math.round(input.attempt)),
      fullSequence: input.fullSequence,
      score: Math.round(input.totalScore),
      durationMs: Math.max(0, Math.round(input.totalTime * 1000)),
      mistakes: Math.max(0, Math.round(input.mistakes)),
      extras: input.extras.trim(),
    },
    phases: completionPhasePresentation(input.phases).map(phase => ({
      key: phase.key,
      label: phase.label.trim(),
      cumulativePoints: phase.cumulativePoints,
      contribution: phase.contribution,
      durationMs: Math.max(0, Math.round(phase.time * 1000)),
      mistakes: Math.max(0, Math.round(phase.mistakes ?? 0)),
      recovery: phase.recovery ?? null,
    })),
    achievements: input.achievements.map(achievement => ({
      id: achievement.id,
      label: achievement.label.trim(),
    })),
  }
}

export function serializeResultProof(claim: ResultProofClaim): string {
  return JSON.stringify(claim)
}

export async function resultProofFromJson(json: string): Promise<ResultProof> {
  const bytes = new TextEncoder().encode(`${RESULT_PROOF_KEY}\n${json}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 20)
    .toUpperCase()
  return {
    code: `LURA1-${hex.match(/.{1,4}/g)!.join('-')}`,
    json,
  }
}

export function createResultProof(input: ResultProofInput): Promise<ResultProof> {
  return resultProofFromJson(serializeResultProof(resultProofClaim(input)))
}

export async function verifyResultProof(proof: ResultProof): Promise<boolean> {
  return (await resultProofFromJson(proof.json)).code === proof.code.toUpperCase()
}

export function serializeResultProofBundle(proof: ResultProof): string {
  return JSON.stringify({
    runId: proof.code,
    checksumKey: RESULT_PROOF_KEY,
    claim: JSON.parse(proof.json) as ResultProofClaim,
  }, null, 2)
}
