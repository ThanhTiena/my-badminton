# Architecture Decision Framework
## Data-Driven Recommendations for Refactor Strategy

**Generated:** 2026-07-23
**Status:** Awaiting approval before PHASE 1

---

## Executive Summary

Based on comprehensive code analysis, I recommend a **3-phase approach** with clear priorities:

1. **IMMEDIATE (1-2 days):** Fix purple color bleeding + consolidate component system
2. **SHORT-TERM (2-3 weeks):** Complete monolith extraction to `components/ui/` + lazy loading
3. **LONG-TERM (1-2 months):** Migrate to Court design system once stabilized

**Winner:** **Keep `components/ui/` (CSS-based), delete Court primitives**

---

## Question 1: Should I Fix Purple Color Bleeding Immediately?

### **RECOMMENDATION: YES — Fix Immediately (P0 Blocker)**

**Evidence:**
- **34 instances** of `rgba(124,58,237,*)` hardcoded in `styles/globals.css`
- **Visual bug:** Buttons pulse purple instead of volt on game point
- **Design violation:** Court system explicitly removed purple

**Impact Analysis:**
```
File: styles/globals.css (lines affected)
────────────────────────────────────────
120: @keyframes pulsePrimary → Uses purple (should be ink/volt)
147: box-shadow purple → Should be ink
154: box-shadow purple → Should be ink
170: shimmer purple → Should be volt
209: sidebar shadow purple → Remove
285: nav-link hover purple → Should be ink
289: nav-link active purple → Should be ink
298: nav-badge purple → Should be ink
326: admin status purple → Should be ink
564: btn-primary purple → Should be ink (already aliased, but shadows remain)
...and 24 more instances
```

**Fix Effort:**
- **Time:** 1-2 hours
- **Risk:** LOW (CSS only, no logic changes)
- **Files touched:** 1 (`styles/globals.css`)
- **Lines changed:** ~40

**Why Now:**
1. Visible to users (buttons, focus states, animations)
2. Blocks design system audit completion
3. Low risk, high impact
4. Required before creating style guide (PHASE 2)

**Recommended Action:**
✅ **Fix in PHASE 1** (before building style guide)

---

## Question 2: Which Component System Should We Keep?

### **WINNER: `components/ui/` (CSS-based)**

### Comparison Table

| Criteria | `components/ui/` (CSS) | `components/` (Court) | `pages/index.tsx` (Inline) |
|----------|------------------------|----------------------|---------------------------|
| **Production Usage** | ✅ 4 screens | ❌ 0 screens (demos only) | ✅ All 10 remaining screens |
| **File Size** | 4.5KB total | 19.7KB total | 67 lines inline |
| **Lines of Code** | 36-40 per component | 93-106 per component | 15-20 per component |
| **Styling Approach** | CSS classes (reuses globals.css) | Inline styles (duplicates tokens) | CSS classes (same as ui/) |
| **Bundle Impact** | ~2KB (classes only) | ~15KB (styles in JS) | Included in main bundle |
| **Type Safety** | ✅ TypeScript interfaces | ✅ TypeScript interfaces | ⚠️ Inline, no reuse |
| **Maintenance** | Single source (globals.css) | Duplicates CSS variables | Scattered across 6,660 lines |
| **Court Compatible** | ⚠️ Needs token migration | ✅ Already uses Court tokens | ⚠️ Uses legacy classes |
| **Developer Adoption** | ✅ Already used in 4 screens | ❌ Not imported anywhere | ✅ De facto standard |

### Data-Driven Analysis

**1. Usage in Production:**
```typescript
// components/ui/ — USED in 4 extracted screens
import { Btn, Card, Badge } from '@/components/ui';
- RosterScreen.tsx ✅
- SetupScreen.tsx ✅
- ChampionScreen.tsx ✅
- TrainingScreen.tsx ✅

// components/ (Court) — ONLY in demos
import { Button, Badge } from '@/components';
- court-demo.tsx (demo page, not production)
- COURT_COMPONENTS_DEMO.tsx (reference implementation)
- __test_import__.tsx (test file)

// pages/index.tsx — Used in 10 remaining screens (inline)
function Btn() { ... } // 67 lines, duplicates components/ui/
```

