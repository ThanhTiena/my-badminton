# SmashTour Enhanced Sprint Backlog
**Business Analyst & Product Owner Deliverable**
**Date Created:** 2026-06-22
**Version:** 2.0 - HIGHEST PRIORITY HOST FEATURES ADDED
**Planning Horizon:** 6 Sprints (12 weeks)

---

## 🚨 IMPORTANT: PRIORITY UPDATE

This document enhances the existing sprint backlog with **HIGHEST PRIORITY** features focused on **better supporting hosts** in badminton club management. These features address critical pain points in:

- Dynamic Pricing Management
- Attendance & Polling
- Member Management
- Payment Automation
- Court Allocation
- Shuttlecock Inventory

**These new epics take priority over the existing technical debt work and will be scheduled in Sprints 1-6.**

---

## Executive Summary - New Host Support Features

### Strategic Imperatives (Updated)
1. **🎯 Host Efficiency** - Reduce admin workload by 60% through automation
2. **💰 Cash Flow** - Improve payment collection rate from 75% to 95%
3. **👥 Member Retention** - Increase active player retention by 40%
4. **📊 Data-Driven Decisions** - Provide actionable insights for court booking & pricing

### Business Value (New Features)
- **ROI:** 3:1 return within 3 months
- **Host Time Saved:** 15 hours/week → 6 hours/week (60% reduction)
- **Payment Collection:** 75% → 95% (+20 percentage points)
- **Player Engagement:** 65% attendance → 85% attendance (+20 pp)
- **Revenue Optimization:** +15% through dynamic pricing

---

# NEW EPIC 1: Dynamic Pricing & Multi-Venue Management
**Business Objective:** Enable hosts to manage complex pricing scenarios across multiple venues and time slots.

**Success Metrics:**
- Pricing configuration time reduced from 30 min to 5 min per change
- Pricing accuracy: 100% (vs 85% with manual calculation)
- Support for 5+ venues, 20+ pricing rules
- Revenue increase of 10-15% through optimized pricing

**Story Points:** 34 (Sprint 1 & 2)

---

## S1H.1: Create Venue Management System
**Priority:** 🔴 HIGHEST - MUST HAVE
**Story Points:** 8
**Sprint:** 1

### User Story
**As a** club host managing multiple court venues,
**I want to** configure venue details with different pricing structures,
**So that** I can accurately track costs and split payments across different locations.

### Acceptance Criteria
```gherkin
GIVEN I am logged in as admin
WHEN I navigate to Settings > Venues
THEN I see a list of all configured venues
AND I can add a new venue with name, address, court count, base rates

GIVEN I am adding a new venue
WHEN I fill in venue details (name, address, court count, base hourly rate)
THEN the venue is saved to the database
AND appears in the venue selection dropdown for session imports

GIVEN I have multiple venues configured
WHEN I import a court session
THEN I can select which venue the session was held at
AND the session stores the venue ID for tracking

GIVEN I want to see venue utilization
WHEN I view Analytics > Venues
THEN I see total sessions, total cost, avg cost per session per venue
```

### Technical Implementation

**Database Schema:**
```typescript
// lib/models.ts - Add new interface
export interface VenueDoc {
  _id?: ObjectId;
  name: string;                      // "Sunrise Sports Complex"
  address?: string;                  // "123 Main St, District 1"
  courtCount: number;                // Number of available courts
  baseHourlyRate: number;            // Default rate per hour (VND)
  facilities?: string[];             // ["Parking", "Shower", "Lockers"]
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  active: boolean;                   // Soft delete flag
  createdAt: Date;
  updatedAt: Date;
}

// Update CourtSessionDoc to include venue reference
export interface CourtSessionDoc {
  // ... existing fields
  venueId?: ObjectId;                // Reference to VenueDoc
  venueName?: string;                // Snapshot of venue name at session time
  // ... rest of existing fields
}
```

**Files to create:**
- `/pages/api/venues/index.ts` - GET (list), POST (create), DELETE (soft delete)
- `/pages/api/venues/[id].ts` - GET (single), PATCH (update), DELETE
- `/components/venues/VenueManagementModal.tsx` - UI for CRUD operations
- `/components/venues/VenueCard.tsx` - Display venue details

**Files to modify:**
- `/lib/db/constants.ts` - Add `VENUES: 'venues'` to collections
- `/lib/db/indexes.ts` - Add index for `{ name: 1 }, { unique: true }`
- `/pages/index.tsx` - Add "Venues" menu item in Settings
- `/pages/api/payment/sessions/index.ts` - Update import to accept `venueId`

**API Endpoints:**
```
GET    /api/venues              → List all active venues
POST   /api/venues              → Create new venue
GET    /api/venues/:id          → Get single venue
PATCH  /api/venues/:id          → Update venue
DELETE /api/venues/:id          → Soft delete (set active: false)
GET    /api/analytics/venues    → Venue utilization stats
```

### Definition of Done
- [ ] `venues` collection created in MongoDB
- [ ] CRUD API endpoints implemented and tested
- [ ] VenueManagementModal UI completed with form validation
- [ ] Venue selection dropdown added to session import flow
- [ ] CourtSessionDoc includes venueId field
- [ ] Analytics screen shows venue utilization breakdown
- [ ] Unit tests for venue CRUD operations (>80% coverage)
- [ ] E2E test: Create venue → Import session with venue → View analytics
- [ ] Mobile responsive venue management UI
- [ ] Code review approved
- [ ] Deployed to staging

---

## S1H.2: Implement Time-Based Pricing Rules
**Priority:** 🔴 HIGHEST - MUST HAVE
**Story Points:** 13
**Sprint:** 1-2

### User Story
**As a** club host,
**I want to** configure different court rental rates based on day of week and time slot,
**So that** I can reflect peak vs off-peak pricing and automatically calculate session costs.

### Acceptance Criteria
```gherkin
GIVEN I am configuring pricing rules
WHEN I navigate to Settings > Pricing Rules
THEN I see a list of all active pricing rules
AND I can add a new rule with: venue, day pattern, time range, rate multiplier

GIVEN I create a pricing rule for "Weekends, 6-9 PM, 1.5x rate"
WHEN I import a session held on Saturday at 7 PM
THEN the court fee is automatically calculated as base rate × 1.5 × hours
AND the pricing rule used is displayed in session details

GIVEN I have overlapping pricing rules
WHEN calculating session cost
THEN the most specific rule wins (venue + time > day only > default)
AND the system shows which rule was applied

GIVEN I want to test pricing before applying
WHEN I use the pricing calculator
THEN I enter date, time, venue, hours
AND I see the calculated cost with rule breakdown
```

### Technical Implementation

