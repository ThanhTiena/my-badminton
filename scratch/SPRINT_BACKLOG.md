# SmashTour Sprint Backlog
**Business Analyst:** Ready-to-Implement Sprint Plan
**Date Created:** 2026-06-21
**Planning Horizon:** 3 Sprints (6 weeks)

---

## Executive Summary

This sprint backlog addresses three strategic imperatives:
1. **Player Experience**: Enable self-service payment transparency
2. **Technical Health**: Reduce technical debt in 5,182-line monolithic component
3. **Accessibility & Mobile**: Achieve WCAG compliance and improve mobile UX

**Business Value Delivered:**
- Reduce host burden by 40% (self-service features)
- Improve mobile conversion by 60% (PWA foundation)
- Decrease bug reports by 50% (component isolation)
- Increase accessibility score from F to B+ (WCAG compliance)

---

## Epic Breakdown

### Epic 1: Player Self-Service Portal
**Business Objective:** Empower players to view their payment obligations and history without contacting the host.

**Success Metrics:**
- 80% of players use self-service within 2 weeks of launch
- Host inquiries about payments drop by 60%
- Average session duration increases by 30%

**Stories:** S2.1 - S2.8

---

### Epic 2: Technical Debt Reduction
**Business Objective:** Improve maintainability, reduce bug surface area, and enable faster feature development.

**Success Metrics:**
- Reduce main component from 5,182 to <1,500 lines
- Decrease useState hooks from 154 to <30 per component
- Reduce build time by 25%
- Enable 2 developers to work on Payment screen simultaneously

**Stories:** S3.1 - S3.7

---

### Epic 3: Accessibility & Mobile Foundation
**Business Objective:** Ensure all users can access the application, improve mobile experience, and meet compliance standards.

**Success Metrics:**
- WCAG 2.1 AA compliance score >90%
- Mobile accessibility score >85%
- Reduce keyboard navigation steps by 40%
- Mobile bounce rate decreases by 35%

**Stories:** S1.1 - S1.9

---

# SPRINT 1 (2 weeks): Foundation & Quick Wins
**Sprint Goal:** Achieve WCAG compliance, implement loading states, and prepare architecture for component extraction.

**Velocity Target:** 34 story points
**Risk Level:** LOW
**Dependencies:** None - all stories are independent

---

## S1.1: Add ARIA Labels to Navigation Menu
**Priority:** MUST HAVE
**Story Points:** 2

**User Story:**
As a screen reader user,
I want to navigate the sidebar menu using assistive technology,
So that I can access all application features independently.

**Acceptance Criteria:**
```gherkin
GIVEN I am using a screen reader
WHEN I focus on the sidebar navigation
THEN each nav link announces its purpose clearly
AND the active nav link is announced as "current page"
AND section labels are marked as navigation landmarks

GIVEN I am on the Payment screen
WHEN I tab through interactive elements
THEN all buttons and inputs have descriptive ARIA labels
AND form fields have associated labels
AND error messages are announced to screen readers
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 4700-4850 - Sidebar navigation)

- **Changes required:**
  - Add `role="navigation"` to sidebar nav
  - Add `aria-label` to each nav link
  - Add `aria-current="page"` to active nav links
  - Add `aria-label` to all icon-only buttons
  - Add `id` and `htmlFor` associations for form inputs

**Definition of Done:**
- [ ] All sidebar nav links have descriptive `aria-label`
- [ ] Active nav item has `aria-current="page"`
- [ ] All icon-only buttons have `aria-label`
- [ ] All form inputs have associated labels
- [ ] Screen reader testing completed (VoiceOver/NVDA)
- [ ] No WAVE tool errors for navigation
- [ ] Code review approved
- [ ] Deployed to staging

---

## S1.2: Implement Keyboard Navigation Support
**Priority:** MUST HAVE
**Story Points:** 5

**User Story:**
As a keyboard-only user,
I want to navigate all interactive elements using Tab/Shift+Tab and activate with Enter/Space,
So that I can use the application without a mouse.

**Acceptance Criteria:**
```gherkin
GIVEN I am on the Tournament screen
WHEN I press Tab repeatedly
THEN focus moves through all interactive elements in logical order
AND focus is visible with a clear outline
AND I can activate any button with Enter or Space

GIVEN I open a modal dialog
WHEN the modal appears
THEN focus is trapped within the modal
AND pressing Esc closes the modal
AND focus returns to the trigger element

GIVEN I am on the Payment screen cell hover popover
WHEN I focus the cell with keyboard
THEN the popover appears on focus (not just hover)
AND I can dismiss it with Esc
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 1807-4000 - PaymentScreen)
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/styles/globals.css` (add focus-visible styles)

- **Changes required:**
  - Add `:focus-visible` styles to all interactive elements
  - Implement focus trap for modals (login, edit session, invoice viewer)
  - Add `onFocus` handlers to cells to show popover (not just `onMouseEnter`)
  - Add `onKeyDown` handlers for Esc key to close modals
  - Ensure tab order is logical (remove `tabindex` values >0)

**Definition of Done:**
- [ ] All interactive elements are keyboard accessible
- [ ] Focus outline is visible with at least 3:1 contrast ratio
- [ ] Modal focus trap implemented and tested
- [ ] Esc key closes all modals
- [ ] Tab order is logical across all screens
- [ ] Keyboard navigation documented in README
- [ ] Lighthouse accessibility score >85%
- [ ] QA approved

---

## S1.3: Fix Color Contrast Ratios (WCAG AA)
**Priority:** MUST HAVE
**Story Points:** 3

**User Story:**
As a user with low vision,
I want all text to have sufficient contrast against backgrounds,
So that I can read all content comfortably.

**Acceptance Criteria:**
```gherkin
GIVEN I am viewing any screen
WHEN I inspect text color against background
THEN all text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
AND color is not the only indicator of state (e.g., paid/unpaid)

GIVEN I view the payment summary table
WHEN I see paid vs unpaid cells
THEN cells use both color AND icon/pattern to indicate status
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/styles/globals.css` (lines 34-39 - color variables)

- **Problem areas identified:**
  - `--text3: #9CA3AF` on `--bg: #F8F7FF` = 2.8:1 (FAIL - needs 4.5:1)
  - `--text2: #6B7280` on `--bg: #F8F7FF` = 4.2:1 (CLOSE - needs 4.5:1)
  - `.nav-link` inactive state may have low contrast

