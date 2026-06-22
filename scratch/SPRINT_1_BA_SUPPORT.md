# Sprint 1: Business Analyst Support Document

**Sprint Goal:** Achieve WCAG AA compliance, implement loading states, and prepare architecture for component extraction

**BA Support Period:** Sprint 1 Execution (2 weeks)
**Last Updated:** 2026-06-22
**Status:** ACTIVE - S1.3 COMPLETED, S1.1 IN PROGRESS

---

## Current Sprint Status

### Completed Stories
- **S1.3: Color Contrast (WCAG AA)** ✅ APPROVED
  - Commit: `86ad9e1 - fix(accessibility): improve color contrast for WCAG AA compliance`
  - Changes: Updated `--text3` from `#9CA3AF` (3.2:1 contrast) to `#6B7280` (4.6:1 contrast)
  - Status: MEETS WCAG AA 4.5:1 requirement

### In Progress
- **S1.1: ARIA Labels** ⏳ AWAITING DEVELOPER QUESTIONS
- **S1.2: Keyboard Navigation** 📋 UPCOMING
- **S1.4: Skeleton Loaders** 📋 UPCOMING
- **S1.5: Mobile Table Overflow** 📋 UPCOMING

### File Context
- **Main App:** `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (5,184 lines)
- **Sidebar Navigation:** Lines 4600-4697
- **Global Styles:** `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/styles/globals.css`

---

## 1. Questions Answered

### Q1: Are ARIA labels too verbose for navigation buttons?

**Question from Developer:**
> "Should I add aria-label to every nav button, or is the visible text sufficient? For example:
> ```tsx
> <button className="nav-link">
>   <span className="nav-icon">🏅</span>
>   Rankings
> </button>
> ```
> Does this need `aria-label="Navigate to Rankings page"` or is the text content enough?"

**BA Answer:**

**Short answer:** The visible text "Rankings" is sufficient. DO NOT add aria-label in this case.

**Reasoning:**
- When a button has visible text content, screen readers will announce it correctly without aria-label
- Adding aria-label would override the visible text, creating confusion
- WCAG 2.5.3 (Label in Name) requires that accessible name matches visible text

**When to add ARIA labels:**
1. **Icon-only buttons** (no visible text)
2. **Buttons where context is unclear** (e.g., "Edit" - edit what?)
3. **Dynamic content** where state changes meaning

**Recommended approach for sidebar:**

```tsx
// ✅ GOOD: Visible text, no aria-label needed
<button className="nav-link">
  <span className="nav-icon">🏅</span>
  Rankings
</button>

// ✅ GOOD: Icon-only button NEEDS aria-label
<button className="btn btn-ghost" aria-label="Open mobile menu">
  ☰
</button>

// ✅ GOOD: Add aria-current for active state
<button
  className={`nav-link${activeView === 'rankings' ? ' active' : ''}`}
  aria-current={activeView === 'rankings' ? 'page' : undefined}
>
  <span className="nav-icon">🏅</span>
  Rankings
</button>
```

**User Impact:**
- **Screen reader users:** Will hear "Rankings, button, current page" when focused
- **Sighted users:** See consistent visual and accessible label
- **Cognitive users:** No confusion between what they see and what they hear

---

### Q2: Should modals have aria-describedby in addition to aria-labelledby?

**Question from Developer:**
> "I see the login modal has `aria-label="Admin login"`. Should I also add aria-describedby to point to the description paragraph?"

**BA Answer:**

**Short answer:** YES, add aria-describedby for richer context.

**Recommended implementation:**

```tsx
// ✅ BEST PRACTICE
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="login-heading"
  aria-describedby="login-description"
>
  <h2 id="login-heading">Admin Login</h2>
  <p id="login-description">
    Public pages are always accessible without login
  </p>
  {/* form fields */}
</div>
```

**Why both?**
- **aria-labelledby:** Announces the modal's primary purpose ("Admin Login")
- **aria-describedby:** Provides additional context ("Public pages are always accessible...")
- Screen readers announce: "Admin Login, dialog. Public pages are always accessible without login."

**User Scenarios:**

| User Type | Experience |
|-----------|------------|
| **Screen reader user** | Immediately understands they're in login modal AND that public pages don't require login |
| **Cognitive disability** | Gets reassurance that they can still view content without logging in |
| **Power user** | Quickly identifies modal purpose and can decide whether to proceed |

**Priority:** SHOULD HAVE (enhances UX but not required for WCAG compliance)

---

### Q3: Which elements need ARIA labels most urgently?

**Question from Developer:**
> "With limited time in Sprint 1, which elements should I prioritize for ARIA labels?"

**BA Answer:**

**Priority Matrix:**

| Priority | Element | Current State | Required Action | User Impact |
|----------|---------|---------------|-----------------|-------------|
| **P0 - CRITICAL** | Mobile hamburger menu | Icon-only (☰) | Add `aria-label="Open navigation menu"` | Mobile users cannot navigate app |
| **P0 - CRITICAL** | Close button (mobile menu) | Icon-only (✕) | Add `aria-label="Close navigation menu"` | Mobile users trapped in menu |
| **P1 - HIGH** | Active navigation state | Missing aria-current | Add `aria-current="page"` to active nav link | Screen reader users don't know current location |
| **P1 - HIGH** | Login modal close | Click overlay to close | Add `aria-label="Close login modal"` + Esc handler | Keyboard users can't close modal |
| **P2 - MEDIUM** | Navigation landmark | Missing role | Add `role="navigation"` to sidebar | Screen reader users can't jump to nav |
| **P3 - LOW** | Logo link | Has visible text | No action needed | Already accessible |

**Implementation order:**
1. Start with P0 items (mobile menu buttons)
2. Then P1 items (navigation state)
3. P2 and P3 if time permits

**Acceptance test:**
```
GIVEN I am using VoiceOver on iOS
WHEN I tap the hamburger menu
THEN I hear "Open navigation menu, button"
AND the menu opens
AND focus moves to first nav item