**Database Schema:**
```typescript
// lib/models.ts - Add new interface
export interface PricingRuleDoc {
  _id?: ObjectId;
  venueId?: ObjectId;                  // Null = applies to all venues
  venueName?: string;                  // Snapshot
  ruleName: string;                    // "Weekend Peak Hours"

  // Day pattern (ISO weekday: 1=Mon, 7=Sun)
  daysOfWeek?: number[];               // [6, 7] = Sat/Sun, null = all days

  // Time range (24h format)
  timeStart?: string;                  // "18:00" (6 PM), null = all day
  timeEnd?: string;                    // "21:00" (9 PM)

  // Date range (for seasonal pricing)
  dateStart?: string;                  // "2026-06-01" (summer pricing)
  dateEnd?: string;                    // "2026-08-31"

  // Pricing
  rateType: 'multiplier' | 'fixed';    // Multiplier or fixed override
  rateValue: number;                   // 1.5 (50% more) or 200000 (VND fixed)

  // Priority (higher = more specific, wins on overlap)
  priority: number;                    // 100 = very specific, 1 = general

  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Add to CourtSessionDoc
export interface CourtSessionDoc {
  // ... existing fields
  pricingRuleId?: ObjectId;            // Which rule was applied
  pricingRuleName?: string;            // Snapshot of rule name
  pricingRateApplied?: number;         // e.g., 1.5 or fixed rate
  baseCourtFee?: number;               // Before rule applied
  // ... rest of fields
}
```

**Pricing Calculation Logic:**
```typescript
// lib/pricing.ts (new file)

export interface PricingCalculationInput {
  venueId?: string;
  sessionDate: string;    // "2026-06-22"
  timeStart?: string;     // "18:30"
  duration?: number;      // hours
  baseRate?: number;      // per hour VND (from venue or default)
}

export interface PricingCalculationResult {
  baseCourtFee: number;
  appliedRule: PricingRuleDoc | null;
  finalCourtFee: number;
  breakdown: {
    base: number;
    rule: string;
    multiplier: number;
    final: number;
  };
}

export async function calculateCourtFee(
  input: PricingCalculationInput
): Promise<PricingCalculationResult> {
  // 1. Fetch all active pricing rules
  // 2. Filter rules matching venue, day, time, date range
  // 3. Sort by priority (descending)
  // 4. Apply highest priority rule
  // 5. Return calculation breakdown
}
```

**Files to create:**
- `/pages/api/pricing-rules/index.ts` - CRUD for pricing rules
- `/pages/api/pricing-rules/calculate.ts` - POST endpoint for cost calculation
- `/lib/pricing.ts` - Core pricing calculation logic (pure functions)
- `/components/pricing/PricingRulesManager.tsx` - UI for managing rules
- `/components/pricing/PricingCalculator.tsx` - Test pricing before import
- `/components/pricing/PricingRuleForm.tsx` - Add/edit rule form

**Files to modify:**
- `/lib/db/constants.ts` - Add `PRICING_RULES: 'pricing_rules'`
- `/lib/payment.ts` - Update `computeSessionAmounts` to use pricing rules
- `/pages/api/payment/sessions/index.ts` - Apply pricing rules during import
- `/pages/index.tsx` - Add Settings > Pricing Rules menu

**API Endpoints:**
```
GET    /api/pricing-rules           → List all rules
POST   /api/pricing-rules           → Create rule
PATCH  /api/pricing-rules/:id       → Update rule
DELETE /api/pricing-rules/:id       → Delete rule
POST   /api/pricing-rules/calculate → Calculate price (test endpoint)
```

### Definition of Done
- [ ] `pricing_rules` collection created with indexes
- [ ] `calculateCourtFee()` function with unit tests (>90% coverage)
- [ ] CRUD API for pricing rules implemented
- [ ] PricingRulesManager UI with table view
- [ ] PricingCalculator tool for testing rates
- [ ] Rule priority system working correctly (most specific wins)
- [ ] Session import applies pricing rules automatically
- [ ] Session details show which rule was applied
- [ ] Documentation: How to create pricing rules (examples)
- [ ] E2E test: Create rule → Import session → Verify correct fee calculated
- [ ] Performance: Rule evaluation <50ms for 100+ rules
- [ ] Code review approved
- [ ] Deployed to staging

---

## S1H.3: Add Holiday/Special Event Pricing
**Priority:** 🟠 HIGH - SHOULD HAVE
**Story Points:** 5
**Sprint:** 2

### User Story
**As a** club host,
**I want to** configure special pricing for holidays and events,
**So that** I can charge appropriately during high-demand periods.

### Acceptance Criteria
```gherkin
GIVEN I want to configure Lunar New Year pricing
WHEN I create a special event pricing rule
THEN I specify: event name, date range, rate multiplier, applies to which venues
AND the rule shows in the pricing rules list with "Special Event" badge

GIVEN a session falls on a holiday
WHEN importing or viewing the session
THEN the special event pricing is applied
AND the session shows a "🎉 Special Event" badge
AND players see why the fee is higher

GIVEN I have both time-based and event-based rules
WHEN they overlap (e.g., Sat evening + Holiday)
THEN the system combines multipliers (e.g., 1.5 × 1.3 = 1.95x)
OR uses the higher of the two (configurable)
```

### Technical Implementation

**Extend PricingRuleDoc:**
```typescript
export interface PricingRuleDoc {
  // ... existing fields
  ruleType: 'time_based' | 'special_event' | 'seasonal';
  eventName?: string;                  // "Lunar New Year 2026"
  eventIcon?: string;                  // "🎉" or "🎊"
  combinationStrategy?: 'multiply' | 'highest' | 'additive';
  // ... rest of fields
}
```

**Files to modify:**
- `/lib/pricing.ts` - Update `calculateCourtFee` to handle overlapping rules
- `/components/pricing/PricingRuleForm.tsx` - Add "Special Event" rule type
- `/pages/api/payment/sessions/index.ts` - Display event badge in UI

### Definition of Done
- [ ] Special event pricing rules can be created
- [ ] Overlapping rules handled correctly (multiply/highest/additive)
- [ ] Event badge shows in session list
- [ ] Players see event name in payment details
- [ ] Unit tests for overlapping rule scenarios
- [ ] E2E test: Create holiday rule → Import session → Verify multiplier applied
- [ ] Code review approved

---

# NEW EPIC 2: Automated Attendance Polling System
**Business Objective:** Reduce no-shows, improve court booking accuracy, and save host 5+ hours/week on attendance coordination.

**Success Metrics:**
- Attendance confirmation rate: 30% → 85%
- No-show rate: 20% → <5%
- Time spent on attendance coordination: 5 hrs/week → 0.5 hrs/week
- Court booking accuracy: +40% (book correct number of courts)

**Story Points:** 31 (Sprint 2-3)

---

## S2H.1: Create Polling System Foundation
**Priority:** 🔴 HIGHEST - MUST HAVE
**Story Points:** 8
**Sprint:** 2

### User Story
**As a** club host,
**I want to** create attendance polls for upcoming sessions,
**So that** I know how many courts to book and which players will attend.

### Acceptance Criteria
```gherkin
GIVEN I am planning next week's sessions
WHEN I navigate to Attendance > Create Poll
THEN I can create a poll with: date, time, venue, RSVP deadline, max players
AND I can select which players to include (All Active, Pro Only, Custom List)

GIVEN a poll is created
WHEN players navigate to the poll link
THEN they see session details and Yes/No/Maybe options
AND they can add a note (e.g., "Bringing +1 guest")
AND they see current RSVP count and who's attending

GIVEN I am a player
WHEN I RSVP "Yes" to a poll
THEN my response is saved immediately
AND I receive a confirmation message
AND I can change my response until the deadline

GIVEN the RSVP deadline passes
WHEN I view the poll
THEN responses are locked (players cannot change)
AND I see final attendance count with player names
```

### Technical Implementation

