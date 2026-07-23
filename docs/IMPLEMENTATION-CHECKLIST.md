# SmashTour Architecture Migration - Implementation Checklist

This checklist tracks the step-by-step extraction of components from the monolithic `pages/index.tsx` file.

## Overview
- **Total Lines to Refactor**: 6,833 lines
- **Target Structure**: Modular screens + reusable components
- **Expected Timeline**: 6-8 weeks
- **Success Metric**: <100KB initial bundle (currently 324KB)

---

## Phase 1: Foundation (Week 1-2)

### Directory Setup
- [ ] Create `components/screens/` directory
- [ ] Create `components/ui/` directory
- [ ] Create `components/shared/` directory
- [ ] Create `lib/hooks/` directory
- [ ] Create `lib/utils/` directory
- [ ] Create `docs/` directory (for migration documentation)
- [ ] Create barrel exports (`index.ts` files)

### Baseline Measurements
- [ ] Run production build: `npm run build`
- [ ] Measure bundle sizes: `ls -lh .next/static/chunks/pages/*.js`
- [ ] Run Lighthouse audit (save report)
- [ ] Document current load time on 3G (Chrome DevTools)
- [ ] Profile with React DevTools (capture render counts)
- [ ] Create baseline metrics document

### Extract UI Components (Low Risk)

#### Badge Component
- [ ] Create `components/ui/Badge/` directory
- [ ] Move Badge function → `Badge.tsx`
- [ ] Add TypeScript props interface
- [ ] Create `index.ts` barrel export
- [ ] Update imports in `pages/index.tsx`
- [ ] Verify visually (no style changes)
- [ ] Test pro/beg variants render correctly
- [ ] Git commit: "refactor(ui): extract Badge component"

#### Button Component
- [ ] Create `components/ui/Button/` directory
- [ ] Enhance existing `components/Button.tsx` from `Btn` function
- [ ] Support all variants: primary, secondary, danger, success, orange, ghost, pro, beg
- [ ] Add size variants: sm, lg
- [ ] Add full-width prop
- [ ] Add disabled state
- [ ] Add aria-label support
- [ ] Create `index.ts` barrel export
- [ ] Update all `<Btn>` usages → `<Button>`
- [ ] Test all button variants (visual regression)
- [ ] Git commit: "refactor(ui): extract and enhance Button component"

#### Card Components
- [ ] Create `components/ui/Card/` directory
- [ ] Extract `Card` function → `Card.tsx`
- [ ] Extract `CardTitle` function → `CardTitle.tsx`
- [ ] Support className and style props
- [ ] Create `index.ts` barrel export
- [ ] Update imports in `pages/index.tsx`
- [ ] Verify all cards render correctly (check 13 screens)
- [ ] Git commit: "refactor(ui): extract Card and CardTitle components"

#### EmptyState Component
- [ ] Create `components/ui/EmptyState/` directory
- [ ] Extract `EmptyState` function → `EmptyState.tsx`
- [ ] Add icon and text props
- [ ] Add optional action button prop (future enhancement)
- [ ] Create `index.ts` barrel export
- [ ] Update imports in `pages/index.tsx`
- [ ] Test empty states across screens (Roster, Tournament, History)
- [ ] Git commit: "refactor(ui): extract EmptyState component"

#### Confetti Component
- [ ] Create `components/ui/Confetti/` directory
- [ ] Extract `Confetti` function → `Confetti.tsx`
- [ ] Verify animation works on champion screen
- [ ] Create `index.ts` barrel export
- [ ] Update imports in `pages/index.tsx`
- [ ] Test confetti on tournament completion
- [ ] Git commit: "refactor(ui): extract Confetti component"

#### TruncName Component
- [ ] Create `components/ui/TruncName/` directory
- [ ] Extract `TruncName` function → `TruncName.tsx`
- [ ] Ensure word-wrap behavior preserved
- [ ] Create `index.ts` barrel export
- [ ] Update imports in `pages/index.tsx`
- [ ] Test long player names (e.g., "Christopher Bartholomew")
- [ ] Git commit: "refactor(ui): extract TruncName component"

