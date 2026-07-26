import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
})

Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  value: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ version: '0.1.0', revision: 'unknown', builtAt: new Date(0).toISOString() }),
  }),
})