**Database Schema:**
```typescript
// lib/models.ts - Add new interfaces

export interface SessionPollDoc {
  _id?: ObjectId;
  sessionDate: string;                 // "2026-06-25"
  sessionTime?: string;                // "18:00-20:00"
  venueId?: ObjectId;
  venueName?: string;

  // Poll settings
  pollTitle: string;                   // "Wednesday Evening Session"
  pollDescription?: string;
  rsvpDeadline: Date;                  // ISO timestamp
  maxPlayers?: number;                 // null = unlimited

  // Player targeting
  targetPlayers: 'all_active' | 'pro_only' | 'beg_only' | 'custom';
  customPlayerIds?: ObjectId[];        // If targetPlayers = 'custom'

  // Status
  status: 'draft' | 'open' | 'closed' | 'cancelled';

  // Timestamps
  createdBy: string;                   // Admin username
  createdAt: Date;
  publishedAt?: Date;
  closedAt?: Date;
}

export interface PollResponseDoc {
  _id?: ObjectId;
  pollId: ObjectId;

  // Player info
  playerId: ObjectId;
  playerName: string;                  // Snapshot

  // Response
  response: 'yes' | 'no' | 'maybe';
  guestCount?: number;                 // +1, +2 guests
  note?: string;                       // "Will be 15 min late"

  // Timestamps
  respondedAt: Date;
  updatedAt?: Date;
}
```

**Files to create:**
- `/pages/api/polls/index.ts` - GET (list), POST (create)
- `/pages/api/polls/[id].ts` - GET, PATCH, DELETE
- `/pages/api/polls/[id]/responses.ts` - GET (responses), POST (submit RSVP)
- `/pages/poll/[id].tsx` - Public poll page (no login required)
- `/components/polls/PollCreationModal.tsx` - Create new poll
- `/components/polls/PollResponseForm.tsx` - Player RSVP form
- `/components/polls/PollSummary.tsx` - Show current RSVPs

**Files to modify:**
- `/lib/db/constants.ts` - Add `POLLS: 'session_polls', POLL_RESPONSES: 'poll_responses'`
- `/pages/index.tsx` - Add "Attendance" menu item

**API Endpoints:**
```
GET    /api/polls                    → List all polls (admin)
POST   /api/polls                    → Create poll (admin)
GET    /api/polls/:id                → Get single poll (public)
PATCH  /api/polls/:id                → Update poll (admin)
DELETE /api/polls/:id                → Delete poll (admin)
GET    /api/polls/:id/responses      → Get all responses (admin)
POST   /api/polls/:id/responses      → Submit RSVP (player)
PATCH  /api/polls/:id/responses/:rid → Update RSVP (player, before deadline)
```

### Definition of Done
- [ ] `session_polls` and `poll_responses` collections created
- [ ] Poll CRUD API implemented with auth checks
- [ ] Public poll page at `/poll/[id]` accessible without login
- [ ] PollCreationModal with player selection
- [ ] Players can RSVP with Yes/No/Maybe
- [ ] Real-time RSVP count updates on poll page
- [ ] RSVP locked after deadline
- [ ] Admin can view all responses in table format
- [ ] Mobile responsive poll UI
- [ ] E2E test: Create poll → Player RSVPs → Admin views responses
- [ ] Code review approved
- [ ] Deployed to staging

---

## S2H.2: Implement Poll Notifications
**Priority:** 🔴 HIGHEST - MUST HAVE
**Story Points:** 8
**Sprint:** 2

### User Story
**As a** club host,
**I want to** automatically notify players when a new poll is created,
**So that** I don't have to manually message everyone and get faster responses.

### Acceptance Criteria
```gherkin
GIVEN I create a new attendance poll
WHEN I click "Publish & Notify"
THEN all targeted players receive a notification
AND the notification includes: poll link, session details, deadline
AND I see confirmation "Notifications sent to 25 players"

GIVEN a player receives a poll notification
WHEN they click the link
THEN they land directly on the poll page
AND they can RSVP in 1 click

GIVEN the RSVP deadline is 24 hours away
WHEN the reminder job runs
THEN players who haven't responded receive a reminder notification
AND the notification says "24 hours left to RSVP"

GIVEN a player changes their RSVP from Yes to No
WHEN the update is saved
THEN the host receives a notification of the change
AND the notification shows old response → new response
```

### Technical Implementation

**Notification Channels (Phase 1):**
- Email (using existing email infrastructure or SendGrid)
- In-app notification badge (future: Web Push)

**Database Schema:**
```typescript
// lib/models.ts - Add notification tracking

export interface NotificationDoc {
  _id?: ObjectId;
  type: 'poll_created' | 'poll_reminder' | 'poll_response_changed' | 'poll_closed';
  recipientId: ObjectId;               // Player or admin
  recipientName: string;

  // Notification content
  title: string;                       // "New session poll for Wednesday"
  message: string;
  linkUrl?: string;                    // "/poll/abc123"

  // Metadata
  pollId?: ObjectId;

  // Status
  read: boolean;
  sentAt: Date;
  readAt?: Date;
}

// Add to PlayerDoc
export interface PlayerDoc {
  // ... existing fields
  notificationPreferences?: {
    email: boolean;                    // default true
    sms: boolean;                      // default false (future)
    inApp: boolean;                    // default true
  };
}
```

**Files to create:**
- `/pages/api/notifications/index.ts` - GET (my notifications)
- `/pages/api/notifications/[id]/read.ts` - PATCH (mark as read)
- `/lib/notifications/email.ts` - Email sending logic
- `/lib/notifications/templates.ts` - Email templates
- `/components/notifications/NotificationBell.tsx` - Header icon with badge

**Files to modify:**
- `/pages/api/polls/[id].ts` - Add `publishAndNotify()` action
- `/lib/db/constants.ts` - Add `NOTIFICATIONS: 'notifications'`

**Email Template Example:**
```html
Subject: 🏸 RSVP for Wednesday Badminton Session

Hi Alice,

A new session has been scheduled:
📅 Date: Wednesday, June 25, 2026
🕐 Time: 6:00 PM - 8:00 PM
📍 Venue: Sunrise Sports Complex
⏰ RSVP by: Tuesday, June 24, 11:59 PM

[Click here to RSVP: https://smashtour.app/poll/abc123]

Current RSVPs: 18/30 players

See you on court!
SmashTour
```

**Reminder Cron Job:**
```typescript
// pages/api/cron/poll-reminders.ts
// Runs daily at 10 AM
// Sends reminders for polls with deadline in 24 hours
```

### Definition of Done
- [ ] `notifications` collection created
- [ ] Email sending integrated (SendGrid or SMTP)
- [ ] Email templates created for poll events
- [ ] "Publish & Notify" button in poll creation flow
- [ ] Notification sent to targeted players on publish
- [ ] 24-hour reminder cron job implemented
- [ ] Host receives notification when player changes RSVP
- [ ] In-app notification bell shows unread count
- [ ] Players can view notification history
- [ ] Player notification preferences saved
- [ ] E2E test: Publish poll → Verify email sent → Check notification received
- [ ] Code review approved
- [ ] Deployed to staging

---

## S2H.3: Add Automatic Court Booking Suggestion
**Priority:** 🟠 HIGH - SHOULD HAVE
**Story Points:** 5
**Sprint:** 3

### User Story
**As a** club host,
**I want to** see a suggested number of courts to book based on poll responses,
**So that** I don't over-book or under-book and optimize court usage.

