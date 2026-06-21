# SmashTour Sprint Planning Documentation

**Business Analyst Deliverable Package**
**Created:** 2026-06-21
**Version:** 1.0

---

## Overview

This package contains the complete sprint backlog for the next 6 weeks of SmashTour development. The plan addresses three strategic imperatives:

1. **Player Experience:** Enable self-service payment transparency
2. **Technical Health:** Reduce technical debt in the 5,182-line monolithic component
3. **Accessibility & Mobile:** Achieve WCAG compliance and improve mobile UX

---

## Document Guide

This package includes 4 comprehensive documents:

### 1. [SPRINT_BACKLOG.md](./SPRINT_BACKLOG.md) (54 KB)
**Primary Audience:** Developers, QA Engineers
**Purpose:** Detailed user stories with acceptance criteria

**What's inside:**
- 26 INVEST-compliant user stories across 3 sprints
- Given/When/Then acceptance criteria for each story
- Technical implementation guidance with file paths
- Definition of Done checklists
- Story point estimates (Fibonacci scale)
- MoSCoW prioritization
- Epic breakdown and dependencies map
- Risk assessment per sprint

**When to use:**
- Daily development work
- Sprint planning meetings
- Story refinement sessions
- Technical implementation reference

---

### 2. [SPRINT_EXECUTIVE_SUMMARY.md](./SPRINT_EXECUTIVE_SUMMARY.md) (9.8 KB)
**Primary Audience:** Product Owner, Stakeholders, Management
**Purpose:** High-level overview of business value and ROI

**What's inside:**
- Business value proposition per sprint
- Investment vs returns analysis
- Quantified success metrics (before/after)
- Risk assessment with mitigation strategies
- Resource allocation plan
- Stakeholder communication plan
- MoSCoW prioritization summary
- Approval sign-off section

**When to use:**
- Executive presentations
- Budget approval requests
- Stakeholder status updates
- Sprint review preparation

---

### 3. [SPRINT_QUICK_REFERENCE.md](./SPRINT_QUICK_REFERENCE.md) (9.0 KB)
**Primary Audience:** Developers (daily use)
**Purpose:** At-a-glance reference for developers

**What's inside:**
- Critical path for each sprint (day-by-day)
- Quick wins to start with
- Files you'll modify most often
- Testing checklists
- Common pitfalls and how to avoid them
- Emergency contacts
- Useful commands (git, npm, testing)
- Daily checklist for every story
- PR description template

**When to use:**
- Print and keep at your desk
- Daily standup preparation
- Before starting each story
- When stuck or need quick reference

---

### 4. [SPRINT_VISUAL_ROADMAP.md](./SPRINT_VISUAL_ROADMAP.md) (34 KB)
**Primary Audience:** Entire team + stakeholders
**Purpose:** Visual overview of the 6-week journey

**What's inside:**
- Timeline diagrams (ASCII art)
- Before/after comparisons
- Workflow diagrams
- User journey maps
- Refactoring strategy visualizations
- Success metrics charts
- Risk heatmap
- Team capacity planning
- Success indicators timeline

**When to use:**
- Sprint planning presentations
- Team onboarding
- Progress tracking
- Stakeholder demos

---

## How to Use This Package

### For Product Owners
1. Start with **Executive Summary** for business case
2. Review **Visual Roadmap** for timeline and milestones
3. Reference **Sprint Backlog** for story details during sprint planning
4. Use metrics to track ROI and report to stakeholders

### For Tech Leads
1. Review **Sprint Backlog** for technical scope and dependencies
2. Use **Visual Roadmap** to plan team capacity
3. Reference **Quick Reference** for daily execution
4. Identify risks early using risk assessment sections

### For Developers
1. Print **Quick Reference** and keep it visible
2. Use **Sprint Backlog** for detailed acceptance criteria
3. Follow critical path in **Visual Roadmap**
4. Check Definition of Done before creating PRs

### For QA Engineers
1. Use acceptance criteria from **Sprint Backlog** to write test cases
2. Follow testing checklists in **Quick Reference**
3. Track coverage using metrics in **Executive Summary**
4. Plan regression testing using **Visual Roadmap** dependencies

### For Stakeholders
1. Start with **Executive Summary** for ROI and business value
2. Review **Visual Roadmap** for progress visualization
3. Attend sprint reviews (schedule in **Executive Summary**)
4. Approve stories using sign-off in **Sprint Backlog**

---

## Sprint Overview

### Sprint 1: Foundation & Quick Wins (Weeks 1-2)
**Goal:** Achieve WCAG compliance, improve mobile UX
**Story Points:** 34
**Risk:** LOW
**Key Deliverables:**
- WCAG AA compliant (90% Lighthouse score)
- Mobile responsive tables
- Keyboard navigation
- Loading states

