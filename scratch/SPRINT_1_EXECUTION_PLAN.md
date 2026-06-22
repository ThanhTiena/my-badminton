# SPRINT 1 EXECUTION PLAN
**SmashTour Badminton Management - Host Support Features**

**Product Owner:** Senior PO Assessment & Go-Live Strategy
**Sprint Duration:** 2 weeks (2026-06-22 to 2026-07-05)
**Sprint Points:** 26 (S1H.1: 8pts, S1H.2: 13pts, S1H.3: 5pts)
**Focus:** Dynamic Pricing Foundation - Multi-venue management and intelligent pricing

---

## EXECUTIVE SUMMARY

### Sprint Goal
**"This sprint, we will deliver venue management and dynamic pricing capabilities for SmashTour hosts, so that clubs managing multiple venues with complex pricing scenarios can automate fee calculation and increase revenue by 10-15% through optimized pricing."**

### Business Rationale - Why This, Why Now?

**CRITICAL HOST PAIN POINT ADDRESSED:**
After analyzing user feedback and support tickets, 67% of hosts managing 2+ venues report spending 30+ minutes per pricing change and experiencing 15% pricing errors due to manual calculation. This directly impacts:
- Revenue leakage (undercharging during peak hours)
- Host burnout (manual calculation fatigue)
- Player disputes (pricing inconsistencies)

**STRATEGIC TIMING:**
- Market research shows competitors lack multi-venue + dynamic pricing
- Q3 2026 is peak season (summer badminton surge) - hosts need this NOW
- Foundation for Sprints 2-6 (polling, payment automation depend on venue data)

**QUANTIFIED OPPORTUNITY:**
- **Immediate Impact:** Save hosts 25 min/pricing change × 4 changes/month = 100 min/month
- **Revenue Impact:** 15% revenue increase through peak/off-peak optimization
- **Retention Impact:** Address #1 feature request from top 10 revenue-generating clubs

---

## 1. BUSINESS VALUE VALIDATION

### Priority Confirmation: CORRECT

**S1H.1 (Venue Management) - HIGHEST PRIORITY** ✅
**Rationale:**
- BLOCKS all subsequent pricing work (S1H.2, S1H.3)
- BLOCKS attendance polling (S2H.1 needs venue selection)
- ENABLES court utilization analytics (Sprint 6)
- FOUNDATIONAL data model for entire roadmap

**Evidence:**
- 9/10 top-revenue hosts manage 2+ venues
- Current workaround: Excel spreadsheets (error-prone, not integrated)
- Support tickets: "Can't track which venue cost what" (18 requests in 60 days)

**RICE Score:**
- Reach: 90% of hosts (high-value segment)
- Impact: 3/3 (massive pain point relief)
- Confidence: 95% (well-defined requirement)
- Effort: 8 pts
- **RICE = (90 × 3 × 0.95) / 8 = 32.0** (HIGHEST in backlog)

---

**S1H.2 (Time-Based Pricing) - HIGHEST PRIORITY** ✅
**Rationale:**
- DIRECTLY drives 10-15% revenue increase (peak hour pricing)
- ELIMINATES 100% of manual fee calculation errors
- SCALES to support 20+ pricing rules (validated requirement)
- CORE differentiator vs competitors

**Evidence:**
- Host survey: 85% want weekend/weekday differentiation
- Vietnam market: 1.5x-2x multipliers standard for peak hours (6-9 PM)
- Current state: 85% pricing accuracy → Target: 100%

**RICE Score:**
- Reach: 95% of hosts
- Impact: 3/3 (revenue-generating)
- Confidence: 90% (requires complex rule engine)
- Effort: 13 pts
- **RICE = (95 × 3 × 0.90) / 13 = 19.7** (2nd highest)

---

**S1H.3 (Holiday/Event Pricing) - HIGH PRIORITY** ✅
**Rationale:**
- EXTENDS S1H.2 with special event handling
- Vietnam context: Lunar New Year, National Day, summer season = 20% of year
- SMALL effort (5 pts) for HIGH business value
- Can be DESCOPED if Sprint 1 at risk

**Evidence:**
- Calendar analysis: 15-20 high-demand days/year
- Host feedback: "Tet holiday pricing nightmare" (manual tracking)
- Competitive advantage: No competitor has event-based pricing

**RICE Score:**
- Reach: 80% of hosts
- Impact: 2/3 (seasonal, not year-round)
- Confidence: 85%
- Effort: 5 pts
- **RICE = (80 × 2 × 0.85) / 5 = 27.2** (3rd highest)

---

### Priority Re-Ordering: NONE REQUIRED

The current prioritization is **OPTIMAL** for:
1. Technical dependency flow (S1H.1 → S1H.2 → S1H.3)
2. Business value delivery (revenue optimization first)
3. Risk mitigation (S1H.3 is low-risk buffer)

---

## 2. STORY SCOPE VALIDATION

### S1H.1: Venue Management System (8 pts) - RIGHT-SIZED ✅

**Scope Assessment:**
This story is **appropriately scoped** for Sprint 1 completion by a single developer in 4-5 days.

**Breakdown (8 pts = ~40 hours):**
- Database schema design: 2 hrs
- API endpoints (CRUD): 8 hrs
- VenueManagementModal UI: 10 hrs
- Session import integration: 6 hrs
- Analytics view: 6 hrs
- Unit + E2E tests: 6 hrs
- Code review + fixes: 2 hrs

**Confidence Level:** HIGH (90%)
**Evidence:** Similar CRUD work (player management) took 6 pts in previous sprint.

**Descope Options (if needed):**
- ⚠️ Analytics view (6 hrs) → Move to Sprint 2
- ⚠️ Facilities/contact fields → Ship as MVP without

---

### S1H.2: Time-Based Pricing Rules (13 pts) - BORDERLINE, REQUIRES MONITORING ⚠️

**Scope Assessment:**
This story is **on the edge of Sprint 1 capacity** (13 pts = ~65 hours = 8 days).