### Acceptance Criteria
```gherkin
GIVEN a poll has 24 "Yes" responses
WHEN I view the poll summary
THEN I see "Suggested Courts: 3" (assuming 4 players per court doubles)
AND the calculation shows: 24 players ÷ 4 per court = 6 courts needed

GIVEN the venue only has 4 courts available
WHEN the suggestion shows "6 courts needed"
THEN I see a warning "⚠️ Venue only has 4 courts - consider split sessions"

GIVEN I want to customize court capacity
WHEN I configure Settings > Session Defaults
THEN I can set default players per court (e.g., 8 for rotation)
AND this is used in court count calculations
```

### Technical Implementation

**Add to SessionPollDoc:**
```typescript
export interface SessionPollDoc {
  // ... existing fields
  playersPerCourt: number;             // Default 4 (doubles), 2 (singles)

  // Computed fields (updated when responses change)
  yesCount: number;
  maybeCount: number;
  noCount: number;
  suggestedCourtCount: number;         // Math.ceil((yesCount + guestCount) / playersPerCourt)
}
```

**Files to modify:**
- `/pages/api/polls/[id]/responses.ts` - Recalculate suggestedCourtCount on RSVP
- `/components/polls/PollSummary.tsx` - Display suggestion with icon
- `/pages/api/polls/[id].ts` - Include venue court count in response

### Definition of Done
- [ ] Court suggestion calculated automatically on new RSVP
- [ ] PollSummary shows suggested court count with calculation breakdown
- [ ] Warning shown if suggestion exceeds venue capacity
- [ ] Players per court configurable in poll creation
- [ ] Unit tests for court calculation edge cases (0 players, odd numbers, etc.)
- [ ] Code review approved

---

## S2H.4: Poll Analytics Dashboard
**Priority:** 🟡 MEDIUM - COULD HAVE
**Story Points:** 5
**Sprint:** 3

### User Story
**As a** club host,
**I want to** see analytics on poll response rates and player attendance trends,
**So that** I can identify reliable players and improve future planning.

### Acceptance Criteria
```gherkin
GIVEN I navigate to Analytics > Attendance
WHEN the page loads
THEN I see metrics: avg response rate, avg attendance rate, no-show rate
AND I see a chart of attendance over last 12 weeks

GIVEN I want to see player reliability
WHEN I view the Player Reliability table
THEN I see each player with: polls invited, response rate, attendance rate, no-show count
AND I can sort by any column

GIVEN I select a specific player
WHEN I click their name
THEN I see their attendance history (all polls, responses, actual attendance)
```

### Technical Implementation

**Files to create:**
- `/pages/api/analytics/attendance.ts` - GET attendance metrics
- `/components/analytics/AttendanceDashboard.tsx` - Dashboard UI
- `/components/analytics/PlayerReliabilityTable.tsx` - Player stats table

**Metrics to Calculate:**
```typescript
interface AttendanceMetrics {
  avgResponseRate: number;             // % of players who respond to polls
  avgYesRate: number;                  // % who say Yes
  noShowRate: number;                  // % who said Yes but didn't attend
  mostReliablePlayers: {
    name: string;
    responseRate: number;
    attendanceRate: number;
  }[];
}
```

### Definition of Done
- [ ] Attendance analytics API endpoint created
- [ ] Dashboard shows key metrics with charts
- [ ] Player reliability table sortable and filterable
- [ ] Historical attendance chart (last 12 weeks)
- [ ] Mobile responsive dashboard
- [ ] Code review approved

---

# NEW EPIC 3: Smart Member Management
**Business Objective:** Improve member retention, track engagement, and provide better player experience through organized membership.

**Success Metrics:**
- Member retention rate: 70% → 90% (+20 pp)
- Inactive member identification: automated (vs manual)
- Member onboarding time: 20 min → 5 min
- Player satisfaction score: +25%

**Story Points:** 26 (Sprint 3-4)

---

## S3H.1: Implement Membership Tiers
**Priority:** 🔴 HIGHEST - MUST HAVE
**Story Points:** 8
**Sprint:** 3

### User Story
**As a** club host,
**I want to** categorize members into tiers (Regular, Trial, Guest, VIP),
**So that** I can apply different policies, pricing, and access rights per tier.

### Acceptance Criteria
```gherkin
GIVEN I am managing player roster
WHEN I edit a player
THEN I can assign a membership tier: Regular, Trial, Guest, VIP
AND I can set tier expiration date (e.g., Trial expires after 3 sessions)

GIVEN a player has membership tier "Trial"
WHEN I view their profile
THEN I see their tier badge and expiration date
AND I see progress: "2/3 trial sessions used"

GIVEN I want to configure tier benefits
WHEN I navigate to Settings > Membership Tiers
THEN I can set per-tier: payment discount, priority booking, max sessions/month

GIVEN a trial member has attended 3 sessions
WHEN I view their profile
THEN I see a notification "Trial period ending - convert to Regular?"
AND I can click "Convert to Regular Member"
```

### Technical Implementation

**Database Schema:**
```typescript
// lib/models.ts - Update PlayerDoc

export type MembershipTier = 'guest' | 'trial' | 'regular' | 'vip';

export interface MembershipInfo {
  tier: MembershipTier;
  tierStartDate: Date;
  tierExpiryDate?: Date;               // For trial, guest

  // Trial tracking
  trialSessionsUsed?: number;
  trialSessionsLimit?: number;         // e.g., 3 free sessions

  // Benefits (can be tier-specific)
  paymentDiscount?: number;            // e.g., 0.1 = 10% off
  priorityBooking?: boolean;
  maxSessionsPerMonth?: number;        // e.g., 12 for regular, unlimited for VIP
}

export interface PlayerDoc {
  // ... existing fields
  membership: MembershipInfo;
  membershipHistory?: {
    tier: MembershipTier;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }[];
  // ... rest of fields
}

export interface MembershipTierConfigDoc {
  _id?: ObjectId;
  tier: MembershipTier;
  tierName: string;                    // Display name
  tierIcon: string;                    // "⭐", "🎖️", "👤", "🎯"
  tierColor: string;                   // CSS color

  // Benefits
  paymentDiscount: number;             // 0-1 (e.g., 0.15 = 15% off)
  priorityBooking: boolean;
  maxSessionsPerMonth: number;         // 0 = unlimited

  // Trial-specific
  trialSessionsLimit?: number;

  // Auto-promotion rules
  autoPromoteAfterSessions?: number;   // Trial → Regular after N sessions
  autoPromoteAfterDays?: number;

  active: boolean;
  updatedAt: Date;
}
```

**Files to create:**
- `/pages/api/membership-tiers/index.ts` - GET, POST, PATCH tier configs
- `/components/membership/TierBadge.tsx` - Display tier with icon
- `/components/membership/MembershipEditor.tsx` - Edit player tier
- `/components/membership/TierConfigModal.tsx` - Configure tier settings
- `/components/membership/TrialProgressBar.tsx` - Show trial progress

**Files to modify:**
- `/pages/api/players/index.ts` - Include membership in player creation
- `/pages/api/players/[id].ts` - Update membership tier endpoint
- `/lib/payment.ts` - Apply tier discounts in `computeSessionAmounts()`
- `/pages/index.tsx` - Show tier badge in Roster screen

