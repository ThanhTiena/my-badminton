import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PlayerDoc } from '@/lib/models';
import { Btn, Card, CardTitle, EmptyState } from '@/components/ui';

interface RosterScreenProps {
  onDone: () => void;
  onOpenProfile?: (name: string) => void;
}

export const RosterScreen: React.FC<RosterScreenProps> = ({ onDone, onOpenProfile }) => {
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [group, setGroup] = useState<'pro' | 'beg'>('pro');
  const nameRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetch$ = useCallback(async () => {
    const r = await fetch('/api/players');
    setPlayers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch$();
  }, [fetch$]);

  async function add() {
    const name = nameRef.current?.value.trim() ?? '';
    if (!name) return;
    setSaving(true);
    setErr('');
    const r = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, group }),
    });
    if (r.status === 409) {
      setErr('A player with that name already exists.');
      setSaving(false);
      return;
    }
    if (!r.ok) {
      setErr('Failed to add player.');
      setSaving(false);
      return;
    }
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: next }),
    });
    setPlayers(p => p.map(x => (String(x._id) === id ? { ...x, group: next } : x)));
  }

  async function rename(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    await fetch(`/api/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setPlayers(p => p.map(x => (String(x._id) === id ? { ...x, name: trimmed } : x)));
    setEditingId(null);
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
            aria-label="Player name"
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['pro', 'beg'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 8,
                  border: `1px solid ${
                    group === g ? (g === 'pro' ? 'var(--pro)' : 'var(--beg)') : 'var(--border)'
                  }`,
                  background: group === g
                    ? g === 'pro'
                      ? 'rgba(245,158,11,.15)'
                      : 'rgba(34,197,94,.15)'
                    : 'var(--bg3)',
                  color: group === g ? (g === 'pro' ? 'var(--pro)' : 'var(--beg)') : 'var(--text2)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
                role="radio"
                aria-checked={group === g}
                aria-label={
                  g === 'pro' ? 'Set player skill level to Pro' : 'Set player skill level to Beginner'
                }
              >
                {g === 'pro' ? '🥇 Pro' : '🌱 Beginner'}
              </button>
            ))}
          </div>
          {err && (
            <div className="alert alert-danger" style={{ marginBottom: 12 }}>
              {err}
            </div>
          )}
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
            ['🌱 Beginners', begs.length, 'var(--beg)'],
          ].map(([label, val, color]) => (
            <div className="summary-row" key={String(label)}>
              <span className="summary-label">{label}</span>
              <span className="summary-value" style={color ? { color: color as string } : {}}>
                {String(val)}
              </span>
            </div>
          ))}
          {players.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Btn variant="primary" full size="lg" onClick={onDone}>
                🚀 Start a Tournament →
              </Btn>
            </div>
          )}
        </Card>
      </div>

      {/* Player list */}
      <Card>
        <CardTitle>🏸 All Players ({players.length})</CardTitle>
        {loading ? (
          <EmptyState icon="⏳" text="Loading players…" />
        ) : players.length === 0 ? (
          <EmptyState icon="👥" text="No players yet — add some above!" />
        ) : (
          <div className="player-grid">
            {players.map(p => {
              const id = String(p._id);
              const isEditing = editingId === id;
              return (
                <div key={id} className="player-card anim-slide">
                  <div
                    className="pc-body"
                    style={{ cursor: onOpenProfile ? 'pointer' : 'default' }}
                    onClick={() => onOpenProfile?.(p.name)}
                  >
                    <div className={`pc-avatar ${p.group}`}>{p.name.trim().charAt(0)}</div>
                    <div className="pc-info">
                      {isEditing ? (
                        <input
                          className="input"
                          autoFocus
                          value={editName}
                          maxLength={30}
                          style={{ padding: '4px 8px', fontSize: 13, marginBottom: 0 }}
                          onChange={({ target }: { target: HTMLInputElement }) =>
                            setEditName(target.value)
                          }
                          onKeyDown={({ key }: { key: string }) => {
                            if (key === 'Enter') rename(id);
                            if (key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => rename(id)}
                        />
                      ) : (
                        <div className="name">{p.name}</div>
                      )}
                      <span className={`pc-badge ${p.group}`}>
                        {p.group === 'pro' ? '🥇 Pro' : '🌱 Beginner'}
                      </span>
                      <div className="stats">
                        <span className="stat-chip">🏆 {p.stats.titles}</span>
                        <span className="stat-chip">{p.stats.wins}W</span>
                        <span className="stat-chip">{p.stats.losses}L</span>
                      </div>
                    </div>
                  </div>
                  <div className="pc-actions">
                    <button
                      className="pc-action-btn"
                      onClick={() => {
                        setEditingId(id);
                        setEditName(p.name);
                      }}
                      aria-label={`Edit ${p.name}'s information`}
                    >
                      <span className="icon" aria-hidden="true">
                        ✏️
                      </span>{' '}
                      Edit
                    </button>
                    <button
                      className="pc-action-btn"
                      onClick={() => toggleGroup(id, p.group)}
                      aria-label={`Change ${p.name} from ${
                        p.group === 'pro' ? 'Pro to Beginner' : 'Beginner to Pro'
                      }`}
                    >
                      <span className="icon" aria-hidden="true">
                        {p.group === 'pro' ? '🌱' : '🥇'}
                      </span>
                      {p.group === 'pro' ? 'To Beg' : 'To Pro'}
                    </button>
                    <button
                      className="pc-action-btn danger"
                      onClick={() => del(id)}
                      aria-label={`Remove ${p.name} from roster`}
                    >
                      <span className="icon" aria-hidden="true">
                        🗑️
                      </span>{' '}
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RosterScreen;
