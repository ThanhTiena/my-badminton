import React from 'react';

/**
 * Court — Button
 * Primary component for user actions.
 *
 * Variants:
 * - primary: ink background (default)
 * - volt: the one hero action per screen
 * - ghost: outline style
 * - danger: destructive actions
 *
 * Relies on Court CSS variables (--ink, --volt, etc.)
 */

type Variant = 'primary' | 'volt' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base: React.CSSProperties = {
  fontFamily: "var(--font-display, 'Archivo', sans-serif)",
  fontWeight: 700,
  border: 'none',
  borderRadius: 'var(--r, 4px)',
  cursor: 'pointer',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
};

const variants: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--ink, #16170F)',
    color: '#fff'
  },
  volt: {
    background: 'var(--volt, #CBF14A)',
    color: 'var(--ink, #16170F)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink, #16170F)',
    border: '1.5px solid var(--ink, #16170F)'
  },
  danger: {
    background: 'transparent',
    color: 'var(--loss, #C24226)',
    border: '1.5px solid var(--loss, #C24226)'
  },
};

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: 14 },
  md: { padding: '12px 22px', fontSize: 16 },
  lg: { padding: '15px 28px', fontSize: 18, fontWeight: 800 },
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      style={{
        ...base,
        ...variants[variant],
        ...sizes[size],
        width: full ? '100%' : undefined,
        ...(disabled ? disabledStyle : {}),
        ...style
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
