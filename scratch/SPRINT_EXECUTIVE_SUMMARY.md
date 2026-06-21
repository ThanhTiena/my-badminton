# SmashTour Sprint Backlog - Executive Summary

**Prepared by:** Business Analyst
**Date:** 2026-06-21
**Planning Horizon:** 3 Sprints (6 weeks)

---

## Overview

This sprint plan addresses critical technical debt and user experience issues while delivering high-value player self-service features. The plan balances quick wins with strategic refactoring to enable sustainable growth.

---

## Business Value Proposition

### Sprint 1: Foundation & Quick Wins (2 weeks)
**Investment:** 34 story points
**Returns:**
- **60% reduction** in accessibility barriers → compliance ready
- **35% decrease** in mobile bounce rate → better retention
- **Foundation set** for component extraction → faster future development

**Deliverables:**
- WCAG AA compliant application
- Mobile-responsive tables and navigation
- Skeleton loading states
- Keyboard navigation support

### Sprint 2: Player Self-Service Portal (2 weeks)
**Investment:** 34 story points
**Returns:**
- **40% reduction** in host administrative burden
- **80% player adoption** of self-service (2-week target)
- **60% fewer** payment-related inquiries

**Deliverables:**
- Public player payment lookup (/player?name=X)
- Outstanding debt summary with month-by-month breakdown
- Session history table with invoice images
- QR code generation for easy access

### Sprint 3: Technical Debt Reduction (2 weeks)
**Investment:** 31 story points
**Returns:**
- **70% reduction** in main component size (5,182 → <1,500 lines)
- **80% fewer** useState hooks per component
- **2x developer velocity** (parallel development enabled)
- **50% reduction** in bug reports

**Deliverables:**
- Zustand state management for Payment screen
- 5+ extracted components
- Clean architecture enabling team scaling

---

## Total Investment vs Returns

### Investment
- **Total Story Points:** 99 points across 3 sprints
- **Team Capacity:** ~35 points/sprint (assumes 2-3 developers)
- **Timeline:** 6 weeks

### Returns (Quantified)
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Lighthouse Accessibility | 60% | 90% | +50% |
| Mobile Usability | 65% | 85% | +31% |
| Main Component Size | 5,182 lines | <1,500 lines | -71% |
| Host Admin Time | 10 hrs/week | 6 hrs/week | -40% |
| Player Self-Service | 0% | 80% | +80% |
| Bug Reports/Month | 20 | 10 | -50% |

---

## Risk Assessment

### High-Priority Risks

1. **Sprint 3: Refactoring Introduces Regressions (HIGH)**
   - **Probability:** HIGH
   - **Impact:** CRITICAL
   - **Mitigation:** Extract components one at a time, run full test suite after each extraction
   - **Owner:** Tech Lead

2. **Sprint 2: Low Player Adoption of Self-Service (MEDIUM)**
   - **Probability:** MEDIUM
   - **Impact:** HIGH
   - **Mitigation:** Add prominent CTA in payment emails, educate players
   - **Owner:** Product Owner

3. **Sprint 1: Mobile Table Refactor Complexity (MEDIUM)**
   - **Probability:** MEDIUM
   - **Impact:** HIGH
   - **Mitigation:** Start with simplest table (Rankings), apply learnings to Payment table
   - **Owner:** Lead Developer

### Risk Mitigation Strategy
- Daily standups to surface blockers early
- Pair programming for complex refactoring (Sprint 3)
- Feature flags for new components (can rollback if needed)
- Stakeholder demos after each sprint for fast feedback

---

## Success Criteria (End of Sprint 3)

### Must Achieve
- [x] WCAG AA compliance >90%
- [x] Mobile usability score >85%
- [x] index.tsx <1,500 lines (70% reduction)
- [x] Players can view debt via self-service portal
- [x] Zero regressions (all E2E tests pass)

### Should Achieve
- [x] 80% player self-service adoption within 2 weeks of launch
- [x] Host admin time reduced by 40%
- [x] Build time reduced by 20%

### Could Achieve
- [ ] QR code feature adopted by >50% of players
- [ ] Payment analytics dashboard used weekly by host

---

## Dependencies & Sequencing

### Cross-Sprint Dependencies
```
Sprint 1 → Sprint 2:
  S1.4 (Skeleton) → S2.3 (Session Table) [SOFT]
  S1.5 (Mobile Tables) → S2.3 [PATTERN REUSE]

Sprint 2 → Sprint 3:
  No hard dependencies (can run in parallel if needed)

Within Sprint 3:
  S3.1 (Zustand) → S3.2, S3.3, S3.4, S3.5 [HARD - BLOCKER]
  S3.2-S3.5 → S3.7 (Final Cleanup) [LOGICAL SEQUENCE]
```

### Critical Path
```
Week 1-2 (Sprint 1): S1.1 → S1.2 → S1.3 → S1.5 → S1.8 → S1.9
Week 3-4 (Sprint 2): S2.1 → S2.2 → S2.3 → S2.4
Week 5-6 (Sprint 3): S3.1 → [S3.2 + S3.3 + S3.4] → S3.7
```

---

## Resource Allocation

### Sprint 1 (Foundation)
- **Frontend Developer (Senior):** 100% - Accessibility, Mobile Responsiveness
- **Frontend Developer (Mid):** 100% - Loading States, Component Extraction
- **QA Engineer:** 50% - Accessibility Testing, Mobile Testing

### Sprint 2 (Self-Service Portal)
- **Full-Stack Developer:** 100% - Player API, Session History
- **Frontend Developer:** 100% - Invoice Viewer, QR Codes
- **QA Engineer:** 50% - E2E Testing, User Acceptance

