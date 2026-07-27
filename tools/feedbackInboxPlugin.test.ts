import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { isLoopbackAddress, saveFeedbackInboxEntry } from './feedbackInboxPlugin'

const temporaryDirectories: string[] = []
const ONE_PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M/wHwAF/gL+XwN6WQAAAABJRU5ErkJggg=='

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('local feedback inbox', () => {
  it('accepts only loopback clients', () => {
    expect(isLoopbackAddress('127.0.0.1')).toBe(true)
    expect(isLoopbackAddress('::1')).toBe(true)
    expect(isLoopbackAddress('::ffff:127.0.0.1')).toBe(true)
    expect(isLoopbackAddress('192.168.1.20')).toBe(false)
    expect(isLoopbackAddress(undefined)).toBe(false)
  })

  it('saves a matching screenshot and Markdown note under a stable reference', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lura-feedback-'))
    temporaryDirectories.push(root)

    const result = await saveFeedbackInboxEntry(root, {
      note: 'BUG: The visible beam did not match its collision.',
      imageDataUrl: ONE_PIXEL_PNG,
      originalName: 'clipboard.png',
    }, new Date('2026-07-27T12:34:56.000Z'), 'a1b2c3')

    expect(result).toEqual({
      id: 'INBOX-20260727-123456-a1b2c3',
      notePath: 'inbox/INBOX-20260727-123456-a1b2c3.md',
      imagePath: 'inbox/INBOX-20260727-123456-a1b2c3.png',
    })
    expect(await readFile(join(root, result.imagePath))).toHaveLength(70)
    expect(await readFile(join(root, result.notePath), 'utf8')).toContain(
      'BUG: The visible beam did not match its collision.',
    )
  })

  it('requires both a note and a supported screenshot', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lura-feedback-'))
    temporaryDirectories.push(root)

    await expect(saveFeedbackInboxEntry(root, {
      note: '   ',
      imageDataUrl: ONE_PIXEL_PNG,
    })).rejects.toThrow('Add a short note')

    await expect(saveFeedbackInboxEntry(root, {
      note: 'Broken image',
      imageDataUrl: 'data:text/plain;base64,SGVsbG8=',
    })).rejects.toThrow('Use a PNG, JPEG, WebP, or GIF')
  })
})
