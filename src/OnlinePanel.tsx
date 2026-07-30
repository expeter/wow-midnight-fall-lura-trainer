import { useEffect, useState } from 'react'
import {
  battleNetLoginUrl,
  deleteOnlineData,
  loadCharacters,
  loadAchievementHall,
  loadGlobalRanking,
  loadLeaderboard,
  loadOnlineAchievements,
  loadOnlineSession,
  logoutOnline,
  loadPublicPlayerProfile,
  refreshCharacters,
  selectCharacter,
  updatePrivacy,
  type LeaderboardRow,
  type AchievementHallRow,
  type OnlineCharacter,
  type OnlineAchievement,
  type OnlineSession,
  type PublicPlayerProfile,
  type GlobalRankingRow,
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
    profileId: rank.toString(16).padStart(24, '0'),
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

const LOCAL_HALL_FIXTURES: AchievementHallRow[] = Array.from({ length: 100 }, (_, index) => {
  const rank = index + 1
  const tiers = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
  const points = [200, 100, 50, 25, 10]
  const tierIndex = Math.min(4, Math.floor(index / 20))
  return {
    rank,
    profileId: (rank + 1000).toString(16).padStart(24, '0'),
    displayName: rank === 65 ? 'Your localhost profile' : `${LOCAL_NAMES[(index + 2) % LOCAL_NAMES.length]}-HF${String(rank).padStart(2, '0')}`,
    guild: rank % 5 ? LOCAL_GUILDS[(index + 1) % LOCAL_GUILDS.length] : null,
    totalPoints: Math.max(10, 1675 - rank * 13),
    achievementCount: Math.max(1, 29 - Math.floor(rank / 4)),
    highestAchievement: {
      id: `fixture-${rank}`,
      title: rank <= 10 ? 'Beyond the Impossible' : rank <= 30 ? 'The Stars Can Wait' : 'Perfectly Orb-ital',
      tier: tiers[tierIndex],
      points: points[tierIndex],
      firstEarnedAt: new Date(Date.UTC(2026, 6, 1) + rank * 86400000).toISOString(),
      featOfStrength: rank % 17 === 0,
    },
  }
})

const LOCAL_GLOBAL_FIXTURES: GlobalRankingRow[] = Array.from({ length: 100 }, (_, index) => {
  const rank = index + 1
  const achievementPoints = Math.max(50, 725 - index * 7)
  const runPoints = 6370 - index * 31
  return {
    rank,
    profileId: (rank + 2000).toString(16).padStart(24, '0'),
    displayName: `${LOCAL_NAMES[(index + 2) % LOCAL_NAMES.length]}-G${String(rank).padStart(2, '0')}`,
    guild: rank % 5 ? LOCAL_GUILDS[index % LOCAL_GUILDS.length] : null,
    achievementPoints,
    runPoints,
    totalPoints: achievementPoints + runPoints,
    crystalFlawless: rank % 3 !== 0,
    hardClear: rank % 4 !== 0,
  }
})

export function OnlineStandingSummary({ session, onManage, onLogout }: { session: OnlineSession; onManage: () => void; onLogout?: () => void }) {
  return <aside className="online-standing-summary" aria-label="Current online standings">
    <span aria-hidden="true">⌁</span>
    <div>
      <strong>{session.authenticated ? 'Online profile' : 'Online ranking'}</strong>
      {!session.authenticated
        ? <small>Optional · connect a Battle.net character</small>
        : <><small>
          Signed in{session.selectedCharacter ? ` · ${session.selectedCharacter.name}—${session.selectedCharacter.realmSlug}` : ' · choose a character'}
        </small><small>Global position {session.globalPosition ? `#${session.globalPosition}` : '—'}</small></>}
    </div>
    <div className="online-summary-actions">
      <button className="online-summary-action" onClick={onManage}>{session.authenticated ? 'Manage profile' : 'Login'}</button>
      {session.authenticated && onLogout && <button className="online-summary-logout" onClick={onLogout}>Log out</button>}
    </div>
  </aside>
}

export function GlobalRankingSummary() {
  const [rows, setRows] = useState<GlobalRankingRow[] | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  useEffect(() => { void loadGlobalRanking(3).then(result => {
    const loaded = Array.isArray(result.rows) ? result.rows : []
    setRows(loaded.length || !['localhost', '127.0.0.1'].includes(window.location.hostname) ? loaded : LOCAL_GLOBAL_FIXTURES)
  }).catch(() => setRows(['localhost', '127.0.0.1'].includes(window.location.hostname) ? LOCAL_GLOBAL_FIXTURES : [])) }, [])
  if (rows === null || rows.length === 0) return null
  const podium = Array.from({ length: 3 }, (_, index) => rows[index] ?? null)
  return <aside className="global-ranking-summary" aria-label="Global player ranking">
    <div><p className="eyebrow">GLOBAL RANKING</p><strong>Achievement + best run points</strong></div>
    <ol>{podium.map((row, index) => <li key={row?.profileId ?? `empty-${index}`} className={row ? '' : 'empty'}>{row
      ? <button className="podium-card" onClick={() => setProfileId(row.profileId)}><span>{row.totalPoints} global points</span><b>{row.displayName}</b>{row.guild && <small>{row.guild}</small>}<i aria-hidden="true">{['🏆', '🥈', '🥉'][index]}</i></button>
      : <span aria-label={`Global rank ${index + 1} is empty`} />}</li>)}</ol>
    {profileId && <PublicProfileOverlay profileId={profileId} onClose={() => setProfileId(null)} />}
  </aside>
}

export function BestRunsSummary({ session, onOpen }: { session: OnlineSession; onOpen: () => void }) {
  const boards = [
    ['normal', 'crystal', 'Normal · crystal'],
    ['normal', 'non-crystal', 'Normal · non-crystal'],
    ['hard', 'crystal', 'Hard · crystal'],
    ['hard', 'non-crystal', 'Hard · non-crystal'],
  ] as const
  return <aside className="best-runs-summary" aria-label="Best run standings">
    <span aria-hidden="true">◆</span>
    <div><strong>Best runs{session.globalPosition ? ` · Global #${session.globalPosition}` : ''}</strong></div>
    <button type="button" onClick={onOpen}>View standings</button>
    <ul>{boards.map(([difficulty, duty, label]) => {
      const standing = session.standings?.find(row => row.difficulty === difficulty && row.duty === duty)
      return <li key={`${difficulty}:${duty}`}><small>{label}</small><b>{standing ? `#${standing.position}` : ''}</b></li>
    })}</ul>
  </aside>
}

function GlobalRankRow({ row, onOpenProfile }: { row: GlobalRankingRow; onOpenProfile: (profileId: string) => void }) {
  return <li>
    <span className={`global-rank rank-${row.rank}`}>{row.rank <= 3 ? ['🏆', '🥈', '🥉'][row.rank - 1] : row.rank}</span>
    <button className="profile-name-button" onClick={() => onOpenProfile(row.profileId)}>{row.displayName}</button>
    <span className="player-credentials">{row.crystalFlawless && <i title="Flawless crystal run" aria-label="Flawless crystal run">◆</i>}{row.hardClear && <i title="Hard mode clear" aria-label="Hard mode clear">H</i>}</span>
    <b>{row.totalPoints} pts</b>
  </li>
}

function GlobalLeaderboard({ rows, own, search, onSearch, onRefresh, onOpenProfile }: {
  rows: GlobalRankingRow[]
  own: GlobalRankingRow | null
  search: string
  onSearch: (value: string) => void
  onRefresh: () => void
  onOpenProfile: (profileId: string) => void
}) {
  return <section className="global-leaderboard" aria-label="Global leaderboard standings">
    <div className="leaderboard-columns" aria-hidden="true"><span>Global rank and player</span><span>Credentials · points</span></div>
    <ol className="global-leaderboard-rows">{rows.map(row => <GlobalRankRow key={row.profileId} row={row} onOpenProfile={onOpenProfile} />)}</ol>
    {own && own.rank > 10 && <div className="leaderboard-own-position global-own-position" aria-label="Your global position">
      <span aria-hidden="true">…</span>
      <p><b>{own.rank}. <button className="profile-name-button" onClick={() => onOpenProfile(own.profileId)}>{own.displayName}</button></b><span>{own.totalPoints} pts</span></p>
    </div>}
    <div className="leaderboard-search">
      <label><span>Find a public ranking</span><small>Searches public player names and guilds.</small>
        <input aria-label="Search global leaderboard" value={search} onChange={event => onSearch(event.target.value)} />
      </label>
      <button className="secondary" onClick={onRefresh}>Search rankings</button>
    </div>
  </section>
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
  const [leaderboardView, setLeaderboardView] = useState<'global' | 'runs' | 'hall'>('global')
  const [globalRows, setGlobalRows] = useState<GlobalRankingRow[]>([])
  const [globalOwn, setGlobalOwn] = useState<GlobalRankingRow | null>(null)
  const [globalLoaded, setGlobalLoaded] = useState(false)
  const [hallRows, setHallRows] = useState<AchievementHallRow[]>([])
  const [hallOwn, setHallOwn] = useState<AchievementHallRow | null>(null)
  const [hallLoaded, setHallLoaded] = useState(false)
  const [loginRegion, setLoginRegion] = useState<'eu' | 'us'>('eu')
  const [loginPending, setLoginPending] = useState(false)
  const [status, setStatus] = useState('Loading online profile…')
  const [identityMode, setIdentityMode] = useState<'anonymous' | 'alias' | 'character'>('anonymous')
  const [alias, setAlias] = useState('')
  const [showGuild, setShowGuild] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

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
      const loaded = await loadLeaderboard(difficulty, duty, search, 10)
      setRows(Array.isArray(loaded.rows) ? loaded.rows : [])
      setLeaderboardLoaded(true)
    } catch {
      setRows([])
      setLeaderboardLoaded(false)
    }
  }

  async function refreshHall() {
    try {
      const loaded = await loadAchievementHall(search, 10)
      setHallRows(Array.isArray(loaded.rows) ? loaded.rows : [])
      setHallOwn(loaded.own ?? null)
      setHallLoaded(true)
    } catch {
      setHallRows([])
      setHallOwn(null)
      setHallLoaded(false)
    }
  }

  async function refreshGlobal() {
    try {
      const loaded = await loadGlobalRanking(10, search)
      setGlobalRows(Array.isArray(loaded.rows) ? loaded.rows : [])
      setGlobalOwn(loaded.own ?? null)
      setGlobalLoaded(true)
    } catch {
      setGlobalRows([])
      setGlobalOwn(null)
      setGlobalLoaded(false)
    }
  }

  useEffect(() => { void refreshSession() }, [])
  useEffect(() => { void refreshLeaderboard() }, [difficulty, duty])
  useEffect(() => { if (leaderboardView === 'hall') void refreshHall() }, [leaderboardView])
  useEffect(() => { if (leaderboardView === 'global') void refreshGlobal() }, [leaderboardView])
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
  const displayedRows = filteredRows.slice(0, 10)
  const selectedCharacter = characters.find(character => character.selected)
  return <section className={`online-panel ${compact ? 'compact' : ''}${view === 'leaderboard' && leaderboardView === 'runs' && difficulty === 'hard' ? ' hard-board' : ''}`} aria-labelledby="online-title">
    <header>
      <div><p className="eyebrow">{view === 'profile' ? 'Optional online profile' : 'Verified rankings'}</p><h2 id="online-title">{view === 'profile' ? 'My characters' : leaderboardView === 'global' ? 'Global leaderboard' : leaderboardView === 'hall' ? 'Achievement Hall of Fame' : 'Top 10 leaderboard'}</h2></div>
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
        <a
          className={`button-link online-login-action${loginPending ? ' pending' : ''}`}
          href={battleNetLoginUrl(loginRegion)}
          aria-label={loginPending ? 'Redirecting to Battle.net' : 'Login with Battle.net'}
          aria-live="polite"
          onClick={() => setLoginPending(true)}
        >{loginPending && <span className="online-login-spinner" aria-hidden="true" />}
          {loginPending ? 'Redirecting to Battle.net…' : 'Login with Battle.net'}
        </a>
      </div>
    </div> : <div className={`online-leaderboard ${compact ? 'compact' : ''}`}>
      {!compact && <div className="leaderboard-view-switch" aria-label="Leaderboard type">
        <button className={leaderboardView === 'global' ? 'selected' : ''} aria-current={leaderboardView === 'global' ? 'page' : undefined} onClick={() => setLeaderboardView('global')}>Global</button>
        <button className={leaderboardView === 'runs' ? 'selected' : ''} aria-current={leaderboardView === 'runs' ? 'page' : undefined} onClick={() => setLeaderboardView('runs')}>Runs</button>
        <button className={leaderboardView === 'hall' ? 'selected' : ''} aria-current={leaderboardView === 'hall' ? 'page' : undefined} onClick={() => setLeaderboardView('hall')}>Achievement Hall</button>
      </div>}
      {leaderboardView === 'global' && !compact ? <GlobalLeaderboard
        rows={localhostPreview && (!globalLoaded || globalRows.length === 0)
          ? LOCAL_GLOBAL_FIXTURES.filter(row => !search.trim() || [row.displayName, row.guild].some(value => value?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))).slice(0, 10)
          : globalRows}
        own={globalOwn ?? (localhostPreview ? LOCAL_GLOBAL_FIXTURES[64] : null)}
        search={search}
        onSearch={setSearch}
        onRefresh={() => void refreshGlobal()}
        onOpenProfile={setProfileId}
      /> : leaderboardView === 'hall' && !compact ? <AchievementHall
        rows={localhostPreview && (!hallLoaded || hallRows.length === 0) ? LOCAL_HALL_FIXTURES : hallRows}
        own={hallOwn ?? (localhostPreview ? LOCAL_HALL_FIXTURES[64] : null)}
        search={search}
        onSearch={setSearch}
        onRefresh={() => void refreshHall()}
        onOpenProfile={setProfileId}
      /> : <>
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
      {displayedRows.length ? <ol className="leaderboard-rows top-ten">
        {displayedRows.map((row, index) => <li key={`${row.displayName}-${row.durationMs}-${index}`}>
          <b>{row.rank ?? index + 1}. <button className="profile-name-button" onClick={() => setProfileId(row.profileId)}>{row.displayName}</button></b>
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
      </div>}
      {compact && <button className="secondary full-leaderboard-toggle compact-leaderboard-link" onClick={onOpenLeaderboard}>Open full leaderboard</button>}
      </>}
      {profileId && <PublicProfileOverlay profileId={profileId} onClose={() => setProfileId(null)} />}
    </div>}
  </section>
}