#### UI Barrel Export
- [ ] Create `components/ui/index.ts`
- [ ] Re-export all UI components: Badge, Button, Card, CardTitle, EmptyState, Confetti, TruncName
- [ ] Update imports in screens to use barrel: `import { Button, Card } from '@/components/ui'`
- [ ] Verify all screens still render
- [ ] Git commit: "refactor(ui): add barrel export for UI components"

### Create Shared Hooks

#### useFetch Hook
- [ ] Create `lib/hooks/useFetch.ts`
- [ ] Implement fetch abstraction with caching
- [ ] Add cacheTTL parameter (default: 60s)
- [ ] Add skip parameter (conditional fetching)
- [ ] Add refetch function (manual cache invalidation)
- [ ] Return `{ data, loading, error, refetch }`
- [ ] Add JSDoc documentation with examples
- [ ] Create `lib/hooks/index.ts` barrel export
- [ ] Git commit: "feat(hooks): add useFetch hook with caching"

#### useLocalStorage Hook
- [ ] Create `lib/hooks/useLocalStorage.ts`
- [ ] Implement localStorage abstraction with TypeScript generics
- [ ] Handle JSON serialization/deserialization
- [ ] Handle localStorage not available (SSR)
- [ ] Add JSDoc documentation
- [ ] Export from `lib/hooks/index.ts`
- [ ] Git commit: "feat(hooks): add useLocalStorage hook"

#### useAuth Hook
- [ ] Create `lib/hooks/useAuth.ts`
- [ ] Extract auth state logic from main app
- [ ] Manage isAdmin, authChecked, showLogin states
- [ ] Provide login/logout functions
- [ ] Add JSDoc documentation
- [ ] Export from `lib/hooks/index.ts`
- [ ] Git commit: "feat(hooks): add useAuth hook"

#### useDebounce Hook
- [ ] Create `lib/hooks/useDebounce.ts`
- [ ] Implement debounce logic for search inputs
- [ ] Add configurable delay parameter
- [ ] Add JSDoc documentation with example
- [ ] Export from `lib/hooks/index.ts`
- [ ] Git commit: "feat(hooks): add useDebounce hook"

### Create Utility Modules

#### Formatters
- [ ] Create `lib/utils/formatters.ts`
- [ ] Extract `formatVND` from `lib/payment.ts` (or keep if already there)
- [ ] Add date formatting utilities (formatDate, formatDateTime)
- [ ] Add number formatting (formatPercent, formatNumber)
- [ ] Add JSDoc documentation
- [ ] Export from `lib/utils/index.ts`
- [ ] Git commit: "feat(utils): add formatter utilities"

#### Validators
- [ ] Create `lib/utils/validators.ts`
- [ ] Add input validation functions (isValidEmail, isValidName)
- [ ] Add badminton scoring validation (isValidScore)
- [ ] Add JSDoc documentation
- [ ] Export from `lib/utils/index.ts`
- [ ] Git commit: "feat(utils): add validation utilities"

#### Constants
- [ ] Create `lib/utils/constants.ts`
- [ ] Extract `INITIAL_TOURNEY` constant
- [ ] Add other app-wide constants (MAX_PLAYERS, etc.)
- [ ] Export from `lib/utils/index.ts`
- [ ] Update imports in `pages/index.tsx`
- [ ] Git commit: "feat(utils): add constants module"

### Phase 1 Validation
- [ ] Run production build
- [ ] Compare bundle sizes (should be minimal change, mostly code organization)
- [ ] Run all manual tests (roster, tournament flow)
- [ ] Verify no console errors or warnings
- [ ] Verify TypeScript compiles with strict mode
- [ ] Update documentation
- [ ] Git tag: `v1.0-phase1-foundation`

---

## Phase 2: Small Screens Extraction (Week 2-3)

### ChampionScreen (Smallest - 24 lines)
- [ ] Create `components/screens/ChampionScreen/` directory
- [ ] Create `types.ts`: define ChampionScreenProps
- [ ] Create `ChampionScreen.tsx`: extract function
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: import ChampionScreen
- [ ] Keep eager-loaded (core tournament flow)
- [ ] Test: Complete tournament, verify champion screen displays
- [ ] Test: Confetti animation plays
- [ ] Test: "New Tournament" button works
- [ ] Test: "View History" button works
- [ ] Visual comparison: screenshot before/after
- [ ] Git commit: "refactor(screens): extract ChampionScreen"