GIVEN the menu is open
WHEN I tap the close button
THEN I hear "Close navigation menu, button"
AND the menu closes
AND focus returns to hamburger button
```

---

### Q4: How verbose should payment cell popover ARIA labels be?

**Question from Developer:**
> "The payment summary table has cells that show detailed breakdown on hover. Should each cell have an aria-label like:
> `aria-label="Player Alice, Week 1, Court fee: 50,000 VND, Shuttlecock: 25,000 VND, Total owed: 75,000 VND"`?"

**BA Answer:**

**Short answer:** NO - that's too verbose and will create screen reader fatigue.

**Problem with verbose labels:**
- Payment table has 20+ players × 4 weeks = 80+ cells
- Screen reader users would hear 80 long descriptions when navigating table
- Creates "wall of text" that obscures the data

**Better approach: Accessible table structure**

```tsx
// ✅ GOOD: Let table semantics do the work
<table role="table" aria-label="Payment summary by player and period">
  <thead>
    <tr>
      <th scope="col">Player</th>
      <th scope="col">Week 1</th>
      <th scope="col">Week 2</th>
      <th scope="col">Total Outstanding</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Alice</th>
      <td>75,000₫</td>
      <td>50,000₫</td>
      <td>125,000₫</td>
    </tr>
  </tbody>
</table>

// Screen reader announces: "Alice, row header. 75,000 dong, cell."
// User gets context WITHOUT verbose aria-label
```

**For cells with hover popover:**

```tsx
// ❌ BAD: Too verbose
<td aria-label="Court fee: 50,000 VND, Shuttlecock: 25,000 VND, Total: 75,000 VND">
  75,000₫
</td>

// ✅ GOOD: Concise, use button for interaction
<td>
  <button
    className="cell-btn"
    aria-label="View payment breakdown"
    aria-haspopup="dialog"
    onClick={() => openBreakdownModal(player, week)}
  >
    75,000₫
  </button>
</td>
```

**User Experience:**

| Approach | Screen Reader User | Sighted User |
|----------|-------------------|--------------|
| **Verbose aria-label** | Hears long description for every cell (exhausting) | Sees concise value + hover popover |
| **Semantic table** | Hears "Alice, 75,000 dong" (efficient) | Sees concise value + hover popover |
| **Button with modal** | Can activate to hear full details when needed | Can hover or click for details |

**Recommendation:** Use semantic table structure + optional click-to-expand for details.

---

### Q5: Should keyboard focus be visible on ALL elements or just interactive ones?

**Question from Developer:**
> "Should I add focus styles to non-interactive elements like headings and paragraphs?"

**BA Answer:**

**Short answer:** NO - only interactive elements need visible focus.

**WCAG 2.4.7 (Focus Visible) requirements:**
- Focus indicator must be visible for **keyboard-operable elements**
- Interactive elements: buttons, links, inputs, selects, custom controls
- Non-interactive elements: headings, paragraphs, divs do NOT need focus styles

**Recommended focus styling:**

```css
/* ✅ GOOD: Focus only on interactive elements */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
[role="button"]:focus-visible,
[role="link"]:focus-visible,
[tabindex="0"]:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

/* Remove focus on mouse click (but keep for keyboard) */
button:focus:not(:focus-visible) {
  outline: none;
}
```

**Contrast requirement:**
- Focus outline must have 3:1 contrast against background
- Primary color `#7C3AED` on white background = 5.8:1 ✅ PASS

**Exception - skip links:**
```tsx
// ✅ GOOD: Skip to main content link (becomes visible on focus)
<a
  href="#main-content"
  className="skip-link"
  style={{
    position: 'absolute',
    left: '-9999px',
    zIndex: 9999,
  }}
  onFocus={(e) => {
    e.currentTarget.style.left = '0';
    e.currentTarget.style.top = '0';
  }}
  onBlur={(e) => {
    e.currentTarget.style.left = '-9999px';
  }}
>
  Skip to main content
</a>
```

**User Impact:**
- Keyboard users can see where they are at all times
- Mouse users don't see unnecessary focus rings on click
- Screen reader users can jump to main content

---

## 2. Acceptance Criteria Validation

### S1.3: Color Contrast ✅ APPROVED

**Story:** Fix color contrast ratios to meet WCAG AA

**Acceptance Criteria:**