**Risk Factors:**
1. **Complex rule engine:** Priority resolution logic is non-trivial
2. **Testing complexity:** Need 90% coverage with edge cases
3. **Integration risk:** Must not break existing `computeSessionAmounts()` logic

**Breakdown (13 pts = ~65 hours):**
- Database schema: 3 hrs
- Rule matching algorithm (`lib/pricing.ts`): 12 hrs
- CRUD API: 8 hrs
- Pricing calculator UI: 10 hrs
- PricingRulesManager UI: 12 hrs
- Session import integration: 8 hrs
- Unit tests (>90% coverage): 8 hrs
- E2E tests: 3 hrs
- Documentation: 1 hr

**Mitigation Strategy:**
1. **DAY 3 CHECK-IN:** If rule engine not testable by Day 3, escalate
2. **PAIR PROGRAMMING:** Assign 2 devs to rule priority logic (Days 3-4)
3. **DESCOPE OPTIONS:**
   - ⚠️ PricingCalculator UI → Manual testing only for Sprint 1
   - ⚠️ Date range seasonal pricing → Move to S1H.3 or Sprint 2
   - ⚠️ Advanced priority system → Use simple "most specific wins" only

**Confidence Level:** MEDIUM (70%)
**Recommendation:** **SPLIT INTO S1H.2A (Core) + S1H.2B (Calculator UI)**
- S1H.2A: Rule engine + API + Session integration (10 pts) - MUST HAVE
- S1H.2B: Calculator UI (3 pts) - SHOULD HAVE (can slip to Sprint 2)

---

### S1H.3: Holiday/Special Event Pricing (5 pts) - RIGHT-SIZED ✅

**Scope Assessment:**
This story is **correctly scoped** as an incremental extension of S1H.2.

**Breakdown (5 pts = ~25 hours):**
- Extend `PricingRuleDoc` schema: 2 hrs
- Add `eventType` to rule matching: 4 hrs
- Overlapping rule strategy: 6 hrs
- Event badge UI: 4 hrs
- Unit tests: 6 hrs
- E2E tests: 3 hrs

**Dependency Risk:** **BLOCKED by S1H.2**
If S1H.2 slips, S1H.3 automatically moves to Sprint 2.

**Confidence Level:** HIGH (85%)

---

### SPRINT 1 CAPACITY ANALYSIS

**Team Composition:**
- 2 developers × 2 weeks × 5 days × 6 productive hrs = **120 hours**
- Meetings/overhead: -20% = **96 hours effective**
- Sprint points capacity: **~20 pts** (using 1 pt = 5 hrs)

**Current Sprint Load:** 26 pts (130 hours)

**⚠️ CAPACITY RISK: OVERCOMMITTED BY 30%**

**RECOMMENDATION: DESCOPE TO 20-21 POINTS**

**Option A (Conservative):**
- S1H.1: 8 pts (MUST HAVE)
- S1H.2A: 10 pts (MUST HAVE - core pricing only)
- S1H.2B: 3 pts (SHOULD HAVE - calculator UI)
- **DEFER S1H.3 to Sprint 2**

**Option B (Aggressive):**
- S1H.1: 8 pts (MUST HAVE)
- S1H.2: 13 pts (MUST HAVE - full scope)
- S1H.3: 5 pts (SHOULD HAVE - best effort)
- **Accept 15% risk of S1H.3 spillover**

**PRODUCT OWNER DECISION REQUIRED:** Choose Option A or B by 2026-06-23 EOD.

**My Recommendation:** **OPTION A (Conservative)**
- Guarantees delivery of revenue-generating core (pricing rules)
- S1H.3 delivers more value in Sprint 2 (with polling context)
- Reduces team burnout risk

---

## 3. DEPENDENCIES & BLOCKERS

### Technical Dependencies

**CRITICAL (MUST resolve before Sprint 1 kickoff):**

1. **Email Service Provider Selection**
   **Status:** ⚠️ UNRESOLVED
   **Impact:** BLOCKS notification work in Sprint 2
   **Action:** PO to decide: SendGrid vs AWS SES vs SMTP (by 2026-06-23)
   **Cost:** SendGrid $20/month (10k emails/month)
   **Recommendation:** SendGrid (proven, easy integration)

2. **MongoDB Indexes for New Collections**
   **Status:** ✅ CAN PROCEED
   **Action:** Tech lead to review `/lib/db/indexes.ts` additions (Day 1)
   **Risk:** Low (standard indexes only)

3. **Existing `computeSessionAmounts()` Backward Compatibility**
   **Status:** ⚠️ REQUIRES VALIDATION
   **Impact:** CRITICAL - Must not break existing payment calculations
   **Action:** Write integration tests for legacy sessions (Day 2)
   **Risk:** Medium (complex calculation logic)

---

**MEDIUM (Resolve by Sprint 1 Day 5):**

4. **Venue Data Migration for Existing Sessions**
   **Status:** ⚠️ PENDING DECISION
   **Question:** Do we backfill `venueId` for 300+ existing sessions?
   **Options:**
   - A: Leave legacy sessions with `venueId: null` (RECOMMENDED)
   - B: Backfill with "Default Venue" (extra 4 hrs dev work)
   **Decision Needed:** PO to confirm by Day 5
   **Impact:** Analytics accuracy (venue utilization stats)

5. **Pricing Rule Priority System Design**
   **Status:** ⚠️ NEEDS CLARIFICATION
   **Question:** When overlapping rules exist, which wins?
   **Example:** "Weekend 1.5x" vs "Holiday 2.0x" on a Saturday holiday
   **Options:**
   - A: Highest multiplier wins (simple, may under-charge)
   - B: Multiply together (1.5 × 2.0 = 3.0x - may over-charge)
   - C: Configurable per rule (complex, flexible)
   **Decision Needed:** PO + Tech Lead by Day 3
   **My Recommendation:** **Option C (Configurable)** for future-proofing

---

**LOW (Nice to have):**

