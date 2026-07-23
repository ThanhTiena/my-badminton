# Court Design System - Screen Migration Guide

## Overview
This guide shows exactly how to migrate **RosterScreen**, **SetupScreen**, and **PaymentScreen** from the current purple/gradient design to the Court design system (ink + paper + volt).

**Court Design Principles:**
- **One volt action per screen maximum** (the hero button)
- **No gradients** - flat fills only
- **Archivo** for UI text (headings 800-900)
- **Space Mono** for labels/headers (uppercase, +2px tracking)
- **Tabular numerals** on all numbers/money
- **4px corners** everywhere
- **Ink monograms** for PRO, light monograms for BEG
- **PRO badge**: ink fill + volt text
- **BEG badge**: ink outline
- **PAID badge**: ink fill + volt text
- **DUE badge**: loss color (#C24226) outline

---

## 1. RosterScreen (Players) Migration

### File Location
`pages/index.tsx` lines 113-306

### Changes Required

#### A. Page Header
**BEFORE:**
```tsx
<p className="page-title">👥 Player Roster</p>
<p className="page-sub">Manage your permanent player list. Add once — they're saved forever.</p>
```

**AFTER:**
```tsx
<p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.5px', margin: 0, marginBottom: 8, color: 'var(--ink)' }}>
  Player Roster
</p>
<p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--muted)', marginBottom: 32 }}>
  Manage your permanent player list. Add once — they're saved forever.
</p>
```

#### B. "Add New Player" Card

**Card Header - BEFORE:**
```tsx
<CardTitle>➕ Add New Player</CardTitle>
```

**Card Header - AFTER:**
```tsx
<div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
  ADD NEW PLAYER
</div>
```

**Pro/Beg Tabs - BEFORE:**
```tsx
style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1px solid ${group === g ? (g === 'pro' ? 'var(--pro)' : 'var(--beg)') : 'var(--border)'}`, background: group === g ? (g === 'pro' ? 'rgba(245,158,11,.15)' : 'rgba(34,197,94,.15)') : 'var(--bg3)', color: group === g ? (g === 'pro' ? 'var(--pro)' : 'var(--beg)') : 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
```
```tsx
{g === 'pro' ? '🥇 Pro' : '🌱 Beginner'}
```

**Pro/Beg Tabs - AFTER (ink active state, no gradient):**
```tsx
style={{
  flex: 1, padding: '9px 0', borderRadius: '4px',
  border: `1.5px solid ${group === g ? 'var(--ink)' : 'var(--line)'}`,
  background: group === g ? 'var(--ink)' : 'transparent',
  color: group === g ? 'var(--volt)' : 'var(--muted)',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
  fontFamily: 'var(--font-display)',
}}
```
```tsx
{g === 'pro' ? 'PRO' : 'BEGINNER'}
```

**Add Button - BEFORE:**
```tsx
<Btn variant="primary" full disabled={saving} onClick={add}>
  {saving ? 'Adding…' : '➕ Add Player'}
</Btn>
```

**Add Button - AFTER (ONE volt action):**
```tsx
<button
  style={{
    width: '100%',
    padding: '12px 22px',
    background: 'var(--volt)',
    color: 'var(--ink)',
    border: 'none',
    borderRadius: '4px',
    fontSize: 16,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.6 : 1,
  }}
  disabled={saving}
  onClick={add}
>
  {saving ? 'Adding…' : 'Add Player'}
</button>
```

#### C. "Roster Stats" Card

**Header - BEFORE:**
```tsx
<CardTitle>📊 Roster Stats</CardTitle>
```

**Header - AFTER:**
```tsx
<div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
  ROSTER STATS
</div>
```

**Stats Rows - BEFORE:**
```tsx
['Total Players', players.length, undefined],
['🥇 Pro Players', pros.length, 'var(--pro)'],
['🌱 Beginners',   begs.length, 'var(--beg)'],
```

**Stats Rows - AFTER (no emoji, tabular-nums):**
```tsx
['Total Players', players.length],
['Pro Players', pros.length],
['Beginners',   begs.length],
```
```tsx
<div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
  <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--muted)' }}>{label}</span>
  <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{String(val)}</span>