| Criterion | Status | Evidence |
|-----------|--------|----------|
| All text meets 4.5:1 contrast for normal text | ✅ PASS | `--text3: #6B7280` on `#F8F7FF` = 4.6:1 |
| Large text meets 3:1 contrast | ✅ PASS | Headers use `--text: #1E1B4B` = 11.2:1 |
| Paid/unpaid status uses icon + color (not color alone) | ⚠️ PARTIAL | COLOR ONLY - needs icon |
| WAVE tool reports 0 contrast errors | 🔄 PENDING | Needs manual test |
| axe DevTools reports 0 violations | 🔄 PENDING | Needs manual test |

**BA Verdict:** **NEEDS REVISION**

**Missing requirement:**
- Payment cells use green/red background to indicate paid/unpaid status
- This violates WCAG 1.4.1 (Use of Color) - color cannot be the only visual means
- **Action required:** Add icon to cells (✓ for paid, ⏳ for unpaid)

**Suggested fix:**

```tsx
// ❌ CURRENT: Color only
<td style={{ background: isPaid ? '#10B981' : '#EF4444' }}>
  75,000₫
</td>

// ✅ RECOMMENDED: Icon + color
<td style={{ background: isPaid ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)' }}>
  {isPaid ? '✓' : '⏳'} 75,000₫
</td>
```

**Approval Status:** CONDITIONAL - approve after adding icons to paid/unpaid cells

---

### S1.1: ARIA Labels ⏳ IN PROGRESS

**Story:** Add ARIA labels to navigation menu

**Acceptance Criteria Review:**

| Criterion | Current Implementation | BA Assessment |
|-----------|----------------------|---------------|
| Sidebar nav has `role="navigation"` | ✅ YES - Line 4601 | MEETS CRITERIA |
| Each nav link has descriptive label | ✅ YES - Visible text | MEETS CRITERIA |
| Active nav item has `aria-current="page"` | ❌ MISSING | **BLOCKER** |
| Icon-only buttons have `aria-label` | ❌ MISSING | **BLOCKER** (mobile menu) |
| All form inputs have associated labels | 🔄 PARTIAL | Login form has placeholders, needs labels |

**Critical gaps:**

1. **Mobile hamburger menu** (Line 4586-4592):
   ```tsx
   // ❌ CURRENT: No aria-label
   <button className="btn btn-ghost" onClick={() => setMobileMenuOpen(prev => !prev)}>
     {mobileMenuOpen ? '✕' : '☰'}
   </button>

   // ✅ REQUIRED
   <button
     className="btn btn-ghost"
     aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
     aria-expanded={mobileMenuOpen}
     onClick={() => setMobileMenuOpen(prev => !prev)}
   >
     {mobileMenuOpen ? '✕' : '☰'}
   </button>
   ```

2. **Active navigation state** (Lines 4614-4627):
   ```tsx
   // ❌ CURRENT: No aria-current
   <button className={`nav-link${activeView === item.id ? ' active' : ''}`}>

   // ✅ REQUIRED
   <button
     className={`nav-link${activeView === item.id ? ' active' : ''}`}
     aria-current={activeView === item.id ? 'page' : undefined}
   >
   ```

3. **Login form labels** (Lines 4781-4800):
   ```tsx
   // ❌ CURRENT: Placeholder only
   <input className="input" placeholder="Username" />

   // ✅ REQUIRED
   <label htmlFor="login-username" className="visually-hidden">Username</label>
   <input id="login-username" className="input" placeholder="Username" />
   ```

**Approval Status:** BLOCKED - missing critical ARIA attributes

---

### S1.2: Keyboard Navigation 📋 UPCOMING

**Story:** Implement keyboard navigation support

**Pre-implementation BA Review:**

**Expected user scenarios:**

| User Action | Expected Behavior | Implementation Needed |
|-------------|-------------------|----------------------|
| Press Tab from browser address bar | Focus moves to "Skip to main content" link | Add skip link before sidebar |
| Press Tab repeatedly | Focus moves through nav links in order | Already works (native button behavior) |
| Press Enter on nav link | Navigates to that view | Already works |
| Press Tab into modal | Focus traps within modal | **MISSING - S1.8 dependency** |
| Press Esc in modal | Modal closes | **MISSING** |
| Press Tab on payment cell | Cell gets focus, popover appears | **MISSING - currently hover-only** |

**Critical implementation gaps:**

1. **Skip link** (accessibility best practice):
   ```tsx
   // ✅ REQUIRED for WCAG 2.4.1 (Bypass Blocks)
   <a href="#main-content" className="skip-link">
     Skip to main content
   </a>

   // CSS
   .skip-link {
     position: absolute;
     left: -9999px;
     z-index: 9999;
   }
   .skip-link:focus {
     left: 0;
     top: 0;
   }
   ```

2. **Modal Esc key handler:**
   ```tsx
   useEffect(() => {
     if (!showLogin) return;

     const handleEsc = (e: KeyboardEvent) => {
       if (e.key === 'Escape') setShowLogin(false);
     };

     window.addEventListener('keydown', handleEsc);
     return () => window.removeEventListener('keydown', handleEsc);
   }, [showLogin]);
   ```

3. **Popover keyboard trigger:**
   ```tsx
   <td
     tabIndex={0}
     onFocus={() => showPopover(player, week)}
     onBlur={() => hidePopover()}
     onKeyDown={(e) => {
       if (e.key === 'Escape') hidePopover();
     }}
   >
     75,000₫
   </td>
   ```