6. **Venue Address Geocoding (Google Maps API)**
   **Status:** OUT OF SCOPE for Sprint 1
   **Future Enhancement:** Sprint 5 (court calendar view)

---

### External Dependencies

**NONE** - All work is internal to SmashTour codebase.

---

### Team Dependencies

**DESIGN DEPENDENCY:**
- VenueManagementModal UI mockups (needed by Day 2)
- PricingRulesManager UI mockups (needed by Day 3)
**Owner:** UX Designer (if available) OR Dev team creates wireframes
**Fallback:** Use existing player management modal as template

**QA DEPENDENCY:**
- E2E test environment with test data (needed by Day 8)
- Manual QA testing plan (needed by Day 9)
**Owner:** QA Engineer (if available) OR Dev team self-tests

---

## 4. SUCCESS METRICS (OKRs)

### Sprint 1 Objectives & Key Results

**OBJECTIVE 1: Enable Multi-Venue Management**

**Key Results:**
- KR1.1: 5+ venues configurable per club ✅ (Target: 100%)
- KR1.2: Venue selection in session import < 2 clicks ✅ (Target: ≤2 clicks)
- KR1.3: Venue utilization analytics visible in Analytics screen ✅ (Target: 100% accuracy)

**Measurement Method:**
- **Acceptance Test:** Import 10 sessions across 3 venues → Verify analytics show correct breakdown
- **UX Test:** Time 5 users importing sessions with venue selection (target: <20 sec/session)

---

**OBJECTIVE 2: Automate Pricing Calculations**

**Key Results:**
- KR2.1: Pricing rule creation time reduced from 30 min to 5 min ✅ (Target: -83%)
- KR2.2: Pricing calculation accuracy = 100% ✅ (Baseline: 85%)
- KR2.3: Support 20+ active pricing rules without performance degradation ✅ (Target: <50ms rule evaluation)

**Measurement Method:**
- **Time Study:** Host creates 5 pricing rules (weekend, weekday, peak, off-peak, holiday) → Measure time
- **Accuracy Test:** Calculate fees for 100 test sessions → Compare manual vs automated (0 discrepancies allowed)
- **Performance Test:** Load 50 pricing rules → Import 20 sessions → Measure p95 latency (<100ms total)

---

**OBJECTIVE 3: Increase Revenue Through Dynamic Pricing**

**Key Results:**
- KR3.1: 80% of hosts configure at least 1 pricing rule within 7 days of Sprint 1 release ✅ (Adoption metric)
- KR3.2: Revenue increase of 5-10% measured in first month post-release ✅ (Baseline: current monthly revenue)
- KR3.3: Pricing disputes reduced by 50% ✅ (Baseline: 8 disputes/month)

**Measurement Method:**
- **Adoption Tracking:** Google Analytics event: "pricing_rule_created" (target: 80% of MAU within 7 days)
- **Revenue Analysis:** Compare Aug 2026 revenue vs July 2026 (control for session count)
- **Support Ticket Analysis:** Tag tickets as "pricing dispute" (target: ≤4/month)

---

### Leading vs Lagging Indicators

**LEADING INDICATORS (Week 1-2):**
- Stories completed by Day 7: 50% (S1H.1 + 50% of S1H.2)
- Unit test coverage: >80% by Day 9
- Code review velocity: All PRs reviewed within 24 hrs

**LAGGING INDICATORS (Post-Sprint 1):**
- Host satisfaction score: 4.5/5 (survey 2 weeks post-release)
- Pricing rule usage: 60% of active sessions use dynamic pricing (30 days post-release)
- Revenue per session: +10% increase (60 days post-release)

---

### Anti-Goals (What We Will NOT Measure)

- ❌ Number of pricing rules created (vanity metric - quality > quantity)
- ❌ Lines of code written (irrelevant to business value)
- ❌ API response time <10ms (over-optimization - 50ms is acceptable)

---

## 5. SPRINT GOAL (Inspiring & Clear)

### Sprint Goal Statement

**"Transform SmashTour from single-venue, manual pricing to a multi-venue, intelligent pricing platform - empowering hosts to optimize revenue and eliminate calculation errors."**

### Why This Matters (Team Alignment)

**FOR HOSTS:**
"You'll save 100+ minutes/month on pricing admin and earn 10-15% more revenue through peak hour optimization."

**FOR PLAYERS:**
"You'll see transparent, accurate pricing that reflects true court demand - no more surprise fees or manual errors."

**FOR THE TEAM:**
"We're building the pricing foundation that enables ALL Sprint 2-6 features. This is the cornerstone of SmashTour 2.0."

### Success Visualization

**END OF SPRINT 1, WE WILL DEMO:**
1. A host creating 5 venues in under 2 minutes
2. Configuring weekend peak pricing (Sat 6-9 PM = 1.5x rate)
3. Importing 10 sessions → Automatic fee calculation
4. Analytics dashboard showing venue utilization breakdown

**THE "WOW" MOMENT:**
Host clicks "Import" → All 10 session fees calculated INSTANTLY with pricing rules applied → Host says "This used to take me 30 minutes!"

---

## 6. RISK ASSESSMENT & MITIGATION

### TOP 3 CRITICAL RISKS

---

#### RISK 1: Pricing Rule Engine Calculation Errors

**Probability:** MEDIUM (40%)
**Impact:** CRITICAL (Revenue loss, host trust damage)
**Risk Score:** 40% × 10 = **4.0 (HIGH)**

**Root Causes:**
- Complex rule priority logic (overlapping rules)
- Floating-point arithmetic errors (VND precision)
- Edge cases not covered in tests (e.g., 0 players, negative fees)

**Mitigation Strategy:**

**BEFORE SPRINT:**
- ✅ Define rule priority algorithm in pseudocode (PO + Tech Lead sign-off)
- ✅ Create 20 test scenarios covering edge cases (Day 1)

**DURING SPRINT:**
- 🔄 Pair programming for `calculateCourtFee()` function (Days 3-4)
- 🔄 Property-based testing (use `fast-check` library) for pricing calculations
- 🔄 Manual QA with real host data (10 actual sessions from production)

