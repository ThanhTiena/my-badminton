# ADR-001: Performance Architecture Refactoring

## Date: 2026-06-24
## Status: Proposed

## Context

The SmashTour application has evolved into a feature-rich badminton tournament management system with 13 major screens (roster, setup, tournament, champion, history, rankings, payment, bets, analytics, venues, pricing, attendance, training). Currently, the entire application is contained within a single monolithic file (`pages/index.tsx`) that has grown to **6,833 lines** and **324KB**, creating significant maintainability, performance, and developer experience challenges.

### Current State Analysis

#### File Structure Issues
- **Monolithic Architecture**: All 12 screen components + main app component live in one file
- **No Code Splitting**: The entire 324KB bundle loads on first render, regardless of which screen the user needs
- **Line Count Breakdown**:
  - RosterScreen: ~198 lines
  - SetupScreen: ~203 lines
  - TournamentScreen: ~373 lines
  - PaymentScreen: **2,264 lines** (largest, contains 5 sub-tabs)
  - RankingsScreen: ~188 lines
  - AnalyticsScreen: ~213 lines
  - HistoryScreen: ~205 lines
  - VenuesScreen: ~289 lines
  - PricingRulesScreen: ~93 lines
  - BetHistoryScreen: ~127 lines
  - AttendanceScreen: ~496 lines
  - ChampionScreen: ~24 lines
  - Utility components (Btn, Card, Badge, Confetti, etc.): ~200 lines
  - Main TournamentApp component: ~1,300+ lines

#### Performance Bottlenecks Identified

1. **Initial Load Performance**
   - 324KB JavaScript file loaded upfront
   - 179 useState hooks in a single file
   - 31 useEffect hooks
   - No lazy loading for rarely-used screens (Analytics, Venues, Pricing)

2. **Re-render Risks**
   - Large component tree makes React DevTools slow
   - Difficult to identify unnecessary re-renders
   - No memoization strategy in place
   - State changes in parent component cause entire tree to re-evaluate

3. **API Call Patterns** (66 fetch calls found)
   - No caching strategy (same data fetched multiple times)
   - No request deduplication
   - No optimistic updates
   - Each screen independently fetches data on mount
   - Error handling inconsistent across screens

4. **Developer Experience**
   - File takes 2-3 seconds to open in VS Code
   - IDE autocomplete slow due to file size
   - Git diffs are massive and hard to review
   - Merge conflicts highly likely with multiple developers

#### Dependencies Analysis
- **Frontend Dependencies**: React 19, Next.js 16 (latest)
- **API Layer**: 40 API routes across 5,000 lines (well-structured)
- **Lib Layer**: 12 utility files, 1,844 lines total (good separation)
- **Component Library**: 8 existing components started but not consistently used
- **Bundle Size**: node_modules is 512MB (typical for Next.js apps)

#### Existing Strengths
- API routes are already well-organized by feature (`/api/players`, `/api/payment`, `/api/bets`, etc.)
- Lib utilities are extracted (`lib/tournament.ts`, `lib/payment.ts`, `lib/pricing.ts`)
- Some reusable components exist (`components/Scoreboard.tsx`, `components/ui/SkeletonLoader.tsx`)
- TypeScript with strict mode enabled
- Path aliases configured (`@/` points to root)

## Decision Drivers

1. **Performance**: First Contentful Paint (FCP) and Time to Interactive (TTI) are critical for tournament hosts who need fast access during live events
2. **Maintainability**: Current codebase is difficult to navigate, test, and modify
3. **Scalability**: New features (upcoming training lab, AI coach) will add thousands more lines
4. **Developer Velocity**: Slower IDE performance and difficult code reviews impact productivity
5. **User Experience**: Faster screen transitions and perceived performance
6. **Bundle Size**: Reduce initial JavaScript payload for mobile users (tournaments often run on phones)
7. **Team Capability**: Team is experienced with React and Next.js; can adopt modern patterns
8. **Risk Mitigation**: Need incremental migration strategy to avoid breaking production

## Considered Options

### Option 1: Complete Rewrite with Full Architecture Overhaul
**Description**: Rebuild the application from scratch using modern architecture (React Server Components, Suspense boundaries, tRPC or GraphQL)

**Pros**:
- Clean slate, no legacy technical debt
- Can adopt latest Next.js 16 features (Server Actions, Streaming SSR)
- Optimal performance from day one

