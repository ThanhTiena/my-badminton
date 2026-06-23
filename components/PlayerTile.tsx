import React from 'react';
import { Badge } from './Badge';

/**
 * Court — PlayerTile
 * Player card with monogram avatar, name, record stats, and skill badge.
 *
 * Features:
 * - Monogram square avatar (first letter)
 * - Pro: ink background with volt text
 * - Beginner: muted background with ink text
 * - Optional record stats in Space Mono
 * - Skill badge on the right
 * - Optional onClick for interactive tiles
 *
 * Replaces gradient-circle player cards with flat, bordered design.
 */

export interface PlayerTileProps {
  name: string;
  group: 'pro' | 'beg';
  record?: string;
  onClick?: () => void;
}

export function PlayerTile({ name, group, record, onClick }: PlayerTileProps) {
  const pro = group === 'pro';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card, #fff)',
        border: 'var(--border, 1px solid #E0DDD0)',
        borderRadius: 'var(--r, 4px)',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--ink, #16170F)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#E0DDD0';
        }
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {/* Monogram Avatar */}
        <div
          style={{
            width: 46,
            height: 46,
            background: pro ? 'var(--ink, #16170F)' : '#ECEAE0',
            color: pro ? 'var(--volt, #CBF14A)' : 'var(--ink, #16170F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "var(--font-display, 'Archivo', sans-serif)",
            fontSize: 20,
            fontWeight: 800,
            borderRadius: 'var(--r, 4px)',
            textTransform: 'uppercase',
          }}
        >
          {name.trim().charAt(0)}
        </div>

        {/* Name and Record */}
        <div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              fontFamily: "var(--font-display, 'Archivo', sans-serif)",
              color: 'var(--ink, #16170F)',
            }}
          >
            {name}
          </div>
          {record && (
            <div
              style={{
                fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                fontSize: 13,
                color: 'var(--muted, #74715F)',
                marginTop: 4,
              }}
            >
              {record}
            </div>
          )}
        </div>
      </div>

      {/* Skill Badge */}
      <Badge group={group} />
    </div>
  );
}
