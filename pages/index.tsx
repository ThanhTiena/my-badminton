'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type Player, type Team, type Match, type Round, type RRStats,
  type GameType, type TourneyFormat, type TournamentState,
  shuffleArr, buildTeams, buildEliminationRounds, advanceElimination,
  buildRoundRobin, getRoundLabelForMatch, findMatch as findMatchInRounds,
  getRRSorted, getCurrentRound, resetMatchCounter, reshuffleUnstartedMatches, getNextMatchId,
} from '@/lib/tournament';
import type { PlayerDoc, TournamentHistoryDoc, CourtSessionDoc, PaymentConfigDoc, ImportRow, BetDoc, SessionPollDoc, PollResponseDoc, VenueDoc } from '@/lib/models';
import { calculateCourtSuggestion } from '@/lib/polls';
import { parseImportText, formatVND } from '@/lib/payment';
import { Skeleton, SkeletonCard } from '@/components/ui/SkeletonLoader';
import Scoreboard, { isWinner as isBadmintonWinner } from '@/components/Scoreboard';

// ═══════════════════════════════════════════════════════════════════════
// EXTRACTED SCREEN COMPONENTS - Phase 1 Refactoring Complete
// ═══════════════════════════════════════════════════════════════════════
// The following screens have been extracted to components/screens/:
//   - RosterScreen.tsx (~200 lines)
//   - SetupScreen.tsx (~300 lines)
//   - ChampionScreen.tsx (~50 lines)
//   - TrainingScreen.tsx (~40 lines)
//
// NOTE: RosterScreen was extracted and original removed, so we must import it.
// Other screens (Setup, Champion, Training) still have originals below for Phase 1.
// Phase 2 will remove all originals and use only extracted versions.
import RosterScreen from '@/components/screens/RosterScreen';
import ContactScreen from '@/components/screens/ContactScreen';
// import SetupScreen from '@/components/screens/SetupScreen';  // Original still below
// import ChampionScreen from '@/components/screens/ChampionScreen';  // Original still below
// import TrainingScreen from '@/components/screens/TrainingScreen';  // Original still below

// Court Design System Components (Step 2: Primitive Components)
// import { Button, Badge, PlayerTile, StatCard } from '@/components';

