import React from 'react';

/**
 * Court — StatCard
 * Display prominent statistics with Court design system.
 *
 * Features:
 * - Uppercase label in Space Mono
 * - Large tabular number display
 * - Optional subtitle
 * - Dark variant for headline metrics
 *
 * Use dark=true for the one primary metric on a screen
 * (e.g., total revenue, tournament count).
 */

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  dark?: boolean;
}

export function StatCard({ label, value, sub, dark }: StatCardProps) {
  return (
    <div
      style={{
        background: dark ? 'var(--ink, #16170F)' : 'var(--card, #fff)',
        color: dark ? '#F3F1EA' : 'var(--ink, #16170F)',
        border: dark ? 'none' : 'var(--border, 1px solid #E0DDD0)',
        borderRadius: 'var(--r, 4px)',
        padding: '24px 26px',
      }}
    >
      {/* Label */}
      <div
        style={{
          fontFamily: "var(--font-mono, 'Space Mono', monospace)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: dark ? 'var(--volt, #CBF14A)' : 'var(--muted, #74715F)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      {/* Value */}
      <div
        style={{
          fontFamily: "var(--font-display, 'Archivo', sans-serif)",
          fontSize: 44,
          fontWeight: 900,
          letterSpacing: -1,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {sub && (
        <div
          style={{
            fontSize: 15,
            color: dark ? '#C9C6B8' : 'var(--muted, #74715F)',
            marginTop: 8,
            fontFamily: "var(--font-display, 'Archivo', sans-serif)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
