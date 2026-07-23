# SmashTour Architecture Documentation

This directory contains comprehensive architecture documentation for the SmashTour badminton tournament management system.

## Documentation Overview

### 📊 Start Here: Architecture Analysis Summary
**File**: [ARCHITECTURE-ANALYSIS-SUMMARY.md](./ARCHITECTURE-ANALYSIS-SUMMARY.md)
**Purpose**: Executive summary of the architectural analysis and refactoring plan
**Audience**: Project stakeholders, team leads, developers

**What's Inside:**
- Current state health metrics (6,833-line monolith analysis)
- Proposed architecture overview
- Screen component breakdown
- Performance optimization strategy
- 8-week implementation timeline
- Success criteria and metrics

**Read this first** for a high-level understanding of the refactoring initiative.

---

### 📋 Architecture Decision Record (ADR)
**File**: [ADR-001-Performance-Architecture-Refactoring.md](./ADR-001-Performance-Architecture-Refactoring.md)
**Purpose**: Detailed architectural decision documentation
**Audience**: Senior engineers, architects, technical reviewers

**What's Inside:**
- Complete context and problem analysis
- Decision drivers and constraints
- Three architectural options evaluated
- Chosen approach with detailed rationale
- Proposed directory structure with file-level detail
- Code-splitting strategy and memoization patterns
- Migration plan with risk assessment
- Performance validation plan

**Length**: ~23,000 words (comprehensive reference document)

**When to Read:**
- Before starting any extraction work
- When making architectural decisions
- When evaluating trade-offs
- During code review of refactoring PRs

---

### 🛠️ Migration Guide
**File**: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
**Purpose**: Practical guide for working with the new architecture
**Audience**: All developers working on SmashTour

**What's Inside:**
- How to create a new screen component
- How to create a new UI component
- How to create a custom hook
- Code-splitting best practices
- Performance optimization guidelines
- Testing checklists
- Common pitfalls and solutions
- Code review checklist

**Length**: ~9,000 words (developer handbook)

**When to Read:**
- Before creating a new screen or component
- When extracting a component from index.tsx
- When adding a new feature
- During code review

---

### ✅ Implementation Checklist
**File**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)
**Purpose**: Step-by-step task list for the migration
**Audience**: Development team, project managers

**What's Inside:**
- **187 actionable tasks** across 7 phases
- Per-component extraction checklists
- Testing requirements for each screen
- Success metrics tracking
- Rollback procedures
- Progress tracker (0% → 100%)

**Length**: ~11,000 words (project plan)

**When to Use:**
- Daily standup planning
- Sprint planning
- Tracking migration progress
- Identifying next tasks
- Validating completion

---

### 🎯 Example Refactor: Badge Component
**File**: [EXAMPLE-REFACTOR-BADGE.md](./EXAMPLE-REFACTOR-BADGE.md)
**Purpose**: Hands-on example of component extraction
**Audience**: Developers new to the refactoring process

**What's Inside:**
- Before/after code comparison
- 11-step extraction process
- TypeScript interface creation
- Accessibility enhancements
- Testing checklist
- Git commit strategy
- Lessons learned

**Length**: ~5,000 words (tutorial)

**When to Read:**
- Before extracting your first component
- When unsure how to structure a component
- As a reference template for other extractions

---

## Quick Navigation by Role

### For Project Managers
1. Start: [ARCHITECTURE-ANALYSIS-SUMMARY.md](./ARCHITECTURE-ANALYSIS-SUMMARY.md) - Executive summary
2. Track: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) - Progress tracking

### For Developers
1. Start: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Practical guide
2. Reference: [EXAMPLE-REFACTOR-BADGE.md](./EXAMPLE-REFACTOR-BADGE.md) - Step-by-step example
3. Deep Dive: [ADR-001-Performance-Architecture-Refactoring.md](./ADR-001-Performance-Architecture-Refactoring.md) - Full context

