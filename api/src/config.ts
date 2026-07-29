export interface ApiConfig {
  host: string
  port: number
  databasePath: string
  trainerOrigin: string
  localOrigins: string[]
  currentTrainerVersion: string
  battleNetClientId: string
  battleNetClientSecret: string
  battleNetCallbackUrl: string
  sessionSecret: string
  csrfSecret: string
}

function requiredUrl(value: string, name: string): string {
  try {
    return new URL(value).origin
  } catch {
    throw new Error(`${name} must be a valid absolute URL`)
  }
}

function requiredAbsoluteUrl(value: string, name: string): string {
  try {
    return new URL(value).toString()
  } catch {
    throw new Error(`${name} must be a valid absolute URL`)
  }
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number(environment.LURA_API_PORT ?? 8787)
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('LURA_API_PORT must be an integer from 0 to 65535')
  }
  const battleNetClientId = environment.BNET_CLIENT_ID ?? environment.BATTLE_NET_CLIENT_ID ?? ''
  const battleNetClientSecret = environment.BNET_SECRET ?? environment.BATTLE_NET_CLIENT_SECRET ?? ''
  const sessionSecret = environment.SESSION_SECRET ?? ''
  const csrfSecret = environment.CSRF_SECRET ?? ''
  return {
    host: environment.LURA_API_HOST ?? '127.0.0.1',
    port,
    databasePath: environment.LURA_API_DATABASE ?? './lura.sqlite3',
    trainerOrigin: requiredUrl(environment.TRAINER_ORIGIN ?? 'https://expeter.github.io', 'TRAINER_ORIGIN'),
    localOrigins: (environment.LOCAL_ORIGINS ?? '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
      .map(origin => requiredUrl(origin, 'LOCAL_ORIGINS')),
    // Release compatibility is part of the deployed code. Do not allow a
    // long-lived VPS environment file to pin an older trainer version.
    currentTrainerVersion: '0.4.2',
    battleNetClientId,
    battleNetClientSecret,
    battleNetCallbackUrl: requiredAbsoluteUrl(
      environment.BATTLE_NET_CALLBACK_URL ?? 'http://127.0.0.1:8787/v1/auth/battlenet/callback',
      'BATTLE_NET_CALLBACK_URL',
    ),
    sessionSecret,
    csrfSecret,
  }
}
