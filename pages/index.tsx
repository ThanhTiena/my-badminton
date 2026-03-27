'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type Player, type Team, type Match, type Round, type RRStats,
  type GameType, type TourneyFormat, type TournamentState,
  shuffleArr, buildTeams, buildEliminationRounds, advanceElimination,
  buildRoundRobin, getRoundLabelForMatch, findMatch as findMatchInRounds,
  getRRSorted, getCurrentRound, resetMatchCounter,
} from '@/lib/tournament';
import type { PlayerDoc, TournamentHistoryDoc } from '@/lib/models';

type AppView = 'roster' | 'setup' | 'tournament' | 'champion' | 'history' | 'rankings';

const INITIAL_TOURNEY: TournamentState = {
  pros: [], beginners: [], teams: [],
  gameType: 'singles', tourneyFormat: 'elimination',
  currentScreen: 'setup',
  rounds: [], currentRoundIdx: 0,
  history: [], champion: null, rrStandings: {},
};

/* ════════════════════════════════════════════════════
   SMALL ATOMS
════════════════════════════════════════════════════ */
function Btn({
  children, variant = 'primary', size, full, disabled, onClick, className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary'|'secondary'|'danger'|'success'|'orange'|'ghost'|'pro'|'beg';
  size?: 'sm'|'lg'; full?: boolean; disabled?: boolean;
  onClick?: () => void; className?: string;
}) {
  return (
    <button
      className={`btn btn-${variant}${size ? ` btn-${size}` : ''}${full ? ' btn-full' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="card-title">{children}</div>;
}

function Badge({ group }: { group: 'pro' | 'beg' }) {
  return <span className={`badge badge-${group}`}>{group === 'pro' ? 'PRO' : 'BEG'}</span>;
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="empty-state">
      <span className="icon">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════════ */
function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<React.CSSProperties[]>([]);
  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const colors = ['#39ff14','#00e5ff','#ff6b35','#f59e0b','#a78bfa','#ec4899','#fff'];
    setPieces(Array.from({ length: 120 }, () => ({
      left: `${Math.random() * 100}vw`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      width: `${Math.random() * 8 + 5}px`,
      height: `${Math.random() * 8 + 5}px`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 2}s`,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    })));
    const t = setTimeout(() => setPieces([]), 6500);
    return () => clearTimeout(t);
  }, [active]);
  if (!pieces.length) return null;
  return (
    <div className="confetti-layer">
      {pieces.map((s, i) => <div key={i} className="confetti-piece anim-fall" style={s} />)}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ROSTER SCREEN
════════════════════════════════════════════════════ */
function RosterScreen({ onDone }: { onDone: () => void }) {
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [group, setGroup] = useState<'pro' | 'beg'>('pro');
  const nameRef = useRef<HTMLInputElement>(null);

  const fetch$ = useCallback(async () => {
    const r = await fetch('/api/players');
    setPlayers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetch$(); }, [fetch$]);

  async function add() {
    const name = nameRef.current?.value.trim() ?? '';
    if (!name) return;
    setSaving(true); setErr('');
    const r = await fetch('/api/players', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, group }),
    });
    if (r.status === 409) { setErr('A player with that name already exists.'); setSaving(false); return; }
    if (!r.ok)            { setErr('Failed to add player.');                    setSaving(false); return; }
    nameRef.current!.value = '';
    nameRef.current!.focus();
    await fetch$();
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm('Remove this player from the roster?')) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    setPlayers(p => p.filter(x => String(x._id) !== id));
  }

  async function toggleGroup(id: string, cur: 'pro' | 'beg') {
    const next = cur === 'pro' ? 'beg' : 'pro';
    await fetch(`/api/players/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: next }),
    });
    setPlayers(p => p.map(x => String(x._id) === id ? { ...x, group: next } : x));
  }

  const pros = players.filter(p => p.group === 'pro');
  const begs = players.filter(p => p.group === 'beg');

  return (
    <div className="anim-fade">
      <p className="page-title">👥 Player Roster</p>
      <p className="page-sub">Manage your permanent player list. Add once — they're saved forever.</p>

      <div className="two-col" style={{ marginBottom: 20 }}>
        {/* Add player card */}
        <Card>
          <CardTitle>➕ Add New Player</CardTitle>
          <input
            ref={nameRef}
            className="input"
            placeholder="Player name…"
            maxLength={30}
            style={{ marginBottom: 10 }}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['pro', 'beg'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1px solid ${group === g ? (g === 'pro' ? 'var(--pro)' : 'var(--beg)') : 'var(--border)'}`, background: group === g ? (g === 'pro' ? 'rgba(245,158,11,.15)' : 'rgba(34,197,94,.15)') : 'var(--bg3)', color: group === g ? (g === 'pro' ? 'var(--pro)' : 'var(--beg)') : 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
              >
                {g === 'pro' ? '🥇 Pro' : '🌱 Beginner'}
              </button>
            ))}
          </div>
          {err && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{err}</div>}
          <Btn variant="primary" full disabled={saving} onClick={add}>
            {saving ? 'Adding…' : '➕ Add Player'}
          </Btn>
        </Card>

        {/* Stats card */}
        <Card>
          <CardTitle>📊 Roster Stats</CardTitle>
          {[
            ['Total Players', players.length, undefined],
            ['🥇 Pro Players', pros.length, 'var(--pro)'],
            ['🌱 Beginners',   begs.length, 'var(--beg)'],
          ].map(([label, val, color]) => (
            <div className="summary-row" key={String(label)}>
              <span className="summary-label">{label}</span>
              <span className="summary-value" style={color ? { color: color as string } : {}}>{String(val)}</span>
            </div>
          ))}
          {players.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Btn variant="primary" full size="lg" onClick={onDone}>🚀 Start a Tournament →</Btn>
            </div>
          )}
        </Card>
      </div>

      {/* Player list */}
      <Card>
        <CardTitle>🏸 All Players ({players.length})</CardTitle>
        {loading
          ? <EmptyState icon="⏳" text="Loading players…" />
          : players.length === 0
            ? <EmptyState icon="👥" text="No players yet — add some above!" />
            : (
              <div className="player-grid">
                {players.map(p => (
                  <div key={String(p._id)} className="player-card anim-slide">
                    <Badge group={p.group} />
                    <div className="info">
                      <div className="name">{p.name}</div>
                      <div className="stats">🏆 {p.stats.titles} title{p.stats.titles !== 1 ? 's' : ''} · {p.stats.wins}W {p.stats.losses}L</div>
                    </div>
                    <div className="actions">
                      <button
                        className="group-toggle-btn"
                        title="Switch Pro ↔ Beg"
                        onClick={() => toggleGroup(String(p._id), p.group)}
                      >
                        {p.group === 'pro' ? '→🌱' : '→🥇'}
                      </button>
                      <Btn variant="danger" size="sm" onClick={() => del(String(p._id))}>✕</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </Card>

      {players.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="primary" size="lg" onClick={onDone}>🚀 Start a Tournament →</Btn>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   SETUP SCREEN
════════════════════════════════════════════════════ */
function SetupScreen({
  state, allPlayers, onTogglePlayer, onSetGameType, onSetFormat, onStart, onBack,
}: {
  state: TournamentState; allPlayers: PlayerDoc[];
  onTogglePlayer: (p: PlayerDoc) => void;
  onSetGameType: (t: GameType) => void;
  onSetFormat: (f: TourneyFormat) => void;
  onStart: () => void; onBack: () => void;
}) {
  const pros = state.pros.length;
  const begs = state.beginners.length;
  const n = pros + begs;
  const isDoubles = state.gameType === 'doubles';
  const doublesTeams = Math.floor(n / 2);
  const enoughPlayers = isDoubles ? doublesTeams >= 2 : n >= 4;
  const units = isDoubles ? doublesTeams : n;
  const estRounds = state.tourneyFormat === 'elimination'
    ? Math.ceil(Math.log2(units || 1))
    : units > 1 ? units - 1 : 0;

  const selectedNames = new Set([...state.pros, ...state.beginners].map(p => p.name));
  const proPlayers = allPlayers.filter(p => p.group === 'pro');
  const begPlayers = allPlayers.filter(p => p.group === 'beg');

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back to roster</button>
      <p className="page-title">⚙️ Set Up Tournament</p>
      <p className="page-sub">Pick who's playing today and choose your format.</p>

      <div className="two-col">
        {/* Player selection */}
        <Card>
          <CardTitle>
            👥 Select Players
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text2)', fontSize: 12 }}>
              {n} selected · <span className="text-pro">{pros} pro</span> · <span className="text-beg">{begs} beg</span>
            </span>
          </CardTitle>

          {allPlayers.length === 0 && (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>
              No players in roster yet.{' '}
              <button onClick={onBack} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Add some first.
              </button>
            </p>
          )}

          <div className="player-select-list">
            {proPlayers.length > 0 && <>
              <p className="group-section-label">🥇 Pro Players ({proPlayers.length})</p>
              {proPlayers.map(p => {
                const sel = selectedNames.has(p.name);
                return (
                  <button
                    key={String(p._id)}
                    className={`player-select-item${sel ? ' selected-pro' : ''}`}
                    onClick={() => onTogglePlayer(p)}
                  >
                    <span className={`checkbox${sel ? ' checked-pro' : ''}`}>
                      {sel && <span className="check-mark">✓</span>}
                    </span>
                    <span className="select-item-name">{p.name}</span>
                    <span className="select-item-stats">🏆{p.stats.titles} {p.stats.wins}W</span>
                  </button>
                );
              })}
            </>}
            {begPlayers.length > 0 && <>
              <p className="group-section-label">🌱 Beginners ({begPlayers.length})</p>
              {begPlayers.map(p => {
                const sel = selectedNames.has(p.name);
                return (
                  <button
                    key={String(p._id)}
                    className={`player-select-item${sel ? ' selected-beg' : ''}`}
                    onClick={() => onTogglePlayer(p)}
                  >
                    <span className={`checkbox${sel ? ' checked-beg' : ''}`}>
                      {sel && <span className="check-mark">✓</span>}
                    </span>
                    <span className="select-item-name">{p.name}</span>
                    <span className="select-item-stats">🏆{p.stats.titles} {p.stats.wins}W</span>
                  </button>
                );
              })}
            </>}
          </div>

          {allPlayers.length > 0 && (
            <div className="row" style={{ marginTop: 12 }}>
              <Btn variant="ghost" size="sm" onClick={() => allPlayers.forEach(p => { if (!selectedNames.has(p.name)) onTogglePlayer(p); })}>Select All</Btn>
              <Btn variant="ghost" size="sm" onClick={() => allPlayers.forEach(p => { if (selectedNames.has(p.name)) onTogglePlayer(p); })}>Clear All</Btn>
            </div>
          )}
        </Card>

        {/* Format + summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <CardTitle>🎮 Format</CardTitle>

            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Game type</p>
            <div className="pills" style={{ marginBottom: 18 }}>
              {(['singles', 'doubles'] as const).map(t => (
                <button key={t} className={`pill${state.gameType === t ? ' active' : ''}`} onClick={() => onSetGameType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Tournament format</p>
            <div className="pills">
              {([['elimination', '🗡️ Single Elimination'], ['roundrobin', '🔄 Round Robin']] as const).map(([v, l]) => (
                <button key={v} className={`pill${state.tourneyFormat === v ? ' active' : ''}`} onClick={() => onSetFormat(v)}>{l}</button>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>📋 Summary</CardTitle>
            {[
              ['Selected', n],
              ['Pro / Beg', `${pros} / ${begs}`],
              ['Game type', isDoubles ? 'Doubles' : 'Singles'],
              ...(isDoubles ? [['Teams', doublesTeams]] as const : []),
              ['Format', state.tourneyFormat === 'elimination' ? 'Single Elimination' : 'Round Robin'],
              ['Est. rounds', units >= 2 ? estRounds : '—'],
            ].map(([l, v], i) => (
              <div className="summary-row" key={i}>
                <span className="summary-label">{l}</span>
                <span className="summary-value">{v}</span>
              </div>
            ))}

            {n > 0 && n < 4 && <div className="alert alert-warn">⚠️ Need at least 4 players to start</div>}
            {isDoubles && n >= 4 && doublesTeams < 2 && <div className="alert alert-warn">⚠️ Need at least 4 players for 2 doubles teams</div>}

            <div style={{ marginTop: 16 }}>
              <Btn variant="primary" size="lg" full disabled={!enoughPlayers} onClick={onStart}>🚀 Start Tournament</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MATCH CARD  — handles both live & completed states
════════════════════════════════════════════════════ */
function MatchCard({
  match, gameType, roundLabel, onScoreChange, onMarkWinner,
}: {
  match: Match; gameType: GameType; roundLabel: string;
  onScoreChange: (id: string, t: 'A'|'B', d: number) => void;
  onMarkWinner: (id: string, s: 'A'|'B') => void;
}) {
  if (match.bye) {
    return (
      <div className="match-card bye-card">
        <p className="match-status">🟡 BYE</p>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{match.teamA.name}</p>
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>🏸 Advances automatically</p>
      </div>
    );
  }

  const nameA = match.teamA.name;
  const nameB = match.teamB!.name;
  const winnerA = match.winner?.id === match.teamA.id;
  const winnerB = match.winner?.id === match.teamB?.id;

  if (match.completed) {
    return (
      <div className="match-card completed">
        <p className="match-status">✅ COMPLETED</p>
        <div className="match-versus">
          <div className="match-team">
            <p className={`match-team-name ${winnerA ? 'team-winner' : 'team-loser'}`}>{nameA}{winnerA ? ' 🏆' : ''}</p>
            {gameType === 'doubles' && <p className="match-team-sub">{match.teamA.players.join(' & ')}</p>}
          </div>
          <div className="vs-circle">VS</div>
          <div className="match-team">
            <p className={`match-team-name ${winnerB ? 'team-winner' : 'team-loser'}`}>{nameB}{winnerB ? ' 🏆' : ''}</p>
            {gameType === 'doubles' && <p className="match-team-sub">{match.teamB!.players.join(' & ')}</p>}
          </div>
        </div>
        <div className="completed-result">
          <p className="completed-winner">🏆 {match.winner!.name} wins</p>
          <p className="completed-score">{match.scoreA} — {match.scoreB}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="match-card">
      <p className="match-status">⚡ LIVE · {roundLabel}</p>

      <div className="match-versus">
        <div className="match-team">
          <p className="match-team-name">{nameA}</p>
          {gameType === 'doubles' && <p className="match-team-sub">{match.teamA.players.join(' & ')}</p>}
        </div>
        <div className="vs-circle">VS</div>
        <div className="match-team">
          <p className="match-team-name">{nameB}</p>
          {gameType === 'doubles' && <p className="match-team-sub">{match.teamB!.players.join(' & ')}</p>}
        </div>
      </div>

      <div className="score-row">
        {(['A', 'B'] as const).map((side, si) => (
          <>
            {si === 1 && <span key="dash" className="score-dash">—</span>}
            <div key={side} className="score-control">
              <button className="score-btn" onClick={() => onScoreChange(match.id, side, -1)}>−</button>
              <span className="score-num">{side === 'A' ? match.scoreA : match.scoreB}</span>
              <button className="score-btn" onClick={() => onScoreChange(match.id, side, 1)}>+</button>
            </div>
          </>
        ))}
      </div>

      <div className="winner-btns">
        <Btn variant="success" onClick={() => onMarkWinner(match.id, 'A')}>🏆 {nameA}</Btn>
        <Btn variant="orange"  onClick={() => onMarkWinner(match.id, 'B')}>🏆 {nameB}</Btn>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   BRACKET / STANDINGS
════════════════════════════════════════════════════ */
function BracketView({ rounds, currentRoundIdx }: { rounds: Round[]; currentRoundIdx: number }) {
  return (
    <Card>
      <CardTitle>📊 Bracket</CardTitle>
      <div className="bracket-wrap">
        <div className="bracket-rounds">
          {rounds.map((round, ri) => (
            <div key={ri} className="bracket-round">
              <div className="bracket-round-title">{round.name}</div>
              <div className="bracket-slots">
                {round.matches.map(m => {
                  const isCur = ri === currentRoundIdx;
                  const aWon = m.winner?.id === m.teamA?.id;
                  const bWon = m.winner?.id === m.teamB?.id;
                  return (
                    <div key={m.id} className="bracket-match-group">
                      <div className={`bracket-slot${aWon ? ' winner' : isCur && !m.completed && !m.bye ? ' current anim-pulse' : ''}`}>{m.teamA?.name ?? '?'}</div>
                      {!m.bye && <div className={`bracket-slot${bWon ? ' winner' : isCur && !m.completed ? ' current anim-pulse' : ''}`}>{m.teamB?.name ?? '?'}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StandingsView({ teams, rrStandings, gameType }: { teams: Team[]; rrStandings: Record<string, RRStats>; gameType: GameType }) {
  const sorted = getRRSorted(teams, rrStandings);
  return (
    <Card>
      <CardTitle>📊 Live Standings</CardTitle>
      <div style={{ overflowX: 'auto' }}>
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th><th>Team</th>
              <th className="num">W</th><th className="num">L</th>
              <th className="num">+/-</th><th className="num">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ team, stats }, i) => {
              const diff = stats.scoreFor - stats.scoreAgainst;
              const badge = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
              return (
                <tr key={team.id} className={i === 0 ? 'rank-top' : ''}>
                  <td><span className={`rank-badge${badge ? ` ${badge}` : ''}`}>{i + 1}</span></td>
                  <td>
                    <strong>{team.name}</strong>
                    {gameType === 'doubles' && <><br /><span style={{ fontSize: 12, color: 'var(--text2)' }}>{team.players.join(' & ')}</span></>}
                  </td>
                  <td className="num" style={{ color: 'var(--success)' }}>{stats.wins}</td>
                  <td className="num" style={{ color: 'var(--danger)' }}>{stats.losses}</td>
                  <td className="num" style={{ color: diff >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{diff >= 0 ? '+' : ''}{diff}</td>
                  <td className="num" style={{ fontSize: 15, color: 'var(--accent2)' }}>{stats.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════
   TOURNAMENT SCREEN
   Multi-match-in-progress: shows ALL incomplete rounds
   side-by-side so multiple courts can run at once.
════════════════════════════════════════════════════ */
function TournamentScreen({
  state, onScoreChange, onMarkWinner, onReset, showRoundBanner,
}: {
  state: TournamentState;
  onScoreChange: (id: string, t: 'A'|'B', d: number) => void;
  onMarkWinner: (id: string, s: 'A'|'B') => void;
  onReset: () => void;
  showRoundBanner: boolean;
}) {
  const [tab, setTab] = useState<'matches'|'bracket'|'history'>('matches');
  const isRR = state.tourneyFormat === 'roundrobin';
  const currentRound = getCurrentRound(state);

  const totalM = state.rounds.reduce((a, r) => a + r.matches.filter(m => !m.bye).length, 0);
  const doneM  = state.rounds.reduce((a, r) => a + r.matches.filter(m => m.completed && !m.bye).length, 0);
  const progress = totalM ? Math.round((doneM / totalM) * 100) : 0;

  // For RR: show all rounds that have at least one incomplete match
  // For Elimination: show current round
  const activeRounds: Round[] = isRR
    ? state.rounds.filter(r => r.matches.some(m => !m.completed))
    : (currentRound ? [currentRound] : []);

  // Completed rounds in this session (for reference, shown collapsed)
  const completedRounds: Round[] = isRR
    ? state.rounds.filter(r => r.matches.every(m => m.completed))
    : state.rounds.slice(0, state.currentRoundIdx);

  return (
    <div className="anim-fade">
      {showRoundBanner && (
        <div className="round-banner anim-glow">
          ✅ Round complete! Advancing to next round…
        </div>
      )}

      {/* Round header */}
      <div className="round-header">
        <div>
          <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.5px' }}>
            {isRR ? '🔄 Round Robin' : '🗡️ Elimination'}
          </p>
          <p className="text-muted" style={{ fontSize: 14, marginTop: 2 }}>
            {state.gameType === 'doubles' ? 'Doubles' : 'Singles'} · {state.teams.length} {state.gameType === 'doubles' ? 'teams' : 'players'} · {doneM}/{totalM} matches done
          </p>
        </div>
        <div className="row wrap">
          <span className="round-badge">{currentRound?.name ?? 'Complete'}</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <Btn variant="ghost" size="sm" onClick={onReset}>↩️ New</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {([['matches','⚡ Matches'],['bracket', isRR ? '📊 Standings' : '📊 Bracket'],['history','📜 History']] as const).map(([id, label]) => (
          <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* MATCHES TAB */}
      {tab === 'matches' && (
        <div>
          {!currentRound && state.champion ? (
            <EmptyState icon="🏆" text="Tournament complete!" />
          ) : activeRounds.length === 0 ? (
            <EmptyState icon="🏆" text="All matches complete!" />
          ) : (
            activeRounds.map(round => (
              <div key={round.name} style={{ marginBottom: 28 }}>
                {/* Round label — only show when multiple rounds active */}
                {(activeRounds.length > 1 || completedRounds.length > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent2)' }}>{round.name}</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {round.matches.filter(m => m.completed && !m.bye).length}/{round.matches.filter(m => !m.bye).length} done
                    </span>
                  </div>
                )}
                <div className="matches-grid">
                  {round.matches.map(m => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      gameType={state.gameType}
                      roundLabel={round.name}
                      onScoreChange={onScoreChange}
                      onMarkWinner={onMarkWinner}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Show completed rounds collapsed for reference */}
          {completedRounds.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 10 }}>Completed Rounds</p>
              {completedRounds.map(round => (
                <CompletedRoundSummary key={round.name} round={round} gameType={state.gameType} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bracket' && (
        isRR
          ? <StandingsView teams={state.teams} rrStandings={state.rrStandings} gameType={state.gameType} />
          : <BracketView rounds={state.rounds} currentRoundIdx={state.currentRoundIdx} />
      )}

      {tab === 'history' && (
        <Card>
          <CardTitle>📜 Match History</CardTitle>
          {state.history.length === 0
            ? <EmptyState icon="📋" text="No completed matches yet" />
            : (
              <div className="history-list">
                {[...state.history].reverse().map((h, i) => (
                  <div key={i} className="history-item">
                    <span className="history-round">{h.round}</span>
                    <span className="history-teams">
                      <span style={{ color: h.winner === h.teamA ? 'var(--success)' : 'var(--text3)', fontWeight: h.winner === h.teamA ? 700 : undefined }}>{h.teamA}</span>
                      <span style={{ color: 'var(--text3)' }}> vs </span>
                      <span style={{ color: h.winner === h.teamB ? 'var(--success)' : 'var(--text3)', fontWeight: h.winner === h.teamB ? 700 : undefined }}>{h.teamB}</span>
                    </span>
                    <span className="history-score">{h.scoreA}–{h.scoreB}</span>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      )}
    </div>
  );
}

/* ── Completed round summary (collapsed row) ── */
function CompletedRoundSummary({ round, gameType }: { round: Round; gameType: GameType }) {
  const [open, setOpen] = useState(false);
  const nonBye = round.matches.filter(m => !m.bye);
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <button
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'inherit' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>✅ {round.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{nonBye.length} match{nonBye.length !== 1 ? 'es' : ''} {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {nonBye.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, background: 'var(--bg4)', borderRadius: 6, padding: '6px 12px' }}>
              <span style={{ flex: 1 }}>
                <span style={{ color: m.winner?.id === m.teamA.id ? 'var(--success)' : 'var(--text3)', fontWeight: m.winner?.id === m.teamA.id ? 700 : undefined }}>{m.teamA.name}</span>
                <span style={{ color: 'var(--text3)' }}> vs </span>
                <span style={{ color: m.winner?.id === m.teamB?.id ? 'var(--success)' : 'var(--text3)', fontWeight: m.winner?.id === m.teamB?.id ? 700 : undefined }}>{m.teamB?.name}</span>
              </span>
              <span style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{m.scoreA}–{m.scoreB}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   CHAMPION SCREEN
════════════════════════════════════════════════════ */
function ChampionScreen({ champion, gameType, onNew, onViewHistory }: {
  champion: Team; gameType: GameType; onNew: () => void; onViewHistory: () => void;
}) {
  return (
    <div className="champion-wrap anim-fade">
      <span className="champion-trophy anim-trophy">🏆</span>
      <p className="champion-title">Tournament Champion</p>
      <p className="champion-name">{champion.name}</p>
      <p className="champion-sub">
        {gameType === 'doubles'
          ? `🎉 ${champion.players.join(' & ')} — Doubles Champions!`
          : '🎉 Congratulations on winning the tournament!'}
      </p>
      <div className="champion-btns">
        <Btn variant="primary" size="lg" onClick={onNew}>🏸 New Tournament</Btn>
        <Btn variant="secondary" size="lg" onClick={onViewHistory}>📜 Tournament History</Btn>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TOURNAMENT HISTORY SCREEN
════════════════════════════════════════════════════ */
function HistoryScreen({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<TournamentHistoryDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history?limit=50')
      .then(r => r.json())
      .then(({ history: h, total: t }) => { setHistory(h); setTotal(t); setLoading(false); });
  }, []);

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">📜 Tournament History</p>
      <p className="page-sub">{total} tournament{total !== 1 ? 's' : ''} on record.</p>

      {loading ? (
        <EmptyState icon="⏳" text="Loading history…" />
      ) : history.length === 0 ? (
        <EmptyState icon="📋" text="No tournaments recorded yet." />
      ) : (
        <div className="t-history-list">
          {history.map(t => {
            const id = String(t._id);
            const isOpen = expanded === id;
            const date = new Date(t.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
            return (
              <div key={id} className="t-history-card">
                <div className="t-history-header" onClick={() => setExpanded(isOpen ? null : id)}>
                  <div className="t-history-info">
                    <span className="t-history-trophy">🏆</span>
                    <div>
                      <p className="t-history-champion">{t.champion}</p>
                      <p className="t-history-meta">
                        {date} · {t.gameType === 'doubles' ? 'Doubles' : 'Singles'} · {t.format === 'elimination' ? 'Elimination' : 'Round Robin'} · {t.participants.length} players
                      </p>
                    </div>
                  </div>
                  <div className="t-history-right">
                    <span className="t-history-count">{t.matches.length} match{t.matches.length !== 1 ? 'es' : ''}</span>
                    <span className={`t-history-chevron${isOpen ? ' open' : ''}`}>▼</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="t-history-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 16 }}>
                      <div>
                        <p className="t-hist-section-label">Participants</p>
                        <div className="participants-wrap">
                          {t.participants.map(p => (
                            <span key={p.name} className={`participant-chip ${p.group}`}>{p.name}</span>
                          ))}
                        </div>
                      </div>
                      {t.standings && t.standings.length > 0 && (
                        <div>
                          <p className="t-hist-section-label">Final Standings</p>
                          {t.standings.slice(0, 5).map(s => (
                            <div key={s.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '3px 0' }}>
                              <span>{s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `${s.rank}.`}</span>
                              <span style={{ fontWeight: 600, flex: 1 }}>{s.name}</span>
                              <span style={{ color: 'var(--text3)', fontSize: 12 }}>{s.wins}W {s.losses}L · {s.pts}pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="t-hist-section-label">Match Results</p>
                    <div className="t-match-list">
                      {t.matches.map((m, i) => (
                        <div key={i} className="t-match-row">
                          <span className="t-match-round">{m.round}</span>
                          <span className="t-match-teams">
                            <span style={{ color: m.winner === m.teamA ? 'var(--success)' : 'var(--text3)', fontWeight: m.winner === m.teamA ? 700 : undefined }}>{m.teamA}</span>
                            <span style={{ color: 'var(--text3)' }}> vs </span>
                            <span style={{ color: m.winner === m.teamB ? 'var(--success)' : 'var(--text3)', fontWeight: m.winner === m.teamB ? 700 : undefined }}>{m.teamB}</span>
                          </span>
                          <span className="t-match-score">{m.scoreA}–{m.scoreB}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   RANKINGS SCREEN
════════════════════════════════════════════════════ */
function RankingsScreen({ onBack }: { onBack: () => void }) {
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pro' | 'beg'>('all');

  useEffect(() => {
    fetch('/api/rankings')
      .then(r => r.json())
      .then((data: PlayerDoc[]) => { setPlayers(data); setLoading(false); });
  }, []);

  const filtered = players.filter(p => filter === 'all' || p.group === filter);
  const top3 = filtered.slice(0, 3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3; // silver, gold, bronze
  const podiumRanks = top3.length === 3 ? [2, 1, 3] : [1, 2, 3];
  const podiumHeights = [44, 60, 32];

  const LEGEND = [
    { label: 'Win',        val: '+10', pos: true },
    { label: 'Loss',       val: '+1',  pos: true },
    { label: 'Title 🏆',   val: '+25', pos: true, gold: true },
    { label: 'Runner-up',  val: '+10', pos: true },
    { label: '/pt scored', val: '+1',  pos: true },
    { label: '/pt conceded', val: '−0.5', pos: false },
  ];

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  const rankClass = (i: number) => i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : 'n';

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">🏅 Rankings</p>
      <p className="page-sub">Lifetime leaderboard — updated automatically after every tournament.</p>

      {/* Score formula legend */}
      <div className="score-legend">
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>Score formula:</span>
        {LEGEND.map(l => (
          <span key={l.label} className="score-legend-item">
            <span className={`score-legend-val ${l.gold ? 'gold' : l.pos ? 'pos' : 'neg'}`}>{l.val}</span>
            {l.label}
          </span>
        ))}
      </div>

      {/* Group filter */}
      <div className="pills" style={{ marginBottom: 24 }}>
        {(['all', 'pro', 'beg'] as const).map(f => (
          <button key={f} className={`pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? '🌐 All' : f === 'pro' ? '🥇 Pro' : '🌱 Beginner'}
          </button>
        ))}
      </div>

      {loading ? (
        <EmptyState icon="⏳" text="Loading rankings…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🏅" text="No players yet. Complete a tournament to generate rankings." />
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 2 && (
            <Card style={{ marginBottom: 24 }}>
              <div className="podium">
                {podiumOrder.map((p, i) => {
                  if (!p) return null;
                  const rank = podiumRanks[i];
                  const h    = podiumHeights[i];
                  return (
                    <div key={p.name} className="podium-slot">
                      <span className="podium-medal">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                      <div className={`podium-avatar rank-${rank}`}>{initials(p.name)}</div>
                      <span className="podium-name">{p.name}</span>
                      <span className={`podium-score rank-${rank}`}>{p.rankScore ?? 0}</span>
                      <div className={`podium-block rank-${rank}`} style={{ height: h }}>#{rank}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Full table */}
          <Card>
            <CardTitle>📊 Full Leaderboard ({filtered.length})</CardTitle>
            <div style={{ overflowX: 'auto' }}>
              <table className="rank-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Player</th>
                    <th className="num">Score</th>
                    <th className="num">🏆</th>
                    <th className="num">W</th>
                    <th className="num">L</th>
                    <th className="num">Pts+</th>
                    <th className="num">Pts−</th>
                    <th className="num">Played</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const s = p.stats;
                    const winRate = s.wins + s.losses > 0
                      ? Math.round((s.wins / (s.wins + s.losses)) * 100)
                      : 0;
                    return (
                      <tr key={p.name}>
                        <td><span className={`rank-num ${rankClass(i)}`}>{i + 1}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Badge group={p.group} />
                            <div>
                              <strong style={{ fontSize: 14 }}>{p.name}</strong>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                                {winRate}% win rate · {s.tournamentsPlayed} tournament{s.tournamentsPlayed !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="num"><span className="rank-score-big">{p.rankScore ?? 0}</span></td>
                        <td className="num" style={{ color: '#f59e0b', fontWeight: 700 }}>{s.titles}</td>
                        <td className="num" style={{ color: 'var(--success)' }}>{s.wins}</td>
                        <td className="num" style={{ color: 'var(--danger)' }}>{s.losses}</td>
                        <td className="num" style={{ color: 'var(--accent2)' }}>{s.pointsScored}</td>
                        <td className="num" style={{ color: 'var(--text3)' }}>{s.pointsConceded}</td>
                        <td className="num" style={{ color: 'var(--text2)' }}>{s.tournamentsPlayed}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════════ */
export default function TournamentApp() {
  const [view, setView] = useState<AppView>('roster');
  const [allPlayers, setAllPlayers] = useState<PlayerDoc[]>([]);
  const [tourney, setTourney] = useState<TournamentState>(INITIAL_TOURNEY);
  const [showRoundBanner, setShowRoundBanner] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  const fetchPlayers = useCallback(async () => {
    const r = await fetch('/api/players');
    setAllPlayers(await r.json());
  }, []);

  useEffect(() => {
    if (view === 'setup') fetchPlayers();
  }, [view, fetchPlayers]);

  function togglePlayer(p: PlayerDoc) {
    const player: Player = { name: p.name, group: p.group };
    setTourney(s => {
      if (p.group === 'pro') {
        const exists = s.pros.some(x => x.name === p.name);
        return { ...s, pros: exists ? s.pros.filter(x => x.name !== p.name) : [...s.pros, player] };
      } else {
        const exists = s.beginners.some(x => x.name === p.name);
        return { ...s, beginners: exists ? s.beginners.filter(x => x.name !== p.name) : [...s.beginners, player] };
      }
    });
  }

  function startTournament() {
    resetMatchCounter();
    const teams = buildTeams(tourney);
    if (tourney.tourneyFormat === 'elimination') {
      const rounds = buildEliminationRounds(teams);
      setTourney(s => ({ ...s, teams, rounds, currentRoundIdx: 0, history: [], champion: null, rrStandings: {} }));
    } else {
      const { rounds, rrStandings } = buildRoundRobin(teams);
      setTourney(s => ({ ...s, teams, rounds, rrStandings, currentRoundIdx: 0, history: [], champion: null }));
    }
    setView('tournament');
  }

  function handleScoreChange(matchId: string, team: 'A'|'B', delta: number) {
    setTourney(s => ({
      ...s,
      rounds: s.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => {
          if (m.id !== matchId || m.completed) return m;
          return team === 'A'
            ? { ...m, scoreA: Math.max(0, Math.min(30, m.scoreA + delta)) }
            : { ...m, scoreB: Math.max(0, Math.min(30, m.scoreB + delta)) };
        }),
      })),
    }));
  }

  function handleMarkWinner(matchId: string, side: 'A'|'B') {
    setTourney(s => {
      const match = findMatchInRounds(s.rounds, matchId);
      if (!match || match.completed) return s;

      const winner = side === 'A' ? match.teamA : match.teamB!;
      const roundName = getRoundLabelForMatch(s.rounds, matchId);

      const newRounds = s.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => m.id === matchId ? { ...m, winner, completed: true } : m),
      }));

      // Update RR standings
      let newStandings = { ...s.rrStandings };
      if (s.tourneyFormat === 'roundrobin') {
        const loser = winner.id === match.teamA.id ? match.teamB! : match.teamA;
        const sFor     = winner.id === match.teamA.id ? match.scoreA : match.scoreB;
        const sAgainst = winner.id === match.teamA.id ? match.scoreB : match.scoreA;
        const wPrev = newStandings[winner.id] ?? { wins:0, losses:0, pts:0, scoreFor:0, scoreAgainst:0 };
        const lPrev = newStandings[loser.id]  ?? { wins:0, losses:0, pts:0, scoreFor:0, scoreAgainst:0 };
        newStandings = {
          ...newStandings,
          [winner.id]: { ...wPrev, wins: wPrev.wins+1, pts: wPrev.pts+3, scoreFor: wPrev.scoreFor+sFor, scoreAgainst: wPrev.scoreAgainst+sAgainst },
          [loser.id]:  { ...lPrev, losses: lPrev.losses+1, scoreFor: lPrev.scoreFor+sAgainst, scoreAgainst: lPrev.scoreAgainst+sFor },
        };
      }

      const newHistory = [...s.history, { round: roundName, teamA: match.teamA.name, teamB: match.teamB!.name, scoreA: match.scoreA, scoreB: match.scoreB, winner: winner.name }];
      const newState = { ...s, rounds: newRounds, rrStandings: newStandings, history: newHistory };

      checkRoundComplete(newState);
      return newState;
    });
  }

  function checkRoundComplete(ns: TournamentState) {
    if (ns.tourneyFormat === 'elimination') {
      const round = ns.rounds[ns.currentRoundIdx];
      if (!round?.matches.every(m => m.completed)) return;

      const winners = round.matches.map(m => m.winner).filter(Boolean) as Team[];
      if (winners.length === 1) {
        setTimeout(() => {
          setTourney(s => ({ ...s, champion: winners[0] }));
          setView('champion');
          setConfettiActive(true);
          saveTournament(ns, winners[0]);
          setTimeout(() => setConfettiActive(false), 6500);
        }, 600);
      } else {
        setShowRoundBanner(true);
        setTimeout(() => {
          setTourney(s => {
            const { rounds: newRounds, newIdx } = advanceElimination(s.rounds, s.currentRoundIdx);
            return { ...s, rounds: newRounds, currentRoundIdx: newIdx };
          });
          setShowRoundBanner(false);
        }, 1800);
      }
    } else {
      // RR: check all rounds complete
      if (!ns.rounds.every(r => r.matches.every(m => m.completed))) {
        // check if an individual round just finished → show banner
        const idx = ns.rounds.findIndex(r => r.matches.some(m => !m.completed));
        if (idx > 0 && ns.rounds[idx - 1].matches.every(m => m.completed)) {
          setShowRoundBanner(true);
          setTimeout(() => setShowRoundBanner(false), 1500);
        }
        return;
      }
      const sorted = getRRSorted(ns.teams, ns.rrStandings);
      setTimeout(() => {
        setTourney(s => ({ ...s, champion: sorted[0].team }));
        setView('champion');
        setConfettiActive(true);
        saveTournament(ns, sorted[0].team);
        setTimeout(() => setConfettiActive(false), 6500);
      }, 600);
    }
  }

  async function saveTournament(ns: TournamentState, champion: Team) {
    const sorted = getRRSorted(ns.teams, ns.rrStandings);
    const standings = ns.tourneyFormat === 'roundrobin'
      ? sorted.map((r, i) => ({
          rank: i + 1, name: r.team.name, wins: r.stats.wins, losses: r.stats.losses,
          pts: r.stats.pts, scoreFor: r.stats.scoreFor, scoreAgainst: r.stats.scoreAgainst,
        }))
      : undefined;

    // Runner-up: for RR it's rank-2; for elimination it's the final loser
    let runnerUp: string | undefined;
    if (ns.tourneyFormat === 'roundrobin') {
      runnerUp = sorted[1]?.team.name;
    } else {
      // Find the final match and pick the loser
      const finalRound = ns.rounds[ns.rounds.length - 1];
      if (finalRound) {
        const finalMatch = finalRound.matches.find(m => !m.bye && m.completed);
        if (finalMatch && finalMatch.winner) {
          const loser = finalMatch.winner.id === finalMatch.teamA.id ? finalMatch.teamB : finalMatch.teamA;
          runnerUp = loser?.name;
        }
      }
    }

    await fetch('/api/history', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameType: ns.gameType, format: ns.tourneyFormat,
        participants: [...ns.pros, ...ns.beginners],
        champion: champion.name,
        runnerUp,
        matches: ns.history,
        standings,
      }),
    });
  }

  function resetToSetup() {
    if (!confirm('Start a new tournament? All current data will be lost.')) return;
    resetMatchCounter();
    setTourney(INITIAL_TOURNEY);
    setView('setup');
  }

  const headerBadge =
    view === 'roster'   ? 'Roster'   :
    view === 'history'  ? 'History'  :
    view === 'rankings' ? 'Rankings' :
    view === 'champion' ? 'Finished' :
    view === 'setup'    ? 'Setup'    :
    (getCurrentRound(tourney)?.name ?? 'Finished');

  return (
    <>
      <Confetti active={confettiActive} />

      <header className="app-header">
        <div className="logo">🏸 <span>Smash</span>Tour</div>
        <div className="header-right">
          <button className="nav-link" onClick={() => setView('rankings')}>🏅 Rankings</button>
          {view !== 'roster' && view !== 'setup' && (
            <button className="nav-link" onClick={() => setView('history')}>📜 History</button>
          )}
          {(view === 'tournament' || view === 'champion') && (
            <button className="nav-link" onClick={() => setView('roster')}>👥 Roster</button>
          )}
          <span className="badge-pill">{headerBadge}</span>
        </div>
      </header>

      <div className="app-wrap">
        {view === 'roster'     && <RosterScreen onDone={() => setView('setup')} />}
        {view === 'setup'      && (
          <SetupScreen
            state={tourney} allPlayers={allPlayers}
            onTogglePlayer={togglePlayer}
            onSetGameType={t => setTourney(s => ({ ...s, gameType: t }))}
            onSetFormat={f => setTourney(s => ({ ...s, tourneyFormat: f }))}
            onStart={startTournament}
            onBack={() => setView('roster')}
          />
        )}
        {view === 'tournament' && (
          <TournamentScreen
            state={tourney}
            onScoreChange={handleScoreChange}
            onMarkWinner={handleMarkWinner}
            onReset={resetToSetup}
            showRoundBanner={showRoundBanner}
          />
        )}
        {view === 'champion' && tourney.champion && (
          <ChampionScreen
            champion={tourney.champion}
            gameType={tourney.gameType}
            onNew={resetToSetup}
            onViewHistory={() => setView('history')}
          />
        )}
        {view === 'history' && (
          <HistoryScreen onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')} />
        )}
        {view === 'rankings' && (
          <RankingsScreen onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')} />
        )}
      </div>
    </>
  );
}
