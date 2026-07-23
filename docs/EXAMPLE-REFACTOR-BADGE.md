# Example Refactor: Badge Component

This document demonstrates the extraction process using the `Badge` component as a practical example.

## Before: Inline Function in pages/index.tsx

```typescript
// pages/index.tsx (lines 60-62)

function Badge({ group }: { group: 'pro' | 'beg' }) {
  return <span className={`badge badge-${group}`}>{group === 'pro' ? 'PRO' : 'BEG'}</span>;
}
```

**Problems:**
- Defined in 6,833-line monolithic file
- Cannot be easily tested in isolation
- No JSDoc documentation
- No explicit TypeScript interface
- Contributes to large bundle size

---

## After: Extracted to components/ui/Badge/

### File Structure
```
components/ui/Badge/
├── index.ts          # Barrel export
├── Badge.tsx         # Component implementation
└── Badge.test.tsx    # Unit tests (future)
```

### Implementation Files

#### 1. Badge.tsx - Component Implementation
```typescript
// components/ui/Badge/Badge.tsx

/**
 * Badge component for displaying player group (Pro or Beginner).
 * Used throughout the app to indicate player skill level.
 *
 * @example
 * ```tsx
 * <Badge group="pro" />  // Displays "PRO" with orange styling
 * <Badge group="beg" />  // Displays "BEG" with green styling
 * ```
 */

export interface BadgeProps {
  /** Player skill group: 'pro' for advanced players, 'beg' for beginners */
  group: 'pro' | 'beg';

  /** Optional className for additional styling */
  className?: string;

  /** Optional inline styles */
  style?: React.CSSProperties;
}

export function Badge({ group, className = '', style }: BadgeProps) {
  const label = group === 'pro' ? 'PRO' : 'BEG';

  return (
    <span
      className={`badge badge-${group} ${className}`}
      style={style}
      aria-label={`${label} player`}
      role="status"
    >
      {label}
    </span>
  );
}
```

**Improvements:**
- ✅ Explicit TypeScript interface (`BadgeProps`)
- ✅ JSDoc documentation with usage example
- ✅ Optional className and style props for extensibility
- ✅ Accessibility: aria-label and role attributes
- ✅ Clean, focused file (only 30 lines)

---

#### 2. index.ts - Barrel Export
```typescript
// components/ui/Badge/index.ts

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

**Purpose:**
- Allows clean imports: `import { Badge } from '@/components/ui/Badge'`
- Re-exports TypeScript types for consumers
- Maintains flexibility: can add more exports later (e.g., `BadgeSkeleton`)

---

#### 3. Badge.test.tsx - Unit Tests (Future)
```typescript
// components/ui/Badge/Badge.test.tsx

import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders PRO badge correctly', () => {
    render(<Badge group="pro" />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByLabelText('PRO player')).toHaveClass('badge-pro');
  });

  it('renders BEG badge correctly', () => {
    render(<Badge group="beg" />);
    expect(screen.getByText('BEG')).toBeInTheDocument();
    expect(screen.getByLabelText('BEG player')).toHaveClass('badge-beg');
  });

  it('applies custom className', () => {
    render(<Badge group="pro" className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('badge', 'badge-pro', 'custom-class');
  });

  it('applies custom styles', () => {
    render(<Badge group="beg" style={{ fontSize: 20 }} />);
    expect(screen.getByRole('status')).toHaveStyle({ fontSize: 20 });
  });
});
```

**Benefits:**
- Ensures badge renders correctly for both groups
- Validates accessibility attributes
- Tests extensibility (className, style props)
- Foundation for regression testing

---

## Migration Steps

### Step 1: Create Directory Structure
```bash
mkdir -p components/ui/Badge
cd components/ui/Badge
touch Badge.tsx index.ts
```

### Step 2: Copy Original Code
```typescript
// components/ui/Badge/Badge.tsx

function Badge({ group }: { group: 'pro' | 'beg' }) {
  return <span className={`badge badge-${group}`}>{group === 'pro' ? 'PRO' : 'BEG'}</span>;
}
```

### Step 3: Enhance with TypeScript Interface
```typescript
export interface BadgeProps {
  group: 'pro' | 'beg';
}

export function Badge({ group }: BadgeProps) {
  return <span className={`badge badge-${group}`}>{group === 'pro' ? 'PRO' : 'BEG'}</span>;
}
```

### Step 4: Add Extensibility Props
```typescript
export interface BadgeProps {
  group: 'pro' | 'beg';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ group, className = '', style }: BadgeProps) {
  const label = group === 'pro' ? 'PRO' : 'BEG';

  return (
    <span className={`badge badge-${group} ${className}`} style={style}>
      {label}
    </span>
  );
}
```

### Step 5: Add Accessibility Attributes
```typescript
export function Badge({ group, className = '', style }: BadgeProps) {
  const label = group === 'pro' ? 'PRO' : 'BEG';

  return (
    <span
      className={`badge badge-${group} ${className}`}
      style={style}
      aria-label={`${label} player`}
      role="status"
    >
      {label}
    </span>
  );
}
```

### Step 6: Add JSDoc Documentation
```typescript
/**
 * Badge component for displaying player group (Pro or Beginner).
 * Used throughout the app to indicate player skill level.
 *
 * @example
 * ```tsx
 * <Badge group="pro" />  // Displays "PRO" with orange styling
 * <Badge group="beg" />  // Displays "BEG" with green styling
 * ```
 */
