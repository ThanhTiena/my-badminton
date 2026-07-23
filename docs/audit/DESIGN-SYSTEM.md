# Design System Audit: SmashTour Badminton App

**Date:** 2026-07-23
**CSS Files Analyzed:** `styles/globals.css` (2,103 lines), `styles/court.css` (112 lines)
**Framework:** Next.js + Tailwind CSS 4
**Status:** Mid-migration from legacy purple gradients to Court flat design system

---

## Executive Summary

This document extracts the **de facto design system** from the SmashTour badminton app's CSS. The app is currently in **transition** between two design paradigms:

1. **LEGACY SYSTEM** (pre-Court): Purple gradients (`rgba(124,58,237,*)`), glows, blob decorations, Outfit/Inter fonts
2. **COURT SYSTEM** (current): Flat ink/paper/volt palette, Archivo/Space Mono fonts, sharp borders, no shadows

**Critical Finding:** 47 instances of hardcoded purple `rgba(124,58,237,*)` remain in CSS (animations, focus states, shadows), creating visual conflicts with the new Court tokens that alias `--primary` to `--ink` (black).

---

## 1. COLOR PALETTE (ACTUAL vs PROPOSED)

### 1.1 Court Tokens (Defined in `:root`)

| Color | Variable | Value | Usage Context | Status |
|-------|----------|-------|---------------|--------|
| **Neutrals** | | | | |
| Ink | `--ink` | `#16170F` | Near-black warm. Text + surfaces | KEEP |
| Paper | `--paper` | `#F3F1EA` | Warm off-white. App canvas | KEEP |
| Card | `--card` | `#FFFFFF` | Card surfaces | KEEP |
| Line | `--line` | `#E0DDD0` | Hairline borders | KEEP |
| Line Strong | `--line-strong` | `#CFCBBC` | Stronger dividers | KEEP |
| Muted | `--muted` | `#74715F` | Secondary text (AA compliant) | KEEP |
| Muted 2 | `--muted-2` | `#9A9685` | Tertiary/mono labels on dark | KEEP |
| **Accent** | | | | |
| Volt | `--volt` | `#CBF14A` | Electric lime. Action/LIVE (<=5% screen) | KEEP |
| Court Green | `--court-green` | `#1C3A2A` | Deep surface tone (optional) | KEEP |
| **Status** | | | | |
| Win | `--win` | `#2F6E3A` | Positive/paid | KEEP |
| Loss | `--loss` | `#C24226` | Destructive/due/loss | KEEP |
| Caution | `--caution` | `#A8761B` | Warnings only | KEEP |

**Total Court Colors:** 12 tokens

---

### 1.2 Legacy Aliases (DEPRECATED - Pointing to Court Values)

| Old Variable | Points To | Visual Change? | Usage Count | Action |
|--------------|-----------|----------------|-------------|--------|
| `--primary` | `--ink` (was purple) | YES (purple → black) | 96 occurrences in .tsx | CONFLICT: See 1.3 |
| `--primary-end` | `--ink` | YES | - | DELETE after migration |
| `--accent` | `--volt` | YES | 96 occurrences | Rename to `--volt` |
| `--accent2` | `--ink` | YES | - | DELETE |
| `--accent3` | `--volt` | YES | - | DELETE |
| `--pro` | `--ink` | YES | - | DELETE |
| `--beg` | `--muted` | YES | - | DELETE |
| `--success` | `--win` | NO | - | DELETE |
| `--danger` | `--loss` | NO | - | DELETE |
| `--warn` | `--caution` | NO | - | DELETE |
| `--text` | `--ink` | NO | - | DELETE |
| `--text2` | `--muted` | NO | - | DELETE |
| `--text3` | `--muted` | NO | - | DELETE |
| `--text-white` | `#FFFFFF` | NO | - | Hardcode or keep |
| `--bg` | `--paper` | NO | - | DELETE |
| `--bg-soft` | `#ECEAE0` | - | - | Needs Court token |
| `--bg-card` | `--card` | NO | - | DELETE |
| `--bg-sidebar` | `--ink` | YES | - | DELETE |
| `--bg-input` | `--card` | NO | - | DELETE |
| `--bg2` | `#ECEAE0` | - | - | Duplicate of --bg-soft |
| `--bg3` | `--card` | NO | - | DELETE |
| `--bg4` | `#E7E4DA` | - | - | Needs Court token |
| `--grad-primary` | `--ink` (was gradient) | YES (gradient → flat) | 96 occurrences | DELETE |
| `--grad-sky` | `--ink` | YES | - | DELETE |
| `--grad-warm` | `--loss` | YES | - | DELETE |
| `--grad-success` | `--win` | YES | - | DELETE |
| `--border-focus` | `--ink` | YES | - | DELETE |

**Total Legacy Aliases:** 27 variables → **DELETE all after replacing in code**

---

### 1.3 Hardcoded Colors (CONFLICTS!)

These colors are **hardcoded in CSS** and conflict with Court tokens:

