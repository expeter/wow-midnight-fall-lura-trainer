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
  const catalog = achievementCatalog()
  const earned = earnedMap(collection)
  const available = catalog.filter(achievement => achievement.available)
  const earnedCount = available.filter(achievement => earned.has(achievement.key)).length
  return <section className="achievement-collection" id="achievements" aria-labelledby="achievements-title">
    <header>
      <div>
        <p className="eyebrow">ACHIEVEMENTS</p>
        <h2 id="achievements-title">L’ura’s movement ledger</h2>
        <p className="hint">Each badge is earned once and keeps its first completion date. Related feats may unlock together without filling the ledger with repeated difficulty and duty variants.</p>
      </div>
      <strong className="achievement-progress">{earnedCount}/{available.length} earned</strong>
    </header>
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