**Approval Status:** PENDING IMPLEMENTATION

---

### S1.4: Skeleton Loaders 📋 UPCOMING

**Story:** Add loading states with skeleton screens

**BA Pre-approval checklist:**

**Business Context:**
- Current loading state: Empty state with "⏳ Loading..." text
- Problem: Users don't know what content to expect
- Solution: Skeleton screens that match final content layout

**User scenarios:**

| Screen | Loading State | Skeleton Pattern |
|--------|---------------|------------------|
| **Rankings** | Fetching player rankings | Podium skeleton (3 cards) + table rows (5) |
| **Payment** | Fetching payment summary | Table skeleton (7 columns × 10 rows) |
| **History** | Fetching tournament history | Card skeleton (list of 5 cards) |

**Acceptance criteria questions for developer:**

**Q1:** How should skeleton loaders indicate loading state to screen readers?
- **BA Answer:** Add `aria-live="polite"` region with "Loading payment summary" text
- **Why:** Screen reader users need to know content is loading

**Q2:** Should skeleton loaders show exact data structure or generic placeholder?
- **BA Answer:** Match final content layout to prevent Cumulative Layout Shift (CLS)
- **Why:** Better UX + Core Web Vitals score

**Q3:** What happens if data loads too fast (< 300ms)?
- **BA Answer:** Don't show skeleton if data loads < 300ms (prevents flicker)
- **Why:** Skeleton appearing/disappearing quickly is jarring

**Recommended implementation:**

```tsx
const [showSkeleton, setShowSkeleton] = useState(false);

useEffect(() => {
  // Only show skeleton if loading takes > 300ms
  const timer = setTimeout(() => setShowSkeleton(true), 300);
  return () => clearTimeout(timer);
}, []);

if (loading && showSkeleton) {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="visually-hidden">Loading payment summary</span>
      <SkeletonLoader variant="table" rows={10} columns={7} />
    </div>
  );
}
```

**Approval Status:** PENDING IMPLEMENTATION

---

### S1.5: Mobile Table Overflow 📋 UPCOMING

**Story:** Improve mobile table responsiveness

**BA Pre-approval questions:**

**Q1: Which tables need mobile optimization?**

| Table | Current State | Priority | Approach |
|-------|---------------|----------|----------|
| **Payment Summary** | Horizontal scroll required | P0 - CRITICAL | Convert to card layout |
| **Rankings** | Horizontal scroll required | P1 - HIGH | Collapse columns (show rank + score only) |
| **History match list** | Acceptable (narrow) | P2 - MEDIUM | Already fits on mobile |

**Q2: What's the mobile breakpoint?**
- **BA Answer:** 768px (matches existing mobile-topbar breakpoint)
- **Why:** Consistency with existing mobile layout

**Q3: Should users be able to expand collapsed columns?**
- **BA Answer:** YES - use expandable/collapsible rows
- **Why:** Some users need full data on mobile

**User scenarios:**

```gherkin
GIVEN I am viewing Payment Summary on iPhone SE (375px width)
WHEN the table renders
THEN I see a card-based layout with:
  - Player name (prominent)
  - Total outstanding (large, colored)
  - "View Details" button
AND there is no horizontal scrolling

GIVEN I tap "View Details" on a payment card
WHEN the details expand
THEN I see:
  - Session-by-session breakdown
  - Court fees + shuttlecock fees
  - Paid/unpaid status
AND I can collapse it again by tapping "Hide Details"
```

**Mobile layout wireframe:**

```
┌─────────────────────────────────┐
│ 👤 Alice                   [✓]  │
│ Outstanding: 125,000₫           │
│                                 │
│ [View Details ▼]                │
└─────────────────────────────────┘

// After tapping "View Details"

┌─────────────────────────────────┐
│ 👤 Alice                   [✓]  │
│ Outstanding: 125,000₫           │
│                                 │
│ Week 1: 75,000₫    [⏳ Unpaid]  │
│   Court: 50,000₫               │
│   Shuttle: 25,000₫             │
│                                 │
│ Week 2: 50,000₫    [✓ Paid]    │
│   Court: 35,000₫               │
│   Shuttle: 15,000₫             │
│                                 │
│ [Hide Details ▲]                │
└─────────────────────────────────┘
```

**Touch target requirements:**
- All buttons: min 44×44px (WCAG 2.5.5 Target Size)
- Spacing between buttons: min 8px
- Test on iOS Safari + Android Chrome

**Approval Status:** PENDING IMPLEMENTATION

---

## 3. New Discoveries

### Discovery #1: Color-only status indicators violate WCAG

**Found during:** S1.3 (Color Contrast) review

**Issue:**
- Payment cells use background color to indicate paid/unpaid status
- Green = paid, Red = unpaid
- Violates WCAG 1.4.1 (Use of Color)

**User impact:**
- Users with color blindness cannot distinguish paid/unpaid
- 8% of male population has red-green color blindness

**Solution:**
- Add icon to cells: ✓ (paid), ⏳ (unpaid)
- Keep color for sighted users, add redundant indicator

**New user story for Sprint 2:**