- **Changes required:**
  - Darken `--text3` from `#9CA3AF` to `#71717A` (4.6:1 contrast)
  - Darken `--text2` from `#6B7280` to `#52525B` (7.0:1 contrast)
  - Add icons to paid/unpaid indicators (not just green/red background)

**Definition of Done:**
- [ ] All text passes WCAG AA contrast ratio (4.5:1)
- [ ] Large text passes 3:1 contrast ratio
- [ ] Paid/unpaid status uses icon + color (not color alone)
- [ ] WAVE tool reports 0 contrast errors
- [ ] axe DevTools reports 0 contrast violations
- [ ] Visual regression tests pass
- [ ] Stakeholder approval (design team)

---

## S1.4: Add Loading States with Skeleton Screens
**Priority:** SHOULD HAVE
**Story Points:** 5

**User Story:**
As a user,
I want to see skeleton placeholders while data is loading,
So that I understand the app is working and know what content to expect.

**Acceptance Criteria:**
```gherkin
GIVEN I navigate to the Payment screen
WHEN the payment data is loading
THEN I see skeleton placeholders for the table
AND the loading state shows the structure of the content
AND spinners do not cause layout shift

GIVEN I navigate to the Rankings screen
WHEN the rankings data is loading
THEN I see skeleton placeholders for the podium and table
AND the skeleton matches the final content layout
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 1807-4000 PaymentScreen, 1631-1806 RankingsScreen)
  - Create new file: `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/components/SkeletonLoader.tsx`

- **Changes required:**
  - Create reusable `SkeletonLoader` component with variants: table, card, podium
  - Replace all instances of `<EmptyState icon="⏳" text="Loading..." />` with skeleton
  - Add CSS shimmer animation (already exists in globals.css line 95)
  - Ensure skeleton has same dimensions as loaded content (prevent layout shift)

**Component Design:**
```tsx
<SkeletonLoader variant="table" rows={5} columns={7} />
<SkeletonLoader variant="podium" />
<SkeletonLoader variant="card" />
```

**Definition of Done:**
- [ ] SkeletonLoader component created with 3 variants
- [ ] Payment screen shows skeleton while loading
- [ ] Rankings screen shows skeleton while loading
- [ ] History screen shows skeleton while loading
- [ ] No layout shift when content loads (CLS <0.1)
- [ ] Lighthouse Performance score maintained >80%
- [ ] Accessibility: skeleton has aria-label="Loading content"
- [ ] Code review approved

---

## S1.5: Improve Mobile Table Responsiveness
**Priority:** MUST HAVE
**Story Points:** 5

**User Story:**
As a mobile user,
I want to view the payment summary table on my phone without horizontal scrolling,
So that I can review my payment details comfortably.

**Acceptance Criteria:**
```gherkin
GIVEN I view the Payment summary table on mobile (<768px)
WHEN the table renders
THEN it switches to a card-based layout (stacked rows)
AND all data is visible without horizontal scrolling
AND touch targets are at least 44x44px

GIVEN I view the Rankings table on mobile
WHEN the table renders
THEN columns collapse intelligently
AND player name + rank score remain visible
AND I can tap to expand details
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 2400-2800 - Payment summary table)
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/styles/globals.css` (add responsive table styles)

- **Changes required:**
  - Add CSS media query @media (max-width: 768px) to convert table to card layout
  - Create mobile-specific table component with collapsible columns
  - Ensure all buttons meet 44x44px touch target minimum
  - Add horizontal scroll with fade indicators for tables that can't collapse

**Mobile Layout Pattern:**
```
Desktop: | Name | Sessions | Court | Shuttle | Total | Paid |
Mobile:
  Card 1:
    Name: Alice
    Sessions: 12 | Total: 450,000₫
    [Paid ✓]
```

**Definition of Done:**
- [ ] Payment table is fully usable on mobile without horizontal scroll
- [ ] Rankings table is readable on mobile
- [ ] All touch targets ≥44x44px
- [ ] Lighthouse Mobile score >80%
- [ ] Tested on iOS Safari and Android Chrome
- [ ] No horizontal overflow on screens ≥320px width
- [ ] UX review approved
- [ ] Deployed to staging

---

## S1.6: Extract Small UI Components from Monolith
**Priority:** SHOULD HAVE
**Story Points:** 5

**User Story:**
As a developer,
I want small reusable UI components extracted from the main file,
So that I can reuse them and reduce the size of index.tsx.

**Acceptance Criteria:**
```gherkin
GIVEN I want to use a Button component
WHEN I import it
THEN it is in a separate file (components/Button.tsx)
AND it has TypeScript types exported
AND it has the same props as before (no breaking changes)

GIVEN I am reading the codebase
WHEN I open pages/index.tsx
THEN it is <5,000 lines (down from 5,182)
AND small atoms are imported from components folder
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/ui/Button.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/ui/Card.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/ui/Badge.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/ui/EmptyState.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/ui/index.ts` (barrel export)

- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 27-74 - remove component definitions, add imports)

- **Components to extract:**
  - `Btn` → `Button.tsx` (lines 27-44)
  - `Card` + `CardTitle` → `Card.tsx` (lines 46-52)
  - `Badge` → `Badge.tsx` (lines 54-56)
  - `TruncName` → `TruncatedName.tsx` (lines 59-65)
  - `EmptyState` → `EmptyState.tsx` (lines 67-74)

**Definition of Done:**
- [ ] 5 UI components extracted to separate files
- [ ] All components have TypeScript interfaces exported
- [ ] All components are documented with JSDoc comments
- [ ] Barrel export created (components/ui/index.ts)
- [ ] All imports updated in index.tsx
- [ ] No breaking changes (all existing props work)
- [ ] All screens still render correctly
- [ ] Unit tests created for each component
- [ ] Bundle size remains the same or decreases
- [ ] Code review approved

---

## S1.7: Add Form Validation Error States
**Priority:** SHOULD HAVE
**Story Points:** 3

**User Story:**
As a user filling out a form,
I want to see clear error messages when I make a mistake,
So that I can correct it and submit successfully.

**Acceptance Criteria:**
```gherkin
GIVEN I am adding a new player
WHEN I submit without entering a name
THEN an error message appears below the input
AND the input has a red border
AND the error is announced to screen readers

