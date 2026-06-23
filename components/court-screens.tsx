/* ════════════════════════════════════════════════════
   COURT DESIGN SYSTEM - MIGRATED SCREENS
   RosterScreen, SetupScreen, PaymentScreen (Court styles)
════════════════════════════════════════════════════ */

import React from 'react';

/**
 * Court Design System Tokens (inline reference):
 *
 * Colors:
 * --ink: #16170F (text, primary buttons)
 * --paper: #F3F1EA (app background)
 * --card: #FFFFFF (card surfaces)
 * --line: #E0DDD0 (hairline borders)
 * --muted: #74715F (secondary text)
 * --volt: #CBF14A (action + live ONLY, ≤5% screen)
 * --loss: #C24226 (due/destructive)
 * --win: #2F6E3A (paid/positive)
 *
 * Type:
 * --font-display: 'Archivo' (UI, headings 800-900)
 * --font-mono: 'Space Mono' (labels, uppercase, +2px tracking)
 *
 * Spacing: 8 · 16 · 24 · 32 · 48 · 64
 * Radius: 4px (sharp)
 *
 * Rules:
 * - NO gradients
 * - ONE volt action per screen max
 * - Tabular numerals on all numbers
 * - Space Mono for labels/headers
 * - 4px corners everywhere
 */

// Court Button Component
export function CourtButton({
  children,
  variant = 'primary',
  size = 'md',
  full,
  disabled,
  onClick,
  style,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'volt' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-display, 'Archivo', sans-serif)",
    fontWeight: 700,
    border: 'none',
    borderRadius: 'var(--r, 4px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.6 : 1,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--ink, #16170F)', color: '#fff' },
    volt: { background: 'var(--volt, #CBF14A)', color: 'var(--ink, #16170F)' },
    ghost: { background: 'transparent', color: 'var(--ink, #16170F)', border: '1.5px solid var(--ink, #16170F)' },
    danger: { background: 'transparent', color: 'var(--loss, #C24226)', border: '1.5px solid var(--loss, #C24226)' },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 14px', fontSize: 14 },
    md: { padding: '12px 22px', fontSize: 16 },
    lg: { padding: '15px 28px', fontSize: 18, fontWeight: 800 },
  };

  return (
    <button
      style={{
        ...base,
        ...variants[variant],
        ...sizes[size],
        width: full ? '100%' : undefined,
        ...style,
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Court Badge Component
export function CourtBadge({ group }: { group: 'pro' | 'beg' }) {
  const pro = group === 'pro';
  return (
    <span
      style={{
        fontFamily: "var(--font-mono, 'Space Mono', monospace)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        padding: pro ? '4px 9px' : '3px 9px',
        background: pro ? 'var(--ink, #16170F)' : 'transparent',
        color: pro ? 'var(--volt, #CBF14A)' : 'var(--ink, #16170F)',
        border: pro ? 'none' : '1.5px solid var(--ink, #16170F)',
        borderRadius: 'var(--r-sm, 2px)',
      }}
    >
      {pro ? 'PRO' : 'BEG'}
    </span>
  );
}

// Court PlayerTile Component
export function CourtPlayerTile({
  name,
  group,
  record,
  onClick,
  children,
}: {
  name: string;
  group: 'pro' | 'beg';
  record?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const pro = group === 'pro';
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #E0DDD0)',
        borderRadius: 'var(--r, 4px)',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
        {/* Monogram */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 'var(--r, 4px)',
            background: pro ? 'var(--ink, #16170F)' : '#ECEAE0',
            color: pro ? 'var(--volt, #CBF14A)' : 'var(--ink, #16170F)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "var(--font-display, 'Archivo', sans-serif)",
            fontSize: 20,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {name.trim().charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "var(--font-display, 'Archivo', sans-serif)" }}>{name}</div>
          {record && (
            <div style={{ fontFamily: "var(--font-mono, 'Space Mono', monospace)", fontSize: 13, color: 'var(--muted, #74715F)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
              {record}
            </div>
          )}
        </div>
      </div>
      {children || <CourtBadge group={group} />}
    </div>
  );
}

// Court Card Component
export function CourtCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #E0DDD0)',
        borderRadius: 'var(--r, 4px)',
        padding: '20px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Court Card Title (Space Mono uppercase label)
export function CourtCardTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono, 'Space Mono', monospace)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: 'var(--muted, #74715F)',
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