function AchievementHall({
  rows,
  own,
  search,
  onSearch,
  onRefresh,
  onOpenProfile,
}: {
  rows: AchievementHallRow[]
  own: AchievementHallRow | null
  search: string
  onSearch: (value: string) => void
  onRefresh: () => void
  onOpenProfile: (profileId: string) => void
}) {
  const displayed = rows.slice(0, 10)
  return <section className="achievement-hall" aria-labelledby="achievement-hall-title">
    <div className="hall-heading"><div><p className="eyebrow">LIFETIME ACHIEVEMENT POINTS</p><h3 id="achievement-hall-title">Hall of Fame</h3></div><p>Account-wide totals · retired Feats of Strength keep their points.</p></div>
    <div className="leaderboard-columns" aria-hidden="true"><span>Rank and player</span><span>Points · date</span></div>
    <ol className="leaderboard-rows hall-rows">
      {displayed.map(row => <li key={`${row.rank}-${row.displayName}`}>
        <b>{row.rank}. <button className="profile-name-button" onClick={() => onOpenProfile(row.profileId)}>{row.displayName}</button>{row.guild ? <small>{row.guild}</small> : null}</b>
        <span><strong>{row.totalPoints} pts</strong><small>{new Date(row.highestAchievement.firstEarnedAt).toLocaleDateString()}</small></span>
      </li>)}
    </ol>
    {own && <div className="leaderboard-own-position" aria-label="Your achievement Hall position"><span aria-hidden="true">…</span><p><b>{own.rank}. Your Hall of Fame position</b><span>{own.totalPoints} pts · {own.achievementCount} achievements</span></p></div>}
    <div className="leaderboard-search">
      <label><span>Find a Hall of Fame player</span><small>Searches public profile names and guilds.</small><input aria-label="Search achievement Hall" value={search} onChange={event => onSearch(event.target.value)} /></label>
      <button className="secondary" onClick={onRefresh}>Search Hall</button>
    </div>
  </section>
}