```
Title: S2.9 - Add Icons to Payment Status Indicators

As a colorblind user,
I want payment status to use icons in addition to color,
So that I can distinguish paid/unpaid without relying on color alone.

Acceptance Criteria:
GIVEN I view the payment summary table
WHEN I see a payment cell
THEN paid cells show a ✓ icon + green background
AND unpaid cells show a ⏳ icon + red background
AND color is not the only indicator

GIVEN I am colorblind (deuteranopia)
WHEN I view payment status
THEN I can distinguish paid/unpaid by icon alone

Definition of Done:
- [ ] ✓ icon added to all paid cells
- [ ] ⏳ icon added to all unpaid cells
- [ ] Icons have sufficient contrast (4.5:1)
- [ ] Color + icon combination tested with colorblind simulator
- [ ] WAVE tool reports 0 "color alone" errors
```

**Priority:** MUST HAVE (compliance issue)
**Story Points:** 2
**Assign to:** Sprint 2

---

### Discovery #2: Modal focus trap is missing (blocks keyboard users)

**Found during:** S1.1 (ARIA Labels) review

**Issue:**
- Login modal does not trap focus
- Keyboard users can Tab out of modal to page behind it
- Violates WCAG 2.4.3 (Focus Order)

**User impact:**
- Keyboard users lose context
- Can accidentally interact with background page
- No way to close modal with Esc key

**Solution:**
- Create custom hook `useFocusTrap`
- Focus first input on modal open
- Cycle Tab/Shift+Tab within modal
- Close on Esc key
- Restore focus to trigger button on close

**Already planned:** S1.8 (Focus Management for Modals)

**Recommendation:** Prioritize S1.8 to P1 (HIGH) - this is a blocker for keyboard users

---

### Discovery #3: Mobile menu lacks accessible close mechanism

**Found during:** Navigation review (Lines 4586-4597)

**Issue:**
- Mobile menu opens with hamburger button
- Closes by clicking overlay (not keyboard accessible)
- No Esc key handler
- Close button (✕) lacks aria-label

**User impact:**
- Keyboard users trapped in mobile menu
- Screen reader users don't know how to close it

**Solution:**

```tsx
// ✅ REQUIRED
<button
  className="btn btn-ghost"
  aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
  aria-expanded={mobileMenuOpen}
  aria-controls="sidebar-nav"
  onClick={() => setMobileMenuOpen(prev => !prev)}
  onKeyDown={(e) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }}
>
  {mobileMenuOpen ? '✕' : '☰'}
</button>
```

**New acceptance criteria for S1.2:**
- [ ] Mobile menu closes on Esc key
- [ ] Close button has aria-label
- [ ] aria-expanded attribute toggles correctly
- [ ] Focus returns to hamburger button after close

---

### Discovery #4: Payment popover not keyboard accessible

**Found during:** Payment screen review

**Issue:**
- Cell popover shows detailed breakdown on hover
- Keyboard users cannot trigger popover (hover-only)
- No way to view breakdown without mouse

**User impact:**
- Keyboard users miss critical payment details
- Screen reader users have no access to breakdown

**Solution:**

```tsx
<td
  tabIndex={0}
  role="button"
  aria-label="View payment breakdown"
  aria-haspopup="dialog"
  onFocus={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    showPopover(player, week, rect);
  }}
  onBlur={() => hidePopover()}
  onMouseEnter={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    showPopover(player, week, rect);
  }}
  onMouseLeave={() => hidePopover()}
  onKeyDown={(e) => {
    if (e.key === 'Escape') hidePopover();
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openBreakdownModal(player, week);
    }
  }}
>
  75,000₫
</td>
```

**Alternative approach:** Replace hover popover with click-to-expand modal

**Recommendation:** Add to S1.2 (Keyboard Navigation) scope

---

## 4. Recommendations

### Recommendation #1: Create reusable FocusTrap component

**Context:** Multiple modals need focus trap (login, change password, edit session, invoice viewer)

**Problem:**
- Duplicating focus trap logic in every modal
- Easy to forget keyboard handlers
- Maintenance burden

**Proposed solution:**

```tsx
// /lib/hooks/useFocusTrap.ts
export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store previous focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus first tabbable element
    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();

    // Trap focus on Tab
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusables = Array.from(focusableElements || []) as HTMLElement[];
      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => {
      window.removeEventListener('keydown', handleTab);
      // Restore focus on close
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  return containerRef;
}
```

**Usage:**

```tsx
function LoginModal({ isOpen, onClose }) {
  const trapRef = useFocusTrap(isOpen);

  return (
    <div ref={trapRef} role="dialog" aria-modal="true">
      {/* modal content */}
    </div>
  );
}
```

**Business value:**
- Reduces development time for S1.8 and future modals
- Ensures consistent keyboard UX across all modals
- Easier to maintain and test

**Recommendation:** Create this hook as part of S1.8 implementation

---

### Recommendation #2: Add visual regression tests for accessibility

**Context:** Color contrast changes can accidentally break during future CSS updates

**Problem:**
- Manual WAVE/axe testing is time-consuming
- Easy to miss contrast regressions in code reviews
- No automated enforcement

**Proposed solution:**