### Sprint 2: Player Self-Service Portal (Weeks 3-4)
**Goal:** Enable players to view debt and payment history
**Story Points:** 34
**Risk:** MEDIUM
**Key Deliverables:**
- Public player lookup page
- Debt summary with breakdown
- Session history table
- Invoice viewer with QR codes

### Sprint 3: Component Refactoring (Weeks 5-6)
**Goal:** Reduce index.tsx from 5,182 to <1,500 lines
**Story Points:** 31
**Risk:** HIGH
**Key Deliverables:**
- Zustand state management
- 5+ extracted components
- Clean architecture
- Zero regressions

---

## Success Metrics Summary

| Metric | Current | Target (Week 6) | Improvement |
|--------|---------|-----------------|-------------|
| Lighthouse Accessibility | 60% | 90% | +50% |
| Mobile Usability | 65% | 85% | +31% |
| Main Component Size | 5,182 lines | <1,500 lines | -73% |
| useState Hooks | 154 | <30 | -82% |
| Player Self-Service | 0% | 80% | +80% |
| Host Admin Time | 10 hrs/week | 6 hrs/week | -40% |
| Bug Reports/Month | 20 | 10 | -50% |

---

## Critical Dependencies

### Must Complete First
- **S3.1 (Zustand Store)** → Blocks S3.2, S3.3, S3.4, S3.5
- **S2.1 (Player API)** → Blocks S2.2, S2.3, S2.4

### Soft Dependencies
- S1.4 (Skeleton) → Pattern reused in S2.3
- S1.5 (Mobile Tables) → Pattern reused in S2.3

### No Dependencies (Can Parallelize)
- Sprint 1: All stories except S1.6 (depends on S1.1-S1.5 completion)
- Sprint 2: S2.5, S2.6, S2.7, S2.8 (after S2.1-S2.3)

---

## Risk Mitigation

### High-Priority Risks

**Risk 1: Sprint 3 Refactoring Introduces Regressions**
- **Impact:** CRITICAL
- **Mitigation:** Extract one component at a time, run full E2E suite after each
- **Owner:** Tech Lead
- **Contingency:** Roll back extracted component, fix in isolation, re-deploy

**Risk 2: Low Player Adoption of Self-Service**
- **Impact:** HIGH
- **Mitigation:** Prominent CTAs, user education, email campaign
- **Owner:** Product Owner
- **Contingency:** Daily tracking, pivot strategy if <30% by Week 4

**Risk 3: Mobile Table Complexity**
- **Impact:** MEDIUM
- **Mitigation:** Start with Rankings table (simpler), apply learnings to Payment
- **Owner:** Lead Developer
- **Contingency:** Use horizontal scroll with fade indicators as fallback

---

## Team Ceremonies

### Daily Standup (15 min, 9:30 AM)
- What I did yesterday
- What I'm doing today
- Blockers

### Sprint Planning (2 hours, Week 1 Day 1)
- Review backlog
- Assign stories
- Commit to sprint goal

### Sprint Review (1 hour, Week 2 Day 10)
- Demo completed stories
- Gather feedback
- Celebrate wins

### Sprint Retrospective (1.5 hours, Week 2 Day 10)
- What went well
- What to improve
- Action items for next sprint

---

## File Structure After Sprint 3

```
badminton/
├── pages/
│   ├── index.tsx (1,400 lines - app shell)
│   ├── player.tsx (new - self-service)
│   └── api/
│       ├── payment/
│       │   ├── outstanding-debt.ts (public)
│       │   └── ... (existing)
│       └── player/[name].ts (new)
│
├── components/
│   ├── ui/ (Sprint 1)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   └── SkeletonLoader.tsx
│   │
│   ├── payment/ (Sprint 2 & 3)
│   │   ├── PaymentSummaryTable.tsx
│   │   ├── PaymentImportModal.tsx
│   │   ├── PaymentConfigModal.tsx
│   │   ├── EditSessionModal.tsx
│   │   └── InvoiceModal.tsx
│   │
│   └── [8 screen components] (Sprint 3)
│       ├── RosterScreen.tsx
│       ├── SetupScreen.tsx
│       ├── TournamentScreen.tsx
│       └── ... (5 more)
│
├── stores/ (Sprint 3)
│   ├── paymentStore.ts
│   └── tournamentStore.ts (optional)
│
└── lib/
    └── hooks/
        └── useFocusTrap.ts (Sprint 1)
```

---

## Key Contacts

### Questions & Support
- **Product Owner:** @product-owner (Slack)
- **Tech Lead:** @tech-lead (Slack)
- **Accessibility Champion:** @a11y-champion (Slack)
- **DevOps:** @devops (Slack)

### Escalation
- **Blockers:** Tech Lead → Product Owner → CTO
- **Production Issues:** Tech Lead (immediate)
- **Scope Changes:** Product Owner (requires re-planning)

---

## Testing Strategy

### Sprint 1 Testing
- Lighthouse CI (automated)
- WAVE tool audits
- Manual keyboard navigation
- Screen reader testing (VoiceOver, NVDA)
- Mobile device testing (iOS Safari, Android Chrome)