function PublicProfileOverlay({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setProfile(null)
    setFailed(false)
    void loadPublicPlayerProfile(profileId).then(setProfile).catch(() => setFailed(true))
  }, [profileId])
  return <div className="public-profile-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="public-profile-overlay" role="dialog" aria-modal="true" aria-labelledby="public-profile-title">
      <button className="public-profile-close" aria-label="Close player profile" onClick={onClose}>×</button>
      {failed ? <><p className="eyebrow">PRIVATE PROFILE</p><h2 id="public-profile-title">Profile unavailable</h2><p>This player is anonymous, no longer public, or the online service is unavailable.</p></> : !profile ? <p>Loading player profile…</p> : <>
        <p className="eyebrow">PUBLIC TRAINER PROFILE</p><h2 id="public-profile-title">{profile.displayName}</h2>
        <p>{profile.guild ?? 'No public guild'} · {profile.attempts} attempts · {profile.wipes} wipes</p>
        {profile.character && profile.region && profile.realm && <a href={`https://raider.io/characters/${profile.region}/${profile.realm}/${profile.character}`} target="_blank" rel="noreferrer">Raider.IO profile ↗</a>}
        {profile.global && <p><strong>Global #{profile.global.rank}</strong> · {profile.global.totalPoints} pts ({profile.global.achievementPoints} achievements + {profile.global.runPoints} runs)</p>}
        <h3>Verified achievements · {profile.achievements.length}</h3>
        {profile.achievements.length ? <ul className="public-profile-achievements">{profile.achievements.map(achievement => <li key={achievement.id}><b>{achievement.title}</b><span>{achievement.tier} · {achievement.points} pts · {new Date(achievement.firstEarnedAt).toLocaleDateString()}</span></li>)}</ul> : <p>No verified achievements yet.</p>}
      </>}
    </section>
  </div>
}