```typescript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility compliance', () => {
  test('Homepage has no WCAG AA violations', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const results = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Tab through all interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('aria-label', 'Skip to main content');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toContainText('Rankings');
  });
});
```

**Business value:**
- Prevents accessibility regressions
- Automated enforcement in CI/CD
- Faster code reviews (automated checks)

**Recommendation:** Add to Sprint 1 or Sprint 2

**Effort:** 3 story points
**Priority:** SHOULD HAVE

---

### Recommendation #3: Document accessibility guidelines for team

**Context:** Team may not be familiar with WCAG requirements

**Problem:**
- Developers asking same questions repeatedly
- Inconsistent ARIA label patterns
- Risk of introducing new accessibility issues

**Proposed solution:**

Create `/docs/ACCESSIBILITY_GUIDELINES.md`:

```markdown
# SmashTour Accessibility Guidelines

## Quick Reference

### ARIA Labels
- ✅ DO add aria-label to icon-only buttons
- ❌ DON'T add aria-label when visible text exists
- ✅ DO add aria-current="page" to active nav items
- ❌ DON'T override visible text with different aria-label

### Keyboard Navigation
- ✅ DO support Tab, Shift+Tab, Enter, Esc, Arrow keys
- ❌ DON'T trap users in modals without Esc exit
- ✅ DO provide skip links for long navigation
- ❌ DON'T rely on mouse-only interactions (hover)

### Color Contrast
- ✅ DO ensure 4.5:1 contrast for normal text
- ❌ DON'T use color as the only indicator
- ✅ DO test with colorblind simulators
- ❌ DON'T assume all users see color

### Testing
- Run `npm run test:a11y` before every PR
- Test with keyboard only (unplug mouse!)
- Test with screen reader (VoiceOver on Mac, NVDA on Windows)
```

**Business value:**
- Faster onboarding for new developers
- Reduced BA support time
- Higher quality submissions

**Recommendation:** Create during Sprint 1

**Effort:** 2 hours
**Priority:** SHOULD HAVE

---

### Recommendation #4: Prioritize mobile menu accessibility in S1.2

**Context:** Mobile users cannot navigate app with keyboard

**Problem:**
- S1.2 is 5 story points with broad scope
- Risk of incomplete implementation
- Mobile menu is critical path for mobile users

**Proposed scope adjustment:**

**Split S1.2 into two stories:**

**S1.2A: Mobile Menu Keyboard Navigation (3 pts) - MUST HAVE**
- Mobile hamburger button aria-label
- Esc key to close menu
- Focus management (hamburger → first nav item → hamburger)
- aria-expanded attribute

**S1.2B: Desktop Keyboard Navigation (2 pts) - SHOULD HAVE**
- Skip to main content link
- Focus visible on all interactive elements
- Keyboard shortcuts (optional)

**Rationale:**
- Mobile users = 60%+ of traffic (assumption - verify with analytics)
- Mobile menu blocker is higher priority than skip link
- Reduces risk of incomplete implementation

**Recommendation:** Discuss with Product Owner for scope adjustment

---

## 5. Approval Status

### Story-by-Story Review

| Story | Status | Blockers | Next Action |
|-------|--------|----------|-------------|
| **S1.1: ARIA Labels** | ⚠️ NEEDS REVISION | Missing aria-current, icon button labels | Developer: add missing attributes |
| **S1.2: Keyboard Nav** | 📋 PENDING | Awaiting implementation | BA: pre-approve requirements |
| **S1.3: Color Contrast** | ⚠️ NEEDS REVISION | Missing icons for paid/unpaid | Developer: add ✓/⏳ icons to cells |
| **S1.4: Skeleton Loaders** | 📋 PENDING | Awaiting implementation | BA: provide skeleton design specs |
| **S1.5: Mobile Tables** | 📋 PENDING | Awaiting implementation | BA: approve card layout wireframes |
| **S1.6: Extract UI Components** | 📋 PENDING | Not started | Low priority - can defer to Sprint 2 |
| **S1.7: Form Validation** | 📋 PENDING | Not started | Should have - not blocking |
| **S1.8: Focus Management** | 📋 PENDING | Not started | CRITICAL - prioritize |
| **S1.9: Mobile Topbar** | ✅ COMPLETED | None | Already implemented (Line 4584-4597) |

---

### Sprint 1 Exit Criteria Assessment

**Current Progress: 22% complete (2/9 stories)**

| Exit Criterion | Target | Current | Status |
|----------------|--------|---------|--------|
| WCAG AA compliance score | >90% | ~75% (estimated) | ⚠️ AT RISK |
| All navigation keyboard accessible | 100% | 40% (sidebar yes, mobile menu no) | ⚠️ AT RISK |
| Mobile tables work without horizontal scroll | 100% | 0% (not implemented) | 🔴 NOT STARTED |
| Loading states on 3+ screens | 3 screens | 0 screens | 🔴 NOT STARTED |
| index.tsx reduced by >200 lines | -200 lines | 0 lines | 🔴 NOT STARTED |

**Risk Assessment:** MEDIUM-HIGH

**Mitigation:**
1. Focus on MUST HAVE stories first (S1.1, S1.2, S1.3, S1.5, S1.8)
2. Defer SHOULD HAVE stories to Sprint 2 if needed (S1.4, S1.6, S1.7)
3. S1.9 already done - early win!