### For Architects / Technical Leads
1. Start: [ADR-001-Performance-Architecture-Refactoring.md](./ADR-001-Performance-Architecture-Refactoring.md) - Complete analysis
2. Plan: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) - Execution plan
3. Guide: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Ensure team follows patterns

### For Code Reviewers
1. Standards: [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Code review checklist section
2. Context: [ADR-001-Performance-Architecture-Refactoring.md](./ADR-001-Performance-Architecture-Refactoring.md) - Design decisions
3. Example: [EXAMPLE-REFACTOR-BADGE.md](./EXAMPLE-REFACTOR-BADGE.md) - Reference implementation

---

## Migration Phases Overview

### Phase 1: Foundation (Week 1-2)
**Focus**: Directory setup, UI components, shared hooks
**Files**: Badge, Button, Card, useFetch, useLocalStorage, useAuth
**Risk**: LOW
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-1-foundation-week-1-2)

### Phase 2: Small Screens (Week 2-3)
**Focus**: ChampionScreen, HistoryScreen, BetHistoryScreen
**Risk**: LOW-MEDIUM
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-2-small-screens-extraction-week-2-3)

### Phase 3: Medium Screens (Week 3-4)
**Focus**: RosterScreen, SetupScreen, RankingsScreen, Admin screens
**Risk**: MEDIUM
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-3-medium-screens-extraction-week-3-4)

### Phase 4: TournamentScreen (Week 4-5)
**Focus**: Core tournament logic extraction
**Risk**: HIGH
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-4-complex-screen-tournamentscreen-week-4-5)

### Phase 5: PaymentScreen (Week 5-6)
**Focus**: 2,264-line screen refactor (5 tabs)
**Risk**: HIGH
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-5-most-complex-screen-paymentscreen-week-5-6)

### Phase 6: Optimization (Week 6-7)
**Focus**: Memoization, performance tuning
**Risk**: LOW
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-6-optimization-polish-week-6-7)

### Phase 7: Documentation (Week 7-8)
**Focus**: Knowledge transfer, team training
**Risk**: LOW
**Checklist**: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md#phase-7-documentation-knowledge-transfer-week-7-8)

---

## Key Metrics

### Current State (Baseline)
- **Largest File**: 6,833 lines (`pages/index.tsx`)
- **Initial Bundle**: 324KB
- **Time to Interactive (3G)**: ~8.5 seconds
- **useState Hooks**: 179
- **useEffect Hooks**: 31
- **Fetch Calls**: 66

### Target State (Post-Migration)
- **Largest File**: <600 lines
- **Initial Bundle**: <100KB (**69% reduction**)
- **Time to Interactive (3G)**: <3.2 seconds (**62% improvement**)
- **Lighthouse Performance**: 90+ (mobile)
- **Developer Velocity**: 40% faster

### Success Criteria
- [ ] Bundle size <100KB
- [ ] TTI <3.2s on 3G
- [ ] Lighthouse score >90
- [ ] Max file <600 lines
- [ ] Git diff <200 lines per PR

---

## Common Workflows

