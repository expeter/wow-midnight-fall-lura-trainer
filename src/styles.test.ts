import { describe, expect, it } from 'vitest'
import styles from './styles.css?raw'

describe('shared visual rules', () => {
  it('does not duplicate the achievement divider on partial-width cluster headers', () => {
    const clusterHeader = styles.match(/\.achievement-cluster > header \{([^}]+)\}/)?.[1] ?? ''
    expect(clusterHeader).not.toContain('border')
  })
})
