import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { ApiConfig } from './config.js'
import type { Database } from './database.js'
import { createApp } from './app.js'

async function body(request: IncomingMessage): Promise<BodyInit | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  return chunks.length ? Buffer.concat(chunks) : undefined
}

function copyResponse(response: Response, target: ServerResponse): Promise<void> {
  target.statusCode = response.status
  response.headers.forEach((value, key) => target.setHeader(key, value))
  return response.arrayBuffer().then(buffer => {
    target.end(Buffer.from(buffer))
  })
}

export function createHttpServer(database: Database, config: ApiConfig) {
  const app = createApp(database, config)
  return createServer(async (incoming, outgoing) => {
    try {
      const request = new Request(
        `http://${incoming.headers.host ?? `${config.host}:${config.port}`}${incoming.url ?? '/'}`,
        {
          method: incoming.method,
          headers: incoming.headers as HeadersInit,
          body: await body(incoming),
          duplex: 'half',
        } as RequestInit,
      )
      await copyResponse(await app.handle(request), outgoing)
    } catch (error) {
      console.error('request_failed', error)
      outgoing.statusCode = 500
      outgoing.setHeader('content-type', 'application/json; charset=utf-8')
      outgoing.end(JSON.stringify({ error: 'internal_error' }))
    }
  })
}