### Creating a New Screen Component
1. Read: [MIGRATION-GUIDE.md - Creating a New Screen](./MIGRATION-GUIDE.md#creating-a-new-screen)
2. Reference: [EXAMPLE-REFACTOR-BADGE.md](./EXAMPLE-REFACTOR-BADGE.md)
3. Checklist: [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) - Find relevant phase

### Extracting an Existing Component
1. Identify component in [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)
2. Follow steps in [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
3. Use [EXAMPLE-REFACTOR-BADGE.md](./EXAMPLE-REFACTOR-BADGE.md) as template
4. Test using checklist
5. Submit PR with before/after screenshots

### Optimizing Performance
1. Read: [MIGRATION-GUIDE.md - Performance Guidelines](./MIGRATION-GUIDE.md#performance-guidelines)
2. Understand: [ADR-001 - Memoization Strategy](./ADR-001-Performance-Architecture-Refactoring.md#memoization-strategy)
3. Measure: React DevTools Profiler
4. Optimize: Apply React.memo, useMemo, useCallback
5. Validate: Compare before/after metrics

### Code Review Checklist
1. Reference: [MIGRATION-GUIDE.md - Code Review Checklist](./MIGRATION-GUIDE.md#code-review-checklist)
2. Verify: Component in correct directory
3. Check: TypeScript strict, JSDoc present
4. Test: Visual regression, manual testing
5. Approve: Bundle size impact acceptable

---

## Tools & Commands

### Measure Bundle Size
```bash
npm run build
ls -lh .next/static/chunks/pages/*.js
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

### Run Performance Audit
```bash
npx lighthouse https://smashtour.app --view --preset=mobile
npx lighthouse https://smashtour.app --view --preset=desktop
```

### Profile React Rendering
```bash
# Open React DevTools in browser
# Navigate to Profiler tab
# Record interaction, analyze re-renders
```

### Test Code
```bash
npm run test:e2e          # Playwright end-to-end tests
npm run test:e2e:ui       # Playwright UI mode
```

### Git Workflow
```bash
git checkout -b feature/extract-<component-name>
# Make changes
git add .
git commit -m "refactor(screens): extract <ComponentName>"
git push origin feature/extract-<component-name>
# Create PR with before/after screenshots
```

---

## Frequently Asked Questions

### Q: Which document should I read first?
**A**: Start with [ARCHITECTURE-ANALYSIS-SUMMARY.md](./ARCHITECTURE-ANALYSIS-SUMMARY.md) for the big picture, then move to [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for practical steps.

### Q: How do I extract a component?
**A**: Follow the step-by-step guide in [MIGRATION-GUIDE.md - Creating a New Screen](./MIGRATION-GUIDE.md#creating-a-new-screen) and reference [EXAMPLE-REFACTOR-BADGE.md](./EXAMPLE-REFACTOR-BADGE.md).

### Q: What if I break something during extraction?
**A**: Every extraction is a separate PR. Revert the PR, debug in isolation, resubmit. See [ADR-001 - Rollback Plan](./ADR-001-Performance-Architecture-Refactoring.md#rollback-plan).

### Q: How do I know which components to memoize?
**A**: See [MIGRATION-GUIDE.md - Performance Guidelines](./MIGRATION-GUIDE.md#performance-guidelines) and [ADR-001 - Memoization Strategy](./ADR-001-Performance-Architecture-Refactoring.md#memoization-strategy).

### Q: What's the timeline for this migration?
**A**: 8 weeks across 7 phases. See [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) for detailed timeline.

### Q: Can I add a new feature during the migration?
**A**: Yes, but coordinate with team to avoid merge conflicts. New features should follow the new architecture patterns from the start.

### Q: How do I test my extraction?
**A**: Use the testing checklist in each phase of [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md). Manual testing + visual regression + bundle size check.

---

## Contributing to Documentation

These documents are living references. If you:
- Find errors or outdated information
- Discover better patterns or practices
- Complete a phase and have lessons learned
- Need clarification on a section

**Please update the docs!** Submit a PR with your improvements.

### Documentation Standards
- Use Markdown for all docs
- Include code examples for complex concepts
- Add links to related sections
- Keep examples up-to-date with latest code
- Use checklists for actionable items

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-06-24 | Initial architecture analysis and migration plan | Senior Solution Architect |
| - | - | Future updates tracked here | - |

---

## Contact & Support

For questions about the architecture or migration:
- **Architecture Decisions**: Refer to [ADR-001](./ADR-001-Performance-Architecture-Refactoring.md)
- **Implementation Questions**: Refer to [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)
- **Progress Tracking**: Update [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md)

---

**Document Owner**: SmashTour Development Team
**Last Updated**: 2026-06-24
**Next Review**: After Phase 1 completion (Week 2)