</div>
```

**Start Button - BEFORE:**
```tsx
<Btn variant="primary" full size="lg" onClick={onDone}>🚀 Start a Tournament →</Btn>
```

**Start Button - AFTER (ink, not volt - secondary action):**
```tsx
<button
  style={{
    width: '100%',
    padding: '15px 28px',
    background: 'var(--ink)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: 18,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    cursor: 'pointer',
  }}
  onClick={onDone}
>
  Start a Tournament →
</button>
```

#### D. Player Grid

**Grid Header - BEFORE:**
```tsx
<CardTitle>🏸 All Players ({players.length})</CardTitle>
```

**Grid Header - AFTER:**
```tsx
<div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
  ALL PLAYERS ({players.length})
</div>
```

**Player Cards - BEFORE (uses `.player-card`, `.pc-avatar`, `.pc-badge` classes):**
```tsx
<div key={id} className="player-card anim-slide">
  <div className="pc-body" style={{ cursor: onOpenProfile ? 'pointer' : 'default' }} onClick={() => onOpenProfile?.(p.name)}>
    <div className={`pc-avatar ${p.group}`}>
      {p.name.trim().charAt(0)}
    </div>
    <div className="pc-info">
      <div className="name">{p.name}</div>
      <span className={`pc-badge ${p.group}`}>{p.group === 'pro' ? '🥇 Pro' : '🌱 Beginner'}</span>
      <div className="stats">
        <span className="stat-chip">🏆 {p.stats.titles}</span>
        <span className="stat-chip">{p.stats.wins}W</span>
        <span className="stat-chip">{p.stats.losses}L</span>
      </div>
    </div>
  </div>
  {/* Action buttons... */}
</div>
```

**Player Cards - AFTER (monogram tiles, Space Mono stats):**
```tsx
<div
  key={id}
  style={{
    background: 'var(--card)',
    border: '1px solid var(--line)',
    borderRadius: '4px',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: onOpenProfile && !isEditing ? 'pointer' : 'default',
  }}
  onClick={() => !isEditing && onOpenProfile?.(p.name)}
>
  {/* Monogram */}
  <div
    style={{
      width: 46,
      height: 46,
      borderRadius: '4px',
      background: pro ? 'var(--ink)' : '#ECEAE0',
      color: pro ? 'var(--volt)' : 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 800,
      flexShrink: 0,
    }}
  >
    {p.name.trim().charAt(0)}
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{p.name}</div>
    {/* Space Mono for stats, tabular-nums */}
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
      {p.stats.wins}W · {p.stats.losses}L · {p.stats.titles} titles
    </div>
  </div>
  {/* PRO badge (ink/volt) or BEG badge (outline) */}
  <span
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      padding: pro ? '4px 9px' : '3px 9px',
      background: pro ? 'var(--ink)' : 'transparent',
      color: pro ? 'var(--volt)' : 'var(--ink)',
      border: pro ? 'none' : '1.5px solid var(--ink)',
      borderRadius: '2px',
    }}
  >
    {pro ? 'PRO' : 'BEG'}
  </span>
</div>
```

---

## 2. SetupScreen Migration

### File Location
`pages/index.tsx` lines 308-506

### Changes Required

#### A. Page Header

**BEFORE:**
```tsx
<p className="page-title">⚙️ Set Up Tournament</p>
<p className="page-sub">Pick who's playing today and choose your format.</p>
```

**AFTER:**
```tsx
<p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.5px', margin: 0, marginBottom: 8, color: 'var(--ink)' }}>
  Set Up Tournament
