import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8')

describe('shared visual rules', () => {
  it('does not duplicate the achievement divider on partial-width cluster headers', () => {
    const clusterHeader = styles.match(/\.achievement-cluster > header \{([^}]+)\}/)?.[1] ?? ''
    expect(clusterHeader).not.toContain('border')
  })

  it('animates the Main ability fill continuously instead of relying on frame-by-frame widths', () => {
    expect(styles).toContain('.main-cast .main-cast-fill { width: 100%; transform: scaleX(0); transform-origin: left center; animation: main-cast-fill 1s linear forwards; }')
    expect(styles).toContain('@keyframes main-cast-fill { to { transform: scaleX(1); } }')
  })
})
