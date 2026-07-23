# Development Harness — SmashTour Court Redesign

**Full-stack development pipeline from wireframe to deployment**

This document defines the coordinated workflow for the SmashTour Court redesign, ensuring design fidelity, implementation quality, and systematic QA at every step.

---

## Table of Contents

1. [Overview](#overview)
2. [Team Roles & Responsibilities](#team-roles--responsibilities)
3. [Pipeline Stages](#pipeline-stages)
4. [Design Handoff Process](#design-handoff-process)
5. [Implementation Workflow](#implementation-workflow)
6. [QA Testing Framework](#qa-testing-framework)
7. [Branch Strategy & PR Process](#branch-strategy--pr-process)
8. [Definition of Done (DoD)](#definition-of-done-dod)
9. [Tools & Automation](#tools--automation)

---

## Overview

**Goal:** Migrate SmashTour UI to the Court design system while maintaining domain logic integrity and ensuring every change is tested, reviewed, and production-ready.

**Principles:**
- Design-first: Implementation follows the design spec exactly
- Incremental: Ship small, complete features (one screen per PR)
- Quality gates: Nothing merges without passing tsc + lint + tests + visual QA
- Parallel work: After foundational steps, screens can be built concurrently

**Current Status:** Step 0 complete (global restyle). Ready for Step 1+ parallel execution.

---

## Team Roles & Responsibilities

### 1. Senior UX/UI Designer (`senior-uxui-designer` agent)
**Responsibilities:**
- Create/maintain design specifications in `documents/design_handoff_court/`
- Build interactive prototypes (e.g., `prototype.html`)
- Conduct visual QA reviews on implementation
- Verify accessibility compliance (WCAG AA)
- Approve design sign-off before PRs merge

**Outputs:**
- Design specs (README.md, Figma links, color tokens)
- Component specifications with props/states
- Before/after screenshots for PRs
- Accessibility audit reports

### 2. Senior Solution Architect (`senior-solution-architect` agent)
**Responsibilities:**
- Review architectural decisions (component structure, state management)
- Ensure domain logic (`lib/`) remains pure and untouched
- Design data flow patterns (server components, API client)
- Create Architecture Decision Records (ADRs) for major changes
- Security and performance reviews

**Outputs:**
- ADRs for migration steps
- Component architecture diagrams
- Performance benchmarks
- Security review reports

### 3. Senior Business Analyst (`senior-business-analyst` agent)
**Responsibilities:**
- Translate design into user stories
- Define acceptance criteria for each screen/feature
- Validate business logic integrity during migration
- Ensure Host/Player role separation aligns with requirements
- Stakeholder alignment and prioritization

**Outputs:**
- User stories with acceptance criteria
- Business rules documentation
- Feature prioritization matrix
- Stakeholder sign-off

### 4. Senior Full-Stack Developer (`senior-fullstack-developer` agent)
**Responsibilities:**
- Implement screens following design specs
- Write/update React components with TypeScript
- Integrate with existing `lib/` domain logic
- Write unit/integration tests
- Code reviews for other developers

**Outputs:**
- Production-ready React components
- Test coverage reports
- Code review feedback
- Implementation documentation

### 5. Senior Project Owner (`senior-project-owner` agent)
**Responsibilities:**
- Maintain product roadmap (Now/Next/Later)
- Prioritize steps and screens
- Define success metrics per feature
- Make go/no-go decisions for releases
- Manage sprint planning and backlog

**Outputs:**
- Sprint plans with prioritized work
- Product Requirements Documents (PRDs)
- Success metrics dashboards
- Release notes

### 6. Senior QA/QC Engineer (`senior-qa-qc-engineer` agent)
**Responsibilities:**
- Design test strategy for each step
- Execute functional, visual, and regression tests
- Automate E2E tests with Playwright
- Perform accessibility testing
- Release readiness assessment

**Outputs:**
- Test plans and test cases
- Automated test suites
- Bug reports with severity classification
- Release sign-off reports

---

## Pipeline Stages

Each feature flows through 5 stages:

```
Design Handoff → Implementation → Code Review → QA Testing → Deployment
     ↓              ↓                ↓              ↓            ↓
   Spec + PRD    Branch + Code    PR Review    Test Suite    Merge + Ship
```

### Stage Gates

| Stage | Entry Criteria | Exit Criteria | Owner |
|-------|----------------|---------------|-------|
| **Design Handoff** | Business requirements approved | Design spec complete, prototype built | UX/UI Designer |
| **Implementation** | Design spec approved | Code complete, tests written, builds pass | Full-Stack Dev |
| **Code Review** | PR created with description | 1+ approval, no blocking comments | Solution Architect |
| **QA Testing** | Code review approved | All tests pass, visual QA sign-off | QA Engineer |
| **Deployment** | QA sign-off complete | Merged to main, deployed to prod | Project Owner |

---

## Design Handoff Process

**Goal:** Ensure developers have everything needed to build pixel-perfect, accessible screens.

### 1. Design Specification Package

Every screen/component requires:

```
documents/design_handoff_court/<screen>/
├── README.md           # Spec: layout, colors, typography, spacing
├── prototype.html      # Interactive reference (or Figma link)
├── components.tsx      # React component API (props, states, events)
├── tokens.css          # Design tokens (if new)
└── screenshots/        # Before/after, edge cases, responsive
    ├── desktop.png
    ├── tablet.png
    ├── mobile.png
    └── accessibility.png
```

### 2. Design Review Checklist

Before handing off to dev:

- [ ] **Visual Design**
  - [ ] Matches Court system (ink/paper/volt, Archivo/Space Mono)
  - [ ] No gradients or purple remnants
  - [ ] Sharp corners (2–4px radius)
  - [ ] Volt usage ≤5% of screen (hero actions only)
  - [ ] Tabular numerals on scores/money

- [ ] **Component API**
  - [ ] Props defined with TypeScript types
  - [ ] States documented (hover, focus, active, disabled)
  - [ ] Events/callbacks specified (onClick, onChange, etc.)

- [ ] **Responsive Design**
  - [ ] Desktop (1440px+), tablet (768–1439px), mobile (<768px)
  - [ ] Touch targets ≥44px on mobile

- [ ] **Accessibility**
  - [ ] WCAG AA contrast ratios (ink on paper ≥7:1, muted on paper ≥4.5:1)
  - [ ] Focus states visible (2px ink outline)
  - [ ] Keyboard navigation documented
  - [ ] ARIA labels/roles specified

### 3. Handoff Meeting

Designer + BA + Dev sync (15–30 min):
- Walk through prototype
- Review acceptance criteria
- Clarify edge cases
- Estimate effort

**Output:** Dev-ready user story with acceptance criteria in backlog.

---

## Implementation Workflow

**Goal:** Build screens incrementally, one PR per step/screen, maintaining quality at every commit.

### Branch Strategy (Git Flow)

```
main (production)
  ├── court/step-0-tokens        ✓ merged
  ├── court/step-1-nav            ← current
  ├── court/step-2-components     ← next
  ├── court/step-3-scoring        ← parallel with Step 4
  ├── court/step-4-players        ← parallel
  ├── court/step-4-setup          ← parallel
  ├── court/step-4-payments       ← parallel
  └── court/step-5-decompose      ← final
```

**Naming:** `court/step-<N>-<feature>`

**Rules:**
- One branch per step/screen
- Branch from `main` (always fresh)
- Keep branches short-lived (<3 days)
- Rebase before PR if main has moved

### Implementation Steps (Per Feature)

#### 1. Create Branch & User Story

```bash
git checkout main
git pull origin main
git checkout -b court/step-<N>-<feature>
```

Link user story in PR description:
- **Story:** "As a [Host/Player], I want [feature] so that [benefit]"
- **Acceptance Criteria:** Bullet list from BA
- **Design Spec:** Link to `documents/design_handoff_court/<feature>/`

#### 2. Build Component (TDD approach)

**Order:**
1. Write failing test (snapshot or behavioral)
2. Build component to pass test
3. Refactor for readability
4. Repeat

**Code Standards:**
- React 19 + TypeScript strict mode
- Inline styles or Court CSS classes (no Tailwind utilities in components)
- Extract reusable primitives to `components/` (Button, Badge, PlayerTile, etc.)
- Keep domain logic in `lib/` — import and call, never rewrite

**Example:**

```tsx
// components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'volt' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    borderRadius: 'var(--r)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const variantStyles = {
    primary: { background: 'var(--ink)', color: '#fff' },
    volt: { background: 'var(--volt)', color: 'var(--ink)' },
    ghost: { background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--ink)' },
    danger: { background: 'transparent', color: 'var(--loss)', border: '1.5px solid var(--loss)' },
  };

  // ... size, full, disabled styles ...

  return <button style={{ ...baseStyles, ...variantStyles[variant] }} {...props}>{children}</button>;
}
```

#### 3. Write Tests

**Test Coverage Requirements:**
- Unit tests for all components (React Testing Library)
- Integration tests for screens that compose multiple components
- E2E tests for critical flows (Playwright)
- Visual regression tests (screenshot comparison)

**Example:**

```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies volt variant styling', () => {
    render(<Button variant="volt">Primary Action</Button>);
    const button = screen.getByText('Primary Action');
    expect(button).toHaveStyle({ background: 'var(--volt)' });
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 4. Build Passes Locally

Before committing:

```bash
npm run type-check    # tsc --noEmit
npm run lint          # eslint
npm run test          # jest
npm run build         # next build
```

All must pass with **0 errors, 0 warnings**.

#### 5. Commit with Detailed Message

Follow conventional commits:

```
feat(court): implement Step 1 — nav IA + Host/Player toggle

**Step 1 — Navigation Information Architecture**

Regroup sidebar from flat 11-item list into 4 semantic groups (PLAY/CLUB/MONEY/TRAIN)
with Host/Player role toggle. Players hide admin-only sections (venues, pricing, analytics).

Changes:
1. Navigation Groups:
   - PLAY: Match, Setup, Live, Bracket, Rankings
   - CLUB: Players, Attendance, History
   - MONEY: Payments, Venues, Pricing (host-only)
   - TRAIN: Training Lab

2. Role Toggle:
   - useState('host' | 'player')
   - Filters nav items by role permission
   - Host sees all, Player sees PLAY + CLUB + TRAIN

3. Visual Updates:
   - Space Mono labels (uppercase, +2px letter-spacing)
   - Volt active indicator (4px left bar)
   - Dark ink sidebar background

Files Modified:
- pages/index.tsx: nav arrays + role toggle state
- styles/globals.css: nav group styling

Definition of Done:
✓ Matches prototype sidebar exactly
✓ All deep links work
✓ Role toggle filters correctly
✓ Builds pass (tsc + lint + tests)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## QA Testing Framework

**Goal:** Catch bugs before production through systematic functional, visual, and accessibility testing.

### Test Pyramid

```
         E2E Tests (Playwright)           ← Critical user flows
              /     \
         Integration Tests               ← Screen + component interactions
          /           \
      Unit Tests                        ← Component logic, pure functions
```

### QA Checklist (Per PR)

#### 1. Functional Testing

- [ ] **Feature works as designed**
  - [ ] All acceptance criteria met
  - [ ] Edge cases handled (empty states, errors, loading)
  - [ ] User interactions work (clicks, hovers, keyboard)

- [ ] **Regression testing**
  - [ ] Existing features still work
  - [ ] No console errors/warnings
  - [ ] Domain logic (`lib/`) unchanged (or tests updated)

#### 2. Visual Testing

- [ ] **Design fidelity**
  - [ ] Matches prototype.html exactly
  - [ ] Court colors correct (ink/paper/volt, no purple)
  - [ ] Typography correct (Archivo/Space Mono, sizes, weights)
  - [ ] Spacing follows 8px grid
  - [ ] Sharp corners (2–4px radius)

- [ ] **Responsive design**
  - [ ] Desktop (1440px+): optimal layout
  - [ ] Tablet (768–1439px): adjusted layout
  - [ ] Mobile (<768px): stacked/simplified, touch-friendly

- [ ] **Cross-browser**
  - [ ] Chrome (primary)
  - [ ] Safari (iOS users)
  - [ ] Firefox (baseline)

#### 3. Accessibility Testing

- [ ] **Keyboard navigation**
  - [ ] All interactive elements focusable
  - [ ] Tab order logical
  - [ ] Focus states visible (2px ink outline)
  - [ ] Escape/Enter work on modals/menus

- [ ] **Screen readers**
  - [ ] ARIA labels present
  - [ ] Semantic HTML (button, nav, main, etc.)
  - [ ] Headings hierarchical (h1 → h2 → h3)

- [ ] **Contrast ratios** (WCAG AA)
  - [ ] Ink on paper: 7:1+ (AAA)
  - [ ] Muted on paper: 4.5:1+ (AA)
  - [ ] Volt on ink: 4.5:1+ (AA)

- [ ] **Touch targets**
  - [ ] ≥44×44px on mobile
  - [ ] Adequate spacing between tappable elements

#### 4. Performance Testing

- [ ] **Lighthouse scores**
  - [ ] Performance: 90+
  - [ ] Accessibility: 100
  - [ ] Best Practices: 90+
  - [ ] SEO: 90+

- [ ] **Bundle size**
  - [ ] No large dependency additions without justification
  - [ ] Code-split if screen >50KB

### Automated Testing

**Run on every PR:**

```yaml
# .github/workflows/pr-checks.yml
name: PR Quality Checks

on: pull_request

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:visual  # Playwright screenshot comparison
```

**Passing checks = required for merge.**

---

## Branch Strategy & PR Process

### PR Lifecycle

```
1. Create PR → 2. Code Review → 3. QA Testing → 4. Approval → 5. Merge
```

#### 1. Create Pull Request

**PR Title:** Follow conventional commits
```
feat(court): implement Step N — <feature>
```

**PR Description Template:**

```markdown
## Summary
Brief description of what this PR does (1–3 sentences).

## Story
**As a** [Host/Player]
**I want** [feature]
**So that** [benefit]

## Changes
- Screen/component added: X
- Files modified: Y
- New dependencies: Z (or "None")

## Design Spec
Link to `documents/design_handoff_court/<feature>/README.md`

## Screenshots
### Before
![before](./screenshots/before.png)

### After (Desktop)
![after-desktop](./screenshots/after-desktop.png)

### After (Mobile)
![after-mobile](./screenshots/after-mobile.png)

## Testing
- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing complete (see QA checklist)
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Visual regression tests pass

## Checklist
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Design matches prototype exactly
- [ ] Domain logic (`lib/`) unchanged or tests updated
- [ ] Responsive design tested (desktop/tablet/mobile)
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Keyboard navigation works
- [ ] No console errors/warnings
```

#### 2. Code Review

**Reviewer:** `senior-solution-architect` or `senior-fullstack-developer`

**Review Checklist:**
- [ ] Code follows TypeScript/React best practices
- [ ] Component structure matches design spec
- [ ] No domain logic duplication (`lib/` is reused)
- [ ] Tests cover edge cases
- [ ] Performance considerations addressed
- [ ] Security implications reviewed (if applicable)
- [ ] Documentation/comments for complex logic

**Outcome:** Approve or Request Changes with specific feedback.

#### 3. QA Testing

**Tester:** `senior-qa-qc-engineer`

Execute full QA checklist above. If bugs found:
1. Create GitHub issues with severity labels (Critical/High/Medium/Low)
2. Link issues to PR
3. Request Changes on PR until issues resolved

**Outcome:** Approve when all tests pass + no blocking issues.

#### 4. Approval & Merge

**Requires:**
- [ ] 1+ code review approval
- [ ] 1+ QA approval
- [ ] All CI checks green
- [ ] No merge conflicts

**Merge Strategy:** Squash and merge (clean linear history)

**Post-Merge:**
1. Delete feature branch
2. Deploy to staging (auto-deploy from `main`)
3. Smoke test on staging
4. Tag release if deploying to prod

---

## Definition of Done (DoD)

A feature is **DONE** when:

### Code Quality
- [ ] TypeScript compiles with strict mode, 0 errors
- [ ] ESLint passes, 0 warnings
- [ ] Unit test coverage ≥80% for new code
- [ ] Integration tests cover critical paths
- [ ] E2E tests cover user flows
- [ ] No console errors/warnings in dev or prod builds

### Design Fidelity
- [ ] Matches `prototype.html` or design spec exactly
- [ ] Uses Court tokens only (no hardcoded colors)
- [ ] Archivo + Space Mono fonts applied correctly
- [ ] Spacing follows 8px grid
- [ ] Responsive on desktop/tablet/mobile
- [ ] Designer sign-off obtained

### Functionality
- [ ] All acceptance criteria met
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] Domain logic (`lib/`) unchanged or refactored safely
- [ ] Backward compatible (no breaking changes without migration)

### Accessibility
- [ ] WCAG AA contrast ratios met
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Screen reader tested (ARIA labels correct)
- [ ] Touch targets ≥44px on mobile

### Performance
- [ ] Lighthouse score: Performance 90+, Accessibility 100
- [ ] No bundle size regressions (>10KB without justification)
- [ ] Lazy loading/code splitting applied where appropriate

### Documentation
- [ ] PR description complete with screenshots
- [ ] Inline comments for complex logic
- [ ] README updated if public API changed
- [ ] Architecture Decision Record (ADR) if needed

### Deployment
- [ ] Merged to `main`
- [ ] Deployed to staging
- [ ] Smoke tested on staging
- [ ] Stakeholder demo completed (if required)
- [ ] Production deployment scheduled/completed

**If any checkbox is unchecked, the feature is NOT done.**

---

## Tools & Automation

### Development Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **TypeScript** | Type safety | `npm run type-check` |
| **ESLint** | Code linting | `npm run lint` |
| **Prettier** | Code formatting | `npm run format` |
| **Jest** | Unit/integration tests | `npm run test` |
| **React Testing Library** | Component tests | `npm run test` |
| **Playwright** | E2E tests | `npm run test:e2e` |
| **Lighthouse** | Performance/a11y audits | `npm run lighthouse` |

### CI/CD Pipeline

**GitHub Actions workflows:**

1. **PR Checks** (`.github/workflows/pr-checks.yml`)
   - Type-check, lint, test, build
   - E2E tests with Playwright
   - Visual regression tests
   - Blocks merge if failing

2. **Deploy Staging** (`.github/workflows/deploy-staging.yml`)
   - Auto-deploys `main` to staging environment
   - Runs smoke tests post-deploy
   - Notifies team on Slack/Discord

3. **Deploy Production** (`.github/workflows/deploy-prod.yml`)
   - Manual approval required
   - Blue/green deployment
   - Rollback on health check failure

### Design Tools

- **Figma:** Source of truth for designs
- **`prototype.html`:** Interactive reference (no build needed)
- **Storybook** (optional): Component library catalog

### Communication

- **GitHub Issues:** Bug tracking, feature requests
- **GitHub Projects:** Sprint board (To Do → In Progress → In Review → Done)
- **Slack/Discord:** Real-time sync
- **Weekly syncs:** 30-min demo + retrospective

---

## Appendix: Step-by-Step Roadmap

**Foundation (Sequential)**
- [x] Step 0: Global restyle (tokens.css + court.css)
- [ ] Step 1: Nav IA + Host/Player toggle
- [ ] Step 2: Primitives (Button, Badge, PlayerTile, StatCard)

**Screens (Parallel after Step 2)**
- [ ] Step 3: Live scoring broadcast (Scoreboard)
- [ ] Step 4a: Players screen
- [ ] Step 4b: Setup screen
- [ ] Step 4c: Payments screen
- [ ] Step 4d: Attendance screen

**Cleanup (Final)**
- [ ] Step 5: Decompose monolith (split `pages/index.tsx`)

**Each step = 1 branch + 1 PR + full QA cycle.**

---

**Document maintained by:** Senior Project Owner
**Last updated:** 2026-06-24
**Next review:** After Step 2 completion