</p>
<p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--muted)', marginBottom: 32 }}>
  Pick who's playing today and choose your format.
</p>
```

#### B. Player Selection Card

**Header - BEFORE:**
```tsx
<CardTitle>
  👥 Select Players
  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text2)', fontSize: 12 }}>
    {n} selected · <span className="text-pro">{pros} pro</span> · <span className="text-beg">{begs} beg</span>
  </span>
</CardTitle>
```

**Header - AFTER:**
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
    SELECT PLAYERS
  </div>
  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
    {n} selected
  </span>
</div>
```

**Player Selection Tiles - BEFORE (uses `.player-select-item` class):**
```tsx
<button
  className={`player-select-item${sel ? ' selected-pro' : ''}`}
  onClick={() => onTogglePlayer(p)}
  style={{ ... }}
>
  <span className={`checkbox${sel ? ' checked-pro' : ''}`}>
    {sel && <span className="check-mark">✓</span>}
  </span>
  <span className="select-item-name">{p.name}</span>
  <span className="select-item-stats">🏆{p.stats.titles} {p.stats.wins}W</span>
</button>
```

**Player Selection Tiles - AFTER (ink borders, monogram style):**
```tsx
<button
  onClick={() => onTogglePlayer(p)}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: '4px',
    border: `1.5px solid ${sel ? 'var(--ink)' : 'var(--line)'}`,
    background: sel ? 'var(--ink)' : 'transparent',
    color: sel ? 'var(--volt)' : 'var(--ink)',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'left',
    transition: 'all .15s',
  }}
  role="checkbox"
  aria-checked={sel}
  aria-label={`${sel ? 'Deselect' : 'Select'} ${p.name} for tournament`}
>
  <span style={{ fontSize: 18 }}>{sel ? '✓' : ''}</span>
  <span>{p.name}</span>
</button>
```

#### C. Format Card

**Game Type Tabs - BEFORE (uses `.pills` class with gradient):**
```tsx
<div className="pills" style={{ marginBottom: 18 }} role="radiogroup">
  <button className={`pill${state.gameType === t ? ' active' : ''}`} ...>
    {t.charAt(0).toUpperCase() + t.slice(1)}
  </button>
</div>
```

**Game Type Tabs - AFTER (ink active state, no gradient):**
```tsx
<div style={{ display: 'flex', gap: 8, marginBottom: 18 }} role="radiogroup">
  <button
    style={{
      flex: 1,
      padding: '9px 0',
      borderRadius: '4px',
      border: `1.5px solid ${state.gameType === t ? 'var(--ink)' : 'var(--line)'}`,
      background: state.gameType === t ? 'var(--ink)' : 'transparent',
      color: state.gameType === t ? '#fff' : 'var(--muted)',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      transition: 'all .15s',
    }}
    ...
  >
    {t.charAt(0).toUpperCase() + t.slice(1)}
  </button>
</div>
```

**Tournament Format - BEFORE:**
```tsx
<button className={`pill${state.tourneyFormat === v ? ' active' : ''}`} ...>
  {l}
</button>
```

**Tournament Format - AFTER:**
```tsx
<button
  style={{
    padding: '9px 12px',
    borderRadius: '4px',
    border: `1.5px solid ${state.tourneyFormat === v ? 'var(--ink)' : 'var(--line)'}`,
    background: state.tourneyFormat === v ? 'var(--ink)' : 'transparent',
    color: state.tourneyFormat === v ? '#fff' : 'var(--muted)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    textAlign: 'left',
    transition: 'all .15s',
  }}
  ...
>
  {l}
</button>
```

#### D. Summary Card

**Summary Rows - AFTER (tabular-nums):**
```tsx
<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
  <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--muted)' }}>{l}</span>
  <span style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{v}</span>
</div>
```

**Start Button - BEFORE:**
```tsx
<Btn variant="primary" size="lg" full disabled={!enoughPlayers} onClick={onStart}>🚀 Start Tournament</Btn>
```

