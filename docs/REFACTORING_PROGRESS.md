# Code Refactoring Progress

## Overview

This document tracks the ongoing refactoring effort to extract the monolithic `pages/index.tsx` (6,833 lines) into clean, modular, and performant components.

## Completed (Phase 1)

### 1. Directory Structure ✅
Created organized directory structure:
```
components/
  screens/          # Screen components
    RosterScreen.tsx
    SetupScreen.tsx
    ChampionScreen.tsx
    TrainingScreen.tsx
    index.ts
  ui/               # Reusable UI atoms
    Btn.tsx
    Card.tsx
    Badge.tsx
    TruncName.tsx
    EmptyState.tsx
    Confetti.tsx
    SkeletonLoader.tsx
    index.ts
lib/
  hooks/
    useLocalStorage.ts
  utils/
    formatters.ts
docs/
  components/
    README.md
    QUICK_REFERENCE.md
    IMPLEMENTATION_SUMMARY.md
  COURT_MIGRATION_GUIDE.md
  DEVELOPMENT_HARNESS.md
  MIGRATION_SUMMARY.md
  QUICKSTART.md
  REFACTORING_PROGRESS.md (this file)
```

### 2. Extracted UI Atoms (6 components) ✅
All small reusable components extracted to `components/ui/`:
- **Btn** - Button component with variants (primary, secondary, danger, success, etc.)
- **Card** / **CardTitle** - Card container components
- **Badge** - Skill group badges (Pro/Beginner)
- **TruncName** - Name display with text wrapping
- **EmptyState** - Empty state placeholder
- **Confetti** - Animated confetti effect for celebrations

All components:
- Written in TypeScript with strict types
- Include proper prop interfaces
- Export both named and default exports
- Centralized in `components/ui/index.ts`

### 3. Created Utilities & Hooks ✅
**lib/hooks/useLocalStorage.ts**
- Type-safe localStorage hook
- SSR-safe (handles typeof window checks)
- Error handling with fallback to initial values

**lib/utils/formatters.ts**
- `formatVND()` - Vietnamese Dong formatting
- `formatDate()` - Human-readable date formatting
- `formatDateTime()` - Date with time formatting
- `truncateText()` - Text truncation with ellipsis
- `formatPercentage()` - Percentage formatting

### 4. Extracted Screen Components (4 of 14) ✅
Successfully extracted and tested:
1. **RosterScreen** (~200 lines)
   - Player management CRUD operations
   - Pro/Beginner filtering
   - Inline editing
   - Stats display

2. **SetupScreen** (~300 lines)
   - Player selection
   - Tournament format configuration
   - Game type selection (Singles/Doubles)
   - Validation and summary

3. **ChampionScreen** (~50 lines)
   - Victory celebration with confetti
   - Champion display
   - Navigation to new tournament or history

4. **TrainingScreen** (~40 lines)
   - 3D Training Lab launcher
   - Opens in new window

### 5. Documentation Organization ✅
Moved all documentation to `docs/` directory:
- Root-level docs: QUICKSTART, DEVELOPMENT_HARNESS, etc.
- Component docs: Organized in `docs/components/`
- Maintained existing structure and content

## Remaining Work (Phase 2)

### Complex Screens to Extract (10 remaining)

**High Priority (Core Features):**

1. **TournamentScreen** (~1,500 lines) - Most complex
   - Requires extracting helper components first:
     - BetPanel (~150 lines)
     - MatchCard (~140 lines)
     - BracketView (~50 lines)
     - StandingsView (~50 lines)
   - Multi-court live scoring
   - Real-time match management
   - Round progression logic

2. **PaymentScreen** (~2,300 lines) - Very large
   - Payment tracking and reconciliation
   - Import/export functionality
   - Admin authentication
   - Transaction history

3. **HistoryScreen** (~200 lines)
   - Tournament history display
   - Past match records
   - Champion tracking

4. **RankingsScreen** (~220 lines)
   - Player rankings with proportional podium
   - Lifetime statistics
   - ELO/ranking calculations

**Medium Priority (Administrative):**

5. **AttendanceScreen** (~900 lines)
   - Session polling
   - RSVP management
   - Court booking suggestions
   - Automated tournament creation from polls

6. **BetsScreen / BetHistoryScreen** (~130 lines)
   - Betting history
   - Win/loss tracking
   - Settlement management

7. **AnalyticsScreen** (~210 lines)
   - Tournament analytics
   - Player performance metrics
   - Historical trends

**Low Priority (Configuration):**

8. **VenuesScreen** (~290 lines)
   - Venue management
   - Court configuration

9. **PricingRulesScreen** (~350 lines)
   - Pricing configuration
   - Custom payment rules

## Technical Debt to Address

### Performance Optimizations