### HistoryScreen (~205 lines)
- [ ] Create `components/screens/HistoryScreen/` directory
- [ ] Create `types.ts`: TournamentHistoryDoc, filters
- [ ] Create `hooks.ts`: useTournamentHistory hook (fetch + filter)
- [ ] Create `HistoryScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import with loading state
- [ ] Lazy-load (rarely accessed)
- [ ] Test: Navigate to History, verify tournaments display
- [ ] Test: Search/filter works
- [ ] Test: Delete tournament works
- [ ] Test: View tournament details works
- [ ] Test: Loading skeleton displays during fetch
- [ ] Git commit: "refactor(screens): extract HistoryScreen with lazy loading"

### BetHistoryScreen (~127 lines)
- [ ] Create `components/screens/BetHistoryScreen/` directory
- [ ] Create `types.ts`: BetDoc types
- [ ] Create `hooks.ts`: useBetHistory, useBetLeaderboard
- [ ] Create `BetHistoryScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (optional feature)
- [ ] Test: Navigate to Bets, verify history displays
- [ ] Test: Leaderboard displays correctly
- [ ] Test: Filter by player works
- [ ] Git commit: "refactor(screens): extract BetHistoryScreen"

### Phase 2 Validation
- [ ] Run production build
- [ ] Measure bundle sizes: expect ~5-10KB reduction
- [ ] Verify lazy loading: check Network tab, screens load on demand
- [ ] Test navigation between all screens
- [ ] Run Lighthouse audit (compare to baseline)
- [ ] Git tag: `v1.0-phase2-small-screens`

---

## Phase 3: Medium Screens Extraction (Week 3-4)

### RosterScreen (~198 lines)
- [ ] Create `components/screens/RosterScreen/` directory
- [ ] Create `types.ts`: RosterScreenProps, PlayerDoc
- [ ] Create `hooks.ts`: useRosterPlayers (fetch + CRUD operations)
- [ ] Create `RosterScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: import RosterScreen (eager-loaded)
- [ ] Keep eager-loaded (first screen users see)
- [ ] Test: Add player (pro/beg)
- [ ] Test: Edit player name (inline editing)
- [ ] Test: Toggle player group (pro ↔ beg)
- [ ] Test: Delete player (with confirmation)
- [ ] Test: Duplicate name validation
- [ ] Test: Player stats display correctly
- [ ] Test: "Start Tournament" button navigates to Setup
- [ ] Visual regression: compare screenshots
- [ ] Git commit: "refactor(screens): extract RosterScreen"

### SetupScreen (~203 lines)
- [ ] Create `components/screens/SetupScreen/` directory
- [ ] Create `types.ts`: SetupScreenProps, TournamentState
- [ ] Create `PlayerSelector.tsx`: sub-component for player list
- [ ] Create `SetupScreen.tsx`: extract main component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: import SetupScreen (eager-loaded)
- [ ] Keep eager-loaded (core tournament flow)
- [ ] Test: Select/deselect players (pro/beg)
- [ ] Test: Toggle game type (singles/doubles)
- [ ] Test: Toggle format (elimination/round-robin)
- [ ] Test: "Start Tournament" enabled only when enough players
- [ ] Test: Player count calculations (doubles teams)
- [ ] Test: Estimated rounds calculation
- [ ] Test: "Back to Roster" navigation
- [ ] Git commit: "refactor(screens): extract SetupScreen"

### RankingsScreen (~188 lines)
- [ ] Create `components/screens/RankingsScreen/` directory
- [ ] Create `types.ts`: RankingsScreenProps, PlayerRankings
- [ ] Create `PodiumDisplay.tsx`: extract podium visualization
- [ ] Create `hooks.ts`: useRankings (fetch + sort)
- [ ] Create `RankingsScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (not core tournament flow)
- [ ] Test: Navigate to Rankings, verify players sorted correctly
- [ ] Test: Podium displays top 3 (proportional sizing)
- [ ] Test: Click player opens profile modal
- [ ] Test: Win rate calculations correct
- [ ] Test: Filter by group (pro/beg) works
- [ ] Git commit: "refactor(screens): extract RankingsScreen with lazy loading"

