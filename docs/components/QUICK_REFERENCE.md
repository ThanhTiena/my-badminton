# Court Components — Quick Reference

## Import

```tsx
import { Button, Badge, PlayerTile, StatCard } from '@/components';
import type { ButtonProps, BadgeProps, PlayerTileProps, StatCardProps } from '@/components';
```

---

## Button

```tsx
<Button variant="primary" size="md" full disabled onClick={() => {}}>
  Click Me
</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'volt' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `full` | `boolean` | `false` | Full width |
| `disabled` | `boolean` | `false` | Disabled state |
| `onClick` | `() => void` | - | Click handler |
| ...rest | `HTMLButtonElement` | - | All button props |

**Examples:**
```tsx
<Button variant="primary">Save</Button>
<Button variant="volt" size="lg">Start Tournament</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
```

---

## Badge

```tsx
<Badge group="pro" />
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `group` | `'pro' \| 'beg'` | ✅ | Skill level |

**Examples:**
```tsx
<Badge group="pro" />  // Ink fill with volt text
<Badge group="beg" />  // Ink outline
```

---

## PlayerTile

```tsx
<PlayerTile
  name="Alex Nguyen"
  group="pro"
  record="18W · 7L · 3 titles"
  onClick={() => {}}
/>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Player name |
| `group` | `'pro' \| 'beg'` | ✅ | Skill level |
| `record` | `string` | - | Stats text |
| `onClick` | `() => void` | - | Click handler (adds hover) |

**Examples:**
```tsx
<PlayerTile name="Alex Nguyen" group="pro" record="18W · 7L" />
<PlayerTile name="Sarah Chen" group="beg" onClick={handleClick} />
<PlayerTile name="Michael Kim" group="pro" />
```

---

## StatCard

```tsx
<StatCard
  label="Total Revenue"
  value="$48,240"
  sub="Up 12% from last month"
  dark
/>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | ✅ | Uppercase label |
| `value` | `React.ReactNode` | ✅ | Main value (number/string/JSX) |
| `sub` | `string` | - | Subtitle text |
| `dark` | `boolean` | - | Dark variant (ink bg) |

**Examples:**
```tsx
<StatCard label="Total Players" value={127} />
<StatCard label="Win Rate" value="68.3%" sub="Pro division" />
<StatCard label="Revenue" value="$48K" sub="This month" dark />
<StatCard label="Custom" value={<span>JSX Value</span>} />
```

---

## Design Tokens

```css
var(--ink)          /* #16170F - Primary dark */
var(--volt)         /* #CBF14A - Accent green */
var(--paper)        /* #F3F1EA - Background beige */
var(--card)         /* #FFFFFF - Card background */
var(--muted)        /* #74715F - Secondary text */
var(--win)          /* #2D7A4D - Success green */
var(--loss)         /* #C24226 - Error red */
var(--r)            /* 4px - Border radius */
var(--font-display) /* 'Archivo', sans-serif */
var(--font-mono)    /* 'Space Mono', monospace */
```

---

## Migration Examples

### Button Migration

```tsx
// OLD
<button className="btn btn-primary btn-lg btn-full">Click</button>

// NEW
<Button variant="primary" size="lg" full>Click</Button>
```

### Badge Migration

```tsx
// OLD
<span className="badge badge-pro">PRO</span>

// NEW
<Badge group="pro" />
```

---

## Component Hierarchy

```
components/
├── Button.tsx          ← Primary action button
├── Badge.tsx           ← Skill level indicator
├── PlayerTile.tsx      ← Player card (uses Badge)
├── StatCard.tsx        ← Statistic display
└── index.ts            ← Barrel export
```

---

## Demo

**Route:** `/court-demo`
**File:** `pages/court-demo.tsx`

Run `npm run dev` and visit `http://localhost:3000/court-demo`

---

## Files

### Core Components
- `components/Button.tsx` (93 lines)
- `components/Badge.tsx` (41 lines)
- `components/PlayerTile.tsx` (106 lines)
- `components/StatCard.tsx` (79 lines)
- `components/index.ts` (23 lines)

### Documentation
- `components/README.md` — Full documentation
- `components/QUICK_REFERENCE.md` — This file
- `components/IMPLEMENTATION_SUMMARY.md` — Implementation details

---

## Status

✅ **Build:** Passing (`npm run build` succeeds)
✅ **Types:** Fully typed (TypeScript strict mode)
✅ **Dependencies:** Zero external dependencies
✅ **Design:** Court system compliant
✅ **Export:** Available at `@/components`

---

**Last Updated:** June 24, 2026
