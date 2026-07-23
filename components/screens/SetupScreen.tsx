import React from 'react';
import type { PlayerDoc } from '@/lib/models';
import type { TournamentState, GameType, TourneyFormat } from '@/lib/tournament';
import { Btn, Card, CardTitle } from '@/components/ui';

interface SetupScreenProps {
  state: TournamentState;
  allPlayers: PlayerDoc[];
  onTogglePlayer: (p: PlayerDoc) => void;
  onSetGameType: (t: GameType) => void;
  onSetFormat: (f: TourneyFormat) => void;
  onStart: () => void;
  onBack: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  state,
  allPlayers,
  onTogglePlayer,
  onSetGameType,
  onSetFormat,
  onStart,
  onBack,
}) => {
  const pros = state.pros.length;
  const begs = state.beginners.length;
  const n = pros + begs;
  const isDoubles = state.gameType === 'doubles';
  const doublesTeams = Math.floor(n / 2);
  const enoughPlayers = isDoubles ? doublesTeams >= 2 : n >= 4;
  const units = isDoubles ? doublesTeams : n;
  const estRounds =
    state.tourneyFormat === 'elimination'
      ? Math.ceil(Math.log2(units || 1))
      : units > 1
      ? units - 1
      : 0;

  const selectedNames = new Set([...state.pros, ...state.beginners].map(p => p.name));
  const proPlayers = allPlayers.filter(p => p.group === 'pro');
  const begPlayers = allPlayers.filter(p => p.group === 'beg');

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack} aria-label="Go back to roster screen">
        ← Back to roster
      </button>
      <p className="page-title">⚙️ Set Up Tournament</p>
      <p className="page-sub">Pick who's playing today and choose your format.</p>

      {/* Draft Tournament Banner (will show if tournament has draftMode flag from poll automation) */}
      <div
        style={{
          padding: 16,
          background: 'linear-gradient(135deg, rgba(245,158,11,.15) 0%, rgba(245,158,11,.05) 100%)',
          border: '1px solid rgba(245,158,11,.3)',
          borderRadius: 12,
          marginBottom: 16,
          display: 'none', // Hidden by default, shown via inline style if draft
        }}
        className="draft-tournament-banner"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(245,158,11,.25)',
              color: 'var(--accent)',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            DRAFT TOURNAMENT
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
            🤖 Auto-created from poll
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
          This tournament was automatically created from confirmed poll responses. Review the player
          list, configure teams, and start when ready!
        </p>
      </div>

      <div className="two-col">
        {/* Player selection */}
        <Card>
          <CardTitle>
            👥 Select Players
            <span
              style={{
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
                color: 'var(--text2)',
                fontSize: 12,
              }}
            >
              {n} selected · <span className="text-pro">{pros} pro</span> ·{' '}
              <span className="text-beg">{begs} beg</span>
            </span>
          </CardTitle>

          {allPlayers.length === 0 && (
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>
              No players in roster yet.{' '}
              <button
                onClick={onBack}
                style={{
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Add some first.
              </button>
            </p>
          )}

          <div className="player-select-list">
            {proPlayers.length > 0 && (
              <>
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
                      <span className="select-item-stats">
                        🏆{p.stats.titles} {p.stats.wins}W
                      </span>
                    </button>
                  );
                })}
              </>
            )}
            {begPlayers.length > 0 && (
              <>
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
                      <span className="select-item-stats">
                        🏆{p.stats.titles} {p.stats.wins}W
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {allPlayers.length > 0 && (
            <div className="row" style={{ marginTop: 12 }}>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() =>
                  allPlayers.forEach(p => {
                    if (!selectedNames.has(p.name)) onTogglePlayer(p);
                  })
                }
                ariaLabel="Select all players for tournament"
              >
                Select All
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() =>
                  allPlayers.forEach(p => {
                    if (selectedNames.has(p.name)) onTogglePlayer(p);
                  })
                }
                ariaLabel="Deselect all players"
              >
                Clear All
              </Btn>
            </div>
          )}
        </Card>

        {/* Format + summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <CardTitle>🎮 Format</CardTitle>

            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Game type</p>
            <div
              className="pills"
              style={{ marginBottom: 18 }}
              role="radiogroup"
              aria-label="Select game type"
            >
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

            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
              Tournament format
            </p>
            <div className="pills" role="radiogroup" aria-label="Select tournament format">
              {(
                [
                  ['elimination', '🗡️ Single Elimination'],
                  ['roundrobin', '🔄 Round Robin'],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  className={`pill${state.tourneyFormat === v ? ' active' : ''}`}
                  onClick={() => onSetFormat(v)}
                  role="radio"
                  aria-checked={state.tourneyFormat === v}
                  aria-label={
                    v === 'elimination' ? 'Single Elimination format' : 'Round Robin format'
                  }
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
              ...(isDoubles ? ([['Teams', doublesTeams]] as const) : []),
              [
                'Format',
                state.tourneyFormat === 'elimination' ? 'Single Elimination' : 'Round Robin',
              ],
              ['Est. rounds', units >= 2 ? estRounds : '—'],
            ].map(([l, v], i) => (
              <div className="summary-row" key={i}>
                <span className="summary-label">{l}</span>
                <span className="summary-value">{v}</span>
              </div>
            ))}

            {n > 0 && n < 4 && (
              <div className="alert alert-warn">⚠️ Need at least 4 players to start</div>
            )}
            {isDoubles && n >= 4 && doublesTeams < 2 && (
              <div className="alert alert-warn">⚠️ Need at least 4 players for 2 doubles teams</div>
            )}

            <div style={{ marginTop: 16 }}>
              <Btn variant="primary" size="lg" full disabled={!enoughPlayers} onClick={onStart}>
                🚀 Start Tournament
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