### AnalyticsScreen (~213 lines)
- [ ] Create `components/screens/AnalyticsScreen/` directory
- [ ] Create `types.ts`: AnalyticsData, ChartData
- [ ] Create `hooks.ts`: useAnalytics (fetch + process data)
- [ ] Create `AnalyticsScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (admin-only, rare access)
- [ ] Test: Navigate to Analytics (admin only)
- [ ] Test: Charts render (player distribution, win trends)
- [ ] Test: Date range filter works
- [ ] Test: Data calculations accurate
- [ ] Git commit: "refactor(screens): extract AnalyticsScreen (admin only)"

### VenuesScreen (~289 lines)
- [ ] Create `components/screens/VenuesScreen/` directory
- [ ] Create `types.ts`: VenueDoc, VenueFormData
- [ ] Create `hooks.ts`: useVenues (fetch + CRUD)
- [ ] Create `VenuesScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (admin-only)
- [ ] Test: Add venue (name, address, courts)
- [ ] Test: Edit venue
- [ ] Test: Delete venue (with confirmation)
- [ ] Test: Court count validation
- [ ] Git commit: "refactor(screens): extract VenuesScreen"

### PricingRulesScreen (~93 lines)
- [ ] Create `components/screens/PricingRulesScreen/` directory
- [ ] Create `types.ts`: PricingRule types
- [ ] Create `hooks.ts`: usePricingRules (fetch + CRUD)
- [ ] Create `PricingRulesScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (admin-only)
- [ ] Test: Add pricing rule (time-based, player-based)
- [ ] Test: Edit rule
- [ ] Test: Delete rule
- [ ] Test: Rule priority/ordering works
- [ ] Git commit: "refactor(screens): extract PricingRulesScreen"

### AttendanceScreen (~496 lines)
- [ ] Create `components/screens/AttendanceScreen/` directory
- [ ] Create `types.ts`: AttendanceData, SessionData
- [ ] Create `hooks.ts`: useAttendance (fetch + calculations)
- [ ] Create `AttendanceScreen.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (admin-only)
- [ ] Test: View attendance calendar
- [ ] Test: Filter by date range
- [ ] Test: Player attendance statistics
- [ ] Test: Export functionality (if present)
- [ ] Git commit: "refactor(screens): extract AttendanceScreen"

### Phase 3 Validation
- [ ] Run production build
- [ ] Measure bundle sizes: expect ~40-50KB reduction
- [ ] Verify lazy loading works for all admin screens
- [ ] Test full user flow: Roster → Setup → Tournament
- [ ] Test admin features: Analytics, Venues, Pricing, Attendance
- [ ] Run Lighthouse audit (expect improvement)
- [ ] Git tag: `v1.0-phase3-medium-screens`

---

## Phase 4: Complex Screen - TournamentScreen (Week 4-5)

### TournamentScreen Sub-Components

#### MatchCard Component
- [ ] Create `components/screens/TournamentScreen/MatchCard.tsx`
- [ ] Extract MatchCard function (~100 lines)
- [ ] Add React.memo for performance (renders in lists)
- [ ] Custom comparison function (only re-render on score/winner change)
- [ ] Props: match, roundLabel, onScoreChange, onMarkWinner
- [ ] Test: Score increment/decrement works
- [ ] Test: Mark winner functionality
- [ ] Test: Bye matches display correctly
- [ ] Test: Completed matches styled correctly

#### BracketView Component
- [ ] Create `components/screens/TournamentScreen/BracketView.tsx`
- [ ] Extract BracketView function (~50 lines)
- [ ] Props: rounds, currentRoundIdx
- [ ] Test: Bracket visualization displays correctly
- [ ] Test: Highlight current round
- [ ] Test: Show match winners in bracket tree
- [ ] Test: Responsive design (mobile)

