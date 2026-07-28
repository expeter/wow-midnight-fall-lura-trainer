export interface ApiConfig {
  host: string
  port: number
  databasePath: string
  trainerOrigin: string
  localOrigins: string[]
  currentTrainerVersion: string
}

function requiredUrl(value: string, name: string): string {
  try {
    return new URL(value).origin
  } catch {
    throw new Error(`${name} must be a valid absolute URL`)
  }
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ApiConfig {
  const port = Number(environment.LURA_API_PORT ?? 8787)
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('LURA_API_PORT must be an integer from 0 to 65535')
  }
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
    currentTrainerVersion: environment.TRAINER_CURRENT_VERSION ?? '0.3.0',
  }
}
