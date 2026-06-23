import React from 'react';

/**
 * Court — Badge
 * Skill level indicator with Court design system styling.
 *
 * Groups:
 * - pro: ink fill with volt text
 * - beg: ink outline
 *
 * Features Space Mono font, 2px radius, uppercase text.
 * No emoji, pure typographic design.
 */

export interface BadgeProps {
  group: 'pro' | 'beg';
}

export function Badge({ group }: BadgeProps) {
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
        borderRadius: '2px',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      {pro ? 'PRO' : 'BEG'}
    </span>
  );
}
