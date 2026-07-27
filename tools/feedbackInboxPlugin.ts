import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const MAX_REQUEST_BYTES = 22 * 1024 * 1024
const MAX_IMAGE_BYTES = 16 * 1024 * 1024
const MAX_NOTE_LENGTH = 4_000
const INBOX_ROUTE = '/inbox'
const SUBMIT_ROUTE = '/__lura_feedback_inbox'

const IMAGE_TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

export interface FeedbackInboxPayload {
  note: string
  imageDataUrl: string
  originalName?: string
}

export interface SavedFeedbackInboxEntry {
  id: string
  notePath: string
  imagePath: string
}

function compactTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
}

export function isLoopbackAddress(address: string | undefined) {
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1'
}

function decodeImage(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl)
  if (!match) throw new Error('Use a PNG, JPEG, WebP, or GIF screenshot.')

  const extension = IMAGE_TYPES.get(match[1])
  if (!extension) throw new Error('Unsupported screenshot type.')

  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64')
  if (bytes.length === 0) throw new Error('The screenshot is empty.')
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('The screenshot is too large (16 MB maximum).')

  return { bytes, extension }
}

function cleanOriginalName(name: string | undefined) {
  if (!name) return undefined
  return name.replace(/[\r\n]/g, ' ').slice(0, 180)
}

export async function saveFeedbackInboxEntry(
  projectRoot: string,
  payload: FeedbackInboxPayload,
  now = new Date(),
  token = randomBytes(3).toString('hex'),
): Promise<SavedFeedbackInboxEntry> {
  const note = payload.note.trim()
  if (!note) throw new Error('Add a short note before submitting.')
  if (note.length > MAX_NOTE_LENGTH) throw new Error(`Keep the note under ${MAX_NOTE_LENGTH} characters.`)

  const { bytes, extension } = decodeImage(payload.imageDataUrl)
  const safeToken = token.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'entry'
  const id = `INBOX-${compactTimestamp(now)}-${safeToken}`
  const inboxDirectory = join(projectRoot, 'inbox')
  const imageName = `${id}.${extension}`
  const noteName = `${id}.md`
  const originalName = cleanOriginalName(payload.originalName)
  const noteDocument = [
    `# ${id}`,
    '',
    `- Created: ${now.toISOString()}`,
    `- Screenshot: [${imageName}](./${imageName})`,
    ...(originalName ? [`- Original file: ${originalName}`] : []),
    '',
    '## Feedback',
    '',
    note,
    '',
  ].join('\n')

  await mkdir(inboxDirectory, { recursive: true })
  await Promise.all([
    writeFile(join(inboxDirectory, imageName), bytes, { flag: 'wx' }),
    writeFile(join(inboxDirectory, noteName), noteDocument, { flag: 'wx' }),
  ])

  return {
    id,
    notePath: `inbox/${noteName}`,
    imagePath: `inbox/${imageName}`,
  }
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size > MAX_REQUEST_BYTES) throw new Error('The submission is too large (16 MB maximum).')
    chunks.push(bytes)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as FeedbackInboxPayload
  } catch {
    throw new Error('The feedback submission is not valid JSON.')
  }
}

function respondJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

export function feedbackInboxPlugin(): Plugin {
  return {
    name: 'lura-local-feedback-inbox',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname

        if (pathname !== INBOX_ROUTE && pathname !== `${INBOX_ROUTE}/` && pathname !== SUBMIT_ROUTE) {
          next()
          return
        }

        if (!isLoopbackAddress(request.socket.remoteAddress)) {
          response.statusCode = 403
          response.end('The feedback inbox is available only on localhost.')
          return
        }

        if ((pathname === INBOX_ROUTE || pathname === `${INBOX_ROUTE}/`) && request.method === 'GET') {
          response.statusCode = 200
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(FEEDBACK_INBOX_HTML)
          return
        }

        if (pathname === SUBMIT_ROUTE && request.method === 'POST') {
          try {
            const payload = await readJsonBody(request)
            const result = await saveFeedbackInboxEntry(server.config.root, payload)
            respondJson(response, 201, result)
          } catch (error) {
            respondJson(response, 400, {
              error: error instanceof Error ? error.message : 'Unable to save feedback.',
            })
          }
          return
        }

        response.statusCode = 405
        response.setHeader('Allow', pathname === SUBMIT_ROUTE ? 'POST' : 'GET')
        response.end('Method not allowed.')
      })

      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        const port = address && typeof address !== 'string' ? address.port : 5173
        server.config.logger.info(`  ➜  Feedback inbox: http://localhost:${port}/inbox`)
      })
    },
  }
}