GIVEN I am importing payment data
WHEN I paste invalid CSV format
THEN I see a detailed error message explaining what's wrong
AND the error includes an example of correct format
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 107-300 RosterScreen, 1807-4000 PaymentScreen)
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/styles/globals.css` (add .input-error styles)

- **Changes required:**
  - Add `.input-error` CSS class with red border
  - Add `<ErrorMessage />` component below inputs
  - Add `aria-describedby` to inputs with errors
  - Add `aria-live="polite"` region for error announcements
  - Improve error messages from generic "Failed" to specific reasons

**Error Message Examples:**
- Player name: "Player name is required (3-30 characters)"
- CSV import: "Invalid format. Expected: date,players,courtFee,numShuttlecocks,shuttlecockUnitPrice"
- Login: "Invalid username or password. Please try again."

**Definition of Done:**
- [ ] All forms show validation errors inline
- [ ] Errors are announced to screen readers
- [ ] Error messages are specific and actionable
- [ ] Error state is visually distinct (red border)
- [ ] Errors clear when user corrects input
- [ ] axe DevTools reports 0 form errors
- [ ] QA approved
- [ ] Deployed to staging

---

## S1.8: Implement Focus Management for Modals
**Priority:** MUST HAVE
**Story Points:** 3

**User Story:**
As a keyboard user,
I want focus to be trapped inside modal dialogs,
So that I don't accidentally navigate outside the modal with Tab.

**Acceptance Criteria:**
```gherkin
GIVEN I open the Edit Session modal
WHEN the modal appears
THEN focus moves to the first input field
AND pressing Tab cycles through modal elements only
AND pressing Shift+Tab cycles backwards
AND pressing Esc closes the modal

GIVEN I close a modal
WHEN the modal disappears
THEN focus returns to the button that opened it
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (all modal components)
  - Create: `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/lib/hooks/useFocusTrap.ts`

- **Modals to fix:**
  - Login modal (`showLogin` state)
  - Edit Session modal (`editingSession` state)
  - Invoice viewer modal (`invoiceModal` state)
  - Change password modal (`showChangePw` state)

- **Implementation:**
  - Create `useFocusTrap` custom hook
  - Use `useRef` to store trigger element
  - Add `keydown` listener for Tab and Esc
  - Focus first tabbable element on mount
  - Return focus on unmount

**Definition of Done:**
- [ ] All modals trap focus within their boundaries
- [ ] Tab/Shift+Tab cycle through modal elements only
- [ ] Esc key closes all modals
- [ ] Focus returns to trigger element on close
- [ ] Screen reader announces modal open/close
- [ ] Lighthouse accessibility score >90%
- [ ] Keyboard navigation tested
- [ ] Code review approved

---

## S1.9: Create Responsive Mobile Topbar
**Priority:** MUST HAVE
**Story Points:** 3

**User Story:**
As a mobile user,
I want to access the navigation menu from a hamburger icon,
So that I can navigate the app on small screens.

**Acceptance Criteria:**
```gherkin
GIVEN I am on mobile (<768px)
WHEN I view the app
THEN the sidebar is hidden by default
AND I see a top bar with hamburger menu icon
AND the hamburger icon has min 44x44px touch target

GIVEN I tap the hamburger menu
WHEN the menu opens
THEN the sidebar slides in from the left
AND the rest of the page is dimmed with overlay
AND tapping the overlay closes the menu
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (lines 4700-4850 - Sidebar)
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/styles/globals.css` (lines 265-285 - mobile-topbar already exists)

- **Changes required:**
  - Add `mobileMenuOpen` state
  - Add hamburger button to `.mobile-topbar`
  - Add `onClick` to toggle sidebar with `.open` class
  - Add overlay `<div>` when menu is open
  - Add slide-in animation for sidebar
  - Ensure body scroll is locked when menu is open

**Mobile Topbar Layout:**
```
[🍔 Menu] SmashTour [Profile Icon]
```

**Definition of Done:**
- [ ] Mobile topbar appears on screens <768px
- [ ] Hamburger icon has 44x44px touch target
- [ ] Sidebar slides in smoothly (0.3s transition)
- [ ] Overlay dims background when menu is open
- [ ] Tapping overlay closes menu
- [ ] Body scroll locked when menu is open
- [ ] Tested on iOS Safari and Android Chrome
- [ ] No layout shift on orientation change
- [ ] UX review approved

---

## Sprint 1 Summary
**Total Story Points:** 34
**Must Have:** 18 points (S1.1, S1.2, S1.3, S1.5, S1.8, S1.9)
**Should Have:** 16 points (S1.4, S1.6, S1.7)
**Could Have:** 0 points

**Risk Mitigation:**
- Start with Must Have stories first
- S1.6 (component extraction) can be deferred to Sprint 2 if velocity is low
- All stories are independent - can be worked in parallel

**Success Criteria:**
- Lighthouse Accessibility score >85% (up from ~60%)
- Mobile usability score >80%
- Zero WCAG AA violations
- index.tsx reduced by >200 lines

---

# SPRINT 2 (2 weeks): Player Self-Service Portal
**Sprint Goal:** Enable players to view their payment history and outstanding debt without contacting the host.

**Velocity Target:** 32 story points
**Risk Level:** MEDIUM
**Dependencies:** S2.1 must complete before S2.2-S2.5

---

## S2.1: Create Public Player Lookup Endpoint
**Priority:** MUST HAVE
**Story Points:** 3

**User Story:**
As a player,
I want to access my payment information using my name,
So that I can view my debt without logging in.

**Acceptance Criteria:**
```gherkin
GIVEN I navigate to /player?name=Alice
WHEN the page loads
THEN I see my outstanding debt summary
AND I see my recent payment sessions
AND the data is public (no authentication required)

GIVEN no player matches the name
WHEN I search
THEN I see a friendly message "Player not found"
AND I see a suggestion to check spelling
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/player.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/api/player/[name].ts`

- **API endpoint:**
  - `GET /api/player/[name]` - public endpoint (no auth)
  - Returns: `{ playerName, totalOutstanding, breakdown[], sessions[] }`
  - Use existing `/api/payment/outstanding-debt?playerName=X` logic

- **Changes required:**
  - Create new Next.js page `/player.tsx` with query param `?name=`
  - Call existing `/api/payment/outstanding-debt?playerName=X` endpoint
  - Display debt summary and session list
  - Add case-insensitive name matching

