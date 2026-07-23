# SmashTour Court Redesign — Quick Start Guide

**Full-stack development harness ready for team execution**

---

## What's Been Built

A complete development pipeline for the SmashTour Court redesign, coordinating 6 specialized agent roles through design handoff → implementation → QA → deployment.

### ✅ Completed

1. **Step 0: Global Court Restyle** (merged to main)
   - Fonts: Archivo + Space Mono
   - Colors: ink/paper/volt (no purple, no gradients)
   - Borders: sharp 2–4px corners, hairline borders
   - Build: ✓ passes (TypeScript, lint, Next.js production)

2. **Development Harness** (this commit)
   - Pipeline documentation ([DEVELOPMENT_HARNESS.md](./DEVELOPMENT_HARNESS.md))
   - CI/CD automation (GitHub Actions)
   - PR/issue templates
   - QA framework

---

## Quick Start for Developers

### 1. Clone & Setup

```bash
git clone <repo-url>
cd badminton
npm install
cp .env.example .env.local  # Configure your environment
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app with Court styling applied.

### 3. Run Quality Checks Locally

Before creating a PR, ensure all checks pass:

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run build        # Next.js production build
```

All must return **0 errors, 0 warnings**.

### 4. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b court/step-<N>-<feature>
```

**Naming convention:** `court/step-<N>-<feature>`
- Step 1: `court/step-1-nav`
- Step 2: `court/step-2-components`
- Step 3: `court/step-3-scoring`
- Step 4a: `court/step-4-players`
- etc.

### 5. Implement Feature

Follow TDD workflow:
1. Write failing test
2. Implement component
3. Make test pass
4. Refactor
5. Repeat

**Code standards:**
- React 19 + TypeScript strict mode
- Use Court tokens (`var(--ink)`, `var(--volt)`, etc.) — never hardcode colors
- Extract reusable primitives to `components/`
- Keep domain logic in `lib/` — import, don't rewrite

### 6. Create Pull Request

```bash
git add .
git commit -m "feat(court): implement Step N — <feature>"
git push origin court/step-<N>-<feature>
```

GitHub will auto-populate the PR template. Fill in:
- Summary & user story
- Design spec link
- Screenshots (before/after, desktop/mobile)
- Check all QA/code quality boxes

### 7. Pass Code Review + QA

**Automated checks** (must pass):
- Build & test
- E2E tests (Playwright)
- Visual regression
- Lighthouse audits
- Court compliance (no purple, no gradients)

**Manual reviews** (required):
- [ ] Code review approval (solution architect / senior dev)
- [ ] QA approval (QA engineer)
- [ ] Design approval (UX/UI designer)

### 8. Merge & Deploy

Once approved:
1. Squash and merge to `main`
2. Auto-deploys to staging
3. Smoke test on staging
4. Production release (manual trigger)

---

## Team Roles & Agents

### Design Handoff
**Agent:** `senior-uxui-designer`
- Create design specs in `documents/design_handoff_court/<feature>/`
- Build prototypes (HTML or Figma)
- Conduct visual QA reviews
- Verify accessibility compliance

### Implementation
**Agent:** `senior-fullstack-developer`
- Build React components following design specs
- Write unit/integration tests
- Integrate with `lib/` domain logic
- Conduct code reviews

### Architecture
**Agent:** `senior-solution-architect`
- Review component architecture
- Create Architecture Decision Records (ADRs)
- Ensure domain logic separation
- Security & performance reviews

### Business Analysis
**Agent:** `senior-business-analyst`
- Translate design into user stories
- Define acceptance criteria
- Validate business logic integrity
- Stakeholder alignment

### Product Ownership
**Agent:** `senior-project-owner`
- Maintain roadmap (Now/Next/Later)
- Prioritize steps/screens
- Define success metrics
- Make go/no-go decisions

### Quality Assurance
**Agent:** `senior-qa-qc-engineer`
- Design test strategies
- Execute functional/visual/a11y tests
- Automate E2E tests (Playwright)
- Release readiness assessment

---

## Roadmap

### Foundation (Sequential)
- [x] **Step 0:** Global restyle (tokens + court.css)
- [ ] **Step 1:** Nav IA + Host/Player toggle
- [ ] **Step 2:** Primitives (Button, Badge, PlayerTile, StatCard)

### Screens (Parallel after Step 2)
- [ ] **Step 3:** Live scoring broadcast (Scoreboard) — **flagship feature**
- [ ] **Step 4a:** Players screen
- [ ] **Step 4b:** Setup screen
- [ ] **Step 4c:** Payments screen
- [ ] **Step 4d:** Attendance screen

### Cleanup (Final)
- [ ] **Step 5:** Decompose monolith (split `pages/index.tsx` → `components/screens/`)

**Current status:** Ready to start Step 1 (nav regrouping).

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [DEVELOPMENT_HARNESS.md](./DEVELOPMENT_HARNESS.md) | Complete pipeline specification |
| [documents/design_handoff_court/README.md](./documents/design_handoff_court/README.md) | Court design system spec |
| [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) | PR template with QA checklist |
| [.github/workflows/pr-checks.yml](./.github/workflows/pr-checks.yml) | Automated CI quality gates |

---

## Non-Negotiables

1. **Do NOT touch `lib/`** (tournament, payment, pricing, scoring, polls)
   - It's pure and correct — import and reuse it
   - This is a reskin + restructure, not a logic rewrite

2. **Court system only**
   - ink (#16170F), paper (#F3F1EA), card (#FFFFFF), volt (#CBF14A)
   - No gradients, no purple, no emoji as icons
   - Sharp 2–4px corners, tabular numerals on scores/money

3. **Use tokens, never hardcode**
   - `var(--ink)` not `#16170F`
   - `var(--r)` not `4px`

4. **Accessibility first**
   - WCAG AA contrast ratios
   - ≥44px touch targets
   - Visible focus rings (2px ink)
   - Keyboard navigation

5. **One branch + one PR per step**
   - Keep branches short-lived (<3 days)
   - Include before/after screenshots
   - All checks must pass (tsc, lint, tests, build)

---

## Getting Help

- **Design questions:** Check `documents/design_handoff_court/` or ping UX/UI designer agent
- **Architecture questions:** Consult solution architect agent
- **Business logic questions:** Engage business analyst agent
- **Bug reports:** Use GitHub issue template (`.github/ISSUE_TEMPLATE/bug_report.md`)
- **Feature requests:** Use GitHub issue template (`.github/ISSUE_TEMPLATE/feature_request.md`)

---

## First Task: Step 1 — Nav IA

**Goal:** Regroup sidebar from flat 11-item list into 4 semantic groups (PLAY/CLUB/MONEY/TRAIN) with Host/Player toggle.

**Files to modify:**
- `pages/index.tsx` — nav arrays + role state
- Design spec: `documents/design_handoff_court/` (when created)

**Acceptance criteria:**
- [ ] 4 nav groups: PLAY, CLUB, MONEY, TRAIN
- [ ] Host/Player toggle filters visible items
- [ ] Players hide admin-only sections (venues, pricing, analytics)
- [ ] Volt active indicator (4px left bar)
- [ ] Space Mono group labels
- [ ] Dark ink sidebar background
- [ ] All deep links work

**Launch command:**
```bash
# Option 1: Activate senior-fullstack-developer agent
/plugin  # then describe Step 1 task

# Option 2: Manual implementation
git checkout -b court/step-1-nav
# ... implement, test, commit, PR
```

---

**Ready to ship.** Start with Step 1, or parallelize Steps 3–4 after Step 2 completes.

🤖 Built with [Claude Code](https://claude.com/claude-code)
