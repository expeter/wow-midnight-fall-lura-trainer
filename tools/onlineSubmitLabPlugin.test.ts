import { describe, expect, it, vi } from 'vitest'
import { onlineSubmitLabPlugin } from './onlineSubmitLabPlugin'

describe('localhost online submission lab', () => {
  it('is serve-only and exposes the clearly labelled lab page in development', () => {
    const plugin = onlineSubmitLabPlugin()
    expect(plugin.apply).toBe('serve')
    let middleware: ((request: { url?: string }, response: {
      statusCode: number
      setHeader: (name: string, value: string) => void
      end: (body: string) => void
    }, next: () => void) => void) | undefined
    const use = vi.fn((_route, handler) => { middleware = handler })
    const configureServer = plugin.configureServer as (server: unknown) => void
    configureServer({ middlewares: { use } })
    expect(use).toHaveBeenCalledWith('/dev/online-submit', expect.any(Function))

    const setHeader = vi.fn()
    const end = vi.fn()
    middleware?.({ url: '/' }, { statusCode: 0, setHeader, end }, vi.fn())
    expect(end).toHaveBeenCalledWith(expect.stringContaining('Development-only test data.'))
    expect(end).toHaveBeenCalledWith(expect.stringContaining('Verified submission lab'))
    expect(end).toHaveBeenCalledWith(expect.stringContaining("location.hostname==='localhost'"))
    expect(end).toHaveBeenCalledWith(expect.stringContaining("'http://127.0.0.1:'"))
  })
})
