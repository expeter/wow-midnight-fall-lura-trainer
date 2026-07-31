import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('maintained project documentation', () => {
  it('groups every open request into a delivery milestone', () => {
    const requestLog = read('docs/README.md')
    const milestones = read('docs/milestones.md')
    const openTickets = [...requestLog.matchAll(
      /\| `((?:FR|CR|BUG|SPEC)-\d+)` \| (?:Planned|In progress|Backlog[^|]*|Deferred) \|/g,
    )].map(match => match[1])

    expect(openTickets.length).toBeGreaterThan(0)
    for (const ticket of openTickets) {
      expect(
        milestones.match(new RegExp(`^(?:-|\\d+\\.) \\\`${ticket}\\\``, 'gm')) ?? [],
        `${ticket} must appear in exactly one milestone`,
      ).toHaveLength(1)
    }
  })

  it('keeps released Phase 1 work out of the localhost-preview status', () => {
    expect(read('docs/README.md')).not.toMatch(/\| Implemented behind localhost preview \|/)
  })

  it('records every stable specification in the request ledger', () => {
    const specifications = read('docs/specifications.md')
    const requestLog = read('docs/README.md')
    const ids = [...specifications.matchAll(/^## (SPEC-\d+) ·/gm)].map(match => match[1])

    for (const id of ids) expect(requestLog).toContain(`\`${id}\``)
  })

  it('documents every shipped API route in both API references', () => {
    const implementation = read('api/src/app.ts')
    const operatorReadme = read('api/README.md')
    const apiContract = read('docs/api-highscores.md')
    const routes = new Set([
      ...implementation.matchAll(/url\.pathname === '(\/[^']+)'/g),
      ...implementation.matchAll(/url\.pathname === "(\/[^"]+)"/g),
    ].map(match => match[1]))

    for (const route of routes) {
      expect(operatorReadme, `${route} missing from api/README.md`).toContain(route)
      expect(apiContract, `${route} missing from docs/api-highscores.md`).toContain(route)
    }
    for (const parameterized of [
      '/v1/attempts/{attemptId}/complete',
      '/v1/me/attempts/{attemptId}',
      '/v1/profiles/{profileId}',
    ]) {
      expect(operatorReadme).toContain(parameterized)
    }
  })
})