### Sprint 2 Testing
- E2E tests for player page
- QR code scanning on 5+ devices
- Invoice viewer on mobile
- Analytics data validation

### Sprint 3 Testing
- **CRITICAL:** Full regression suite after each component extraction
- Performance profiling (React DevTools)
- Bundle size analysis
- Build time measurement
- Parallel development simulation

---

## Definition of Ready (Before Starting Sprint)

- [ ] All stories refined and estimated
- [ ] Acceptance criteria clear and testable
- [ ] Dependencies identified and resolved
- [ ] Team capacity confirmed (2-3 developers)
- [ ] Testing environment prepared
- [ ] Stakeholders aligned on priorities

---

## Definition of Done (Before Closing Sprint)

- [ ] All Must Have stories completed
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing (unit + E2E)
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Stakeholder demo completed
- [ ] Retrospective action items documented

---

## Next Steps

### Immediate Actions (This Week)
1. **Schedule Sprint 1 Planning** (2 hours)
   - Invite: Dev team, PO, QA, Tech Lead
   - Prepare: Review this backlog, identify questions

2. **Set Up Tracking Tools**
   - Create Jira/Linear epics and stories
   - Set up Lighthouse CI
   - Configure analytics tracking

3. **Align Stakeholders**
   - Present Executive Summary to management
   - Get approval for 6-week commitment
   - Confirm team capacity

4. **Prepare Development Environment**
   - Ensure all devs have local setup
   - Install accessibility testing tools (WAVE, axe DevTools)
   - Set up E2E testing framework (Playwright already exists)

### Week 1 Kickoff
1. Sprint 1 Planning Meeting (Monday 9 AM)
2. Start with S1.3 (Color Contrast) - quick win!
3. Daily standups at 9:30 AM
4. Mid-sprint checkpoint (Friday Week 1)

---

## Document Maintenance

### Update Frequency
- **Sprint Backlog:** After each sprint planning (update story status)
- **Executive Summary:** Weekly (update metrics)
- **Quick Reference:** As needed (add new pitfalls, commands)
- **Visual Roadmap:** Monthly (adjust timeline)

### Version History
- v1.0 (2026-06-21): Initial backlog created by Business Analyst
- v1.1 (TBD): Post-Sprint 1 updates
- v1.2 (TBD): Post-Sprint 2 updates
- v2.0 (TBD): Post-Sprint 3 complete revision

---

## Appendix: Tools & Resources

### Development Tools
- **Code Editor:** VS Code with ESLint, Prettier
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Package Manager:** npm

### Testing Tools
- **E2E:** Playwright (already configured)
- **Accessibility:** WAVE, axe DevTools, Lighthouse CI
- **Performance:** React DevTools Profiler
- **Mobile:** BrowserStack or local devices

### Documentation Tools
- **API Docs:** Swagger/OpenAPI (optional)
- **Component Docs:** Storybook (optional)
- **Architecture:** This README + code comments

### Communication Tools
- **Daily:** Slack
- **Meetings:** Zoom/Google Meet
- **Async:** Confluence or Notion (optional)

---

## Glossary

- **ARIA:** Accessible Rich Internet Applications - web accessibility standards
- **CLS:** Cumulative Layout Shift - Core Web Vital metric
- **E2E:** End-to-End testing
- **INVEST:** Independent, Negotiable, Valuable, Estimable, Small, Testable
- **MoSCoW:** Must Have, Should Have, Could Have, Won't Have
- **PWA:** Progressive Web App
- **WCAG:** Web Content Accessibility Guidelines (AA = 4.5:1 contrast)
- **VND:** Vietnamese Dong (currency)
- **Zustand:** Lightweight state management library for React

---

## Acknowledgments

This sprint backlog was prepared by the Business Analyst based on findings from:
- **Product Owner:** Identified NOW priorities (self-service portal, reminders, PWA)
- **Full-Stack Developer:** Identified technical debt (monolith, state management, accessibility)
- **Codebase Analysis:** 5,182-line index.tsx, 154 useState hooks, payment endpoints

**Team collaboration is key to success!** 🚀

---

## License & Confidentiality

This document is confidential and intended for internal use by the SmashTour development team only. Do not distribute externally without approval.

---

**Package Version:** 1.0
**Last Updated:** 2026-06-21
**Next Review:** After Sprint 1 Retrospective
**Maintained By:** Business Analyst

---

## Quick Links

- [Full Sprint Backlog →](./SPRINT_BACKLOG.md)
- [Executive Summary →](./SPRINT_EXECUTIVE_SUMMARY.md)
- [Quick Reference →](./SPRINT_QUICK_REFERENCE.md)
- [Visual Roadmap →](./SPRINT_VISUAL_ROADMAP.md)

---

**Ready to start Sprint 1? Let's build something amazing! 🎯**