| Color | Hex/RGBA | Location | Usage Count | Conflict? | Proposed Fix |
|-------|----------|----------|-------------|-----------|--------------|
| **Purple (old primary)** | `rgba(124,58,237,*)` | globals.css | 47 instances | YES | Replace with `--ink` or `--volt` |
| Pink | `rgba(236,72,153,*)` | globals.css (gradients) | ~8 instances | YES | Remove (gradients deleted) |
| Sky Blue | `rgba(14,165,233,*)` | globals.css (gradients) | ~3 instances | YES | Remove (gradients deleted) |
| Purple Light | `#D1C9F5` | Scrollbar thumb | 1 | YES | Replace with `--line-strong` |
| Purple Lighter | `#A78BFA` | Scrollbar hover | 1 | YES | Replace with `--muted` |
| Gold | `#F59E0B`, `#FBBF24`, `#FCD34D` | Podium gradients | ~5 instances | NO | Keep (status color) |
| Silver | `#9CA3AF`, `#D1D5DB` | Podium gradients | ~4 instances | NO | Keep (status color) |
| Bronze | `#92400E`, `#D97706` | Podium gradients | ~6 instances | NO | Keep (status color) |
| Red | `#EF4444` | Live dot | 1 | NO | Consider aliasing to `--loss` |
| Black | `#000` | Hover states | 2 | NO | Use `--ink` instead |

**Critical Conflicts:**

1. **pulsePrimary animation** (line 120): Uses `rgba(124,58,237,*)` but `--primary` is now `--ink`
2. **Focus rings** (lines 147, 154): Hardcoded purple shadows
3. **Sidebar shadow** (line 209): Purple glow `rgba(124,58,237,.05)`
4. **Button shadows** (lines 564, 566): Purple glows
5. **Input focus** (line 621): Purple shadow
6. **Active nav links** (line 289): Purple gradient background
7. **Hover states** (lines 285, 682, 841, 870+): Purple overlays

---

### 1.4 Proposed Color Consolidation

**Remove:**
- All purple (`rgba(124,58,237,*)`), pink, sky blue
- All gradient variables (`--grad-*`)
- Scrollbar colors (`#D1C9F5`, `#A78BFA`)

**Keep:**
- 12 Court tokens (ink, paper, volt, etc.)
- Podium status gradients (gold/silver/bronze)
- White (`#fff`)

**Add Court tokens for missing neutrals:**
```css
--bg-soft: #ECEAE0; /* Currently hardcoded, needs official token */
--bg-alt:  #E7E4DA; /* Currently --bg4, needs official token */
```

**Final Palette Size:** ~15 colors (down from 40+ including aliases)

---

## 2. SPACING SCALE

### 2.1 Official Court Scale (Defined in `:root`)

```css
--s-1: 8px;
--s-2: 16px;
--s-3: 24px;
--s-4: 32px;
--s-6: 48px;
--s-8: 64px;
```

**Base:** 8px grid
**Missing:** `--s-5` (40px), `--s-7` (56px)

---

### 2.2 Spacing Usage Analysis

**Total spacing declarations found:** 134 (padding/margin/gap)

#### On-Scale Values (Compliant)

| Value | Count | Token Equivalent |
|-------|-------|------------------|
| 8px | 15 | `--s-1` |
| 16px | 22 | `--s-2` |
| 24px | 12 | `--s-3` |
| 32px | 6 | `--s-4` |
| 48px | 3 | `--s-6` |
| 64px | 1 | `--s-8` |

**Total on-scale:** 59/134 (44%)

#### Off-Scale Values (NON-COMPLIANT)

| Value | Count | Nearest Token | Location Examples |
|-------|-------|---------------|-------------------|
| **1px** | 8 | N/A (borders) | Borders, dividers |
| **2px** | 4 | N/A (micro) | Badges, spacing |
| **3px** | 6 | `--s-1` (8px) | Inputs, badges |
| **4px** | 8 | `--s-1` (8px) | Buttons, spacing |
| **5px** | 5 | `--s-1` (8px) | Gaps, quick buttons |
| **6px** | 12 | `--s-1` (8px) | Padding, badges |
| **7px** | 5 | `--s-1` (8px) | Gaps, padding |
| **9px** | 3 | `--s-1` (8px) | Padding |
| **10px** | 18 | `--s-2` (16px) | Gaps, padding |
| **11px** | 4 | `--s-2` (16px) | Padding |
| **12px** | 20 | `--s-2` (16px) | Gaps, padding |
| **13px** | 2 | `--s-2` (16px) | Padding |
| **14px** | 9 | `--s-2` (16px) | Padding, gaps |
| **18px** | 4 | `--s-2` (16px) or `--s-3` (24px) | Metric card padding |
| **20px** | 9 | `--s-3` (24px) | Card padding, gaps |
| **28px** | 2 | `--s-4` (32px) | Main content padding |
| **40px** | 2 | MISSING TOKEN | Login padding |
| **80px** | 2 | MISSING TOKEN | Mobile main padding |
| **100px** | 1 | MISSING TOKEN | Main content padding |

**Total off-scale:** 75/134 (56%)

