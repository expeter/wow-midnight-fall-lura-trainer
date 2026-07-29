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

const LOCAL_FIXTURES: LeaderboardRow[] = [
  { rank: 1, displayName: 'Aegis', character: 'Aegis', realm: 'silvermoon', region: 'eu', guild: 'I Asgard I', score: 1460, durationMs: 287400, trainerVersion: '0.3.0' },
  { rank: 2, displayName: 'Voidrunner', character: null, realm: null, region: null, guild: null, score: 1390, durationMs: 294100, trainerVersion: '0.3.0' },
  { rank: 3, displayName: 'Anonymous', character: null, realm: null, region: null, guild: null, score: 1325, durationMs: 301800, trainerVersion: '0.3.0' },
]

export function OnlineStandingSummary({ session, onManage }: { session: OnlineSession; onManage: () => void }) {
  const standings = session.standings ?? []
  const best = (difficulty: 'normal' | 'hard') => standings
    .filter(row => row.difficulty === difficulty)
    .sort((left, right) => left.position - right.position)[0]
  return <aside className="online-standing-summary" aria-label="Current online standings">
    <span aria-hidden="true">⌁</span>
    <div>
      <strong>Online standings</strong>
      {!session.authenticated
        ? <small>Optional · connect a Battle.net character</small>
        : <><small>
          Signed in{session.selectedCharacter ? ` · ${session.selectedCharacter.name}—${session.selectedCharacter.realmSlug}` : ' · choose a character'}
        </small><small>
          Normal {best('normal') ? `#${best('normal')!.position}` : '—'}
          {' · '}Hard {best('hard') ? `#${best('hard')!.position}` : '—'}
        </small></>}
    </div>
    <button className="online-summary-action" onClick={onManage}>{session.authenticated ? 'Manage profile' : 'Login'}</button>
  </aside>
}