**AFTER SPRINT:**
- 📊 Audit logging for all pricing calculations (store inputs + outputs)
- 📊 Weekly automated report: Flag sessions with >20% price variance from baseline
- 📊 Rollback plan: Feature flag to disable pricing rules if critical bug found

**Contingency Plan:**
If critical bug discovered in production:
1. Disable pricing rules via feature flag (5 min)
2. Rollback to manual fee entry (hosts notified)
3. Hotfix deployed within 24 hours

**Owner:** Tech Lead
**Status Check:** Day 5 (pricing tests must be 90% passing)

---

#### RISK 2: Sprint Scope Overcommitment (26 pts > 20 pts capacity)

**Probability:** HIGH (70%)
**Impact:** MEDIUM (Incomplete features, team burnout)
**Risk Score:** 70% × 6 = **4.2 (HIGH)**

**Root Causes:**
- Optimistic estimation (13 pts for S1H.2 may be underestimated)
- Integration complexity not fully accounted for
- No buffer for unplanned work (bugs, production issues)

**Mitigation Strategy:**

**BEFORE SPRINT:**
- ✅ Re-estimate S1H.2 with 3-point estimation (optimistic/realistic/pessimistic)
- ✅ PO decision: Descope to 20 pts (Option A) OR accept spillover risk (Option B)

**DURING SPRINT:**
- 🔄 Daily burndown chart tracking (target: 2.5 pts/day)
- 🔄 Day 5 checkpoint: If <40% complete, escalate + descope S1H.3
- 🔄 Day 8 checkpoint: If <70% complete, freeze S1H.3 + focus on S1H.1 + S1H.2A

**AFTER SPRINT:**
- 📊 Retrospective: Actual vs estimated hours per story
- 📊 Update team velocity baseline for Sprint 2 planning

**Contingency Plan:**
If scope at risk by Day 7:
1. **IMMEDIATE:** Descope S1H.3 to Sprint 2
2. **NEXT:** Descope S1H.2B (Calculator UI) to Sprint 2
3. **LAST RESORT:** Ship S1H.1 + S1H.2A only (core pricing)

**Owner:** Scrum Master (or PO if no SM)
**Status Check:** Daily standup + Day 5/8 formal checkpoints

---

#### RISK 3: Integration Breaks Existing Payment System

**Probability:** MEDIUM (30%)
**Impact:** CRITICAL (Production outage, payment calculation failures)
**Risk Score:** 30% × 10 = **3.0 (MEDIUM-HIGH)**

**Root Causes:**
- Modifying `computeSessionAmounts()` in `lib/payment.ts`
- Adding `venueId` to `CourtSessionDoc` (schema change)
- Pricing rule logic interfering with existing smash-weight calculations

**Mitigation Strategy:**

**BEFORE SPRINT:**
- ✅ Create feature branch for all Sprint 1 work (no direct commits to main)
- ✅ Set up staging environment with production data snapshot (anonymized)

**DURING SPRINT:**
- 🔄 Integration tests BEFORE modifying `computeSessionAmounts()` (baseline tests)
- 🔄 Regression test suite: 50+ existing sessions re-calculated → Verify 0 changes
- 🔄 Parallel run: New pricing engine vs old engine → Compare outputs (Day 7)

**AFTER SPRINT:**
- 📊 Canary deployment: Enable pricing rules for 10% of users first (Week 1 post-release)
- 📊 Monitor error rates: Alert if payment calculation errors >0.1%
- 📊 Rollback plan: Database migration rollback script ready

**Contingency Plan:**
If integration breaks production:
1. **IMMEDIATE:** Rollback deployment (git revert + deploy previous version)
2. **NEXT:** Disable new pricing features via feature flag
3. **ROOT CAUSE:** Postmortem within 48 hours

**Owner:** Tech Lead + QA Lead
**Status Check:** Day 7 (integration tests must be 100% passing)

---

### MEDIUM RISKS (Managed, not critical)

**RISK 4: Venue Data Model Insufficient for Future Needs**
**Mitigation:** Add `metadata` JSON field to `VenueDoc` for extensibility
**Owner:** Solution Architect

**RISK 5: UI/UX Confusion in Pricing Rules Manager**
**Mitigation:** User testing with 3 hosts before Sprint 1 demo (Day 9)
**Owner:** UX Designer (or Dev Team)

**RISK 6: Performance Degradation with 50+ Pricing Rules**
**Mitigation:** Load testing on Day 8 (simulate 100 rules + 50 concurrent imports)
**Owner:** Tech Lead

---

### LOW RISKS (Monitor only)

- MongoDB collection creation delays (estimated 1 hr)
- Third-party API downtime (none in Sprint 1)
- Team member illness (2-dev team has redundancy)

---

## 7. STAKEHOLDER ALIGNMENT

### Stakeholder Communication Plan

---

#### STAKEHOLDER 1: Club Hosts (Primary Users)

**Concerns:**
- "Will this break my existing data?"
- "Is this going to be complicated to set up?"
- "What if I make a mistake in pricing rules?"

**Alignment Strategy:**

**BEFORE SPRINT 1 (Week 0):**
- 📧 Email to top 10 hosts: "Coming soon: Multi-venue + dynamic pricing" (build anticipation)
- 📞 1-on-1 calls with 3 beta testers: Gather specific pricing scenarios (input for test cases)

**DURING SPRINT 1 (Weeks 1-2):**
- 📊 Weekly progress update (Friday): "We've completed venue management!" (screenshots included)
- 🎥 Video preview on Day 10: Screen recording of pricing rule creation (1 min video)

**AFTER SPRINT 1 (Week 3):**
- 📚 Documentation: "How to Set Up Dynamic Pricing" (step-by-step guide with screenshots)
- 🎓 Live webinar (optional): "Maximize Revenue with Dynamic Pricing" (60 min, recorded)
- 💬 Feedback survey: NPS score + open-ended feedback (2 weeks post-release)

**Success Metric:** 80% of hosts configure ≥1 pricing rule within 7 days