#### StandingsView Component
- [ ] Create `components/screens/TournamentScreen/StandingsView.tsx`
- [ ] Extract StandingsView function (~50 lines)
- [ ] Props: teams, rrStandings, gameType
- [ ] Test: Round-robin standings sorted correctly (wins, point diff)
- [ ] Test: Player stats display (wins, losses, pts, for/against)
- [ ] Test: Tie-breaking logic works

#### BetPanel Component (Shared)
- [ ] Create `components/shared/BetPanel/` directory
- [ ] Extract BetPanel function (~150 lines)
- [ ] Create `types.ts`: BetPanelProps, BetData
- [ ] Create `hooks.ts`: useBetPlacement
- [ ] Create `BetPanel.tsx`: extract component
- [ ] Create `index.ts`: barrel export
- [ ] Test: Place bet on match
- [ ] Test: View current bets
- [ ] Test: Bet settlement after match completion
- [ ] Test: Odds calculation correct

#### TournamentScreen Main Component
- [ ] Create `components/screens/TournamentScreen/` directory
- [ ] Create `types.ts`: TournamentScreenProps
- [ ] Create `hooks.ts`: useTournamentState (if needed)
- [ ] Create `TournamentScreen.tsx`: main container (~150 lines)
  - Import MatchCard, BracketView, StandingsView
  - Manage tab state (matches/bracket/history)
  - Handle match scoring logic
  - Handle round advancement
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: import TournamentScreen (eager-loaded)
- [ ] Keep eager-loaded (core tournament flow)

### Critical Testing for TournamentScreen
- [ ] **Match Scoring**: Increment/decrement scores (A and B)
- [ ] **Winner Detection**: Badminton scoring logic (21 pts, win by 2, max 30)
- [ ] **Round Advancement**: Elimination rounds advance correctly
- [ ] **Round-Robin Completion**: All matches played, standings updated
- [ ] **Bye Matches**: Handled correctly (no interaction, auto-advance)
- [ ] **Match History**: Completed matches saved to history
- [ ] **Real-time Updates**: State updates reflected immediately
- [ ] **Add Player Mid-Tournament**: Works only when no matches played
- [ ] **Reshuffle Unstarted Matches**: Only unstarted matches reshuffled
- [ ] **Manual Match Addition**: Custom matchups work
- [ ] **Tournament Cancellation**: State resets correctly
- [ ] **Tournament Reset**: Scores reset, rounds regenerated
- [ ] **Champion Detection**: Correct winner identified (elimination)
- [ ] **Champion Detection**: Correct winner identified (round-robin)
- [ ] **Bet Integration**: Bets display on matches, settle correctly
- [ ] **Loading States**: Skeleton screens during data fetch
- [ ] **Error Handling**: API errors handled gracefully

### Performance Testing
- [ ] Profile with React DevTools during tournament
- [ ] Verify MatchCard memoization reduces re-renders
- [ ] Check no unnecessary bracket/standings re-renders
- [ ] Measure render time for list of 16 matches
- [ ] Verify smooth scrolling on mobile

### Phase 4 Validation
- [ ] Run production build
- [ ] Measure bundle sizes (TournamentScreen should be separate chunk if needed)
- [ ] Play full tournament (4 players singles, 8 players doubles)
- [ ] Test elimination format (all rounds to champion)
- [ ] Test round-robin format (all matches, standings)
- [ ] Run regression tests with Playwright
- [ ] Git tag: `v1.0-phase4-tournament-screen`

---

## Phase 5: Most Complex Screen - PaymentScreen (Week 5-6)

### PaymentScreen is 2,264 lines - needs extensive refactoring

#### Tab Sub-Components

##### SummaryTab (~500 lines)
- [ ] Create `components/screens/PaymentScreen/SummaryTab.tsx`
- [ ] Extract summary calculation logic
- [ ] Extract monthly/weekly/range filtering
- [ ] Extract player balance display
- [ ] Extract outstanding debt calculations
- [ ] Props: players, sessions, mode (monthly/weekly/range)
- [ ] Test: Monthly summary calculates correctly
- [ ] Test: Weekly summary calculates correctly
- [ ] Test: Custom range summary works
- [ ] Test: Player balance calculations accurate
- [ ] Test: VND formatting displays correctly
- [ ] Test: Outstanding debt highlights work