**Start Button - AFTER (ONE volt action):**
```tsx
<button
  style={{
    width: '100%',
    padding: '15px 28px',
    background: enoughPlayers ? 'var(--volt)' : 'var(--line)',
    color: enoughPlayers ? 'var(--ink)' : 'var(--muted)',
    border: 'none',
    borderRadius: '4px',
    fontSize: 18,
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    cursor: enoughPlayers ? 'pointer' : 'not-allowed',
  }}
  disabled={!enoughPlayers}
  onClick={onStart}
>
  Start Tournament
</button>
```

---

## 3. PaymentScreen Migration

### File Location
`pages/index.tsx` lines 2657-5200+

### Changes Required

#### A. Page Header

**BEFORE:**
```tsx
<p className="page-title" style={{ margin: 0 }}>💰 Payment</p>
<p className="page-sub">Track court & shuttlecock costs, split fairly by smash weight.</p>
```

**AFTER:**
```tsx
<p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.5px', margin: 0, marginBottom: 8, color: 'var(--ink)' }}>
  Payment
</p>
<p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--muted)', marginBottom: 32 }}>
  Track court & shuttlecock costs, split fairly by smash weight.
</p>
```

#### B. Summary Tab - Lead with the Answer

Add this **at the top** of the summary tab content (before the detailed table):

```tsx
{tab === 'summary' && summary && (
  <div>
    {/* Court: Lead with the answer - summary card */}
    <div style={{
      background: 'var(--ink)',
      border: '1px solid var(--ink)',
      borderRadius: '4px',
      padding: '24px 32px',
      marginBottom: 24,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--muted-2)',
          marginBottom: 8,
        }}>
          TOTAL COLLECTED
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 900,
          color: 'var(--volt)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatVND(totalCollected)}
        </div>
      </div>
      <div style={{ width: 2, height: 60, background: 'var(--line)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--muted-2)',
          marginBottom: 8,
        }}>
          TOTAL OWED
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatVND(totalOwed)}
        </div>
      </div>
    </div>

    {/* Existing table content... */}
  </div>
)}
```

#### C. Payment Table Headers

**BEFORE (table headers):**
```tsx
<th style={{
  padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.5px', color: 'var(--text3)', background: 'var(--bg3)',
  borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)',
  ...
}}>
  Player
</th>
```

**AFTER (Space Mono headers):**
```tsx
<th style={{
  fontFamily: 'var(--font-mono)',
  padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '1px', color: 'var(--muted)', background: 'var(--card)',
  borderBottom: '2px solid var(--line)', borderRight: '1px solid var(--line)',
  ...
}}>
  PLAYER
</th>
```

#### D. Inline Breakdown (show court + shuttle costs in row)

**Add columns to the table:**
```tsx
<th style={{
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  textAlign: 'right',
  padding: '12px 8px',
  borderBottom: '2px solid var(--line)',
}}>
  COURT
</th>
<th style={{
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  textAlign: 'right',
  padding: '12px 8px',
  borderBottom: '2px solid var(--line)',
}}>
  SHUTTLE
</th>
<th style={{
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  textAlign: 'right',
  padding: '12px 8px',
  borderBottom: '2px solid var(--line)',
}}>
  AMOUNT OWED
</th>
```

#### E. Amount Owed - Large and Prominent

**BEFORE (in table cell):**
```tsx
<td style={{ textAlign: 'right', padding: '7px 10px', fontSize: 12, ... }}>
  {formatVND(p.totalOwed)}
</td>
```

**AFTER (large, prominent, 20px+, weight 800):**
```tsx
<td style={{
  fontFamily: 'var(--font-display)',
  fontSize: 20,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
  padding: '12px 8px',
  borderBottom: '1px solid var(--line)',
  color: 'var(--ink)',
}}>
  {formatVND(p.totalOwed)}
</td>
```

