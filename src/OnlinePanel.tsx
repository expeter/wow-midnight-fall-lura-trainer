import { useEffect, useState } from 'react'
import {
  battleNetLoginUrl,
  deleteOnlineData,
  loadCharacters,
  loadLeaderboard,
  loadOnlineAchievements,
  loadOnlineSession,
  logoutOnline,
  refreshCharacters,
  selectCharacter,
  updatePrivacy,
  type LeaderboardRow,
  type OnlineCharacter,
  type OnlineAchievement,
  type OnlineSession,
} from './online'

export default function OnlinePanel({ onSession }: { onSession: (session: OnlineSession) => void }) {
  const [session, setSession] = useState<OnlineSession>({ authenticated: false })
  const [characters, setCharacters] = useState<OnlineCharacter[]>([])
  const [onlineAchievements, setOnlineAchievements] = useState<OnlineAchievement[]>([])
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('hard')
  const [duty, setDuty] = useState<'crystal' | 'non-crystal'>('crystal')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [status, setStatus] = useState('Loading online profile…')
  const [identityMode, setIdentityMode] = useState<'anonymous' | 'alias' | 'character'>('anonymous')
  const [alias, setAlias] = useState('')
  const [showGuild, setShowGuild] = useState(false)

  async function refreshSession() {
    try {
      const next = await loadOnlineSession()
      setSession(next)
      onSession(next)
      if (next.authenticated) {
        setIdentityMode(next.privacy?.identityMode ?? 'anonymous')
        setAlias(next.privacy?.alias ?? '')
        setShowGuild(Boolean(next.privacy?.showGuild))
        const [loaded, achievements] = await Promise.all([
          loadCharacters(),
          loadOnlineAchievements(),
        ])
        setCharacters(Array.isArray(loaded.rows) ? loaded.rows : [])
        setOnlineAchievements(Array.isArray(achievements.rows) ? achievements.rows : [])
        setStatus('')
      } else setStatus('Login is optional. Anonymous play remains fully available.')
    } catch {
      setStatus('Online service unavailable. Local play still works.')
    }
  }

  async function refreshLeaderboard() {
    try {
      const loaded = await loadLeaderboard(difficulty, duty, search)
      setRows(Array.isArray(loaded.rows) ? loaded.rows : [])
    } catch {
      setRows([])
    }
  }

  useEffect(() => { void refreshSession() }, [])
  useEffect(() => { void refreshLeaderboard() }, [difficulty, duty])

  const csrf = session.csrfToken ?? ''
  return <section className="online-panel" aria-labelledby="online-title">
    <header>
      <div><p className="eyebrow">Optional online profile</p><h2 id="online-title">Leaderboards</h2></div>
      <a href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy</a>
    </header>
    <p role="status">{status}</p>
    {!session.authenticated ? <div className="online-login">
      <span>Login with Battle.net to post verified results:</span>
      <a className="button-link" href={battleNetLoginUrl('eu')}>Europe</a>
      <a className="button-link secondary" href={battleNetLoginUrl('us')}>Americas</a>
    </div> : <div className="online-account">
      <label>Verified character
        <select value={characters.find(character => character.selected)?.id ?? ''} onChange={async event => {
          await selectCharacter(Number(event.target.value), csrf)
          await refreshSession()
        }}>
          <option value="">Choose a character</option>
          {characters.map(character => <option key={character.id} value={character.id}>
            {character.name} — {character.realmSlug}{character.guildName ? ` · ${character.guildName}` : ''}
          </option>)}
        </select>
      </label>
      <label>Public identity
        <select value={identityMode} onChange={event => setIdentityMode(event.target.value as typeof identityMode)}>
          <option value="anonymous">Anonymous</option>
          <option value="character">Verified character</option>
          <option value="alias">Trainer alias</option>
        </select>
      </label>
      {identityMode === 'alias' && <label>Public trainer alias
        <input maxLength={40} value={alias} onChange={event => setAlias(event.target.value)} />
      </label>}
      <label className="online-guild-toggle">
        <input type="checkbox" checked={showGuild} disabled={identityMode === 'anonymous'} onChange={event => setShowGuild(event.target.checked)} />
        Show cached guild
      </label>
      <div className="online-account-actions">
        <button className="secondary" onClick={() => void refreshCharacters(csrf).then(result => {
          window.location.assign(result.authorizationUrl)
        }).catch(() => setStatus('Could not refresh characters.'))}>Refresh characters</button>
        <button onClick={() => void updatePrivacy(csrf, {
          identityMode,
          alias,
          showGuild,
        }).then(() => {
          setStatus('Privacy settings saved.')
          return refreshSession()
        }).catch(() => setStatus('Could not save privacy settings.'))}>Save privacy</button>
        <button className="secondary" onClick={() => void logoutOnline(csrf).then(refreshSession)}>Log out</button>
        <button className="danger" onClick={() => {
          if (window.confirm('Permanently delete all online L’ura Trainer data?')) {
            void deleteOnlineData(csrf).then(refreshSession)
          }
        }}>Delete online data</button>
      </div>
      <details className="online-achievements">
        <summary>Verified online achievements · {onlineAchievements.length}</summary>
        {onlineAchievements.length ? <ul>{onlineAchievements.map(achievement => <li key={`${achievement.achievementId}-${achievement.trainerVersion}`}>
          <b>{achievement.achievementId}</b> · {achievement.characterName} · v{achievement.trainerVersion}
        </li>)}</ul> : <p>Complete a server-issued attempt to earn verified achievements.</p>}
      </details>
    </div>}
    <div className="leaderboard-controls">
      <select aria-label="Leaderboard difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as 'normal' | 'hard')}>
        <option value="normal">Normal</option><option value="hard">Hard</option>
      </select>
      <select aria-label="Leaderboard duty" value={duty} onChange={event => setDuty(event.target.value as 'crystal' | 'non-crystal')}>
        <option value="crystal">Crystal</option><option value="non-crystal">Non-crystal</option>
      </select>
      <input aria-label="Search leaderboard" value={search} onChange={event => setSearch(event.target.value)} placeholder="Character, alias, realm, guild" />
      <button className="secondary" onClick={() => void refreshLeaderboard()}>Search</button>
    </div>
    {rows.length ? <ol className="leaderboard-rows">
      {rows.map((row, index) => <li key={`${row.displayName}-${row.durationMs}-${index}`}>
        <b>{index + 1}. {row.displayName}</b>
        <span>{row.guild ? `${row.guild} · ` : ''}{row.score} pts · {(row.durationMs / 1000).toFixed(1)}s</span>
      </li>)}
    </ol> : <p>No matching verified results yet.</p>}
  </section>
}