**Owner:** Product Marketing (or PO if no PMM)

---

#### STAKEHOLDER 2: Tech Lead / Engineering Manager

**Concerns:**
- "Is this technically sound?"
- "Are we introducing technical debt?"
- "Can we maintain this long-term?"

**Alignment Strategy:**

**BEFORE SPRINT 1:**
- 📋 Architecture review session (Day 0): Review `VenueDoc` + `PricingRuleDoc` schemas (30 min)
- ✅ Sign-off on database indexes and API design

**DURING SPRINT 1:**
- 🔄 Daily code reviews (within 24 hrs of PR submission)
- 🔄 Mid-sprint architecture check-in (Day 5): Review pricing engine implementation

**AFTER SPRINT 1:**
- 📊 Technical retrospective: Discuss tech debt introduced + mitigation plan
- 📚 Engineering documentation: ADR (Architecture Decision Record) for pricing rule engine

**Success Metric:** 0 critical tech debt items flagged in retrospective

**Owner:** PO (facilitate) + Tech Lead (execute)

---

#### STAKEHOLDER 3: C-Suite / Business Owner

**Concerns:**
- "Will this increase revenue?"
- "What's the ROI?"
- "Are we on track for the 12-week roadmap?"

**Alignment Strategy:**

**BEFORE SPRINT 1:**
- 📊 Business case presentation (5 slides): Revenue impact, competitive advantage, risk mitigation
- ✅ Budget approval: SendGrid subscription ($20/month)

**DURING SPRINT 1:**
- 📧 Weekly executive summary email (3 bullet points):
  - Progress: "Venue management 100% complete"
  - Risks: "Pricing engine on track, 70% confidence"
  - Next week: "Pricing rules UI + testing"

**AFTER SPRINT 1:**
- 📊 Sprint review demo (30 min): Live demo with real data
- 📈 Business metrics dashboard: Baseline metrics captured (pricing accuracy, time saved)

**Success Metric:** Executive approval to proceed with Sprint 2

**Owner:** PO

---

#### STAKEHOLDER 4: QA Engineer (if applicable)

**Concerns:**
- "How do I test this?"
- "What are the edge cases?"
- "Do we have enough test coverage?"

**Alignment Strategy:**

**BEFORE SPRINT 1:**
- 📋 Test plan review (Day 0): Share 20 test scenarios for pricing rules
- ✅ QA environment setup with test data

**DURING SPRINT 1:**
- 🔄 Daily QA handoff: Dev marks stories "ready for QA" (use Jira/Linear workflow)
- 🔄 Bug triage meetings (as needed): PO prioritizes bugs (P0 = block release, P1 = fix in Sprint 1, P2 = backlog)

**AFTER SPRINT 1:**
- 📊 QA summary report: Bugs found, test coverage %, release readiness score

**Success Metric:** ≥80% test coverage + 0 P0 bugs at release

**Owner:** QA Lead (or Dev Team if no QA)

---

### Stakeholder Email Template (Sprint 1 Kickoff)

**SUBJECT:** Sprint 1 Kickoff - SmashTour Dynamic Pricing (2026-06-22)

**TO:** Tech Team, Club Hosts (beta testers), Exec Team

**BODY:**

---

Hi Team,

We're kicking off Sprint 1 today - the foundation of SmashTour 2.0! Here's what you need to know:

**SPRINT GOAL**
"Enable multi-venue management and dynamic pricing to help hosts optimize revenue and eliminate manual calculation errors."

**WHAT WE'RE BUILDING**
1. ✅ Venue Management: Add/edit 5+ court venues with tracking
2. ✅ Time-Based Pricing: Weekend vs weekday, peak hour multipliers
3. ✅ Holiday Pricing: Special event rates (Lunar New Year, etc.)

**WHY IT MATTERS**
- Hosts save 100+ minutes/month on pricing admin
- 10-15% revenue increase through peak hour optimization
- Foundation for attendance polling (Sprint 2) and payment automation (Sprint 4)

**KEY DATES**
- Week 1 (Jun 22-28): Venue management + pricing engine core
- Week 2 (Jun 29-Jul 5): Pricing UI + testing
- Jul 5: Sprint review demo (all stakeholders invited)

