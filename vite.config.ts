import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import packageJson from './package.json' with { type: 'json' }
import { feedbackInboxPlugin } from './tools/feedbackInboxPlugin'
import { onlineSubmitLabPlugin } from './tools/onlineSubmitLabPlugin'

const buildTime = new Date().toISOString()
const gitRevision = (() => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
})()
const versionManifest = JSON.stringify({
  version: packageJson.version,
  revision: gitRevision,
  builtAt: buildTime,
})

export default defineConfig({
  base: './',
  plugins: [
    react(),
    feedbackInboxPlugin(),
    onlineSubmitLabPlugin(),
    {
      name: 'lura-version-manifest',
      configureServer(server) {
        server.middlewares.use('/version.json', (_request, response) => {
          response.setHeader('Content-Type', 'application/json')
          response.setHeader('Cache-Control', 'no-store')
          response.end(versionManifest)
        })
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: versionManifest })
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __GIT_REVISION__: JSON.stringify(gitRevision),
  },
})