---

## 6. Developer Support: Common Scenarios

### Scenario 1: "How do I test my ARIA labels?"

**Tools:**

1. **Browser DevTools:**
   - Chrome: Right-click → Inspect → Accessibility tab
   - Look for "Computed Properties" → "Name" (this is what screen reader announces)

2. **Screen Reader:**
   - Mac: VoiceOver (Cmd+F5 to enable)
   - Windows: NVDA (free download)
   - Test: Tab through elements and verify announcements

3. **axe DevTools Extension:**
   - Install: https://www.deque.com/axe/devtools/
   - Run scan: F12 → axe DevTools → Scan All
   - Fix violations before submitting PR

**Acceptance test:**
```
GIVEN I have implemented ARIA labels
WHEN I run axe DevTools scan
THEN I see 0 violations under "ARIA" category
AND I see 0 violations under "Keyboard" category
```

---

### Scenario 2: "My focus trap is not working, focus escapes the modal"

**Common mistakes:**

1. **Forgetting to return cleanup function:**
   ```tsx
   // ❌ BAD: Event listener never removed
   useEffect(() => {
     window.addEventListener('keydown', handleTab);
   }, []);

   // ✅ GOOD: Cleanup on unmount
   useEffect(() => {
     window.addEventListener('keydown', handleTab);
     return () => window.removeEventListener('keydown', handleTab);
   }, []);
   ```

2. **Incorrect focusable element selector:**
   ```tsx
   // ❌ BAD: Misses disabled buttons
   const focusables = modal.querySelectorAll('button, input');

   // ✅ GOOD: Excludes disabled
   const focusables = modal.querySelectorAll(
     'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
   );
   ```

3. **Not focusing first element on mount:**
   ```tsx
   // ❌ BAD: Focus stays on trigger button
   useEffect(() => {
     // ... focus trap logic
   }, [isOpen]);

   // ✅ GOOD: Focus first input on open
   useEffect(() => {
     if (!isOpen) return;
     const firstInput = modal.querySelector('input');
     firstInput?.focus();
     // ... rest of focus trap logic
   }, [isOpen]);
   ```

**Debug checklist:**
- [ ] Is cleanup function returning?
- [ ] Are disabled elements excluded from focus trap?
- [ ] Is first element focused on modal open?
- [ ] Does Tab cycle from last → first element?
- [ ] Does Shift+Tab cycle from first → last element?

---

### Scenario 3: "Should I use aria-describedby or aria-labelledby?"

**Decision matrix:**

| Use Case | Attribute | Example |
|----------|-----------|---------|
| **Primary label** (required) | aria-labelledby | Modal heading |
| **Secondary description** (optional) | aria-describedby | Modal subtitle/help text |
| **Both together** | Both | Modal with heading + description |
| **Dynamic content** | aria-live | Loading status, error messages |
| **Form field error** | aria-describedby | Input + error message |

**Examples:**

```tsx
// ✅ GOOD: Modal with both
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <h2 id="modal-title">Delete Player</h2>
  <p id="modal-desc">This action cannot be undone. Are you sure?</p>
  <button>Delete</button>
  <button>Cancel</button>
</div>

// ✅ GOOD: Input with error
<label htmlFor="player-name">Player Name</label>
<input
  id="player-name"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'name-error' : undefined}
/>
{hasError && (
  <span id="name-error" className="error">
    Name must be 3-30 characters
  </span>
)}

// ✅ GOOD: Live region for loading
<div aria-live="polite" aria-atomic="true">
  {loading ? 'Loading payment data...' : 'Payment data loaded'}
</div>
```

---

## 7. User Personas & Scenarios

### Persona 1: Kevin - Screen Reader User

**Profile:**
- Age: 32
- Disability: Blind since birth
- Device: iPhone 13 with VoiceOver
- Technical skill: Advanced
- Pain points: Poor ARIA labels, hover-only interactions

**User journey: Checking payment status**

| Step | Current Experience | After Sprint 1 |
|------|-------------------|----------------|
| 1. Navigate to Payments | "Payments, link" ✅ | "Payments, link, current page" ✅✅ |
| 2. Hear table structure | "Table, 0 rows" ❌ | "Payment summary by player and period, table, 20 rows" ✅ |
| 3. Navigate to cell | "75,000 dong" (no context) ⚠️ | "Alice, Week 1, 75,000 dong, button, view payment breakdown" ✅ |
| 4. Activate breakdown | Cannot (hover only) ❌ | Double-tap to open modal with full details ✅ |

**Success metric:** Kevin can complete payment check in <2 minutes (vs. impossible currently)

---

### Persona 2: Maria - Keyboard-Only User

**Profile:**
- Age: 45
- Disability: Repetitive strain injury (cannot use mouse)
- Device: Windows laptop, external keyboard
- Technical skill: Moderate
- Pain points: Focus traps, no Esc key support

**User journey: Logging in as admin**