**Definition of Done:**
- [ ] Public player page created (/player?name=X)
- [ ] API endpoint returns player debt data
- [ ] Case-insensitive name matching works
- [ ] "Player not found" state handled gracefully
- [ ] Page is mobile responsive
- [ ] No authentication required
- [ ] E2E test created for happy path
- [ ] Deployed to staging

---

## S2.2: Display Outstanding Debt Summary
**Priority:** MUST HAVE
**Story Points:** 3

**User Story:**
As a player,
I want to see my total outstanding debt at the top of my payment page,
So that I immediately know how much I owe.

**Acceptance Criteria:**
```gherkin
GIVEN I view my player page
WHEN the page loads
THEN I see a prominent card showing my total debt
AND the amount is in VND with thousand separators
AND the card uses a warm color (orange/red) if debt >0
AND the card shows green "All Paid ✓" if debt = 0

GIVEN I have debt across multiple months
WHEN I view the summary
THEN I see a breakdown by month (e.g., "Jan 2026: 150,000₫")
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/player.tsx`

- **UI Design:**
```
┌─────────────────────────────────┐
│ 💰 Outstanding Balance          │
│                                 │
│     450,000₫                    │
│     Across 3 months             │
│                                 │
│ Jan 2026: 150,000₫              │
│ Feb 2026: 200,000₫              │
│ Mar 2026: 100,000₫              │
└─────────────────────────────────┘
```

- **Data source:**
  - Use `/api/payment/outstanding-debt?playerName=X`
  - Returns `{ totalOutstanding, breakdown[] }`

**Definition of Done:**
- [ ] Debt summary card displays prominently
- [ ] Amount formatted with thousand separators (formatVND)
- [ ] Card color changes based on debt status (green/orange)
- [ ] Month-by-month breakdown shown
- [ ] Zero debt shows "All Paid ✓" message
- [ ] Mobile responsive
- [ ] Accessibility: debt amount announced by screen readers
- [ ] Visual design approved

---

## S2.3: Show Payment Session History Table
**Priority:** MUST HAVE
**Story Points:** 5

**User Story:**
As a player,
I want to see a list of all sessions I attended with payment amounts,
So that I can verify the charges are correct.

**Acceptance Criteria:**
```gherkin
GIVEN I view my player page
WHEN I scroll down
THEN I see a table of all sessions I attended
AND each row shows: date, amount owed (exact), amount owed (rounded), note
AND sessions are sorted newest first
AND I can see if each session has invoice images attached

GIVEN a session has a note
WHEN I hover over the note icon
THEN I see the full note text in a tooltip
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/player.tsx`

- **Table Columns:**
  | Date       | Amount (Exact) | Amount (Rounded) | Note              | Invoice |
  |------------|----------------|------------------|-------------------|---------|
  | 2026-03-15 | 37,500₫        | 38,000₫          | Court 3, Saturday | 📄 (2)  |

- **Data source:**
  - Use `/api/payment/outstanding-debt?playerName=X`
  - Returns `sessions[]` array with sessionDate, amountOwed, amountOwedRounded, note

- **Mobile responsive:**
  - On mobile, collapse to card layout (date + amount)
  - Tap to expand full details

**Definition of Done:**
- [ ] Session history table displays all sessions
- [ ] Columns show date, exact amount, rounded amount, note, invoice count
- [ ] Sessions sorted by date descending (newest first)
- [ ] Note icon shows tooltip on hover
- [ ] Invoice count shows number of attached images
- [ ] Mobile: table converts to card layout
- [ ] Empty state: "No sessions found"
- [ ] Accessibility: table has proper headers
- [ ] Code review approved

---

## S2.4: Add Invoice Image Viewer
**Priority:** SHOULD HAVE
**Story Points:** 5

**User Story:**
As a player,
I want to view invoice images for each session,
So that I can verify the charges against the actual receipt.

**Acceptance Criteria:**
```gherkin
GIVEN a session has invoice images
WHEN I click the invoice icon
THEN a modal opens showing the invoice image
AND I can zoom in/out on the image
AND I can navigate between multiple images (prev/next)

GIVEN I am viewing an invoice image
WHEN I press Esc or click outside
THEN the modal closes
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/player.tsx`
  - Create: `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/InvoiceModal.tsx`

- **Changes required:**
  - Create `InvoiceModal` component with image carousel
  - Fetch invoice images on demand (not in initial load)
  - Add pinch-to-zoom support for mobile
  - Add prev/next navigation if multiple images

- **API changes:**
  - Extend `/api/payment/sessions/[id]` to return invoiceImages
  - OR create new endpoint `/api/payment/invoices/[sessionId]`

**Modal Design:**
```
┌─────────────────────────────────────┐
│  [← Prev]   Invoice 1 of 2   [Next →] │
│                                     │
│       [Invoice Image Here]          │
│       (pinch to zoom)               │
│                                     │
│  Session Date: 2026-03-15           │
│  Amount: 37,500₫                    │
└─────────────────────────────────────┘
```

**Definition of Done:**
- [ ] Invoice modal opens when clicking invoice icon
- [ ] Image displays at full resolution
- [ ] Pinch-to-zoom works on mobile
- [ ] Prev/Next buttons navigate between images
- [ ] Esc key closes modal
- [ ] Focus trapped within modal
- [ ] Loading state shown while image loads
- [ ] Accessibility: modal has aria-label
- [ ] Code review approved

---

## S2.5: Implement Session Filtering and Search
**Priority:** COULD HAVE
**Story Points:** 5

**User Story:**
As a player with many sessions,
I want to filter my session history by date range or month,
So that I can find specific sessions quickly.

**Acceptance Criteria:**
```gherkin
GIVEN I have sessions across multiple months
WHEN I select a month from the filter dropdown
THEN only sessions from that month are shown
AND the table updates without full page reload

GIVEN I want to see sessions from a date range
WHEN I enter start and end dates
THEN sessions within that range are displayed
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/player.tsx`

- **Filter UI:**
```
[Filter by Month ▼] [Date Range: From ___ To ___] [Clear]
```

- **Implementation:**
  - Add month dropdown (last 12 months)
  - Add date range inputs
  - Filter sessions client-side (array.filter)
  - Optionally: add query params to URL for bookmarkable filters

**Definition of Done:**
- [ ] Month filter dropdown implemented
- [ ] Date range filter implemented
- [ ] Filters work independently and combined
- [ ] Clear button resets all filters
- [ ] URL query params update when filtering
- [ ] Empty state shown when no sessions match
- [ ] Mobile: filters stack vertically
- [ ] Performance: no lag with 100+ sessions
- [ ] UX review approved

