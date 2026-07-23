# SmashTour Architecture Migration Guide

This guide helps developers work with the new modular architecture introduced in ADR-001.

## Table of Contents
- [Quick Start](#quick-start)
- [Creating a New Screen](#creating-a-new-screen)
- [Creating a New UI Component](#creating-a-new-ui-component)
- [Creating a Custom Hook](#creating-a-custom-hook)
- [Code-Splitting Best Practices](#code-splitting-best-practices)
- [Performance Guidelines](#performance-guidelines)
- [Testing Checklist](#testing-checklist)

---

## Quick Start

### File Organization Principles

1. **Screens** (`components/screens/`) - Full-page views with routing logic
2. **UI Components** (`components/ui/`) - Reusable design system elements (buttons, cards, badges)
3. **Shared Components** (`components/shared/`) - Feature components used across multiple screens (modals, panels)
4. **Hooks** (`lib/hooks/`) - Custom React hooks for state and side effects
5. **Utils** (`lib/utils/`) - Pure functions with no React dependencies

### Import Conventions

```typescript
// ✅ Good - Clean imports from index.ts
import { RosterScreen } from '@/components/screens/RosterScreen';
import { Button, Card, Badge } from '@/components/ui';
import { useFetch, useLocalStorage } from '@/lib/hooks';

// ❌ Bad - Direct file imports bypass barrel exports
import RosterScreen from '@/components/screens/RosterScreen/RosterScreen';
import Button from '@/components/ui/Button/Button';
```

---

## Creating a New Screen

### Step-by-Step Process

#### 1. Create Directory Structure
```bash
mkdir -p components/screens/MyNewScreen
cd components/screens/MyNewScreen
touch index.ts MyNewScreen.tsx types.ts hooks.ts
```

#### 2. Define Types (`types.ts`)
```typescript
// components/screens/MyNewScreen/types.ts

export interface MyNewScreenProps {
  onBack: () => void;
  initialData?: string;
}

export interface MyDataItem {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}
```

#### 3. Create Custom Hook (`hooks.ts`) - Optional
```typescript
// components/screens/MyNewScreen/hooks.ts

import { useFetch } from '@/lib/hooks/useFetch';
import type { MyDataItem } from './types';

export function useMyData() {
  const { data, loading, error, refetch } = useFetch<MyDataItem[]>({
    url: '/api/my-data',
    cacheTTL: 30000, // 30 seconds
  });

  async function addItem(name: string) {
    await fetch('/api/my-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    refetch(); // Invalidate cache
  }

  return { data, loading, error, addItem };
}
```

#### 4. Build Screen Component (`MyNewScreen.tsx`)
```typescript
// components/screens/MyNewScreen/MyNewScreen.tsx

import { useState } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';
import { useMyData } from './hooks';
import type { MyNewScreenProps } from './types';

export function MyNewScreen({ onBack, initialData }: MyNewScreenProps) {
  const { data, loading, addItem } = useMyData();
  const [inputValue, setInputValue] = useState('');

  if (loading) {
    return <div>Loading...</div>; // Use Skeleton component in real implementation
  }

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">📊 My New Screen</p>

      <Card>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter name..."
        />
        <Button onClick={() => addItem(inputValue)}>
          Add Item
        </Button>
      </Card>

      {!data || data.length === 0 ? (
        <EmptyState icon="📭" text="No items yet" />
      ) : (
        <div>
          {data.map(item => (
            <Card key={item.id}>{item.name}</Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 5. Export from Index (`index.ts`)
```typescript
// components/screens/MyNewScreen/index.ts

export { MyNewScreen } from './MyNewScreen';
export type { MyNewScreenProps, MyDataItem } from './types';
```

#### 6. Register in Main App (`pages/index.tsx`)

```typescript
// pages/index.tsx

import dynamic from 'next/dynamic';

// Lazy-load the screen
const MyNewScreen = dynamic(() => import('@/components/screens/MyNewScreen').then(m => ({ default: m.MyNewScreen })), {
  loading: () => <SkeletonCard />,
});

// Add to AppView type
type AppView = 'roster' | 'setup' | 'tournament' | 'mynew' | /* ... */;

// Add to render logic
export default function TournamentApp() {
  const [view, setView] = useState<AppView>('roster');

  return (
    <div className="app">
      <Suspense fallback={<SkeletonCard />}>
        {/* ... other screens ... */}
        {view === 'mynew' && <MyNewScreen onBack={() => setView('roster')} />}
      </Suspense>
    </div>
  );
}
```

#### 7. Add to Sidebar Navigation
```typescript
// components/shared/Sidebar/Sidebar.tsx

const menuItems = [
  // ... existing items ...
  { view: 'mynew', icon: '📊', label: 'My New Screen' },
];
```

---

## Creating a New UI Component

### Example: Creating a `LoadingSpinner` Component

#### 1. Create Component Structure
```bash
mkdir -p components/ui/LoadingSpinner
cd components/ui/LoadingSpinner
touch index.ts LoadingSpinner.tsx
```

#### 2. Implement Component
```typescript
// components/ui/LoadingSpinner/LoadingSpinner.tsx

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'var(--accent)',
  label = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeMap = { sm: 16, md: 32, lg: 48 };
  const dimension = sizeMap[size];

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: dimension,
          height: dimension,
          border: `3px solid ${color}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto',
        }}
        role="status"
        aria-label={label}
      />
      {label && <p style={{ marginTop: 8, color: 'var(--text2)' }}>{label}</p>}
    </div>
  );
}
```

#### 3. Export from Index
```typescript
// components/ui/LoadingSpinner/index.ts
export { LoadingSpinner } from './LoadingSpinner';
```

#### 4. Add to UI Barrel Export
```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Card, CardTitle } from './Card';
export { Badge } from './Badge';
export { LoadingSpinner } from './LoadingSpinner'; // Add this
```

#### 5. Use in Screens
```typescript
import { LoadingSpinner } from '@/components/ui';

if (loading) return <LoadingSpinner size="lg" label="Loading players..." />;
```

---

## Creating a Custom Hook

### Example: `useDebounce` Hook

```typescript
// lib/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying updates until after a specified delay.
 * Useful for search inputs to avoid excessive API calls.
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Export from Hooks Barrel
```typescript
// lib/hooks/index.ts
export { useFetch } from './useFetch';
export { useLocalStorage } from './useLocalStorage';
export { useAuth } from './useAuth';
export { useDebounce } from './useDebounce';
```

---

## Code-Splitting Best Practices

### When to Use Dynamic Imports

#### ✅ Lazy-Load These:
- **Admin-only screens** (Analytics, Venues, Pricing) - Not used by most users
- **Rare-use screens** (History, Attendance) - Accessed occasionally
- **Heavy screens** (Payment with 2,000+ lines) - Large bundle impact
- **Modal dialogs** (PlayerProfile, ConfirmationDialog) - Rendered conditionally

#### ❌ Eagerly Load These:
- **Core flow screens** (Roster, Setup, Tournament, Champion) - Used every session
- **Small UI components** (<5KB) - Dynamic import overhead > size savings
- **Critical path components** - Needed for initial render

### Dynamic Import Patterns

#### Pattern 1: Screen with Loading State
```typescript
import dynamic from 'next/dynamic';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';

const AnalyticsScreen = dynamic(
  () => import('@/components/screens/AnalyticsScreen').then(m => ({ default: m.AnalyticsScreen })),
  { loading: () => <SkeletonCard /> }
);
```

#### Pattern 2: Modal with No SSR
```typescript
import dynamic from 'next/dynamic';

const PlayerProfileModal = dynamic(
  () => import('@/components/shared/PlayerProfileModal'),
  { ssr: false } // Don't render on server
);
```

#### Pattern 3: Heavy Library (e.g., Chart.js)
```typescript
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(
  () => import('react-chartjs-2').then(m => m.Line),
  { ssr: false, loading: () => <div>Loading chart...</div> }
);
```

### Measuring Bundle Impact

```bash
# Build production bundle
npm run build

# Analyze bundle sizes
npx webpack-bundle-analyzer .next/static/chunks/*.js

# Check specific chunk size
ls -lh .next/static/chunks/pages/*.js
```

---

## Performance Guidelines

### React.memo Usage

#### When to Use React.memo
1. **List items** that re-render frequently (MatchCard, PlayerTile)
2. **Components with expensive rendering** (charts, visualizations)
3. **Components deep in the tree** that receive props from far ancestors
4. **Components with stable props** that change infrequently

#### When NOT to Use React.memo
1. **Top-level components** (already minimal re-renders)
2. **Components with volatile props** (changing on every render)
3. **Cheap components** (<10ms render time)
4. **Components rendered once** (modals, screens)

### Memoization Example

```typescript
import { memo } from 'react';

interface PlayerTileProps {
  name: string;
  group: 'pro' | 'beg';
  stats: { wins: number; titles: number };
  onClick?: () => void;
}

export const PlayerTile = memo(function PlayerTile({ name, group, stats, onClick }: PlayerTileProps) {
  return (
    <div className="player-tile" onClick={onClick}>
      <span>{name}</span>
      <Badge group={group} />
      <span>{stats.wins}W · {stats.titles}🏆</span>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these props change
  return (
    prevProps.name === nextProps.name &&
    prevProps.group === nextProps.group &&
    prevProps.stats.wins === nextProps.stats.wins &&
    prevProps.stats.titles === nextProps.stats.titles
  );
});
```

### useMemo and useCallback Best Practices

```typescript
import { useMemo, useCallback } from 'react';

function TournamentScreen({ matches, teams }: Props) {
  // ✅ Good - Expensive computation memoized
  const sortedTeams = useMemo(() => {
    return teams
      .sort((a, b) => b.stats.wins - a.stats.wins)
      .slice(0, 10);
  }, [teams]);

  // ✅ Good - Stable callback reference for child components
  const handleScoreChange = useCallback((id: string, delta: number) => {
    updateScore(id, delta);
  }, [updateScore]);

  // ❌ Bad - Premature optimization, simple operation
  const playerCount = useMemo(() => teams.length, [teams]);

  // ❌ Bad - Over-memoization, callback created on every render anyway
  const handleClick = useCallback(() => {
    console.log(sortedTeams); // Depends on sortedTeams, which changes often
  }, [sortedTeams]);

  return <div>...</div>;
}
```

### Avoiding Prop Drilling

#### Problem: Deep Prop Passing
```typescript
// ❌ Bad - Prop drilling through 4 levels
<TournamentScreen
  onScoreChange={handleScore}
  onMarkWinner={handleWinner}
  onReset={handleReset}
  onCancel={handleCancel}
  onAddPlayer={handleAddPlayer}
  /* ... 10 more props ... */
/>
```

#### Solution 1: Group Related Props
```typescript
// ✅ Better - Group related callbacks
interface TournamentActions {
  onScoreChange: (id: string, delta: number) => void;
  onMarkWinner: (id: string, side: 'A' | 'B') => void;
  onReset: () => void;
  onCancel: () => void;
}

<TournamentScreen
  state={tournamentState}
  actions={tournamentActions}
  players={allPlayers}
/>
```

#### Solution 2: Context API (For Global State)
```typescript
// lib/context/TournamentContext.tsx
import { createContext, useContext, useState } from 'react';

const TournamentContext = createContext<TournamentState | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(INITIAL_TOURNEY);

  return (
    <TournamentContext.Provider value={{ state, setState }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournament must be used within TournamentProvider');
  return context;
}

// Usage in components
function MatchCard() {
  const { state } = useTournament();
  // Access state without prop drilling
}
```

---

## Testing Checklist

### Before Extracting a Component
- [ ] Identify all props passed to component
- [ ] Identify all state used within component
- [ ] Identify all callbacks/functions used
- [ ] Document expected behavior (what should happen on interactions)
- [ ] Take screenshots of current UI state

### After Extracting a Component
- [ ] Component renders without errors
- [ ] All props are correctly typed (TypeScript validates)
- [ ] Component UI matches original (visual comparison)
- [ ] All interactions work (buttons, inputs, clicks)
- [ ] API calls still work (if applicable)
- [ ] Navigation works (if screen component)
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader labels present
- [ ] Bundle size decreased (check with `npm run build`)

### Performance Validation
- [ ] Component doesn't cause unnecessary re-renders (use React DevTools Profiler)
- [ ] Lazy-loaded components show loading state (not blank screen)
- [ ] No layout shift when component loads (CLS score)
- [ ] Console has no warnings or errors
- [ ] Memory leaks checked (no dangling event listeners)

### Integration Testing
- [ ] Test full user flow (e.g., Roster → Setup → Tournament)
- [ ] Test with real API data (not just mock data)
- [ ] Test error scenarios (API failure, network offline)
- [ ] Test edge cases (empty lists, max limits, special characters)
- [ ] Test on mobile viewport (responsive design)
- [ ] Test in incognito mode (no cached data)

---

## Common Pitfalls & Solutions

### Pitfall 1: Circular Dependencies
**Problem**: `A.tsx` imports `B.tsx`, `B.tsx` imports `A.tsx`

**Solution**: Extract shared logic to a third file
```typescript
// ❌ Bad
// A.tsx imports B.tsx
// B.tsx imports A.tsx

// ✅ Good
// Create shared.ts
// A.tsx imports shared.ts
// B.tsx imports shared.ts
```

### Pitfall 2: Forgetting to Memoize Callbacks
**Problem**: Child component re-renders even though props didn't change

**Solution**: Wrap callbacks in `useCallback`
```typescript
// ❌ Bad - New function on every render
<MatchCard onScoreChange={(id, delta) => updateScore(id, delta)} />

// ✅ Good - Stable reference
const handleScoreChange = useCallback((id: string, delta: number) => {
  updateScore(id, delta);
}, [updateScore]);

<MatchCard onScoreChange={handleScoreChange} />
```

### Pitfall 3: Over-fetching Data
**Problem**: Same API endpoint called multiple times in short period

**Solution**: Use `useFetch` hook with caching
```typescript
// ❌ Bad - Fetch on every component mount
useEffect(() => {
  fetch('/api/players').then(r => r.json()).then(setPlayers);
}, []);

// ✅ Good - Cache for 30 seconds
const { data: players } = useFetch<PlayerDoc[]>({
  url: '/api/players',
  cacheTTL: 30000,
});
```

### Pitfall 4: Large Bundle Chunks
**Problem**: Lazy-loaded chunk is still 200KB+ (no improvement)

**Solution**: Further split the component into sub-components
```typescript
// ❌ Bad - PaymentScreen is still 200KB
const PaymentScreen = dynamic(() => import('@/components/screens/PaymentScreen'));

// ✅ Good - Split into tabs
const SummaryTab = dynamic(() => import('@/components/screens/PaymentScreen/SummaryTab'));
const ImportTab = dynamic(() => import('@/components/screens/PaymentScreen/ImportTab'));
// ... each tab lazy-loaded separately
```

---

## Code Review Checklist

Use this checklist when reviewing PRs that extract components:

### Structure
- [ ] Component is in correct directory (`screens/`, `ui/`, or `shared/`)
- [ ] Has `index.ts` barrel export
- [ ] Types extracted to `types.ts` (if >3 interfaces)
- [ ] Custom hooks in `hooks.ts` (if screen-specific)

### Code Quality
- [ ] TypeScript types are strict (no `any`)
- [ ] Props interface clearly defined
- [ ] Functions are pure where possible
- [ ] No console.log statements (use proper logging)
- [ ] Error handling in place (try/catch for API calls)

### Performance
- [ ] Heavy screens are lazy-loaded
- [ ] List components use `React.memo` if appropriate
- [ ] Expensive computations use `useMemo`
- [ ] Event handlers use `useCallback`

### Accessibility
- [ ] Buttons have `aria-label` where text is ambiguous
- [ ] Form inputs have labels or `aria-label`
- [ ] Interactive elements are keyboard-accessible
- [ ] Focus management for modals/panels

### Testing
- [ ] Component renders without errors (manual test)
- [ ] All interactions work (manual test)
- [ ] Screenshots attached to PR (before/after)
- [ ] Bundle size impact documented in PR description

---

## Quick Reference: File Templates

### Screen Component Template
```typescript
// components/screens/[ScreenName]/[ScreenName].tsx
import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { [ScreenName]Props } from './types';

export function [ScreenName]({ onBack }: [ScreenName]Props) {
  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">🎯 Screen Title</p>
      <p className="page-sub">Screen description</p>

      <Card>
        {/* Content */}
      </Card>
    </div>
  );
}
```

### Custom Hook Template
```typescript
// lib/hooks/use[HookName].ts
import { useState, useEffect } from 'react';

export function use[HookName]() {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effect logic
  }, []);

  return { state, setState };
}
```

### UI Component Template
```typescript
// components/ui/[ComponentName]/[ComponentName].tsx
interface [ComponentName]Props {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function [ComponentName]({ children, variant = 'primary' }: [ComponentName]Props) {
  return (
    <div className={`component-name component-name-${variant}`}>
      {children}
    </div>
  );
}
```

---

## Getting Help

- **Architecture Questions**: Refer to [ADR-001-Performance-Architecture-Refactoring.md](./ADR-001-Performance-Architecture-Refactoring.md)
- **Component Questions**: See component source code and JSDoc comments
- **Performance Issues**: Use React DevTools Profiler and Lighthouse audits
- **Bug Reports**: Check console errors, verify TypeScript types, test in isolation

---

**Last Updated**: 2026-06-24
**Maintained By**: SmashTour Development Team
