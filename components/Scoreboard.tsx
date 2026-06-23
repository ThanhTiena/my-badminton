/**
 * SCOREBOARD — Broadcast-style match scoring component
 *
 * Flagship Court feature: Giant tap zones for courtside score tracking.
 * Optimized for one-handed mobile use with 44px+ touch targets.
 *
 * Design: Ink background, volt highlights, tabular-nums for score display.
 */

import React from 'react';

/* ════════════════════════════════════════════════════
   BADMINTON SCORING HELPERS
════════════════════════════════════════════════════ */

/**
 * Determines if a score meets badminton win conditions:
 * - 21+ points with 2-point lead, OR
 * - 30 points (absolute cap)
 */
export function isWinner(score: number, opponentScore: number): boolean {
  if (score >= 30) return true;
  if (score >= 21 && score - opponentScore >= 2) return true;
  return false;
}

/**
 * Determines if a team is at game point:
 * - 20+ points with lead (could win on next point)
 */
export function isGamePoint(score: number, opponentScore: number): boolean {
  if (score >= 29) return true; // at 29, any point wins
  if (score >= 20 && score > opponentScore) return true;
  return false;
}

/* ════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════ */

interface Team {
  name: string;
  players?: string[];
}

interface ScoreboardProps {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  onScoreA: () => void;
  onScoreB: () => void;
  onDeclareWinner?: (side: 'A' | 'B') => void;
  gameType?: 'singles' | 'doubles';
  /** Optional metadata like round label */
  meta?: React.ReactNode;
}

/* ════════════════════════════════════════════════════
   SCOREBOARD COMPONENT
════════════════════════════════════════════════════ */

export default function Scoreboard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  onScoreA,
  onScoreB,
  onDeclareWinner,
  gameType = 'singles',
  meta,
}: ScoreboardProps) {
  const winnerA = isWinner(scoreA, scoreB);
  const winnerB = isWinner(scoreA, scoreB);
  const gamePtA = isGamePoint(scoreA, scoreB);
  const gamePtB = isGamePoint(scoreA, scoreB);
  const leadingA = scoreA > scoreB;
  const leadingB = scoreB > scoreA;

  const showDeclare = (winnerA || winnerB) && onDeclareWinner;
  const winnerSide: 'A' | 'B' | null = winnerA ? 'A' : winnerB ? 'B' : null;

  return (
    <div
      className="scoreboard-broadcast"
      style={{
        background: 'var(--ink)',
        borderRadius: 'var(--r)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Meta info (e.g., "LIVE · Quarter Finals") */}
      {meta && (
        <div
          style={{
            padding: '12px 16px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {meta}
        </div>
      )}

      {/* Main scoreboard: two tap zones */}
      <div
        style={{
          display: 'flex',
          minHeight: '240px',
          position: 'relative',
        }}
      >
        {/* TEAM A SIDE */}
        <button
          onClick={onScoreA}
          aria-label={`Add 1 point for ${teamA.name}. Current score: ${scoreA}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: leadingA ? 'rgba(203,241,74,0.08)' : 'transparent',
            border: 'none',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            padding: '24px 16px',
            transition: 'background 0.2s ease',
            minHeight: '240px',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(203,241,74,0.15)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = leadingA
              ? 'rgba(203,241,74,0.08)'
              : 'transparent';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = leadingA
              ? 'rgba(203,241,74,0.08)'
              : 'transparent';
          }}
        >
          {/* Game Point Pill */}
          {gamePtA && (
            <div
              style={{
                background: 'var(--volt)',
                color: 'var(--ink)',
                padding: '4px 12px',
                borderRadius: 'var(--r-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              GAME POINT
            </div>
          )}

          {/* Score */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '80px',
              fontWeight: 800,
              color: leadingA ? 'var(--volt)' : 'var(--paper)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '16px',
            }}
          >
            {scoreA}
          </div>

          {/* Team Name */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--paper)',
              textAlign: 'center',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {teamA.name}
          </div>

          {/* Players (doubles) */}
          {gameType === 'doubles' && teamA.players && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--muted-2)',
                textAlign: 'center',
                marginTop: '4px',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {teamA.players.join(' & ')}
            </div>
          )}
        </button>

        {/* VS Divider */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--ink)',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--muted-2)',
            letterSpacing: '1px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          VS
        </div>

        {/* TEAM B SIDE */}
        <button
          onClick={onScoreB}
          aria-label={`Add 1 point for ${teamB.name}. Current score: ${scoreB}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: leadingB ? 'rgba(203,241,74,0.08)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '24px 16px',
            transition: 'background 0.2s ease',
            minHeight: '240px',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(203,241,74,0.15)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = leadingB
              ? 'rgba(203,241,74,0.08)'
              : 'transparent';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = leadingB
              ? 'rgba(203,241,74,0.08)'
              : 'transparent';
          }}
        >
          {/* Game Point Pill */}
          {gamePtB && (
            <div
              style={{
                background: 'var(--volt)',
                color: 'var(--ink)',
                padding: '4px 12px',
                borderRadius: 'var(--r-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              GAME POINT
            </div>
          )}

          {/* Score */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '80px',
              fontWeight: 800,
              color: leadingB ? 'var(--volt)' : 'var(--paper)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '16px',
            }}
          >
            {scoreB}
          </div>

          {/* Team Name */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--paper)',
              textAlign: 'center',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {teamB.name}
          </div>

          {/* Players (doubles) */}
          {gameType === 'doubles' && teamB.players && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--muted-2)',
                textAlign: 'center',
                marginTop: '4px',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {teamB.players.join(' & ')}
            </div>
          )}
        </button>
      </div>

      {/* Declare Winner Button */}
      {showDeclare && winnerSide && (
        <button
          onClick={() => onDeclareWinner!(winnerSide)}
          aria-label={`Declare ${winnerSide === 'A' ? teamA.name : teamB.name} as winner`}
          style={{
            background: 'var(--volt)',
            color: 'var(--ink)',
            border: 'none',
            padding: '16px 24px',
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#D4F55E';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--volt)';
          }}
        >
          🏆 Declare {winnerSide === 'A' ? teamA.name : teamB.name} Winner
        </button>
      )}
    </div>
  );
}
