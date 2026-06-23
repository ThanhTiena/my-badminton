# Court Migration - Quick Start

## 🚀 Fastest Implementation Path

Choose your approach:

## Option A: Copy-Paste Reference Code (Fastest - 15 min)

### Step 1: RosterScreen
1. Open `/COURT_MIGRATION_SCREENS.tsx`
2. Find the `RosterScreen` function (starts at line ~13)
3. Copy the entire `return (...)` block
4. Open `/pages/index.tsx`
5. Find `RosterScreen` function (line ~113)
6. Replace the `return (...)` block with the copied code
7. Save

### Step 2: SetupScreen
1. In `/COURT_MIGRATION_SCREENS.tsx`, find `SetupScreen` (line ~229)
2. Copy the entire `return (...)` block
3. In `/pages/index.tsx`, find `SetupScreen` (line ~308)
4. Replace the `return (...)` block
5. Save

### Step 3: PaymentScreen
1. Read the PaymentScreen section in `/COURT_MIGRATION_SCREENS.tsx` (line ~480)
2. This shows the pattern - apply to the summary tab
3. For full migration, use the detailed guide below
4. Save

### Step 4: Test
```bash
npm run build
npm run dev
```

Visit http://localhost:3000 and test each screen.

---

## Option B: Guided Step-by-Step (Thorough - 45 min)

### Phase 1: RosterScreen Header
1. Open `/pages/index.tsx`, line 176
2. Replace:
```tsx
<p className="page-title">👥 Player Roster</p>
<p className="page-sub">Manage your permanent player list. Add once — they're saved forever.</p>
```

With:
```tsx
<p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.5px', margin: 0, marginBottom: 8, color: 'var(--ink)' }}>
  Player Roster
</p>
<p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--muted)', marginBottom: 32 }}>
  Manage your permanent player list. Add once — they're saved forever.
</p>
```

3. Save and test: `npm run dev`
4. Verify header looks correct

### Phase 2: RosterScreen Add Button (THE VOLT ACTION)
1. Find line 209
2. Replace:
```tsx
<Btn variant="primary" full disabled={saving} onClick={add}>
  {saving ? 'Adding…' : '➕ Add Player'}
</Btn>
```

With:
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

3. Save and test - you should see a bright volt button!

### Phase 3: Continue with Guide
For remaining changes, follow `/COURT_MIGRATION_GUIDE.md` section by section.

---

## Option C: Component-Based (Cleanest - 60 min)

### Step 1: Import Court Components
1. Open `/pages/index.tsx`
2. Add at top (after existing imports):
```tsx
import { CourtButton, CourtBadge, CourtPlayerTile, CourtCard, CourtCardTitle } from '@/components/court-screens';
```

### Step 2: Replace Components Gradually
- Replace `<Btn variant="primary">` → `<CourtButton variant="volt">`
- Replace `<Badge group={...}>` → `<CourtBadge group={...}>`
- Replace player cards → `<CourtPlayerTile>`
- Replace `<Card>` → `<CourtCard>`
- Replace `<CardTitle>` → `<CourtCardTitle>`

### Step 3: Test Each Replacement
After each component swap, run `npm run dev` and verify.

---

## 🎯 Validation Script

After migration, run this quick check:

```bash
# Build check
npm run build

# If successful, check for Court patterns:
grep -n "var(--volt)" pages/index.tsx    # Should find ONE per screen
grep -n "var(--ink)" pages/index.tsx     # Should find multiple
grep -n "var(--font-mono)" pages/index.tsx  # Headers/labels
grep -n "tabular-nums" pages/index.tsx   # All numbers
```

Expected output:
- **RosterScreen:** 1 volt button (Add Player)
- **SetupScreen:** 1 volt button (Start Tournament)
- **PaymentScreen:** Context-dependent volt actions

---

## 🐛 Troubleshooting

### Build Errors

**Error:** `Cannot find module '@/components/court-screens'`
**Fix:** Ensure `/components/court-screens.tsx` exists

**Error:** `Property 'style' does not exist on type...`
**Fix:** Add `React.CSSProperties` type to style objects