**Tier Benefits Application:**
```typescript
// lib/payment.ts - Update computeSessionAmounts

export function computeSessionAmounts(input: ComputeInput): ComputeResult {
  // ... existing calculation

  // Apply tier discount
  const result: SessionPlayer[] = players.map(p => {
    // ... existing calculation

    // Fetch player's tier discount
    const tierDiscount = p.membership?.paymentDiscount ?? 0;
    const discountedAmount = amountOwed * (1 - tierDiscount);

    return {
      // ... existing fields
      tierDiscount,
      amountOwedBeforeDiscount: amountOwed,
      amountOwed: discountedAmount,
      // ... rest
    };
  });
}
```

### Definition of Done
- [ ] `membership_tier_configs` collection created
- [ ] PlayerDoc includes membership field
- [ ] CRUD API for tier configuration
- [ ] Membership editor in player profile
- [ ] Tier badge displayed in Roster, Rankings, Payments
- [ ] Payment discounts applied automatically based on tier
- [ ] Trial progress bar shows sessions used/remaining
- [ ] Auto-promotion notification when trial expires
- [ ] Membership history tracked for each player
- [ ] E2E test: Create trial member → Attend 3 sessions → Auto-convert
- [ ] Code review approved
- [ ] Deployed to staging

---

## S3H.2: Add Participation Tracking
**Priority:** 🟠 HIGH - SHOULD HAVE
**Story Points:** 5
**Sprint:** 3

### User Story
**As a** club host,
**I want to** automatically track each player's participation rate,
**So that** I can identify at-risk members and reward active players.

### Acceptance Criteria
```gherkin
GIVEN a player has attended 8 out of 12 polls
WHEN I view their profile
THEN I see "Participation Rate: 67% (8/12 sessions last 90 days)"
AND I see a trend indicator (↑ improving, ↓ declining, → stable)

GIVEN a player hasn't responded to last 3 polls
WHEN I view the Roster
THEN I see a "⚠️ Low Engagement" warning next to their name
AND I can click to send re-engagement message

GIVEN I want to reward active players
WHEN I navigate to Analytics > Top Players
THEN I see players sorted by participation rate (last 90 days)
AND I can export this list as CSV
```

### Technical Implementation

**Add to PlayerDoc:**
```typescript
export interface PlayerDoc {
  // ... existing fields
  participationStats: {
    last90Days: {
      pollsInvited: number;
      pollsResponded: number;
      sessionsAttended: number;
      participationRate: number;       // sessionsAttended / pollsInvited
      trend: 'up' | 'down' | 'stable';
    };
    allTime: {
      totalSessions: number;
      avgAttendanceRate: number;
    };
    lastActivityDate?: Date;
    consecutiveAbsences: number;       // No-shows or No responses in a row
  };
  // ... rest
}
```

**Cron Job:**
```typescript
// pages/api/cron/update-participation-stats.ts
// Runs daily at 2 AM
// Recalculates participationStats for all active players
```

**Files to create:**
- `/pages/api/cron/update-participation-stats.ts` - Batch update stats
- `/components/membership/ParticipationBadge.tsx` - Show rate with trend icon

**Files to modify:**
- `/pages/api/polls/[id]/responses.ts` - Increment pollsResponded count
- `/pages/api/payment/sessions/index.ts` - Increment sessionsAttended on import
- `/components/RosterScreen.tsx` - Show participation rate column

### Definition of Done
- [ ] participationStats added to PlayerDoc schema
- [ ] Cron job updates stats daily
- [ ] Participation rate displayed in Roster with trend icon
- [ ] Low engagement warning for players with <40% rate or 3+ consecutive absences
- [ ] Top Players analytics page created
- [ ] CSV export of participation stats
- [ ] Unit tests for participation calculation
- [ ] Code review approved

---

## S3H.3: Member Notes & Preferences
**Priority:** 🟡 MEDIUM - COULD HAVE
**Story Points:** 5
**Sprint:** 4

### User Story
**As a** club host,
**I want to** add notes and preferences for each member,
**So that** I can remember important details (injuries, skill level, preferred partners).

### Acceptance Criteria
```gherkin
GIVEN I am viewing a player's profile
WHEN I click "Add Note"
THEN I can enter free-text notes (e.g., "Prefers singles, shoulder injury - avoid heavy smashing")
AND I can tag notes as: General, Medical, Preference, Behavioral

GIVEN a player has a medical note
WHEN I view their profile or assign them to a team
THEN I see a 🩺 icon indicating medical notes
AND I can hover to see the note

GIVEN I want to track player preferences
WHEN I edit player preferences
THEN I can set: preferred game type, preferred partners, preferred time slots
AND these are shown when creating sessions or tournaments
```

### Technical Implementation

**Add to PlayerDoc:**
```typescript
export interface PlayerNote {
  id: string;
  text: string;
  category: 'general' | 'medical' | 'preference' | 'behavioral';
  icon: string;                        // "🩺", "❤️", "⚠️", "📝"
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PlayerPreferences {
  preferredGameType?: 'singles' | 'doubles' | 'both';
  preferredPartners?: string[];        // Player names
  preferredTimeSlots?: string[];       // "weekday_evening", "weekend_morning"
  courtSide?: 'left' | 'right' | 'any';
  skillSelfRating?: number;            // 1-10
}

export interface PlayerDoc {
  // ... existing fields
  notes: PlayerNote[];
  preferences?: PlayerPreferences;
  // ... rest
}
```

**Files to create:**
- `/components/membership/PlayerNotes.tsx` - Notes list with add/edit/delete
- `/components/membership/PlayerPreferences.tsx` - Preferences form

**Files to modify:**
- `/pages/api/players/[id].ts` - Add endpoints for notes CRUD
- `/components/RosterScreen.tsx` - Show medical icon if notes exist

### Definition of Done
- [ ] notes and preferences fields added to PlayerDoc
- [ ] API endpoints for adding/editing/deleting notes
- [ ] PlayerNotes component with category icons
- [ ] Medical note icon shows in Roster and Tournament setup
- [ ] Preferences form saves successfully
- [ ] Notes searchable (future enhancement)
- [ ] Code review approved

---

## S3H.4: Auto-Archive Inactive Members
**Priority:** 🟡 MEDIUM - COULD HAVE
**Story Points:** 3
**Sprint:** 4

### User Story
**As a** club host,
**I want to** automatically archive members who haven't attended in 90 days,
**So that** my active roster stays clean and I can focus on engaged players.

### Acceptance Criteria
```gherkin
GIVEN a player hasn't attended any session in 90 days
WHEN the auto-archive job runs
THEN the player is moved to "Archived" status
AND they receive a notification "We miss you! Rejoin anytime"
AND they are excluded from future polls and active roster

GIVEN an archived player wants to return
WHEN they attend a session or respond to a poll
THEN they are automatically re-activated
AND their stats and history are preserved

GIVEN I want to prevent auto-archiving for VIPs
WHEN I configure auto-archive settings
THEN I can exempt certain tiers (e.g., VIP, Regular)
```

### Technical Implementation

**Add to PlayerDoc:**
```typescript
export interface PlayerDoc {
  // ... existing fields
  active: boolean;                     // Now represents "active/archived" status
  autoArchived: boolean;               // Was this auto-archived or manual
  archivedReason?: string;             // "Inactive 90+ days" or manual reason
  lastActivityDate: Date;              // Updated on session attendance or poll response
  // ... rest
}
```