---

## S2.6: Add QR Code for Quick Access
**Priority:** COULD HAVE
**Story Points:** 3

**User Story:**
As a host,
I want to generate a QR code for each player's payment page,
So that players can quickly access their info by scanning.

**Acceptance Criteria:**
```gherkin
GIVEN I am viewing a player's payment info in admin mode
WHEN I click "Generate QR Code"
THEN a QR code appears containing the URL /player?name=Alice
AND I can download the QR code as an image
AND I can copy the URL to share

GIVEN a player scans the QR code
WHEN they visit the URL
THEN their payment page loads immediately
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (Payment screen, add QR button per player)
  - Add dependency: `qrcode` package

- **Changes required:**
  - Install `qrcode` npm package
  - Add "QR Code" button next to each player in admin payment view
  - Generate QR code for URL: `${window.location.origin}/player?name=${playerName}`
  - Show QR code in modal with download option

**QR Code Modal:**
```
┌─────────────────────────────┐
│  QR Code for Alice          │
│                             │
│     [QR CODE IMAGE]         │
│                             │
│  URL: /player?name=Alice    │
│  [Copy Link] [Download PNG] │
└─────────────────────────────┘
```

**Definition of Done:**
- [ ] QR code generated for player URLs
- [ ] QR code displays in modal
- [ ] Download PNG button works
- [ ] Copy URL button works
- [ ] QR code scans correctly on mobile devices
- [ ] Modal is accessible (keyboard, screen readers)
- [ ] E2E test: scan QR code → player page loads
- [ ] Deployed to staging

---

## S2.7: Add Share Button for Player Page
**Priority:** COULD HAVE
**Story Points:** 2

**User Story:**
As a player,
I want to share my payment page URL with others,
So that I can easily send it to friends or save it for later.

**Acceptance Criteria:**
```gherkin
GIVEN I am on my player page
WHEN I click the Share button
THEN the Web Share API opens (if supported)
OR the URL is copied to clipboard (fallback)
AND I see a confirmation message "Link copied!"

GIVEN I share the link
WHEN someone clicks it
THEN they see my public payment page
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/player.tsx`

- **Implementation:**
  - Add Share button in page header
  - Use `navigator.share()` if available (mobile)
  - Fallback to clipboard copy using `navigator.clipboard.writeText()`
  - Show toast notification "Link copied!"

**Share Button:**
```tsx
<button onClick={handleShare}>
  📤 Share This Page
</button>
```

**Definition of Done:**
- [ ] Share button added to player page
- [ ] Web Share API works on supported devices
- [ ] Clipboard fallback works on desktop
- [ ] Toast notification shows on copy
- [ ] Button has min 44x44px touch target
- [ ] Accessibility: button has aria-label
- [ ] Tested on iOS Safari, Android Chrome, desktop browsers
- [ ] Code review approved

---

## S2.8: Create Player Payment Analytics Dashboard (Admin)
**Priority:** COULD HAVE
**Story Points:** 8

**User Story:**
As a club host,
I want to see analytics on player payment behavior,
So that I can identify late payers and payment trends.

**Acceptance Criteria:**
```gherkin
GIVEN I am logged in as admin
WHEN I navigate to Analytics > Payments
THEN I see metrics: total outstanding, avg debt per player, payment rate
AND I see a list of top 10 debtors
AND I see a chart of debt over time (last 6 months)

GIVEN I want to identify late payers
WHEN I view the analytics
THEN I see players with debt >30 days old highlighted
```

**Technical Implementation:**
- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (AnalyticsScreen - lines 1418-1630)
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/api/analytics/payment-trends.ts` (create new)

- **Metrics to display:**
  - Total outstanding across all players
  - Average debt per player
  - Payment rate (% of players with 0 debt)
  - Top 10 debtors (name, amount, age of debt)
  - Debt trend chart (line chart, last 6 months)

- **Data source:**
  - Aggregate `/api/payment/outstanding-debt` for all players
  - Calculate metrics server-side
  - Return chart data (month → total debt)

**Dashboard Layout:**
```
┌──────────────────────────────────────────┐
│  Metric Cards Row                        │
│  [Total Debt] [Avg/Player] [Pay Rate]    │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  Top 10 Debtors Table                    │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  Debt Trend Chart (Last 6 Months)        │
└──────────────────────────────────────────┘
```

**Definition of Done:**
- [ ] Payment analytics added to Analytics screen
- [ ] Metric cards display: total debt, avg debt, payment rate
- [ ] Top 10 debtors table shows name, debt, age
- [ ] Debt trend chart displays last 6 months
- [ ] Players with >30 day debt highlighted
- [ ] Admin-only (requires authentication)
- [ ] Mobile responsive
- [ ] Data refreshes when page loads
- [ ] Performance: loads in <2s with 100 players
- [ ] Stakeholder approval

---

## Sprint 2 Summary
**Total Story Points:** 34
**Must Have:** 11 points (S2.1, S2.2, S2.3)
**Should Have:** 5 points (S2.4)
**Could Have:** 18 points (S2.5, S2.6, S2.7, S2.8)

**Risk Mitigation:**
- S2.1 is critical path - complete first
- S2.8 (analytics) is nice-to-have - defer if needed
- Could Have stories can be moved to Sprint 3

**Success Criteria:**
- Players can view their debt without contacting host (80% adoption target)
- Host inquiries about payments decrease by 60%
- Player satisfaction score increases

---

# SPRINT 3 (2 weeks): Component Refactoring & State Management
**Sprint Goal:** Reduce main component size by 70%, implement Zustand for payment state, and enable parallel development.

**Velocity Target:** 30 story points
**Risk Level:** HIGH
**Dependencies:** S3.1 must complete before S3.2-S3.5

---

## S3.1: Set Up Zustand Store for Payment State
**Priority:** MUST HAVE
**Story Points:** 5

**User Story:**
As a developer,
I want payment state managed in a Zustand store,
So that multiple components can access it without prop drilling.

**Acceptance Criteria:**
```gherkin
GIVEN I am working on the Payment screen
WHEN I need to access payment summary data
THEN I can use usePaymentStore() hook
AND the data is shared across all payment components
AND changes trigger re-renders only in components that use that data

GIVEN payment data is loading
WHEN the API call completes
THEN the store updates automatically
AND all subscribed components re-render
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/stores/paymentStore.ts`

