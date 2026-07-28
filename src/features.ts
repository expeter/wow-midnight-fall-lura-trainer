export function isLocalPreviewHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1')
  return normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized === '::1'
}

export function featureFlagsForHost(hostname: string) {
  void hostname
  return {
    backgroundMusic: true,
    encounterSounds: true,
    phaseOne: true,
    textToSpeech: true,
  } as const
}

export const FEATURE_FLAGS = featureFlagsForHost(
  typeof window === 'undefined' ? '' : window.location.hostname,
)