**Most Common Off-Scale Values:**
1. `10px` (18 occurrences) — should be `16px` (`--s-2`)
2. `12px` (20 occurrences) — should be `16px` (`--s-2`)
3. `20px` (9 occurrences) — should be `24px` (`--s-3`)

---

### 2.3 Proposed Spacing Consolidation

**Expand the scale to include:**
```css
--s-0: 4px;   /* Micro spacing (badges, tight gaps) */
--s-1: 8px;   /* EXISTING */
--s-2: 16px;  /* EXISTING */
--s-3: 24px;  /* EXISTING */
--s-4: 32px;  /* EXISTING */
--s-5: 40px;  /* NEW: Medium-large padding */
--s-6: 48px;  /* EXISTING */
--s-7: 56px;  /* NEW: Large padding */
--s-8: 64px;  /* EXISTING */
--s-10: 80px; /* NEW: Extra-large padding (mobile bottom) */
--s-12: 96px; /* NEW: Huge padding */
```

**Migration Rules:**
- 1px-4px → `--s-0` (4px)
- 5px-10px → `--s-1` (8px)
- 11px-18px → `--s-2` (16px)
- 19px-28px → `--s-3` (24px)
- 40px → `--s-5` (40px)
- 80px → `--s-10` (80px)
- 100px → `--s-12` (96px)

---

## 3. TYPOGRAPHY

### 3.1 Font Families

| Context | Current | Court | Status |
|---------|---------|-------|--------|
| **Body** | Inter | Archivo | CONFLICT (court.css overrides) |
| **Display** | Outfit | Archivo | CONFLICT |
| **Mono** | Courier New, Space Mono | Space Mono | PARTIAL |
| **Tokens** | `--font-display: 'Archivo'` | - | DEFINED |
| | `--font-mono: 'Space Mono'` | - | DEFINED |

**Font Loading:**
Line 1: `@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');`

**Issues:**
1. `body` (line 98) uses `'Inter'` (legacy) but Court overrides with `var(--font-display)` (Archivo)
2. `.page-title`, `.sidebar-logo .logo-text` reference `'Outfit'` (not loaded)
3. Font stack inconsistencies across components

---

### 3.2 Font Sizes Used

**Total unique font sizes found:** 52 values

| Size | Count | Usage Context | Proposed Token |
|------|-------|---------------|----------------|
| **8px** | 1 | - | - |
| **9px** | 2 | Table headers (mobile) | `--fs-xs` |
| **10px** | 18 | Labels, badges, uppercase | `--fs-xs` (11px) |
| **11px** | 20 | Small text, stats, meta | `--fs-sm` (13px) |
| **12px** | 18 | Small body, labels | `--fs-sm` (13px) |
| **13px** | 17 | Body text, buttons | `--fs-base` (15px) |
| **14px** | 13 | Body text, inputs | `--fs-base` (15px) |
| **15px** | 8 | Default body | `--fs-base` (15px) |
| **16px** | 1 | Nav icons | `--fs-md` (18px) |
| **17px** | 3 | Player cards, rankings | `--fs-md` (18px) |
| **18px** | 3 | Page subtitles | `--fs-md` (18px) |
| **20px** | 2 | Logo, podium | `--fs-lg` (24px) |
| **22px** | 4 | Podium scores | `--fs-lg` (24px) |
| **24px** | 4 | Scores, clamp min | `--fs-lg` (24px) |
| **26px** | 2 | Metric values, logo | `--fs-xl` (36px) |
| **28px** | 4 | Icons, podium | `--fs-xl` (36px) |
| **30px** | 1 | Trophy icon | `--fs-xl` (36px) |
| **32px** | 1 | Podium crown | `--fs-xl` (36px) |
| **34px** | 1 | Score tap button | `--fs-2xl` (52px) |
| **36px** | 3 | Page title max, crown | `--fs-2xl` (52px) |
| **40px** | 1 | Podium crown | `--fs-2xl` (52px) |
| **48px** | 2 | Empty state icons | `--fs-3xl` (72px) |
| **52px** | 1 | Champion name max | `--fs-3xl` (72px) |
| **96px** | 1 | Champion trophy | `--fs-4xl` (96px) |
| **clamp(24px, 5vw, 36px)** | 1 | Page title | - |
| **clamp(32px, 6vw, 52px)** | 1 | Champion name | - |

**Most Common Sizes:**
1. 10px (18) — Labels
2. 11px (20) — Small text
3. 12px (18) — Small body
4. 13px (17) — Body
5. 14px (13) — Body/inputs

**Issues:**
- Too many similar sizes (10-15px range has 6 variants)
- Inconsistent button sizes (12px, 13px, 14px, 15px)
- No systematic scale

---

### 3.3 Proposed Type Scale

```css
/* Court Type System */
--fs-xs:   11px;  /* Labels, badges, uppercase (replaces 9-11px) */
--fs-sm:   13px;  /* Small body, metadata (replaces 12-13px) */
--fs-base: 15px;  /* Body text, buttons (replaces 14-15px) */
--fs-md:   18px;  /* Subheadings, nav (replaces 16-18px) */
--fs-lg:   24px;  /* Section headers (replaces 20-24px) */
--fs-xl:   36px;  /* Page titles (replaces 26-36px) */
--fs-2xl:  52px;  /* Hero text (replaces 40-52px) */
--fs-3xl:  72px;  /* Large icons (replaces 48-72px) */
--fs-4xl:  96px;  /* Trophy/celebration (96px) */
```