- **Store structure:**
```typescript
interface PaymentStore {
  // State
  summaryData: SummaryData | null;
  outstandingDebts: any[];
  loading: boolean;
  error: string | null;

  // Filters
  summaryMode: 'monthly' | 'weekly' | 'range';
  summaryRef: string;
  rangeFrom: string;
  rangeTo: string;
  showRounded: boolean;

  // Actions
  fetchSummary: () => Promise<void>;
  fetchDebts: () => Promise<void>;
  setSummaryMode: (mode: SummaryMode) => void;
  setSummaryRef: (ref: string) => void;
  toggleRounded: () => void;
  reset: () => void;
}
```

- **Migration plan:**
  - Extract payment state from PaymentScreen component
  - Move to Zustand store
  - Replace useState hooks with store selectors
  - Replace prop drilling with store hooks

**Definition of Done:**
- [ ] Zustand installed (`npm install zustand`)
- [ ] paymentStore.ts created with all payment state
- [ ] Store includes summary, debts, filters, loading states
- [ ] Actions implemented: fetchSummary, fetchDebts, setFilters
- [ ] TypeScript types defined for all state
- [ ] Store persists to localStorage (optional)
- [ ] Unit tests for store actions
- [ ] Documentation added to README
- [ ] Code review approved

---

## S3.2: Extract PaymentSummaryTable Component
**Priority:** MUST HAVE
**Story Points:** 5

**User Story:**
As a developer,
I want the payment summary table in its own component,
So that I can modify it without touching the main PaymentScreen.

**Acceptance Criteria:**
```gherkin
GIVEN I need to update the payment table
WHEN I open the codebase
THEN the table logic is in PaymentSummaryTable.tsx
AND it receives data from Zustand store (not props)
AND it handles its own column visibility state
AND it emits events for cell clicks (not inline handlers)

GIVEN the table has 100+ players
WHEN the component renders
THEN performance remains smooth (<16ms render time)
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/PaymentSummaryTable.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/PaymentCell.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/PaymentPopover.tsx`

- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (remove table code, import component)

- **Component structure:**
```tsx
<PaymentSummaryTable
  onCellHover={(data) => showPopover(data)}
  onPlayerClick={(name) => handlePlayerClick(name)}
  onMarkPaid={(player, period) => handleMarkPaid(player, period)}
/>
```

- **Extract from lines:** ~2400-2800 in index.tsx

**Definition of Done:**
- [ ] PaymentSummaryTable component created
- [ ] Component uses Zustand store (no props for data)
- [ ] PaymentCell subcomponent handles individual cells
- [ ] PaymentPopover handles hover tooltips
- [ ] Column visibility managed within component
- [ ] Events emitted via callbacks (onCellHover, onPlayerClick)
- [ ] Performance: React Profiler shows <16ms render
- [ ] All existing functionality preserved
- [ ] Unit tests for component
- [ ] Storybook story created (optional)
- [ ] Code review approved

---

## S3.3: Extract PaymentImportModal Component
**Priority:** MUST HAVE
**Story Points:** 5

**User Story:**
As a developer,
I want the CSV import modal isolated in its own component,
So that I can improve it without risk to the main payment screen.

**Acceptance Criteria:**
```gherkin
GIVEN I want to import payment data
WHEN I open the import modal
THEN it is a standalone component (PaymentImportModal.tsx)
AND it handles file upload, parsing, validation independently
AND it calls an onImportComplete callback when done

GIVEN the import fails
WHEN I see an error
THEN it is specific and actionable (not "Failed")
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/PaymentImportModal.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/ImportPreview.tsx`

- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (remove import modal code)

- **Component API:**
```tsx
<PaymentImportModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  onImportComplete={(sessions) => {
    refreshSummary();
    toast.success('Imported successfully');
  }}
/>
```

- **Extract from lines:** ~2900-3200 in index.tsx

**Definition of Done:**
- [ ] PaymentImportModal component created
- [ ] Modal manages its own state (file upload, parsing)
- [ ] ImportPreview shows parsed data before import
- [ ] Error messages are specific and helpful
- [ ] onImportComplete callback fires with imported data
- [ ] Modal is accessible (focus trap, Esc to close)
- [ ] File upload supports drag-and-drop
- [ ] Validation rules match existing logic
- [ ] Unit tests for parsing logic
- [ ] E2E test for full import flow
- [ ] Code review approved

---

## S3.4: Extract PaymentConfigModal Component
**Priority:** SHOULD HAVE
**Story Points:** 3

**User Story:**
As a developer,
I want the payment config modal (smash weights) in its own component,
So that I can enhance it without touching the main screen.

**Acceptance Criteria:**
```gherkin
GIVEN I want to edit player payment configs
WHEN I open the config modal
THEN it is a standalone PaymentConfigModal component
AND it fetches player configs on mount
AND it saves changes via API
AND it calls onSaveComplete when done
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/PaymentConfigModal.tsx`

- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (remove config modal code)

- **Component API:**
```tsx
<PaymentConfigModal
  isOpen={showConfigModal}
  onClose={() => setShowConfigModal(false)}
  onSaveComplete={() => {
    refreshSummary();
    toast.success('Configs updated');
  }}
/>
```

- **Extract from lines:** ~3300-3600 in index.tsx

**Definition of Done:**
- [ ] PaymentConfigModal component created
- [ ] Modal fetches configs from /api/payment/configs
- [ ] Form allows editing smashWeight, courtRate, shuttleRate
- [ ] Save button calls API and triggers callback
- [ ] Validation: weights must be >0 and <5
- [ ] Modal is accessible
- [ ] Unit tests for form validation
- [ ] Code review approved

---

## S3.5: Extract EditSessionModal Component
**Priority:** SHOULD HAVE
**Story Points:** 5

**User Story:**
As a developer,
I want the edit session modal in its own component,
So that I can work on session editing independently.

**Acceptance Criteria:**
```gherkin
GIVEN I want to edit a court session
WHEN I open the edit modal
THEN it is a standalone EditSessionModal component
AND it receives a sessionId prop
AND it fetches session details on mount
AND it handles save, delete, invoice upload independently
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/EditSessionModal.tsx`
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/components/payment/InvoiceUpload.tsx`

- **Files to modify:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/pages/index.tsx` (remove edit modal code)