**Cron Job:**
```typescript
// pages/api/cron/auto-archive-inactive.ts
// Runs weekly on Sunday at midnight
// Archives players with lastActivityDate > 90 days ago
```

**Files to modify:**
- `/pages/api/cron/auto-archive-inactive.ts` - Create cron job
- `/pages/api/players/index.ts` - Filter archived players by default

### Definition of Done
- [ ] autoArchived and archivedReason fields added
- [ ] Cron job archives inactive players weekly
- [ ] Notification sent to archived players
- [ ] Auto-reactivation on activity
- [ ] Tier-based exemptions configurable
- [ ] Code review approved

---

# NEW EPIC 4: Payment Automation & Reminders
**Business Objective:** Increase payment collection rate from 75% to 95%, reduce host follow-up time by 80%.

**Success Metrics:**
- Payment collection rate: 75% → 95%
- Time spent on payment follow-ups: 4 hrs/week → 0.5 hrs/week
- Average payment delay: 14 days → 5 days
- Payment disputes: -60%

**Story Points:** 29 (Sprint 4-5)

---

## S4H.1: Automated Payment Reminders
**Priority:** 🔴 HIGHEST - MUST HAVE
**Story Points:** 8
**Sprint:** 4

### User Story
**As a** club host,
**I want to** automatically send payment reminders to players with outstanding debt,
**So that** I don't have to manually chase payments and improve collection rates.

### Acceptance Criteria
```gherkin
GIVEN a player has outstanding debt
WHEN the reminder schedule runs
THEN the player receives reminders at: 3 days before deadline, deadline day, 3 days overdue, 7 days overdue
AND each reminder includes: amount owed, breakdown, payment link

GIVEN I want to customize reminder schedule
WHEN I navigate to Settings > Payment Reminders
THEN I can configure: reminder intervals, message templates, enable/disable auto-reminders

GIVEN a player pays their debt
WHEN I mark the payment as received
THEN future reminders are automatically cancelled
AND the player receives a "Payment received - Thank you!" confirmation

GIVEN I want to see reminder effectiveness
WHEN I view Analytics > Payment Reminders
THEN I see: reminders sent, payments received after reminder, avg time to payment
```

### Technical Implementation

**Database Schema:**
```typescript
// lib/models.ts - New interface

export interface PaymentReminderConfigDoc {
  _id?: ObjectId;
  reminderSchedule: {
    daysBefore: number;                // -3 = 3 days before deadline
    enabled: boolean;
    template: string;                  // Email template ID
  }[];

  // Example:
  // [
  //   { daysBefore: -3, enabled: true, template: 'upcoming_payment' },
  //   { daysBefore: 0, enabled: true, template: 'payment_due_today' },
  //   { daysBefore: 3, enabled: true, template: 'payment_overdue_3d' },
  //   { daysBefore: 7, enabled: true, template: 'payment_overdue_7d' }
  // ]

  excludeTiers?: MembershipTier[];     // Don't remind VIPs
  maxReminders: number;                // Stop after N reminders

  updatedAt: Date;
}

export interface PaymentReminderLogDoc {
  _id?: ObjectId;
  playerId: ObjectId;
  playerName: string;
  period: string;                      // "2026-06"
  amountOwed: number;

  reminderType: 'before_deadline' | 'due_today' | 'overdue';
  daysOverdue?: number;

  sentAt: Date;
  channel: 'email' | 'sms' | 'in_app';
  status: 'sent' | 'failed' | 'bounced';

  // Response tracking
  opened?: boolean;
  clicked?: boolean;
  paidAfterReminder?: boolean;
  paidAt?: Date;
}
```

**Cron Job:**
```typescript
// pages/api/cron/send-payment-reminders.ts
// Runs daily at 9 AM
// Checks all outstanding debts and sends reminders based on schedule
```

**Email Template Example:**
```html
Subject: Payment Reminder - 350,000₫ Due for June 2026

Hi Alice,

You have an outstanding payment for June 2026 sessions:

💰 Amount Due: 350,000₫
📅 Due Date: June 30, 2026 (3 days from now)

Breakdown:
- Court fees: 200,000₫ (10 sessions)
- Shuttlecocks: 150,000₫

[View Full Details & Pay]

Need help? Reply to this email.

Thank you!
SmashTour
```

**Files to create:**
- `/pages/api/payment-reminders/config.ts` - GET, PATCH reminder config
- `/pages/api/cron/send-payment-reminders.ts` - Cron job
- `/pages/api/payment-reminders/log.ts` - GET reminder history
- `/lib/notifications/payment-reminder-templates.ts` - Email templates
- `/components/payment/ReminderConfigModal.tsx` - Configure reminders

**Files to modify:**
- `/lib/db/constants.ts` - Add collections
- `/pages/api/payment/paid.ts` - Cancel future reminders on payment

### Definition of Done
- [ ] `payment_reminder_configs` and `payment_reminder_logs` collections created
- [ ] Reminder config UI with schedule customization
- [ ] Cron job sends reminders based on schedule
- [ ] Email templates created for each reminder type
- [ ] Reminders cancelled automatically when payment received
- [ ] Reminder log tracks sent status and payment response
- [ ] Analytics dashboard shows reminder effectiveness
- [ ] Tier-based exclusions work correctly
- [ ] E2E test: Overdue debt → Reminder sent → Payment marked → Reminder cancelled
- [ ] Code review approved
- [ ] Deployed to staging

---

## S4H.2: Payment Method Tracking
**Priority:** 🟠 HIGH - SHOULD HAVE
**Story Points:** 5
**Sprint:** 4

### User Story
**As a** club host,
**I want to** track how each player paid (cash, bank transfer, e-wallet),
**So that** I can reconcile payments and identify preferred payment methods.

### Acceptance Criteria
```gherkin
GIVEN I am marking a payment as received
WHEN I click "Mark as Paid"
THEN I can select payment method: Cash, Bank Transfer, Momo, ZaloPay, Other
AND I can add a transaction reference (e.g., bank transfer ID)
AND I can upload a receipt image

GIVEN I want to see payment method distribution
WHEN I view Analytics > Payments
THEN I see a pie chart: Cash 40%, Bank Transfer 35%, Momo 20%, Other 5%
AND I can filter by date range

GIVEN a player always pays via Bank Transfer
WHEN I view their payment history
THEN I see their preferred method highlighted
AND I can pre-select this method when marking future payments
```

### Technical Implementation

**Update PaymentPaidDoc (if exists) or create new:**
```typescript
// lib/models.ts

export type PaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'zalopay' | 'other';

export interface PaymentPaidDoc {
  _id?: ObjectId;
  playerId?: ObjectId;
  playerName: string;
  period: string;                      // "2026-06"
  paidAmount: number;

  // Payment method details
  paymentMethod: PaymentMethod;
  transactionRef?: string;             // Bank transfer ID or e-wallet transaction ID
  receiptImageUrl?: string;            // S3/Blob URL to receipt image

  // Tracking
  paidAt: Date;
  recordedBy: string;                  // Admin username
  notes?: string;
}

// Add to PlayerDoc
export interface PlayerDoc {
  // ... existing fields
  paymentPreferences?: {
    preferredMethod?: PaymentMethod;
    accountNumber?: string;            // Bank account or e-wallet number
  };
}
```

**Files to modify:**
- `/pages/api/payment/paid.ts` - Add payment method fields
- `/components/payment/MarkPaidModal.tsx` - Add payment method selector
- `/pages/api/analytics/payments.ts` - Add payment method distribution