**Fluid Typography:**
```css
--fs-page-title: clamp(var(--fs-lg), 5vw, var(--fs-xl));     /* 24px → 36px */
--fs-champion:   clamp(var(--fs-xl), 6vw, var(--fs-2xl));    /* 36px → 52px */
```

---

### 3.4 Font Weights Used

| Weight | Usage | Count |
|--------|-------|-------|
| 400 | Body text | Default |
| 500 | Medium emphasis | ~25 |
| 600 | Semi-bold | ~15 |
| 700 | Bold (buttons, headings) | ~80 |
| 800 | Extra-bold (metrics, titles) | ~40 |
| 900 | Black (scores, champions) | ~15 |

**Court Recommendation:**
```css
--fw-normal: 400;  /* Body */
--fw-medium: 500;  /* Subtle emphasis */
--fw-bold:   700;  /* Headings, buttons */
--fw-black:  800;  /* Scores, metrics */
```

---

### 3.5 Line Heights Used

| Value | Usage |
|-------|-------|
| 1 | Buttons, badges |
| 1.2 | Tight headings |
| 1.3 | Cards, compact text |
| 1.35 | Player names |
| 1.4 | History items |
| 1.5 | Body text (default) |
| 1.6 | Formulas (monospace) |

**Proposal:**
```css
--lh-tight:  1.2;  /* Headings */
--lh-snug:   1.35; /* Cards */
--lh-normal: 1.5;  /* Body */
--lh-loose:  1.6;  /* Mono/code */
```

---

## 4. BORDER RADIUS

### 4.1 Court Tokens (Defined)

```css
--r:    4px;   /* Default */
--r-sm: 2px;   /* Small */
--r-xs: var(--r-sm); /* DEPRECATED alias */
```

---

### 4.2 Radius Values Found

| Value | Count | Usage | Proposed Token |
|-------|-------|-------|----------------|
| **2px** | 1 | Confetti | `--r-sm` |
| **3px** | 1 | Scrollbar | `--r-sm` |
| **4px** | 2 | Focus, stat chips | `--r` |
| **5px** | 1 | Checkbox | `--r` |
| **8px** | 3 | Tabs | `--r-md` (NEW: 8px) |
| **10px** | 3 | Progress bar, borders | `--r-md` (NEW: 8px) |
| **20px** | 7 | Pills, badges (fully rounded) | `--r-pill` (NEW: 20px) |
| **50%** | 8 | Circles (avatars, dots) | `--r-full` (NEW: 50%) |
| **50px** | 1 | Pills | `--r-pill` |
| **var(--r)** | Many | Default | - |
| **var(--r-sm)** | Many | Small | - |

**Issues:**
- Inconsistent pill radii (20px vs 50px)
- No token for medium radius (8-10px)
- Circles should use `--r-full` (50%), not `border-radius: 50%`

---

### 4.3 Proposed Radius System

```css
--r-none: 0;
--r-sm:   2px;   /* EXISTING - Tight corners (inputs, small cards) */
--r:      4px;   /* EXISTING - Default (cards, buttons) */
--r-md:   8px;   /* NEW - Medium (tabs, larger cards) */
--r-lg:   12px;  /* NEW - Large (modals, popovers) */
--r-pill: 20px;  /* NEW - Pills (badges, tags) */
--r-full: 50%;   /* NEW - Circles (avatars, dots) */
```

**Migration:**
- `border-radius: 50%` → `var(--r-full)`
- `border-radius: 20px` (pills) → `var(--r-pill)`
- `border-radius: 8px` → `var(--r-md)`
- `border-radius: 10px` → `var(--r-md)` (8px)

---

## 5. SHADOWS & BORDERS

### 5.1 Court Philosophy

**Court uses borders, not shadows** (flat design).

```css
--border: 1px solid var(--line);
--shadow-card: none; /* Court kills shadows */
--shadow: 0 1px 2px rgba(20,20,15,.06); /* Minimal fallback */
```

---

### 5.2 Shadow Values Found (37 instances)

#### Purple Shadows (CONFLICT - Court removes these)