- **Component API:**
```tsx
<EditSessionModal
  sessionId={editingSessionId}
  isOpen={!!editingSessionId}
  onClose={() => setEditingSessionId(null)}
  onSaveComplete={() => {
    refreshSummary();
    toast.success('Session updated');
  }}
  onDeleteComplete={() => {
    refreshSummary();
    toast.success('Session deleted');
  }}
/>
```

- **Extract from lines:** ~3700-4000 in index.tsx

**Definition of Done:**
- [ ] EditSessionModal component created
- [ ] Modal fetches session via /api/payment/sessions/[id]
- [ ] Form allows editing date, fees, shuttlecocks, players
- [ ] InvoiceUpload subcomponent handles image upload
- [ ] Save button calls PATCH API
- [ ] Delete button calls DELETE API
- [ ] Callbacks fire on success
- [ ] Modal is accessible
- [ ] Unit tests for form validation
- [ ] E2E test for edit flow
- [ ] Code review approved

---

## S3.6: Create Zustand Store for Tournament State
**Priority:** COULD HAVE
**Story Points:** 5

**User Story:**
As a developer,
I want tournament state (rounds, teams, matches) in a Zustand store,
So that I can isolate tournament logic from the UI.

**Acceptance Criteria:**
```gherkin
GIVEN I am running a tournament
WHEN a match completes
THEN the tournament store updates
AND all tournament components re-render
AND the active tournament is synced to MongoDB

GIVEN I refresh the page mid-tournament
WHEN the app loads
THEN the tournament state is restored from the server
AND I can continue where I left off
```

**Technical Implementation:**
- **Files to create:**
  - `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/stores/tournamentStore.ts`

- **Store structure:**
```typescript
interface TournamentStore {
  // State
  state: TournamentState | null;
  loading: boolean;

  // Actions
  startTournament: (config) => Promise<void>;
  updateMatchScore: (matchId, scoreA, scoreB) => Promise<void>;
  declareWinner: (matchId, winnerId) => Promise<void>;
  advanceRound: () => Promise<void>;
  completeTournament: () => Promise<void>;
  loadActiveTournament: () => Promise<void>;
  resetTournament: () => void;
}
```

- **Integration:**
  - Move tournament state from TournamentScreen useState to store
  - Sync store to /api/tournament/active on every change
  - Load active tournament on app mount

**Definition of Done:**
- [ ] tournamentStore.ts created
- [ ] Store manages full tournament state
- [ ] Actions for start, update, advance, complete
- [ ] Store syncs to /api/tournament/active
- [ ] Store loads active tournament on mount
- [ ] TournamentScreen uses store (not useState)
- [ ] Unit tests for all actions
- [ ] E2E test: full tournament flow
- [ ] Code review approved

---

## S3.7: Refactor Index.tsx - Final Cleanup
**Priority:** MUST HAVE
**Story Points:** 3

**User Story:**
As a developer,
I want index.tsx to be under 1,500 lines,
So that it is maintainable and I can find code quickly.

**Acceptance Criteria:**
```gherkin
GIVEN I open pages/index.tsx
WHEN I check the line count
THEN it is under 1,500 lines (down from 5,182)
AND it only contains the main app shell and screen routing
AND all screen components are imported from separate files

GIVEN I need to modify the Payment screen
WHEN I search for the code
THEN I find it in components/payment/ folder
AND I can work on it without touching index.tsx
```

**Technical Implementation:**
- **Current state:** 5,182 lines
- **Target state:** <1,500 lines (70% reduction)

- **Remaining screens to extract:**
  - RosterScreen → `/components/RosterScreen.tsx`
  - SetupScreen → `/components/SetupScreen.tsx`
  - TournamentScreen → `/components/TournamentScreen.tsx`
  - ChampionScreen → `/components/ChampionScreen.tsx`
  - HistoryScreen → `/components/HistoryScreen.tsx`
  - RankingsScreen → `/components/RankingsScreen.tsx`
  - BetHistoryScreen → `/components/BetHistoryScreen.tsx`

- **index.tsx final structure:**
```tsx
import { RosterScreen } from '@/components/RosterScreen';
import { SetupScreen } from '@/components/SetupScreen';
// ... other screens

export default function SmashTour() {
  const [view, setView] = useState<AppView>('roster');

  return (
    <div className="app-shell">
      <Sidebar view={view} setView={setView} />
      <main className="main-content">
        {view === 'roster' && <RosterScreen />}
        {view === 'setup' && <SetupScreen />}
        {/* ... */}
      </main>
    </div>
  );
}
```

**Definition of Done:**
- [ ] All 8 screens extracted to separate files
- [ ] index.tsx is <1,500 lines
- [ ] No duplicate code between extracted components
- [ ] All screens work identically to before
- [ ] TypeScript compiles with no errors
- [ ] All E2E tests pass
- [ ] Bundle size unchanged or reduced
- [ ] Code review approved
- [ ] Architecture documented in README

---

## Sprint 3 Summary
**Total Story Points:** 31
**Must Have:** 18 points (S3.1, S3.2, S3.3, S3.7)
**Should Have:** 8 points (S3.4, S3.5)
**Could Have:** 5 points (S3.6)

**Risk Mitigation:**
- HIGH RISK: Refactoring can introduce regressions
- Mitigation: Extract one component at a time, test after each
- Ensure all E2E tests pass before merging
- S3.6 (tournament store) can be deferred to Sprint 4

**Success Criteria:**
- index.tsx reduced from 5,182 to <1,500 lines (70% reduction)
- Payment screen state managed by Zustand
- 2 developers can work on Payment screen simultaneously
- Zero regressions (all tests pass)

---

# Dependencies Map

## Sprint 1 → Sprint 2
- **S1.4 (Skeleton Loader)** → Used in S2.3 (Session History Table)
- **S1.5 (Mobile Tables)** → Pattern reused in S2.3
- No hard blockers

## Sprint 2 → Sprint 3
- **S2.1 (Player Lookup)** → No dependency on Sprint 3
- Sprint 2 and Sprint 3 are independent

## Within Sprint 3
- **S3.1 (Zustand Store)** → MUST complete before S3.2, S3.3, S3.4, S3.5
- S3.2-S3.5 can proceed in parallel after S3.1
- **S3.7 (Final Cleanup)** → Should be last story in Sprint 3

---

# Risk Assessment