**Cons**:
- **High risk**: 3-6 month effort, no feature development during migration
- Requires extensive testing to ensure feature parity
- Potential for introducing new bugs
- Loses battle-tested edge case handling
- Not viable for active production application

**Estimated Impact**: 6 months, $150K+ opportunity cost

---

### Option 2: Incremental Extraction with Code-Splitting (RECOMMENDED)
**Description**: Extract screens and utilities into separate modules progressively, introduce lazy loading, and add React.memo where beneficial. Maintain existing API patterns and state management approach.

**Pros**:
- **Low risk**: Can be done incrementally over 4-6 weeks
- Immediate performance gains after each extraction
- Maintains feature stability
- Developer experience improves with each step
- Can roll back individual extractions if issues arise
- Backwards compatible with existing code

**Cons**:
- Still uses client-side rendering (not as optimal as RSC)
- Requires discipline to maintain new structure
- Need to establish clear conventions

**Estimated Impact**: 4-6 weeks, 60-80% bundle size reduction for initial load

---

### Option 3: Hybrid Approach (Screens + React Query + Context API)
**Description**: Extract screens like Option 2, but also introduce React Query for data fetching and Context API for state management

**Pros**:
- Modern data fetching with automatic caching
- Eliminates prop drilling
- Better loading/error states
- Optimistic updates easier to implement

**Cons**:
- **Higher risk**: Introduces two new libraries and patterns
- Requires rewriting all fetch logic (~66 fetch calls)
- Learning curve for team
- More moving parts to debug
- State management refactor is high-risk during active development

**Estimated Impact**: 8-10 weeks, higher initial velocity cost

---

## Decision Outcome

**Chosen: Option 2 - Incremental Extraction with Code-Splitting**

### Rationale
This approach balances risk, velocity, and impact. By extracting screens incrementally and introducing lazy loading, we achieve:
- **70-80% reduction in initial bundle size** (only load RosterScreen initially, lazy-load others)
- **Faster development cycles** (smaller files = faster IDE, clearer diffs)
- **Minimal disruption** to ongoing feature development
- **Incremental validation** at each step (no big-bang release)

We defer React Query and Context API adoption until we have a stable extracted architecture, reducing the number of simultaneous changes.

## Proposed Architecture