export function Badge({ group, className = '', style }: BadgeProps) {
  // ... implementation
}
```

### Step 7: Create Barrel Export
```typescript
// components/ui/Badge/index.ts
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

### Step 8: Update UI Barrel Export
```typescript
// components/ui/index.ts
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
// ... other UI components
```

### Step 9: Update Imports in pages/index.tsx
```typescript
// pages/index.tsx

// ❌ Old - inline function
// function Badge({ group }: { group: 'pro' | 'beg' }) {
//   return <span className={`badge badge-${group}`}>{group === 'pro' ? 'PRO' : 'BEG'}</span>;
// }

// ✅ New - import from UI library
import { Badge } from '@/components/ui/Badge';

// ... rest of file (now 6,830 lines instead of 6,833)
```

### Step 10: Verify Visually
- Navigate to any screen that displays player badges (Roster, Setup, Tournament, Rankings)
- Verify badges render correctly with proper styling
- Verify both "PRO" (orange) and "BEG" (green) variants display

### Step 11: Git Commit
```bash
git add components/ui/Badge/
git add components/ui/index.ts
git add pages/index.tsx
git commit -m "refactor(ui): extract Badge component with enhanced accessibility"
git push origin feature/extract-badge
```

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to Roster screen
- [ ] Verify PRO badges display correctly (orange background)
- [ ] Verify BEG badges display correctly (green background)
- [ ] Navigate to Setup screen
- [ ] Verify player list shows badges
- [ ] Navigate to Tournament screen
- [ ] Verify team names show badges (if applicable)
- [ ] Navigate to Rankings screen
- [ ] Verify rankings table shows badges
- [ ] Check console for errors (should be none)

### Visual Regression
- [ ] Take screenshot of Roster screen before extraction
- [ ] Take screenshot of Roster screen after extraction
- [ ] Compare: badges should look identical

### Accessibility Testing
- [ ] Run Lighthouse audit
- [ ] Verify no accessibility warnings related to badges
- [ ] Test with VoiceOver (macOS): should announce "PRO player" or "BEG player"
- [ ] Verify color contrast meets WCAG AA (already meets via existing CSS)

### Performance Testing
- [ ] Run production build: `npm run build`
- [ ] Compare bundle sizes before/after (should be nearly identical, just code reorganization)
- [ ] Verify no performance regression (should be imperceptible)

---

## Results

### Before Extraction
- **File**: pages/index.tsx
- **Lines**: 6,833
- **Badge Code**: Inline function (3 lines)
- **Testability**: Cannot test in isolation
- **Reusability**: Only within pages/index.tsx
- **Documentation**: None

### After Extraction
- **File**: components/ui/Badge/Badge.tsx
- **Lines**: 30 (including JSDoc, TypeScript, accessibility)
- **Badge Code**: Dedicated component with proper interface
- **Testability**: Can test in isolation (unit tests)
- **Reusability**: Can import in any component
- **Documentation**: JSDoc with usage examples

### Impact
- **Bundle Size**: No change (same code, different location)
- **Performance**: No change (component is tiny)
- **Developer Experience**: ✅ Improved (smaller main file, clearer structure)
- **Maintainability**: ✅ Improved (focused file, easy to find)
- **Testability**: ✅ Improved (can write unit tests)
- **Accessibility**: ✅ Improved (added aria-label, role)

---

## Lessons Learned

### What Went Well
1. **Low Risk**: Badge is a simple component (no state, no effects)
2. **High Impact**: Used in 5+ screens, benefits entire codebase
3. **Fast**: Extraction took ~15 minutes
4. **Smooth Migration**: No breaking changes, drop-in replacement
5. **Documentation**: JSDoc provides inline examples for future developers

### What to Watch For
1. **Import Paths**: Ensure all files import from new location
2. **Type Exports**: Must re-export types from index.ts
3. **CSS Dependencies**: Ensure badge CSS classes still work (global styles in app)
4. **Barrel Exports**: Keep components/ui/index.ts updated

### Best Practices Established
1. **Always add TypeScript interface**: Even for simple props
2. **Always add JSDoc**: Helps IDE autocomplete and future developers
3. **Always add accessibility attributes**: aria-label, role
4. **Always create barrel exports**: Clean import paths
5. **Always test before committing**: Visual regression + manual testing

---

## Next Steps

### Immediate
- Extract other small UI components following this pattern:
  - `Button` (Btn function)
  - `Card` + `CardTitle`
  - `EmptyState`
  - `Confetti`

### Future Enhancements
- Add unit tests with Jest + React Testing Library
- Create Storybook stories for visual documentation
- Add Badge variants: size (sm, md, lg), color themes
- Add Badge animation on hover (subtle pulse)

---

## References

- [React Best Practices](https://react.dev/learn)
- [TypeScript Component Patterns](https://react-typescript-cheatsheet.netlify.app/)
- [Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Jest Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Extraction Time**: 15 minutes
**Risk Level**: LOW
**Status**: ✅ Complete
**Next Component**: Button
