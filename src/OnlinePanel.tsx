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

const LOCAL_NAMES = ['Aegis', 'Voidrunner', 'Starweaver', 'Nightbloom', 'Dawnshield', 'Riftwalker', 'Moonstrike', 'Emberward', 'Silversong', 'Astralyn']
const LOCAL_REALMS = ['silvermoon', 'blackrock', 'draenor', 'tarren-mill', 'twisting-nether']
const LOCAL_GUILDS = ['I Asgard I', 'Midnight Crew', 'Nocturne', 'Crystal Clear', 'Last Pull']
function localFixtures(difficulty: 'normal' | 'hard', duty: 'crystal' | 'non-crystal'): LeaderboardRow[] {
  const categoryOffset = (difficulty === 'hard' ? 3 : 0) + (duty === 'non-crystal' ? 5 : 0)
  const categoryCode = `${difficulty === 'hard' ? 'H' : 'N'}${duty === 'crystal' ? 'C' : 'N'}`
  const topScore = difficulty === 'hard' ? 1780 : 1605
  return Array.from({ length: 100 }, (_, index) => {
  const rank = index + 1
  const baseName = LOCAL_NAMES[(index + categoryOffset) % LOCAL_NAMES.length]
  const displayName = rank === 65 ? `Your localhost character · ${categoryCode}` : `${baseName}-${categoryCode}${String(rank).padStart(2, '0')}`
  return {
    rank,
    displayName,
    character: rank % 4 === 0 ? null : displayName,
    realm: rank % 4 === 0 ? null : LOCAL_REALMS[(index + categoryOffset) % LOCAL_REALMS.length],
    region: rank % 4 === 0 ? null : 'eu',
    guild: rank % 5 === 0 ? null : LOCAL_GUILDS[(index + categoryOffset) % LOCAL_GUILDS.length],
    score: topScore - rank * (difficulty === 'hard' ? 7 : 6) - (duty === 'non-crystal' ? 18 : 0),
    durationMs: 265000 + categoryOffset * 2100 + rank * (difficulty === 'hard' ? 1400 : 1250),
    trainerVersion: '0.3.0',
  }
  })
}

export function OnlineStandingSummary({ session, onManage, onLogout }: { session: OnlineSession; onManage: () => void; onLogout?: () => void }) {
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
    <div className="online-summary-actions">
      <button className="online-summary-action" onClick={onManage}>{session.authenticated ? 'Manage profile' : 'Login'}</button>
      {session.authenticated && onLogout && <button className="online-summary-logout" onClick={onLogout}>Log out</button>}
    </div>
  </aside>
}