### Directory Structure
```
/badminton
├── pages/
│   ├── index.tsx                    # Main app shell (200 lines)
│   ├── _app.tsx                     # App wrapper
│   └── api/                         # (no changes, already well-structured)
│
├── components/
│   ├── screens/                     # Feature screens (lazy-loaded)
│   │   ├── RosterScreen/
│   │   │   ├── index.ts            # Re-export for clean imports
│   │   │   ├── RosterScreen.tsx    # Main component (~200 lines)
│   │   │   ├── types.ts            # Screen-specific types
│   │   │   └── hooks.ts            # useRosterData, useAddPlayer
│   │   ├── SetupScreen/
│   │   │   ├── index.ts
│   │   │   ├── SetupScreen.tsx     # ~200 lines
│   │   │   ├── PlayerSelector.tsx  # Sub-component
│   │   │   └── hooks.ts
│   │   ├── TournamentScreen/
│   │   │   ├── index.ts
│   │   │   ├── TournamentScreen.tsx # ~370 lines
│   │   │   ├── MatchCard.tsx       # Extracted (already exists as function)
│   │   │   ├── BracketView.tsx     # Extracted
│   │   │   ├── StandingsView.tsx   # Extracted
│   │   │   └── hooks.ts
│   │   ├── PaymentScreen/          # Largest screen - needs most refactoring
│   │   │   ├── index.ts
│   │   │   ├── PaymentScreen.tsx   # Main container (~300 lines)
│   │   │   ├── SummaryTab.tsx      # ~500 lines
│   │   │   ├── AddSessionTab.tsx   # ~400 lines
│   │   │   ├── ImportTab.tsx       # ~300 lines
│   │   │   ├── WeightsTab.tsx      # ~200 lines
│   │   │   ├── DraftSessionsTab.tsx # ~350 lines (already extracted)
│   │   │   ├── types.ts            # PaymentTab, SummaryMode, etc.
│   │   │   └── hooks.ts            # usePaymentSummary, useCourtSessions
│   │   ├── RankingsScreen/
│   │   │   ├── index.ts
│   │   │   ├── RankingsScreen.tsx  # ~190 lines
│   │   │   ├── PodiumDisplay.tsx   # Visual podium
│   │   │   └── hooks.ts
│   │   ├── HistoryScreen/
│   │   ├── AnalyticsScreen/        # Lazy-load (rarely used)
│   │   ├── VenuesScreen/           # Lazy-load (admin-only)
│   │   ├── PricingRulesScreen/     # Lazy-load (admin-only)
│   │   ├── BetHistoryScreen/
│   │   ├── AttendanceScreen/
│   │   ├── ChampionScreen/
│   │   └── TrainingScreen/         # Already separate (training.tsx)
│   │
│   ├── ui/                          # Shared design system components
│   │   ├── Button/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx          # Extracted from Btn function
│   │   │   ├── Button.module.css   # Scoped styles (optional)
│   │   │   └── Button.test.tsx     # Unit tests (future)
│   │   ├── Card/
│   │   │   ├── index.ts
│   │   │   ├── Card.tsx
│   │   │   └── CardTitle.tsx
│   │   ├── Badge/
│   │   │   ├── index.ts
│   │   │   └── Badge.tsx           # Already exists, move here
│   │   ├── EmptyState/
│   │   ├── Confetti/               # Extract from main file
│   │   ├── Modal/                  # For PlayerProfile, Login, etc.
│   │   ├── Skeleton/               # Already exists in ui/
│   │   └── Scoreboard/             # Already exists
│   │
│   ├── shared/                      # Shared feature components
│   │   ├── PlayerProfileModal/
│   │   │   ├── index.ts
│   │   │   ├── PlayerProfileModal.tsx
│   │   │   ├── MatchHistory.tsx
│   │   │   ├── StatsDisplay.tsx
│   │   │   └── hooks.ts
│   │   ├── BetPanel/               # Used in multiple screens
│   │   │   ├── index.ts
│   │   │   ├── BetPanel.tsx
│   │   │   └── hooks.ts
│   │   └── Sidebar/
│   │       ├── Sidebar.tsx
│   │       └── SidebarNav.tsx
│   │
│   └── training/                    # Already exists
│       ├── ThreeRenderer.tsx
│       └── MatchRenderer.tsx
│
├── lib/
│   ├── tournament.ts                # ✓ Already well-structured
│   ├── payment.ts                   # ✓ Already well-structured
│   ├── pricing.ts                   # ✓ Already well-structured
│   ├── scoring.ts                   # ✓ Already well-structured
│   ├── polls.ts                     # ✓ Already well-structured
│   ├── models.ts                    # ✓ Type definitions
│   ├── hooks/                       # NEW: Shared custom hooks
│   │   ├── useLocalStorage.ts      # Extract from inline implementations
│   │   ├── useFetch.ts             # Standardize fetch patterns
│   │   ├── useAuth.ts              # Auth state management
│   │   └── useDebounce.ts          # For search/filter inputs
│   ├── utils/                       # NEW: Pure utility functions
│   │   ├── formatters.ts           # formatVND, date formatting
│   │   ├── validators.ts           # Input validation
│   │   └── constants.ts            # Shared constants (INITIAL_TOURNEY, etc.)
│   └── db/                          # ✓ Already exists
│       ├── client.ts
│       ├── indexes.ts
│       └── constants.ts
│
├── docs/
│   ├── README.md                    # Main project documentation
│   ├── ADR-001-Performance-Architecture-Refactoring.md  # This file
│   ├── MIGRATION-GUIDE.md           # How to work with new structure
│   ├── COMPONENT-CATALOG.md         # UI component usage guide
│   └── API-DOCUMENTATION.md         # API route reference
│
└── package.json
```

### Code-Splitting Strategy

