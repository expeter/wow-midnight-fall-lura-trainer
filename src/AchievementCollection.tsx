import { useState } from 'react'
import { achievementCatalog, type AchievementCluster, type AchievementCollectionData, type AchievementDefinition } from './achievementCollection'

interface AchievementCollectionProps {
  collection: AchievementCollectionData
}

const CLUSTERS: AchievementCluster[] = ['Foundations', 'Precision', 'Tools of the Trade', 'Feats of Movement']
const CLUSTER_COPY: Record<AchievementCluster, string> = {
  Foundations: 'Milestones for learning the encounter and completing each training path.',
  Precision: 'Clean mechanics, flawless phases, and respect for every crystal and rune.',
  'Tools of the Trade': 'Optional actions used with purpose instead of left on the bars.',
  'Feats of Movement': 'Long-term mastery across duties, difficulties, and exceptional clears.',
}

function earnedMap(collection: AchievementCollectionData) {
  return new Map(collection.records.map(record => [record.key, record]))
}

function clippedText(text: string, maximum: number) {
  return text.length <= maximum ? text : `${text.slice(0, maximum - 1)}…`
}

async function achievementLedgerImage(collection: AchievementCollectionData) {
  const catalog = achievementCatalog()
  const earned = earnedMap(collection)
  const available = catalog.filter(achievement => achievement.available)
  const earnedCount = available.filter(achievement => earned.has(achievement.key)).length
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1760
  const context = canvas.getContext('2d')
  if (!context) return null
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#171e34')
  gradient.addColorStop(1, '#070b15')
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.strokeStyle = '#4a5067'
  context.lineWidth = 2
  context.strokeRect(28, 28, 1144, 1704)
  context.fillStyle = '#d8be77'
  context.font = '700 21px sans-serif'
  context.fillText('L’URA TRAINER · ACHIEVEMENT COLLECTION', 62, 77)
  context.fillStyle = '#f7f5ee'
  context.font = '800 48px sans-serif'
  context.fillText('L’ura’s movement ledger', 62, 132)
  context.fillStyle = '#ffd978'
  context.font = '700 24px monospace'
  context.fillText(`${earnedCount}/${available.length} EARNED`, 920, 126)

  let top = 174
  for (const cluster of CLUSTERS) {
    const entries = catalog.filter(achievement => achievement.cluster === cluster)
    const clusterEarned = entries.filter(achievement => achievement.available && earned.has(achievement.key)).length
    const availableEntries = entries.filter(achievement => achievement.available).length
    context.fillStyle = '#edf1f8'
    context.font = '700 24px sans-serif'
    context.fillText(cluster, 62, top + 25)
    context.fillStyle = '#8491aa'
    context.font = '500 15px sans-serif'
    context.fillText(`${clusterEarned}/${availableEntries} · ${clippedText(CLUSTER_COPY[cluster], 96)}`, 62, top + 49)
    top += 64

    entries.forEach((achievement, index) => {
      const record = earned.get(achievement.key)
      const status = record ? 'EARNED' : achievement.available ? 'LOCKED' : 'COMING SOON'
      const x = 62 + index % 2 * 548
      const y = top + Math.floor(index / 2) * 103
      context.fillStyle = record ? 'rgba(49, 55, 69, .96)' : 'rgba(15, 21, 36, .9)'
      context.fillRect(x, y, 522, 90)
      context.strokeStyle = record ? '#d8be77' : '#303c59'
      context.lineWidth = 1
      context.strokeRect(x, y, 522, 90)
      context.fillStyle = record ? '#ffd978' : '#65718a'
      context.font = '700 17px sans-serif'
      context.fillText(clippedText(`${achievement.icon}  ${achievement.label}`, 41), x + 15, y + 27)
      context.textAlign = 'right'
      context.font = '700 12px monospace'
      context.fillText(status, x + 506, y + 26)
      context.textAlign = 'left'
      context.fillStyle = record ? '#c9d0df' : '#7d899f'
      context.font = '500 14px sans-serif'
      context.fillText(clippedText(achievement.requirement, 67), x + 15, y + 53)
      context.fillStyle = '#66738c'
      context.font = '500 12px sans-serif'
      context.fillText(record ? clippedText(`First earned ${new Date(record.earnedAt).toLocaleDateString()}${record.playerName ? ` · ${record.playerName}` : ''}`, 78) : clippedText(achievement.flavor, 78), x + 15, y + 75)
    })
    top += Math.ceil(entries.length / 2) * 103 + 20
  }
  context.fillStyle = '#73819e'
  context.font = '500 16px sans-serif'
  context.fillText(`${window.location.host}${window.location.pathname} · Browser-local achievement collection`, 62, 1702)
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
}

