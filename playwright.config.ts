import { defineConfig, devices } from '@playwright/test'

const e2ePort = Number(process.env.LURA_E2E_PORT || 4173)
const e2eOrigin = `http://127.0.0.1:${e2ePort}`

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: e2eOrigin,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${e2ePort}`,
    url: e2eOrigin,
    reuseExistingServer: !process.env.LURA_E2E_ISOLATED,
  },
})
