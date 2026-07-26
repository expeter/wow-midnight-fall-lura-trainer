export function isLocalPreviewHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1')
  return normalized === 'localhost'
    || normalized === '127.0.0.1'
    || normalized === '::1'
}

export function featureFlagsForHost(hostname: string) {
  const localPreview = isLocalPreviewHost(hostname)
  return {
    backgroundMusic: true,
    encounterSounds: localPreview,
    phaseOne: localPreview,
    textToSpeech: true,
  } as const
}

export const FEATURE_FLAGS = featureFlagsForHost(
  typeof window === 'undefined' ? '' : window.location.hostname,
)