| Location | Value | Issue |
|----------|-------|-------|
| Line 120 | `box-shadow: 0 0 0 0/8px rgba(124,58,237,.35/0)` | pulsePrimary animation |
| Line 147 | `box-shadow: 0 0 0 4px rgba(124,58,237,.2)` | Button focus |
| Line 154 | `box-shadow: 0 0 0 4px rgba(124,58,237,.12)` | Input focus |
| Line 209 | `box-shadow: 2px 0 20px rgba(124,58,237,.05)` | Sidebar glow |
| Line 564 | `box-shadow: 0 4px 14px rgba(124,58,237,.3)` | Primary button |
| Line 566 | `box-shadow: 0 6px 20px rgba(124,58,237,.4)` | Primary button hover |
| Line 621 | `box-shadow: 0 0 0 3px rgba(124,58,237,.12)` | Input focus |
| Line 680 | `box-shadow: 0 2px 10px rgba(124,58,237,.25)` | Active tab |
| Line 707 | `box-shadow: 0 4px 12px rgba(124,58,237,.25)` | Active pill |
| Line 936 | `box-shadow: 0 4px 12px rgba(124,58,237,.25)` | Round badge |
| Line 1076 | `box-shadow: 0 0 0 4px rgba(124,58,237,.15)` | Score tap (can-win) |
| Line 1176 | `box-shadow: 0 4px 14px rgba(124,58,237,.3)` | Declare winner button |
| Line 1351 | `box-shadow: 0 12px 40px rgba(124,58,237,.4), ...` | 1st place podium |
| Line 1359 | `box-shadow: 0 16px 48px rgba(124,58,237,.5), ...` | 1st place hover |

**Total Purple Shadows:** 14 instances — **ALL must be removed or changed to `--ink`**

---

#### Non-Purple Shadows (Consider for Court)

| Location | Value | Purpose | Keep? |
|----------|-------|---------|-------|
| Line 1071 | `box-shadow: 0 2px 8px rgba(0,0,0,.08)` | Score tap button | NO → Border |
| Line 1382 | `box-shadow: 0 10px 32px rgba(107,114,128,.4), ...` | 2nd place podium (silver) | YES (status) |
| Line 1390 | `box-shadow: 0 12px 36px rgba(107,114,128,.5), ...` | 2nd place hover | YES (status) |
| Line 1413 | `box-shadow: 0 10px 32px rgba(217,119,6,.4), ...` | 3rd place podium (bronze) | YES (status) |
| Line 1421 | `box-shadow: 0 12px 36px rgba(217,119,6,.5), ...` | 3rd place hover | YES (status) |
| Line 1444 | `box-shadow: 0 4px 12px rgba(0,0,0,.15)` | Podium avatar | MAYBE → Border |
| Line 1752 | `box-shadow: 0 8px 32px rgba(0,0,0,.55)` | Popover | NO → Border |
| Line 1839 | `box-shadow: 0 2px 6px rgba(0,0,0,.12)` | Rank badge | NO → Border |
| Line 1845 | `box-shadow: 0 3px 10px rgba(245,158,11,.4)` | Gold rank badge | YES (status) |
| Line 1852 | `box-shadow: 0 3px 10px rgba(156,163,175,.4)` | Silver rank badge | YES (status) |
| Line 1859 | `box-shadow: 0 3px 10px rgba(217,119,6,.4)` | Bronze rank badge | YES (status) |
| Line 1867 | `box-shadow: 0 1px 3px rgba(0,0,0,.08)` | Normal rank badge | NO → Border |
| Line 1987 | `box-shadow: 2px 0 4px rgba(0,0,0,.08)` | Payment table sticky | MAYBE (functional) |
| Line 2042 | `box-shadow: 2px 0 8px rgba(0,0,0,.12)` | Payment table (mobile) | MAYBE (functional) |

---

### 5.3 Border Values

```css
--border: 1px solid var(--line);
```

**Usage:**
- All borders use `1px` or `1.5px` solid
- Border colors reference `--border`, `--line`, or `--line-strong`
- Court overrides ensure no gradient borders remain

**Proposal:**
```css
--border:        1px solid var(--line);        /* Default */
--border-strong: 1.5px solid var(--line-strong); /* Emphasized */
--border-focus:  2px solid var(--ink);         /* Keyboard focus */
```

---

### 5.4 Court Migration for Shadows

**Remove entirely:**
- All purple shadows (`rgba(124,58,237,*)`)
- Generic black shadows on cards (`rgba(0,0,0,.08)`)
- Glow effects (sidebar, buttons, inputs)

**Keep (status/functional):**
- Podium shadows (gold/silver/bronze gradients)
- Payment table sticky column shadow (functional)

**Replace with borders:**
- Card elevation → `--border`
- Button depth → `--border-strong`
- Focus states → `--border-focus`

---

## 6. BREAKPOINTS

### 6.1 Media Queries Found

| Breakpoint | Count | Query Type | Usage |
|------------|-------|------------|-------|
| **375px** | 1 | `max-width` | Extra small mobile (payment table) |
| **376px** | 1 | `min-width` (range) | Medium mobile (payment table) |
| **500px** | 1 | `max-width` | Metric grid collapse |
| **600px** | 1 | `max-width` | Match grid single column |
| **640px** | 1 | `max-width` | Login layout stack |
| **768px** | 6 | `max-width` | Tablet/mobile breakpoint |
| **900px** | 1 | `max-width` | Metric grid 2-column |

**Total unique breakpoints:** 7

---

### 6.2 Issues

1. **Inconsistent naming:** No tokens defined (values hardcoded)
2. **Too many breakpoints:** 7 variants for minor adjustments
3. **Mobile-first gaps:** 375px/376px is a 1px range (fragile)
4. **No tablet range:** 768px is both "mobile" and "tablet"

---

### 6.3 Proposed Standardized Breakpoints