export default function OnlinePanel({
  onSession,
  view = 'leaderboard',
  compact = false,
  difficulty: requestedDifficulty,
  duty: requestedDuty,
  onOpenLeaderboard,
}: {
  onSession: (session: OnlineSession) => void
  view?: 'profile' | 'leaderboard'
  compact?: boolean
  difficulty?: 'normal' | 'hard'
  duty?: 'crystal' | 'non-crystal'
  onOpenLeaderboard?: () => void
}) {
  const [session, setSession] = useState<OnlineSession>({ authenticated: false })
  const [characters, setCharacters] = useState<OnlineCharacter[]>([])
  const [onlineAchievements, setOnlineAchievements] = useState<OnlineAchievement[]>([])
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>(requestedDifficulty ?? 'hard')
  const [duty, setDuty] = useState<'crystal' | 'non-crystal'>(requestedDuty ?? 'crystal')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false)
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false)
  const [loginRegion, setLoginRegion] = useState<'eu' | 'us'>('eu')
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
  useEffect(() => { if (requestedDifficulty) setDifficulty(requestedDifficulty) }, [requestedDifficulty])
  useEffect(() => { if (requestedDuty) setDuty(requestedDuty) }, [requestedDuty])

  const csrf = session.csrfToken ?? ''
  const localhostPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const localRows = localFixtures(difficulty, duty)
  const ownStanding = session.standings?.find(row => row.difficulty === difficulty && row.duty === duty)
    ?? (localhostPreview ? {
      difficulty,
      duty,
      position: 65,
      score: localRows[64].score,
      durationMs: localRows[64].durationMs,
    } : undefined)
  const sourceRows = localhostPreview && (!leaderboardLoaded || rows.length === 0) ? localRows : rows
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredRows = normalizedSearch && sourceRows === localRows
    ? sourceRows.filter(row => [row.displayName, row.character, row.realm, row.guild].some(value => value?.toLocaleLowerCase().includes(normalizedSearch)))
    : sourceRows
  const displayedRows = showFullLeaderboard ? filteredRows : filteredRows.slice(0, 10)
  const selectedCharacter = characters.find(character => character.selected)
  return <section className={`online-panel ${compact ? 'compact' : ''}`} aria-labelledby="online-title">
    <header>
      <div><p className="eyebrow">{view === 'profile' ? 'Optional online profile' : 'Verified rankings'}</p><h2 id="online-title">{view === 'profile' ? 'My characters' : showFullLeaderboard ? 'Full leaderboard' : 'Top 10 leaderboard'}</h2></div>
      {view === 'profile' && <a className="online-privacy-link" href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy policy</a>}
    </header>
    {view === 'profile' && <p role="status">{status}</p>}
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
    </div> : view === 'profile' ? <div className="online-profile-login">
      <div className="online-explainer">
        <strong>Connect your own characters</strong>
        <p>Battle.net login imports only the WoW characters owned by your account. Anonymous practice remains available without signing in.</p>
      </div>
      <div className="online-login">
        <label>Region<select aria-label="Battle.net region" value={loginRegion} onChange={event => setLoginRegion(event.target.value as 'eu' | 'us')}>
          <option value="eu">EU</option><option value="us">US</option>
        </select></label>
        <a className="button-link" href={battleNetLoginUrl(loginRegion)}>Login with Battle.net</a>
      </div>
    </div> : <div className={`online-leaderboard ${compact ? 'compact' : ''}`}>
      {compact ? <p className="compact-leaderboard-filter">{difficulty === 'hard' ? 'Hard' : 'Normal'} · {duty === 'crystal' ? 'Crystal carrier' : 'Non-crystal'} · Top 10</p> : <div className="leaderboard-categories" aria-label="Leaderboard categories">
        {([
          ['normal', 'crystal', 'Normal · Crystal'],
          ['hard', 'crystal', 'Hard · Crystal'],
          ['normal', 'non-crystal', 'Normal · Non-crystal'],
          ['hard', 'non-crystal', 'Hard · Non-crystal'],
        ] as const).map(([nextDifficulty, nextDuty, label]) => <button
          key={`${nextDifficulty}-${nextDuty}`}
          className={difficulty === nextDifficulty && duty === nextDuty ? 'selected' : ''}
          aria-current={difficulty === nextDifficulty && duty === nextDuty ? 'page' : undefined}
          onClick={() => { setDifficulty(nextDifficulty); setDuty(nextDuty) }}
        >{label}</button>)}
      </div>}
      <div className="leaderboard-columns" aria-hidden="true"><span>Rank and player</span><span>Guild · score · time</span></div>
      {displayedRows.length ? <ol className={`leaderboard-rows ${showFullLeaderboard ? 'full' : 'top-ten'}`}>
        {displayedRows.map((row, index) => <li key={`${row.displayName}-${row.durationMs}-${index}`}>
          <b>{row.rank ?? index + 1}. {row.character && row.region && row.realm
            ? <a href={`https://raider.io/characters/${row.region}/${row.realm}/${row.character}`} target="_blank" rel="noreferrer">{row.displayName}</a>
            : row.displayName}</b>
          <span>{row.guild ? `${row.guild} · ` : ''}{row.score} pts · {(row.durationMs / 1000).toFixed(1)}s</span>
        </li>)}
      </ol> : <p>No matching verified results yet.</p>}
      {ownStanding && <div className="leaderboard-own-position" aria-label="Your leaderboard position">
        <span aria-hidden="true">…</span>
        <p><b>{ownStanding.position}. {localhostPreview && !session.authenticated ? 'Your localhost test position' : 'Your verified position'}</b><span>{ownStanding.score} pts · {(ownStanding.durationMs / 1000).toFixed(1)}s</span></p>
      </div>}
      {!compact && <div className="leaderboard-search">
        <label><span>Find a public ranking</span><small>Searches public character names, aliases, realms, and guilds—not your Battle.net character list.</small>
          <input aria-label="Search public leaderboard" value={search} onChange={event => setSearch(event.target.value)} placeholder="Character, alias, realm, or guild" />
        </label>
        <button className="secondary" onClick={() => void refreshLeaderboard()}>Search rankings</button>
        <button className="secondary full-leaderboard-toggle" onClick={() => setShowFullLeaderboard(current => !current)}>
          {showFullLeaderboard ? 'Back to Top 10' : 'View full leaderboard'}
        </button>
      </div>}
      {compact && <button className="secondary full-leaderboard-toggle compact-leaderboard-link" onClick={onOpenLeaderboard}>Open full leaderboard</button>}
    </div>}
  </section>
}