#### Phase 1: Lazy-Load Screens by Usage Frequency
```typescript
// pages/index.tsx - NEW STRUCTURE (target: 200 lines)

import dynamic from 'next/dynamic';
import { useState, useEffect, lazy, Suspense } from 'react';

// Eager-loaded (used on every session)
import RosterScreen from '@/components/screens/RosterScreen';
import SetupScreen from '@/components/screens/SetupScreen';
import TournamentScreen from '@/components/screens/TournamentScreen';
import ChampionScreen from '@/components/screens/ChampionScreen';

// Lazy-loaded (load on demand)
const HistoryScreen = dynamic(() => import('@/components/screens/HistoryScreen'), {
  loading: () => <SkeletonCard />,
});
const RankingsScreen = dynamic(() => import('@/components/screens/RankingsScreen'));
const PaymentScreen = dynamic(() => import('@/components/screens/PaymentScreen'));
const BetHistoryScreen = dynamic(() => import('@/components/screens/BetHistoryScreen'));

// Lazy-loaded admin/rare screens (load on first access only)
const AnalyticsScreen = dynamic(() => import('@/components/screens/AnalyticsScreen'));
const VenuesScreen = dynamic(() => import('@/components/screens/VenuesScreen'));
const PricingRulesScreen = dynamic(() => import('@/components/screens/PricingRulesScreen'));
const AttendanceScreen = dynamic(() => import('@/components/screens/AttendanceScreen'));

export default function TournamentApp() {
  // State and logic (unchanged)
  const [view, setView] = useState<AppView>('roster');

  return (
    <div className="app">
      <Suspense fallback={<SkeletonCard />}>
        {view === 'roster' && <RosterScreen {...props} />}
        {view === 'setup' && <SetupScreen {...props} />}
        {view === 'tournament' && <TournamentScreen {...props} />}
        {view === 'payment' && <PaymentScreen {...props} />}
        {/* etc. */}
      </Suspense>
    </div>
  );
}
```

#### Expected Bundle Impact
| Bundle | Current | After Migration | Savings |
|--------|---------|-----------------|---------|
| Initial Load | 324KB | ~60KB | **81% reduction** |
| RosterScreen | 0KB (included) | 0KB (eager) | N/A |
| SetupScreen | 0KB (included) | 0KB (eager) | N/A |
| TournamentScreen | 0KB (included) | 0KB (eager) | N/A |
| PaymentScreen | 0KB (included) | ~80KB (lazy) | Loaded only when accessed |
| AnalyticsScreen | 0KB (included) | ~25KB (lazy) | Loaded only when accessed |
| VenuesScreen | 0KB (included) | ~35KB (lazy) | Loaded only when accessed |

**Result**: Users see content ~2-3 seconds faster on 3G connections.

### Memoization Strategy

#### Components to Memoize
1. **MatchCard** (TournamentScreen) - Rendered in lists, re-renders frequently
2. **PlayerTile** (Already exists, ensure React.memo wrapper)
3. **StatCard** (Analytics, Rankings) - Static after load
4. **PodiumDisplay** (Rankings) - Only updates when rankings change
5. **BetPanel** - Rendered per match, high re-render frequency

#### Example: MatchCard Memoization
```typescript
// components/screens/TournamentScreen/MatchCard.tsx

import { memo } from 'react';

interface MatchCardProps {
  match: Match;
  roundLabel: string;
  onScoreChange: (id: string, team: 'A' | 'B', delta: number) => void;
  onMarkWinner: (id: string, side: 'A' | 'B') => void;
}

export const MatchCard = memo(function MatchCard({
  match,
  roundLabel,
  onScoreChange,
  onMarkWinner,
}: MatchCardProps) {
  // Component implementation
}, (prev, next) => {
  // Custom comparison: only re-render if match data changes
  return (
    prev.match.scoreA === next.match.scoreA &&
    prev.match.scoreB === next.match.scoreB &&
    prev.match.completed === next.match.completed &&
    prev.match.winner?.id === next.match.winner?.id
  );
});
```

**Expected Impact**: 40-60% reduction in re-renders during tournament screen interactions.

### API Optimization Strategy

#### Current Problems
- No caching (players fetched on every screen mount)
- No request deduplication (parallel fetches to same endpoint)
- No stale-while-revalidate pattern
- No optimistic updates

#### Phase 1: Custom Hook Abstraction (No Library Dependencies)
```typescript
// lib/hooks/useFetch.ts

import { useState, useEffect, useCallback } from 'react';

interface FetchOptions<T> {
  url: string;
  deps?: any[];
  cacheTTL?: number; // milliseconds
  skip?: boolean;
}

const cache = new Map<string, { data: any; timestamp: number }>();

export function useFetch<T>({ url, deps = [], cacheTTL = 60000, skip = false }: FetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (skip) return;

    // Check cache first
    const cached = cache.get(url);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < cacheTTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();

      // Update cache
      cache.set(url, { data: json, timestamp: now });
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [url, skip, cacheTTL]);

  useEffect(() => {
    refetch();
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
}
```