```css
/* Court Breakpoint System */
--bp-xs:  360px;  /* Small phones (consolidates 375px) */
--bp-sm:  640px;  /* Large phones / phablets */
--bp-md:  768px;  /* Tablets */
--bp-lg:  1024px; /* Laptops */
--bp-xl:  1440px; /* Desktops */
```

**Migration:**
- 375px, 376px → `--bp-xs` (360px)
- 500px, 600px → `--bp-sm` (640px)
- 640px, 768px → `--bp-md` (768px)
- 900px → `--bp-lg` (1024px)

**Usage:**
```css
@media (max-width: 768px) { /* OLD */ }
@media (max-width: var(--bp-md)) { /* NEW */ }
```

---

## 7. Z-INDEX MAP

### 7.1 Current Z-Index Values

| Element | z-index | File | Context | Conflicts? |
|---------|---------|------|---------|------------|
| **Layout** | | | | |
| `.blob-decoration` | 0 | globals.css:380 | Background blobs (HIDDEN by Court) | NO |
| `.page-header` | 1 | globals.css:409 | Page title | NO |
| `.card` | 1 | globals.css:457 | Card surfaces | NO |
| `.mobile-topbar` | 100 | globals.css:365 | Sticky mobile header | NO |
| `.sidebar` | 200 | globals.css:212 | Fixed sidebar | NO |
| **Tables** | | | | |
| `.payment-table thead` | 1 | globals.css:1998, 2004 | Sticky table headers | NO |
| `.payment-table th:first-child` | 2 | globals.css:1986 | Sticky first column (body) | NO |
| `.payment-table thead th:first-child` | 3 | globals.css:1991, 2008 | Sticky first column (header) | CONFLICT with sidebar? |
| **Popovers** | | | | |
| `.cell-popover` | 999 | globals.css:1746 | Cell tooltips | POTENTIAL |
| **Podium** | | | | |
| `.podium-3rd` | 1 | globals.css:1418 | 3rd place card | NO |
| `.podium-2nd` | 5 | globals.css:1387 | 2nd place card | NO |
| `.podium-1st` | 10 | globals.css:1356 | 1st place card | NO |
| **Confetti** | | | | |
| `.confetti-layer` | 9999 | globals.css:1680 | Celebration overlay | NO (intentionally top) |

---

### 7.2 Z-Index Scale (Proposed)

```css
/* Court Z-Index Scale */
--z-base:      0;    /* Background elements */
--z-content:   1;    /* Default content layer */
--z-sticky:    10;   /* Sticky headers, table columns */
--z-header:    100;  /* Mobile topbar, fixed headers */
--z-sidebar:   200;  /* Fixed sidebars, drawers */
--z-dropdown:  500;  /* Dropdowns, select menus */
--z-popover:   1000; /* Tooltips, popovers */
--z-modal:     2000; /* Modals, dialogs */
--z-toast:     5000; /* Notifications, toasts */
--z-confetti:  9999; /* Celebration effects (always top) */
```

---

### 7.3 Conflicts & Recommendations

**CONFLICT DETECTED:**
- `.payment-table thead th:first-child` (z-index: 3) sits ABOVE `.page-header` (z-index: 1) and `.card` (z-index: 1)
- `.cell-popover` (z-index: 999) sits BELOW `.confetti-layer` (9999) but ABOVE sidebar (200)

**Risk Assessment:**
- **LOW RISK:** Current layering works because elements don't overlap
- **MEDIUM RISK:** If a modal is added (no current modal z-index), it might conflict with `.confetti-layer`
- **HIGH RISK:** `.cell-popover` (999) could overlap a future modal/dropdown if not using the scale

**Recommendation:**
```css
/* Update existing */
.sidebar { z-index: var(--z-sidebar); }          /* 200 → 200 */
.mobile-topbar { z-index: var(--z-header); }     /* 100 → 100 */
.cell-popover { z-index: var(--z-popover); }     /* 999 → 1000 */
.confetti-layer { z-index: var(--z-confetti); }  /* 9999 → 9999 */
.payment-table thead { z-index: var(--z-sticky); } /* 1 → 10 */
.payment-table thead th:first-child { z-index: calc(var(--z-sticky) + 1); } /* 3 → 11 */
```

---

## 8. KEYFRAMES & ANIMATIONS

### 8.1 Animations Defined

| Name | Duration | Purpose | Uses Old Colors? |
|------|----------|---------|------------------|
| `fadeIn` | 0.3s | Fade + slide down | NO |
| `slideIn` | 0.2s | Slide right + fade | NO |
| **`pulsePrimary`** | 1.8s | Purple glow pulse | **YES - CONFLICT** |
| `trophy` | 1s | Float up/down | NO |
| `fall` | Linear | Confetti drop | NO |
| `shimmer` | 1.5s | Loading shimmer | **PARTIAL** |
| `blobFloat` | 8s | Blob movement | NO (blobs hidden) |
| `liveDot` | 1.4s | Live indicator pulse | NO |

---

### 8.2 Animation Classes