### Definition of Done
- [ ] paymentMethod added to payment_paid collection
- [ ] Mark Paid modal includes method selector
- [ ] Receipt image upload supported
- [ ] Payment method distribution chart in Analytics
- [ ] Preferred method auto-suggested for repeat payers
- [ ] Code review approved

---

## S4H.3: Bulk Payment Recording
**Priority:** 🟠 HIGH - SHOULD HAVE
**Story Points:** 5
**Sprint:** 5

### User Story
**As a** club host collecting cash at the end of a session,
**I want to** quickly record multiple payments at once,
**So that** I can mark 10+ players as paid in under 2 minutes.

### Acceptance Criteria
```gherkin
GIVEN I have collected cash from 12 players
WHEN I navigate to Payments > Bulk Record
THEN I see a checklist of all players with outstanding debt for current month
AND I can check multiple players at once
AND I click "Mark All as Paid - Cash"

GIVEN I am doing bulk payment recording
WHEN I select 10 players and click "Mark Paid"
THEN all 10 are marked as paid simultaneously
AND I see confirmation "10 payments recorded successfully"
AND a receipt is generated listing all 10 transactions

GIVEN I made a mistake in bulk recording
WHEN I click "Undo Last Bulk Payment"
THEN all payments from the last batch are reverted
AND players return to "outstanding" status
```

### Technical Implementation

**Files to create:**
- `/pages/api/payment/bulk-mark-paid.ts` - POST bulk payment endpoint
- `/components/payment/BulkPaymentModal.tsx` - Multi-select UI

**API Endpoint:**
```typescript
// POST /api/payment/bulk-mark-paid
{
  payments: [
    { playerName: "Alice", period: "2026-06", amount: 350000, method: "cash" },
    { playerName: "Bob", period: "2026-06", amount: 420000, method: "cash" }
  ],
  transactionDate: "2026-06-22T18:30:00Z",
  recordedBy: "admin"
}
```

### Definition of Done
- [ ] Bulk payment API endpoint created
- [ ] Multi-select UI in Payments screen
- [ ] Confirmation dialog shows summary before bulk record
- [ ] Receipt generated as PDF or printable HTML
- [ ] Undo functionality for last bulk action
- [ ] E2E test: Select 5 players → Bulk mark paid → Verify all marked
- [ ] Code review approved

---

## S4H.4: Payment Deadline Configuration
**Priority:** 🟡 MEDIUM - COULD HAVE
**Story Points:** 3
**Sprint:** 5

### User Story
**As a** club host,
**I want to** set payment deadlines per month or session,
**So that** players know when payments are due and reminders work correctly.

### Acceptance Criteria
```gherkin
GIVEN I am importing a new batch of sessions
WHEN I complete the import
THEN I can set a payment deadline for this batch (e.g., "End of month")
AND this deadline is shown to all players

GIVEN I want to set a global payment policy
WHEN I configure Settings > Payment Policy
THEN I can set: default deadline (e.g., "Last day of month"), grace period, late fee
```

### Technical Implementation

**Add to CourtSessionDoc or create payment period:**
```typescript
export interface PaymentPeriodDoc {
  _id?: ObjectId;
  period: string;                      // "2026-06"
  paymentDeadline: Date;
  gracePeriodDays: number;             // Allow N days late without penalty
  lateFeePercentage?: number;          // e.g., 0.05 = 5% late fee
}
```

### Definition of Done
- [ ] payment_periods collection created
- [ ] Deadline configurable per import batch
- [ ] Global payment policy settings
- [ ] Players see deadline in their payment page
- [ ] Reminders use configured deadline
- [ ] Code review approved

---

## S4H.5: Payment Dispute Handling
**Priority:** 🟡 MEDIUM - COULD HAVE
**Story Points:** 5
**Sprint:** 5

### User Story
**As a** player or host,
**I want to** flag payment discrepancies and resolve them,
**So that** payment issues are transparent and traceable.

### Acceptance Criteria
```gherkin
GIVEN I (player) believe my payment amount is incorrect
WHEN I view my payment details
THEN I can click "Report Issue"
AND I describe the issue and expected amount
AND the host receives a notification

GIVEN I (host) receive a payment dispute
WHEN I view Payments > Disputes
THEN I see all open disputes with player comments
AND I can respond, adjust amount, or close dispute
```

### Technical Implementation

**Database Schema:**
```typescript
export interface PaymentDisputeDoc {
  _id?: ObjectId;
  playerId: ObjectId;
  playerName: string;
  period: string;
  sessionId?: ObjectId;

  // Dispute details
  disputedAmount: number;
  expectedAmount?: number;
  reason: string;
  status: 'open' | 'resolved' | 'closed';

  // Resolution
  resolutionNotes?: string;
  adjustedAmount?: number;
  resolvedBy?: string;
  resolvedAt?: Date;

  createdAt: Date;
}
```

### Definition of Done
- [ ] payment_disputes collection created
- [ ] "Report Issue" button on player payment page
- [ ] Dispute list in admin Payments screen
- [ ] Host can respond and resolve disputes
- [ ] Email notifications on dispute creation and resolution
- [ ] Code review approved

---

# INTEGRATION & PRIORITY MATRIX

## Sprint Re-Organization (12 weeks total)

### SPRINT 1 (Weeks 1-2): Dynamic Pricing Foundation
**Goal:** Enable multi-venue and time-based pricing
**Story Points:** 31
**Must Have:** S1H.1, S1H.2 (21 points)
**Should Have:** S1H.3 (5 points)
**Could Have:** Accessibility work from original backlog (5 points)

### SPRINT 2 (Weeks 3-4): Attendance Polling Core
**Goal:** Automated attendance tracking and notifications
**Story Points:** 32
**Must Have:** S2H.1, S2H.2 (16 points)
**Should Have:** S2H.3 (5 points)
**Could Have:** S2H.4, Player self-service from original (11 points)

### SPRINT 3 (Weeks 5-6): Member Management
**Goal:** Membership tiers and participation tracking
**Story Points:** 29
**Must Have:** S3H.1, S3H.2 (13 points)
**Should Have:** Original refactoring stories (13 points)
**Could Have:** S3H.3, S3H.4 (8 points)

### SPRINT 4 (Weeks 7-8): Payment Automation
**Goal:** Automated reminders and method tracking
**Story Points:** 28
**Must Have:** S4H.1 (8 points)
**Should Have:** S4H.2, S4H.3 (10 points)
**Could Have:** S4H.4, S4H.5, original features (10 points)

### SPRINT 5 (Weeks 9-10): Court & Inventory Management
**Goal:** Court allocation and shuttlecock inventory
**Story Points:** 26
**(Stories S5H.1 - S5H.4 to be detailed separately)**

### SPRINT 6 (Weeks 11-12): Analytics & Optimization
**Goal:** Comprehensive analytics dashboard and final polish
**Story Points:** 24
**(Stories S6H.1 - S6H.3 to be detailed separately)**

---

## Updated Success Metrics (End of Sprint 6)

