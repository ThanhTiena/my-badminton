# SmashTour Sprint Backlog - Quick Reference

**For:** Development Team
**Print this and keep it at your desk!**

---

## Sprint 1: Foundation & Quick Wins (Weeks 1-2)

### Critical Path
```
Day 1-2:  S1.1 (ARIA Labels) + S1.3 (Color Contrast)
Day 3-5:  S1.2 (Keyboard Nav) + S1.8 (Focus Trap)
Day 6-8:  S1.5 (Mobile Tables) + S1.9 (Mobile Topbar)
Day 9-10: S1.4 (Loading States) + S1.6 (Extract UI)
```

### Quick Wins First
1. **S1.3** - Color Contrast (3 pts, 1 day) ← START HERE
2. **S1.1** - ARIA Labels (2 pts, 0.5 day)
3. **S1.9** - Mobile Topbar (3 pts, 1 day)

### Files You'll Touch Most
- `/pages/index.tsx` - Lines 27-74 (UI atoms), 1807-4000 (Payment), 4700-4850 (Sidebar)
- `/styles/globals.css` - Lines 34-39 (colors), 265-285 (mobile topbar)

### Testing Checklist
- [ ] Run Lighthouse (Accessibility >85%)
- [ ] WAVE tool (0 errors)
- [ ] Test on iOS Safari + Android Chrome
- [ ] Keyboard navigation (Tab through all screens)
- [ ] Screen reader (VoiceOver on Mac, NVDA on Windows)

---

## Sprint 2: Player Self-Service (Weeks 3-4)

### Critical Path
```
Day 1-2:  S2.1 (Player API endpoint)
Day 3-5:  S2.2 (Debt Summary) + S2.3 (Session Table)
Day 6-8:  S2.4 (Invoice Viewer)
Day 9-10: S2.6 (QR Codes) + S2.7 (Share Button)
```

### Must Complete
1. **S2.1** - Player Lookup (3 pts) ← BLOCKER for all others
2. **S2.2** - Debt Summary (3 pts)
3. **S2.3** - Session History (5 pts)

### New Files to Create
- `/pages/player.tsx` - Public player page
- `/pages/api/player/[name].ts` - API endpoint
- `/components/InvoiceModal.tsx` - Invoice viewer

### API Endpoints
```
GET /api/player/[name]          → Player debt summary (PUBLIC)
GET /api/payment/outstanding-debt?playerName=X  → Existing endpoint
GET /api/payment/sessions/[id]  → Session details with invoices
```

### Testing Checklist
- [ ] Player page loads without auth
- [ ] Case-insensitive name matching works
- [ ] Invoice images load and zoom
- [ ] QR code scans on 3+ devices
- [ ] Share button copies link

---

## Sprint 3: Refactoring (Weeks 5-6)

### Critical Path
```
Day 1-2:  S3.1 (Zustand Store) ← MUST COMPLETE FIRST
Day 3-5:  S3.2 (Summary Table) + S3.3 (Import Modal)
Day 6-8:  S3.4 (Config Modal) + S3.5 (Edit Modal)
Day 9-10: S3.7 (Final Cleanup) + Full Testing
```

### Extraction Order (DO IN SEQUENCE!)
1. **S3.1** - Zustand Store (5 pts) ← START HERE
2. **S3.2** - Payment Summary Table (5 pts)
3. **S3.3** - Import Modal (5 pts)
4. **S3.4** - Config Modal (3 pts)
5. **S3.5** - Edit Modal (5 pts)
6. **S3.7** - Extract all screens (3 pts) ← FINISH HERE

### New Folder Structure
```
stores/
  paymentStore.ts       ← Create first (S3.1)

components/
  ui/
    Button.tsx
    Card.tsx
    Badge.tsx
  payment/
    PaymentSummaryTable.tsx   (S3.2)
    PaymentImportModal.tsx    (S3.3)
    PaymentConfigModal.tsx    (S3.4)
    EditSessionModal.tsx      (S3.5)
  RosterScreen.tsx      (S3.7)
  SetupScreen.tsx       (S3.7)
  TournamentScreen.tsx  (S3.7)
  ... (5 more screens)
```

### Testing Checklist
- [ ] All E2E tests pass (CRITICAL - zero regressions allowed)
- [ ] index.tsx <1,500 lines (wc -l pages/index.tsx)
- [ ] Build succeeds (npm run build)
- [ ] Bundle size unchanged or smaller
- [ ] React Profiler shows no performance degradation

---

## Daily Checklist for Every Story

### Before Starting
- [ ] Pull latest from main (`git pull origin main`)
- [ ] Create feature branch (`git checkout -b feature/S1.1-aria-labels`)
- [ ] Read story acceptance criteria 2x
- [ ] Understand "Definition of Done" checklist

### During Development
- [ ] Write code in small commits (commit every hour)
- [ ] Run tests after each significant change
- [ ] Update TypeScript types as you go
- [ ] Add comments for complex logic

### Before Creating PR
- [ ] All acceptance criteria met (re-read story!)
- [ ] All "Definition of Done" items checked
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors/warnings
- [ ] Code formatted (`npm run lint`)
- [ ] Self-review: read your own diff carefully
- [ ] Manual testing on 2+ browsers