## Sprint 1 Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Color contrast changes break visual design | MEDIUM | LOW | Get design approval before implementing |
| Skeleton loader causes layout shift | LOW | MEDIUM | Match skeleton dimensions to loaded content exactly |
| Mobile table refactor too complex | MEDIUM | HIGH | Start with simplest table first (Rankings), learn, then tackle Payment |

## Sprint 2 Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Players don't adopt self-service portal | MEDIUM | HIGH | Add prominent link in payment email reminders |
| Public endpoint exposes sensitive data | LOW | CRITICAL | Only expose player's own data, no admin data |
| QR codes don't scan on all devices | LOW | MEDIUM | Test on 5+ devices before launch |

## Sprint 3 Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Refactoring introduces regressions | HIGH | CRITICAL | Extract one component at a time, run full test suite after each |
| Zustand learning curve slows team | MEDIUM | MEDIUM | Pair programming for first store implementation |
| Performance degrades with new architecture | LOW | HIGH | Profile with React DevTools before/after |
| Team velocity drops due to complexity | MEDIUM | MEDIUM | Prioritize Must Have stories, defer Could Have if needed |

---

# Acceptance Criteria Summary

## Sprint 1 Exit Criteria
- [ ] WCAG AA compliance score >90% (Lighthouse)
- [ ] All navigation keyboard accessible
- [ ] Mobile tables work without horizontal scroll on 375px width
- [ ] Loading states implemented on 3+ screens
- [ ] index.tsx reduced by >200 lines

## Sprint 2 Exit Criteria
- [ ] Players can view debt via /player?name=X
- [ ] 80% of players access self-service within 2 weeks (tracked via analytics)
- [ ] Invoice viewer supports multiple images
- [ ] QR code generation works for all players

## Sprint 3 Exit Criteria
- [ ] index.tsx <1,500 lines (70% reduction from 5,182)
- [ ] Payment state managed by Zustand
- [ ] 5+ components extracted from monolith
- [ ] All E2E tests pass (zero regressions)
- [ ] 2 developers can work on Payment screen simultaneously

---

# Success Metrics (Post-Sprint 3)

## Quantitative Metrics
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Lighthouse Accessibility | 60% | 90% | Lighthouse CI |
| Mobile Usability Score | 65% | 85% | PageSpeed Insights |
| index.tsx Line Count | 5,182 | <1,500 | wc -l |
| useState Hooks in Largest Component | 154 | <30 | grep -c useState |
| Build Time | 45s | <35s | time npm run build |
| Bundle Size | 420KB | <450KB | next build output |
| Player Self-Service Adoption | 0% | 80% | Analytics tracking |

## Qualitative Metrics
- Code review velocity improves (PRs approved faster)
- Developer satisfaction increases (survey)
- Bug reports decrease by 50%
- Host burden reduces (fewer payment inquiries)

---

# Next Steps

## Post-Sprint 3 Roadmap (Sprint 4-6)

### Epic 4: Automated Payment Reminders
- Send weekly email/SMS to players with outstanding debt
- Integrate with SendGrid or Twilio
- Allow players to mark as paid via email link

### Epic 5: PWA (Progressive Web App) Foundation
- Add service worker for offline support
- Add web app manifest
- Enable "Add to Home Screen"
- Cache payment data for offline viewing

### Epic 6: Advanced Reporting
- Export payment history as PDF
- Generate monthly invoices per player
- Visualize payment trends with charts

---

# Appendix

## File Structure After Sprint 3

```
badminton/
├── pages/
│   ├── index.tsx (1,400 lines - main app shell)
│   ├── player.tsx (new - public player page)
│   └── api/
│       └── payment/
│           ├── outstanding-debt.ts (public endpoint)
│           └── ...
├── components/
│   ├── ui/ (Sprint 1)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   └── SkeletonLoader.tsx
│   ├── payment/ (Sprint 2 & 3)
│   │   ├── PaymentSummaryTable.tsx
│   │   ├── PaymentCell.tsx
│   │   ├── PaymentPopover.tsx
│   │   ├── PaymentImportModal.tsx
│   │   ├── PaymentConfigModal.tsx
│   │   ├── EditSessionModal.tsx
│   │   ├── InvoiceModal.tsx
│   │   └── InvoiceUpload.tsx
│   ├── RosterScreen.tsx (Sprint 3)
│   ├── SetupScreen.tsx (Sprint 3)
│   ├── TournamentScreen.tsx (Sprint 3)
│   ├── ChampionScreen.tsx (Sprint 3)
│   ├── HistoryScreen.tsx (Sprint 3)
│   ├── RankingsScreen.tsx (Sprint 3)
│   └── BetHistoryScreen.tsx (Sprint 3)
├── stores/ (Sprint 3)
│   ├── paymentStore.ts
│   └── tournamentStore.ts (optional)
└── lib/
    ├── hooks/
    │   └── useFocusTrap.ts (Sprint 1)
    └── ...
```

## MoSCoW Prioritization Summary

### Must Have (Critical for MVP)
- All accessibility fixes (S1.1, S1.2, S1.3, S1.8)
- Mobile responsiveness (S1.5, S1.9)
- Player self-service portal (S2.1, S2.2, S2.3)
- Component extraction (S3.1, S3.2, S3.3, S3.7)

### Should Have (Important but not blocking)
- Loading states (S1.4)
- Invoice viewer (S2.4)
- Additional modals extracted (S3.4, S3.5)

### Could Have (Nice to have)
- Component extraction prep (S1.6)
- Form validation (S1.7)
- Session filtering (S2.5)
- QR codes (S2.6)
- Share button (S2.7)
- Analytics dashboard (S2.8)
- Tournament store (S3.6)

### Won't Have (Future sprints)
- Automated reminders (Epic 4)
- PWA features (Epic 5)
- Advanced reporting (Epic 6)

---

## Glossary

- **CLS**: Cumulative Layout Shift - measures visual stability
- **INVEST**: Independent, Negotiable, Valuable, Estimable, Small, Testable
- **MoSCoW**: Must Have, Should Have, Could Have, Won't Have
- **WCAG**: Web Content Accessibility Guidelines
- **AA**: WCAG conformance level (4.5:1 contrast for normal text)
- **VND**: Vietnamese Dong currency
- **PWA**: Progressive Web App
- **E2E**: End-to-End testing

---

**Document Version:** 1.0
**Last Updated:** 2026-06-21
**Next Review:** After Sprint 1 Retrospective
