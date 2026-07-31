import { describe, expect, it } from 'vitest'
import { createResultProof, RESULT_PROOF_KEY, resultProofClaim, serializeResultProof, serializeResultProofBundle, verifyResultProof } from './resultProof'

const input = {
  preview: false,
  trainerVersion: '0.8.0',
  buildId: 'abc1234',
  playerName: 'Pestivator',
  playedPosition: 'Assigned Mage — Spot 1',
  playerClass: 'Mage',
  difficulty: 'Normal',
  duty: 'crystal' as const,
  attempt: 42,
  fullSequence: true,
  totalScore: 1536.4,
  totalTime: 385.712,
  mistakes: 0,
  extras: 'Main ability used',
  phases: [{ key: 'p1' as const, label: 'Phase 1', points: 1020, time: 65.432, recovery: 'passed' as const, mistakes: 0 }],
  achievements: [{ id: 'always-be-casting', label: 'Always Be Casting' }],
}

describe('browser result proof', () => {
  it('normalizes every displayed result value into stable versioned JSON', () => {
    expect(RESULT_PROOF_KEY).toBe('LURA-RESULT-V1')
    expect(JSON.parse(serializeResultProof(resultProofClaim(input)))).toMatchObject({
      schema: 'lura-result-v1',
      trainer: { version: '0.8.0', build: 'abc1234' },
      run: { score: 1536, durationMs: 385712, difficulty: 'normal', duty: 'crystal' },
      phases: [{ key: 'p1', cumulativePoints: 1020, contribution: 20, durationMs: 65432, recovery: 'passed' }],
    })
  })

  it('creates a compact Run-ID and detects edited proof JSON', async () => {
    const proof = await createResultProof(input)
    expect(proof.code).toMatch(/^LURA1-(?:[0-9A-F]{4}-){4}[0-9A-F]{4}$/)
    expect(JSON.parse(serializeResultProofBundle(proof))).toMatchObject({
      runId: proof.code,
      checksumKey: RESULT_PROOF_KEY,
      claim: { schema: 'lura-result-v1', run: { score: 1536 } },
    })
    await expect(verifyResultProof(proof)).resolves.toBe(true)
    await expect(verifyResultProof({ ...proof, json: proof.json.replace('1536', '1936') })).resolves.toBe(false)
  })
})