**2. Bundle Size Impact:**
```
Current (all 3 systems loaded):
  components/ui/: 4.5KB
  components/ (Court): 19.7KB
  pages/index.tsx inline: ~3KB
  TOTAL: 27.2KB

After cleanup (keep ui/):
  components/ui/: 4.5KB
  SAVINGS: 22.7KB (83% reduction)

After cleanup (keep Court):
  components/: 19.7KB
  MIGRATION COST: 4 screens need rewrites
  SAVINGS: 7.5KB (28% reduction)
```

**3. Migration Effort:**

| Keep `components/ui/` | Keep `components/` (Court) |
|----------------------|---------------------------|
| ✅ 4 screens already using it | ❌ 0 screens using it |
| ✅ Delete Court primitives (5 files) | ❌ Rewrite 4 screens to use Court |
| ✅ Extract 10 remaining screens → import from `ui/` | ❌ Extract 10 screens → import from Court |
| ⚠️ Migrate `ui/` to Court tokens (40 lines) | ✅ Already uses Court tokens |
| **TOTAL:** 1 day + token migration | **TOTAL:** 2-3 days + screen rewrites |

**4. Developer Experience:**

```typescript
// components/ui/ — Simple, CSS-first
<Btn variant="primary" onClick={handleClick}>
  Save Changes
</Btn>
// → Renders: <button class="btn btn-primary">Save Changes</button>
// → Styles from globals.css (shared with 100+ other elements)

// components/ (Court) — Verbose, inline styles
<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>
// → Renders: <button style={{ background: 'var(--ink)', color: '#fff', ... }}>
// → Duplicates CSS variables as inline styles (larger bundle)
```

**5. Court Design System Compatibility:**

Both systems can support Court tokens:

```css
/* components/ui/ migration (1 day) */
.btn-primary {
  background: var(--ink);  /* was: var(--grad-primary) */
  color: #fff;
}

/* components/ (Court) — already done */
<Button style={{ background: 'var(--ink)' }} />
```

**The difference:** `ui/` centralizes styles in CSS (easier to theme), Court inlines them (harder to change globally).

---

### **RECOMMENDATION: Keep `components/ui/`, Delete Court Primitives**

**Why:**
1. ✅ **Already adopted** — 4 screens using it vs 0 for Court
2. ✅ **Smaller bundle** — 4.5KB vs 19.7KB (83% savings)
3. ✅ **Faster migration** — 1 day vs 2-3 days
4. ✅ **CSS-first architecture** — Aligns with globals.css approach
5. ✅ **Proven pattern** — Works with existing codebase

**Action Plan:**
1. Keep `components/ui/` as the standard component library
2. Migrate `ui/` components to use Court tokens (40 line change in globals.css)
3. Delete Court primitives: `components/{Button,Badge,PlayerTile,StatCard}.tsx`
4. Delete demo files: `components/{court-screens,COURT_COMPONENTS_DEMO,__test_import__}.tsx`
5. Extract 10 remaining screens from `pages/index.tsx` → import from `components/ui/`
6. Remove inline component definitions from `pages/index.tsx` (lines 50-98)

**Total Savings:**
- **Code:** 342 lines deleted (Court primitives) + 67 lines (inline components) = 409 lines
- **Files:** 7 files deleted
- **Bundle:** 22.7KB reduction

---

## Question 3: Design System Migration Strategy

### **RECOMMENDATION: Hybrid Approach (CSS-First with Court Tokens)**