##### AddSessionTab (~400 lines)
- [ ] Create `components/screens/PaymentScreen/AddSessionTab.tsx`
- [ ] Extract court session form logic
- [ ] Extract player selection (checkboxes)
- [ ] Extract venue selection dropdown
- [ ] Extract court count + shuttle count inputs
- [ ] Extract date/time picker
- [ ] Extract pricing calculation (call API)
- [ ] Props: players, venues, onAddSession
- [ ] Test: Add session with all fields
- [ ] Test: Player selection (check/uncheck)
- [ ] Test: Court/shuttle count validation
- [ ] Test: Pricing calculation accurate (matches API)
- [ ] Test: Session saves to database
- [ ] Test: Form resets after successful save

##### ImportTab (~300 lines)
- [ ] Create `components/screens/PaymentScreen/ImportTab.tsx`
- [ ] Extract PDF upload logic
- [ ] Extract invoice parsing (text extraction)
- [ ] Extract row parsing (parseImportText)
- [ ] Extract data validation before save
- [ ] Props: players, onImportSession
- [ ] Test: Upload PDF invoice
- [ ] Test: AI extraction works (Claude/Gemini)
- [ ] Test: Parse rows correctly (player name, amount)
- [ ] Test: Validate player names (match roster)
- [ ] Test: Handle parsing errors gracefully
- [ ] Test: Save imported session to DB

##### WeightsTab (~200 lines)
- [ ] Create `components/screens/PaymentScreen/WeightsTab.tsx`
- [ ] Extract player weight configuration
- [ ] Extract weight presets (equal split, custom)
- [ ] Extract weight validation (sum to 100%)
- [ ] Props: players, currentWeights, onUpdateWeights
- [ ] Test: Set custom weights per player
- [ ] Test: Equal split button works
- [ ] Test: Weight validation (sum = 100%)
- [ ] Test: Weights save and persist
- [ ] Test: Weights apply to payment calculations

##### DraftSessionsTab (~350 lines - already extracted)
- [ ] Verify existing `DraftSessionsTab` component
- [ ] Ensure it integrates cleanly with new PaymentScreen structure
- [ ] Test: Poll-based draft sessions display
- [ ] Test: Confirm draft session converts to real session
- [ ] Test: Delete draft session

#### PaymentScreen Main Container
- [ ] Create `components/screens/PaymentScreen/` directory
- [ ] Create `types.ts`: PaymentTab, SummaryMode, PlayerSummary, SummaryData
- [ ] Create `hooks.ts`:
  - usePaymentSummary (fetch + calculate summaries)
  - useCourtSessions (fetch + CRUD)
  - usePaymentConfig (fetch weights, pricing rules)
- [ ] Create `PaymentScreen.tsx`: main container (~300 lines)
  - Tab state management (summary/add/import/weights/drafts)
  - Render tab components conditionally
  - Pass props to sub-components
- [ ] Create `index.ts`: barrel export
- [ ] Update `pages/index.tsx`: add dynamic import
- [ ] Lazy-load (large screen, not core tournament flow)

### Critical Testing for PaymentScreen
- [ ] **Summary Calculations**: Verify total payments, per-player amounts
- [ ] **Monthly Summary**: Correct month filtering, totals
- [ ] **Weekly Summary**: Correct week boundaries (Monday-Sunday)
- [ ] **Range Summary**: Custom date range filtering
- [ ] **Add Session**: All fields save correctly, pricing accurate
- [ ] **Import Session**: PDF parsing works, players matched correctly
- [ ] **Weight Configuration**: Custom weights apply to calculations
- [ ] **Outstanding Debt**: Correctly identifies who owes money
- [ ] **Mark Paid**: Flipping paid status works, updates totals
- [ ] **Delete Session**: Removes from DB, recalculates totals
- [ ] **Draft Sessions**: Poll-based sessions convert correctly
- [ ] **Shuttlecock Allocation**: Monthly shuttle costs distributed correctly
- [ ] **API Integration**: All API calls succeed (sessions, configs, pricing)
- [ ] **Error Handling**: API errors display user-friendly messages
- [ ] **Loading States**: Skeletons display during data fetch