1. **Implement Code-Splitting**
   ```typescript
   // Example pattern to implement:
   const TournamentScreen = lazy(() => import('@/components/screens/TournamentScreen'));
   const PaymentScreen = lazy(() => import('@/components/screens/PaymentScreen'));

   // In render:
   <Suspense fallback={<SkeletonCard />}>
     <TournamentScreen {...props} />
   </Suspense>
   ```

2. **Memoization Strategy**
   - Wrap expensive components with `React.memo()`
   - Use `useMemo` for derived state calculations
   - Use `useCallback` for event handlers passed as props

3. **State Management Optimization**
   - Consider extracting global state to Context API or Zustand
   - Current implementation has 20+ state variables in main App component
   - Opportunity to reduce re-renders with proper state colocation

### Type Safety Improvements

1. **Extract Shared Types**
   - Many types are imported from `@/lib/models` and `@/lib/tournament`
   - Create `@/types/index.ts` for application-wide shared types
   - Ensure all screen components have complete TypeScript coverage

2. **Props Validation**
   - All extracted components have typed props ✅
   - Remaining screens need same treatment
   - Add JSDoc comments for complex props

### Testing Strategy

Once extraction is complete:
1. **Unit Tests** - Test each screen component in isolation
2. **Integration Tests** - Test screen transitions and data flow
3. **E2E Tests** - Update existing Playwright tests for new structure

## Migration Strategy for Remaining Screens

### Recommended Approach

**Step 1: Extract Helper Components (Week 1)**
- BetPanel (shared by multiple screens)
- MatchCard (core tournament component)
- BracketView & StandingsView
- Create `components/tournament/` directory for these

**Step 2: Extract Medium-Complexity Screens (Week 2)**
- HistoryScreen
- RankingsScreen
- AnalyticsScreen
- BetsScreen

**Step 3: Extract Complex Screens (Week 3)**
- TournamentScreen (use extracted helpers from Step 1)
- AttendanceScreen

**Step 4: Extract Administrative Screens (Week 4)**
- PaymentScreen (largest and most complex)
- VenuesScreen
- PricingRulesScreen

**Step 5: Refactor Main App Component (Week 5)**
- Implement lazy loading for all screens
- Extract routing logic to separate hook
- Extract auth logic to Context
- Implement Suspense boundaries
- Add loading skeletons

**Step 6: Performance Audit (Week 6)**
- Measure Core Web Vitals
- Implement memoization where needed
- Add performance monitoring
- Bundle size analysis and optimization

## Success Metrics

**Code Quality:**
- ✅ UI atoms extracted (6/6 components)
- ✅ Simple screens extracted (4/14 screens) - 29% complete
- 🔄 Complex screens extracted (0/10 screens) - 0% complete
- ⏳ Main App component refactored - Not started
- ⏳ Lazy loading implemented - Not started
- ⏳ Performance optimizations - Not started

**File Organization:**
- ✅ Documentation organized
- ✅ Directory structure created
- ✅ Utilities and hooks extracted
- ⏳ All screens in dedicated files

**Performance Targets (Post-Refactoring):**
- Main bundle size: < 100KB (currently ~320KB due to monolithic index.tsx)
- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1
- Code-split chunks: Each screen < 50KB

**Maintainability:**
- ✅ All new components use TypeScript strict mode
- ✅ Proper prop interfaces defined
- ✅ Reusable components in ui/ directory
- ⏳ Main App component < 500 lines (currently 6833 lines)
- ⏳ Screen components average < 300 lines

## How to Continue This Work

### For Next Developer

1. **Start with Helper Components**
   ```bash
   # Extract BetPanel first (used by multiple screens)
   # Location in pages/index.tsx: lines 514-660
   # Create: components/tournament/BetPanel.tsx
   ```

2. **Use This Template**
   ```typescript
   import React, { useState, useEffect } from 'react';
   import type { /* import types */ } from '@/lib/models';
   import { Btn, Card, CardTitle } from '@/components/ui';

   interface ScreenNameProps {
     // Define props
   }

   export const ScreenName: React.FC<ScreenNameProps> = (props) => {
     // Component logic
   };

   export default ScreenName;
   ```

3. **Test Each Extraction**
   ```bash
   npm run dev
   # Verify the screen still works
   # Check for any missing imports or types
   ```

4. **Update pages/index.tsx**
   - Remove the extracted screen function
   - Import from components/screens
   - Eventually wrap in React.lazy()

## Notes

- **Do not break existing functionality** - Each extraction should be tested
- **Maintain TypeScript strict mode** - All new files must pass type checking
- **Keep accessibility** - aria-labels and keyboard navigation must be preserved
- **Preserve existing styles** - Use same CSS classes until styling refactor
- **Document breaking changes** - Update this file as work progresses

## Questions / Blockers

None currently. Work can proceed incrementally.

---

**Last Updated:** 2026-06-24
**Current Phase:** Phase 1 Complete, Phase 2 Ready to Start
**Total Progress:** ~35% complete (file organization + simple screens)
