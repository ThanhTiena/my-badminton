'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type Player, type Team, type Match, type Round, type RRStats,
  type HistoryEntry, type GameType, type TourneyFormat, type TournamentState,
  shuffleArr, buildTeams, buildEliminationRounds, advanceElimination,
  buildRoundRobin, getRoundLabelForMatch, findMatch as findMatchInRounds,
  getRRSorted, getCurrentRound, resetMatchCounter,
} from '@/lib/tournament';
import type { PlayerDoc, TournamentHistoryDoc } from '@/lib/models';

/* ════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════ */
type AppView = 'roster' | 'setup' | 'tournament' | 'champion' | 'history';

const INITIAL_TOURNEY: TournamentState = {
  pros: [], beginners: [], teams: [],
  gameType: 'singles', tourneyFormat: 'elimination',
  currentScreen: 'setup',
  rounds: [], currentRoundIdx: 0,
  history: [], champion: null, rrStandings: {},
};

/* ════════════════════════════════════════════════════
   SMALL UI ATOMS
════════════════════════════════════════════════════ */
function Btn({
  children, variant = 'primary', size, full, disabled, onClick, className = '', type = 'button',
}: {
  children: React.ReactNode;
  variant?: 'primary'|'secondary'|'cyan'|'danger'|'success'|'orange'|'ghost'|'pro'|'beg';
  size?: 'sm'|'lg';
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base = 'inline-flex items-center gap-2 border-none cursor-pointer font-semibold transition-all duration-150 active:scale-97 rounded-lg whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none select-none';
  const sizes: Record<string, string> = { sm: 'px-3 py-1.5 text-[13px]', lg: 'px-8 py-3.5 text-[16px] rounded-xl', default: 'px-5 py-2.5 text-[14px]' };
  const variants: Record<string, string> = {
    primary: 'bg-[var(--accent)] text-[#0a0e1a] hover:bg-[#50ff30] hover:shadow-[0_0_20px_rgba(57,255,20,0.3)]',
    secondary: 'bg-[var(--bg4)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--bg3)] hover:border-[var(--accent2)]',
    cyan: 'bg-[var(--accent2)] text-[#0a0e1a] hover:bg-[#33eeff]',
    danger: 'bg-transparent text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white',
    success: 'bg-[var(--success)] text-white hover:bg-[#16a34a]',
    orange: 'bg-[var(--accent3)] text-white hover:bg-[#e55a25]',
    ghost: 'bg-transparent text-[var(--text2)] border border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--text2)]',
    pro: 'bg-[var(--pro-color)] text-[#0a0e1a] hover:bg-[#fbbf24]',
    beg: 'bg-[var(--beg-color)] text-[#0a0e1a] hover:bg-[#4ade80]',
  };
  return (
    <button type={type} className={`${base} ${sizes[size ?? 'default']} ${variants[variant]} ${full ? 'w-full justify-center' : ''} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-5 shadow-[var(--shadow)] ${className}`}>{children}</div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[14px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">{children}</div>;
}
function GroupBadge({ group }: { group: 'pro' | 'beg' }) {
  return group === 'pro'
    ? <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[var(--pro-color)] border border-[rgba(245,158,11,0.4)]">PRO</span>
    : <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--beg-color)] border border-[rgba(34,197,94,0.4)]">BEG</span>;
}

/* ════════════════════════════════════════════════════
   ROSTER SCREEN  — manage the global player list
════════════════════════════════════════════════════ */
function RosterScreen({ onDone }: { onDone: () => void }) {
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState<'pro' | 'beg'>('pro');

  const fetchPlayers = useCallback(async () => {
    const res = await fetch('/api/players');
    const data: PlayerDoc[] = await res.json();
    setPlayers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  async function addPlayer() {
    const name = nameRef.current?.value.trim() ?? '';
    if (!name) return;
    setSaving(true); setErr('');
    const res = await fetch('/api/players', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, group }),
    });
    if (res.status === 409) { setErr('A player with that name already exists.'); setSaving(false); return; }
    if (!res.ok) { setErr('Failed to add player.'); setSaving(false); return; }
    nameRef.current!.value = '';
    nameRef.current!.focus();
    await fetchPlayers();
    setSaving(false);
  }

  async function deletePlayer(id: string) {
    if (!confirm('Remove this player from the roster?')) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    setPlayers(p => p.filter(pl => String(pl._id) !== id));
  }

  async function toggleGroup(id: string, current: 'pro' | 'beg') {
    const next = current === 'pro' ? 'beg' : 'pro';
    await fetch(`/api/players/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group: next }) });
    setPlayers(p => p.map(pl => String(pl._id) === id ? { ...pl, group: next } : pl));
  }

  return (
    <div className="animate-fadeIn">
      <div className="text-[28px] font-extrabold tracking-tight mb-1.5">👥 Player Roster</div>
      <div className="text-[var(--text2)] text-[15px] mb-8">All registered players. Add new ones once — they're remembered for every tournament.</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Add player */}
        <Card>
          <CardTitle>➕ Add New Player</CardTitle>
          <div className="flex gap-2 mb-3">
            <input ref={nameRef} type="text" placeholder="Player name…" maxLength={30}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
              className="flex-1 bg-[var(--bg3)] border border-[var(--border)] rounded-lg text-[var(--text)] text-[15px] px-3.5 py-2.5 outline-none focus:border-[var(--accent)] placeholder:text-[var(--text3)]" />
          </div>
          <div className="flex gap-2 mb-4">
            {(['pro', 'beg'] as const).map(g => (
              <button key={g} onClick={() => setGroup(g)}
                className={`flex-1 py-2 rounded-lg border text-[14px] font-semibold cursor-pointer transition-all ${group === g ? (g === 'pro' ? 'bg-[var(--pro-color)] text-[#0a0e1a] border-[var(--pro-color)]' : 'bg-[var(--beg-color)] text-[#0a0e1a] border-[var(--beg-color)]') : 'bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]'}`}>
                {g === 'pro' ? '🥇 Pro' : '🌱 Beginner'}
              </button>
            ))}
          </div>
          {err && <div className="mb-3 px-3 py-2.5 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--danger)] text-[13px]">{err}</div>}
          <Btn variant="primary" full disabled={saving} onClick={addPlayer}>{saving ? 'Adding…' : '➕ Add Player'}</Btn>
        </Card>

        {/* Stats summary */}
        <Card>
          <CardTitle>📊 Roster Stats</CardTitle>
          <div className="flex flex-col gap-3">
            {[
              ['Total Players', players.length, 'text-[var(--text)]'],
              ['Pro Players', players.filter(p => p.group === 'pro').length, 'text-[var(--pro-color)]'],
              ['Beginners', players.filter(p => p.group === 'beg').length, 'text-[var(--beg-color)]'],
            ].map(([label, val, color]) => (
              <div key={String(label)} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--text2)] text-[14px]">{label}</span>
                <span className={`font-bold text-[18px] ${color}`}>{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Player list */}
      <Card>
        <CardTitle>🏸 All Players ({players.length})</CardTitle>
        {loading
          ? <div className="text-center py-10 text-[var(--text3)]">Loading…</div>
          : players.length === 0
            ? <div className="text-center py-10 text-[var(--text3)]"><span className="text-[48px] block mb-3">👥</span><p>No players yet — add some above!</p></div>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {players.map(p => (
                  <div key={String(p._id)} className="flex items-center justify-between bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GroupBadge group={p.group} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[14px] truncate">{p.name}</div>
                        <div className="text-[12px] text-[var(--text3)]">🏆 {p.stats.titles} title{p.stats.titles !== 1 ? 's' : ''} · {p.stats.wins}W {p.stats.losses}L</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button title="Toggle Pro/Beg" onClick={() => toggleGroup(String(p._id), p.group)}
                        className="bg-[var(--bg4)] border border-[var(--border)] text-[12px] px-2 py-1 rounded cursor-pointer hover:border-[var(--accent2)] transition-colors">
                        {p.group === 'pro' ? '→🌱' : '→🥇'}
                      </button>
                      <Btn variant="danger" size="sm" onClick={() => deletePlayer(String(p._id))}>✕</Btn>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
      </Card>

      <div className="flex justify-end">
        <Btn variant="primary" size="lg" onClick={onDone}>🚀 Start a Tournament →</Btn>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   SETUP SCREEN  — pick who joins + format
════════════════════════════════════════════════════ */
function SetupScreen({
  state, allPlayers,
  onTogglePlayer, onSetGameType, onSetFormat, onStart, onBack,
}: {
  state: TournamentState;
  allPlayers: PlayerDoc[];
  onTogglePlayer: (p: PlayerDoc) => void;
  onSetGameType: (t: GameType) => void;
  onSetFormat: (f: TourneyFormat) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const pros = state.pros.length;
  const begs = state.beginners.length;
  const n = pros + begs;
  const isDoubles = state.gameType === 'doubles';
  const doublesTeams = isDoubles ? Math.floor(n / 2) : 0;
  const enoughPlayers = isDoubles ? doublesTeams >= 2 : n >= 4;
  const fmt = state.tourneyFormat === 'elimination' ? 'Single Elimination' : 'Round Robin';
  const units = isDoubles ? Math.floor(n / 2) : n;
  const rounds = state.tourneyFormat === 'elimination'
    ? Math.ceil(Math.log2(units || 1))
    : units > 1 ? units - 1 : 0;

  const selectedNames = new Set([...state.pros.map(p => p.name), ...state.beginners.map(p => p.name)]);

  const proPlayers = allPlayers.filter(p => p.group === 'pro');
  const begPlayers = allPlayers.filter(p => p.group === 'beg');

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-1.5">
        <button onClick={onBack} className="text-[var(--text3)] hover:text-[var(--text2)] cursor-pointer bg-none border-none text-[14px]">← Back to roster</button>
      </div>
      <div className="text-[28px] font-extrabold tracking-tight mb-1.5">🗡️ Set Up Tournament</div>
      <div className="text-[var(--text2)] text-[15px] mb-8">Select who's playing today and choose your format.</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Player selection */}
        <div>
          <Card>
            <CardTitle>
              👥 Select Players
              <span className="ml-2 normal-case tracking-normal text-[var(--text2)] font-normal">
                ({n} selected · <span className="text-[var(--pro-color)]">{pros} pro</span> · <span className="text-[var(--beg-color)]">{begs} beg</span>)
              </span>
            </CardTitle>

            {allPlayers.length === 0 && (
              <div className="text-center py-6 text-[var(--text3)] text-[14px]">No players in roster yet. <button onClick={onBack} className="text-[var(--accent)] underline cursor-pointer bg-none border-none">Add some first</button>.</div>
            )}

            {[['pro', proPlayers, '🥇 Pro Players'] as const, ['beg', begPlayers, '🌱 Beginners'] as const].map(([g, gPlayers, label]) => (
              <div key={g} className="mb-4 last:mb-0">
                <div className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-2">{label} ({gPlayers.length})</div>
                {gPlayers.length === 0
                  ? <div className="text-[13px] text-[var(--text3)] py-2">None in roster</div>
                  : (
                    <div className="flex flex-col gap-1.5">
                      {gPlayers.map(p => {
                        const selected = selectedNames.has(p.name);
                        return (
                          <button key={String(p._id)} onClick={() => onTogglePlayer(p)}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border text-left cursor-pointer transition-all ${selected ? (g === 'pro' ? 'border-[var(--pro-color)] bg-[rgba(245,158,11,0.08)]' : 'border-[var(--beg-color)] bg-[rgba(34,197,94,0.08)]') : 'border-[var(--border)] bg-[var(--bg3)] hover:border-[var(--text3)]'}`}>
                            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selected ? (g === 'pro' ? 'border-[var(--pro-color)] bg-[var(--pro-color)]' : 'border-[var(--beg-color)] bg-[var(--beg-color)]') : 'border-[var(--border)]'}`}>
                              {selected && <span className="text-[#0a0e1a] text-[12px] font-black">✓</span>}
                            </span>
                            <span className="flex-1 font-medium text-[14px]">{p.name}</span>
                            <span className="text-[12px] text-[var(--text3)]">🏆{p.stats.titles} {p.stats.wins}W</span>
                          </button>
                        );
                      })}
                    </div>
                  )
                }
              </div>
            ))}

            <div className="flex gap-2 mt-4">
              <Btn variant="ghost" size="sm" onClick={() => allPlayers.forEach(p => { if (!selectedNames.has(p.name)) onTogglePlayer(p); })}>Select All</Btn>
              <Btn variant="ghost" size="sm" onClick={() => allPlayers.forEach(p => { if (selectedNames.has(p.name)) onTogglePlayer(p); })}>Clear All</Btn>
            </div>
          </Card>
        </div>

        {/* Right: Format + Summary */}
        <div>
          <Card>
            <CardTitle>⚙️ Format</CardTitle>
            <div className="mb-4">
              <div className="text-[13px] text-[var(--text2)] mb-2">Game type</div>
              <div className="flex gap-2">
                {(['singles', 'doubles'] as const).map(t => (
                  <button key={t} onClick={() => onSetGameType(t)}
                    className={`flex-1 py-2 rounded-full border text-[14px] font-medium cursor-pointer transition-all ${state.gameType === t ? 'bg-[var(--accent)] text-[#0a0e1a] border-[var(--accent)] font-bold' : 'bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[var(--text2)] mb-2">Tournament format</div>
              <div className="flex flex-col gap-2">
                {([['elimination', '🗡️ Single Elimination'], ['roundrobin', '🔄 Round Robin']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => onSetFormat(val)}
                    className={`py-2 px-4 rounded-full border text-[14px] font-medium cursor-pointer transition-all text-left ${state.tourneyFormat === val ? 'bg-[var(--accent)] text-[#0a0e1a] border-[var(--accent)] font-bold' : 'bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>📋 Summary</CardTitle>
            {[
              ['Selected players', n],
              ['Pro / Beginner', `${pros} / ${begs}`],
              ['Game type', isDoubles ? 'Doubles' : 'Singles'],
              ...(isDoubles ? [['Teams', doublesTeams]] : []),
              ['Format', fmt],
              ['Est. rounds', units >= 2 ? rounds : '—'],
            ].map(([label, value], i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--text2)] text-[14px]">{label}</span>
                <span className="font-semibold text-[14px]">{String(value)}</span>
              </div>
            ))}

            {n > 0 && n < 4 && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[var(--warn)] text-[14px] font-medium">⚠️ Need at least 4 players to start</div>
            )}
            {isDoubles && n >= 4 && doublesTeams < 2 && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[var(--warn)] text-[14px] font-medium">⚠️ Need at least 4 players for 2 doubles teams</div>
            )}
            <div className="mt-5">
              <Btn variant="primary" size="lg" full disabled={!enoughPlayers} onClick={onStart}>🚀 Start Tournament</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MATCH CARD
════════════════════════════════════════════════════ */
function MatchCard({ match, gameType, roundLabel, onScoreChange, onMarkWinner }: {
  match: Match; gameType: GameType; roundLabel: string;
  onScoreChange: (id: string, t: 'A'|'B', d: number) => void;
  onMarkWinner: (id: string, s: 'A'|'B') => void;
}) {
  if (match.bye) {
    return (
      <div className="bg-[var(--card)] border border-dashed border-[var(--border)] rounded-xl p-5 opacity-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--text3)]" />
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text3)] mb-4">🟡 BYE</div>
        <div className="font-bold text-[15px] mb-1">{match.teamA.name}</div>
        <div className="text-center py-2.5 text-[var(--text3)] text-[14px]">🏸 Advances automatically</div>
      </div>
    );
  }
  const nameA = match.teamA.name, nameB = match.teamB!.name;
  const winnerA = match.winner?.id === match.teamA.id;
  const winnerB = match.winner?.id === match.teamB?.id;

  if (match.completed) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 opacity-65 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--success)]" />
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text3)] mb-4">✅ COMPLETED</div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center">
            <div className={`font-bold text-[15px] mb-1 ${winnerA ? 'text-[var(--success)]' : 'text-[var(--text3)]'}`}>{nameA}{winnerA ? ' 🏆' : ''}</div>
            {gameType === 'doubles' && <div className="text-[12px] text-[var(--text2)]">{match.teamA.players.join(' & ')}</div>}
          </div>
          <div className="bg-[var(--bg4)] rounded-full w-9 h-9 flex items-center justify-center text-[11px] font-bold text-[var(--text3)] shrink-0">VS</div>
          <div className="flex-1 text-center">
            <div className={`font-bold text-[15px] mb-1 ${winnerB ? 'text-[var(--success)]' : 'text-[var(--text3)]'}`}>{nameB}{winnerB ? ' 🏆' : ''}</div>
            {gameType === 'doubles' && <div className="text-[12px] text-[var(--text2)]">{match.teamB!.players.join(' & ')}</div>}
          </div>
        </div>
        <div className="text-center py-2.5 bg-[var(--bg3)] rounded-lg border border-[var(--border)]">
          <div className="text-[15px] font-bold text-[var(--success)] mb-1">🏆 {match.winner!.name} wins</div>
          <div className="text-[20px] font-extrabold tracking-widest">{match.scoreA} — {match.scoreB}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]" />
      <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text3)] mb-4">⚡ LIVE · {roundLabel}</div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 text-center">
          <div className="font-bold text-[15px] mb-1">{nameA}</div>
          {gameType === 'doubles' && <div className="text-[12px] text-[var(--text2)]">{match.teamA.players.join(' & ')}</div>}
        </div>
        <div className="bg-[var(--bg4)] rounded-full w-9 h-9 flex items-center justify-center text-[11px] font-bold text-[var(--text3)] shrink-0">VS</div>
        <div className="flex-1 text-center">
          <div className="font-bold text-[15px] mb-1">{nameB}</div>
          {gameType === 'doubles' && <div className="text-[12px] text-[var(--text2)]">{match.teamB!.players.join(' & ')}</div>}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mb-4">
        {(['A', 'B'] as const).map((side, si) => (
          <>
            {si === 1 && <span key="dash" className="text-[16px] font-bold text-[var(--text3)]">—</span>}
            <div key={side} className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
              <button className="bg-[var(--bg4)] border-none text-[var(--text)] text-[18px] font-bold w-7 h-7 rounded-md cursor-pointer flex items-center justify-center hover:bg-[var(--accent)] hover:text-[#0a0e1a]" onClick={() => onScoreChange(match.id, side, -1)}>−</button>
              <span className="text-[22px] font-extrabold min-w-[32px] text-center">{side === 'A' ? match.scoreA : match.scoreB}</span>
              <button className="bg-[var(--bg4)] border-none text-[var(--text)] text-[18px] font-bold w-7 h-7 rounded-md cursor-pointer flex items-center justify-center hover:bg-[var(--accent)] hover:text-[#0a0e1a]" onClick={() => onScoreChange(match.id, side, 1)}>+</button>
            </div>
          </>
        ))}
      </div>
      <div className="flex gap-2">
        <Btn variant="success" full onClick={() => onMarkWinner(match.id, 'A')} className="text-[13px] flex-1">🏆 {nameA} Wins</Btn>
        <Btn variant="orange" full onClick={() => onMarkWinner(match.id, 'B')} className="text-[13px] flex-1">🏆 {nameB} Wins</Btn>
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
      <div className="overflow-x-auto pb-5">
        <div className="flex gap-0 min-w-max">
          {rounds.map((round, ri) => (
            <div key={ri} className="flex flex-col min-w-[220px]">
              <div className="text-[12px] font-bold uppercase tracking-widest text-[var(--accent2)] px-4 py-2 text-center border-b border-[var(--border)] mb-2">{round.name}</div>
              <div className="flex flex-col flex-1">
                {round.matches.map(match => {
                  const isCurrent = ri === currentRoundIdx;
                  const aWon = match.winner?.id === match.teamA?.id;
                  const bWon = match.winner?.id === match.teamB?.id;
                  return (
                    <div key={match.id} className="flex flex-col justify-center flex-1 px-3 py-2">
                      <div className={`bg-[var(--bg3)] border rounded-md px-3 py-2 text-[13px] font-medium my-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[190px] ${aWon ? 'border-[var(--success)] text-[var(--success)]' : isCurrent && !match.completed && !match.bye ? 'border-[var(--accent)] animate-pulse-green' : 'border-[var(--border)]'}`}>
                        {match.teamA?.name ?? '?'}
                      </div>
                      {!match.bye && (
                        <div className={`bg-[var(--bg3)] border rounded-md px-3 py-2 text-[13px] font-medium my-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[190px] ${bWon ? 'border-[var(--success)] text-[var(--success)]' : isCurrent && !match.completed ? 'border-[var(--accent)] animate-pulse-green' : 'border-[var(--border)]'}`}>
                          {match.teamB?.name ?? '?'}
                        </div>
                      )}
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>{['#','Team','W','L','+/-','Pts'].map(h => <th key={h} className="bg-[var(--bg3)] text-[var(--text2)] text-[11px] font-bold uppercase tracking-widest px-3.5 py-2.5 text-left border-b border-[var(--border)] [&:nth-child(n+3)]:text-center">{h}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.map(({ team, stats }, i) => {
              const diff = stats.scoreFor - stats.scoreAgainst;
              const badge = i===0?'bg-[#f59e0b] text-black':i===1?'bg-[#9ca3af] text-black':i===2?'bg-[#92400e] text-white':'bg-[var(--bg4)] text-[var(--text2)]';
              return (
                <tr key={team.id} className={`hover:[&>td]:bg-[var(--bg3)] ${i===0?'bg-[rgba(57,255,20,0.05)]':''}`}>
                  <td className="px-3.5 py-3 border-b border-[var(--border)]"><span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-extrabold ${badge}`}>{i+1}</span></td>
                  <td className="px-3.5 py-3 border-b border-[var(--border)]"><strong>{team.name}</strong>{gameType==='doubles'&&<><br/><span className="text-[13px] text-[var(--text2)]">{team.players.join(' & ')}</span></>}</td>
                  <td className="px-3.5 py-3 border-b border-[var(--border)] text-center font-bold text-[var(--success)]">{stats.wins}</td>
                  <td className="px-3.5 py-3 border-b border-[var(--border)] text-center font-bold text-[var(--danger)]">{stats.losses}</td>
                  <td className={`px-3.5 py-3 border-b border-[var(--border)] text-center font-bold ${diff>=0?'text-[var(--accent)]':'text-[var(--danger)]'}`}>{diff>=0?'+':''}{diff}</td>
                  <td className="px-3.5 py-3 border-b border-[var(--border)] text-center text-[16px] font-bold text-[var(--accent2)]">{stats.pts}</td>
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
════════════════════════════════════════════════════ */
function TournamentScreen({ state, onScoreChange, onMarkWinner, onReset, showRoundBanner }: {
  state: TournamentState;
  onScoreChange: (id: string, t: 'A'|'B', d: number) => void;
  onMarkWinner: (id: string, s: 'A'|'B') => void;
  onReset: () => void;
  showRoundBanner: boolean;
}) {
  const [tab, setTab] = useState<'matches'|'bracket'|'history'>('matches');
  const isRR = state.tourneyFormat === 'roundrobin';
  const currentRound = getCurrentRound(state);
  const total = state.rounds.reduce((a,r) => a + r.matches.filter(m=>!m.bye).length, 0);
  const done = state.rounds.reduce((a,r) => a + r.matches.filter(m=>m.completed&&!m.bye).length, 0);
  const progress = total ? Math.round((done/total)*100) : 0;

  return (
    <div className="animate-fadeIn">
      {showRoundBanner && (
        <div className="text-center py-5 px-5 bg-gradient-to-r from-[rgba(57,255,20,0.1)] to-[rgba(0,229,255,0.1)] border border-[var(--accent)] rounded-xl mb-5 animate-glow">
          ✅ Round complete! Advancing to next round…
        </div>
      )}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-[28px] font-extrabold tracking-tight">{isRR ? '🔄 Round Robin Tournament' : '🗡️ Elimination Bracket'}</div>
          <div className="text-[var(--text2)] text-[15px]">{state.gameType==='doubles'?'Doubles':'Singles'} · {state.teams.length} {state.gameType==='doubles'?'teams':'players'}</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-gradient-to-r from-[var(--accent)] to-[#00ff88] text-[#0a0e1a] font-extrabold text-[14px] px-4 py-1.5 rounded-full">{currentRound?.name ?? 'Complete'}</span>
          <div className="flex-1 max-w-[300px] min-w-[120px] bg-[var(--bg3)] rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] rounded-full transition-all duration-500" style={{width:`${progress}%`}} />
          </div>
          <Btn variant="ghost" size="sm" onClick={onReset}>↩️ New</Btn>
        </div>
      </div>

      <div className="flex gap-1 bg-[var(--bg3)] rounded-xl p-1 mb-6 flex-wrap">
        {([['matches','⚡ Matches'],['bracket',isRR?'📊 Standings':'📊 Bracket'],['history','📜 History']] as const).map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 px-4 py-2 rounded-lg border-none cursor-pointer font-inherit text-[14px] font-medium transition-all text-center ${tab===id?'bg-[var(--card)] text-[var(--text)] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.3)]':'bg-transparent text-[var(--text2)]'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {!currentRound
            ? <div className="col-span-full text-center py-10 text-[var(--text3)]"><span className="text-[48px] block mb-3">🏆</span><p>Tournament complete!</p></div>
            : currentRound.matches.map(m => (
                <MatchCard key={m.id} match={m} gameType={state.gameType}
                  roundLabel={getRoundLabelForMatch(state.rounds, m.id)}
                  onScoreChange={onScoreChange} onMarkWinner={onMarkWinner} />
              ))
          }
        </div>
      )}

      {tab === 'bracket' && (isRR
        ? <StandingsView teams={state.teams} rrStandings={state.rrStandings} gameType={state.gameType} />
        : <BracketView rounds={state.rounds} currentRoundIdx={state.currentRoundIdx} />
      )}

      {tab === 'history' && (
        <Card>
          <CardTitle>📜 Match History</CardTitle>
          {state.history.length === 0
            ? <div className="text-center py-10 text-[var(--text3)]"><span className="text-[48px] block mb-3">📋</span><p>No completed matches yet</p></div>
            : <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
                {[...state.history].reverse().map((h,i) => (
                  <div key={i} className="flex items-center justify-between bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-[13px] gap-3">
                    <span className="text-[11px] text-[var(--text3)] font-semibold whitespace-nowrap">{h.round}</span>
                    <span className="flex-1 font-medium">
                      <span style={{color:h.winner===h.teamA?'var(--success)':'var(--text3)',fontWeight:h.winner===h.teamA?700:undefined}}>{h.teamA}</span>
                      <span className="text-[var(--text3)]"> vs </span>
                      <span style={{color:h.winner===h.teamB?'var(--success)':'var(--text3)',fontWeight:h.winner===h.teamB?700:undefined}}>{h.teamB}</span>
                    </span>
                    <span className="font-extrabold text-[15px] tracking-widest text-[var(--accent2)]">{h.scoreA}–{h.scoreB}</span>
                  </div>
                ))}
              </div>
          }
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   CHAMPION SCREEN
════════════════════════════════════════════════════ */
function ChampionScreen({ champion, gameType, onNew, onViewHistory }: { champion: Team; gameType: GameType; onNew: () => void; onViewHistory: () => void }) {
  return (
    <div className="text-center py-[60px] px-5 animate-fadeIn">
      <span className="text-[100px] mb-6 block animate-bounce-trophy" style={{filter:'drop-shadow(0 0 30px rgba(245,158,11,0.6))'}}>🏆</span>
      <div className="text-[18px] font-bold text-[var(--text2)] uppercase tracking-[3px] mb-3">Tournament Champion</div>
      <div className="text-[48px] font-black tracking-tight bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent mb-2 leading-tight">{champion.name}</div>
      <div className="text-[16px] text-[var(--text2)] mb-12">{gameType==='doubles'?`🎉 ${champion.players.join(' & ')} — Doubles Champions!`:'🎉 Congratulations on winning the tournament!'}</div>
      <div className="flex gap-3 justify-center flex-wrap">
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
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-1.5">
        <button onClick={onBack} className="text-[var(--text3)] hover:text-[var(--text2)] cursor-pointer bg-none border-none text-[14px]">← Back</button>
      </div>
      <div className="text-[28px] font-extrabold tracking-tight mb-1.5">📜 Tournament History</div>
      <div className="text-[var(--text2)] text-[15px] mb-8">{total} tournament{total !== 1 ? 's' : ''} recorded.</div>

      {loading
        ? <div className="text-center py-10 text-[var(--text3)]">Loading…</div>
        : history.length === 0
          ? <div className="text-center py-16 text-[var(--text3)]"><span className="text-[64px] block mb-4">📋</span><p className="text-[16px]">No tournaments recorded yet.</p></div>
          : <div className="flex flex-col gap-4">
              {history.map(t => {
                const id = String(t._id);
                const isOpen = expanded === id;
                const date = new Date(t.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
                return (
                  <Card key={id} className="mb-0 cursor-pointer" >
                    <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : id)}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="text-[32px]">🏆</span>
                          <div>
                            <div className="font-bold text-[16px]">{t.champion}</div>
                            <div className="text-[13px] text-[var(--text2)]">{date} · {t.gameType === 'doubles' ? 'Doubles' : 'Singles'} · {t.format === 'elimination' ? 'Elimination' : 'Round Robin'} · {t.participants.length} players</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-[var(--text2)]">{t.matches.length} matches</span>
                          <span className="text-[var(--text3)] text-[18px]">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-4 border-t border-[var(--border)] pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                          <div>
                            <div className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-2">Participants</div>
                            <div className="flex flex-wrap gap-1.5">
                              {t.participants.map(p => (
                                <span key={p.name} className={`text-[12px] px-2 py-0.5 rounded-full border font-medium ${p.group==='pro'?'bg-[rgba(245,158,11,0.1)] text-[var(--pro-color)] border-[rgba(245,158,11,0.3)]':'bg-[rgba(34,197,94,0.1)] text-[var(--beg-color)] border-[rgba(34,197,94,0.3)]'}`}>
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          {t.standings && (
                            <div>
                              <div className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-2">Final Standings</div>
                              {t.standings.slice(0,3).map(s => (
                                <div key={s.rank} className="flex items-center gap-2 text-[13px] py-0.5">
                                  <span>{s.rank===1?'🥇':s.rank===2?'🥈':'🥉'}</span>
                                  <span className="font-semibold">{s.name}</span>
                                  <span className="text-[var(--text3)]">{s.wins}W {s.losses}L · {s.pts}pts</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[12px] font-bold uppercase tracking-widest text-[var(--text3)] mb-2">Match Results</div>
                          <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                            {t.matches.map((m, i) => (
                              <div key={i} className="flex items-center gap-3 bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]">
                                <span className="text-[var(--text3)] text-[11px] whitespace-nowrap">{m.round}</span>
                                <span className="flex-1">
                                  <span style={{color:m.winner===m.teamA?'var(--success)':'var(--text3)',fontWeight:m.winner===m.teamA?700:undefined}}>{m.teamA}</span>
                                  <span className="text-[var(--text3)]"> vs </span>
                                  <span style={{color:m.winner===m.teamB?'var(--success)':'var(--text3)',fontWeight:m.winner===m.teamB?700:undefined}}>{m.teamB}</span>
                                </span>
                                <span className="font-bold text-[var(--accent2)] tracking-widest">{m.scoreA}–{m.scoreB}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
      }
    </div>
  );
}

/* ════════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════════ */
function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<{id:number;left:string;color:string;width:string;height:string;duration:string;delay:string;isCircle:boolean}[]>([]);
  useEffect(() => {
    if (!active) { setPieces([]); return; }
    const colors = ['#39ff14','#00e5ff','#ff6b35','#f59e0b','#a78bfa','#ec4899','#ffffff'];
    setPieces(Array.from({length:120},(_,i) => ({id:i,left:`${Math.random()*100}vw`,color:colors[Math.floor(Math.random()*colors.length)],width:`${Math.random()*8+6}px`,height:`${Math.random()*8+6}px`,duration:`${Math.random()*3+2}s`,delay:`${Math.random()*2}s`,isCircle:Math.random()>0.5})));
    const t = setTimeout(() => setPieces([]), 6000);
    return () => clearTimeout(t);
  }, [active]);
  if (!pieces.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[999]">
      {pieces.map(p => <div key={p.id} className="absolute top-[-20px] animate-fall" style={{left:p.left,backgroundColor:p.color,width:p.width,height:p.height,animationDuration:p.duration,animationDelay:p.delay,borderRadius:p.isCircle?'50%':'2px'}} />)}
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

  // Fetch players when moving to setup
  const fetchPlayers = useCallback(async () => {
    const res = await fetch('/api/players');
    const data: PlayerDoc[] = await res.json();
    setAllPlayers(data);
  }, []);

  useEffect(() => {
    if (view === 'setup') fetchPlayers();
  }, [view, fetchPlayers]);

  /* toggle player in/out of today's tournament */
  function togglePlayer(p: PlayerDoc) {
    setTourney(s => {
      const group = p.group;
      const list = group === 'pro' ? s.pros : s.beginners;
      const exists = list.some(x => x.name === p.name);
      const asPlayer: Player = { name: p.name, group };
      if (group === 'pro') {
        return { ...s, pros: exists ? s.pros.filter(x => x.name !== p.name) : [...s.pros, asPlayer] };
      } else {
        return { ...s, beginners: exists ? s.beginners.filter(x => x.name !== p.name) : [...s.beginners, asPlayer] };
      }
    });
  }

  function setGameType(t: GameType) { setTourney(s => ({ ...s, gameType: t })); }
  function setFormat(f: TourneyFormat) { setTourney(s => ({ ...s, tourneyFormat: f })); }

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
          return team === 'A' ? { ...m, scoreA: Math.max(0, Math.min(30, m.scoreA + delta)) } : { ...m, scoreB: Math.max(0, Math.min(30, m.scoreB + delta)) };
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

      let newStandings = { ...s.rrStandings };
      if (s.tourneyFormat === 'roundrobin') {
        const loser = winner.id === match.teamA.id ? match.teamB! : match.teamA;
        const sFor = winner.id === match.teamA.id ? match.scoreA : match.scoreB;
        const sAgainst = winner.id === match.teamA.id ? match.scoreB : match.scoreA;
        newStandings = {
          ...newStandings,
          [winner.id]: { wins:(newStandings[winner.id]?.wins??0)+1, losses:newStandings[winner.id]?.losses??0, pts:(newStandings[winner.id]?.pts??0)+3, scoreFor:(newStandings[winner.id]?.scoreFor??0)+sFor, scoreAgainst:(newStandings[winner.id]?.scoreAgainst??0)+sAgainst },
          [loser.id]: { wins:newStandings[loser.id]?.wins??0, losses:(newStandings[loser.id]?.losses??0)+1, pts:newStandings[loser.id]?.pts??0, scoreFor:(newStandings[loser.id]?.scoreFor??0)+sAgainst, scoreAgainst:(newStandings[loser.id]?.scoreAgainst??0)+sFor },
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
        }, 800);
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
      if (!ns.rounds.every(r => r.matches.every(m => m.completed))) {
        const idx = ns.rounds.findIndex(r => r.matches.some(m => !m.completed));
        if (idx > 0 && ns.rounds[idx-1].matches.every(m => m.completed)) {
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
      }, 800);
    }
  }

  async function saveTournament(ns: TournamentState, champion: Team) {
    const standings = ns.tourneyFormat === 'roundrobin'
      ? getRRSorted(ns.teams, ns.rrStandings).map((r, i) => ({
          rank: i + 1, name: r.team.name, wins: r.stats.wins, losses: r.stats.losses,
          pts: r.stats.pts, scoreFor: r.stats.scoreFor, scoreAgainst: r.stats.scoreAgainst,
        }))
      : undefined;

    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameType: ns.gameType,
        format: ns.tourneyFormat,
        participants: [...ns.pros, ...ns.beginners],
        champion: champion.name,
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

  const headerBadge = view === 'roster' ? 'Roster' : view === 'setup' ? 'Setup' : view === 'history' ? 'History' : view === 'champion' ? 'Finished' : (getCurrentRound(tourney)?.name ?? 'Finished');

  return (
    <>
      <Confetti active={confettiActive} />

      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--bg2)] to-[var(--bg3)] border-b border-[var(--border)] px-6 flex items-center justify-between h-16 sticky top-0 z-[100] backdrop-blur-[10px]">
        <div className="flex items-center gap-2.5 text-[20px] font-extrabold tracking-tight">
          🏸 <span className="text-[var(--accent)]">Smash</span>Tour
        </div>
        <div className="flex items-center gap-3">
          {(view === 'tournament' || view === 'champion') && (
            <button onClick={() => setView('history')} className="text-[13px] text-[var(--text2)] hover:text-[var(--accent2)] cursor-pointer bg-none border-none transition-colors">📜 History</button>
          )}
          <div className="bg-[var(--bg4)] border border-[var(--border)] rounded-full px-3.5 py-1 text-[13px] text-[var(--text2)] font-medium">{headerBadge}</div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-5 py-8 pb-20">
        {view === 'roster' && <RosterScreen onDone={() => setView('setup')} />}
        {view === 'setup' && (
          <SetupScreen
            state={tourney}
            allPlayers={allPlayers}
            onTogglePlayer={togglePlayer}
            onSetGameType={setGameType}
            onSetFormat={setFormat}
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
        {view === 'history' && <HistoryScreen onBack={() => setView(tourney.champion ? 'champion' : tourney.rounds.length > 0 ? 'tournament' : 'roster')} />}
      </div>
    </>
  );
}