**Strategy:**
```
Phase 1: Consolidate Components (Week 1)
  ├─ Keep components/ui/ (CSS-based)
  ├─ Delete components/ (Court primitives)
  └─ Remove inline components from pages/index.tsx

Phase 2: Tokenize Existing CSS (Week 1-2)
  ├─ Replace hardcoded purple → Court tokens (ink/volt)
  ├─ Migrate components/ui/ classes to use Court variables
  ├─ Update globals.css animations (pulsePrimary → volt)
  └─ NO visual changes (1:1 token replacement)

Phase 3: Extract Remaining Screens (Week 2-5)
  ├─ Extract 10 screens from pages/index.tsx
  ├─ All screens import from components/ui/
  ├─ Implement lazy loading + code splitting
  └─ Target: pages/index.tsx < 500 lines

Phase 4: Style Guide & Testing (Week 6)
  ├─ Build /styleguide page with all components
  ├─ Screenshot testing at 7 breakpoints
  ├─ Fix layout bugs identified
  └─ Document component API

Phase 5: Optimization (Week 7-8)
  ├─ React.memo() for expensive components
  ├─ Bundle analysis + code splitting
  ├─ Performance testing (LCP, INP, CLS)
  └─ Final documentation
```

**Why This Approach:**
- ✅ **No rewrites** — Builds on existing work
- ✅ **Incremental** — Can stop at any phase
- ✅ **Proven** — CSS-first is working (4 screens extracted)
- ✅ **Court compatible** — Tokens work with CSS classes
- ✅ **Low risk** — Gradual migration with testing gates

---

## Immediate Next Steps (Post-Approval)

### Week 1 Actions:

**Day 1: Fix Purple Bleeding (2 hours)**
```bash
# Replace 34 instances of rgba(124,58,237,*) in styles/globals.css
# Update animations: pulsePrimary, shimmer, gradient backgrounds
# Test: Visit each page, verify no purple glows remain
```

**Day 1-2: Consolidate Components (4 hours)**
```bash
# Delete Court primitives (7 files, 19.7KB)
rm components/{Button,Badge,PlayerTile,StatCard,court-screens,COURT_COMPONENTS_DEMO,__test_import__}.tsx

# Update components/ui/ to use Court tokens
# Migrate .btn-primary, .badge-pro classes in globals.css

# Remove inline components from pages/index.tsx (lines 50-98)

# Verify: npm run build passes, all 4 extracted screens still work
```

**Day 3-5: Documentation (8 hours)**
```bash
# Update docs/REFACTORING_PROGRESS.md with new strategy
# Create component migration guide (ui/ component API)
# Update ARCHITECTURE-AUDIT.md with consolidated system
```

---

## Success Metrics

### Immediate (Week 1):
- [ ] Zero purple colors in production (0 instances of `rgba(124,58,237,*)`)
- [ ] Single component system (`components/ui/` only)
- [ ] 22.7KB bundle size reduction
- [ ] All existing screens still functional

### Short-Term (Week 6):
- [ ] `pages/index.tsx` < 500 lines (from 6,660)
- [ ] 14 screens extracted to `components/`
- [ ] Lazy loading implemented (40% bundle reduction)
- [ ] /styleguide page with all components

### Long-Term (Week 8):
- [ ] LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Zero layout bugs at 7 breakpoints
- [ ] Complete documentation (5 guides)
- [ ] Design system ready for re-skin

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing screens | LOW | HIGH | Gate each phase, test after each change |
| Purple still appears | LOW | MEDIUM | Comprehensive grep for all purple instances |
| Performance regression | MEDIUM | MEDIUM | Measure before/after, use React.memo() |
| Developer confusion | LOW | LOW | Clear documentation, single source of truth |

---

## Final Recommendation Summary

**Question 1:** ✅ YES — Fix purple bleeding in PHASE 1 (1-2 hours)

**Question 2:** ✅ Keep `components/ui/` (CSS-based), delete Court primitives (1 day)

**Question 3:** ✅ Hybrid approach — CSS-first with Court tokens (8 weeks total)

**Confidence:** HIGH (based on usage data, bundle analysis, migration effort)

**Next Action:** Await your approval to proceed with PHASE 1 (Design System Extraction) + purple fix.

---

**Prepared by:** Architecture Audit Team
**Reviewed:** Code analysis, bundle size analysis, usage patterns
**Approval Required:** YES — Gate before PHASE 1 execution