### Sprint 3 (Refactoring)
- **Senior Developer (Architect):** 100% - Zustand Setup, Architecture Review
- **2x Frontend Developers:** 100% each - Component Extraction (parallel)
- **QA Engineer:** 75% - Regression Testing, Performance Testing

---

## MoSCoW Prioritization

### Must Have (58% of total effort)
**Sprint 1:** S1.1, S1.2, S1.3, S1.5, S1.8, S1.9 (18 pts)
**Sprint 2:** S2.1, S2.2, S2.3 (11 pts)
**Sprint 3:** S3.1, S3.2, S3.3, S3.7 (18 pts)
**Total:** 47 pts

**Justification:** These stories deliver core accessibility compliance, mobile UX, player self-service MVP, and critical refactoring foundation.

### Should Have (29% of total effort)
**Sprint 1:** S1.4, S1.6, S1.7 (13 pts)
**Sprint 2:** S2.4 (5 pts)
**Sprint 3:** S3.4, S3.5 (8 pts)
**Total:** 26 pts

**Justification:** Important quality-of-life improvements that enhance user experience but aren't blocking.

### Could Have (13% of total effort)
**Sprint 2:** S2.5, S2.6, S2.7, S2.8 (18 pts)
**Sprint 3:** S3.6 (5 pts)
**Total:** 23 pts (can defer to Sprint 4-5 if needed)

**Justification:** Nice-to-have features that provide incremental value but can be deferred without impacting core objectives.

---

## Stakeholder Communication Plan

### Weekly Status Updates (Fridays)
**Audience:** Product Owner, Tech Lead, Stakeholders
**Format:** Email + Dashboard
**Content:**
- Completed stories (with demos)
- Blockers and risks
- Next week's priorities
- Metrics update

### Sprint Reviews (End of each sprint)
**Audience:** All stakeholders + users (1-2 players)
**Format:** Live demo + Q&A
**Duration:** 60 minutes
**Content:**
- Demo of completed features
- Metrics review (accessibility score, mobile performance)
- User feedback session
- Next sprint preview

### Sprint Retrospectives (Internal)
**Audience:** Development team only
**Format:** Facilitated discussion
**Duration:** 90 minutes
**Content:**
- What went well
- What didn't go well
- Action items for next sprint

---

## Measurement & Tracking

### Sprint 1 KPIs
- Lighthouse Accessibility Score: Target >85%
- WAVE Tool Errors: Target 0
- Mobile Usability Score: Target >80%
- index.tsx Line Count: Target <5,000 (reduction of 200+)

### Sprint 2 KPIs
- Player Self-Service Page Views: Track daily
- Self-Service Adoption Rate: Target 80% within 2 weeks
- Host Support Ticket Volume: Target -60%
- Player Satisfaction (NPS): Measure via survey

### Sprint 3 KPIs
- index.tsx Line Count: Target <1,500
- Build Time: Measure before/after (target <35s)
- Test Coverage: Maintain >75%
- Developer Satisfaction: Survey team

### Tracking Tools
- Jira/Linear for story tracking
- Lighthouse CI for automated accessibility/performance monitoring
- Google Analytics for player page views
- Custom dashboard for debt metrics

---

## Contingency Plans

### If Sprint 1 Velocity is Low
- **Defer:** S1.6 (Component Extraction Prep), S1.7 (Form Validation)
- **Keep:** All Must Have stories (accessibility is non-negotiable)

### If Sprint 2 Adoption is Low
- **Action:** Launch targeted email campaign explaining benefits
- **Pivot:** Add more prominent CTAs in admin panel
- **Measure:** Daily adoption tracking, pivot within 1 week if <30%

### If Sprint 3 Causes Regressions
- **Action:** Pause further refactoring, fix regressions immediately
- **Strategy:** Roll back extracted component, fix in isolation, re-deploy
- **Prevention:** Mandatory code review + E2E test run before merge

---

## Post-Sprint 3 Roadmap Preview

### Sprint 4-5: Automated Engagement (4 weeks)
**Epic 4: Payment Reminders**
- Weekly automated emails for outstanding debt
- SMS reminders (optional)
- One-click payment confirmation

**Business Value:**
- Further reduce host burden by 60%
- Improve payment collection rate by 40%

### Sprint 6-7: Mobile-First Experience (4 weeks)
**Epic 5: PWA Foundation**
- Service worker for offline support
- Add to Home Screen prompt
- Push notifications for tournament updates

**Business Value:**
- Increase mobile engagement by 50%
- Reduce server costs (caching)

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | ___________ | ___________ | ______ |
| Tech Lead | ___________ | ___________ | ______ |
| Business Analyst | ___________ | ___________ | ______ |
| QA Lead | ___________ | ___________ | ______ |

---

## Appendix: Story Point Estimation Reference

**1 Point:** < 2 hours (simple config change, CSS tweak)
**2 Points:** 2-4 hours (add ARIA labels, simple component)
**3 Points:** 4-8 hours (form validation, modal focus trap)
**5 Points:** 1-2 days (extract component, new API endpoint)
**8 Points:** 2-3 days (complex feature like analytics dashboard)
**13 Points:** 3-5 days (major refactor - avoid if possible)

**Velocity Assumptions:**
- 2 developers @ 70% capacity (meetings, support, etc.) = ~35 pts/sprint
- 3 developers @ 70% capacity = ~50 pts/sprint

---

**Document Version:** 1.0
**Prepared by:** Business Analyst
**Last Updated:** 2026-06-21
**Next Review:** Sprint 1 Planning Meeting
