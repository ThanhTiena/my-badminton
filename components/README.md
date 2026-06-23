# Court Design System — Primitive Components

Step 2 implementation for SmashTour badminton tournament management system.

## Overview

This directory contains reusable React components built following the **Court design system**:

- **Flat, bordered cards** — no gradients or shadows
- **4px border radius** (`var(--r)`)
- **Archivo font** for display text
- **Space Mono font** for monospace text
- **Court color tokens** (`--ink`, `--volt`, `--paper`, etc.)
- **Zero external dependencies** — pure React + TypeScript

## Components

### Button

Primary action component with multiple variants and sizes.

```tsx
import { Button } from '@/components';

// Variants
<Button variant="primary">Save</Button>      // Default: ink background
<Button variant="volt">Start Tournament</Button>  // Hero action: volt background
<Button variant="ghost">Cancel</Button>       // Outline style
<Button variant="danger">Delete</Button>      // Destructive action

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  // Default
<Button size="lg">Large</Button>

// Props
<Button full>Full Width</Button>
<Button disabled>Disabled</Button>
<Button onClick={() => console.log('clicked')}>Click Me</Button>
```

**Props:**
- `variant?: 'primary' | 'volt' | 'ghost' | 'danger'` — visual style (default: `'primary'`)
- `size?: 'sm' | 'md' | 'lg'` — button size (default: `'md'`)
- `full?: boolean` — full width button
- `disabled?: boolean` — disabled state
- All standard HTML button props (`onClick`, `type`, etc.)

---

### Badge

Skill level indicator with Court styling.

```tsx
import { Badge } from '@/components';

<Badge group="pro" />  // Ink fill with volt text
<Badge group="beg" />  // Ink outline
```

**Props:**
- `group: 'pro' | 'beg'` — skill level

**Design:**
- PRO: ink background (#16170F) with volt text (#CBF14A)
- BEG: transparent background with ink border
- Space Mono font, 11px, uppercase, 2px radius

---

### PlayerTile

Player card with monogram avatar, name, optional record stats, and skill badge.

```tsx
import { PlayerTile } from '@/components';

<PlayerTile
  name="Alex Nguyen"
  group="pro"
  record="18W · 7L · 3 titles"
  onClick={() => console.log('player clicked')}
/>

<PlayerTile
  name="Sarah Chen"
  group="beg"
/>
```

**Props:**
- `name: string` — player name
- `group: 'pro' | 'beg'` — skill level
- `record?: string` — optional stats text (e.g., "18W · 7L · 3 titles")
- `onClick?: () => void` — optional click handler (adds hover effect)

**Design:**
- Monogram avatar (first letter of name)
  - Pro: ink background with volt text
  - Beginner: muted background (#ECEAE0) with ink text
- Name in Archivo, 19px, bold
- Record in Space Mono, 13px, muted color
- Skill badge on the right
- Hover effect when `onClick` is provided

---

### StatCard

Display prominent statistics with optional dark variant for headline metrics.

```tsx
import { StatCard } from '@/components';

<StatCard
  label="Total Revenue"
  value="$48,240"
  sub="Up 12% from last month"
  dark
/>

<StatCard
  label="Active Players"
  value={127}
/>

<StatCard
  label="Win Rate"
  value="68.3%"
  sub="Pro division"
/>
```

**Props:**
- `label: string` — uppercase label text
- `value: React.ReactNode` — main value (number, string, or JSX)
- `sub?: string` — optional subtitle text
- `dark?: boolean` — dark variant (ink background)

**Design:**
- Label: Space Mono, 13px, uppercase, letter-spacing 2px
- Value: Archivo, 44px, weight 900, tabular numerals
- Dark variant: ink background with volt label, use for primary metric
- Light variant: white card with border

---

## Design Tokens

All components use Court CSS variables defined in `styles/court.css`:

```css
--ink: #16170F        /* Primary dark */
--volt: #CBF14A       /* Accent bright green */
--paper: #F3F1EA      /* Background beige */
--card: #FFFFFF       /* Card background */
--muted: #74715F      /* Secondary text */
--line-strong: #E0DDD0  /* Border color */
--win: #2D7A4D        /* Success green */
--loss: #C24226       /* Error red */
--r: 4px              /* Border radius */
--r-sm: 2px           /* Small border radius */
--font-display: 'Archivo', sans-serif
--font-mono: 'Space Mono', monospace
```

## Migration Guide

### From old class-based buttons:

```tsx
// OLD
<button className="btn btn-primary btn-lg btn-full">
  Click Me
</button>

// NEW
<Button variant="primary" size="lg" full>
  Click Me
</Button>
```

### From old badge components:

```tsx
// OLD
<span className="badge badge-pro">PRO</span>

// NEW
<Badge group="pro" />
```

## Demo Page

View all components in action:
- **Route:** `/court-demo`
- **File:** `pages/court-demo.tsx`

## File Structure

```
components/
├── Badge.tsx           # Skill level badge
├── Button.tsx          # Primary action button
├── PlayerTile.tsx      # Player card with avatar
├── StatCard.tsx        # Statistic display card
├── index.ts            # Barrel export
├── COURT_COMPONENTS_DEMO.tsx  # Standalone demo component
└── README.md           # This file
```

## Usage in Existing App

1. Import components from barrel export:
```tsx
import { Button, Badge, PlayerTile, StatCard } from '@/components';
```

2. Replace existing components gradually:
   - `Btn` → `Button`
   - Class-based badges → `Badge`
   - Custom player cards → `PlayerTile`
   - Stat displays → `StatCard`

3. Keep the old components until migration is complete
4. No breaking changes — old and new components coexist

## TypeScript

All components are fully typed with exported interfaces:

```tsx
import type { ButtonProps, BadgeProps, PlayerTileProps, StatCardProps } from '@/components';
```

## Testing

Components are designed to work with:
- React 19
- TypeScript strict mode
- Next.js 14+
- Server and client components

No external dependencies required (no shadcn, no Tailwind utilities).

## Design Principles

1. **Correctness first** — components work as expected
2. **No magic** — all styles are explicit inline or via CSS variables
3. **Type safety** — strict TypeScript interfaces
4. **Accessibility** — semantic HTML, keyboard navigation
5. **Performance** — minimal re-renders, no unnecessary deps
6. **Consistency** — follows Court design system

## Support

For questions or issues:
- See reference implementations in `documents/design_handoff_court/components/`
- Check Court CSS tokens in `styles/court.css`
- View demo page at `/court-demo`

---

**Implementation Date:** June 24, 2026
**Status:** ✅ Complete — Build passes, components exported
**Next Steps:** Gradual migration of existing app screens to Court components