export function AchievementBadgeSummary({ collection }: AchievementCollectionProps) {
  const available = achievementCatalog().filter(achievement => achievement.available)
  const earnedKeys = new Set(collection.records.map(record => record.key))
  const earned = available.filter(achievement => earnedKeys.has(achievement.key)).length
  return <a className="achievement-summary-link" href="#achievements" aria-label={`Achievements ${earned} of ${available.length} earned`}>
    <span aria-hidden="true">★</span>
    <strong>{earned}/{available.length}</strong>
    <small>Achievements</small>
  </a>
}

export function AchievementUnlockPopups({ achievements }: { achievements: AchievementDefinition[] }) {
  if (!achievements.length) return null
  return <aside className="achievement-unlock-popups" aria-label="New achievements" aria-live="polite">
    {achievements.map(achievement => <article className="achievement-unlock-popup" key={achievement.key}>
      <span className="achievement-icon" aria-hidden="true">{achievement.icon}</span>
      <div>
        <small>Achievement unlocked</small>
        <strong>{achievement.label}</strong>
        <p>{achievement.flavor}</p>
      </div>
    </article>)}
  </aside>
}

export default function AchievementCollection({ collection }: AchievementCollectionProps) {
  const [copyStatus, setCopyStatus] = useState('')
  const catalog = achievementCatalog()
  const earned = earnedMap(collection)
  const available = catalog.filter(achievement => achievement.available)
  const earnedCount = available.filter(achievement => earned.has(achievement.key)).length
  async function copyAchievementLedger() {
    const blob = await achievementLedgerImage(collection)
    if (!blob) {
      setCopyStatus('Image export is unavailable in this browser')
      return
    }
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopyStatus('Achievement image copied — paste it into Discord')
        return
      }
    } catch { /* fall through to a download */ }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'lura-achievement-ledger.png'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0)
    setCopyStatus('Achievement image downloaded')
  }
  return <section className="achievement-collection" id="achievements" aria-labelledby="achievements-title">
    <header>
      <div>
        <p className="eyebrow">ACHIEVEMENTS</p>
        <h2 id="achievements-title">L’ura’s movement ledger</h2>
        <p className="hint">Each badge is earned once and keeps its first completion date. Related feats may unlock together without filling the ledger with repeated difficulty and duty variants.</p>
      </div>
      <div className="achievement-header-actions">
        <strong className="achievement-progress">{earnedCount}/{available.length} earned</strong>
        <button type="button" className="achievement-copy-button" aria-label="Copy achievement ledger image" title="Copy achievement ledger image" onClick={copyAchievementLedger}>📋</button>
      </div>
    </header>
    {copyStatus && <p className="achievement-copy-status" role="status">{copyStatus}</p>}
    <div className="achievement-clusters">
      {CLUSTERS.map(cluster => {
        const entries = catalog.filter(achievement => achievement.cluster === cluster)
        const availableEntries = entries.filter(achievement => achievement.available)
        const clusterEarned = availableEntries.filter(achievement => earned.has(achievement.key)).length
        const slug = cluster.replaceAll(' ', '-').toLowerCase()
        return <section className={`achievement-cluster cluster-${slug}`} key={cluster} aria-labelledby={`achievement-${slug}`}>
          <header>
            <div>
              <h3 id={`achievement-${slug}`}>{cluster}</h3>
              <p>{CLUSTER_COPY[cluster]}</p>
            </div>
            <span>{clusterEarned}/{availableEntries.length}</span>
          </header>
          <div className="achievement-catalog">
            {entries.map(achievement => {
              const record = earned.get(achievement.key)
              const status = record ? 'Earned' : achievement.available ? 'Locked' : 'Coming soon'
              return <article aria-label={`${achievement.label} · ${status}`} className={record ? 'earned' : achievement.available ? 'locked' : 'coming-soon'} key={achievement.key}>
                <span className="achievement-icon" aria-hidden="true">{achievement.icon}</span>
                <div>
                  <div className="achievement-title"><h4>{achievement.label}</h4><span>{status}</span></div>
                  <p>{achievement.flavor}</p>
                  <small className="achievement-requirement"><b>How to earn</b>{achievement.requirement}</small>
                  {record && <small className="achievement-earned-at">{`First earned ${new Date(record.earnedAt).toLocaleString()}${record.playerName ? ` · ${record.playerName}` : ''}${record.attempt ? ` · Attempt #${record.attempt}` : ''}`}</small>}
                </div>
              </article>
            })}
          </div>
        </section>
      })}
    </div>
  </section>
}