type AppView = 'roster' | 'setup' | 'tournament' | 'champion' | 'history' | 'rankings' | 'payment' | 'bets' | 'analytics' | 'venues' | 'pricing' | 'attendance' | 'training' | 'contact';

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
  children, variant = 'primary', size, full, disabled, onClick, className = '', ariaLabel,
}: {
  children: React.ReactNode;
  variant?: 'primary'|'secondary'|'danger'|'success'|'orange'|'ghost'|'pro'|'beg';
  size?: 'sm'|'lg'; full?: boolean; disabled?: boolean;
  onClick?: () => void; className?: string; ariaLabel?: string;
}) {
  return (
    <button
      className={`btn btn-${variant}${size ? ` btn-${size}` : ''}${full ? ' btn-full' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function Card({ children, className = '', style, ...props }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; [key: string]: any }) {
  return <div className={`card ${className}`} style={style} {...props}>{children}</div>;
}

function CardTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="card-title" style={style}>{children}</div>;
}

function Badge({ group }: { group: 'pro' | 'beg' }) {
  return <span className={`badge badge-${group}`}>{group === 'pro' ? 'PRO' : 'BEG'}</span>;
}

/* ── Name display — full text, wraps naturally ── */
function TruncName({ name, className = '', style }: { name: string; maxWidth?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={{ wordBreak: 'break-word', whiteSpace: 'normal', ...style }}>
      {name}
    </span>
  );
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
    const colors = ['#7C3AED','#EC4899','#0EA5E9','#06B6D4','#F59E0B','#10B981','#FF6B6B','#ffffff'];
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
   ROSTER SCREEN - Now imported from @/components/screens/RosterScreen
════════════════════════════════════════════════════ */
// RosterScreen extracted to components/screens/RosterScreen.tsx

/* ORIGINAL CODE REMOVED - Now in components/screens/RosterScreen.tsx */

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
      <button className="back-btn" onClick={onBack} aria-label="Go back to roster screen">← Back to roster</button>
      <p className="page-title">⚙️ Set Up Tournament</p>
      <p className="page-sub">Pick who's playing today and choose your format.</p>

      {/* Draft Tournament Banner (will show if tournament has draftMode flag from poll automation) */}
      <div style={{
        padding: 16,
        background: 'linear-gradient(135deg, rgba(245,158,11,.15) 0%, rgba(245,158,11,.05) 100%)',
        border: '1px solid rgba(245,158,11,.3)',
        borderRadius: 12,
        marginBottom: 16,
        display: 'none', // Hidden by default, shown via inline style if draft
      }} className="draft-tournament-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(245,158,11,.25)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 700,
          }}>
            DRAFT TOURNAMENT
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
            🤖 Auto-created from poll
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
          This tournament was automatically created from confirmed poll responses. Review the player list, configure teams, and start when ready!
        </p>
      </div>

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
                    role="checkbox"
                    aria-checked={sel}
                    aria-label={`${sel ? 'Deselect' : 'Select'} ${p.name} for tournament`}
                  >
                    <span className={`checkbox${sel ? ' checked-pro' : ''}`} aria-hidden="true">
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
                    role="checkbox"
                    aria-checked={sel}
                    aria-label={`${sel ? 'Deselect' : 'Select'} ${p.name} for tournament`}
                  >
                    <span className={`checkbox${sel ? ' checked-beg' : ''}`} aria-hidden="true">
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
              <Btn variant="ghost" size="sm" onClick={() => allPlayers.forEach(p => { if (!selectedNames.has(p.name)) onTogglePlayer(p); })} ariaLabel="Select all players for tournament">Select All</Btn>
              <Btn variant="ghost" size="sm" onClick={() => allPlayers.forEach(p => { if (selectedNames.has(p.name)) onTogglePlayer(p); })} ariaLabel="Deselect all players">Clear All</Btn>
            </div>
          )}
        </Card>

        {/* Format + summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <CardTitle>🎮 Format</CardTitle>

            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Game type</p>
            <div className="pills" style={{ marginBottom: 18 }} role="radiogroup" aria-label="Select game type">
              {(['singles', 'doubles'] as const).map(t => (
                <button
                  key={t}
                  className={`pill${state.gameType === t ? ' active' : ''}`}
                  onClick={() => onSetGameType(t)}
                  role="radio"
                  aria-checked={state.gameType === t}
                  aria-label={`${t.charAt(0).toUpperCase() + t.slice(1)} game type`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Tournament format</p>
            <div className="pills" role="radiogroup" aria-label="Select tournament format">
              {([['elimination', '🗡️ Single Elimination'], ['roundrobin', '🔄 Round Robin']] as const).map(([v, l]) => (
                <button
                  key={v}
                  className={`pill${state.tourneyFormat === v ? ' active' : ''}`}
                  onClick={() => onSetFormat(v)}
                  role="radio"
                  aria-checked={state.tourneyFormat === v}
                  aria-label={v === 'elimination' ? 'Single Elimination format' : 'Round Robin format'}
                >
                  {l}
                </button>
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
   BET PANEL  — place & view bets on a live match
════════════════════════════════════════════════════ */
function BetPanel({ matchId, roundLabel, matchLabel, teamA, teamB }: {
  matchId: string;
  roundLabel: string;
  matchLabel: string;
  teamA: string;
  teamB: string;
}) {
  const [bets,     setBets]     = useState<BetDoc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [bettor,   setBettor]   = useState('');
  const [pick,     setPick]     = useState<string>(teamA);
  const [note,     setNote]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [open,     setOpen]     = useState(false);

  // Load existing bets for this match when panel opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/bets?matchId=${encodeURIComponent(matchId)}`)
      .then(r => r.json())
      .then((data: BetDoc[]) => { setBets(data); setLoading(false); });
  }, [open, matchId]);

  async function placeBet() {
    if (!bettor.trim() || !pick) return;
    setSaving(true);
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, roundLabel, matchLabel, bettor: bettor.trim(), pick, note }),
    });
    const saved = await res.json();
    setBets((prev: BetDoc[]) => [saved, ...prev]);
    setBettor('');
    setNote('');
    setSaving(false);
  }

  const betCount = bets.length;

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 12 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v: boolean) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
          color: 'var(--text2)', fontFamily: 'inherit',
        }}
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} betting panel. ${betCount} bet${betCount !== 1 ? 's' : ''} placed.`}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }} aria-hidden="true">
          🎲 Bets{betCount > 0 ? ` (${betCount})` : ''}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }} aria-hidden="true">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div style={{ paddingBottom: 10 }}>
          {/* Place a bet form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Your name"
                value={bettor}
                onChange={e => setBettor(e.target.value)}
                aria-label="Your name for the bet"
              />
            </div>

            {/* Pick team */}
            <div style={{ display: 'flex', gap: 6 }} role="radiogroup" aria-label="Pick which team you're betting on">
              {[teamA, teamB].map(t => (
                <button
                  key={t}
                  onClick={() => setPick(t)}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                    border: `2px solid ${pick === t ? 'var(--accent)' : 'var(--border)'}`,
                    background: pick === t ? 'rgba(57,255,20,.12)' : 'var(--bg3)',
                    color: pick === t ? 'var(--accent)' : 'var(--text2)',
                    wordBreak: 'break-word',
                  }}
                  role="radio"
                  aria-checked={pick === t}
                  aria-label={`Bet on ${t} to win`}
                >
                  {pick === t ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>

            {/* Note / stake */}
            <input
              className="input"
              placeholder="Note / stake (e.g. 20k, buy drinks)"
              value={note}
              onChange={({ target }: { target: HTMLInputElement }) => setNote(target.value)}
              onKeyDown={({ key }: { key: string }) => key === 'Enter' && placeBet()}
              aria-label="Bet note or stake amount"
            />

            <Btn variant="secondary" size="sm" disabled={saving || !bettor.trim()} onClick={placeBet}>
              {saving ? '⏳' : '🎲 Place Bet'}
            </Btn>
          </div>

          {/* Existing bets */}
          {loading ? (
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>Loading…</p>
          ) : bets.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>No bets yet. Be the first!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {bets.map(b => (
                <div key={String(b._id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: b.outcome === 'won' ? 'rgba(57,255,20,.08)' : b.outcome === 'lost' ? 'rgba(239,68,68,.08)' : 'var(--bg3)',
                  border: `1px solid ${b.outcome === 'won' ? 'var(--success)' : b.outcome === 'lost' ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 10px', gap: 8, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{b.bettor}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}> → </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)' }}>{b.pick}</span>
                    {b.note && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>· {b.note}</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0,
                    color: b.outcome === 'won' ? 'var(--success)' : b.outcome === 'lost' ? 'var(--danger)' : 'var(--text3)'
                  }}>
                    {b.outcome === 'won' ? '🏆 Won' : b.outcome === 'lost' ? '💸 Lost' : '⏳ Open'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   BADMINTON SCORE HELPERS
════════════════════════════════════════════════════ */
function getBadmintonStatus(a: number, b: number): { canWinA: boolean; canWinB: boolean; isDeuce: boolean; isGamePt: boolean } {
  const isDeuce   = a >= 20 && b >= 20;
  const canWinA   = (a >= 20 && a > b) || a >= 29;   // at 30 anyone wins
  const canWinB   = (b >= 20 && b > a) || b >= 29;
  const isGamePt  = canWinA || canWinB;
  return { canWinA, canWinB, isDeuce, isGamePt };
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
        <TruncName name={match.teamA.name} className="match-team-name" style={{ display: 'block', textAlign: 'center', marginBottom: 8 } as React.CSSProperties} />
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
            <p className={`match-team-name ${winnerA ? 'team-winner' : 'team-loser'}`}>
              <TruncName name={nameA} />{winnerA ? ' 🏆' : ''}
            </p>
            {gameType === 'doubles' && <p className="match-team-sub"><TruncName name={match.teamA.players.join(' & ')} maxWidth={150} /></p>}
          </div>
          <div className="vs-circle">VS</div>
          <div className="match-team">
            <p className={`match-team-name ${winnerB ? 'team-winner' : 'team-loser'}`}>
              <TruncName name={nameB} />{winnerB ? ' 🏆' : ''}
            </p>
            {gameType === 'doubles' && <p className="match-team-sub"><TruncName name={match.teamB!.players.join(' & ')} maxWidth={150} /></p>}
          </div>
        </div>
        <div className="completed-result">
          <p className="completed-winner">🏆 <TruncName name={match.winner!.name} maxWidth={180} /> wins</p>
          <p className="completed-score">{match.scoreA} — {match.scoreB}</p>
        </div>
        <BetPanel
          matchId={match.id}
          roundLabel={roundLabel}
          matchLabel={`${nameA} vs ${nameB}`}
          teamA={nameA}
          teamB={nameB}
        />
      </div>
    );
  }

  const sA = match.scoreA;
  const sB = match.scoreB;

  const addScore = (side: 'A' | 'B') => {
    onScoreChange(match.id, side, 1);
  };

  return (
    <div className="match-card">
      {/* Broadcast Scoreboard */}
      <Scoreboard
        teamA={{ name: nameA, players: match.teamA.players }}
        teamB={{ name: nameB, players: match.teamB!.players }}
        scoreA={sA}
        scoreB={sB}
        onScoreA={() => addScore('A')}
        onScoreB={() => addScore('B')}
        onDeclareWinner={(side) => onMarkWinner(match.id, side)}
        gameType={gameType}
        meta={
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--volt)',
              margin: 0,
            }}
          >
            ⚡ LIVE · {roundLabel}
          </p>
        }
      />

      {/* Undo button + manual declare */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button
          className="btn btn-secondary"
          style={{ flex: '0 0 auto', fontSize: '14px', padding: '8px 16px' }}
          onClick={() => {
            // Undo: subtract 1 from whichever side scored last (higher score, else A)
            if (sA > sB) onScoreChange(match.id, 'A', -1);
            else if (sB > sA) onScoreChange(match.id, 'B', -1);
            else if (sA > 0) onScoreChange(match.id, 'A', -1);
          }}
          aria-label="Undo last point"
        >
          ↩ Undo
        </button>

        {/* Manual declare buttons (for edge cases) */}
        {!isBadmintonWinner(sA, sB) && !isBadmintonWinner(sB, sA) && (
          <>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => onMarkWinner(match.id, 'A')}
              ariaLabel={`Force declare ${nameA} as winner`}
            >
              🏆 {nameA}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => onMarkWinner(match.id, 'B')}
              ariaLabel={`Force declare ${nameB} as winner`}
            >
              🏆 {nameB}
            </Btn>
          </>
        )}
      </div>

      <BetPanel
        matchId={match.id}
        roundLabel={roundLabel}
        matchLabel={`${nameA} vs ${nameB}`}
        teamA={nameA}
        teamB={nameB}
      />
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
                      <div className={`bracket-slot${aWon ? ' winner' : isCur && !m.completed && !m.bye ? ' current anim-pulse' : ''}`}><TruncName name={m.teamA?.name ?? '?'} maxWidth={100} /></div>
                      {!m.bye && <div className={`bracket-slot${bWon ? ' winner' : isCur && !m.completed ? ' current anim-pulse' : ''}`}><TruncName name={m.teamB?.name ?? '?'} maxWidth={100} /></div>}
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
                    <strong><TruncName name={team.name} maxWidth={150} /></strong>
                    {gameType === 'doubles' && <><br /><TruncName name={team.players.join(' & ')} maxWidth={150} style={{ fontSize: 12, color: 'var(--text2)' } as React.CSSProperties} /></>}
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
  state, allPlayers, onScoreChange, onMarkWinner, onReset, onCancel, onAddPlayer, onReshuffle, onAddManualMatch, showRoundBanner,
}: {
  state: TournamentState;
  allPlayers: PlayerDoc[];
  onScoreChange: (id: string, t: 'A'|'B', d: number) => void;
  onMarkWinner: (id: string, s: 'A'|'B') => void;
  onReset: () => void;
  onCancel: () => void;
  onAddPlayer: (p: PlayerDoc) => void;
  onReshuffle: () => void;
  onAddManualMatch: (teamA: Team, teamB: Team, roundLabel: string) => void;
  showRoundBanner: boolean;
}) {
  const [tab, setTab] = useState<'matches'|'bracket'|'history'>('matches');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [manualTeamA, setManualTeamA] = useState('');
  const [manualTeamB, setManualTeamB] = useState('');
  const [manualRound, setManualRound] = useState('');
  const isRR = state.tourneyFormat === 'roundrobin';
  const currentRound = getCurrentRound(state);

  // ── Focus Management: Add Player panel ──
  useEffect(() => {
    if (!showAddPlayer) return;

    // Store the trigger element (the "Add Player" button)
    const triggerElement = document.activeElement as HTMLElement;

    // Auto-focus the first player button when panel opens
    setTimeout(() => {
      const firstPlayerButton = document.querySelector('[data-add-player-btn]') as HTMLButtonElement;
      if (firstPlayerButton) {
        firstPlayerButton.focus();
      }
    }, 50);

    // Focus trap handler
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      // Get the panel container first to scope focusable elements
      const panelContainer = document.querySelector('[data-add-player-panel="true"]');
      if (!panelContainer) return;

      // Find all focusable elements within the panel only
      const focusableSelector = `
        a[href]:not([disabled]),
        button:not([disabled]),
        textarea:not([disabled]),
        input:not([disabled]):not([type="hidden"]),
        select:not([disabled]),
        [tabindex]:not([tabindex="-1"]):not([disabled])
      `.trim();

      const focusableElements = Array.from(
        panelContainer.querySelectorAll(focusableSelector)
      ).filter(el => {
        const htmlEl = el as HTMLElement;
        return htmlEl.offsetParent !== null; // checks if element is visible
      }) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element: go to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element: go to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus to the trigger element when panel closes
      if (triggerElement && triggerElement.focus) {
        setTimeout(() => triggerElement.focus(), 50);
      }
    };
  }, [showAddPlayer]);

  const totalM = state.rounds.reduce((a, r) => a + r.matches.filter(m => !m.bye).length, 0);
  const doneM  = state.rounds.reduce((a, r) => a + r.matches.filter(m => m.completed && !m.bye).length, 0);
  const progress = totalM ? Math.round((doneM / totalM) * 100) : 0;

  // Can only add players when no matches have been played yet
  const canAddPlayer = doneM === 0;

  // Players already in the tournament
  const inTournament = new Set([...state.pros, ...state.beginners].map(p => p.name));
  // Players from roster not yet in tournament
  const addablePlayers = allPlayers.filter(p => !inTournament.has(p.name));

  // For RR: show all rounds that have at least one incomplete match
  // For Elimination: show current round
  const activeRounds: Round[] = isRR
    ? state.rounds.filter(r => r.matches.some(m => !m.completed))
    : (currentRound ? [currentRound] : []);

  // Can reshuffle when there are at least 2 unstarted matches in active rounds
  const unstartedCount = activeRounds.reduce((a, r) =>
    a + r.matches.filter(m => !m.completed && m.scoreA === 0 && m.scoreB === 0 && !m.bye).length, 0);
  const canReshuffle = unstartedCount >= 2;

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
          {canAddPlayer && (
            <Btn variant="secondary" size="sm" onClick={() => setShowAddPlayer((v: boolean) => !v)} ariaLabel={showAddPlayer ? 'Close add player panel' : 'Open add player panel'}>
              {showAddPlayer ? '✕ Close' : '➕ Add Player'}
            </Btn>
          )}
          {canReshuffle && (
            <Btn variant="secondary" size="sm" onClick={onReshuffle} ariaLabel="Reshuffle unstarted matches">🔀 Reshuffle</Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={() => setShowAddMatch((v: boolean) => !v)} ariaLabel={showAddMatch ? 'Close manual match panel' : 'Open manual match panel'}>
            {showAddMatch ? '✕ Close' : '➕ Manual Match'}
          </Btn>
          <Btn variant="ghost" size="sm" onClick={onReset} ariaLabel="Start a new tournament">↩️ New</Btn>
          <Btn variant="danger" size="sm" onClick={onCancel} ariaLabel="Cancel current tournament">🚫 Cancel</Btn>
        </div>
      </div>

      {/* Add-player panel — only when no matches played yet */}
      {showAddPlayer && canAddPlayer && (
        <Card style={{ marginBottom: 16 }} className="add-player-panel" data-add-player-panel="true">
          <CardTitle>➕ Add Player to Tournament</CardTitle>
          {addablePlayers.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>All roster players are already in this tournament.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {addablePlayers.map((p, idx) => (
                <button
                  key={p.name}
                  data-add-player-btn={idx === 0 ? 'first' : undefined}
                  onClick={() => { onAddPlayer(p); setShowAddPlayer(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '2px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)',
                    transition: 'all .15s',
                  }}
                  aria-label={`Add ${p.name} to tournament`}
                >
                  <Badge group={p.group} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
            Adding a player rebuilds the bracket. Only available before any matches are played.
          </p>
        </Card>
      )}

      {/* Manual match panel */}
      {showAddMatch && (() => {
        const teamA = state.teams.find(t => t.id === manualTeamA) ?? null;
        const teamB = state.teams.find(t => t.id === manualTeamB) ?? null;
        const canSubmit = teamA && teamB && teamA.id !== teamB.id;
        const roundName = manualRound.trim() || 'Friendly';

        function submit() {
          if (!canSubmit) return;
          onAddManualMatch(teamA!, teamB!, roundName);
          setManualTeamA('');
          setManualTeamB('');
          setManualRound('');
          setShowAddMatch(false);
          setTab('matches');
        }

        return (
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>➕ Add Manual Match</CardTitle>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
              Create a one-off match between any two teams. It will appear as a live match immediately.
            </p>

            {/* Team A picker */}
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Team A</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {state.teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setManualTeamA(t.id === manualTeamA ? '' : t.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${manualTeamA === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: manualTeamA === t.id ? 'rgba(57,255,20,.12)' : 'var(--bg3)',
                    color: manualTeamA === t.id ? 'var(--accent)' : 'var(--text2)',
                  }}
                >{t.name}</button>
              ))}
            </div>

            {/* Team B picker */}
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Team B</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {state.teams.filter(t => t.id !== manualTeamA).map(t => (
                <button
                  key={t.id}
                  onClick={() => setManualTeamB(t.id === manualTeamB ? '' : t.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${manualTeamB === t.id ? 'var(--accent2)' : 'var(--border)'}`,
                    background: manualTeamB === t.id ? 'rgba(168,85,247,.12)' : 'var(--bg3)',
                    color: manualTeamB === t.id ? 'var(--accent2)' : 'var(--text2)',
                  }}
                >{t.name}</button>
              ))}
            </div>

            {/* Round label */}
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Round label <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional, defaults to "Friendly")</span></p>
            <input
              className="input"
              placeholder="e.g. Friendly, Practice, Court 3…"
              value={manualRound}
              style={{ marginBottom: 14 }}
              onChange={({ target }: { target: HTMLInputElement }) => setManualRound(target.value)}
              onKeyDown={({ key }: { key: string }) => key === 'Enter' && submit()}
            />

            {canSubmit && (
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{teamA!.name}</span>
                <span style={{ margin: '0 8px', color: 'var(--text3)' }}>vs</span>
                <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>{teamB!.name}</span>
                <span style={{ marginLeft: 8, color: 'var(--text3)' }}>· {roundName}</span>
              </div>
            )}

            <Btn variant="primary" disabled={!canSubmit} onClick={submit}>⚡ Start Match</Btn>
          </Card>
        );
      })()}

      {/* Tabs */}
      <div className="tabs" role="tablist" aria-label="Tournament sections">
        {([['matches','⚡ Matches'],['bracket', isRR ? '📊 Standings' : '📊 Bracket'],['history','📜 History']] as const).map(([id, label]) => (
          <button
            key={id}
            className={`tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`${id}-panel`}
            aria-label={label}
          >
            {label}
          </button>
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
  const [histTabs, setHistTabs] = useState<Record<string, 'bracket' | 'list'>>({});

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
        <div className="t-history-list">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="40%" height={18} style={{ marginBottom: 6 }} />
                  <Skeleton width="60%" height={14} />
                </div>
                <Skeleton width={80} height={14} />
              </div>
              <Skeleton width="100%" height={100} />
            </SkeletonCard>
          ))}
        </div>
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

                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <button
                        className={`btn btn-sm ${(!histTabs[id] || histTabs[id] === 'bracket') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ minHeight: 32, padding: '2px 10px', fontSize: 11 }}
                        onClick={() => setHistTabs(p => ({ ...p, [id]: 'bracket' }))}
                      >
                        {t.format === 'roundrobin' ? '📊 Rounds View' : '📊 Bracket View'}
                      </button>
                      <button
                        className={`btn btn-sm ${(histTabs[id] === 'list') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ minHeight: 32, padding: '2px 10px', fontSize: 11 }}
                        onClick={() => setHistTabs(p => ({ ...p, [id]: 'list' }))}
                      >
                        📝 Match List
                      </button>
                    </div>

                    {(!histTabs[id] || histTabs[id] === 'bracket') ? (
                      <div className="bracket-wrap" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '16px 14px', background: 'var(--bg-soft)', marginBottom: 16 }}>
                        <div className="bracket-rounds">
                          {(() => {
                            const roundMap = new Map<string, any[]>();
                            for (const m of t.matches) {
                              if (!roundMap.has(m.round)) roundMap.set(m.round, []);
                              roundMap.get(m.round)!.push(m);
                            }
                            const roundOrder = ['round 1', 'round 2', 'round 3', 'quarter-finals', 'semi-finals', 'finals'];
                            const reconstructed = Array.from(roundMap.entries()).map(([name, rMatches]) => {
                              return {
                                name,
                                matches: rMatches.map((m, idx) => {
                                  const isBye = !m.teamB || m.teamB === '';
                                  return {
                                    id: `h-match-${name}-${idx}`,
                                    teamA: { name: m.teamA },
                                    teamB: isBye ? null : { name: m.teamB },
                                    scoreA: m.scoreA,
                                    scoreB: m.scoreB,
                                    completed: true,
                                    bye: isBye,
                                    winner: m.winner ? { name: m.winner } : null
                                  };
                                })
                              };
                            });
                            reconstructed.sort((a, b) => {
                              const idxA = roundOrder.indexOf(a.name.toLowerCase());
                              const idxB = roundOrder.indexOf(b.name.toLowerCase());
                              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                              if (idxA !== -1) return -1;
                              if (idxB !== -1) return 1;
                              return a.name.localeCompare(b.name);
                            });
                            return reconstructed;
                          })().map((round, ri) => (
                            <div key={ri} className="bracket-round">
                              <div className="bracket-round-title" style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, textAlign: 'center' }}>
                                {round.name}
                              </div>
                              <div className="bracket-slots">
                                {round.matches.map(m => {
                                  const aWon = m.winner?.name === m.teamA?.name;
                                  const bWon = m.winner?.name === m.teamB?.name;
                                  return (
                                    <div key={m.id} className="bracket-match-group">
                                      <div className={`bracket-slot${aWon ? ' winner' : ''}`} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                        <TruncName name={m.teamA?.name ?? '?'} />
                                        {!m.bye && <span style={{ fontWeight: 700, opacity: aWon ? 1 : 0.6 }}>{m.scoreA}</span>}
                                      </div>
                                      {!m.bye && (
                                        <div className={`bracket-slot${bWon ? ' winner' : ''}`} style={{ fontSize: 11, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                          <TruncName name={m.teamB?.name ?? '?'} />
                                          <span style={{ fontWeight: 700, opacity: bWon ? 1 : 0.6 }}>{m.scoreB}</span>
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
                    ) : (
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
                    )}
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
   ADMIN ANALYTICS SCREEN
════════════════════════════════════════════════════ */
interface AnalyticsData {
  players: { total: number; pro: number; beg: number };
  tournaments: { total: number; singles: number; doubles: number; matches: number };
  financials: { totalCost: number; courtFee: number; shuttleTotal: number; sessionCount: number; totalPaid: number; totalOutstanding: number };
  bets: { total: number; settled: number };
}

function AnalyticsScreen({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async r => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.error ?? 'Failed to load analytics. Please ensure you are logged in as admin.');
        }
        return r.json();
      })
      .then((d: AnalyticsData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message ?? 'Failed to load analytics.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="anim-fade">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <p className="page-title">📊 Admin Analytics</p>
        <EmptyState icon="⏳" text="Calculating statistics and loading financial summaries..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="anim-fade">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <p className="page-title">📊 Admin Analytics</p>
        <div className="alert alert-danger" style={{ marginTop: 20 }}>
          <span>⚠️</span> {error || 'Unable to retrieve statistics.'}
        </div>
      </div>
    );
  }

  // Calculate percentages
  const collectedPct = data.financials.totalCost > 0 
    ? Math.round((data.financials.totalPaid / data.financials.totalCost) * 100)
    : 0;

  const proPct = data.players.total > 0
    ? Math.round((data.players.pro / data.players.total) * 100)
    : 0;

  const singlesPct = data.tournaments.total > 0
    ? Math.round((data.tournaments.singles / data.tournaments.total) * 100)
    : 0;

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <p className="page-title">📊 Admin Analytics</p>
          <p className="page-sub">Club insights, player metrics, and financial records summary.</p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <p className="nav-section-label" style={{ paddingLeft: 0, marginTop: 12, marginBottom: 12 }}>💰 Financial Breakdown</p>
      <div className="metric-grid">
        <div className="metric-card mc-violet">
          <div className="mc-stripe" />
          <div className="mc-label">Total Spent</div>
          <div className="mc-value">{formatVND(data.financials.totalCost)}</div>
          <div className="mc-sub">{data.financials.sessionCount} court sessions played</div>
          <div className="mc-icon">💳</div>
        </div>

        <div className="metric-card mc-green">
          <div className="mc-stripe" />
          <div className="mc-label">Collected Payments</div>
          <div className="mc-value">{formatVND(data.financials.totalPaid)}</div>
          <div className="mc-sub">{collectedPct}% collected</div>
          <div className="mc-icon">💰</div>
        </div>

        <div className="metric-card mc-red">
          <div className="mc-stripe" />
          <div className="mc-label">Outstanding Debt</div>
          <div className="mc-value">{formatVND(data.financials.totalOutstanding)}</div>
          <div className="mc-sub">Remaining to be collected</div>
          <div className="mc-icon">🛑</div>
        </div>

        <div className="metric-card mc-blue">
          <div className="mc-stripe" />
          <div className="mc-label">Shuttlecock Costs</div>
          <div className="mc-value">{formatVND(data.financials.shuttleTotal)}</div>
          <div className="mc-sub">{formatVND(data.financials.courtFee)} court rental fees</div>
          <div className="mc-icon">🏸</div>
        </div>
      </div>

      {/* Visual Progress Charts */}
      <div className="two-col" style={{ marginBottom: 28 }}>
        <Card className="card-gradient-top">
          <CardTitle>📊 Collection Progress ({collectedPct}%)</CardTitle>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Comparison of total court booking costs versus payments collected from members.
          </p>

          <div style={{ height: 24, background: 'var(--bg-soft)', borderRadius: 12, overflow: 'hidden', display: 'flex', marginBottom: 16, border: '1px solid var(--border)' }}>
            <div 
              style={{ 
                width: `${Math.min(100, collectedPct)}%`, 
                background: 'var(--grad-success)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff', 
                fontSize: 11, 
                fontWeight: 800,
                transition: 'width 1s ease-in-out'
              }}
            >
              {collectedPct}%
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <div>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', marginRight: 6 }} />
              <strong>Paid:</strong> {formatVND(data.financials.totalPaid)}
            </div>
            <div>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)', marginRight: 6 }} />
              <strong>Remaining:</strong> {formatVND(data.financials.totalOutstanding)}
            </div>
          </div>
        </Card>

        <Card className="card-gradient-top">
          <CardTitle>👥 Player Groups & Distributions</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span><strong>Roster:</strong> {data.players.pro} Pros / {data.players.beg} Beginners</span>
                <span>{proPct}% Pro</span>
              </div>
              <div style={{ height: 12, background: 'var(--bg-soft)', borderRadius: 6, overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
                <div style={{ width: `${proPct}%`, background: 'var(--grad-primary)' }} />
                <div style={{ width: `${100 - proPct}%`, background: 'var(--grad-success)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span><strong>Tournaments:</strong> {data.tournaments.singles} Singles / {data.tournaments.doubles} Doubles</span>
                <span>{singlesPct}% Singles</span>
              </div>
              <div style={{ height: 12, background: 'var(--bg-soft)', borderRadius: 6, overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
                <div style={{ width: `${singlesPct}%`, background: 'var(--grad-warm)' }} />
                <div style={{ width: `${100 - singlesPct}%`, background: 'var(--grad-sky)' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Overview Cards */}
      <p className="nav-section-label" style={{ paddingLeft: 0, marginBottom: 12 }}>📈 Activity Summary</p>
      <div className="metric-grid">
        <div className="metric-card mc-blue">
          <div className="mc-stripe" />
          <div className="mc-label">Tournaments Completed</div>
          <div className="mc-value">{data.tournaments.total}</div>
          <div className="mc-sub">Historical match records</div>
          <div className="mc-icon">🏆</div>
        </div>

        <div className="metric-card mc-violet">
          <div className="mc-stripe" />
          <div className="mc-label">Matches Played</div>
          <div className="mc-value">{data.tournaments.matches}</div>
          <div className="mc-sub">Across all formats</div>
          <div className="mc-icon">🏸</div>
        </div>

        <div className="metric-card mc-green">
          <div className="mc-stripe" />
          <div className="mc-label">Active Members</div>
          <div className="mc-value">{data.players.total}</div>
          <div className="mc-sub">Registered players on roster</div>
          <div className="mc-icon">👥</div>
        </div>

        <div className="metric-card mc-red">
          <div className="mc-stripe" />
          <div className="mc-label">Total Bets Placed</div>
          <div className="mc-value">{data.bets.total}</div>
          <div className="mc-sub">{data.bets.settled} settled matches</div>
          <div className="mc-icon">🎲</div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   RANKINGS SCREEN
════════════════════════════════════════════════════ */
function RankingsScreen({ onBack, onOpenProfile }: { onBack: () => void; onOpenProfile?: (name: string) => void }) {
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
      <div className="page-header">
        <h1 className="page-title">🏅 Rankings</h1>
        <p className="page-sub">Lifetime leaderboard — updated automatically after every tournament.</p>
      </div>

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
        <>
          {/* Skeleton: Podium */}
          <div className="podium-wrap">
            {[1, 2, 3].map(i => (
              <div key={i} className={`podium-card podium-${i === 2 ? '1st' : i === 1 ? '2nd' : '3rd'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <Skeleton variant="circular" width={56} height={56} />
                <Skeleton width="60%" height={14} />
                <Skeleton width="80%" height={18} />
                <Skeleton width="50%" height={16} />
              </div>
            ))}
          </div>

          {/* Skeleton: Table */}
          <Card>
            <CardTitle>Loading rankings...</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                    <Skeleton width="40%" height={12} />
                  </div>
                  <Skeleton width={60} height={24} />
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🏅" text="No players yet. Complete a tournament to generate rankings." />
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 2 && (
            <div className="podium-wrap">
              {podiumOrder.map((p, i) => {
                if (!p) return null;
                const rank = podiumRanks[i];
                const rankClass = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
                return (
                  <div key={p.name} className={`podium-card podium-${rankClass}`}>
                    <span className="podium-crown">{rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}</span>
                    <div className="podium-avatar">{initials(p.name)}</div>
                    <div className="podium-rank">#{rank}</div>
                    <div className="podium-name">{p.name}</div>
                    <div className="podium-score">{p.rankScore ?? 0} pts</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <Card>
            <CardTitle>📊 Full Leaderboard ({filtered.length})</CardTitle>
            <div style={{ overflowX: 'auto' }}>
              <table className="standings-table">
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Badge group={p.group} />
                            <div style={{ flex: 1 }}>
                              <strong
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  cursor: onOpenProfile ? 'pointer' : 'default',
                                  textDecoration: onOpenProfile ? 'underline' : 'none',
                                  color: 'var(--text)'
                                }}
                                onClick={() => onOpenProfile?.(p.name)}
                              >
                                {p.name}
                              </strong>
                              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, fontWeight: 500 }}>
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
   PAYMENT SCREEN
════════════════════════════════════════════════════ */
type PaymentTab = 'summary' | 'add' | 'import' | 'weights' | 'drafts';
type SummaryMode = 'monthly' | 'weekly' | 'range';

interface PlayerSummary {
  name: string;
  totalOwed: number;
  totalOwedRounded: number;
  sessionCount: number;
}

interface SummaryData {
  period: string;
  totalCost: number;
  sessions: CourtSessionDoc[];
  players: PlayerSummary[];
}

/* ── helpers ── */
function currentMonthRef() { return new Date().toISOString().slice(0, 7); }
function currentWeekRef() {
  const d = new Date();
  const year = d.getFullYear();
  // ISO week via getISOWeek-alike inline
  const tmp = new Date(d); tmp.setHours(0,0,0,0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const jan4 = new Date(tmp.getFullYear(), 0, 4);
  const week = 1 + Math.round(((tmp.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/* ════════════════════════════════════════════════════════════════
   VENUES SCREEN
──────────────────────────────────────────────────────────────── */
function VenuesScreen({ onBack }: { onBack: () => void }) {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    district: '',
    courtCount: 1,
    baseHourlyRate: 200000,
    facilities: [] as string[],
    contactPerson: '',
    contactPhone: '',
    notes: '',
  });

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/venues?all=true');
      const data = await res.json();
      setVenues(data.venues || []);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVenue ? `/api/venues/${editingVenue._id}` : '/api/venues';
      const method = editingVenue ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save venue');
        return;
      }

      await fetchVenues();
      setShowForm(false);
      setEditingVenue(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save venue:', err);
      alert('Failed to save venue');
    }
  };

  const handleEdit = (venue: any) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name || '',
      address: venue.address || '',
      district: venue.district || '',
      courtCount: venue.courtCount || 1,
      baseHourlyRate: venue.baseHourlyRate || 200000,
      facilities: venue.facilities || [],
      contactPerson: venue.contactPerson || '',
      contactPhone: venue.contactPhone || '',
      notes: venue.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (venue: any) => {
    if (!confirm(`Delete venue "${venue.name}"? This will mark it as inactive.`)) return;

    try {
      const res = await fetch(`/api/venues/${venue._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete venue');
        return;
      }
      await fetchVenues();
    } catch (err) {
      console.error('Failed to delete venue:', err);
      alert('Failed to delete venue');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      district: '',
      courtCount: 1,
      baseHourlyRate: 200000,
      facilities: [],
      contactPerson: '',
      contactPhone: '',
      notes: '',
    });
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div>
          <h1 className="screen-title">Venue Management</h1>
          <p className="screen-subtitle">Manage court venues and locations</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setEditingVenue(null); resetForm(); }}
        >
          + Add Venue
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          <CardTitle>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</CardTitle>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Venue Name *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Sunrise Sports Complex"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  District
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.district}
                  onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="District 1"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Court Count *
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.courtCount}
                  onChange={e => setFormData(prev => ({ ...prev, courtCount: parseInt(e.target.value) || 1 }))}
                  required
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Base Hourly Rate (VND) *
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.baseHourlyRate}
                  onChange={e => setFormData(prev => ({ ...prev, baseHourlyRate: parseInt(e.target.value) || 0 }))}
                  required
                  min="0"
                  step="1000"
                  placeholder="200000"
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Address
              </label>
              <input
                type="text"
                className="input"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, District 1, HCMC"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">
                {editingVenue ? 'Update Venue' : 'Create Venue'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setShowForm(false); setEditingVenue(null); resetForm(); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text2)' }}>Loading venues...</p>
        </div>
      ) : venues.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🏢</span>
            <p style={{ color: 'var(--text2)' }}>No venues yet. Add your first venue to get started.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {venues.map(venue => (
            <Card key={venue._id} style={{ opacity: venue.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                      {venue.name}
                    </h3>
                    {!venue.active && (
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        background: 'var(--error)',
                        color: 'white',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  {venue.address && (
                    <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                      📍 {venue.address}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                      🏟️ {venue.courtCount} courts
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                      💵 {venue.baseHourlyRate.toLocaleString('vi-VN')} VND/hour
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleEdit(venue)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(venue)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PRICING RULES SCREEN
──────────────────────────────────────────────────────────────── */
function PricingRulesScreen({ onBack }: { onBack: () => void }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pricing-rules?all=true');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error('Failed to fetch pricing rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div>
          <h1 className="screen-title">Pricing Rules</h1>
          <p className="screen-subtitle">Manage time-based and event pricing</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add Rule
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text2)' }}>Loading pricing rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>💵</span>
            <p style={{ color: 'var(--text2)' }}>No pricing rules yet. Add your first rule to enable dynamic pricing.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {rules.map(rule => (
            <Card key={rule._id} style={{ opacity: rule.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                      {rule.ruleName}
                    </h3>
                    {!rule.active && (
                      <span style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        background: 'var(--error)',
                        color: 'white',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>
                    <span>
                      {rule.rateType === 'multiplier' ? `${rule.rateValue}x` : `${rule.rateValue.toLocaleString('vi-VN')} VND`}
                    </span>
                    <span>Priority: {rule.priority}</span>
                    {rule.daysOfWeek && <span>Days: {rule.daysOfWeek.join(', ')}</span>}
                    {rule.timeStart && rule.timeEnd && <span>{rule.timeStart} - {rule.timeEnd}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   DRAFT SESSIONS TAB
════════════════════════════════════════════════════ */
function DraftSessionsTab() {
  const [draftSessions, setDraftSessions] = useState<CourtSessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<CourtSessionDoc | null>(null);
  const [courtFee, setCourtFee] = useState('');
  const [numShuttlecocks, setNumShuttlecocks] = useState('');
  const [shuttlecockUnitPrice, setShuttlecockUnitPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDraftSessions();
  }, []);

  const fetchDraftSessions = async () => {
    try {
      const res = await fetch('/api/payment/sessions?draftMode=true');
      const data = await res.json();
      setDraftSessions(data.sessions || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch draft sessions:', err);
      setLoading(false);
    }
  };

  const handleEditDraft = (session: CourtSessionDoc) => {
    setEditingSession(session);
    setCourtFee(String(session.courtFee || 0));
    setNumShuttlecocks(String(session.numShuttlecocks || 0));
    setShuttlecockUnitPrice(String(session.shuttlecockUnitPrice || 0));
  };

  const handleFinalizeDraft = async () => {
    if (!editingSession) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/payment/sessions/${editingSession._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtFee: Number(courtFee),
          numShuttlecocks: Number(numShuttlecocks),
          shuttlecockUnitPrice: Number(shuttlecockUnitPrice),
          draftMode: false, // Finalize the draft
        }),
      });

      if (res.ok) {
        alert('Draft finalized successfully!');
        setEditingSession(null);
        await fetchDraftSessions();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to finalize draft'}`);
      }
    } catch (err) {
      alert('Failed to finalize draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDraft = async (sessionId: string) => {
    if (!confirm('Delete this draft session?')) return;

    try {
      const res = await fetch('/api/payment/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [sessionId] }),
      });

      if (res.ok) {
        alert('Draft deleted successfully');
        await fetchDraftSessions();
      }
    } catch (err) {
      alert('Failed to delete draft');
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          Loading draft sessions...
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>📝 Draft Payment Sessions</CardTitle>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 0 }}>
          These sessions were auto-created from polls. Fill in costs and finalize to add them to your payment records.
        </p>
      </Card>

      {draftSessions.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            No draft sessions found
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {draftSessions.map((session) => (
            <Card key={String(session._id)} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    📅 {new Date(session.sessionDate).toLocaleDateString()}
                  </div>
                  {session.venueName && (
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                      📍 {session.venueName}
                    </div>
                  )}
                  {session.note && (
                    <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>
                      {session.note}
                    </div>
                  )}
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(245,158,11,.15)',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  DRAFT
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                <strong>Players ({session.players.length}):</strong> {session.players.map(p => p.name).join(', ')}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" size="sm" onClick={() => handleEditDraft(session)}>
                  ✏️ Fill Costs & Finalize
                </Btn>
                <Btn variant="danger" size="sm" onClick={() => handleDeleteDraft(String(session._id))}>
                  🗑️ Delete
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Draft Modal */}
      {editingSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30,27,75,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSession(null);
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--r)',
              padding: 32,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 24px 80px rgba(124,58,237,.25)',
              border: '1px solid var(--border)',
            }}
          >
            <CardTitle style={{ marginBottom: 20 }}>
              ✏️ Finalize Draft Session
            </CardTitle>

            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              <strong>Date:</strong> {new Date(editingSession.sessionDate).toLocaleDateString()}<br />
              <strong>Players:</strong> {editingSession.players.length}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Court Fee (VND) *
                </label>
                <input
                  className="input"
                  type="number"
                  value={courtFee}
                  onChange={(e) => setCourtFee(e.target.value)}
                  placeholder="e.g. 200000"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Number of Shuttlecocks *
                </label>
                <input
                  className="input"
                  type="number"
                  value={numShuttlecocks}
                  onChange={(e) => setNumShuttlecocks(e.target.value)}
                  placeholder="e.g. 5"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Shuttlecock Unit Price (VND) *
                </label>
                <input
                  className="input"
                  type="number"
                  value={shuttlecockUnitPrice}
                  onChange={(e) => setShuttlecockUnitPrice(e.target.value)}
                  placeholder="e.g. 25000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Btn
                  variant="secondary"
                  full
                  onClick={() => setEditingSession(null)}
                  disabled={saving}
                >
                  Cancel
                </Btn>
                <Btn
                  variant="success"
                  full
                  onClick={handleFinalizeDraft}
                  disabled={saving || !courtFee || !numShuttlecocks || !shuttlecockUnitPrice}
                >
                  {saving ? 'Saving...' : '✅ Finalize & Save'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentScreen({ onBack, tournamentPlayers = [], onOpenProfile }: { onBack: () => void; tournamentPlayers?: string[]; onOpenProfile?: (name: string) => void }) {
  const [tab, setTab] = useState<PaymentTab>('summary');

  /* ── Admin auth state ── */
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [authChecked,   setAuthChecked]   = useState(false);
  const [showLogin,     setShowLogin]     = useState(false);
  const [loginUser,     setLoginUser]     = useState('');
  const [loginPass,     setLoginPass]     = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [showChangePw,  setShowChangePw]  = useState(false);
  const [cpCurrent,     setCpCurrent]     = useState('');
  const [cpNew,         setCpNew]         = useState('');
  const [cpConfirm,     setCpConfirm]     = useState('');
  const [cpError,       setCpError]       = useState('');
  const [cpSuccess,     setCpSuccess]     = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then((d: { authenticated: boolean; username?: string }) => {
      setIsAdmin(d.authenticated);
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUser, password: loginPass }),
    });
    setLoginLoading(false);
    if (r.ok) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginUser('');
      setLoginPass('');
    } else {
      const d = await r.json();
      setLoginError(d.error ?? 'Login failed');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
  }

  async function handleChangePw() {
    setCpError('');
    setCpSuccess('');
    if (cpNew !== cpConfirm) { setCpError('New passwords do not match'); return; }
    const r = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
    });
    const d = await r.json();
    if (r.ok) {
      setCpSuccess('Password changed successfully');
      setCpCurrent(''); setCpNew(''); setCpConfirm('');
    } else {
      setCpError(d.error ?? 'Failed');
    }
  }

  /* ── Summary state ── */
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('monthly');
  const [summaryRef,  setSummaryRef]  = useState(currentMonthRef());
  const [rangeFrom,   setRangeFrom]   = useState(() => new Date().toISOString().slice(0, 10));
  const [rangeTo,     setRangeTo]     = useState(() => new Date().toISOString().slice(0, 10));
  const [summary,     setSummary]     = useState<SummaryData | null>(null);
  const [summLoading, setSummLoading] = useState(false);
  const [showRounded,    setShowRounded]    = useState(false);
  // Column visibility toggles
  const [showDayTotal,   setShowDayTotal]   = useState(true);
  const [showWeekSub,    setShowWeekSub]    = useState(true);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  // Hover popover
  const [popover, setPopover] = useState<{
    key: string; x: number; y: number;
    court: number; shuttle: number; total: number;
    name: string; date: string;
    smashWeight: number; courtRate: number; shuttleRate: number;
    courtFee: number; shuttlePool: number;
    courtWeightSum: number; shuttleWeightSum: number;
  } | null>(null);

  const [outstandingDebts, setOutstandingDebts] = useState<any[]>([]);
  const [debtLoading, setDebtLoading] = useState(true);

  const fetchDebts = useCallback(async () => {
    try {
      const r = await fetch(`/api/payment/outstanding-debt?rounded=${showRounded}`);
      if (r.ok) {
        setOutstandingDebts(await r.json());
      }
      setDebtLoading(false);
    } catch {
      setDebtLoading(false);
    }
  }, [showRounded]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  function handleExportCSV() {
    if (!summary || !summary.players) return;
    const headers = ['Player Name', 'Sessions Attended', 'Amount Owed (VND)', 'Paid Status'];
    const rows = summary.players.map(p => [
      p.name,
      p.sessionCount,
      showRounded ? p.totalOwedRounded : p.totalOwed,
      paidMap[p.name]?.paid ? 'Paid' : 'Unpaid'
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `badminton-payment-${summary.period.replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /* ── Edit session modal state ── */
  const [editingSession,    setEditingSession]    = useState<CourtSessionDoc | null>(null);
  const [editDate,          setEditDate]          = useState('');
  const [editCourtFee,      setEditCourtFee]      = useState('');
  const [editNumShut,       setEditNumShut]       = useState('');
  const [editUnitPrice,     setEditUnitPrice]     = useState('');
  const [editNote,          setEditNote]          = useState('');
  const [editHighlight,      setEditHighlight]      = useState(false);
  const [editHighlightNote,  setEditHighlightNote]  = useState('');
  const [editBulkPurchase,   setEditBulkPurchase]   = useState(false);
  const [editSelected,      setEditSelected]      = useState<Record<string, boolean>>({});
  const [editSaving,        setEditSaving]        = useState(false);
  const [editResult,        setEditResult]        = useState<string | null>(null);
  const [editInvoices,      setEditInvoices]      = useState<string[]>([]);  // base64 data URLs
  const [uploadingInvoice,  setUploadingInvoice]  = useState(false);

  /* ── Invoice image click modal ── */
  const [invoiceModal, setInvoiceModal] = useState<{ images: string[]; idx: number; date: string } | null>(null);

  /* ── Monthly paid map: playerName → { paid, paidAmount, snapshotTotal } ── */
  const [paidMap, setPaidMap] = useState<Record<string, { paid: boolean; paidAmount: number; snapshotTotal: number }>>({});
  /* ── Inline payment input: which player is being edited ── */
  const [payingPlayer, setPayingPlayer] = useState<string | null>(null);
  const [payingInput,  setPayingInput]  = useState('');

  /* ── Import state ── */
  const [importText,    setImportText]    = useState('');
  const [parsedRows,    setParsedRows]    = useState<ImportRow[]>([]);
  const [parseErrors,   setParseErrors]   = useState<{ row: number; message: string }[]>([]);
  const [importing,     setImporting]     = useState(false);
  const [importResult,  setImportResult]  = useState<string | null>(null);
  const [knownPlayers,  setKnownPlayers]  = useState<string[]>([]);

  /* ── Weights state ── */
  const [allPlrs,   setAllPlrs]   = useState<PlayerDoc[]>([]);
  const [configs,   setConfigs]   = useState<PaymentConfigDoc[]>([]);
  const [wLoading,  setWLoading]  = useState(false);
  const [editWeights,     setEditWeights]     = useState<Record<string, string>>({});  // name → smashWeight string
  const [editCourtRates,  setEditCourtRates]  = useState<Record<string, string>>({});  // name → courtRate string
  const [editShutRates,   setEditShutRates]   = useState<Record<string, string>>({});  // name → shuttleRate string
  const [savingWeight,  setSavingWeight]  = useState<string | null>(null);
  const [applyingAll,   setApplyingAll]   = useState(false);
  const [applyResult,   setApplyResult]   = useState<string | null>(null);
  // Sample session for live formula preview
  const [previewCourt,   setPreviewCourt]   = useState('300000');
  const [previewNumShut, setPreviewNumShut] = useState('3');
  const [previewUnit,    setPreviewUnit]    = useState('15000');

  /* ── Manual Add state ── */
  const [addDate,         setAddDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [addCourtFee,     setAddCourtFee]     = useState('');
  const [addNumShut,      setAddNumShut]      = useState('');
  const [addUnitPrice,    setAddUnitPrice]    = useState('');
  const [addNote,         setAddNote]         = useState('');
  // which tournament players are included in this session (default all)
  const [addSelected,     setAddSelected]     = useState<Record<string, boolean>>(
    () => Object.fromEntries(tournamentPlayers.map(n => [n, true]))
  );
  const [addBulkPurchase, setAddBulkPurchase] = useState(false);
  const [addSaving,       setAddSaving]       = useState(false);
  const [addResult,       setAddResult]       = useState<string | null>(null);

  /* ── Scan Invoice state ── */
  interface ScanExtraItem { name: string; price: number }
  interface ScanResult {
    invoiceIndex?: number;
    courtFee: number | null;
    numShuttlecocks: number | null;
    shuttlecockUnitPrice: number | null;
    shuttlecockTotal: number | null;
    extraItems: ScanExtraItem[];
    rawText: string;
  }
  type AddMode = 'choose' | 'manual' | 'scan' | 'preview';
  const [addMode,         setAddMode]         = useState<AddMode>('choose');
  const [scanLoading,     setScanLoading]     = useState(false);
  const [scanError,       setScanError]       = useState<string | null>(null);
  const [scanImageUrl,    setScanImageUrl]    = useState<string | null>(null);
  // scan preview form state (populated from scan OR cleared for manual)
  const [scanPrevDate,     setScanPrevDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [scanPrevCourtFee, setScanPrevCourtFee] = useState('');
  const [scanPrevNumShut,  setScanPrevNumShut]  = useState('');
  const [scanPrevUnitPr,   setScanPrevUnitPr]   = useState('');
  const [scanPrevNote,     setScanPrevNote]     = useState('');
  const [scanPrevHighlight,setScanPrevHighlight]= useState(false);
  const [scanPrevHlNote,   setScanPrevHlNote]   = useState('');
  const [scanPrevSelected, setScanPrevSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tournamentPlayers.map(n => [n, true]))
  );
  const [scanPrevRawText,  setScanPrevRawText]  = useState('');
  const [scanPrevRawOpen,  setScanPrevRawOpen]  = useState(false);
  const [scanPrevSaving,   setScanPrevSaving]   = useState(false);
  const [scanPrevResult,   setScanPrevResult]   = useState<string | null>(null);
  const [scanResults,      setScanResults]      = useState<ScanResult[]>([]);

  function applyMergedResultsToForm(results: ScanResult[]) {
    // Sum court fees across all invoices
    const totalCourtFee = results.reduce((sum, d) => sum + (d.courtFee ?? 0), 0);

    // Sum shuttlecock counts; compute average unit price
    const totalShut = results.reduce((sum, d) => sum + (d.numShuttlecocks ?? 0), 0);
    const totalShutCost = results.reduce((sum, d) => {
      if (d.shuttlecockTotal != null) return sum + d.shuttlecockTotal;
      if (d.numShuttlecocks != null && d.shuttlecockUnitPrice != null) return sum + d.numShuttlecocks * d.shuttlecockUnitPrice;
      return sum;
    }, 0);
    const avgUnitPrice = totalShut > 0 ? Math.round(totalShutCost / totalShut) : 0;

    // Merge extra items from all invoices
    const allExtra: ScanExtraItem[] = results.flatMap(d => d.extraItems ?? []);
    const allRaw = results.map((d, i) =>
      results.length > 1 ? `[Invoice ${i + 1}]\n${d.rawText}` : d.rawText
    ).join('\n\n');

    setScanPrevCourtFee(totalCourtFee > 0 ? String(totalCourtFee) : '');
    setScanPrevNumShut(totalShut > 0 ? String(totalShut) : '');
    setScanPrevUnitPr(avgUnitPrice > 0 ? String(avgUnitPrice) : '');
    setScanPrevDate(new Date().toISOString().slice(0, 10));
    setScanPrevNote('');
    setScanPrevRawText(allRaw);
    setScanPrevRawOpen(false);
    setScanPrevResult(null);
    if (allExtra.length > 0) {
      setScanPrevHighlight(true);
      setScanPrevHlNote(allExtra.map((it: ScanExtraItem) => `${it.name}: ${it.price.toLocaleString()}đ`).join(', '));
    } else {
      setScanPrevHighlight(false);
      setScanPrevHlNote('');
    }
    setScanPrevSelected(Object.fromEntries(tournamentPlayers.map(n => [n, true])));
  }

  async function handleScanImage(dataUrl: string) {
    setScanImageUrl(dataUrl);
    setScanLoading(true);
    setScanError(null);
    setAddMode('scan');
    try {
      const r = await fetch('/api/payment/invoice/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const raw: (ScanResult[] | ScanResult) & { error?: string } = await r.json();
      if (!r.ok) { setScanError((raw as { error?: string }).error ?? 'Extraction failed'); setScanLoading(false); return; }

      // Normalise to array
      const results: ScanResult[] = Array.isArray(raw) ? raw : [raw];
      if (results.length === 0) { setScanError('No invoice found in image'); setScanLoading(false); return; }

      setScanResults(results);
      applyMergedResultsToForm(results); // always merge all into one session
      setScanLoading(false);
      setAddMode('preview');
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Network error');
      setScanLoading(false);
    }
  }

  function openManual() {
    setScanPrevDate(new Date().toISOString().slice(0, 10));
    setScanPrevCourtFee('');
    setScanPrevNumShut('');
    setScanPrevUnitPr('');
    setScanPrevNote('');
    setScanPrevHighlight(false);
    setScanPrevHlNote('');
    setScanPrevSelected(Object.fromEntries(tournamentPlayers.map(n => [n, true])));
    setScanPrevRawText('');
    setScanPrevRawOpen(false);
    setScanPrevResult(null);
    setScanImageUrl(null);
    setAddMode('preview');
  }

  async function submitPreview() {
    if (!isAdmin) { alert('Admin login required to save sessions.'); return; }
    const courtNum = parseFloat(scanPrevCourtFee) || 0;
    const shutNum  = parseFloat(scanPrevNumShut)  || 0;
    const unitNum  = parseFloat(scanPrevUnitPr)   || 0;
    const players  = Array.from(new Set([...tournamentPlayers, ...allDbPlayers])).filter((n: string) => scanPrevSelected[n]);
    if (!scanPrevDate || players.length === 0) return;
    setScanPrevSaving(true);
    setScanPrevResult(null);
    const row: ImportRow = {
      date:                 scanPrevDate,
      players,
      courtFee:             courtNum,
      numShuttlecocks:      shutNum,
      shuttlecockUnitPrice: unitNum,
      note:                 scanPrevNote.trim() || undefined,
    };
    const r = await fetch('/api/payment/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([row]),
    });
    const data = await r.json();
    if (!r.ok) { setScanPrevSaving(false); setScanPrevResult(`❌ ${data.error}`); return; }

    // If we have an image or highlight, patch the just-created session
    const sessionId = String(data.sessions?.[0]?._id);
    if (sessionId && (scanImageUrl || scanPrevHighlight)) {
      const patch: Record<string, unknown> = {};
      if (scanImageUrl) patch.invoiceImages = [scanImageUrl];
      if (scanPrevHighlight) { patch.highlight = true; patch.highlightNote = scanPrevHlNote; }
      await fetch(`/api/payment/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    }

    setScanPrevSaving(false);
    setScanPrevResult('✅ Session saved!');
    setTimeout(() => { setAddMode('choose'); setScanImageUrl(null); }, 1200);
  }

  // live cost preview for the Add form
  const addCourtNum   = parseFloat(addCourtFee)  || 0;
  const addShutNum    = parseFloat(addNumShut)    || 0;
  const addUnitNum    = parseFloat(addUnitPrice)  || 0;
  const addShutTotal  = addShutNum * addUnitNum;
  const addTotal      = addCourtNum + addShutTotal;

  async function submitAdd() {
    if (!isAdmin) { alert('Admin login required to add sessions.'); return; }
    if (!addDate || addCourtNum < 0 || addShutNum < 0 || addUnitNum < 0 || addPlayers.length === 0) return;
    setAddSaving(true);
    setAddResult(null);
    const row: ImportRow = {
      date:                     addDate,
      players:                  addPlayers,
      courtFee:                 addCourtNum,
      numShuttlecocks:          addShutNum,
      shuttlecockUnitPrice:     addUnitNum,
      note:                     addNote.trim() || undefined,
      shuttlecocksBulkPurchase: addBulkPurchase,
    };
    const res = await fetch('/api/payment/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([row]),
    });
    const data = await res.json();
    setAddSaving(false);
    if (res.ok) {
      setAddResult('✅ Session saved!');
      setAddCourtFee('');
      setAddNumShut('');
      setAddUnitPrice('');
      setAddNote('');
      setAddBulkPurchase(false);
      setAddDate(new Date().toISOString().slice(0, 10));
      setAddSelected(Object.fromEntries(tournamentPlayers.map(n => [n, true])));
    } else {
      setAddResult(`❌ ${data.error}`);
    }
  }

  /* ── all DB players for add-session picker ── */
  const [allDbPlayers, setAllDbPlayers] = useState<string[]>([]);
  const addPlayers = Array.from(new Set([...tournamentPlayers, ...allDbPlayers])).filter((n: string) => addSelected[n]);

  /* ── load known players on mount (for import preview validation) ── */
  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then((data: PlayerDoc[]) => {
      setKnownPlayers(data.map(p => p.name.toLowerCase()));
      const names = data.map((p: PlayerDoc) => p.name).sort();
      setAllDbPlayers(names);
    });
  }, []);

  /* ── load summary when tab/mode/ref/range changes ── */
  useEffect(() => {
    if (tab !== 'summary') return;
    if (summaryMode === 'range' && (!rangeFrom || !rangeTo || rangeFrom > rangeTo)) return;
    setSummLoading(true);
    setSummary(null);
    const qs = summaryMode === 'range'
      ? `mode=range&from=${rangeFrom}&to=${rangeTo}`
      : `mode=${summaryMode}&ref=${summaryRef}`;
    fetch(`/api/payment/summary?${qs}`)
      .then(r => r.json())
      .then((data: SummaryData) => { setSummary(data); setSummLoading(false); });
    // Load paid map for monthly mode
    if (summaryMode === 'monthly') {
      fetch(`/api/payment/paid?period=${summaryRef}`)
        .then(r => r.json())
        .then((map: Record<string, { paid: boolean; paidAmount: number; snapshotTotal: number }>) => setPaidMap(map));
    } else {
      setPaidMap({});
    }
  }, [tab, summaryMode, summaryRef, rangeFrom, rangeTo]);

  /* ── load weights when tab switches ── */
  useEffect(() => {
    if (tab !== 'weights') return;
    setWLoading(true);
    Promise.all([
      fetch('/api/players').then(r => r.json()),
      fetch('/api/payment/configs').then(r => r.json()),
    ]).then(([players, cfgs]: [PlayerDoc[], PaymentConfigDoc[]]) => {
      setAllPlrs(players);
      setConfigs(cfgs);
      const initW: Record<string, string> = {};
      const initC: Record<string, string> = {};
      const initS: Record<string, string> = {};
      players.forEach(p => {
        const cfg = cfgs.find(c => c.playerName.toLowerCase() === p.name.toLowerCase());
        initW[p.name] = String(cfg?.smashWeight  ?? 1.0);
        initC[p.name] = String(cfg?.courtRate    ?? 1.0);
        initS[p.name] = String(cfg?.shuttleRate  ?? 1.0);
      });
      setEditWeights(initW);
      setEditCourtRates(initC);
      setEditShutRates(initS);
      setWLoading(false);
    });
  }, [tab]);

  /* ── parse import text live ── */
  function handleImportTextChange(text: string) {
    setImportText(text);
    setImportResult(null);
    if (!text.trim()) { setParsedRows([]); setParseErrors([]); return; }
    const { rows, errors } = parseImportText(text);
    setParsedRows(rows);
    setParseErrors(errors);
  }

  async function confirmImport() {
    if (!isAdmin) { alert('Admin login required to import sessions.'); return; }
    if (parsedRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    const res = await fetch('/api/payment/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedRows),
    });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      setImportResult(`✅ Imported ${data.inserted} session${data.inserted !== 1 ? 's' : ''} successfully.`);
      setImportText('');
      setParsedRows([]);
      setParseErrors([]);
    } else {
      setImportResult(`❌ Import failed: ${data.error}`);
    }
  }

  function openEditSession(s: CourtSessionDoc) {
    setEditingSession(s);
    setEditDate(s.sessionDate);
    setEditCourtFee(String(s.courtFee));
    setEditNumShut(String(s.numShuttlecocks));
    setEditUnitPrice(String(s.shuttlecockUnitPrice));
    setEditNote(s.note ?? '');
    setEditHighlight(s.highlight ?? false);
    setEditHighlightNote(s.highlightNote ?? '');
    setEditBulkPurchase(s.shuttlecocksBulkPurchase ?? false);
    // Pre-select current players
    const sel: Record<string, boolean> = {};
    for (const p of s.players) sel[p.name] = true;
    setEditSelected(sel);
    setEditInvoices(s.invoiceImages ?? []);
    setEditResult(null);
  }

  async function saveEditSession() {
    if (!editingSession) return;
    if (!isAdmin) { alert('Admin login required to edit sessions.'); return; }
    setEditSaving(true);
    setEditResult(null);
    const selectedPlayers = [...(editingSession.players.map((p: { name: string }) => p.name)), ...allDbPlayers]
      .filter((n, i, arr) => arr.indexOf(n) === i)
      .filter((n: string) => editSelected[n]);
    const body = {
      date:                     editDate,
      courtFee:                 parseFloat(editCourtFee) || 0,
      numShuttlecocks:          parseFloat(editNumShut) || 0,
      shuttlecockUnitPrice:     parseFloat(editUnitPrice) || 0,
      players:                  selectedPlayers,
      note:                     editNote,
      highlight:                editHighlight,
      highlightNote:            editHighlightNote,
      shuttlecocksBulkPurchase: editBulkPurchase,
    };
    const res = await fetch(`/api/payment/sessions/${String(editingSession._id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditSaving(false);
    if (res.ok) {
      setEditResult('✅ Saved!');
      // Refresh summary
      const qs = summaryMode === 'range'
        ? `mode=range&from=${rangeFrom}&to=${rangeTo}`
        : `mode=${summaryMode}&ref=${summaryRef}`;
      fetch(`/api/payment/summary?${qs}`)
        .then(r => r.json())
        .then((data: SummaryData) => setSummary(data));
      setTimeout(() => setEditingSession(null), 800);
    } else {
      const data = await res.json();
      setEditResult(`❌ ${data.error}`);
    }
  }

  async function saveInvoice(sessionId: string, images: string[]) {
    setUploadingInvoice(true);
    await fetch(`/api/payment/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceImages: images }),
    });
    setUploadingInvoice(false);
    // Update local summary so the invoice icon refreshes
    const qs = summaryMode === 'range'
      ? `mode=range&from=${rangeFrom}&to=${rangeTo}`
      : `mode=${summaryMode}&ref=${summaryRef}`;
    fetch(`/api/payment/summary?${qs}`)
      .then(r => r.json())
      .then((data: SummaryData) => setSummary(data));
  }

  async function togglePaid(playerName: string, paid: boolean, currentGrandTotal: number) {
    const period = summaryRef;
    // When marking paid, snapshot the current grand total so future sessions don't affect remaining
    const snapshotTotal = paid ? currentGrandTotal : 0;
    const paidAmount    = paid ? currentGrandTotal : 0; // fully paid = paidAmount equals snapshot
    setPaidMap(p => ({ ...p, [playerName]: { paid, paidAmount, snapshotTotal } }));
    await fetch('/api/payment/paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, playerName, paid, paidAmount, snapshotTotal }),
    });
    fetchDebts();
  }

  async function savePaidAmount(playerName: string, paidAmount: number, currentGrandTotal: number) {
    if (!isAdmin) return;
    const period = summaryRef;
    // Snapshot the grand total at this moment so remaining stays stable going forward
    const snapshotTotal = currentGrandTotal;
    const paid = paidAmount >= snapshotTotal;
    setPaidMap(p => ({ ...p, [playerName]: { paid, paidAmount, snapshotTotal } }));
    await fetch('/api/payment/paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, playerName, paid, paidAmount, snapshotTotal }),
    });
    fetchDebts();
  }

  async function deleteSession(id: string) {
    if (!isAdmin) { alert('Admin login required to delete sessions.'); return; }
    if (!confirm('Delete this session?')) return;
    await fetch(`/api/payment/sessions/${id}`, { method: 'DELETE' });
    // refresh summary
    setSummLoading(true);
    const qs = `mode=${summaryMode}&ref=${summaryRef}`;
    fetch(`/api/payment/summary?${qs}`)
      .then(r => r.json())
      .then((data: SummaryData) => { setSummary(data); setSummLoading(false); });
  }

  async function saveWeight(playerName: string) {
    const smashWeight  = parseFloat(editWeights[playerName]    ?? '1');
    const courtRate    = parseFloat(editCourtRates[playerName] ?? '1');
    const shuttleRate  = parseFloat(editShutRates[playerName]  ?? '1');
    if (isNaN(smashWeight) || smashWeight <= 0) return;
    setSavingWeight(playerName);
    await fetch('/api/payment/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, smashWeight, courtRate: isNaN(courtRate) ? 1 : courtRate, shuttleRate: isNaN(shuttleRate) ? 1 : shuttleRate }),
    });
    // Refresh configs so saved values update
    const cfgs: PaymentConfigDoc[] = await fetch('/api/payment/configs').then(r => r.json());
    setConfigs(cfgs);
    setSavingWeight(null);
  }

  async function applyAllWeights() {
    setApplyingAll(true);
    setApplyResult(null);
    const r = await fetch('/api/payment/sessions/recalculate', { method: 'POST' });
    const data = await r.json();
    setApplyResult(`✅ Recalculated ${data.updated} session${data.updated !== 1 ? 's' : ''} with latest rates.`);
    setApplyingAll(false);
    // Refresh summary so pivot table reflects new amounts
    setSummLoading(true);
    const qs = summaryMode === 'range'
      ? `mode=range&from=${rangeFrom}&to=${rangeTo}`
      : `mode=${summaryMode}&ref=${summaryRef}`;
    fetch(`/api/payment/summary?${qs}`)
      .then(res => res.json())
      .then((d: SummaryData) => { setSummary(d); setSummLoading(false); });
  }

  /* ── mode-ref sync ── */
  function handleModeChange(mode: SummaryMode) {
    setSummaryMode(mode);
    if (mode === 'monthly') setSummaryRef(currentMonthRef());
    else if (mode === 'weekly') setSummaryRef(currentWeekRef());
  }

  const TABS: [PaymentTab, string][] = isAdmin ? [
    ['summary', '💰 Summary'],
    ['drafts', '📝 Drafts'],
    ['add', '➕ Add Session'],
    ['import', '📥 Import'],
    ['weights', '⚖️ Weights'],
  ] : [
    ['summary', '💰 Summary'],
  ];

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
        <p className="page-title" style={{ margin: 0 }}>💰 Payment</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAdmin ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>🔓 Admin</span>
              <button
                onClick={() => { setShowChangePw(true); setCpError(''); setCpSuccess(''); setCpCurrent(''); setCpNew(''); setCpConfirm(''); }}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              >🔑 Change password</button>
              <button
                onClick={handleLogout}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
              >Logout</button>
            </>
          ) : (
            <button
              onClick={() => { setShowLogin(true); setLoginError(''); setLoginUser(''); setLoginPass(''); }}
              style={{ background: 'var(--bg3)', border: '1px solid var(--accent2)', color: 'var(--accent2)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >🔐 Admin Login</button>
          )}
        </div>
      </div>
      <p className="page-sub">Track court & shuttlecock costs, split fairly by smash weight.</p>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(([id, label]) => (
          <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Login modal ── */}
      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLogin(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '28px 24px', width: 320, maxWidth: '90vw' }}
            onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>🔐 Admin Login</p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Username</label>
              <input className="input" style={{ width: '100%' }} value={loginUser} onChange={e => setLoginUser(e.target.value)}
                onKeyDown={(e: { key: string }) => e.key === 'Enter' && handleLogin()} autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Password</label>
              <input className="input" style={{ width: '100%' }} type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={(e: { key: string }) => e.key === 'Enter' && handleLogin()} />
            </div>
            {loginError && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>❌ {loginError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="primary" size="lg" full disabled={loginLoading} onClick={handleLogin}>
                {loginLoading ? '⏳ Logging in…' : 'Login'}
              </Btn>
              <Btn variant="secondary" size="lg" onClick={() => setShowLogin(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Change password modal ── */}
      {showChangePw && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowChangePw(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '28px 24px', width: 340, maxWidth: '90vw' }}
            onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>🔑 Change Password</p>
            {['Current password', 'New password', 'Confirm new password'].map((label, i) => {
              const val   = [cpCurrent, cpNew, cpConfirm][i];
              const setter = [setCpCurrent, setCpNew, setCpConfirm][i];
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input className="input" style={{ width: '100%' }} type="password" value={val} onChange={e => setter(e.target.value)} />
                </div>
              );
            })}
            {cpError   && <p style={{ fontSize: 13, color: 'var(--danger)',  marginBottom: 10 }}>❌ {cpError}</p>}
            {cpSuccess && <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 10 }}>✅ {cpSuccess}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="primary" size="lg" full onClick={handleChangePw}>Save</Btn>
              <Btn variant="secondary" size="lg" onClick={() => setShowChangePw(false)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ADD SESSION TAB ═══════════════ */}
      {tab === 'add' && (
        <div>

          {/* ── CHOOSE mode: pick manual or scan ── */}
          {addMode === 'choose' && (
            <Card>
              <CardTitle>➕ New Session</CardTitle>
              {!isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                  <span>🔒</span>
                  <span style={{ fontSize: 13, color: 'var(--danger)' }}>Admin login required to add sessions.</span>
                </div>
              )}
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
                How would you like to add this session?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={openManual}
                  style={{ background: 'var(--bg3)', border: '2px solid var(--border)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✏️</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Manual</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Type in the numbers</div>
                </button>
                {isAdmin ? (
                  <label
                    style={{ background: 'var(--bg3)', border: '2px solid var(--accent2)', borderRadius: 14, padding: '20px 12px', cursor: 'pointer', textAlign: 'center', display: 'block' }}
                  >
                    <input
                      type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                      onChange={(e: { target: HTMLInputElement }) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => handleScanImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent2)' }}>Scan Invoice</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Take a photo to extract</div>
                  </label>
                ) : (
                  <div
                    style={{ background: 'var(--bg2)', border: '2px solid var(--border)', borderRadius: 14, padding: '20px 12px', textAlign: 'center', opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text3)' }}>Scan Invoice</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Admin only</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── SCAN loading state ── */}
          {addMode === 'scan' && (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                {scanLoading && (
                  <>
                    {scanImageUrl && <img src={scanImageUrl} alt="Invoice" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, objectFit: 'contain', marginBottom: 16 }} />}
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>⏳ Extracting invoice data…</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Reading Vietnamese invoice with AI</div>
                  </>
                )}
                {scanError && (
                  <>
                    <div style={{ fontSize: 14, color: 'var(--danger)', marginBottom: 16 }}>❌ {scanError}</div>
                    <Btn variant="secondary" size="sm" onClick={() => setAddMode('choose')}>← Try Again</Btn>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* ── PREVIEW / MANUAL ENTRY form ── */}
          {addMode === 'preview' && (() => {
            const courtNum  = parseFloat(scanPrevCourtFee) || 0;
            const shutNum   = parseFloat(scanPrevNumShut)  || 0;
            const unitNum   = parseFloat(scanPrevUnitPr)   || 0;
            const shutTotal = shutNum * unitNum;
            const total     = courtNum + shutTotal;
            const players   = Array.from(new Set([...tournamentPlayers, ...allDbPlayers])).filter((n: string) => scanPrevSelected[n]);
            return (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: scanResults.length > 1 ? 10 : 16 }}>
                  <button onClick={() => setAddMode('choose')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
                  <CardTitle style={{ margin: 0 }}>{scanImageUrl ? '📷 Review Scanned Invoice' : '✏️ New Session'}</CardTitle>
                </div>
                {scanResults.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, background: 'rgba(0,229,255,.08)', border: '1px solid rgba(0,229,255,.25)', borderRadius: 8, padding: '8px 12px' }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <span style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>
                      {scanResults.length} invoices detected — totals combined into one session
                    </span>
                  </div>
                )}

                {/* Scanned image thumbnail */}
                {scanImageUrl && (
                  <div style={{ marginBottom: 14 }}>
                    <img src={scanImageUrl} alt="Invoice" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 10, objectFit: 'contain', border: '1px solid var(--border)' }} />
                  </div>
                )}

                {/* Highlight banner if extra items detected */}
                {scanPrevHighlight && (
                  <div style={{ background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>⚠ Extra items detected — session will be highlighted</div>
                    <input
                      className="input" style={{ width: '100%', fontSize: 12 }}
                      value={scanPrevHlNote}
                      onChange={e => setScanPrevHlNote(e.target.value)}
                      placeholder="Edit highlight note…"
                    />
                    <button onClick={() => { setScanPrevHighlight(false); setScanPrevHlNote(''); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer', marginTop: 4 }}>✕ Remove highlight</button>
                  </div>
                )}

                {/* Date + Note */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>📅 Date</label>
                    <input type="date" className="input" style={{ width: '100%' }} value={scanPrevDate} onChange={e => setScanPrevDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>📝 Note (optional)</label>
                    <input type="text" className="input" style={{ width: '100%' }} placeholder="e.g. Saturday court 3" value={scanPrevNote} onChange={e => setScanPrevNote(e.target.value)} />
                  </div>
                </div>

                {/* Cost fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>🏟 Court Fee (₫)</label>
                    <input type="number" min={0} className="input" style={{ width: '100%' }} placeholder="e.g. 300000" value={scanPrevCourtFee} onChange={e => setScanPrevCourtFee(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>🏸 Shuttlecocks</label>
                    <input type="number" min={0} className="input" style={{ width: '100%' }} placeholder="e.g. 3" value={scanPrevNumShut} onChange={e => setScanPrevNumShut(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>💲 Price / shuttlecock (₫)</label>
                    <input type="number" min={0} className="input" style={{ width: '100%' }} placeholder="e.g. 15000" value={scanPrevUnitPr} onChange={e => setScanPrevUnitPr(e.target.value)} />
                  </div>
                </div>

                {/* Cost summary */}
                {total > 0 && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>Court: <strong>{formatVND(courtNum)}</strong></span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>Shuttles: <strong>{formatVND(shutTotal)}</strong></span>
                    <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 900, color: 'var(--accent)' }}>Total: {formatVND(total)}</span>
                  </div>
                )}

                {/* Player selection */}
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                  👥 Players ({players.length} selected)
                </label>
                {tournamentPlayers.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🏸 Tournament players</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {tournamentPlayers.map(name => {
                        const on = scanPrevSelected[name] ?? true;
                        return (
                          <button key={name}
                            onClick={() => setScanPrevSelected((prev: Record<string, boolean>) => ({ ...prev, [name]: !prev[name] }))}
                            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'rgba(57,255,20,.12)' : 'var(--bg3)', color: on ? 'var(--accent)' : 'var(--text3)' }}
                          >{on ? '✓ ' : ''}{name}</button>
                        );
                      })}
                    </div>
                  </>
                )}
                {(() => {
                  const tournSet = new Set(tournamentPlayers);
                  const extras = allDbPlayers.filter((n: string) => !tournSet.has(n));
                  if (extras.length === 0) return null;
                  return (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>👤 All players</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {extras.map(name => {
                          const on = scanPrevSelected[name] ?? false;
                          return (
                            <button key={name}
                              onClick={() => setScanPrevSelected((prev: Record<string, boolean>) => ({ ...prev, [name]: !prev[name] }))}
                              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${on ? 'var(--accent2)' : 'var(--border)'}`, background: on ? 'rgba(168,85,247,.12)' : 'var(--bg3)', color: on ? 'var(--accent2)' : 'var(--text3)' }}
                            >{on ? '✓ ' : ''}{name}</button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {/* Per-player split preview */}
                {total > 0 && players.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Estimated share per player</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
                      {players.map(name => {
                        const est = (courtNum + shutTotal) / players.length;
                        return (
                          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 8, padding: '6px 10px' }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent2)' }}>~{formatVND(Math.round(est / 1000) * 1000)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>* Preview uses equal split. Actual amounts apply saved smash weights.</p>
                  </div>
                )}

                {/* Raw OCR text (collapsible) */}
                {scanPrevRawText && (
                  <div style={{ marginBottom: 14 }}>
                    <button
                      onClick={() => setScanPrevRawOpen(o => !o)}
                      style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text3)', cursor: 'pointer', padding: 0, marginBottom: 4 }}
                    >{scanPrevRawOpen ? '▾' : '▸'} Raw OCR text (for verification)</button>
                    {scanPrevRawOpen && (
                      <pre style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                        {scanPrevRawText}
                      </pre>
                    )}
                  </div>
                )}

                {scanPrevResult && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: scanPrevResult.startsWith('✅') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>
                    {scanPrevResult}
                  </p>
                )}

                <Btn
                  variant="primary" size="lg"
                  disabled={!isAdmin || scanPrevSaving || players.length === 0 || !scanPrevDate || scanPrevCourtFee === ''}
                  onClick={submitPreview}
                >
                  {!isAdmin ? '🔒 Admin only' : scanPrevSaving ? '⏳ Saving…' : '💾 Save Session'}
                </Btn>
              </Card>
            );
          })()}

          {/* ── Legacy manual form (kept for add tab direct access) ── */}
          {addMode === 'manual' && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button onClick={() => setAddMode('choose')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
                <CardTitle style={{ margin: 0 }}>✏️ New Session</CardTitle>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>📅 Date</label>
                  <input type="date" className="input" style={{ width: '100%' }} value={addDate} onChange={e => setAddDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>📝 Note (optional)</label>
                  <input type="text" className="input" style={{ width: '100%' }} placeholder="e.g. Saturday court 3" value={addNote} onChange={e => setAddNote(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>🏟 Court Fee (₫)</label>
                  <input type="number" min={0} className="input" style={{ width: '100%' }} placeholder="e.g. 300000" value={addCourtFee} onChange={e => setAddCourtFee(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>🏸 Shuttlecocks used</label>
                  <input type="number" min={0} className="input" style={{ width: '100%' }} placeholder="e.g. 3" value={addNumShut} onChange={e => setAddNumShut(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>💲 Price / shuttlecock (₫)</label>
                  <input type="number" min={0} className="input" style={{ width: '100%' }} placeholder="e.g. 15000" value={addUnitPrice} onChange={e => setAddUnitPrice(e.target.value)} />
                </div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={addBulkPurchase}
                    onChange={e => setAddBulkPurchase(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  🧺 Bulk / tube purchase
                </label>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '6px 0 0 28px', lineHeight: 1.5 }}>
                  {addBulkPurchase
                    ? 'Shuttlecock cost will be split monthly by attendance, not per-session.'
                    : 'Shuttlecock cost is split among players in this session only.'}
                </p>
              </div>
              {addTotal > 0 && (
                <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>Court: <strong>{formatVND(addCourtNum)}</strong></span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>Shuttles: <strong>{formatVND(addShutTotal)}</strong></span>
                  <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 900, color: 'var(--accent)' }}>Total: {formatVND(addTotal)}</span>
                </div>
              )}
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>👥 Players in this session ({addPlayers.length} selected)</label>
              {tournamentPlayers.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🏸 Today&apos;s players (tournament)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {tournamentPlayers.map(name => {
                      const on = addSelected[name] ?? true;
                      return (
                        <button key={name} onClick={() => setAddSelected((prev: Record<string, boolean>) => ({ ...prev, [name]: !prev[name] }))}
                          style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'rgba(57,255,20,.12)' : 'var(--bg3)', color: on ? 'var(--accent)' : 'var(--text3)', transition: 'all .15s' }}
                        >{on ? '✓ ' : ''}{name}</button>
                      );
                    })}
                  </div>
                </>
              )}
              {(() => {
                const tournSet = new Set(tournamentPlayers);
                const extras = allDbPlayers.filter((n: string) => !tournSet.has(n));
                if (extras.length === 0) return null;
                return (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>👤 All players</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {extras.map(name => {
                        const on = addSelected[name] ?? false;
                        return (
                          <button key={name} onClick={() => setAddSelected((prev: Record<string, boolean>) => ({ ...prev, [name]: !prev[name] }))}
                            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${on ? 'var(--accent2)' : 'var(--border)'}`, background: on ? 'rgba(168,85,247,.12)' : 'var(--bg3)', color: on ? 'var(--accent2)' : 'var(--text3)', transition: 'all .15s' }}
                          >{on ? '✓ ' : ''}{name}</button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
              {addTotal > 0 && addPlayers.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Estimated share per player</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
                    {addPlayers.map(name => {
                      const est = (addCourtNum + addShutTotal) / addPlayers.length;
                      return (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 8, padding: '6px 10px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent2)' }}>~{formatVND(Math.round(est / 1000) * 1000)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>* Preview uses equal split. Actual amounts apply saved smash weights.</p>
                </div>
              )}
              {addResult && (
                <p style={{ fontSize: 13, fontWeight: 700, color: addResult.startsWith('✅') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>
                  {addResult}
                </p>
              )}
              <Btn variant="primary" size="lg"
                disabled={!isAdmin || addSaving || addPlayers.length === 0 || !addDate || addCourtFee === '' || addNumShut === '' || addUnitPrice === ''}
                onClick={submitAdd}
              >
                {!isAdmin ? '🔒 Admin only' : addSaving ? '⏳ Saving…' : '💾 Save Session'}
              </Btn>
            </Card>
          )}

        </div>
      )}

      {/* ═══════════════ SUMMARY TAB ═══════════════ */}
      {tab === 'summary' && (
        <div>
          {/* Filter Bar & Outstanding Debt Leaderboard */}
          <div className="two-col" style={{ marginBottom: 16 }}>
            {/* Filter bar */}
            <Card style={{ height: 'fit-content' }}>
              {/* Row 1: period picker */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="pills" style={{ margin: 0 }}>
                  <button className={`pill${summaryMode === 'monthly' ? ' active' : ''}`} onClick={() => handleModeChange('monthly')}>📅 Monthly</button>
                  <button className={`pill${summaryMode === 'weekly'  ? ' active' : ''}`} onClick={() => handleModeChange('weekly')}>📆 Weekly</button>
                  <button className={`pill${summaryMode === 'range'   ? ' active' : ''}`} onClick={() => handleModeChange('range')}>📆 Range</button>
                </div>

                {summaryMode === 'monthly' && (
                  <input type="month" className="input" style={{ width: 160 }} value={summaryRef} onChange={({ target }: { target: HTMLInputElement }) => setSummaryRef(target.value)} />
                )}
                {summaryMode === 'weekly' && (
                  <input type="week" className="input" style={{ width: 180 }} value={summaryRef} onChange={({ target }: { target: HTMLInputElement }) => setSummaryRef(target.value)} />
                )}
                {summaryMode === 'range' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="date" className="input" style={{ width: 150 }} value={rangeFrom} max={rangeTo}
                      onChange={({ target }: { target: HTMLInputElement }) => setRangeFrom(target.value)} />
                    <span style={{ fontSize: 13, color: 'var(--text3)' }}>–</span>
                    <input type="date" className="input" style={{ width: 150 }} value={rangeTo} min={rangeFrom}
                      onChange={({ target }: { target: HTMLInputElement }) => setRangeTo(target.value)} />
                  </div>
                )}
              </div>

              {/* Row 2: display options */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>Show:</span>
                {([
                  ['showDayTotal',   showDayTotal,   setShowDayTotal,   'Day total'],
                  ['showWeekSub',    showWeekSub,    setShowWeekSub,    'Week sub'],
                  ['showGrandTotal', showGrandTotal, setShowGrandTotal, 'Grand total'],
                ] as [string, boolean, (v: boolean) => void, string][]).map(([key, val, setter, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={val} onChange={({ target }: { target: HTMLInputElement }) => setter(target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent2)' }} />
                    {label}
                  </label>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginLeft: 'auto', userSelect: 'none' }}>
                  <input type="checkbox" checked={showRounded} onChange={({ target }: { target: HTMLInputElement }) => setShowRounded(target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent)' }} />
                  Round 1k
                </label>
              </div>
            </Card>

            {/* Outstanding Debt Summary */}
            <Card style={{ height: 'fit-content' }}>
              <CardTitle>🔴 Outstanding Debt</CardTitle>
              {debtLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Skeleton width="50%" height={16} />
                      <Skeleton width="30%" height={20} />
                    </div>
                  ))}
                </div>
              ) : outstandingDebts.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>🎉 All debts settled!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 115, overflowY: 'auto' }}>
                  {outstandingDebts.map(d => (
                    <div key={d.playerName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--bg-soft)', paddingBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', cursor: onOpenProfile ? 'pointer' : 'default', textDecoration: onOpenProfile ? 'underline' : 'none' }}
                        onClick={() => onOpenProfile?.(d.playerName)}>
                        {d.playerName}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                        {formatVND(d.totalOutstanding)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {summLoading ? (
            <Card>
              <CardTitle>Loading payment data...</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Table header skeleton */}
                <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={16} />
                  <Skeleton width={80} height={16} />
                  <Skeleton width={80} height={16} />
                  <Skeleton width={100} height={16} />
                </div>
                {/* Table rows skeleton */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Skeleton width={120} height={20} />
                    <Skeleton width={80} height={20} />
                    <Skeleton width={80} height={20} />
                    <Skeleton width={80} height={20} />
                    <Skeleton width={100} height={24} />
                  </div>
                ))}
              </div>
            </Card>
          ) : !summary || summary.sessions.length === 0 ? (
            <EmptyState icon="📋" text={`No sessions found for ${summaryRef.replace('W', 'Week ')}.`} />
          ) : (() => {
            // ── Build pivot data ──────────────────────────────────────────
            // All unique player names (union across all sessions, sorted)
            const allNames: string[] = (Array.from(
              new Set(summary.sessions.flatMap((s: CourtSessionDoc) => s.players.map(p => p.name)))
            ) as string[]).sort();

            // Group sessions by ISO week
            const weekMap = new Map<number, CourtSessionDoc[]>();
            for (const s of summary.sessions as CourtSessionDoc[]) {
              const w = s.week;
              if (!weekMap.has(w)) weekMap.set(w, []);
              weekMap.get(w)!.push(s);
            }
            const weeks = Array.from(weekMap.entries()).sort((a, b) => a[0] - b[0]);

            // Helper: get a player's amount for one session (null = not in session)
            function playerAmt(s: CourtSessionDoc, name: string): {
              court: number; shuttle: number; total: number;
              smashWeight: number; courtRate: number; shuttleRate: number;
              courtFee: number; shuttlePool: number;
              courtWeightSum: number; shuttleWeightSum: number;
            } | null {
              const p = s.players.find(pl => pl.name === name);
              if (!p) return null;
              // Use stored per-player shares — fall back to proportional split for old records
              const court   = p.courtShare   ?? (s.courtFee / s.players.length);
              const shuttle = p.shuttleShare ?? ((showRounded ? p.amountOwedRounded : p.amountOwed) - (s.courtFee / s.players.length));
              const total   = showRounded ? p.amountOwedRounded : p.amountOwed;
              const courtWeightSum   = s.players.reduce((sum, pl) => sum + (pl.courtRate   ?? 1.0), 0);
              const shuttleWeightSum = s.players.reduce((sum, pl) => sum + (pl.smashWeight * (pl.shuttleRate ?? 1.0)), 0);
              return {
                court, shuttle, total,
                smashWeight:     p.smashWeight,
                courtRate:       p.courtRate   ?? 1.0,
                shuttleRate:     p.shuttleRate ?? 1.0,
                courtFee:        s.courtFee,
                shuttlePool:     s.shuttlecockTotal,
                courtWeightSum,
                shuttleWeightSum,
              };
            }

            // Grand totals per player
            const grandTotals: Record<string, number> = {};
            for (const name of allNames) {
              grandTotals[name] = (summary.sessions as CourtSessionDoc[]).reduce((sum: number, s: CourtSessionDoc) => {
                const a = playerAmt(s, name);
                return sum + (a ? a.total : 0);
              }, 0);
            }
            const grandTotal = (summary.sessions as CourtSessionDoc[]).reduce((s: number, sess: CourtSessionDoc) => s + sess.totalCost, 0);

            // Remaining = all-sessions grandTotal - paidAmount (always live, never snapshot-based)
            const remainingTotals: Record<string, number> = {};
            // Extra sessions added after payment was recorded
            const extraSincePayment: Record<string, number> = {};
            for (const name of allNames) {
              const entry = paidMap[name];
              const paidAmount    = entry?.paidAmount    ?? 0;
              const snapshotTotal = entry?.snapshotTotal ?? 0;
              remainingTotals[name] = Math.max(0, grandTotals[name] - paidAmount);
              // Show indicator if new sessions were added after snapshot was taken
              extraSincePayment[name] = snapshotTotal > 0 && grandTotals[name] > snapshotTotal
                ? grandTotals[name] - snapshotTotal
                : 0;
            }
            const totalRemaining = allNames.reduce((sum, name) => sum + remainingTotals[name], 0);

            const cellStyle = {
              textAlign: 'right' as const, padding: '7px 10px', fontSize: 12,
              borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
              whiteSpace: 'nowrap' as const,
            };
            const subStyle = {
              ...cellStyle, background: 'rgba(57,255,20,.05)', fontWeight: 700, color: 'var(--accent)',
            };
            const weekStyle = {
              ...cellStyle, background: 'rgba(168,85,247,.07)', fontWeight: 700, color: 'var(--accent2)',
            };
            const grandStyle = {
              ...cellStyle, background: 'rgba(57,255,20,.12)', fontWeight: 900, color: 'var(--accent)', fontSize: 13,
            };
            const headerStyle = {
              padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
              letterSpacing: '.5px', color: 'var(--text3)', background: 'var(--bg3)',
              borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)',
              whiteSpace: 'nowrap' as const, textAlign: 'right' as const,
            };
            const stickyNameStyle = {
              position: 'sticky' as const, left: 0, background: 'var(--card)', zIndex: 2,
              padding: '7px 12px', fontWeight: 600, fontSize: 12,
              borderBottom: '1px solid var(--border)', borderRight: '2px solid var(--border)',
              whiteSpace: 'nowrap' as const, minWidth: 110,
            };

            return (
              <>
                {/* Period header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 20 }}>{summary.period}</p>
                      <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                        {summary.sessions.length} session{summary.sessions.length !== 1 ? 's' : ''} · {allNames.length} players
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleExportCSV}
                      style={{ minHeight: 34, padding: '4px 12px', borderRadius: 8, fontSize: 12 }}
                    >
                      📥 Export CSV
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: 20, alignItems: 'flex-end' }}>
                    {summaryMode === 'monthly' && totalRemaining < grandTotal && (
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>Remaining</p>
                        <p style={{ fontSize: 20, fontWeight: 900, color: totalRemaining === 0 ? 'var(--success)' : 'var(--warn)' }}>{formatVND(totalRemaining)}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text3)' }}>Grand total</p>
                      <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>{formatVND(grandTotal)}</p>
                    </div>
                  </div>
                </div>

                {/* Pivot table */}
                <div className="payment-table-wrapper" style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }}
                  onMouseLeave={() => setPopover(null)}>
                  <table className="payment-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600 }}>
                    <thead>
                      {/* ── Row 1: Sticky name + Month spanning all session columns ── */}
                      <tr>
                        <th rowSpan={3} style={{ ...headerStyle, textAlign: 'left', fontSize: 13, color: 'var(--text)', background: 'var(--bg3)', position: 'sticky', left: 0, zIndex: 3, minWidth: 140, verticalAlign: 'middle' }}>
                          Player
                        </th>
                        <th
                          colSpan={summary.sessions.length}
                          style={{ ...headerStyle, textAlign: 'center', fontSize: 13, color: 'var(--text)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', letterSpacing: 1 }}
                        >
                          {summary.period}
                        </th>
                        {showGrandTotal && (
                          <th rowSpan={3} style={{ ...headerStyle, color: 'var(--accent)', fontSize: 12, minWidth: 100, textAlign: 'center', verticalAlign: 'middle', borderRight: summaryMode === 'monthly' ? '1px solid var(--border)' : 'none' }}>
                            Grand Total
                          </th>
                        )}
                        {summaryMode === 'monthly' && (
                          <>
                            <th rowSpan={3} style={{ ...headerStyle, color: 'var(--warn)', fontSize: 12, minWidth: 120, textAlign: 'center', verticalAlign: 'middle' }}>
                              Remaining
                            </th>
                            <th rowSpan={3} style={{ ...headerStyle, color: 'var(--success)', fontSize: 12, minWidth: 60, textAlign: 'center', borderRight: 'none', verticalAlign: 'middle' }}>
                              Paid
                            </th>
                          </>
                        )}
                      </tr>
                      {/* ── Row 2: Week group headers ── */}
                      <tr>
                        {weeks.map(([wk, wSessions]) => (
                          <th
                            key={`wkhdr-${wk}`}
                            colSpan={wSessions.length}
                            style={{ ...headerStyle, textAlign: 'center', fontSize: 11, color: 'var(--accent2)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', padding: '5px 10px' }}
                          >
                            Week {wk}
                          </th>
                        ))}
                      </tr>
                      {/* ── Row 3: Individual session date headers ── */}
                      <tr>
                        {weeks.map(([, wSessions]) =>
                          wSessions.map((s: CourtSessionDoc) => (
                            <th key={s.sessionDate} style={{ ...headerStyle, textAlign: 'center', minWidth: 100, borderTop: 'none', ...(s.highlight ? { background: 'rgba(220,38,38,.25)', borderBottom: '2px solid rgba(220,38,38,.7)' } : {}) }}>
                              <span style={{ display: 'block' }}>{s.sessionDate.slice(5)}</span>
                              {s.note && <span style={{ display: 'block', fontSize: 9, color: 'var(--text3)', fontWeight: 400 }}>{s.note}</span>}
                              {s.highlight && (
                                <span
                                  title={s.highlightNote || 'Notable session'}
                                  style={{ display: 'inline-block', marginTop: 2, fontSize: 10, color: '#f87171', fontWeight: 600, cursor: 'help', background: 'rgba(220,38,38,.35)', borderRadius: 4, padding: '1px 5px' }}
                                >
                                  ⚠ {s.highlightNote || 'Notable'}
                                </span>
                              )}
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {/* ── Player rows ── */}
                      {allNames.map(name => (
                        <tr key={name}>
                          <td style={{ ...stickyNameStyle, cursor: onOpenProfile ? 'pointer' : 'default', textDecoration: onOpenProfile ? 'underline' : 'none' }} onClick={() => onOpenProfile?.(name)}>{name}</td>

                          {/* Day cells — hover shows popover */}
                          {weeks.map(([, wSessions]) =>
                            wSessions.map((s: CourtSessionDoc) => {
                              const a = playerAmt(s, name);
                              const popKey = `${s.sessionDate}-${name}`;
                              return (
                                <td
                                  key={s.sessionDate}
                                  style={{ ...cellStyle, color: a ? 'var(--text)' : 'var(--text3)', cursor: a ? 'default' : 'default', position: 'relative', ...(s.highlight ? { background: 'rgba(220,38,38,.13)' } : {}) }}
                                  onMouseEnter={a ? ((e: { currentTarget: HTMLElement }) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPopover({ key: popKey, x: rect.left + rect.width / 2 + window.scrollX, y: rect.top + window.scrollY, court: a.court, shuttle: a.shuttle, total: a.total, name, date: s.sessionDate, smashWeight: a.smashWeight, courtRate: a.courtRate, shuttleRate: a.shuttleRate, courtFee: a.courtFee, shuttlePool: a.shuttlePool, courtWeightSum: a.courtWeightSum, shuttleWeightSum: a.shuttleWeightSum });
                                  }) : undefined}
                                  onMouseLeave={() => setPopover(null)}
                                >
                                  {a ? formatVND(a.total) : '—'}
                                </td>
                              );
                            })
                          )}

                          {/* Grand total */}
                          {showGrandTotal && (
                            <td style={{ ...grandStyle }}>
                              {grandTotals[name] > 0 ? formatVND(grandTotals[name]) : '—'}
                            </td>
                          )}

                          {/* Remaining + Paid columns */}
                          {summaryMode === 'monthly' && (
                            <>
                              <td
                                style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, cursor: isAdmin ? 'pointer' : 'default', color: remainingTotals[name] === 0 ? 'var(--success)' : 'var(--warn)', minWidth: 110, position: 'relative' }}
                                title={isAdmin ? 'Click to enter paid amount' : undefined}
                                onClick={() => {
                                  if (!isAdmin) return;
                                  setPayingPlayer(name);
                                  setPayingInput(String(paidMap[name]?.paidAmount ?? ''));
                                }}
                              >
                                {payingPlayer === name ? (
                                  <input
                                    autoFocus
                                    type="number"
                                    value={payingInput}
                                    onChange={(e: { target: HTMLInputElement }) => setPayingInput(e.target.value)}
                                    onBlur={() => {
                                      const amt = parseFloat(payingInput) || 0;
                                      savePaidAmount(name, amt, grandTotals[name]);
                                      setPayingPlayer(null);
                                    }}
                                    onKeyDown={(e: { key: string }) => {
                                      if (e.key === 'Enter') {
                                        const amt = parseFloat(payingInput) || 0;
                                        savePaidAmount(name, amt, grandTotals[name]);
                                        setPayingPlayer(null);
                                      }
                                      if (e.key === 'Escape') setPayingPlayer(null);
                                    }}
                                    style={{ width: '90%', fontSize: 12, padding: '2px 4px', background: 'var(--bg2)', border: '1px solid var(--accent2)', borderRadius: 4, color: 'var(--text)', textAlign: 'right' }}
                                    onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
                                  />
                                ) : remainingTotals[name] === 0
                                  ? <span style={{ color: 'var(--success)' }}>✓ Paid</span>
                                  : <span>
                                      {formatVND(remainingTotals[name])}
                                      {extraSincePayment[name] > 0 && (
                                        <span style={{ display: 'block', fontSize: 10, color: 'var(--warn)', fontWeight: 600, marginTop: 1 }}
                                          title={`+${formatVND(extraSincePayment[name])} added after payment was recorded`}>
                                          ⚠ +{formatVND(extraSincePayment[name])} new
                                        </span>
                                      )}
                                    </span>
                                }
                              </td>
                              <td style={{ ...cellStyle, textAlign: 'center', borderRight: 'none' }}>
                                <input
                                  type="checkbox"
                                  checked={paidMap[name]?.paid ?? false}
                                  title={isAdmin ? (paidMap[name]?.paid ? `${name} paid` : `${name} not paid`) : 'Admin login required to change paid status'}
                                  disabled={!isAdmin}
                                  style={{ width: 16, height: 16, cursor: isAdmin ? 'pointer' : 'not-allowed', accentColor: 'var(--success)', opacity: isAdmin ? 1 : 0.5 }}
                                  onChange={(e: { target: HTMLInputElement }) => isAdmin && togglePaid(name, e.target.checked, grandTotals[name])}
                                />
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {/* ── Day subtotal row ── */}
                      {showDayTotal && (
                        <tr>
                          <td style={{ ...stickyNameStyle, fontWeight: 800, color: 'var(--accent)', background: '#0d1a0d' }}>
                            Day Total
                          </td>
                          {weeks.map(([, wSessions]) =>
                            wSessions.map((s: CourtSessionDoc) => (
                              <td key={`dsub-${s.sessionDate}`} style={{ ...subStyle, ...(s.highlight ? { background: 'rgba(220,38,38,.22)' } : {}) }}>
                                {formatVND(s.totalCost)}
                              </td>
                            ))
                          )}
                          {showGrandTotal && <td style={{ ...grandStyle }}>{formatVND(grandTotal)}</td>}
                          {summaryMode === 'monthly' && <td style={{ ...grandStyle }} />}
                          {summaryMode === 'monthly' && <td style={{ ...grandStyle, borderRight: 'none' }} />}
                        </tr>
                      )}

                      {/* ── Week Total row — one cell per week group ── */}
                      {showWeekSub && (
                        <tr>
                          <td style={{ ...stickyNameStyle, fontWeight: 700, color: 'var(--accent2)', background: 'var(--card)' }}>
                            Week Total
                          </td>
                          {weeks.map(([wk, wSessions]) => {
                            const wCost = wSessions.reduce((acc: number, sess: CourtSessionDoc) => acc + sess.totalCost, 0);
                            return (
                              <td key={`wktotal-${wk}`} colSpan={wSessions.length} style={{ ...weekStyle, textAlign: 'center', fontWeight: 800, fontSize: 13 }}>
                                {formatVND(wCost)}
                              </td>
                            );
                          })}
                          {showGrandTotal && <td style={{ ...weekStyle }} />}
                          {summaryMode === 'monthly' && <td style={{ ...weekStyle }} />}
                          {summaryMode === 'monthly' && <td style={{ ...weekStyle, borderRight: 'none' }} />}
                        </tr>
                      )}

                      {/* ── Invoice row ── */}
                      <tr>
                        <td style={{ ...stickyNameStyle, fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>🧾 Invoice</td>
                        {weeks.map(([, wSessions]) =>
                          wSessions.map((s: CourtSessionDoc) => (
                            <td
                              key={`inv-${s.sessionDate}`}
                              style={{ ...cellStyle, textAlign: 'center', padding: '4px 6px', cursor: (s.invoiceCount ?? 0) > 0 ? 'pointer' : 'default' }}
                              onClick={(s.invoiceCount ?? 0) > 0 ? async () => {
                                const r = await fetch(`/api/payment/sessions/${s._id}`);
                                const doc: CourtSessionDoc = await r.json();
                                setInvoiceModal({ images: doc.invoiceImages ?? [], idx: 0, date: s.sessionDate });
                              } : undefined}
                            >
                              {(s.invoiceCount ?? 0) > 0
                                ? <span style={{ fontSize: 16 }}>🧾{(s.invoiceCount ?? 0) > 1 ? ` ×${s.invoiceCount}` : ''}</span>
                                : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                            </td>
                          ))
                        )}
                        {showGrandTotal && <td style={{ ...cellStyle }} />}
                        {summaryMode === 'monthly' && <td style={{ ...cellStyle }} />}
                        {summaryMode === 'monthly' && <td style={{ ...cellStyle, borderRight: 'none' }} />}
                      </tr>

                      {/* ── Actions row ── */}
                      <tr>
                        <td style={{ ...stickyNameStyle, fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>Actions</td>
                        {weeks.map(([, wSessions]) =>
                          wSessions.map((s: CourtSessionDoc) => (
                            <td key={`act-${s.sessionDate}`} style={{ ...cellStyle, textAlign: 'center', padding: '4px 4px' }}>
                              <button onClick={() => openEditSession(s)} title="Edit"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', fontSize: 14, lineHeight: 1, marginRight: 4 }}>✏️</button>
                              <button onClick={() => deleteSession(String(s._id))} title="Delete"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 14, lineHeight: 1 }}>🗑</button>
                            </td>
                          ))
                        )}
                        {showGrandTotal && <td style={{ ...cellStyle }} />}
                        {summaryMode === 'monthly' && <td style={{ ...cellStyle }} />}
                        {summaryMode === 'monthly' && <td style={{ ...cellStyle, borderRight: 'none' }} />}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  💡 Hover any amount to see the court + shuttle formula breakdown. 🔴 = highlighted session (⚠ badge shows note). 🧾 = invoice attached.
                </p>

                {/* ── Cell hover popover (fixed overlay) ── */}
                {popover && (() => {
                  const above = (popover.y - window.scrollY) > 220;
                  return (
                    <div className="cell-popover" style={{
                      left: Math.min(popover.x - 95, window.innerWidth + window.scrollX - 210),
                      top: above ? popover.y - 10 : popover.y + 36,
                      transform: above ? 'translateY(-100%)' : 'translateY(0)',
                    }}>
                      <div className="cell-popover-title">{popover.name} · {popover.date}</div>
                      <div className="cell-popover-row">
                        <span className="cell-popover-label">🏟 Court share</span>
                        <span className="cell-popover-val">{formatVND(popover.court)}</span>
                      </div>
                      <div className="cell-popover-row">
                        <span className="cell-popover-label">🪶 Shuttle share</span>
                        <span className="cell-popover-val">{formatVND(popover.shuttle)}</span>
                      </div>
                      <div className="cell-popover-divider" />
                      <div className="cell-popover-row cell-popover-total">
                        <span className="cell-popover-label">Total</span>
                        <span className="cell-popover-val">{formatVND(popover.total)}</span>
                      </div>
                      <div className="cell-popover-formula">
                        {/* Court formula */}
                        🏟 ({popover.courtRate.toFixed(2)} ÷ {popover.courtWeightSum.toFixed(2)}) × {formatVND(popover.courtFee)} = {formatVND(popover.court)}<br />
                        {/* Shuttle formula */}
                        🪶 ({popover.smashWeight.toFixed(2)} × {popover.shuttleRate.toFixed(2)} ÷ {popover.shuttleWeightSum.toFixed(2)}) × {formatVND(popover.shuttlePool)} = {formatVND(popover.shuttle)}
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Invoice image modal ── */}
      {invoiceModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setInvoiceModal(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>
                🧾 Invoice · {invoiceModal.date}
                {invoiceModal.images.length > 1 && <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 8 }}>{invoiceModal.idx + 1} / {invoiceModal.images.length}</span>}
              </span>
              <button onClick={() => setInvoiceModal(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 16, fontWeight: 700, marginLeft: 16 }}>✕</button>
            </div>
            <img src={invoiceModal.images[invoiceModal.idx]} alt="Invoice" style={{ display: 'block', maxWidth: '90vw', maxHeight: '80vh', borderRadius: 10, objectFit: 'contain' }} />
            {invoiceModal.images.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                <button
                  onClick={() => setInvoiceModal({ ...invoiceModal, idx: invoiceModal.idx - 1 })}
                  disabled={invoiceModal.idx === 0}
                  style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 18px', cursor: invoiceModal.idx === 0 ? 'default' : 'pointer', fontSize: 18, opacity: invoiceModal.idx === 0 ? 0.3 : 1 }}
                >‹</button>
                <button
                  onClick={() => setInvoiceModal({ ...invoiceModal, idx: invoiceModal.idx + 1 })}
                  disabled={invoiceModal.idx === invoiceModal.images.length - 1}
                  style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 18px', cursor: invoiceModal.idx === invoiceModal.images.length - 1 ? 'default' : 'pointer', fontSize: 18, opacity: invoiceModal.idx === invoiceModal.images.length - 1 ? 0.3 : 1 }}
                >›</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ EDIT SESSION MODAL ═══════════ */}
      {editingSession && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setEditingSession(null); }}>
          <div style={{
            background: 'var(--card)', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
            padding: '24px 20px 32px', boxShadow: '0 -8px 40px rgba(0,0,0,.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p style={{ fontWeight: 800, fontSize: 17 }}>✏️ Edit Session — {editingSession.sessionDate}</p>
              <button onClick={() => setEditingSession(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {!isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                <span>🔒</span>
                <span style={{ fontSize: 13, color: 'var(--danger)' }}>View only — admin login required to save changes.</span>
              </div>
            )}

            {/* Date + Note */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>📅 Date</label>
                <input type="date" className="input" style={{ width: '100%' }} value={editDate} onChange={({ target }: { target: HTMLInputElement }) => setEditDate(target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>📝 Note</label>
                <input type="text" className="input" style={{ width: '100%' }} value={editNote} onChange={({ target }: { target: HTMLInputElement }) => setEditNote(target.value)} />
              </div>
            </div>

            {/* Cost fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>🏟 Court Fee (₫)</label>
                <input type="number" min={0} className="input" style={{ width: '100%' }} value={editCourtFee} onChange={({ target }: { target: HTMLInputElement }) => setEditCourtFee(target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>🏸 Shuttlecocks</label>
                <input type="number" min={0} className="input" style={{ width: '100%' }} value={editNumShut} onChange={({ target }: { target: HTMLInputElement }) => setEditNumShut(target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>💲 Price/shuttlecock (₫)</label>
                <input type="number" min={0} className="input" style={{ width: '100%' }} value={editUnitPrice} onChange={({ target }: { target: HTMLInputElement }) => setEditUnitPrice(target.value)} />
              </div>
            </div>

            {/* Bulk purchase toggle */}
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={editBulkPurchase}
                  onChange={({ target }: { target: HTMLInputElement }) => setEditBulkPurchase(target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                🧺 Bulk / tube purchase
              </label>
              <p style={{ fontSize: 12, color: 'var(--text3)', margin: '6px 0 0 28px', lineHeight: 1.5 }}>
                {editBulkPurchase
                  ? 'Shuttlecock cost will be split monthly by attendance, not per-session.'
                  : 'Shuttlecock cost is split among players in this session only.'}
              </p>
            </div>

            {/* Highlight toggle */}
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={editHighlight}
                  onChange={({ target }: { target: HTMLInputElement }) => setEditHighlight(target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                ⭐ Mark as highlight session
              </label>
              {editHighlight && (
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%', marginTop: 10 }}
                  placeholder="What's notable about this session? (optional)"
                  value={editHighlightNote}
                  onChange={({ target }: { target: HTMLInputElement }) => setEditHighlightNote(target.value)}
                />
              )}
            </div>

            {/* Player selection */}
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
              👥 Players ({Object.values(editSelected).filter(Boolean).length} selected)
            </label>
            {/* Current session players first */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              In this session
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {editingSession.players.map(p => {
                const on = editSelected[p.name] ?? true;
                return (
                  <button
                    key={p.name}
                    onClick={() => setEditSelected((prev: Record<string, boolean>) => ({ ...prev, [p.name]: !prev[p.name] }))}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: `2px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                      background: on ? 'rgba(57,255,20,.12)' : 'var(--bg3)',
                      color: on ? 'var(--accent)' : 'var(--text3)',
                    }}
                  >{on ? '✓ ' : ''}{p.name}</button>
                );
              })}
            </div>
            {/* Other DB players not in session */}
            {(() => {
              const inSession = new Set(editingSession.players.map(p => p.name));
              const others = allDbPlayers.filter((n: string) => !inSession.has(n));
              if (others.length === 0) return null;
              return (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    Other players
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {others.map((name: string) => {
                      const on = editSelected[name] ?? false;
                      return (
                        <button
                          key={name}
                          onClick={() => setEditSelected((prev: Record<string, boolean>) => ({ ...prev, [name]: !prev[name] }))}
                          style={{
                            padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            border: `2px solid ${on ? 'var(--accent2)' : 'var(--border)'}`,
                            background: on ? 'rgba(168,85,247,.12)' : 'var(--bg3)',
                            color: on ? 'var(--accent2)' : 'var(--text3)',
                          }}
                        >{on ? '✓ ' : ''}{name}</button>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* Invoice upload */}
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                🧾 Invoice Images {editInvoices.length > 0 && <span style={{ fontWeight: 400, color: 'var(--text3)' }}>({editInvoices.length})</span>}
              </label>
              {editInvoices.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {editInvoices.map((src: string, i: number) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={src} alt={`Invoice ${i + 1}`} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', display: 'block', cursor: 'pointer', border: '1px solid var(--border)' }}
                        onClick={() => setInvoiceModal({ images: editInvoices, idx: i, date: editingSession.sessionDate })}
                      />
                      <button
                        onClick={() => {
                          const next = editInvoices.filter((_: string, j: number) => j !== i);
                          setEditInvoices(next);
                          saveInvoice(String(editingSession._id), next);
                        }}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', fontSize: 11, lineHeight: '16px' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="invoice-upload-zone" style={{ display: 'block' }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e: { target: HTMLInputElement }) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    let loaded = 0;
                    const newUrls: string[] = [];
                    files.forEach((file, fi) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        newUrls[fi] = ev.target?.result as string;
                        loaded++;
                        if (loaded === files.length) {
                          const next = [...editInvoices, ...newUrls];
                          setEditInvoices(next);
                          saveInvoice(String(editingSession._id), next);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                />
                <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>📷</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {uploadingInvoice ? '⏳ Uploading…' : 'Click to add invoice image(s)'}
                </span>
              </label>
            </div>

            {editResult && (
              <p style={{ fontSize: 13, fontWeight: 700, color: editResult.startsWith('✅') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>
                {editResult}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Btn variant="primary" size="lg" full disabled={!isAdmin || editSaving} onClick={saveEditSession}>
                  {!isAdmin ? '🔒 Admin only' : editSaving ? '⏳ Saving…' : '💾 Save Changes'}
                </Btn>
              </div>
              <Btn variant="ghost" size="lg" onClick={() => setEditingSession(null)}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ DRAFTS TAB ═══════════════ */}
      {tab === 'drafts' && (
        <DraftSessionsTab />
      )}

      {/* ═══════════════ IMPORT TAB ═══════════════ */}
      {tab === 'import' && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>📥 Import Sessions</CardTitle>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>
              Paste <strong>CSV</strong> or <strong>JSON</strong> data below. Each row = one court session.
            </p>

            {/* Format hint */}
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text3)', lineHeight: 1.8, fontFamily: 'monospace' }}>
              <strong style={{ color: 'var(--text2)', fontFamily: 'inherit' }}>CSV format:</strong><br />
              date,players,court_fee,num_shuttlecocks,shuttlecock_unit_price,note<br />
              2026-03-15,"Alice,Bob,Charlie",300000,3,15000,Saturday session<br />
              <br />
              <strong style={{ color: 'var(--text2)', fontFamily: 'inherit' }}>JSON format:</strong><br />
              {`[{"date":"2026-03-15","players":["Alice","Bob"],"courtFee":300000,"numShuttlecocks":3,"shuttlecockUnitPrice":15000}]`}
            </div>

            <textarea
              className="input"
              style={{ width: '100%', minHeight: 140, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              placeholder="Paste CSV or JSON here…"
              value={importText}
              onChange={e => handleImportTextChange(e.target.value)}
            />

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {parseErrors.map(e => (
                  <div key={e.row} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--danger)', marginBottom: 4 }}>
                    ⚠️ {e.message}
                  </div>
                ))}
              </div>
            )}

            {/* Import result message */}
            {importResult && (
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: importResult.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>
                {importResult}
              </div>
            )}
          </Card>

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <CardTitle>👁 Preview ({parsedRows.length} session{parsedRows.length !== 1 ? 's' : ''})</CardTitle>
              <div style={{ overflowX: 'auto' }}>
                <table className="rank-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Players</th>
                      <th className="num">Court Fee</th>
                      <th className="num">Shuttlecocks</th>
                      <th className="num">Unit Price</th>
                      <th className="num">Total</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => {
                      const shuttleTotal = row.numShuttlecocks * row.shuttlecockUnitPrice;
                      const total        = row.courtFee + shuttleTotal;
                      const hasUnknown   = row.players.some(p => !knownPlayers.includes(p.toLowerCase()));
                      return (
                        <tr key={i} style={hasUnknown ? { background: 'rgba(245,158,11,.07)' } : undefined}>
                          <td style={{ fontWeight: 600 }}>{row.date}</td>
                          <td>
                            {row.players.map(p => (
                              <span key={p} style={{
                                display: 'inline-block', margin: '1px 3px', padding: '1px 6px',
                                borderRadius: 4, fontSize: 11, fontWeight: 600,
                                background: knownPlayers.includes(p.toLowerCase()) ? 'rgba(57,255,20,.1)' : 'rgba(245,158,11,.2)',
                                color: knownPlayers.includes(p.toLowerCase()) ? 'var(--accent)' : 'var(--warn)',
                              }}>
                                {p}
                              </span>
                            ))}
                          </td>
                          <td className="num">{formatVND(row.courtFee)}</td>
                          <td className="num">{row.numShuttlecocks}</td>
                          <td className="num">{formatVND(row.shuttlecockUnitPrice)}</td>
                          <td className="num" style={{ fontWeight: 700, color: 'var(--accent2)' }}>{formatVND(total)}</td>
                          <td style={{ fontSize: 12, color: 'var(--text3)' }}>{row.note ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parsedRows.some(row => row.players.some(p => !knownPlayers.includes(p.toLowerCase()))) && (
                <p style={{ fontSize: 12, color: 'var(--warn)', marginTop: 8 }}>
                  ⚠️ Orange names are not in the player roster — they will still be imported with default smash weight 1.0.
                </p>
              )}

              <div style={{ marginTop: 14 }}>
                <Btn variant="primary" disabled={!isAdmin || importing} onClick={confirmImport}>
                  {!isAdmin ? '🔒 Admin only' : importing ? '⏳ Importing…' : `✅ Confirm Import (${parsedRows.length} session${parsedRows.length !== 1 ? 's' : ''})`}
                </Btn>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════ WEIGHTS TAB ═══════════════ */}
      {tab === 'weights' && (() => {
        // ── Live formula computation ──────────────────────────────
        const pvCourt  = Math.max(0, parseFloat(previewCourt)   || 0);
        const pvShuts  = Math.max(0, parseFloat(previewNumShut) || 0);
        const pvUnit   = Math.max(0, parseFloat(previewUnit)    || 0);
        const pvShutTotal = pvShuts * pvUnit;
        const pvTotal     = pvCourt + pvShutTotal;

        // Build per-player preview using current (unsaved) edit values
        interface PlayerPreview {
          name: string; group: 'pro' | 'beg';
          smash: number; cRate: number; sRate: number;
          savedSmash: number; savedCRate: number; savedSRate: number;
          courtAmt: number; shuttleAmt: number; total: number;
          savedTotal: number; changed: boolean;
        }

        const previews: PlayerPreview[] = allPlrs.map((p: PlayerDoc) => {
          const cfg       = configs.find((c: PaymentConfigDoc) => c.playerName.toLowerCase() === p.name.toLowerCase());
          const smash     = Math.max(0.01, parseFloat(editWeights[p.name]    ?? String(cfg?.smashWeight  ?? 1.0)) || 1);
          const cRate     = Math.max(0,    parseFloat(editCourtRates[p.name] ?? String(cfg?.courtRate    ?? 1.0)) || 0);
          const sRate     = Math.max(0,    parseFloat(editShutRates[p.name]  ?? String(cfg?.shuttleRate  ?? 1.0)) || 0);
          const savedSmash = cfg?.smashWeight  ?? 1.0;
          const savedCRate = cfg?.courtRate    ?? 1.0;
          const savedSRate = cfg?.shuttleRate  ?? 1.0;
          return { name: p.name, group: p.group, smash, cRate, sRate, savedSmash, savedCRate, savedSRate,
            courtAmt: 0, shuttleAmt: 0, total: 0, savedTotal: 0, changed: false };
        });

        // Court pool: split by courtRate weight
        const courtWeightSum   = previews.reduce((s, p) => s + p.cRate, 0) || 1;
        // Shuttle pool: split by smash × shuttleRate
        const shuttleWeightSum = previews.reduce((s, p) => s + p.smash * p.sRate, 0) || 1;
        // Saved totals use saved values
        const savedCourtWSum   = previews.reduce((s, p) => s + p.savedCRate, 0) || 1;
        const savedShutWSum    = previews.reduce((s, p) => s + p.savedSmash * p.savedSRate, 0) || 1;

        previews.forEach(p => {
          p.courtAmt   = pvCourt    * (p.cRate          / courtWeightSum);
          p.shuttleAmt = pvShutTotal * (p.smash * p.sRate / shuttleWeightSum);
          p.total      = p.courtAmt + p.shuttleAmt;
          const savedCourt   = pvCourt    * (p.savedCRate / savedCourtWSum);
          const savedShuttle = pvShutTotal * (p.savedSmash * p.savedSRate / savedShutWSum);
          p.savedTotal = savedCourt + savedShuttle;
          p.changed    = Math.abs(p.total - p.savedTotal) > 0.5;
        });

        return (
          <div>
            {/* ── Apply-all banner ── */}
            <div style={{
              background: 'rgba(57,255,20,.07)', border: '1px solid rgba(57,255,20,.25)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Apply rates to all sessions</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                  After finalising weights below, click this to recalculate every session in the Summary tab using the latest saved rates.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Btn variant="success" disabled={applyingAll || !isAdmin} onClick={applyAllWeights}>
                  {applyingAll ? '⏳ Recalculating…' : '🔄 Apply to all sessions'}
                </Btn>
                {applyResult && (
                  <span style={{ fontSize: 12, color: 'var(--success)' }}>{applyResult}</span>
                )}
              </div>
            </div>

            {/* ── Header + sample session inputs ── */}
            <Card style={{ marginBottom: 16 }}>
              <CardTitle>⚖️ Payment Rate Settings</CardTitle>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
                Three multipliers per player. Changes preview instantly below — hit <strong>Save</strong> to persist, then <strong>Apply to all sessions</strong> above to recalculate the Summary.
              </p>
              {/* Sample session config */}
              <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--text3)', marginBottom: 8 }}>
                  🧮 Preview session (adjust to match a typical day)
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Court fee (₫)</label>
                    <input type="number" min={0} className="input" style={{ width: 120 }}
                      value={previewCourt}
                      onChange={({ target }: { target: HTMLInputElement }) => setPreviewCourt(target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Shuttlecocks</label>
                    <input type="number" min={0} className="input" style={{ width: 90 }}
                      value={previewNumShut}
                      onChange={({ target }: { target: HTMLInputElement }) => setPreviewNumShut(target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 3 }}>Price / shuttle (₫)</label>
                    <input type="number" min={0} className="input" style={{ width: 110 }}
                      value={previewUnit}
                      onChange={({ target }: { target: HTMLInputElement }) => setPreviewUnit(target.value)} />
                  </div>
                  {pvTotal > 0 && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: 'var(--text3)' }}>Total session cost</p>
                      <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>{formatVND(pvTotal)}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>


            {/* ── Per-player rate cards ── */}
            <Card>
              {wLoading ? (
                <EmptyState icon="⏳" text="Loading players…" />
              ) : allPlrs.length === 0 ? (
                <EmptyState icon="👥" text="No players in roster yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allPlrs.map((p: PlayerDoc) => {
                    const cfg        = configs.find((c: PaymentConfigDoc) => c.playerName.toLowerCase() === p.name.toLowerCase());
                    const curSmash   = editWeights[p.name]    ?? String(cfg?.smashWeight  ?? 1.0);
                    const curCourt   = editCourtRates[p.name] ?? String(cfg?.courtRate    ?? 1.0);
                    const curShuttle = editShutRates[p.name]  ?? String(cfg?.shuttleRate  ?? 1.0);
                    const saving     = savingWeight === p.name;
                    const pv         = previews.find(x => x.name === p.name);

                    return (
                      <div key={p.name} style={{ background: 'var(--bg3)', borderRadius: 12, padding: '12px 14px' }}>
                        {/* Name + total preview + save */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <Badge group={p.group} />
                          <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{p.name}</span>
                          {pv && pvTotal > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 800, color: pv.changed ? 'var(--warn)' : 'var(--accent)' }}>
                              {formatVND(Math.round(pv.total / 1000) * 1000)}
                            </span>
                          )}
                          <Btn variant="secondary" size="sm" disabled={saving || !isAdmin} onClick={() => saveWeight(p.name)}>
                            {saving ? '⏳' : isAdmin ? '💾 Save' : '🔒'}
                          </Btn>
                        </div>

                        {/* Three rate controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>

                          {/* Smash weight */}
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
                              🏸 Smash weight
                              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, marginLeft: 4, textTransform: 'none' }}>shuttle share multiplier</span>
                            </label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                              {[0.8, 1.0, 1.2, 1.5, 2.0].map(w => (
                                <button key={w}
                                  onClick={() => setEditWeights((prev: Record<string, string>) => ({ ...prev, [p.name]: String(w) }))}
                                  style={{
                                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    background: parseFloat(curSmash) === w ? 'var(--accent)' : 'var(--bg4)',
                                    color:      parseFloat(curSmash) === w ? '#0a0e1a' : 'var(--text2)',
                                  }}>{w}×</button>
                              ))}
                            </div>
                            <input type="number" min={0.1} step={0.1} className="input" style={{ width: '100%' }}
                              value={curSmash}
                              onChange={({ target }: { target: HTMLInputElement }) => setEditWeights((prev: Record<string, string>) => ({ ...prev, [p.name]: target.value }))}
                            />
                            {cfg && parseFloat(curSmash) !== cfg.smashWeight && (
                              <span style={{ fontSize: 11, color: 'var(--warn)' }}>saved: {cfg.smashWeight}×</span>
                            )}
                          </div>

                          {/* Court rate */}
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
                              🏟 Court rate
                              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, marginLeft: 4, textTransform: 'none' }}>% of court share</span>
                            </label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                              {[0.5, 0.7, 0.8, 1.0].map(w => (
                                <button key={w}
                                  onClick={() => setEditCourtRates((prev: Record<string, string>) => ({ ...prev, [p.name]: String(w) }))}
                                  style={{
                                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    background: parseFloat(curCourt) === w ? 'var(--accent2)' : 'var(--bg4)',
                                    color:      parseFloat(curCourt) === w ? '#0a0e1a' : 'var(--text2)',
                                  }}>{Math.round(w * 100)}%</button>
                              ))}
                            </div>
                            <input type="number" min={0} max={2} step={0.05} className="input" style={{ width: '100%' }}
                              value={curCourt}
                              onChange={({ target }: { target: HTMLInputElement }) => setEditCourtRates((prev: Record<string, string>) => ({ ...prev, [p.name]: target.value }))}
                            />
                            {cfg && parseFloat(curCourt) !== (cfg.courtRate ?? 1) && (
                              <span style={{ fontSize: 11, color: 'var(--warn)' }}>saved: {Math.round((cfg.courtRate ?? 1) * 100)}%</span>
                            )}
                          </div>

                          {/* Shuttle rate */}
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 6 }}>
                              🪶 Shuttle rate
                              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, marginLeft: 4, textTransform: 'none' }}>% of shuttle share</span>
                            </label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                              {[0.5, 0.7, 0.8, 1.0].map(w => (
                                <button key={w}
                                  onClick={() => setEditShutRates((prev: Record<string, string>) => ({ ...prev, [p.name]: String(w) }))}
                                  style={{
                                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    background: parseFloat(curShuttle) === w ? 'var(--accent2)' : 'var(--bg4)',
                                    color:      parseFloat(curShuttle) === w ? '#0a0e1a' : 'var(--text2)',
                                  }}>{Math.round(w * 100)}%</button>
                              ))}
                            </div>
                            <input type="number" min={0} max={2} step={0.05} className="input" style={{ width: '100%' }}
                              value={curShuttle}
                              onChange={({ target }: { target: HTMLInputElement }) => setEditShutRates((prev: Record<string, string>) => ({ ...prev, [p.name]: target.value }))}
                            />
                            {cfg && parseFloat(curShuttle) !== (cfg.shuttleRate ?? 1) && (
                              <span style={{ fontSize: 11, color: 'var(--warn)' }}>saved: {Math.round((cfg.shuttleRate ?? 1) * 100)}%</span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   BET HISTORY SCREEN
════════════════════════════════════════════════════ */
function BetHistoryScreen({ onBack }: { onBack: () => void }) {
  const [bets, setBets] = useState<BetDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bets')
      .then(r => r.json())
      .then((data: BetDoc[]) => { setBets(data); setLoading(false); });

    fetch('/api/bets/leaderboard')
      .then(r => r.json())
      .then(data => { setLeaderboard(data); setLeaderboardLoading(false); })
      .catch(() => setLeaderboardLoading(false));
  }, []);

  const open   = bets.filter((b: BetDoc) => !b.outcome);
  const won    = bets.filter((b: BetDoc) => b.outcome === 'won');
  const lost   = bets.filter((b: BetDoc) => b.outcome === 'lost');

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">🎲 Bet History</p>
      <p className="page-sub">All bets placed across every match.</p>

      {loading ? (
        <EmptyState icon="⏳" text="Loading bets…" />
      ) : bets.length === 0 ? (
        <EmptyState icon="🎲" text="No bets placed yet." />
      ) : (
        <>
          {/* Summary */}
          <div className="two-col" style={{ marginBottom: 20 }}>
            <Card>
              <CardTitle>📊 Summary</CardTitle>
              {[
                ['Total Bets', bets.length, undefined],
                ['⏳ Open',    open.length,  'var(--text2)'],
                ['🏆 Won',     won.length,   'var(--success)'],
                ['💸 Lost',    lost.length,  'var(--danger)'],
              ].map(([label, val, color]) => (
                <div className="summary-row" key={String(label)}>
                  <span className="summary-label">{label}</span>
                  <span className="summary-value" style={color ? { color: color as string } : {}}>{String(val)}</span>
                </div>
              ))}
            </Card>

            <Card>
              <CardTitle>📈 Bettor Leaderboard</CardTitle>
              {leaderboardLoading ? (
                <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>⏳ Loading leaderboard…</div>
              ) : leaderboard.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>No settled bets yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                  {leaderboard.map((item, idx) => (
                    <div key={item.bettor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: idx === 0 ? '#f59e0b' : idx === 1 ? 'var(--text2)' : 'var(--text3)' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 600 }}>{item.bettor}</span>
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 12 }}>
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{item.wins}W</span>
                        {' - '}
                        <span style={{ color: 'var(--danger)' }}>{item.losses}L</span>
                        {' · '}
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.winRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Full list */}
          <Card>
            <CardTitle>🎲 All Bets</CardTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bets.map((b: BetDoc) => (
                <div key={String(b._id)} style={{
                  background: b.outcome === 'won' ? 'rgba(57,255,20,.07)' : b.outcome === 'lost' ? 'rgba(239,68,68,.07)' : 'var(--bg3)',
                  border: `1px solid ${b.outcome === 'won' ? 'var(--success)' : b.outcome === 'lost' ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{b.bettor}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      <span style={{ color: 'var(--text3)' }}>{b.roundLabel} · </span>
                      {b.matchLabel}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 3 }}>
                      Bet on: <span style={{ fontWeight: 600, color: 'var(--accent2)' }}>{b.pick}</span>
                      {b.note && <span style={{ color: 'var(--text3)', marginLeft: 8 }}>· {b.note}</span>}
                    </div>
                    {b.outcome && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                        Actual winner: <span style={{ fontWeight: 600 }}>{b.actualWinner}</span>
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                    color: b.outcome === 'won' ? 'var(--success)' : b.outcome === 'lost' ? 'var(--danger)' : 'var(--text3)',
                  }}>
                    {b.outcome === 'won' ? '🏆 Won' : b.outcome === 'lost' ? '💸 Lost' : '⏳ Open'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ATTENDANCE SCREEN — Session Polls & RSVPs
   Sprint 2: S2H.1 — Polling System Foundation
════════════════════════════════════════════════════ */
function AttendanceScreen({ onBack }: { onBack: () => void }) {
  const [polls, setPolls] = useState<(SessionPollDoc & {
    yesCount: number;
    maybeCount: number;
    noCount: number;
    guestCount: number;
    responseCount: number;
  })[]>([]);
  const [venues, setVenues] = useState<VenueDoc[]>([]);
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [responses, setResponses] = useState<PollResponseDoc[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    sessionDate: '',
    sessionTime: '',
    venueId: '',
    pollTitle: '',
    pollDescription: '',
    rsvpDeadline: '',
    maxPlayers: '',
    targetPlayers: 'all_active' as 'all_active' | 'pro_only' | 'beg_only' | 'custom',
    status: 'draft' as 'draft' | 'open',
    autoCreateTournament: false,
    autoCreatePayment: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Fetch data
  const fetchPolls = useCallback(async () => {
    const res = await fetch('/api/polls?upcoming=true');
    const data = await res.json();
    setPolls(data.polls || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/polls?upcoming=true').then(r => r.json()),
      fetch('/api/venues').then(r => r.json()),
      fetch('/api/players').then(r => r.json()),
    ]).then(([pollsData, venuesData, playersData]) => {
      setPolls(pollsData.polls || []);
      setVenues(venuesData.venues || []);
      setPlayers(playersData.players || []);
      setLoading(false);
    });
  }, []);

  // Fetch responses for selected poll
  useEffect(() => {
    if (!selectedPoll) {
      setResponses([]);
      return;
    }

    setResponsesLoading(true);
    fetch(`/api/polls/${selectedPoll}/responses`)
      .then(r => r.json())
      .then(data => {
        setResponses(data.responses || []);
        setResponsesLoading(false);
      })
      .catch(() => setResponsesLoading(false));
  }, [selectedPoll]);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const venue = venues.find(v => String(v._id) === formData.venueId);

      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          venueName: venue?.name,
          maxPlayers: formData.maxPlayers ? Number(formData.maxPlayers) : undefined,
          rsvpDeadline: new Date(formData.rsvpDeadline).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      setShowCreateModal(false);
      setFormData({
        sessionDate: '',
        sessionTime: '',
        venueId: '',
        pollTitle: '',
        pollDescription: '',
        rsvpDeadline: '',
        maxPlayers: '',
        targetPlayers: 'all_active',
        status: 'draft',
        autoCreateTournament: false,
        autoCreatePayment: false,
      });
      await fetchPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  const handlePublishPoll = async (pollId: string) => {
    if (!confirm('Publish this poll? Players will be able to RSVP.')) return;

    await fetch(`/api/polls/${pollId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    await fetchPolls();
  };

  const handleClosePoll = async (pollId: string) => {
    if (!confirm('Close this poll? No more RSVPs will be accepted. Automation will run if enabled.')) return;

    const res = await fetch(`/api/polls/${pollId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (res.ok) {
      let message = 'Poll closed successfully';
      if (data.tournamentCreated) {
        message += '\n✅ Tournament draft created';
      }
      if (data.paymentCreated) {
        message += '\n✅ Payment session draft created';
      }
      if (data.tournamentCreated || data.paymentCreated) {
        message += '\n\nCheck the admin dashboard to review and finalize.';
      }
      alert(message);
    }

    await fetchPolls();
  };

  const getPollUrl = (pollId: string) => {
    return `${window.location.origin}/poll/${pollId}`;
  };

  const copyPollUrl = (pollId: string) => {
    const url = getPollUrl(pollId);
    navigator.clipboard.writeText(url);
    alert('Poll URL copied to clipboard!');
  };

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">✋ Attendance Polling</p>
      <p className="page-sub">Create polls to track session attendance and reduce no-shows.</p>

      <div style={{ marginBottom: 20 }}>
        <Btn variant="primary" onClick={() => setShowCreateModal(true)}>
          ➕ Create New Poll
        </Btn>
      </div>

      {loading ? (
        <EmptyState icon="⏳" text="Loading polls…" />
      ) : polls.length === 0 ? (
        <EmptyState icon="✋" text="No upcoming polls. Create your first one!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {polls.map((poll) => {
            const courtSuggestion = calculateCourtSuggestion(
              poll.yesCount,
              poll.maybeCount,
              poll.noCount,
              poll.guestCount
            );

            const isSelected = selectedPoll === String(poll._id);

            return (
              <Card key={String(poll._id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{poll.pollTitle}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                      📅 {new Date(poll.sessionDate).toLocaleDateString()}
                      {poll.sessionTime && ` • ${poll.sessionTime}`}
                      {poll.venueName && ` • ${poll.venueName}`}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: poll.status === 'open' ? 'rgba(34,197,94,.15)' : poll.status === 'draft' ? 'rgba(156,163,175,.15)' : 'rgba(239,68,68,.15)',
                    color: poll.status === 'open' ? 'var(--success)' : poll.status === 'draft' ? 'var(--text3)' : 'var(--danger)',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {poll.status.toUpperCase()}
                  </span>
                </div>

                {/* Response summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: 'var(--bg3)', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{poll.yesCount + poll.guestCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Attending</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: 'var(--bg3)', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{poll.maybeCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Maybe</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: 'var(--bg3)', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>{poll.noCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>No</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: 'var(--bg3)', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{courtSuggestion.suggestedCourts}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Courts</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, fontStyle: 'italic' }}>
                  {courtSuggestion.reasoning}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {poll.status === 'draft' && (
                    <Btn variant="success" size="sm" onClick={() => handlePublishPoll(String(poll._id))}>
                      📢 Publish
                    </Btn>
                  )}
                  {poll.status === 'open' && (
                    <>
                      <Btn variant="secondary" size="sm" onClick={() => copyPollUrl(String(poll._id))}>
                        🔗 Copy Link
                      </Btn>
                      <Btn variant="secondary" size="sm" onClick={() => setSelectedPoll(isSelected ? null : String(poll._id))}>
                        {isSelected ? 'Hide' : 'View'} Responses
                      </Btn>
                      <Btn variant="orange" size="sm" onClick={() => handleClosePoll(String(poll._id))}>
                        🔒 Close Poll
                      </Btn>
                    </>
                  )}
                  {poll.status === 'closed' && (
                    <Btn variant="secondary" size="sm" onClick={() => setSelectedPoll(isSelected ? null : String(poll._id))}>
                      {isSelected ? 'Hide' : 'View'} Responses
                    </Btn>
                  )}
                </div>

                {/* Responses */}
                {isSelected && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    {responsesLoading ? (
                      <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading responses...</div>
                    ) : responses.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No responses yet</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {responses.map((resp) => (
                          <div key={String(resp._id)} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 13,
                          }}>
                            <div>
                              <strong>{resp.playerName}</strong>
                              {resp.guestCount && resp.guestCount > 0 && (
                                <span style={{ color: 'var(--text3)', marginLeft: 8 }}>+{resp.guestCount} guest{resp.guestCount > 1 ? 's' : ''}</span>
                              )}
                              {resp.note && (
                                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{resp.note}</div>
                              )}
                            </div>
                            <span style={{
                              padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                              background: resp.response === 'yes' ? 'rgba(34,197,94,.15)' : resp.response === 'maybe' ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)',
                              color: resp.response === 'yes' ? 'var(--success)' : resp.response === 'maybe' ? 'var(--accent)' : 'var(--danger)',
                            }}>
                              {resp.response.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(30,27,75,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r)',
            padding: 32, width: '100%', maxWidth: 600,
            boxShadow: '0 24px 80px rgba(124,58,237,.25)',
            border: '1px solid var(--border)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <CardTitle style={{ marginBottom: 20 }}>➕ Create Attendance Poll</CardTitle>

            <form onSubmit={handleCreatePoll}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Poll Title *</label>
                  <input
                    className="input"
                    value={formData.pollTitle}
                    onChange={(e) => setFormData({ ...formData, pollTitle: e.target.value })}
                    placeholder="e.g. Friday Night Badminton"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Session Date *</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Session Time</label>
                  <input
                    className="input"
                    value={formData.sessionTime}
                    onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                    placeholder="e.g. 18:00-20:00"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Venue</label>
                  <select
                    className="input"
                    value={formData.venueId}
                    onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                  >
                    <option value="">-- Select Venue --</option>
                    {venues.map((v) => (
                      <option key={String(v._id)} value={String(v._id)}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>RSVP Deadline *</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={formData.rsvpDeadline}
                    onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Description</label>
                  <textarea
                    className="input"
                    value={formData.pollDescription}
                    onChange={(e) => setFormData({ ...formData, pollDescription: e.target.value })}
                    placeholder="Optional details about the session"
                    rows={3}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Max Players (Optional)</label>
                  <input
                    className="input"
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                    placeholder="Leave empty for no limit"
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Target Players</label>
                  <select
                    className="input"
                    value={formData.targetPlayers}
                    onChange={(e) => setFormData({ ...formData, targetPlayers: e.target.value as any })}
                  >
                    <option value="all_active">All Active Players</option>
                    <option value="pro_only">Pro Players Only</option>
                    <option value="beg_only">Beginner Players Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Status</label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="draft">Draft (not visible to players)</option>
                    <option value="open">Open (players can RSVP)</option>
                  </select>
                </div>

                {/* Automation Settings */}
                <div style={{
                  padding: 16,
                  background: 'var(--bg3)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>
                    🤖 Automation Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={formData.autoCreateTournament}
                        onChange={(e) => setFormData({ ...formData, autoCreateTournament: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span>Auto-create tournament draft when poll closes</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={formData.autoCreatePayment}
                        onChange={(e) => setFormData({ ...formData, autoCreatePayment: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span>Auto-create payment session draft when poll closes</span>
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10, fontStyle: 'italic' }}>
                    ℹ️ Drafts will be created in the admin dashboard for review before finalizing
                  </div>
                </div>

                {error && (
                  <div style={{ padding: 12, background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <Btn variant="secondary" full onClick={() => setShowCreateModal(false)} disabled={creating}>
                    Cancel
                  </Btn>
                  <Btn variant="primary" full disabled={creating}>
                    {creating ? 'Creating...' : 'Create Poll'}
                  </Btn>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════════ */
export default function TournamentApp() {
  const [view,            setView]            = useState<AppView>('roster');
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [allPlayers,      setAllPlayers]      = useState<PlayerDoc[]>([]);
  const [profilePlayer,   setProfilePlayer]   = useState<string | null>(null);
  const [tourney,         setTourney]         = useState<TournamentState>(INITIAL_TOURNEY);
  const [showRoundBanner, setShowRoundBanner] = useState(false);
  const [confettiActive,  setConfettiActive]  = useState(false);
  const [appLoading,      setAppLoading]      = useState(true);   // true while restoring from DB
  const [userRole,        setUserRole]        = useState<'host' | 'player'>('host');

  // ── Top-level auth state (shared with sidebar + PaymentScreen) ──
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [authChecked,   setAuthChecked]   = useState(false);   // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showLogin,     setShowLogin]     = useState(false);
  const [loginUser,     setLoginUser]     = useState('');
  const [loginPass,     setLoginPass]     = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [showChangePw,  setShowChangePw]  = useState(false);
  const [cpCurrent,     setCpCurrent]     = useState('');
  const [cpNew,         setCpNew]         = useState('');
  const [cpConfirm,     setCpConfirm]     = useState('');
  const [cpError,       setCpError]       = useState('');
  const [cpSuccess,     setCpSuccess]     = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then((d: { authenticated: boolean }) => {
      setIsAdmin(d.authenticated);
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  // ── User Role persistence: load from localStorage on mount ──
  useEffect(() => {
    const savedRole = localStorage.getItem('smashtour_user_role');
    if (savedRole === 'host' || savedRole === 'player') {
      setUserRole(savedRole);
    }
  }, []);

  // ── User Role persistence: save to localStorage when changed ──
  useEffect(() => {
    localStorage.setItem('smashtour_user_role', userRole);
  }, [userRole]);

  // ── Redirect logic: if player switches to Player mode while on Host-only page ──
  useEffect(() => {
    if (userRole === 'player') {
      const hostOnlyPages: AppView[] = ['roster', 'payment', 'pricing'];
      if (hostOnlyPages.includes(view)) {
        setView('rankings');
      }
    }
  }, [userRole, view]);

  // ── Keyboard Navigation: Esc key closes Login modal ──
  useEffect(() => {
    if (!showLogin) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowLogin(false);
        setLoginError('');
        setLoginUser('');
        setLoginPass('');
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showLogin]);

  // ── Focus Management: Login modal ──
  useEffect(() => {
    if (!showLogin) return;

    // Store the trigger element (element that had focus before modal opened)
    const triggerElement = document.activeElement as HTMLElement;

    // Auto-focus the first input when modal opens
    setTimeout(() => {
      const firstInput = document.getElementById('login-username') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 50);

    // Focus trap handler
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      // Get the modal container first to scope focusable elements
      const modalContainer = document.querySelector('[role="dialog"][aria-labelledby="login-modal-title"]');
      if (!modalContainer) return;

      // Find all focusable elements within the modal only
      const focusableSelector = `
        a[href]:not([disabled]),
        button:not([disabled]),
        textarea:not([disabled]),
        input:not([disabled]):not([type="hidden"]),
        select:not([disabled]),
        [tabindex]:not([tabindex="-1"]):not([disabled])
      `.trim();

      const focusableElements = Array.from(
        modalContainer.querySelectorAll(focusableSelector)
      ).filter(el => {
        const htmlEl = el as HTMLElement;
        return htmlEl.offsetParent !== null; // checks if element is visible
      }) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element: go to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element: go to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus to the trigger element when modal closes
      if (triggerElement && triggerElement.focus) {
        setTimeout(() => triggerElement.focus(), 50);
      }
    };
  }, [showLogin]);

  // ── Keyboard Navigation: Esc key closes Change Password modal ──
  useEffect(() => {
    if (!showChangePw) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowChangePw(false);
        setCpCurrent('');
        setCpNew('');
        setCpConfirm('');
        setCpError('');
        setCpSuccess('');
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showChangePw]);

  // ── Focus Management: Change Password modal ──
  useEffect(() => {
    if (!showChangePw) return;

    // Store the trigger element (element that had focus before modal opened)
    const triggerElement = document.activeElement as HTMLElement;

    // Auto-focus the first input when modal opens
    setTimeout(() => {
      const firstInput = document.getElementById('cp-current') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 50);

    // Focus trap handler
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      // Get the modal container first to scope focusable elements
      const modalContainer = document.querySelector('[role="dialog"][aria-labelledby="change-password-title"]');
      if (!modalContainer) return;

      // Find all focusable elements within the modal only
      const focusableSelector = `
        a[href]:not([disabled]),
        button:not([disabled]),
        textarea:not([disabled]),
        input:not([disabled]):not([type="hidden"]),
        select:not([disabled]),
        [tabindex]:not([tabindex="-1"]):not([disabled])
      `.trim();

      const focusableElements = Array.from(
        modalContainer.querySelectorAll(focusableSelector)
      ).filter(el => {
        const htmlEl = el as HTMLElement;
        return htmlEl.offsetParent !== null; // checks if element is visible
      }) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element: go to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element: go to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus to the trigger element when modal closes
      if (triggerElement && triggerElement.focus) {
        setTimeout(() => triggerElement.focus(), 50);
      }
    };
  }, [showChangePw]);

  // ── Keyboard Navigation: Esc key closes Mobile menu ──
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileMenuOpen]);

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUser, password: loginPass }),
    });
    setLoginLoading(false);
    if (r.ok) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginUser('');
      setLoginPass('');
    } else {
      const d = await r.json();
      setLoginError(d.error ?? 'Login failed');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
  }

  async function handleChangePw() {
    setCpError('');
    setCpSuccess('');
    if (cpNew !== cpConfirm) { setCpError('New passwords do not match.'); return; }
    if (cpNew.length < 8) { setCpError('New password must be at least 8 characters.'); return; }
    const r = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
    });
    if (r.ok) {
      setCpSuccess('Password changed successfully!');
      setCpCurrent(''); setCpNew(''); setCpConfirm('');
    } else {
      const d = await r.json();
      setCpError(d.error ?? 'Failed to change password.');
    }
  }

  // Debounce timer ref for auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Persist current tournament state to DB ─────────────────
     Called after every mutation.  Debounced 400 ms so rapid score
     taps don't flood the network. */
  const persistTourney = useCallback((state: TournamentState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/tournament/active', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(state),
      });
    }, 400);
  }, []);

  /* ── Clear the active tournament from DB ─────────────────── */
  const clearActiveTourney = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    fetch('/api/tournament/active', { method: 'DELETE' });
  }, []);

  /* ── On mount: restore from DB ──────────────────────────────
     If a tournament was in progress it comes back exactly as left. */
  useEffect(() => {
    fetch('/api/tournament/active')
      .then(r => r.json())
      .then((doc: { state: TournamentState } | null) => {
        if (doc?.state && doc.state.rounds.length > 0 && !doc.state.champion) {
          setTourney(doc.state);
          setView('tournament');
        }
        setAppLoading(false);
      })
      .catch(() => setAppLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPlayers = useCallback(async () => {
    const r = await fetch('/api/players');
    setAllPlayers(await r.json());
  }, []);

  useEffect(() => {
    if (view === 'setup' || view === 'roster' || profilePlayer) {
      fetchPlayers();
    }
  }, [view, profilePlayer, fetchPlayers]);

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
    let newState: TournamentState;
    if (tourney.tourneyFormat === 'elimination') {
      const rounds = buildEliminationRounds(teams);
      newState = { ...tourney, teams, rounds, currentRoundIdx: 0, history: [], champion: null, rrStandings: {} };
    } else {
      const { rounds, rrStandings } = buildRoundRobin(teams);
      newState = { ...tourney, teams, rounds, rrStandings, currentRoundIdx: 0, history: [], champion: null };
    }
    setTourney(newState);
    persistTourney(newState);
    setView('tournament');
  }

  function handleScoreChange(matchId: string, team: 'A'|'B', delta: number) {
    setTourney((s: TournamentState) => {
      const next: TournamentState = {
        ...s,
        rounds: s.rounds.map((r: Round) => ({
          ...r,
          matches: r.matches.map((m: Match) => {
            if (m.id !== matchId || m.completed) return m;
            return team === 'A'
              ? { ...m, scoreA: Math.max(0, Math.min(30, m.scoreA + delta)) }
              : { ...m, scoreB: Math.max(0, Math.min(30, m.scoreB + delta)) };
          }),
        })),
      };
      persistTourney(next);
      return next;
    });
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

      // Settle bets for this match
      fetch('/api/bets/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winner: winner.name }),
      }).catch(() => {/* best-effort */});

      persistTourney(newState);
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
          clearActiveTourney();           // tournament done — remove from DB
          saveTournament(ns, winners[0]);
          setTimeout(() => setConfettiActive(false), 6500);
        }, 600);
      } else {
        setShowRoundBanner(true);
        setTimeout(() => {
          setTourney((s: TournamentState) => {
            const { rounds: newRounds, newIdx } = advanceElimination(s.rounds, s.currentRoundIdx);
            const next = { ...s, rounds: newRounds, currentRoundIdx: newIdx };
            persistTourney(next);
            return next;
          });
          setShowRoundBanner(false);
        }, 1800);
      }
    } else {
      // RR: check all rounds complete
      if (!ns.rounds.every((r: Round) => r.matches.every((m: Match) => m.completed))) {
        // check if an individual round just finished → show banner
        const idx = ns.rounds.findIndex((r: Round) => r.matches.some((m: Match) => !m.completed));
        if (idx > 0 && ns.rounds[idx - 1].matches.every((m: Match) => m.completed)) {
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
        clearActiveTourney();             // tournament done — remove from DB
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
    clearActiveTourney();
    setTourney(INITIAL_TOURNEY);
    setView('setup');
  }

  function cancelTournament() {
    if (!confirm('Cancel this tournament? All progress will be lost.')) return;
    resetMatchCounter();
    clearActiveTourney();
    setTourney(INITIAL_TOURNEY);
    setView('roster');
  }

  // Add a player to a tournament that has no completed matches yet.
  // Re-builds the bracket/RR with the new full player list.
  function addPlayerToTournament(p: PlayerDoc) {
    const player: Player = { name: p.name, group: p.group };
    setTourney((s: TournamentState) => {
      const alreadyIn = [...s.pros, ...s.beginners].some(x => x.name === p.name);
      if (alreadyIn) return s;
      const newPros  = p.group === 'pro'  ? [...s.pros,      player] : s.pros;
      const newBegs  = p.group === 'beg'  ? [...s.beginners, player] : s.beginners;
      const next = { ...s, pros: newPros, beginners: newBegs };
      resetMatchCounter();
      const teams = buildTeams(next);
      let rebuilt: TournamentState;
      if (s.tourneyFormat === 'elimination') {
        const rounds = buildEliminationRounds(teams);
        rebuilt = { ...next, teams, rounds, currentRoundIdx: 0 };
      } else {
        const { rounds, rrStandings } = buildRoundRobin(teams);
        rebuilt = { ...next, teams, rounds, rrStandings, currentRoundIdx: 0 };
      }
      persistTourney(rebuilt);
      return rebuilt;
    });
  }

  function handleReshuffle() {
    setTourney((s: TournamentState) => {
      const newRounds = reshuffleUnstartedMatches(s.rounds);
      const next = { ...s, rounds: newRounds };
      persistTourney(next);
      return next;
    });
  }

  function handleAddManualMatch(teamA: Team, teamB: Team, roundLabel: string) {
    setTourney((s: TournamentState) => {
      const match: Match = {
        id: getNextMatchId(),
        teamA, teamB,
        scoreA: 0, scoreB: 0,
        winner: null, bye: false, completed: false,
      };
      // Find an existing round with that name, or append a new one
      const existingIdx = s.rounds.findIndex(r => r.name === roundLabel);
      let newRounds: Round[];
      if (existingIdx >= 0) {
        newRounds = s.rounds.map((r, i) =>
          i === existingIdx ? { ...r, matches: [...r.matches, match] } : r
        );
      } else {
        newRounds = [...s.rounds, { name: roundLabel, matches: [match] }];
      }
      const next = { ...s, rounds: newRounds };
      persistTourney(next);
      return next;
    });
  }

  const headerBadge =
    view === 'roster'     ? 'Roster'     :
    view === 'history'    ? 'History'    :
    view === 'rankings'   ? 'Rankings'   :
    view === 'payment'    ? 'Payment'    :
    view === 'bets'       ? 'Bets'       :
    view === 'attendance' ? 'Attendance' :
    view === 'training'   ? 'Training'   :
    view === 'contact'    ? 'Join Club'  :
    view === 'champion'   ? 'Finished'   :
    view === 'setup'      ? 'Setup'      :
    (getCurrentRound(tourney)?.name ?? 'Finished');

  if (appLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg)' }}>
        <span style={{ fontSize: 48 }}>🏸</span>
        <p style={{ color: 'var(--primary)', fontSize: 15, fontWeight: 600 }}>Resuming session…</p>
      </div>
    );
  }

  // ── New grouped navigation structure ──
  type NavItem = { id: AppView; icon: string; label: string; hostOnly?: boolean };
  type NavGroup = { label: string; items: NavItem[] };

  const navigationGroups: NavGroup[] = [
    {
      label: 'PLAY',
      items: [
        { id: 'tournament', icon: '🏆', label: 'Tournament', hostOnly: true },
        { id: 'tournament', icon: '📊', label: 'Live Scoring' },  // Player sees this as "Live Scoring"
        { id: 'attendance', icon: '✋', label: 'Attendance' },
      ],
    },
    {
      label: 'CLUB',
      items: [
        { id: 'roster',    icon: '👥', label: 'Players', hostOnly: true },
        { id: 'rankings',  icon: '🏅', label: 'Rankings' },
        { id: 'history',   icon: '📜', label: 'History' },
        { id: 'contact',   icon: '✉️', label: 'Join Club' },
      ],
    },
    {
      label: 'MONEY',
      items: [
        { id: 'payment', icon: '💰', label: 'Payments', hostOnly: true },
        { id: 'pricing', icon: '💵', label: 'Pricing', hostOnly: true },
      ],
    },
    {
      label: 'TRAIN',
      items: [
        { id: 'training', icon: '🏸', label: 'Training' },
      ],
    },
  ];

  // ── Filter nav items based on user role ──
  const visibleGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (userRole === 'player' && item.hostOnly) return false;
      return true;
    }),
  })).filter(group => group.items.length > 0);

  const activeView = view === 'setup' || view === 'champion' ? 'tournament' : view;

  return (
    <>
      <Confetti active={confettiActive} />

      {/* ── Decorative background blobs ── */}
      <div className="blob-decoration blob-1" aria-hidden="true" />
      <div className="blob-decoration blob-2" aria-hidden="true" />
      <div className="blob-decoration blob-3" aria-hidden="true" />

      {/* ── Mobile Header Topbar ── */}
      <div className="mobile-topbar">
        <button
          className="btn btn-ghost"
          style={{ minHeight: 36, padding: '4px 10px', fontSize: 20, cursor: 'pointer' }}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', flexGrow: 1 }}>
          🏸 SmashTour
        </span>
        {isAdmin && <span className="badge badge-pro" style={{ fontSize: 9 }}>ADMIN</span>}
      </div>

      <div className="app-shell">
        {/* ════════ SIDEBAR ════════ */}
        <nav className={`sidebar${mobileMenuOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
          {/* Logo */}
          <a className="sidebar-logo" href="#" onClick={e => { e.preventDefault(); setView('rankings'); setMobileMenuOpen(false); }}>
            <span className="logo-icon">🏸</span>
            <div>
              <div className="logo-text">SmashTour</div>
              <div className="logo-sub">Badminton Club</div>
            </div>
          </a>

          {/* ── Role Toggle ── */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '0 12px 16px',
            borderBottom: '1px solid var(--line-strong)',
            marginBottom: '16px',
          }}>
            <button
              onClick={() => setUserRole('host')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: userRole === 'host' ? 'var(--volt)' : 'transparent',
                color: userRole === 'host' ? 'var(--ink)' : 'var(--muted-2)',
                border: userRole === 'host' ? 'none' : '1.5px solid var(--line-strong)',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Host
            </button>
            <button
              onClick={() => setUserRole('player')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: userRole === 'player' ? 'var(--volt)' : 'transparent',
                color: userRole === 'player' ? 'var(--ink)' : 'var(--muted-2)',
                border: userRole === 'player' ? 'none' : '1.5px solid var(--line-strong)',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Player
            </button>
          </div>

          <div className="sidebar-nav">
            {visibleGroups.map((group, groupIdx) => (
              <div key={group.label}>
                <p className="nav-section-label" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  color: 'var(--volt)',
                }}>
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <button
                    key={`${group.label}-${item.id}-${item.label}`}
                    id={`nav-${item.id}`}
                    className={`nav-link${activeView === item.id ? ' active' : ''}`}
                    onClick={() => {
                      setView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={activeView === item.id ? 'page' : undefined}
                    aria-label={`Navigate to ${item.label}`}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: activeView === item.id ? 'var(--paper)' : 'var(--muted-2)',
                      background: activeView === item.id ? '#2A2B23' : 'transparent',
                      borderRadius: 0,
                      boxShadow: activeView === item.id ? 'inset 5px 0 0 var(--volt)' : 'none',
                    }}
                  >
                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                {groupIdx < visibleGroups.length - 1 && (
                  <div className="nav-divider" style={{ margin: '12px 0' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Admin status / login ── */}
          <div className="sidebar-bottom">
            {isAdmin ? (
              <div>
                <div className="admin-status">
                  <div className="admin-avatar">AD</div>
                  <div>
                    <div className="admin-name">Admin</div>
                    <div className="admin-role">Full access</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => { setShowChangePw(true); setMobileMenuOpen(false); }}
                  >
                    🔑 Password
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  >
                    Exit
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-admin-login"
                className="btn btn-primary btn-full"
                onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
              >
                🔐 Admin Login
              </button>
            )}
          </div>
        </nav>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="main-content" role="main">
          {view === 'roster'     && <RosterScreen onDone={() => setView('setup')} onOpenProfile={setProfilePlayer} />}
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
              allPlayers={allPlayers}
              onScoreChange={handleScoreChange}
              onMarkWinner={handleMarkWinner}
              onReset={resetToSetup}
              onCancel={cancelTournament}
              onAddPlayer={addPlayerToTournament}
              onReshuffle={handleReshuffle}
              onAddManualMatch={handleAddManualMatch}
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
          {view === 'history'  && (
            <HistoryScreen onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')} />
          )}
          {view === 'bets'     && (
            <BetHistoryScreen onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')} />
          )}
          {view === 'rankings' && (
            <RankingsScreen
              onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')}
              onOpenProfile={setProfilePlayer}
            />
          )}
          {view === 'payment'  && (
            <PaymentScreen
              onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')}
              tournamentPlayers={[...tourney.pros, ...tourney.beginners].map(p => p.name)}
              onOpenProfile={setProfilePlayer}
            />
          )}
          {view === 'venues' && (
            <VenuesScreen onBack={() => setView('payment')} />
          )}
          {view === 'pricing' && (
            <PricingRulesScreen onBack={() => setView('payment')} />
          )}
          {view === 'attendance' && (
            <AttendanceScreen onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')} />
          )}
          {view === 'contact' && (
            <ContactScreen onBack={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')} />
          )}
          {view === 'training' && (
            <div className="anim-fade">
              <button className="back-btn" onClick={() => setView(tourney.rounds.length > 0 ? (tourney.champion ? 'champion' : 'tournament') : 'roster')}>← Back</button>
              <p className="page-title">🏸 3D Training Lab</p>
              <p className="page-sub">Learn professional techniques with interactive 3D demonstrations</p>
              <Card style={{ marginTop: 20 }}>
                <CardTitle>Opening Training Lab...</CardTitle>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                  The 3D Training Lab is loading in a new window with full-screen interactive experience.
                </p>
                <Btn variant="primary" onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open('/training', '_blank');
                  }
                }}>
                  🚀 Open Training Lab
                </Btn>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* ════════ LOGIN MODAL ════════ */}
      {showLogin && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(30,27,75,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowLogin(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r)',
            padding: '36px 32px', width: '100%', maxWidth: 420,
            boxShadow: '0 24px 80px rgba(124,58,237,.25)',
            border: '1px solid var(--border)', animation: 'fadeIn .25s ease',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }} aria-hidden="true">🔐</span>
              <h2 id="login-modal-title" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Admin Login</h2>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>Public pages are always accessible without login</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                id="login-username"
                className="input"
                placeholder="Username"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="username"
                aria-label="Username"
              />
              <input
                id="login-password"
                className="input"
                type="password"
                placeholder="Password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
                aria-label="Password"
              />
              {loginError && <div className="alert alert-danger">{loginError}</div>}
              <button
                id="btn-login-submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loginLoading}
                onClick={handleLogin}
                aria-label="Sign in to admin panel"
              >
                {loginLoading ? '⏳ Signing in…' : '🔐 Sign In'}
              </button>
              <button
                className="btn btn-ghost btn-sm btn-full"
                onClick={() => setShowLogin(false)}
                aria-label="Close login dialog"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ CHANGE PASSWORD MODAL ════════ */}
      {showChangePw && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(30,27,75,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)',
          }}
          role="dialog" aria-modal="true" aria-labelledby="change-password-title"
        >
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--r)',
            padding: '32px 28px', width: '100%', maxWidth: 380,
            boxShadow: '0 24px 80px rgba(124,58,237,.25)',
            border: '1px solid var(--border)',
          }}>
            <h3 id="change-password-title" style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--text)' }}>🔑 Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input id="cp-current" className="input" type="password" placeholder="Current password" value={cpCurrent} onChange={e => setCpCurrent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChangePw()} autoComplete="current-password" aria-label="Current password" />
              <input id="cp-new" className="input" type="password" placeholder="New password (min 8 chars)" value={cpNew} onChange={e => setCpNew(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChangePw()} autoComplete="new-password" aria-label="New password (minimum 8 characters)" />
              <input id="cp-confirm" className="input" type="password" placeholder="Confirm new password" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChangePw()} autoComplete="new-password" aria-label="Confirm new password" />
              {cpError   && <div className="alert alert-danger">{cpError}</div>}
              {cpSuccess && <div className="alert alert-success">{cpSuccess}</div>}
              <button className="btn btn-primary btn-full" onClick={handleChangePw}>💾 Update Password</button>
              <button className="btn btn-ghost btn-full" onClick={() => { setShowChangePw(false); setCpCurrent(''); setCpNew(''); setCpConfirm(''); setCpError(''); setCpSuccess(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {profilePlayer && (
        <PlayerProfileModal
          playerName={profilePlayer}
          onClose={() => setProfilePlayer(null)}
          allPlayers={allPlayers}
        />
      )}
    </>
  );
}

interface PlayerProfileData {
  playerName: string;
  totalOutstanding: number;
  breakdown: { period: string; owed: number; paid: number; remaining: number }[];
  sessions: { sessionDate: string; amountOwed: number; amountOwedRounded: number; note?: string }[];
}

function PlayerProfileModal({
  playerName,
  onClose,
  allPlayers,
}: {
  playerName: string;
  onClose: () => void;
  allPlayers: PlayerDoc[];
}) {
  const [activeTab, setActiveTab] = useState<'stats' | 'debt' | 'sessions'>('stats');
  const [debtData, setDebtData] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetch(`/api/payment/outstanding-debt?playerName=${encodeURIComponent(playerName)}`);
        if (r.ok && active) {
          setDebtData(await r.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [playerName]);

  const player = allPlayers.find(p => p.name.toLowerCase() === playerName.toLowerCase());
  const isPro = player?.group === 'pro';
  const groupClass = isPro ? 'pro' : 'beg';

  const stats = player?.stats || {
    tournamentsPlayed: 0,
    wins: 0,
    losses: 0,
    titles: 0,
    runnerUps: 0,
    pointsScored: 0,
    pointsConceded: 0,
  };
  const totalMatches = stats.wins + stats.losses;
  const winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 100) : 0;
  const ptDiff = stats.pointsScored - stats.pointsConceded;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(30,27,75,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, backdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`${playerName} Profile`}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--r)',
        width: '100%', maxWidth: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(124,58,237,.25)',
        border: '1px solid var(--border)', animation: 'fadeIn .25s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(243, 244, 246, 0.4) 100%)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className={`pc-avatar ${groupClass}`} style={{ width: 56, height: 56, fontSize: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {playerName.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {playerName}
                {player?.active === false && (
                  <span style={{ fontSize: 11, background: 'var(--border)', color: 'var(--text3)', padding: '2px 8px', borderRadius: 12 }}>
                    Archived
                  </span>
                )}
              </h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Badge group={player?.group ?? 'beg'} />
                <span className="badge" style={{ background: 'var(--card)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                  Score: {player?.rankScore ?? 0}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '0 16px'
        }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              color: activeTab === 'stats' ? 'var(--accent)' : 'var(--text3)',
              borderBottom: activeTab === 'stats' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            📊 Stats & Overview
          </button>
          <button
            onClick={() => setActiveTab('debt')}
            style={{
              padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              color: activeTab === 'debt' ? 'var(--accent)' : 'var(--text3)',
              borderBottom: activeTab === 'debt' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            💰 Financials
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            style={{
              padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              color: activeTab === 'sessions' ? 'var(--accent)' : 'var(--text3)',
              borderBottom: activeTab === 'sessions' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            🗓️ Session Logs
          </button>
        </div>

        {/* Tab content */}
        <div style={{ padding: 28, overflowY: 'auto', flex: 1, background: 'var(--bg-card)' }}>
          {activeTab === 'stats' && (
            <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🏆 Club Rank Score</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{player?.rankScore ?? 0}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Calculated dynamically from tournament success</span>
                </div>
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>⚡ Win Rate</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>{winRate}%</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.wins} wins · {stats.losses} losses · {totalMatches} matches</span>
                </div>
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>🎖️ Tournament Honors</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🏆 {stats.titles} <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 16 }}>/</span> 🥈 {stats.runnerUps}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.tournamentsPlayed} tournaments played</span>
                </div>
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>📈 Point Differential</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: ptDiff >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {ptDiff >= 0 ? `+${ptDiff}` : ptDiff}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.pointsScored} scored vs {stats.pointsConceded} conceded</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'debt' && (
            <div className="anim-fade">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>⏳ Loading financials...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{
                    background: (debtData?.totalOutstanding ?? 0) > 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid ' + ((debtData?.totalOutstanding ?? 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                    borderRadius: 'var(--r)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Outstanding Balance</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: (debtData?.totalOutstanding ?? 0) > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
                        {formatVND(debtData?.totalOutstanding ?? 0)}
                      </div>
                    </div>
                    <span style={{ fontSize: 36 }}>{(debtData?.totalOutstanding ?? 0) > 0 ? '💸' : '🎉'}</span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Monthly Breakdown</h3>
                    {!debtData?.breakdown || debtData.breakdown.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: 32, background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)', color: 'var(--text3)', fontSize: 13
                      }}>
                        No billing periods found for this player.
                      </div>
                    ) : (
                      <table className="table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Period</th>
                            <th className="num">Owed</th>
                            <th className="num">Paid</th>
                            <th className="num">Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtData.breakdown.map(b => (
                            <tr key={b.period}>
                              <td style={{ fontWeight: 600 }}>{b.period}</td>
                              <td className="num">{formatVND(b.owed)}</td>
                              <td className="num">{formatVND(b.paid)}</td>
                              <td className="num" style={{
                                fontWeight: 700,
                                color: b.remaining > 0 ? 'var(--danger)' : 'var(--success)'
                              }}>
                                {formatVND(b.remaining)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="anim-fade">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>⏳ Loading session logs...</div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Attended Sessions</h3>
                  {!debtData?.sessions || debtData.sessions.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: 32, background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)', color: 'var(--text3)', fontSize: 13
                    }}>
                      No sessions recorded.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
                      <table className="table" style={{ width: '100%', margin: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--card)' }}>
                          <tr>
                            <th>Date</th>
                            <th>Note</th>
                            <th className="num">Cost Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtData.sessions.map((s, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, fontSize: 13 }}>{s.sessionDate}</td>
                              <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.note}>
                                {s.note || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>—</span>}
                              </td>
                              <td className="num" style={{ fontWeight: 600, fontSize: 13 }}>{formatVND(s.amountOwedRounded || s.amountOwed)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border)',
          background: 'var(--card)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