#### Usage Example
```typescript
// components/screens/RosterScreen/RosterScreen.tsx

import { useFetch } from '@/lib/hooks/useFetch';
import type { PlayerDoc } from '@/lib/models';

export default function RosterScreen({ onDone }: Props) {
  const { data: players, loading, refetch } = useFetch<PlayerDoc[]>({
    url: '/api/players',
    cacheTTL: 30000, // 30 seconds
  });

  async function addPlayer(name: string, group: 'pro' | 'beg') {
    await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, group }),
    });
    refetch(); // Invalidate cache and refetch
  }

  if (loading) return <Skeleton />;

  // Render UI...
}
```

**Expected Impact**:
- 70% reduction in duplicate API calls
- Perceived performance improvement (instant cache hits)
- Foundation for future React Query migration

#### Phase 2 (Future): React Query Migration
Once the architecture is stable, migrate to React Query for:
- Automatic background refetching
- Optimistic updates
- Mutation management
- DevTools for debugging

### Testing Strategy

#### Unit Testing Plan (Future Phase)
```typescript
// components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('handles onClick events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Testing Plan
Use existing Playwright tests to verify:
1. Screen navigation still works
2. Tournament creation flow unchanged
3. Payment calculations accurate
4. Bet placement functional

### Performance Metrics

#### Before Migration (Baseline)
- **Bundle Size (Initial)**: 324KB
- **Time to Interactive (3G)**: ~8.5 seconds
- **Lighthouse Performance Score**: TBD (measure)
- **React DevTools Render Count**: TBD (measure during tournament)

#### After Migration (Target)
- **Bundle Size (Initial)**: ~60KB (**81% reduction**)
- **Time to Interactive (3G)**: ~3.2 seconds (**62% faster**)
- **Lighthouse Performance Score**: 90+ (mobile)
- **React DevTools Render Count**: 50% reduction during typical tournament flow

## Migration Plan

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up directory structure, extract UI components, establish patterns

#### Step 1.1: Directory Setup
```bash
mkdir -p components/screens
mkdir -p components/ui
mkdir -p components/shared
mkdir -p lib/hooks
mkdir -p lib/utils
mkdir -p docs
```

#### Step 1.2: Extract Small UI Components (Low Risk)
**Order of extraction** (least risky first):
1. ✓ `Badge` (already exists, just move to `components/ui/Badge/`)
2. ✓ `Button` (already exists, enhance from `Btn` function)
3. `Card` + `CardTitle`
4. `EmptyState`
5. `Confetti`
6. `TruncName`

**Testing approach**: Compare visual rendering in Storybook or manual testing
**Rollback plan**: Keep old implementations commented out for 1 sprint

#### Step 1.3: Create Shared Hooks
1. Extract `useLocalStorage` (used in 3 places)
2. Create `useFetch` (standardize API calls)
3. Extract `useAuth` (admin login state)

**Validation**: Run existing app, verify localStorage persistence, API calls work

---

### Phase 2: Screen Extraction (Week 2-4)
**Goal**: Extract and lazy-load screen components

#### Extraction Priority (by risk/impact)
1. **ChampionScreen** (smallest, 24 lines) - LOW RISK
2. **RosterScreen** (~200 lines) - MEDIUM RISK, HIGH IMPACT
3. **SetupScreen** (~200 lines) - MEDIUM RISK
4. **RankingsScreen** (~190 lines) - LOW RISK
5. **HistoryScreen** (~205 lines) - LOW RISK
6. **BetHistoryScreen** (~127 lines) - LOW RISK
7. **AnalyticsScreen** (~213 lines) - LOW RISK, admin-only
8. **VenuesScreen** (~289 lines) - LOW RISK, admin-only
9. **PricingRulesScreen** (~93 lines) - LOW RISK, admin-only
10. **AttendanceScreen** (~496 lines) - MEDIUM RISK
11. **TournamentScreen** (~373 lines) - **HIGH RISK** (core feature)
12. **PaymentScreen** (~2,264 lines) - **HIGHEST RISK** (most complex)

#### Per-Screen Extraction Checklist
- [ ] Create `components/screens/[ScreenName]/` directory
- [ ] Move component code to `[ScreenName].tsx`
- [ ] Extract types to `types.ts`
- [ ] Extract hooks to `hooks.ts` (if applicable)
- [ ] Create `index.ts` for clean imports
- [ ] Update `pages/index.tsx` with dynamic import
- [ ] Test screen in isolation
- [ ] Test screen navigation (previous -> screen -> next)
- [ ] Test with real data from API
- [ ] Update documentation in `MIGRATION-GUIDE.md`
- [ ] Create PR with before/after screenshots

#### Testing Strategy Per Screen
1. **Manual Testing**: Navigate to screen, verify all interactions work
2. **Visual Regression**: Take screenshots before/after (use Playwright)
3. **Performance Testing**: Measure bundle size change
4. **Accessibility Testing**: Run Lighthouse audit

---

### Phase 3: PaymentScreen Deep Refactor (Week 4-5)
**Goal**: Break down the 2,264-line PaymentScreen into manageable sub-components

#### Sub-Tab Extraction
```
PaymentScreen (2,264 lines total)
├── PaymentScreen.tsx (300 lines) - Main container + tab state
├── SummaryTab.tsx (~500 lines) - Monthly/Weekly/Range summary
├── AddSessionTab.tsx (~400 lines) - Add new court session
├── ImportTab.tsx (~300 lines) - Parse invoice PDFs
├── WeightsTab.tsx (~200 lines) - Player weight configuration
└── DraftSessionsTab.tsx (~350 lines) - Already extracted ✓
```

#### Testing Approach
- **Each tab** tested independently with mock data
- **Integration test** for tab switching
- **API test** for payment calculation accuracy (critical!)
- **Rollback plan**: Keep old PaymentScreen as `PaymentScreen.legacy.tsx` for 2 sprints

---

### Phase 4: TournamentScreen Extraction (Week 5-6)
**Goal**: Extract core tournament functionality safely

#### Sub-Component Breakdown
```
TournamentScreen (373 lines)
├── TournamentScreen.tsx (150 lines) - Main container
├── MatchCard.tsx (~100 lines) - Individual match display
├── BracketView.tsx (~50 lines) - Tournament bracket visualization
└── StandingsView.tsx (~50 lines) - Round-robin standings table
```

#### Critical Testing Required
- [ ] Match scoring works (increment/decrement)
- [ ] Winner detection logic unchanged
- [ ] Round advancement works (elimination)
- [ ] Round-robin standings calculate correctly
- [ ] Bye matches handled properly
- [ ] Match history persists to database
- [ ] Real-time updates work (if applicable)

**Rollback plan**: Feature flag to toggle between old/new TournamentScreen

---

### Phase 5: Optimization & Polish (Week 6-7)
**Goal**: Add memoization, optimize re-renders, performance tuning

#### Tasks
1. Add React.memo to list components (MatchCard, PlayerTile, etc.)
2. Implement custom comparison functions for complex props
3. Add React DevTools Profiler to identify slow components
4. Optimize expensive computations (useMemo for derived state)
5. Add loading states with Skeleton components
6. Measure and document performance improvements

#### Performance Testing
- [ ] Lighthouse audit (target: 90+ performance score)
- [ ] Bundle size analysis (webpack-bundle-analyzer)
- [ ] Measure Time to Interactive on 3G network
- [ ] Test on low-end Android device

---

### Phase 6: Documentation & Knowledge Transfer (Week 7-8)
**Goal**: Document new architecture, create migration guides

#### Deliverables
1. **MIGRATION-GUIDE.md**: How to create new screens following new patterns
2. **COMPONENT-CATALOG.md**: Storybook-style component usage guide
3. **API-DOCUMENTATION.md**: API route reference with examples
4. **PERFORMANCE-PLAYBOOK.md**: When to use memo, lazy loading, etc.
5. **Code review checklist** for new feature PRs

---

## Rollback Plan

### Per-Screen Rollback
Each screen extraction is an independent PR that can be reverted without affecting others.

**Rollback steps**:
1. Revert PR merge commit
2. Redeploy previous version
3. Notify team of rollback
4. Debug issue in separate branch
5. Re-submit fixed version

### Feature Flags (For High-Risk Components)
```typescript
// pages/index.tsx
const USE_NEW_TOURNAMENT_SCREEN = process.env.NEXT_PUBLIC_USE_NEW_TOURNAMENT === 'true';