### Performance Testing
- [ ] Profile PaymentScreen rendering (should be lazy-loaded)
- [ ] Verify tab switching is smooth (no unnecessary re-fetches)
- [ ] Check summary calculations don't block UI (use useMemo)
- [ ] Verify large session lists render efficiently (consider virtualization)

### Phase 5 Validation
- [ ] Run production build
- [ ] Measure bundle sizes: expect ~60-80KB reduction
- [ ] PaymentScreen chunk should be separate (lazy-loaded)
- [ ] Test full payment flow: Add session → Import invoice → View summary → Mark paid
- [ ] Test with real data (100+ sessions, 50+ players)
- [ ] Run Lighthouse audit (expect significant improvement)
- [ ] Git tag: `v1.0-phase5-payment-screen`

---

## Phase 6: Optimization & Polish (Week 6-7)

### Memoization Optimization
- [ ] Add React.memo to MatchCard (TournamentScreen)
- [ ] Add React.memo to PlayerTile (if not already)
- [ ] Add React.memo to StatCard (AnalyticsScreen)
- [ ] Add React.memo to PodiumDisplay (RankingsScreen)
- [ ] Add React.memo to BetPanel
- [ ] Profile with React DevTools: verify re-render reduction
- [ ] Document memoization decisions in code comments

### useMemo Optimization
- [ ] Identify expensive computations in screens:
  - [ ] TournamentScreen: sorted standings, filtered matches
  - [ ] PaymentScreen: summary calculations, player balances
  - [ ] RankingsScreen: sorted rankings, podium positions
  - [ ] AnalyticsScreen: chart data processing
- [ ] Wrap expensive computations in useMemo
- [ ] Measure render time before/after
- [ ] Document performance improvements

### useCallback Optimization
- [ ] Wrap all event handlers passed to child components
- [ ] Ensure stable callback references for memoized components
- [ ] Audit dependency arrays (avoid over-specifying)
- [ ] Test: verify no unnecessary re-renders after useCallback

### Loading States Enhancement
- [ ] Replace generic "Loading..." with Skeleton components
- [ ] Add SkeletonCard for screen loading
- [ ] Add SkeletonTable for list loading
- [ ] Add SkeletonChart for analytics loading
- [ ] Ensure smooth transitions (no flash of loading state)

### Error Handling Enhancement
- [ ] Standardize error handling across all screens
- [ ] Create ErrorBoundary component (catch React errors)
- [ ] Add user-friendly error messages (no raw error objects)
- [ ] Add retry functionality for failed API calls
- [ ] Log errors to monitoring service (future: Sentry)

### Accessibility Audit
- [ ] Run Lighthouse accessibility audit on all screens
- [ ] Fix missing aria-labels on interactive elements
- [ ] Ensure keyboard navigation works (Tab, Enter, Esc)
- [ ] Test with screen reader (VoiceOver on macOS)
- [ ] Add focus management for modals/panels
- [ ] Ensure color contrast meets WCAG AA standards

### Performance Validation
- [ ] Run production build
- [ ] Measure final bundle sizes (compare to baseline)
- [ ] Run Lighthouse audit (target: 90+ performance score)
- [ ] Test on low-end Android device (simulate slow CPU)
- [ ] Test on 3G network (Chrome DevTools throttling)
- [ ] Measure Time to Interactive (target: <3.2s on 3G)
- [ ] Document all performance metrics in ADR

### Phase 6 Validation
- [ ] All screens optimized with memo/useMemo/useCallback
- [ ] No console warnings or errors
- [ ] Accessibility score >95
- [ ] Performance score >90 (mobile)
- [ ] Bundle size <100KB (initial load)
- [ ] Git tag: `v1.0-phase6-optimization`

---

## Phase 7: Documentation & Knowledge Transfer (Week 7-8)

