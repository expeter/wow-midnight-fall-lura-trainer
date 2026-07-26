import { achievementCatalog, type AchievementCollectionData } from './achievementCollection'

interface AchievementCollectionProps {
  collection: AchievementCollectionData
}

function earnedMap(collection: AchievementCollectionData) {
  return new Map(collection.records.map(record => [record.key, record]))
}

export function AchievementBadgeSummary({ collection }: AchievementCollectionProps) {
  const catalog = achievementCatalog()
  const total = catalog.length
  const earnedKeys = new Set(collection.records.map(record => record.key))
  const earned = catalog.filter(achievement => earnedKeys.has(achievement.key)).length
  return <a className="achievement-summary-link" href="#achievements" aria-label={`Achievements ${earned} of ${total} earned`}>
    <span aria-hidden="true">★</span>
    <strong>{earned}/{total}</strong>
    <small>Achievements</small>
  </a>
}

export default function AchievementCollection({ collection }: AchievementCollectionProps) {
  const catalog = achievementCatalog()
  const earned = earnedMap(collection)
  const earnedCount = catalog.filter(achievement => earned.has(achievement.key)).length
  return <section className="achievement-collection" id="achievements" aria-labelledby="achievements-title">
    <header>
      <div>
        <p className="eyebrow">ACHIEVEMENTS</p>
        <h2 id="achievements-title">Movement collection</h2>
        <p className="hint">Earned badges stay in this browser. Difficulty and crystal duty are tracked as separate challenges.</p>
      </div>
      <strong className="achievement-progress">{earnedCount}/{catalog.length} earned</strong>
    </header>
    <div className="achievement-catalog">
      {catalog.map(achievement => {
        const record = earned.get(achievement.key)
        return <article className={record ? 'earned' : 'locked'} key={achievement.key}>
          <span className="achievement-icon" aria-hidden="true">{record ? achievement.icon : '◌'}</span>
          <div>
            <h3>{achievement.label}</h3>
            <p>{achievement.difficulty} · {achievement.crystalPlayer ? 'Crystal player' : 'Non-crystal player'}</p>
            <small className="achievement-requirement">{achievement.detail}</small>
            <small>{record
              ? `First earned ${new Date(record.earnedAt).toLocaleString()}${record.playerName ? ` · ${record.playerName}` : ''}${record.attempt ? ` · Attempt #${record.attempt}` : ''}`
              : 'Locked'}</small>
          </div>
        </article>
      })}
    </div>
  </section>
}