### PR Description Template
```markdown
## Story
S1.1: Add ARIA Labels to Navigation Menu

## Changes
- Added aria-label to all nav links
- Added aria-current="page" to active link
- Added role="navigation" to sidebar

## Testing
- [x] Keyboard navigation works
- [x] Screen reader announces correctly
- [x] WAVE tool shows 0 errors
- [x] Lighthouse score: 92% (up from 60%)

## Screenshots
[Attach before/after screenshots]

## Checklist
- [x] All acceptance criteria met
- [x] Definition of Done completed
- [x] Tests added/updated
- [x] Documentation updated
```

---

## Common Pitfalls & How to Avoid

### Sprint 1 Pitfalls
❌ **Changing colors without design approval**
✅ Run contrast checker first, get approval, then implement

❌ **Breaking mobile layout on small screens**
✅ Test on 320px width (iPhone SE)

❌ **Skeleton loader causes layout shift**
✅ Match skeleton dimensions exactly to loaded content

### Sprint 2 Pitfalls
❌ **Exposing admin data via public endpoint**
✅ Only return player's own data, double-check API response

❌ **Invoice images too large (slow load)**
✅ Resize images server-side to max 1024px width

❌ **QR code doesn't include full URL**
✅ Use `${window.location.origin}/player?name=X` not just `/player?name=X`

### Sprint 3 Pitfalls
❌ **Extracting component breaks something else**
✅ Run full test suite after EACH component extraction

❌ **Zustand store updates don't trigger re-renders**
✅ Use selectors: `usePaymentStore(state => state.summary)` not `usePaymentStore()`

❌ **Circular dependencies between components**
✅ Keep components independent, use events/callbacks

---

## Emergency Contacts

### Blockers
- **Tech Lead:** @tech-lead (Slack)
- **Product Owner:** @product-owner (Slack)
- **DevOps (CI/CD issues):** @devops (Slack)

### Questions
- **Accessibility:** @accessibility-champion (Slack)
- **Design:** @design-team (Slack + Figma comments)
- **API/Backend:** @backend-lead (Slack)

### Incidents
- **Production Down:** Call Tech Lead immediately
- **Data Loss:** Escalate to CTO + freeze deployments

---

## Useful Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production (tests TypeScript)
npm run test:e2e         # Run Playwright tests

# Count lines in index.tsx
wc -l pages/index.tsx

# Count useState hooks
grep -c "useState" pages/index.tsx

# Find all TODOs
grep -r "TODO" --include="*.tsx" --include="*.ts"
```

### Testing
```bash
# Lighthouse CLI (install: npm i -g @lhci/cli)
lhci autorun --collect.url=http://localhost:3000

# axe-core CLI (install: npm i -g @axe-core/cli)
axe http://localhost:3000

# Visual regression (if using Playwright)
npm run test:e2e -- --update-snapshots
```

### Git
```bash
# Start new story
git checkout main
git pull origin main
git checkout -b feature/S1.1-aria-labels

# Commit often
git add .
git commit -m "feat(a11y): add ARIA labels to sidebar nav"

# Push and create PR
git push -u origin feature/S1.1-aria-labels
# Then open GitHub and create PR
```

---

## Performance Targets

### Lighthouse Scores (After Sprint 1)
- Performance: >80%
- Accessibility: >90% (critical!)
- Best Practices: >90%
- SEO: >90%

### Bundle Size
- Current: ~420KB
- Target: <450KB (don't increase more than 7%)

### Build Time
- Current: ~45s
- Target: <35s (after refactoring)

---

## Acceptance Criteria Shortcuts

### Accessibility (WCAG AA)
- Contrast ratio: 4.5:1 (normal text), 3:1 (large text)
- Touch targets: 44x44px minimum
- Focus visible: 3px outline, 3:1 contrast
- Keyboard: Tab, Shift+Tab, Enter, Esc, Arrow keys

### Mobile Responsive
- Breakpoints: 320px, 375px, 768px, 1024px
- Test devices: iPhone SE, iPhone 12, iPad, Android
- No horizontal scroll on any screen
- Hamburger menu on <768px

### Code Quality
- TypeScript: no `any` types
- No console.log in production code
- Max function length: 50 lines (extract if longer)
- Max component length: 300 lines (extract if longer)

---

## Sprint Ceremonies

### Daily Standup (15 min, 9:30 AM)
- What I did yesterday
- What I'm doing today
- Blockers (if any)

### Sprint Planning (2 hours, Monday Week 1)
- Review backlog
- Assign stories to developers
- Clarify acceptance criteria
- Commit to sprint goal

### Sprint Review (1 hour, Friday Week 2)
- Demo completed stories
- Gather feedback
- Update roadmap

### Sprint Retro (1.5 hours, Friday Week 2)
- What went well
- What didn't go well
- Action items for next sprint

---

## Story Point Reference

| Points | Time | Example |
|--------|------|---------|
| 1 | 1-2 hrs | CSS color change |
| 2 | 2-4 hrs | Add ARIA labels |
| 3 | 4-8 hrs | Modal focus trap |
| 5 | 1-2 days | Extract component |
| 8 | 2-3 days | Analytics dashboard |
| 13 | 3-5 days | Large refactor (avoid!) |

**If a story is >8 points, break it down into smaller stories!**

---

## Success Mantra

> "Ship small, ship often, ship safely."

- Merge at least 1 PR per day
- No PR larger than 500 lines
- Every PR must have tests
- Zero regressions policy

---

**Good luck, team! Let's ship great software! 🚀**

---

**Quick Reference Version:** 1.0
**Last Updated:** 2026-06-21
**Print Date:** ___________