### Code Documentation
- [ ] Add JSDoc comments to all public functions
- [ ] Add JSDoc comments to all custom hooks
- [ ] Add prop descriptions to all component interfaces
- [ ] Add usage examples in component files
- [ ] Document performance considerations (when to memo)

### Migration Documentation
- [ ] Complete MIGRATION-GUIDE.md with examples
- [ ] Create COMPONENT-CATALOG.md (component usage reference)
- [ ] Create API-DOCUMENTATION.md (API route reference)
- [ ] Create PERFORMANCE-PLAYBOOK.md (optimization guidelines)
- [ ] Add architecture diagrams (directory structure, data flow)

### Code Review Checklist
- [ ] Create PR template with checklist
- [ ] Add architecture review guidelines
- [ ] Add performance review guidelines
- [ ] Add accessibility review guidelines
- [ ] Document when to request architecture review

### Knowledge Transfer
- [ ] Schedule team walkthrough (1-2 hour session)
- [ ] Record video tutorial: "Creating a new screen"
- [ ] Record video tutorial: "Adding a new UI component"
- [ ] Create onboarding guide for new developers
- [ ] Update README.md with architecture overview

### Final Validation
- [ ] Full regression test (all user flows)
- [ ] Performance benchmark against baseline (document improvement)
- [ ] Security audit (no new vulnerabilities)
- [ ] Accessibility audit (all screens)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS Safari, Android Chrome)

### Phase 7 Completion
- [ ] All documentation complete and reviewed
- [ ] Team trained on new architecture
- [ ] All checklists complete
- [ ] Final metrics documented in ADR
- [ ] Git tag: `v1.0-architecture-complete`

---

## Success Metrics (Compare to Baseline)

### Bundle Size
- **Baseline**: 324KB (monolithic index.tsx)
- **Target**: <100KB (initial load) - **69% reduction**
- **Actual**: __________ (measured after Phase 7)

### Performance (3G Network)
- **Baseline Time to Interactive**: ~8.5s
- **Target**: <3.2s - **62% improvement**
- **Actual**: __________ (measured after Phase 7)

### Lighthouse Scores
- **Baseline Performance**: __________ (measure before starting)
- **Target**: 90+ (mobile)
- **Actual**: __________ (measured after Phase 7)

### Developer Experience
- **Baseline File Size**: 6,833 lines
- **Target Max File Size**: <600 lines per file
- **Largest File After Migration**: __________ lines

### Code Quality
- **Baseline Test Coverage**: 0%
- **Target**: 80% (future goal, not in this migration)
- **Actual**: __________ (measure after Phase 7)

---

## Rollback Plan

### Per-Phase Rollback
Each phase is a separate git tag. If issues arise:

1. Identify problematic phase
2. Revert to previous git tag: `git revert <tag>`
3. Deploy previous version
4. Debug issue in separate branch
5. Re-submit fixed version

### Individual Screen Rollback
Each screen extraction is a separate PR. If a specific screen has issues:

1. Identify problematic screen PR
2. Revert PR: `git revert <commit-hash>`
3. Keep old implementation temporarily
4. Debug and resubmit

### Feature Flag Strategy (High-Risk Screens)
For TournamentScreen and PaymentScreen, use environment variable feature flags:

```typescript
const USE_NEW_TOURNAMENT = process.env.NEXT_PUBLIC_USE_NEW_TOURNAMENT === 'true';

{view === 'tournament' && (
  USE_NEW_TOURNAMENT ? <TournamentScreen /> : <TournamentScreenLegacy />
)}
```

This allows instant rollback via environment variable change (no redeploy).

---

## Next Steps After Migration

These enhancements are deferred until after successful migration:

1. **React Query Migration**: Replace useFetch with React Query
2. **Context API**: Reduce prop drilling with global state
3. **Server Components**: Migrate to Next.js App Router
4. **Unit Testing**: Add Jest + React Testing Library
5. **E2E Testing**: Expand Playwright test coverage
6. **Storybook**: Create visual component catalog
7. **CI/CD**: Add bundle size checks to GitHub Actions
8. **Monitoring**: Add Sentry for error tracking

---

**Progress Tracker**: 0% complete (0/187 tasks)

**Last Updated**: 2026-06-24