const FEEDBACK_INBOX_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>L'ura feedback inbox</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #070a16; color: #f4efff; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 28px; background: radial-gradient(circle at 50% 0%, #2b1853 0, #0d1022 38%, #060812 100%); }
    main { width: min(760px, 100%); padding: clamp(24px, 5vw, 48px); border: 1px solid #69529a; border-radius: 22px; background: rgba(12, 14, 32, .94); box-shadow: 0 24px 90px #000a; }
    .eyebrow { margin: 0 0 8px; color: #cfb9ff; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(30px, 7vw, 54px); }
    .intro { color: #c4bdd6; font-size: 17px; line-height: 1.55; }
    #dropzone { display: grid; place-items: center; min-height: 250px; margin: 26px 0 20px; padding: 22px; border: 2px dashed #8469c1; border-radius: 16px; background: #19162c; text-align: center; cursor: pointer; transition: .15s ease; overflow: hidden; }
    #dropzone.dragging { border-color: #ffe17a; background: #29223c; transform: translateY(-2px); }
    #dropzone img { display: none; max-width: 100%; max-height: 360px; border-radius: 10px; object-fit: contain; }
    #dropzone.has-image img { display: block; }
    #dropzone.has-image .empty { display: none; }
    .empty strong { display: block; margin-bottom: 8px; font-size: 20px; }
    .empty span { color: #aaa2bc; }
    textarea { width: 100%; min-height: 120px; resize: vertical; padding: 14px 16px; border: 1px solid #514665; border-radius: 12px; background: #0d0e1d; color: inherit; font: inherit; font-size: 17px; line-height: 1.5; }
    textarea:focus, button:focus-visible, #dropzone:focus-visible { outline: 3px solid #ffe17a; outline-offset: 3px; }
    .actions { display: flex; align-items: center; gap: 14px; margin-top: 18px; }
    button { border: 0; border-radius: 999px; padding: 12px 22px; background: linear-gradient(135deg, #ad86ff, #7253c7); color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
    button:disabled { opacity: .55; cursor: wait; }
    #status { min-height: 24px; color: #c9c2da; }
    #status.success { color: #9ff2b8; }
    #status.error { color: #ffaaa4; }
    code { color: #ffe17a; }
    input { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; pointer-events: none; }
    @media (max-width: 560px) { body { padding: 12px; } main { padding: 22px; } .actions { align-items: stretch; flex-direction: column; } button { width: 100%; } }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Local developer tool</p>
    <h1>Feedback inbox</h1>
    <p class="intro">Paste a screenshot from the clipboard, drag it here, or choose a file. Add the short note you want to reference in chat; submission creates a matching Markdown note and image in <code>inbox/</code>.</p>
    <input id="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
    <div id="dropzone" role="button" tabindex="0" aria-label="Paste, drop, or choose a screenshot">
      <div class="empty"><strong>Paste or drop screenshot</strong><span>Ctrl+V works anywhere on this page · click to choose a file</span></div>
      <img id="preview" alt="Screenshot preview">
    </div>
    <label for="note"><span class="eyebrow">Short note</span></label>
    <textarea id="note" maxlength="4000" placeholder="BUG: Describe what happened and what should happen instead."></textarea>
    <div class="actions">
      <button id="submit" type="button">Save to inbox</button>
      <span id="status" role="status" aria-live="polite"></span>
    </div>
  </main>
  <script>
    const dropzone = document.querySelector('#dropzone')
    const fileInput = document.querySelector('#file')
    const preview = document.querySelector('#preview')
    const note = document.querySelector('#note')
    const submit = document.querySelector('#submit')
    const status = document.querySelector('#status')
    let screenshot

    function setStatus(message, type = '') {
      status.textContent = message
      status.className = type
    }

    function useFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        setStatus('Please choose an image file.', 'error')
        return
      }
      screenshot = file
      preview.src = URL.createObjectURL(file)
      dropzone.classList.add('has-image')
      setStatus(file.name || 'Clipboard screenshot ready.')
    }

    dropzone.addEventListener('click', () => fileInput.click())
    dropzone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        fileInput.click()
      }
    })
    fileInput.addEventListener('change', () => useFile(fileInput.files[0]))

    for (const eventName of ['dragenter', 'dragover']) {
      dropzone.addEventListener(eventName, event => {
        event.preventDefault()
        dropzone.classList.add('dragging')
      })
    }
    for (const eventName of ['dragleave', 'drop']) {
      dropzone.addEventListener(eventName, event => {
        event.preventDefault()
        dropzone.classList.remove('dragging')
      })
    }
    dropzone.addEventListener('drop', event => useFile(event.dataTransfer.files[0]))
    document.addEventListener('paste', event => {
      const image = [...event.clipboardData.items]
        .find(item => item.kind === 'file' && item.type.startsWith('image/'))
      if (image) useFile(image.getAsFile())
    })

    function fileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Unable to read screenshot.'))
        reader.readAsDataURL(file)
      })
    }

    submit.addEventListener('click', async () => {
      if (!screenshot) return setStatus('Paste, drop, or choose a screenshot first.', 'error')
      if (!note.value.trim()) return setStatus('Add a short note first.', 'error')
      submit.disabled = true
      setStatus('Saving…')
      try {
        const response = await fetch('${SUBMIT_ROUTE}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: note.value,
            imageDataUrl: await fileAsDataUrl(screenshot),
            originalName: screenshot.name,
          }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to save feedback.')
        setStatus('Saved as ' + result.id + ' — reference this ID in chat.', 'success')
        note.value = ''
      } catch (error) {
        setStatus(error.message || 'Unable to save feedback.', 'error')
      } finally {
        submit.disabled = false
      }
    })
  </script>
</body>
</html>`