| Step | Current Experience | After Sprint 1 |
|------|-------------------|----------------|
| 1. Navigate to login | Tab to "Admin Login" button ✅ | ✅ (unchanged) |
| 2. Open modal | Click button (cannot - no mouse!) ❌ | Press Enter to open ✅ |
| 3. Fill form | Tab to username, password ✅ | ✅ (unchanged) |
| 4. Submit | Tab to Submit, press Enter ✅ | ✅ (unchanged) |
| 5. Close modal (error case) | Must use mouse to click overlay ❌ | Press Esc to close ✅ |

**Success metric:** Maria can log in using keyboard only (currently impossible if form has error)

---

### Persona 3: Chen - Mobile User with Colorblindness

**Profile:**
- Age: 28
- Disability: Deuteranopia (red-green colorblindness)
- Device: Samsung Galaxy S21
- Technical skill: Moderate
- Pain points: Color-only indicators, small touch targets

**User journey: Checking which payments are due**

| Step | Current Experience | After Sprint 1 |
|------|-------------------|----------------|
| 1. Open mobile menu | Tap hamburger (no label) ⚠️ | Tap "Open navigation menu" button ✅ |
| 2. Navigate to Payments | Tap Payments link ✅ | ✅ (unchanged) |
| 3. View payment table | Scroll horizontally (awkward) ❌ | See card layout, no horizontal scroll ✅ |
| 4. Identify paid status | Cannot (green/red look same) ❌ | See ✓ icon (paid) or ⏳ icon (unpaid) ✅ |
| 5. Tap cell to see details | Target too small (36px) ❌ | Target 44×44px minimum ✅ |

**Success metric:** Chen can identify payment status without relying on color

---

## 8. Testing Checklist

### Manual Testing (Before PR Submission)

**Accessibility:**
- [ ] Run WAVE browser extension (0 errors)
- [ ] Run axe DevTools (0 violations)
- [ ] Test with VoiceOver/NVDA (all elements announced correctly)
- [ ] Test with keyboard only (unplug mouse!)
- [ ] Test with 200% zoom (no horizontal scroll)
- [ ] Test with Windows High Contrast mode (all elements visible)

**Browser testing:**
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

**Mobile testing:**
- [ ] iPhone SE (375px width)
- [ ] iPhone 12 (390px width)
- [ ] iPad (768px width)
- [ ] Samsung Galaxy S21 (360px width)

**Contrast testing:**
- [ ] Use WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- [ ] All text: 4.5:1 minimum
- [ ] Large text (18pt+): 3:1 minimum
- [ ] Focus indicators: 3:1 minimum

---

### Automated Testing (CI/CD)

**Playwright tests to add:**

```typescript
// tests/accessibility.spec.ts

test('Sidebar navigation is keyboard accessible', async ({ page }) => {
  await page.goto('/');

  // Tab to first nav link
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab'); // Skip link, then first nav

  const firstLink = page.locator('.nav-link').first();
  await expect(firstLink).toBeFocused();
  await expect(firstLink).toHaveAttribute('aria-current', 'page');
});

test('Mobile menu has aria-label', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const hamburger = page.locator('.mobile-topbar button').first();
  await expect(hamburger).toHaveAttribute('aria-label', 'Open navigation menu');

  await hamburger.click();
  await expect(hamburger).toHaveAttribute('aria-label', 'Close navigation menu');
  await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
});

test('Login modal closes on Esc key', async ({ page }) => {
  await page.goto('/');

  await page.click('#btn-admin-login');
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).toBeHidden();
});

test('Payment cells have both color and icon', async ({ page }) => {
  await page.goto('/');
  // ... navigate to payments

  const paidCell = page.locator('td:has-text("✓")').first();
  const unpaidCell = page.locator('td:has-text("⏳")').first();

  await expect(paidCell).toBeVisible();
  await expect(unpaidCell).toBeVisible();
});
```

---

## 9. Sprint Velocity Tracking

**Current velocity:** 2/34 story points complete (6%)

**Projected completion date:** At current rate, Sprint 1 will not complete on time

**Recommended actions:**

1. **Defer SHOULD HAVE stories:**
   - S1.4 (Skeleton Loaders) → Sprint 2
   - S1.6 (Extract UI Components) → Sprint 2
   - S1.7 (Form Validation) → Sprint 2

2. **Focus on MUST HAVE:**
   - S1.1 (ARIA Labels) - 2 pts
   - S1.2 (Keyboard Nav) - 5 pts
   - S1.3 (Color Contrast) - 3 pts (needs revision)
   - S1.5 (Mobile Tables) - 5 pts
   - S1.8 (Focus Management) - 3 pts
   - **Total: 18 pts (achievable in 1.5 weeks)**

3. **Parallel work:**
   - Developer A: S1.1 + S1.2
   - Developer B: S1.5 + S1.8
   - BA: Review S1.3 revision

---

## Contact BA for Questions

**Availability:** Daily standups (9:30 AM) + Slack (9 AM - 6 PM)

**Response SLA:**
- Blocker questions: <2 hours
- Clarifications: <4 hours
- Nice-to-have: <24 hours

**Escalation:**
- Stakeholder conflicts: Escalate to Product Owner
- Technical feasibility: Escalate to Solution Architect
- Accessibility uncertainty: BA will consult WCAG spec

---

**Document Version:** 1.0
**Last Updated:** 2026-06-22
**Next Review:** Daily standup (2026-06-23)