#### F. PAID / DUE Badges

**BEFORE:**
```tsx
<span className={`badge ${paid ? 'badge-success' : 'badge-warn'}`}>
  {paid ? '✅ Paid' : '⚠ Due'}
</span>
```

**AFTER (PAID: ink/volt, DUE: loss color):**
```tsx
<span style={{
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  padding: paid ? '4px 9px' : '3px 9px',
  background: paid ? 'var(--ink)' : 'transparent',
  color: paid ? 'var(--volt)' : 'var(--loss)',
  border: paid ? 'none' : '1.5px solid var(--loss)',
  borderRadius: '2px',
}}>
  {paid ? 'PAID' : 'DUE'}
</span>
```

---

## Summary of Changes

### RosterScreen
- ✅ Remove emoji from title
- ✅ Archivo 800 for page title
- ✅ Space Mono uppercase labels for card headers
- ✅ Ink active state for Pro/Beg tabs (no gradient)
- ✅ ONE volt action (Add Player button)
- ✅ Monogram tiles with ink (PRO) / light (BEG) backgrounds
- ✅ PRO badge: ink fill + volt text
- ✅ BEG badge: ink outline
- ✅ Space Mono for player stats with tabular-nums
- ✅ 4px corners everywhere

### SetupScreen
- ✅ Remove emoji from title
- ✅ Archivo 800 for page title
- ✅ Space Mono uppercase labels
- ✅ Ink borders for player selection tiles
- ✅ Ink active state for game/format tabs (no gradient)
- ✅ Tabular-nums for summary counts
- ✅ ONE volt action (Start Tournament button)
- ✅ 4px corners everywhere

### PaymentScreen
- ✅ Remove emoji from title
- ✅ Archivo 800 for page title
- ✅ Lead with the answer: TOTAL COLLECTED / TOTAL OWED at top
- ✅ Space Mono headers for table
- ✅ Inline breakdown: court + shuttle columns
- ✅ Amount owed: large (20px+), prominent (weight 800)
- ✅ PAID badge: ink fill + volt text
- ✅ DUE badge: loss color (#C24226) outline
- ✅ Tabular-nums on all money amounts
- ✅ 4px corners everywhere

---

## Implementation Strategy

### Option 1: Manual Replacement
1. Open `pages/index.tsx`
2. Find each screen's return statement
3. Replace sections according to this guide
4. Test in browser after each screen

### Option 2: Scripted Migration
Use the provided `COURT_MIGRATION_SCREENS.tsx` file as reference and copy the return statements for each function.

### Option 3: Incremental
1. Start with RosterScreen header only
2. Test and verify
3. Continue with one section at a time
4. Run `npm run build` after each major section

---

## Verification Checklist

After migration, verify:

- [ ] No emojis in page titles
- [ ] All card headers use Space Mono uppercase
- [ ] Only ONE volt button per screen
- [ ] All numbers use `fontVariantNumeric: 'tabular-nums'`
- [ ] PRO badges have ink background + volt text
- [ ] BEG badges have ink outline
- [ ] All corners are 4px (`borderRadius: '4px'`)
- [ ] No gradients anywhere
- [ ] Space Mono for all labels/headers
- [ ] Archivo for all UI text
- [ ] Build succeeds: `npm run build`
- [ ] All screens render correctly in browser

---

## Files Modified

- `/pages/index.tsx` - Main implementation file
- Lines affected:
  - RosterScreen: 113-306
  - SetupScreen: 308-506
  - PaymentScreen: 2657-5200+

---

## Reference Components

See `/documents/design_handoff_court/components/` for reference:
- `Button.tsx` - Court button patterns
- `Badge.tsx` - Court badge patterns
- `PlayerTile.tsx` - Court player tile pattern

## Full Examples

See `/COURT_MIGRATION_SCREENS.tsx` for complete, ready-to-use implementations of all three screens.