```css
.anim-fade    { animation: fadeIn .3s ease both; }
.anim-slide   { animation: slideIn .2s ease both; }
.anim-pulse   { animation: pulsePrimary 1.8s infinite; }
.anim-trophy  { animation: trophy 1s ease infinite alternate; }
.anim-fall    { animation: fall linear forwards; }
```

---

### 8.3 CRITICAL ISSUE: `pulsePrimary` Animation

**Location:** Line 120
**Current:**
```css
@keyframes pulsePrimary {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,.35); }
  50%      { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
}
```

**Problem:** Uses purple `rgba(124,58,237,*)` but `--primary` is now `--ink` (black).

**Used by:**
- `.anim-pulse` class (line 129)
- `.score-tap-btn.can-win` (line 1077)
- `.bracket-slot.current` (line 1240)

**Court-Compatible Fix:**
```css
@keyframes pulsePrimary {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22,23,15,.2); }  /* --ink with opacity */
  50%      { box-shadow: 0 0 0 8px rgba(22,23,15,0); }
}
```

**Alternative (use volt for emphasis):**
```css
@keyframes pulseVolt {
  0%, 100% { box-shadow: 0 0 0 0 rgba(203,241,74,.4); }  /* --volt */
  50%      { box-shadow: 0 0 0 8px rgba(203,241,74,0); }
}
```

---

### 8.4 `shimmer` Animation (Skeleton Loader)

**Location:** Line 123
**Current:**
```css
@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position: 200% center; }
}
```