**Error:** `'var(--volt)' is not a valid color`
**Fix:** Ensure CSS tokens are loaded (check `styles/globals.css`)

### Visual Issues

**Issue:** Volt button not showing
**Fix:** Check CSS custom properties are loaded:
```tsx
console.log(getComputedStyle(document.documentElement).getPropertyValue('--volt'));
// Should output: #CBF14A
```

**Issue:** Fonts not loading
**Fix:** Verify Google Fonts import in `styles/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
```

**Issue:** Borders not showing
**Fix:** Ensure `--line` token exists:
```css
--line: #E0DDD0;
```

---

## 📋 Pre-Flight Checklist

Before starting:
- [ ] Backup `pages/index.tsx` (copy to `index.tsx.backup`)
- [ ] Ensure Court tokens are in `styles/globals.css`
- [ ] Fonts are imported (Archivo + Space Mono)
- [ ] App builds successfully: `npm run build`
- [ ] You have `/COURT_MIGRATION_GUIDE.md` open
- [ ] You have `/COURT_MIGRATION_SCREENS.tsx` open

---

## 🎬 Recommended Order

1. ✅ **Start with RosterScreen** (simplest, most visual impact)
   - Takes ~15 min
   - High confidence builder
   - Clear before/after

2. ✅ **Then SetupScreen** (similar patterns)
   - Takes ~20 min
   - Reinforces patterns from RosterScreen
   - Practice with tabs

3. ✅ **Finally PaymentScreen** (most complex)
   - Takes ~45 min
   - Uses all learned patterns
   - Biggest UX improvement ("lead with the answer")

Total time: ~80 min for all three screens

---

## 🎨 Visual Checklist (Browser Testing)

### RosterScreen
- [ ] Title is large, bold, NO emoji
- [ ] "ADD NEW PLAYER" is small, uppercase, Space Mono
- [ ] PRO/BEGINNER tabs have ink active state
- [ ] Add Player button is BRIGHT VOLT (lime green)
- [ ] Player cards have monogram squares (not circles)
- [ ] PRO badges are ink background with volt text
- [ ] BEG badges are outline only
- [ ] Stats use monospace font with aligned numbers

### SetupScreen
- [ ] Title is large, bold, NO emoji
- [ ] Player tiles have ink borders when selected
- [ ] Game type tabs (Singles/Doubles) use ink active state
- [ ] Format buttons (Elimination/Round Robin) same treatment
- [ ] Start Tournament button is BRIGHT VOLT
- [ ] Summary numbers align (tabular)

### PaymentScreen
- [ ] Title is large, bold, NO emoji
- [ ] Top card shows TOTAL COLLECTED / TOTAL OWED (ink bg)
- [ ] Table headers are uppercase Space Mono
- [ ] Amount owed is LARGE (20px+) and prominent
- [ ] PAID badges are ink fill with volt text
- [ ] DUE badges are red outline (#C24226)
- [ ] All money amounts align perfectly (tabular)

---

## 💡 Pro Tips

1. **Work in one file at a time** - Don't jump between screens
2. **Test frequently** - Run `npm run dev` after each major change
3. **Use VSCode's search** - Cmd+F to find old patterns quickly
4. **Keep original code** - Comment out old code before deleting
5. **Browser DevTools** - Inspect element to verify CSS variables
6. **Take screenshots** - Before/after for documentation

---

## 🆘 Need Help?

Check these files in order:
1. `/QUICK_START.md` (you are here)
2. `/MIGRATION_SUMMARY.md` (high-level overview)
3. `/COURT_MIGRATION_GUIDE.md` (detailed line-by-line)
4. `/COURT_MIGRATION_SCREENS.tsx` (complete reference code)
5. `/components/court-screens.tsx` (reusable components)
6. `/documents/design_handoff_court/README.md` (design system spec)

---

**Ready?** Pick an option above and start migrating! 🎨

**Estimated total time:** 15-80 minutes depending on approach
**Difficulty:** ⭐⭐⭐ (Intermediate - requires attention to detail)
**Reward:** Professional, cohesive design system across all screens