| Metric | Baseline | Sprint 3 Target | Sprint 6 Target | Improvement |
|--------|----------|-----------------|-----------------|-------------|
| **Host Efficiency** |
| Admin time/week | 15 hrs | 10 hrs | 6 hrs | -60% |
| Payment follow-up time | 4 hrs | 2 hrs | 0.5 hrs | -87% |
| Court booking time | 45 min | 30 min | 10 min | -78% |
| **Financial** |
| Payment collection rate | 75% | 85% | 95% | +20 pp |
| Avg payment delay | 14 days | 10 days | 5 days | -64% |
| Revenue optimization | 0% | +5% | +15% | +15% |
| **Member Engagement** |
| RSVP response rate | 30% | 60% | 85% | +55 pp |
| Attendance accuracy | 60% | 75% | 90% | +30 pp |
| No-show rate | 20% | 10% | 5% | -75% |
| Member retention | 70% | 80% | 90% | +20 pp |
| **Technical Health** |
| Main component size | 5,182 lines | 2,500 lines | <1,500 lines | -71% |
| Test coverage | 40% | 60% | 80% | +40 pp |
| Accessibility score | 60% | 85% | 90% | +30 pp |

---

## Risk Assessment (New Features)

### HIGH RISK
| Risk | Impact | Mitigation |
|------|--------|------------|
| Notification delivery failures (email bounces) | HIGH | Use reliable service (SendGrid), implement retry logic, fallback to in-app |
| Pricing rule complexity causes calculation errors | CRITICAL | Comprehensive unit tests, manual testing with edge cases, audit logs |
| Auto-archive accidentally removes active members | CRITICAL | Require confirmation, allow easy reactivation, tier-based exemptions |

### MEDIUM RISK
| Risk | Impact | Mitigation |
|------|--------|------------|
| Poll adoption is low (players ignore polls) | MEDIUM | Clear value proposition, incentivize responses, make RSVP dead simple |
| Payment reminders marked as spam | MEDIUM | Proper email authentication (SPF, DKIM), allow unsubscribe, limit frequency |
| Venue/tier configuration too complex for hosts | MEDIUM | Provide templates, video tutorials, sensible defaults |

### LOW RISK
| Risk | Impact | Mitigation |
|------|--------|------------|
| Member notes contain sensitive info | LOW | Add privacy warning, admin-only access, audit trail |
| Bulk payment undo used incorrectly | LOW | Confirmation dialog, time limit (30 min), audit log |

---

## Dependencies Map (Enhanced)

### Critical Path
```
S1H.1 (Venues) → S1H.2 (Pricing Rules) → S1H.3 (Holiday Pricing)
                                        ↓
S2H.1 (Polls) → S2H.2 (Notifications) → S2H.3 (Court Suggestions) → S2H.4 (Analytics)
                                        ↓
S3H.1 (Tiers) → S3H.2 (Participation) → S3H.3 (Notes) → S3H.4 (Auto-Archive)
                                        ↓
S4H.1 (Reminders) → S4H.2 (Methods) → S4H.3 (Bulk) → S4H.4 (Deadlines) → S4H.5 (Disputes)
```

### Parallel Work Streams
- **Team A:** Pricing features (S1H.1, S1H.2, S1H.3)
- **Team B:** Original accessibility/refactoring work
- **Team C:** Polling system (S2H.1, S2H.2)

### Integration Points
- Sprint 2: Integrate pricing rules into session import
- Sprint 3: Integrate tier discounts into payment calculation
- Sprint 4: Integrate polls with payment tracking (attended vs paid)
- Sprint 5: Integrate all features into unified analytics dashboard

---

## Next Steps - Implementation Roadmap

### Week 1 Actions
1. **Technical Setup**
   - [ ] Create database collections: venues, pricing_rules, session_polls, poll_responses
   - [ ] Set up email service (SendGrid account, templates)
   - [ ] Configure cron job scheduler (Vercel Cron or node-cron)

2. **Team Alignment**
   - [ ] Present enhanced backlog to stakeholders
   - [ ] Get approval for 12-week commitment
   - [ ] Assign teams to parallel work streams
   - [ ] Set up weekly progress reviews

3. **Sprint 1 Kickoff**
   - [ ] Sprint planning: Review S1H.1, S1H.2
   - [ ] Create Jira/Linear tickets
   - [ ] Set up dev environments
   - [ ] Start with S1H.1 (Venues) - foundation for pricing

### Ongoing Ceremonies
- **Daily Standups:** 9:30 AM (15 min)
- **Weekly Progress Review:** Fridays 2 PM (30 min) - demo completed work
- **Sprint Review:** End of each sprint (1 hr) - stakeholder demo
- **Sprint Retrospective:** End of each sprint (1.5 hrs) - continuous improvement

---

## Appendix A: Data Migration Plan

### New Collections to Create
1. `venues` - Venue management
2. `pricing_rules` - Dynamic pricing configuration
3. `session_polls` - Attendance polls
4. `poll_responses` - Player RSVPs
5. `membership_tier_configs` - Tier definitions
6. `payment_reminder_configs` - Reminder schedules
7. `payment_reminder_logs` - Reminder tracking
8. `notifications` - Notification history
9. `payment_disputes` - Dispute tracking

### Schema Migrations
```typescript
// Migration script: migrations/001_add_venue_support.ts
// Adds venueId to existing court_sessions (nullable)

// Migration script: migrations/002_add_membership_tiers.ts
// Adds membership field to existing players (default: 'regular')

// Migration script: migrations/003_add_participation_stats.ts
// Calculates initial participation stats for all players
```

---

## Appendix B: Email Templates

### Template: Poll Created
```
Subject: 🏸 RSVP: {{session_date}} Badminton Session

Hi {{player_name}},

New session poll is open!

📅 {{session_date}} at {{session_time}}
📍 {{venue_name}}
⏰ RSVP by {{deadline}}

👉 [RSVP NOW - Click Here]

Current: {{yes_count}}/{{max_players}} confirmed

See you on court!
SmashTour
```

### Template: Payment Reminder (3 days overdue)
```
Subject: ⚠️ Payment Overdue - {{amount}} for {{period}}

Hi {{player_name}},

Your payment for {{period}} is now 3 days overdue.

💰 Amount: {{amount}}
📅 Was due: {{due_date}}

Please settle your payment at your earliest convenience.

👉 [View Details & Payment Methods]

Need help? Reply to this email.

Thank you,
SmashTour
```

---

## Appendix C: Glossary (Updated)

- **Dynamic Pricing:** Automatic price adjustment based on venue, time, day, season
- **RSVP:** Répondez s'il vous plaît (Please respond) - attendance confirmation
- **Membership Tier:** Player categorization (Guest, Trial, Regular, VIP)
- **Participation Rate:** Percentage of sessions attended vs invited
- **Payment Collection Rate:** Percentage of owed payments successfully collected
- **No-Show:** Player confirmed attendance but didn't show up
- **Grace Period:** Additional days allowed for payment without penalty
- **Auto-Archive:** Automatic deactivation of inactive members
- **Bulk Payment:** Recording multiple payments simultaneously

---

## Document Control

**Version History:**
- v1.0 (2026-06-21): Original backlog (accessibility, refactoring, self-service)
- v2.0 (2026-06-22): Enhanced with host support features (pricing, polling, membership, payment automation)

**Maintained By:** Business Analyst & Product Owner

**Next Review:** After Sprint 1 completion (Week 2)

**Approval Required From:**
- [ ] Product Owner
- [ ] Tech Lead
- [ ] Stakeholder/Club Host

---

**Ready to transform badminton club management! Let's build! 🚀🏸**