**Used by (line 165-175):**
```css
.skeleton {
  background: var(--bg-soft);
  background-image: linear-gradient(
    90deg,
    var(--bg-soft) 0%,
    rgba(124, 58, 237, 0.08) 50%,  /* PURPLE! */
    var(--bg-soft) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

**Problem:** Shimmer uses purple highlight.

**Court Fix:**
```css
.skeleton {
  background: var(--bg-soft);
  background-image: linear-gradient(
    90deg,
    var(--bg-soft) 0%,
    rgba(22,23,15,0.04) 50%,  /* --ink subtle */
    var(--bg-soft) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

---

## 9. MIGRATION TABLE (Current → Court)

### 9.1 Color Migrations

| Current Value | Proposed Token | Visual Change? | Effort | Priority |
|---------------|----------------|----------------|--------|----------|
| **Variables** | | | | |
| `--primary` | `--ink` | None (already aliased) | Low | P1 |
| `--grad-primary` | `--ink` | None (already aliased) | Low | P1 |
| `--accent` | `--volt` | None (already aliased) | Low | P1 |
| `--text`, `--text2`, `--text3` | `--ink`, `--muted` | None | Low | P1 |
| `--bg`, `--bg-card` | `--paper`, `--card` | None | Low | P1 |
| **Hardcoded** | | | | |
| `rgba(124,58,237,*)` (47×) | `--ink` or remove | YES (purple → black/none) | High | P0 |
| `#D1C9F5` (scrollbar) | `--line-strong` | YES (purple → neutral) | Low | P2 |
| `#A78BFA` (scrollbar hover) | `--muted` | YES (purple → neutral) | Low | P2 |
| `rgba(236,72,153,*)` (8×) | Remove (gradients) | YES (pink → none) | Medium | P1 |
| `rgba(14,165,233,*)` (3×) | Remove (gradients) | YES (sky → none) | Medium | P1 |

---

### 9.2 Spacing Migrations

| Current | Proposed | Count | Effort |
|---------|----------|-------|--------|
| 1px-4px | `--s-0` (4px) | 26 | Medium |
| 5px-10px | `--s-1` (8px) | 38 | High |
| 11px-18px | `--s-2` (16px) | 35 | High |
| 19px-28px | `--s-3` (24px) | 13 | Medium |
| 40px | `--s-5` (40px) | 2 | Low |
| 80px | `--s-10` (80px) | 2 | Low |
| 100px | `--s-12` (96px) | 1 | Low |

**Total:** 117 spacing changes

---

### 9.3 Typography Migrations

| Current | Proposed | Count | Effort |
|---------|----------|-------|--------|
| 9px-11px | `--fs-xs` (11px) | 40 | High |
| 12px-13px | `--fs-sm` (13px) | 35 | High |
| 14px-15px | `--fs-base` (15px) | 21 | Medium |
| 16px-18px | `--fs-md` (18px) | 7 | Low |
| 20px-24px | `--fs-lg` (24px) | 10 | Medium |
| 26px-36px | `--fs-xl` (36px) | 10 | Medium |
| 40px-52px | `--fs-2xl` (52px) | 6 | Low |

**Total:** 129 font-size changes

---

### 9.4 Border Radius Migrations

| Current | Proposed | Count | Effort |
|---------|----------|-------|--------|
| `border-radius: 50%` | `var(--r-full)` | 8 | Low |
| `border-radius: 20px` | `var(--r-pill)` | 7 | Low |
| `border-radius: 8px` | `var(--r-md)` | 3 | Low |
| `border-radius: 10px` | `var(--r-md)` (8px) | 3 | Low |

**Total:** 21 radius changes

---

### 9.5 Shadow Migrations

| Current | Proposed | Count | Effort |
|---------|----------|-------|--------|
| Purple shadows | Remove or `--ink` | 14 | High |
| Generic shadows | `--border` | ~15 | Medium |
| Status shadows | Keep | 6 | None |
| Functional shadows | Evaluate | 2 | Low |

**Total:** 37 shadow changes

---

## 10. CRITICAL DESIGN CONFLICTS (IMMEDIATE ATTENTION)

### Priority 0 (BREAKING)

1. **pulsePrimary Animation**
   - **Issue:** Uses purple `rgba(124,58,237,*)` but `--primary` is `--ink`
   - **Impact:** Score buttons, brackets show purple glow but should be black/volt
   - **Fix:** Rewrite animation to use `--ink` or `--volt`
   - **Files:** `globals.css:120`, `globals.css:1077`, `globals.css:1240`

2. **Focus States**
   - **Issue:** Hardcoded purple shadows on button/input focus
   - **Impact:** Keyboard nav shows purple ring but should be black
   - **Fix:** Replace `rgba(124,58,237,*)` with `rgba(22,23,15,*)`
   - **Files:** `globals.css:147`, `globals.css:154`, `globals.css:621`

3. **Skeleton Loader**
   - **Issue:** Shimmer uses purple highlight
   - **Impact:** Loading states show purple flash
   - **Fix:** Replace with `--ink` subtle overlay
   - **Files:** `globals.css:170`

---

### Priority 1 (HIGH)

4. **Gradient Removal**
   - **Issue:** 27 gradient variables point to flat colors but gradients still in CSS
   - **Impact:** Buttons, badges, nav links show gradient backgrounds
   - **Fix:** Remove all `linear-gradient()` with `rgba(124,58,237,*)` or `rgba(236,72,153,*)`
   - **Files:** `globals.css` (lines 289, 298, 562, 677, 703, 929, 951, 1080, 1174, 1349, 1543, 1691, 1709)

5. **Scrollbar Colors**
   - **Issue:** Purple scrollbar (`#D1C9F5`, `#A78BFA`)
   - **Impact:** Browser scrollbars show purple
   - **Fix:** Replace with `--line-strong`, `--muted`
   - **Files:** `globals.css:110-111`

---

### Priority 2 (MEDIUM)

6. **Off-Scale Spacing**
   - **Issue:** 56% of spacing values don't use the 8px grid
   - **Impact:** Visual rhythm broken, inconsistent gaps
   - **Fix:** Migrate to `--s-*` tokens
   - **Files:** `globals.css` (117 instances)

7. **Font Size Chaos**
   - **Issue:** 52 unique font sizes (10px-15px range has 6 variants)
   - **Impact:** No typographic hierarchy
   - **Fix:** Consolidate to 9-step type scale
   - **Files:** `globals.css` (129 instances)

---

## Summary Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| **Total Colors** | 40+ | 12 Court tokens + 27 legacy aliases + hardcoded |
| **Hardcoded Purple** | 47 instances | CONFLICT: Must replace with `--ink`/`--volt` |
| **Gradient Variables** | 4 | All deprecated, pointing to flat colors |
| **Legacy Aliases** | 27 variables | DELETE after migration |
| **Final Palette Size** | ~15 colors | Down from 40+ |
| **Spacing Values** | 134 total | 59 on-scale (44%), 75 off-scale (56%) |
| **Off-Scale Spacing** | 75 instances | Need `--s-*` tokens |
| **Font Sizes** | 52 unique | Consolidate to 9-step scale |
| **Font Weights** | 6 weights | Consolidate to 4 (400/500/700/800) |
| **Border Radii** | 9 unique | Consolidate to 7 tokens |
| **Shadows** | 37 total | 14 purple (DELETE), 6 status (KEEP), 17 generic (REMOVE) |
| **Breakpoints** | 7 unique | Consolidate to 5 standardized |
| **Z-Index Layers** | 13 values | Standardize to 10-step scale |
| **Animations** | 8 keyframes | 2 use old colors (pulsePrimary, shimmer) |

---

## Recommendations

### Phase 1: Critical Fixes (Week 1)
1. Fix `pulsePrimary` animation (purple → ink/volt)
2. Update focus states (purple shadows → ink)
3. Fix skeleton loader shimmer (purple → ink)
4. Remove all purple hardcoded colors (47 instances)

### Phase 2: Token Consolidation (Week 2)
5. Delete 27 legacy alias variables
6. Add missing Court tokens (`--bg-soft`, `--bg-alt`, spacing, radius)
7. Migrate all colors to Court tokens
8. Remove gradient CSS (13 instances)

### Phase 3: Spacing & Typography (Week 3)
9. Expand spacing scale to 10 steps
10. Consolidate to 9-step type scale
11. Migrate 117 spacing values
12. Migrate 129 font-size values

### Phase 4: Polish (Week 4)
13. Standardize border radii (7 tokens)
14. Remove generic shadows (17 instances)
15. Standardize breakpoints (5 tokens)
16. Implement z-index scale (10 steps)

---

**END OF AUDIT**

Generated by css-analyst agent on 2026-07-23