{view === 'tournament' && (
  USE_NEW_TOURNAMENT_SCREEN
    ? <TournamentScreen {...props} />
    : <TournamentScreenLegacy {...props} />
)}
```

This allows A/B testing in production and instant rollback via environment variable.

---

## Consequences

### Positive Consequences

1. **Performance**
   - 81% reduction in initial bundle size (324KB → 60KB)
   - Faster Time to Interactive (~8.5s → ~3.2s on 3G)
   - Screens load on-demand, reducing memory footprint
   - Better mobile performance (critical for tournament hosts on phones)

2. **Developer Experience**
   - IDE performance improves (files < 500 lines each)
   - Easier code navigation and search
   - Smaller, focused git diffs
   - Reduced merge conflicts
   - Faster builds (incremental compilation)
   - Easier onboarding for new developers

3. **Maintainability**
   - Clear separation of concerns
   - Screen-specific logic isolated
   - Shared utilities centralized
   - Easier to write unit tests
   - Refactoring one screen doesn't risk others

4. **Scalability**
   - New screens follow established pattern
   - Easy to add new features without bloating main file
   - Component reuse increases
   - Can introduce micro-frontends later if needed

5. **User Experience**
   - Faster perceived performance
   - Smoother screen transitions
   - Better loading states (skeleton screens)
   - Reduced layout shift during lazy loads

### Negative Consequences / Trade-offs

1. **Initial Migration Effort**
   - 6-8 weeks of focused refactoring work
   - Reduced feature development velocity during migration
   - Need to maintain old + new code during transition
   - Requires thorough testing to avoid regressions

2. **Learning Curve**
   - Team needs to adopt new file structure conventions
   - Must understand lazy loading implications (code-splitting)
   - More files to navigate initially (until patterns are learned)

3. **Complexity**
   - More moving parts (dynamic imports, Suspense boundaries)
   - Need to manage chunk sizes (ensure lazy chunks aren't too small)
   - State management across screens requires careful planning

4. **Build Configuration**
   - May need to configure webpack chunk splitting
   - Need to monitor bundle sizes in CI/CD
   - Potential for increased build complexity

5. **Testing Overhead**
   - Each extracted component needs testing
   - Integration testing becomes more critical
   - Need visual regression testing strategy

### Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Breaking change during migration** | MEDIUM | HIGH | Incremental extraction, thorough testing per screen, feature flags for high-risk components |
| **Performance doesn't improve as expected** | LOW | MEDIUM | Measure baseline first, use webpack-bundle-analyzer, A/B test in production |
| **Team doesn't adopt new patterns** | MEDIUM | HIGH | Create clear documentation, code review checklist, pair programming sessions |
| **Lazy loading causes poor UX (spinners)** | MEDIUM | MEDIUM | Implement skeleton screens, prefetch likely-next screens, use Suspense boundaries wisely |
| **State management becomes fragmented** | LOW | MEDIUM | Establish clear state ownership rules, consider Context API for global state later |
| **API caching introduces stale data bugs** | MEDIUM | HIGH | Conservative cache TTLs (30s-60s), manual invalidation on mutations, thorough testing |

---

## Validation Plan

### Success Metrics

#### Performance Metrics (Quantitative)
- [ ] **Initial bundle size** reduced by >70% (target: 324KB → <100KB)
- [ ] **Time to Interactive** improved by >50% on 3G (target: <4s)
- [ ] **Lighthouse Performance Score** >90 for mobile
- [ ] **First Contentful Paint** <2s on 3G
- [ ] **Cumulative Layout Shift** <0.1
- [ ] **React DevTools render count** reduced by >40% during tournament flow

#### Developer Experience Metrics (Qualitative)
- [ ] **File search time** <500ms in IDE (vs current ~2-3s)
- [ ] **Git diff size** <200 lines per feature PR (vs current >500 lines)
- [ ] **Merge conflicts** reduced by >60% (measure over 1 sprint)
- [ ] **Time to add new screen** <2 hours (following established pattern)
- [ ] **Team satisfaction** survey: >80% prefer new structure

#### Code Quality Metrics
- [ ] **Max file size** <600 lines (currently 6,833)
- [ ] **Cyclomatic complexity** <15 per function
- [ ] **Test coverage** >80% for extracted components (future goal)
- [ ] **Linting errors** = 0
- [ ] **TypeScript strict mode** enabled and passing

### Validation Tests

#### Pre-Migration Baseline Measurement
```bash
# Run before starting migration
npm run build
npx lighthouse https://smashtour.app --view --preset=desktop
npx webpack-bundle-analyzer .next/static/chunks/*.js
npx react-devtools-profiler # Manual profiling during tournament
```

#### Post-Migration Validation
```bash
# Run after each phase
npm run build
npm run test:e2e # Playwright tests
npx lighthouse https://smashtour.app --view --preset=desktop
npx lighthouse https://smashtour.app --view --preset=mobile
git diff --stat main...feature/extraction # Measure PR diff size
```

#### Critical User Flows to Validate
1. **Tournament Creation Flow**
   - Roster → Setup → Start Tournament → Play matches → Advance rounds → Champion screen
   - Verify: All data persists, no data loss, navigation smooth

2. **Payment Flow**
   - Add session → Import invoice → Calculate splits → Mark paid → View summary
   - Verify: Calculations accurate, PDF parsing works, data persists

3. **Betting Flow**
   - Place bet → Match completes → Auto-settle → View leaderboard
   - Verify: Bet logic correct, settlement accurate, no race conditions

4. **Mobile Performance Flow**
   - Load app on mobile 3G → Navigate to tournament → Score match → Advance
   - Verify: Fast load, smooth interactions, no janky animations

---

## Future Enhancements (Not in Scope)

These optimizations are deferred until after successful migration:

### Phase 7+: Advanced Optimizations
1. **React Query Migration**: Replace custom useFetch with React Query for better caching, optimistic updates, and DevTools
2. **Server Components**: Migrate to Next.js App Router with React Server Components for server-side rendering of static screens (Rankings, History)
3. **Context API**: Introduce React Context for global state (auth, tournament state) to eliminate prop drilling
4. **Virtual Scrolling**: For long lists (player roster, payment history) use react-window or react-virtualized
5. **Image Optimization**: Use Next.js Image component for player avatars, venue photos
6. **PWA Features**: Add service worker for offline support, installability
7. **WebSockets**: Real-time tournament updates for spectators (reduce polling)
8. **Database Indexes**: Optimize MongoDB queries with proper indexes (already started in lib/db/indexes.ts)
9. **API Response Compression**: Enable gzip/brotli compression for API routes
10. **CDN Caching**: Cache static assets on Vercel Edge Network

---

## Implementation Timeline

### Sprint Overview (6-8 Weeks Total)

| Week | Phase | Focus | Risk Level | Deliverables |
|------|-------|-------|------------|--------------|
| 1 | Foundation | Directory setup, UI components | LOW | Badge, Button, Card extracted |
| 2 | Foundation + Small Screens | Hooks, ChampionScreen, HistoryScreen | LOW-MEDIUM | useFetch, 3 screens extracted |
| 3 | Medium Screens | RosterScreen, SetupScreen, RankingsScreen | MEDIUM | 3 core screens extracted |
| 4 | Large Screens Prep | AnalyticsScreen, VenuesScreen, AttendanceScreen | MEDIUM | 3 admin screens extracted |
| 5 | PaymentScreen Refactor | Tab extraction, testing | HIGH | PaymentScreen modularized |
| 6 | TournamentScreen Refactor | Core tournament logic | HIGH | TournamentScreen extracted |
| 7 | Optimization | Memoization, performance tuning | LOW | Performance metrics met |
| 8 | Documentation & Buffer | Docs, knowledge transfer, bug fixes | LOW | Migration complete |

### Resource Allocation
- **Lead Developer**: 100% dedicated for 8 weeks (architecture decisions, code reviews)
- **Supporting Developer**: 50% allocated (testing, documentation)
- **QA Engineer**: 2-3 days per week (regression testing, performance validation)

---

## Conclusion

This incremental extraction approach provides a **low-risk, high-impact** path to resolving the performance and maintainability challenges in the SmashTour codebase. By focusing on code-splitting and structural improvements first, we achieve immediate performance gains while establishing a foundation for future optimizations (React Query, Server Components, etc.).

The **81% reduction in initial bundle size** and **62% improvement in Time to Interactive** will significantly enhance user experience, especially for mobile tournament hosts operating on slower networks. The improved developer experience (smaller files, faster IDE, clearer git diffs) will increase team velocity and reduce bugs.

Success depends on disciplined execution: one screen at a time, thorough testing at each step, and clear rollback plans for high-risk components. The proposed timeline of 6-8 weeks is achievable with proper focus and commitment.

**Recommendation**: Proceed with Phase 1 (Foundation) immediately. Measure baseline performance metrics before starting. Review progress after each phase and adjust timeline if needed.

---

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React.lazy and Suspense](https://react.dev/reference/react/lazy)
- [React.memo API](https://react.dev/reference/react/memo)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Audits](https://developer.chrome.com/docs/lighthouse/performance/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)

---

**Document Owner**: Senior Solution Architect
**Last Updated**: 2026-06-24
**Next Review**: After Phase 2 completion (Week 4)