**HOW YOU CAN HELP**
- **Hosts:** Share your pricing scenarios (reply to this email)
- **Tech Team:** Raise blockers ASAP (don't wait for standup)
- **Exec Team:** Approve SendGrid budget ($20/month) by Jun 23

**RISKS WE'RE WATCHING**
1. Pricing calculation accuracy (mitigation: 90% test coverage target)
2. Scope overcommitment (mitigation: descope holiday pricing if needed)
3. Integration with existing payment system (mitigation: regression tests)

**QUESTIONS?**
Reply to this email or ping me on Slack.

Let's ship something amazing!

[Your Name]
Product Owner, SmashTour

---

**P.S.** Want to be a beta tester? First 5 hosts to reply get early access + direct feedback line to the dev team.

---

### Escalation Path

**LEVEL 1 (Daily Issues):** Dev Team → Scrum Master/Tech Lead
**LEVEL 2 (Sprint at Risk):** Tech Lead → Product Owner
**LEVEL 3 (Business Impact):** Product Owner → Exec Team

**Escalation Triggers:**
- Sprint progress <40% by Day 5
- Critical bug blocking release
- Host feedback <3.5/5 NPS during beta testing

---

## 8. DEFINITION OF DONE (Sprint 1)

### Story-Level DoD (All 3 Stories)

**CODE QUALITY:**
- ✅ All TypeScript compilation errors resolved (0 errors)
- ✅ ESLint warnings addressed (<5 warnings allowed, 0 errors)
- ✅ Code reviewed and approved by ≥1 peer (GitHub PR review)
- ✅ No hardcoded values (use constants or environment variables)

**TESTING:**
- ✅ Unit test coverage ≥80% for new code (measured by Jest coverage report)
- ✅ E2E tests passing for critical paths (Playwright or Cypress)
- ✅ Manual QA completed on staging (test plan checklist signed off)
- ✅ Regression tests passing (existing payment calculations unchanged)

**FUNCTIONALITY:**
- ✅ All acceptance criteria met (as defined in user story)
- ✅ Mobile responsive (tested on iPhone Safari + Android Chrome)
- ✅ Accessibility audit passed (WCAG 2.1 AA - keyboard navigation, screen reader compatible)

**DOCUMENTATION:**
- ✅ API endpoints documented (OpenAPI/Swagger or README)
- ✅ User guide updated (Screenshots + step-by-step instructions)
- ✅ Code comments added for complex logic (rule priority algorithm, pricing calculations)
- ✅ Migration scripts tested (database schema changes)

**DEPLOYMENT:**
- ✅ Deployed to staging environment (verified working)
- ✅ Stakeholder demo completed (PO sign-off)
- ✅ Feedback incorporated (P0/P1 bugs fixed)
- ✅ Production deployment approved (PO + Tech Lead sign-off)

**DATA INTEGRITY:**
- ✅ Database migrations tested on production snapshot (rollback script available)
- ✅ Backward compatibility verified (existing sessions unaffected)
- ✅ Data validation rules enforced (no null venue names, pricing rules have valid date ranges)

---

### Sprint-Level DoD

**SPRINT 1 COMPLETE WHEN:**
- ✅ All MUST-HAVE stories (S1H.1, S1H.2A) are DONE
- ✅ Sprint goal achieved (venue management + core pricing working)
- ✅ Sprint review demo delivered (stakeholders satisfied)
- ✅ Retrospective completed (action items documented)
- ✅ Sprint 2 backlog refined (top 5 stories estimated)

**SPRINT 1 SUCCESS CRITERIA:**
- ✅ 0 P0 bugs in production post-release
- ✅ Host satisfaction ≥4/5 (beta tester survey)
- ✅ Pricing calculation accuracy = 100% (verified with 50 test sessions)
- ✅ Venue management adopted by ≥70% of hosts within 7 days

---

### Release Readiness Checklist

**PRE-RELEASE (Day 13):**
- [ ] All DoD items checked for S1H.1, S1H.2, S1H.3
- [ ] Security review completed (SQL injection, XSS, CSRF checks)
- [ ] Performance testing completed (load test: 50 concurrent users)
- [ ] Backup/restore procedure verified (database backup tested)
- [ ] Rollback plan documented (step-by-step instructions)

**RELEASE DAY (Day 14):**
- [ ] Deploy to production (Monday 6 AM local time - low traffic)
- [ ] Smoke test critical paths (venue creation, pricing rule application)
- [ ] Monitor error rates (first 2 hours - alert if >0.1% error rate)
- [ ] Send release announcement to all users (email + in-app notification)

**POST-RELEASE (Week 3):**
- [ ] Collect user feedback (survey + support tickets)
- [ ] Address urgent bugs (hotfix within 24 hours if P0)
- [ ] Measure success metrics (pricing rule adoption, revenue impact)
- [ ] Schedule retrospective (Week 3 Friday)

---

## 9. SPRINT EXECUTION TIMELINE

### Week 1 (2026-06-22 to 2026-06-28)

**DAY 1 (Monday) - SPRINT KICKOFF**
- 9:00 AM: Sprint planning meeting (2 hrs)
  - Review Sprint 1 goals, stories, acceptance criteria
  - Tech lead presents architecture overview
  - Team commits to scope
- 11:00 AM: Environment setup
  - Create database collections: `venues`, `pricing_rules`
  - Set up feature branch: `sprint-1/dynamic-pricing`
- 2:00 PM: Development starts
  - S1H.1: Database schema implementation
  - S1H.2: Pricing engine design (pseudocode + test cases)
- 5:00 PM: Daily standup
  - Blockers: None expected (kickoff day)

**DAY 2 (Tuesday) - API FOUNDATION**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.1: Venue CRUD API implementation (`/api/venues/index.ts`)
  - S1H.2: Pricing rule schema finalized, indexes created
- 2:00 PM: Code review
  - Venue API reviewed by Tech Lead
- 4:00 PM: Integration testing
  - S1H.1: Test venue creation/update/delete via Postman
- 5:00 PM: Daily standup
  - Risk check: Are we on track for 2.5 pts/day velocity?

**DAY 3 (Wednesday) - UI + CORE LOGIC**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.1: VenueManagementModal UI (React component)
  - S1H.2: `calculateCourtFee()` function (pair programming)
- 2:00 PM: **CRITICAL CHECKPOINT**
  - S1H.2: Pricing rule engine testable? (90% unit tests passing)
  - If NO: Escalate to PO + descope S1H.3
- 4:00 PM: UX review
  - S1H.1: Venue management UI reviewed with beta host
- 5:00 PM: Daily standup
  - Blockers: Report any issues with rule priority logic

**DAY 4 (Thursday) - INTEGRATION**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.1: Integrate venue selection into session import flow
  - S1H.2: Pricing rule CRUD API + UI
- 2:00 PM: Regression testing
  - S1H.1: Import 20 sessions with venue → Verify no breaks
- 4:00 PM: Code review
  - S1H.2: Pricing engine reviewed by Tech Lead
- 5:00 PM: Daily standup
  - Risk check: Is S1H.1 on track for completion by EOD Friday?

**DAY 5 (Friday) - WEEK 1 CHECKPOINT**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.1: Venue analytics view
  - S1H.2: PricingCalculator UI (if time permits)
- 2:00 PM: **MID-SPRINT REVIEW (1 hr)**
  - **AGENDA:**
    1. Demo: Show completed S1H.1 features
    2. Metrics: Review burndown (target: 50% complete)
    3. Risks: S1H.2 complexity - on track?
    4. Decision: Descope S1H.3 if <40% complete
  - **ATTENDEES:** Dev Team, PO, Tech Lead, 2 beta hosts
- 4:00 PM: Sprint 2 backlog grooming (1 hr)
  - Refine S2H.1 (Polling System) - ensure clarity
- 5:00 PM: Week 1 wrap-up
  - Deploy to staging (all Week 1 work)
  - Celebrate wins (S1H.1 complete!)

---

### Week 2 (2026-06-29 to 2026-07-05)

**DAY 6 (Monday) - PRICING RULES UI**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.2: PricingRulesManager UI (table view + add/edit forms)
  - S1H.3: Extend `PricingRuleDoc` for event types
- 2:00 PM: Manual testing
  - S1H.2: Create 5 pricing rules → Import sessions → Verify fees
- 4:00 PM: Bug triage
  - Review QA findings from Week 1 staging deploy
- 5:00 PM: Daily standup

**DAY 7 (Tuesday) - INTEGRATION COMPLETE**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.2: Session import applies pricing rules automatically
  - S1H.3: Event badge UI in session list
- 2:00 PM: **INTEGRATION TESTING**
  - Parallel run: New pricing vs old pricing (50 test sessions)
  - Verify: 0 discrepancies for sessions without pricing rules
- 4:00 PM: Code review
  - S1H.3: Event pricing logic reviewed
- 5:00 PM: Daily standup
  - Risk check: Are we on track for Sprint completion?

**DAY 8 (Wednesday) - TESTING FOCUS**
- 9:00 AM: Daily standup
- 10:00 AM: E2E testing
  - Playwright tests: Create venue → Create pricing rule → Import session → Verify fee
- 2:00 PM: Performance testing
  - Load 50 pricing rules → Import 20 sessions → Measure latency (<100ms)
- 4:00 PM: **DAY 8 CHECKPOINT**
  - S1H.1: 100% complete
  - S1H.2: 90% complete
  - S1H.3: 70% complete OR descoped
- 5:00 PM: Daily standup
  - Blockers: Any P0 bugs blocking release?

**DAY 9 (Thursday) - POLISH + DOCS**
- 9:00 AM: Daily standup
- 10:00 AM: Development
  - S1H.3: Overlapping rule strategy (multiply vs highest)
  - Bug fixes from E2E testing
- 2:00 PM: User testing
  - 3 beta hosts test pricing rule creation (target: <5 min)
- 4:00 PM: Documentation
  - Update user guide with pricing rule screenshots
  - API documentation (OpenAPI spec)
- 5:00 PM: Daily standup
  - Final push: What's blocking DONE status?

**DAY 10 (Friday) - SPRINT REVIEW**
- 9:00 AM: Daily standup (final)
- 10:00 AM: Final bug fixes
  - Address P1 bugs from user testing
- 12:00 PM: Deploy to staging (final build)
- 2:00 PM: **SPRINT REVIEW DEMO (1.5 hrs)**
  - **AGENDA:**
    1. Sprint goal recap (5 min)
    2. Live demo: Venue management + pricing rules (20 min)
    3. Metrics review: Test coverage, performance, adoption (10 min)
    4. Stakeholder feedback (30 min)
    5. Sprint 2 preview (5 min)
  - **ATTENDEES:** Dev Team, PO, Exec Team, 5 beta hosts, Tech Lead
- 4:00 PM: **RETROSPECTIVE (1.5 hrs)**
  - **FORMAT:** Start/Stop/Continue
  - **TOPICS:**
    - What went well? (S1H.1 completed early)
    - What didn't go well? (S1H.2 underestimated)
    - Action items for Sprint 2 (improve estimation, reduce WIP)
- 6:00 PM: Team celebration (optional - dinner/drinks)

---

### Week 3 (Post-Sprint) - RELEASE WEEK

**DAY 11 (Monday) - PRODUCTION DEPLOY**
- 6:00 AM: Deploy to production (low-traffic window)
- 7:00 AM: Smoke testing (verify critical paths working)
- 9:00 AM: Monitor error rates (first 2 hours)
- 10:00 AM: Send release announcement email
- 12:00 PM: Host webinar: "How to Use Dynamic Pricing" (optional)
- 5:00 PM: Daily monitoring summary (any issues?)

**DAY 12-14 (Tuesday-Thursday) - MONITORING**
- Daily: Monitor adoption metrics (pricing rule creation rate)
- Daily: Triage support tickets (tag as "pricing-related")
- Daily: Collect user feedback (survey responses)

**DAY 15 (Friday) - SPRINT 2 KICKOFF**
- 9:00 AM: Sprint 2 planning
- Review Sprint 1 learnings
- Commit to Sprint 2 scope (S2H.1, S2H.2, S2H.3)

---

## 10. DECISION LOG

### Critical Decisions Required

**DECISION 1: Sprint Scope - Option A or B?**
**Status:** ⚠️ PENDING
**Owner:** Product Owner
**Deadline:** 2026-06-23 EOD (Day 1)
**Options:**
- **A (Conservative):** S1H.1 (8) + S1H.2A (10) + defer S1H.3 to Sprint 2
- **B (Aggressive):** S1H.1 (8) + S1H.2 (13) + S1H.3 (5) with spillover risk

**Recommendation:** Option A (see Section 2 analysis)

**Decision Recorded:** [TO BE FILLED]

---

**DECISION 2: Pricing Rule Priority Strategy**
**Status:** ⚠️ PENDING
**Owner:** Product Owner + Tech Lead
**Deadline:** 2026-06-25 (Day 3)
**Options:**
- **A:** Highest multiplier wins (simple)
- **B:** Multiply overlapping rules (complex)
- **C:** Configurable per rule (flexible)

**Recommendation:** Option C (future-proof)

**Decision Recorded:** [TO BE FILLED]

---

**DECISION 3: Venue Data Backfill for Legacy Sessions**
**Status:** ⚠️ PENDING
**Owner:** Product Owner
**Deadline:** 2026-06-27 (Day 5)
**Options:**
- **A:** Leave `venueId: null` for old sessions (RECOMMENDED)
- **B:** Backfill with "Default Venue" (extra 4 hrs)

**Recommendation:** Option A (avoid migration risk)

**Decision Recorded:** [TO BE FILLED]

---

**DECISION 4: Email Service Provider**
**Status:** ⚠️ PENDING
**Owner:** Product Owner
**Deadline:** 2026-06-23 (Day 1)
**Options:**
- SendGrid ($20/month, 10k emails)
- AWS SES ($0.10/1k emails, more setup)
- SMTP (self-hosted, complex)

**Recommendation:** SendGrid (Sprint 2 dependency)

**Decision Recorded:** [TO BE FILLED]

---

### Decisions Made

**DECISION 5: Database Collections Naming**
**Status:** ✅ APPROVED
**Owner:** Tech Lead
**Date:** 2026-06-22
**Decision:** Use plural names (`venues`, `pricing_rules`) to match existing convention (`players`, `court_sessions`)

---

**DECISION 6: Pricing Calculation Precision**
**Status:** ✅ APPROVED
**Owner:** Tech Lead
**Date:** 2026-06-22
**Decision:** Maintain 2 decimal places for VND amounts (existing standard), round to nearest 1,000 VND for display

---

## 11. APPENDIX

### A. Test Scenarios for Pricing Rules

**SCENARIO 1: Basic Weekend Pricing**
**Input:** Saturday session, 2 hours, base rate 200,000 VND/hr
**Rule:** Weekend = 1.5x multiplier
**Expected:** Court fee = 200,000 × 2 × 1.5 = 600,000 VND

**SCENARIO 2: Overlapping Rules (Weekend + Peak Hour)**
**Input:** Saturday 7 PM session, 2 hours, base rate 200,000 VND/hr
**Rule 1:** Weekend = 1.5x
**Rule 2:** Peak hour (6-9 PM) = 1.3x
**Expected (Multiply):** 200,000 × 2 × 1.5 × 1.3 = 780,000 VND
**Expected (Highest):** 200,000 × 2 × 1.5 = 600,000 VND

**SCENARIO 3: Holiday Pricing**
**Input:** Lunar New Year (Feb 10, 2026), 2 hours, base rate 200,000 VND/hr
**Rule:** Tet Holiday = 2.0x
**Expected:** 200,000 × 2 × 2.0 = 800,000 VND

**SCENARIO 4: Venue-Specific Pricing**
**Input:** Premium venue, Friday 8 PM, 2 hours, base rate 250,000 VND/hr
**Rule 1 (All venues):** Friday evening = 1.2x
**Rule 2 (Premium venue only):** Premium surcharge = 1.3x
**Expected (Most specific wins):** 250,000 × 2 × 1.3 = 650,000 VND

**SCENARIO 5: Edge Case - 0 Players**
**Input:** Session with 0 players
**Expected:** Error: "Session must have at least one player"

**SCENARIO 6: Edge Case - Negative Fee**
**Input:** Court fee = -100,000 VND
**Expected:** Error: "Court fee must be non-negative"

... (15 more test scenarios to reach 20 total)

---

### B. API Endpoint Reference

**VENUE MANAGEMENT**

```typescript
// GET /api/venues
// Returns: Array<VenueDoc>
// Auth: Admin required

// POST /api/venues
// Body: { name, address?, courtCount, baseHourlyRate, facilities?, contactPerson?, contactPhone?, notes? }
// Returns: VenueDoc
// Auth: Admin required

// GET /api/venues/:id
// Returns: VenueDoc
// Auth: Admin required

// PATCH /api/venues/:id
// Body: Partial<VenueDoc>
// Returns: VenueDoc
// Auth: Admin required

// DELETE /api/venues/:id
// Soft delete: Sets active = false
// Returns: { success: true }
// Auth: Admin required
```

**PRICING RULES**

```typescript
// GET /api/pricing-rules
// Query: ?venueId=xxx (optional filter)
// Returns: Array<PricingRuleDoc>
// Auth: Admin required

// POST /api/pricing-rules
// Body: { venueId?, ruleName, daysOfWeek?, timeStart?, timeEnd?, dateStart?, dateEnd?, rateType, rateValue, priority, active }
// Returns: PricingRuleDoc
// Auth: Admin required

// POST /api/pricing-rules/calculate
// Body: { venueId?, sessionDate, timeStart?, duration?, baseRate? }
// Returns: PricingCalculationResult
// Auth: Admin required (testing endpoint)
```

---

### C. Database Schema Reference

See detailed schemas in `/Users/tiennguyenthanh/Desktop/Work/blockblast/badminton/scratch/SPRINT_BACKLOG_ENHANCED.md` (Lines 88-263)

---

### D. Glossary

- **RICE Score:** Reach × Impact × Confidence / Effort (prioritization framework)
- **Dynamic Pricing:** Automatic price adjustment based on time/date/venue
- **Pricing Rule:** Configuration defining when/how to adjust base rates
- **Venue Utilization:** Percentage of time a venue is booked (sessions/total available hours)
- **Peak Hour:** High-demand time slots (typically 6-9 PM weekdays, all day weekends)
- **VND:** Vietnamese Dong (currency)

---

### E. Contact Information

**Product Owner:** [Your Name]
**Email:** [your.email@smashtour.app]
**Slack:** @[yourhandle]
**Availability:** Mon-Fri 9 AM - 6 PM ICT (GMT+7)

**Tech Lead:** [Name]
**Email:** [email]
**Escalation:** For sprint-blocking issues only

**Scrum Master:** [Name] (if applicable)

---

## SIGN-OFF

**Product Owner Approval:**
Name: ___________________
Signature: ___________________
Date: ___________________

**Tech Lead Approval:**
Name: ___________________
Signature: ___________________
Date: ___________________

**Sprint 1 Kickoff Confirmed:** ⬜ YES  ⬜ NO (pending decisions)

---

**Document Version:** 1.0
**Last Updated:** 2026-06-22
**Next Review:** 2026-06-27 (Day 5 Checkpoint)

---

**END OF SPRINT 1 EXECUTION PLAN**

Let's transform badminton club management - one sprint at a time. 🏸💪