export default function OnlinePanel({ onSession }: { onSession: (session: OnlineSession) => void }) {
  const [session, setSession] = useState<OnlineSession>({ authenticated: false })
  const [characters, setCharacters] = useState<OnlineCharacter[]>([])
  const [onlineAchievements, setOnlineAchievements] = useState<OnlineAchievement[]>([])
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('hard')
  const [duty, setDuty] = useState<'crystal' | 'non-crystal'>('crystal')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false)
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false)
  const [loginRegion, setLoginRegion] = useState<'eu' | 'us'>('eu')
  const [status, setStatus] = useState('Loading online profile…')
  const [identityMode, setIdentityMode] = useState<'anonymous' | 'alias' | 'character'>('anonymous')
  const [alias, setAlias] = useState('')
  const [showGuild, setShowGuild] = useState(false)
  const [view, setView] = useState<'profile' | 'leaderboard'>('leaderboard')

  async function refreshSession() {
    try {
      const next = await loadOnlineSession()
      setSession(next)
      onSession(next)
      if (next.authenticated) {
        setView('profile')
        setIdentityMode(next.privacy?.identityMode ?? 'anonymous')
        setAlias(next.privacy?.alias ?? '')
        setShowGuild(Boolean(next.privacy?.showGuild))
        const [loaded, achievements] = await Promise.all([
          loadCharacters(),
          loadOnlineAchievements(),
        ])
        const rows = Array.isArray(loaded.rows) ? loaded.rows : []
        const selected = rows.find(character => character.selected)
        setCharacters(rows)
        setOnlineAchievements(Array.isArray(achievements.rows) ? achievements.rows : [])
        const decorated = selected ? {
          ...next,
          selectedCharacter: {
            name: selected.name,
            realmSlug: selected.realmSlug,
            region: selected.region,
          },
        } : next
        setSession(decorated)
        onSession(decorated)
        setStatus('')
      } else setStatus('Login is optional. Anonymous play remains fully available.')
    } catch {
      setStatus('Online service unavailable. Local play still works.')
    }
  }

  async function refreshLeaderboard() {
    try {
      const loaded = await loadLeaderboard(difficulty, duty, search, showFullLeaderboard ? 100 : 10)
      setRows(Array.isArray(loaded.rows) ? loaded.rows : [])
      setLeaderboardLoaded(true)
    } catch {
      setRows([])
      setLeaderboardLoaded(false)
    }
  }

  useEffect(() => { void refreshSession() }, [])
  useEffect(() => { void refreshLeaderboard() }, [difficulty, duty, showFullLeaderboard])

  const csrf = session.csrfToken ?? ''
  const displayedRows = rows.length || !leaderboardLoaded || !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? rows
    : LOCAL_FIXTURES
  const selectedCharacter = characters.find(character => character.selected)
  return <section className="online-panel" aria-labelledby="online-title">
    <header>
      <div><p className="eyebrow">Optional online profile</p><h2 id="online-title">{view === 'profile' ? 'My characters' : showFullLeaderboard ? 'Full leaderboard' : 'Top 10 leaderboard'}</h2></div>
      <a href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy</a>
    </header>
    <p role="status">{status}</p>
    <nav className="online-view-tabs" aria-label="Online sections">
      {session.authenticated && <button className={view === 'profile' ? 'selected' : ''} aria-current={view === 'profile' ? 'page' : undefined} onClick={() => setView('profile')}>My characters</button>}
      <button className={view === 'leaderboard' ? 'selected' : ''} aria-current={view === 'leaderboard' ? 'page' : undefined} onClick={() => setView('leaderboard')}>Leaderboard</button>
    </nav>
    {view === 'profile' && session.authenticated ? <div className="online-account">
      <div className="online-explainer">
        <strong>Choose who represents your verified runs</strong>
        <p>Your active character is used for new verified attempts. Character selection saves immediately; visibility changes save only when you use the save button.</p>
      </div>
      <label className="online-field">Active character <small>Only characters imported from your Battle.net account appear here. Selection saves automatically.</small>
        <select aria-label="Active character" value={selectedCharacter?.id ?? ''} onChange={async event => {
          await selectCharacter(Number(event.target.value), csrf)
          await refreshSession()
          setStatus('Character selected and saved.')
        }}>
          <option value="">Choose a character</option>
          {characters.map(character => <option key={character.id} value={character.id}>
            {character.name} — {character.realmSlug}{character.guildName ? ` · ${character.guildName}` : ''}
          </option>)}
        </select>
      </label>
      <label className="online-field">Leaderboard name <small>Choose what other players see beside your verified scores.</small>
        <select value={identityMode} onChange={event => setIdentityMode(event.target.value as typeof identityMode)}>
          <option value="anonymous">Anonymous — hide my identity</option>
          <option value="character">Character — show my selected character</option>
          <option value="alias">Alias — show a trainer name</option>
        </select>
      </label>
      {identityMode === 'alias' && <label className="online-field">Public trainer alias
        <input maxLength={40} value={alias} onChange={event => setAlias(event.target.value)} />
      </label>}
      <label className="online-guild-toggle">
        <input type="checkbox" checked={showGuild} disabled={identityMode === 'anonymous'} onChange={event => setShowGuild(event.target.checked)} />
        <span>Show my guild on leaderboard rows<small>Uses the guild recorded during the latest Battle.net character import.</small></span>
      </label>
      <div className="online-account-actions">
        <button className="secondary" onClick={() => void refreshCharacters(csrf).then(result => {
          window.location.assign(result.authorizationUrl)
        }).catch(() => setStatus('Could not refresh characters.'))}>Update my Battle.net characters</button>
        <button onClick={() => void updatePrivacy(csrf, {
          identityMode,
          alias,
          showGuild,
        }).then(() => {
          setStatus('Privacy settings saved.')
          return refreshSession()
        }).catch(() => setStatus('Could not save privacy settings.'))}>Save leaderboard visibility</button>
        <button className="secondary" onClick={() => void logoutOnline(csrf).then(refreshSession)}>Log out of online profile</button>
      </div>
      <details className="online-achievements">
        <summary>Verified online achievements · {onlineAchievements.length}</summary>
        {onlineAchievements.length ? <ul>{onlineAchievements.map(achievement => <li key={`${achievement.achievementId}-${achievement.trainerVersion}`}>
          <b>{achievement.achievementId}</b> · {achievement.characterName} · v{achievement.trainerVersion}
        </li>)}</ul> : <p>Complete a server-issued attempt to earn verified achievements.</p>}
      </details>
      <details className="online-danger-zone">
        <summary>Account and data removal</summary>
        <button className="danger" onClick={() => {
          if (window.confirm('Permanently delete all online L’ura Trainer data?')) {
            void deleteOnlineData(csrf).then(refreshSession)
          }
        }}>Delete all my online data</button>
      </details>
    </div> : view === 'profile' ? null : <div className="online-leaderboard">
      <div className="online-explainer">
        <strong>Verified public rankings</strong>
        <p>Each row is one player’s best server-verified result for the selected difficulty and duty. Rank is ordered by score, then completion time.</p>
      </div>
      {!session.authenticated && <div className="online-login">
        <span>Want your runs listed?</span>
        <label>Region<select aria-label="Battle.net region" value={loginRegion} onChange={event => setLoginRegion(event.target.value as 'eu' | 'us')}>
          <option value="eu">EU</option><option value="us">US</option>
        </select></label>
        <a className="button-link" href={battleNetLoginUrl(loginRegion)}>Login with Battle.net</a>
      </div>}
      <div className="leaderboard-controls">
        <label>Difficulty<select aria-label="Leaderboard difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as 'normal' | 'hard')}>
          <option value="normal">Normal</option><option value="hard">Hard</option>
        </select></label>
        <label>Assignment<select aria-label="Leaderboard duty" value={duty} onChange={event => setDuty(event.target.value as 'crystal' | 'non-crystal')}>
          <option value="crystal">Crystal carrier</option><option value="non-crystal">Non-crystal</option>
        </select></label>
      </div>
      <div className="leaderboard-columns" aria-hidden="true"><span>Rank and player</span><span>Guild · score · time</span></div>
      {displayedRows.length ? <ol className={`leaderboard-rows ${showFullLeaderboard ? 'full' : 'top-ten'}`}>
        {displayedRows.map((row, index) => <li key={`${row.displayName}-${row.durationMs}-${index}`}>
          <b>{row.rank ?? index + 1}. {row.character && row.region && row.realm
            ? <a href={`https://raider.io/characters/${row.region}/${row.realm}/${row.character}`} target="_blank" rel="noreferrer">{row.displayName}</a>
            : row.displayName}</b>
          <span>{row.guild ? `${row.guild} · ` : ''}{row.score} pts · {(row.durationMs / 1000).toFixed(1)}s</span>
        </li>)}
      </ol> : <p>No matching verified results yet.</p>}
      <div className="leaderboard-search">
        <label><span>Find a public ranking</span><small>Searches public character names, aliases, realms, and guilds—not your Battle.net character list.</small>
          <input aria-label="Search public leaderboard" value={search} onChange={event => setSearch(event.target.value)} placeholder="Character, alias, realm, or guild" />
        </label>
        <button className="secondary" onClick={() => void refreshLeaderboard()}>Search rankings</button>
        <button className="secondary full-leaderboard-toggle" onClick={() => setShowFullLeaderboard(current => !current)}>
          {showFullLeaderboard ? 'Back to Top 10' : 'View full leaderboard'}
        </button>
      </div>
    </div>}
  </section>
}
