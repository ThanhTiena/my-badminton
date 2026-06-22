# SmashTour Sprint 1 Architecture Design
**Sprint 1: Dynamic Pricing & Multi-Venue Management**

**Author:** Senior Solution Architect
**Date:** 2026-06-22
**Version:** 1.0
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Context](#architecture-context)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [Pricing Engine Architecture](#pricing-engine-architecture)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Architecture Decision Records](#architecture-decision-records)
8. [Performance & Scalability](#performance--scalability)
9. [Security Architecture](#security-architecture)
10. [Migration Strategy](#migration-strategy)
11. [Implementation Plan](#implementation-plan)

---

## Executive Summary

This document defines the technical architecture for Sprint 1 features:
- **S1H.1:** Venue Management System (8 pts)
- **S1H.2:** Time-Based Pricing Rules (13 pts)
- **S1H.3:** Holiday/Special Event Pricing (5 pts)

### Key Architectural Decisions
- **Pricing Engine:** Pure function-based design for testability and performance
- **Rule Evaluation:** Priority-based cascade with explicit winner selection
- **Data Model:** Denormalized snapshots for pricing audit trail
- **Time Handling:** Native JavaScript Date with ISO 8601 strings (no date-fns dependency)
- **Indexing Strategy:** Compound indexes for multi-dimensional rule queries

### Performance Targets
| Metric | Target | Rationale |
|--------|--------|-----------|
| Pricing calculation (100 rules) | <50ms | Real-time session import |
| Venue list API | <100ms | Frequent UI access |
| Session import with pricing | <500ms per session | Batch imports acceptable |
| Database query (pricing rules) | <20ms | Indexed queries |

---

## Architecture Context

### Current System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
├─────────────────────────────────────────────────────────────┤
│  Pages/API Routes          │  Components (Client)           │
│  ├─ /api/players/*         │  ├─ RosterScreen.tsx          │
│  ├─ /api/payment/*         │  ├─ PaymentsScreen.tsx        │
│  ├─ /api/tournament/*      │  ├─ RankingsScreen.tsx        │
│  └─ /api/auth/*            │  └─ TournamentScreen.tsx      │
├─────────────────────────────────────────────────────────────┤
│  Business Logic (Pure Functions)                            │
│  ├─ lib/payment.ts         │  Pricing calculations         │
│  ├─ lib/tournament.ts      │  Tournament logic             │
│  ├─ lib/scoring.ts         │  Ranking calculations         │
│  └─ lib/auth/              │  JWT-based auth               │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├─ lib/db/client.ts       │  MongoDB connection           │
│  ├─ lib/db/constants.ts    │  Collection names             │
│  ├─ lib/db/indexes.ts      │  Index definitions            │
│  └─ lib/models.ts          │  TypeScript interfaces        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
│  Collections:                                                │
│  • players (tournament stats, rankings)                      │
│  • court_sessions (payment records per session)              │
│  • payment_config (player-specific payment rates)            │
│  • payment_paid (paid status tracking)                       │
│  • tournament_history, bets, users                           │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles (Existing)
1. **API routes protected by JWT middleware** (`requireAdmin`)
2. **Pure functions in lib/** — no side effects, 100% testable
3. **Denormalized snapshots** — preserve historical data integrity
4. **Single source of truth** — constants.ts for all collection names
5. **Index-first design** — indexes.ts defines all DB indexes upfront

### New Requirements Integration Points
- **Venue selection** → Session import flow (`/api/payment/sessions`)
- **Pricing rules** → Payment calculation (`lib/payment.ts`)
- **Venue analytics** → New analytics endpoint

---

## Database Design

### 1. Venues Collection

**Collection:** `venues`
**Purpose:** Store multi-venue configurations with base pricing rates

```typescript
export interface VenueDoc {
  _id?: ObjectId;

  // Identity
  name: string;                      // "Sunrise Sports Complex"
  slug: string;                      // "sunrise-sports" (URL-friendly)

  // Location
  address?: string;                  // "123 Main St, District 1, HCMC"
  district?: string;                 // "District 1" (for filtering)

  // Capacity
  courtCount: number;                // 8 courts available

  // Base Pricing (VND)
  baseHourlyRate: number;            // 200,000 VND/hour (default)

  // Facilities
  facilities?: string[];             // ["Parking", "Shower", "AC", "Lockers"]

  // Contact
  contactPerson?: string;            // "Mr. Nguyen"
  contactPhone?: string;             // "+84 901 234 567"

  // Admin notes
  notes?: string;                    // "Booking requires 24h notice"

  // Soft delete
  active: boolean;                   // true = available, false = archived

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                // Admin username
}
```

**Indexes:**
```typescript
// Primary lookup
{ name: 1 }, { unique: true, collation: { locale: 'vi', strength: 2 } }

// Query active venues
{ active: 1, name: 1 }

// Slug-based lookups (future URL routing)
{ slug: 1 }, { unique: true, sparse: true }
```

**Why This Design:**
- **Slug field:** Enables future public venue pages (`/venues/sunrise-sports`)
- **District field:** Supports geographic filtering/grouping in analytics
- **Denormalized facilities:** Simple array for quick display, no joins needed
- **Soft delete (active):** Preserve historical venue data, hide from UI

---

### 2. Pricing Rules Collection

**Collection:** `pricing_rules`
**Purpose:** Define dynamic pricing based on time, day, date, and venue

```typescript
export interface PricingRuleDoc {
  _id?: ObjectId;

  // Rule Identity
  ruleName: string;                    // "Weekend Peak Hours"
  ruleType: 'time_based' | 'special_event' | 'seasonal';

  // Scope — null = applies globally
  venueId?: ObjectId;                  // Restrict to specific venue
  venueName?: string;                  // Snapshot for audit trail

  // Day Pattern (ISO 8601 weekday: 1=Mon, 7=Sun)
  daysOfWeek?: number[];               // [6, 7] = Saturday & Sunday
                                        // null = all days

  // Time Range (24-hour format HH:mm)
  timeStart?: string;                  // "18:00" (6 PM)
  timeEnd?: string;                    // "21:00" (9 PM)
                                        // null = all day

  // Date Range (for seasonal/event pricing)
  dateStart?: string;                  // "2026-06-01" (ISO 8601)
  dateEnd?: string;                    // "2026-08-31"
                                        // null = always active

  // Pricing Adjustment
  rateType: 'multiplier' | 'fixed';    // How to apply rate
  rateValue: number;                   // 1.5 = 50% more (multiplier)
                                        // 250000 = fixed price (VND)

  // Special Event Metadata (optional)
  eventName?: string;                  // "Lunar New Year 2026"
  eventIcon?: string;                  // "🎉" or "🎊"

  // Overlapping Rule Strategy
  combinationStrategy?: 'multiply' | 'highest' | 'additive';
                                        // multiply: 1.5 × 1.3 = 1.95x
                                        // highest: max(1.5, 1.3) = 1.5x
                                        // additive: 1.5 + 1.3 - 1 = 1.8x

  // Priority (for rule resolution)
  priority: number;                    // 1-1000 (higher = more specific)
                                        // 100: venue + time + day
                                        // 50:  time + day only
                                        // 10:  day only
                                        // 1:   global default

  // Lifecycle
  active: boolean;                     // Enable/disable rule
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                  // Admin username
}
```

**Indexes:**
```typescript
// Priority + active lookup (most common query)
{ active: 1, priority: -1 }

// Venue-specific rule lookup
{ venueId: 1, active: 1, priority: -1 }

// Date range queries (for seasonal rules)
{ active: 1, dateStart: 1, dateEnd: 1 }

// Admin management UI
{ createdAt: -1 }
```

**Why This Design:**
- **Priority field:** Explicit conflict resolution — no ambiguity in rule selection
- **Optional fields:** Maximum flexibility (global rules, day-only, time-only, etc.)
- **Combination strategy:** Future-proof for complex overlapping scenarios
- **Snapshot venueName:** Audit trail shows "which venue at that time"
- **ISO 8601 dates/times:** Standard format, timezone-safe, sortable

---

### 3. Updated Court Session Schema

**Collection:** `court_sessions` (existing, add new fields)

```typescript
export interface CourtSessionDoc {
  // ... existing fields (sessionDate, courtFee, players, etc.)

  // NEW: Venue Reference
  venueId?: ObjectId;                  // Reference to VenueDoc
  venueName?: string;                  // Snapshot of venue name
  venueAddress?: string;               // Snapshot (optional)

  // NEW: Pricing Rule Applied
  pricingRuleId?: ObjectId;            // Which rule was used
  pricingRuleName?: string;            // Snapshot of rule name
  pricingRateApplied?: number;         // e.g., 1.5 or 250000
  pricingRateType?: 'multiplier' | 'fixed';

  // NEW: Pricing Breakdown
  baseCourtFee?: number;               // Before rule applied
  // courtFee (existing) = final fee after rule

  // ... rest of existing fields
}
```

**New Indexes:**
```typescript
// Venue analytics
{ venueId: 1, sessionDate: -1 }

// Pricing rule tracking
{ pricingRuleId: 1 }
```

**Why This Design:**
- **Denormalized snapshots:** Historical sessions stay accurate even if venue/rule changes
- **Backward compatible:** All new fields are optional — existing sessions unaffected
- **Audit trail:** Can trace "which rule applied to which session"

---

## API Design

### RESTful Endpoint Specifications

---

### **Venues API**

#### **GET /api/venues**
**Auth:** Public (read-only), Admin (full access)
**Description:** List all active venues

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | If `true`, include archived venues (admin only) |

**Response 200:**
```json
{
  "venues": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Sunrise Sports Complex",
      "slug": "sunrise-sports",
      "address": "123 Main St, District 1, HCMC",
      "courtCount": 8,
      "baseHourlyRate": 200000,
      "facilities": ["Parking", "Shower", "AC"],
      "active": true,
      "createdAt": "2026-06-01T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

#### **POST /api/venues**
**Auth:** Admin only
**Description:** Create a new venue

**Request Body:**
```json
{
  "name": "Sunrise Sports Complex",
  "address": "123 Main St, District 1, HCMC",
  "courtCount": 8,
  "baseHourlyRate": 200000,
  "facilities": ["Parking", "Shower", "AC"],
  "contactPerson": "Mr. Nguyen",
  "contactPhone": "+84 901 234 567"
}
```

**Validation Rules:**
- `name`: Required, unique (case-insensitive), 2-100 chars
- `courtCount`: Required, integer 1-50
- `baseHourlyRate`: Required, number ≥ 0
- Auto-generate `slug` from `name` (e.g., "Sunrise Sports" → "sunrise-sports")

**Response 201:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Sunrise Sports Complex",
  "slug": "sunrise-sports",
  ...
}
```

**Response 400:** Validation errors
**Response 409:** Venue name already exists

---

#### **GET /api/venues/:id**
**Auth:** Public
**Description:** Get single venue details

**Response 200:** Single venue object
**Response 404:** Venue not found

---

#### **PATCH /api/venues/:id**
**Auth:** Admin only
**Description:** Update venue details

**Request Body:** Partial venue object (only changed fields)

**Response 200:** Updated venue object
**Response 404:** Venue not found

---

#### **DELETE /api/venues/:id**
**Auth:** Admin only
**Description:** Soft delete venue (set `active: false`)

**Response 200:**
```json
{
  "deleted": true,
  "venueId": "507f1f77bcf86cd799439011"
}
```

**Response 400:** Cannot delete if active sessions reference this venue

---

### **Pricing Rules API**

#### **GET /api/pricing-rules**
**Auth:** Admin only
**Description:** List all pricing rules

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `venueId` | ObjectId | No | Filter by venue |
| `active` | boolean | No | Filter by active status (default: true) |

**Response 200:**
```json
{
  "rules": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "ruleName": "Weekend Peak Hours",
      "ruleType": "time_based",
      "venueId": "507f1f77bcf86cd799439011",
      "venueName": "Sunrise Sports Complex",
      "daysOfWeek": [6, 7],
      "timeStart": "18:00",
      "timeEnd": "21:00",
      "rateType": "multiplier",
      "rateValue": 1.5,
      "priority": 80,
      "active": true
    }
  ],
  "total": 12
}
```

---

#### **POST /api/pricing-rules**
**Auth:** Admin only
**Description:** Create a new pricing rule

**Request Body:**
```json
{
  "ruleName": "Weekend Peak Hours",
  "ruleType": "time_based",
  "venueId": "507f1f77bcf86cd799439011",
  "daysOfWeek": [6, 7],
  "timeStart": "18:00",
  "timeEnd": "21:00",
  "rateType": "multiplier",
  "rateValue": 1.5,
  "priority": 80
}
```

**Validation Rules:**
- `ruleName`: Required, 3-100 chars
- `rateType`: Must be 'multiplier' or 'fixed'
- `rateValue`: Number > 0; if multiplier, typically 0.5-3.0; if fixed, typical court fee range
- `daysOfWeek`: Array of integers 1-7 (if provided)
- `timeStart/timeEnd`: Must be valid HH:mm format (00:00 to 23:59)
- `dateStart/dateEnd`: Must be valid ISO 8601 dates (YYYY-MM-DD)
- `priority`: Integer 1-1000 (default: 50)

**Priority Recommendation:**
- 100: Venue + Time + Day (most specific)
- 75-90: Time + Day (no venue restriction)
- 50-70: Day only or Time only
- 25-40: Seasonal/date-range rules
- 1-20: Global default rates

**Response 201:** Created rule object
**Response 400:** Validation errors

---

#### **PATCH /api/pricing-rules/:id**
**Auth:** Admin only
**Description:** Update pricing rule

**Request Body:** Partial rule object

**Response 200:** Updated rule object

---

#### **DELETE /api/pricing-rules/:id**
**Auth:** Admin only
**Description:** Permanently delete rule (or set `active: false`)

**Response 200:**
```json
{
  "deleted": true,
  "ruleId": "507f1f77bcf86cd799439012"
}
```

---

#### **POST /api/pricing-rules/calculate**
**Auth:** Admin only
**Description:** Test pricing calculation (dry-run, no DB writes)

**Request Body:**
```json
{
  "venueId": "507f1f77bcf86cd799439011",
  "sessionDate": "2026-06-28",
  "timeStart": "19:00",
  "duration": 2,
  "baseRate": 200000
}
```

**Response 200:**
```json
{
  "baseCourtFee": 400000,
  "appliedRules": [
    {
      "ruleId": "507f1f77bcf86cd799439012",
      "ruleName": "Weekend Peak Hours",
      "rateType": "multiplier",
      "rateValue": 1.5,
      "priority": 80
    }
  ],
  "finalCourtFee": 600000,
  "breakdown": {
    "base": 400000,
    "multipliers": ["Weekend Peak Hours × 1.5"],
    "final": 600000
  }
}
```

**Use Cases:**
- Admin tests rule before applying
- UI shows "estimated cost" based on date/time selection

---

### **Updated Session Import API**

#### **POST /api/payment/sessions**
**Auth:** Admin only
**Description:** Import court sessions (existing endpoint, enhanced)

**Request Body:** (Enhanced)
```json
[
  {
    "date": "2026-06-28",
    "players": ["Alice", "Bob", "Charlie", "Dave"],
    "courtFee": 200000,
    "numShuttlecocks": 12,
    "shuttlecockUnitPrice": 15000,
    "venueId": "507f1f77bcf86cd799439011",
    "timeStart": "19:00",
    "duration": 2
  }
]
```

**New Fields:**
- `venueId` (optional): If provided, apply venue-specific pricing rules
- `timeStart` (optional): Session start time (HH:mm)
- `duration` (optional): Hours played (for future automatic fee calculation)

**Backend Logic Changes:**
1. If `venueId` provided, fetch venue and snapshot name/address
2. Call `calculateCourtFee()` to apply pricing rules
3. Store applied rule in `pricingRuleId`, `pricingRuleName`
4. Store original `baseCourtFee` before rule applied
5. Use final `courtFee` in payment calculations

**Backward Compatibility:**
- If no `venueId`, use `courtFee` as-is (existing behavior)
- All new fields are optional

---

## Pricing Engine Architecture

### Core Design Philosophy

**Principles:**
1. **Pure Functions:** Zero side effects, 100% unit testable
2. **Performance First:** <50ms for 100+ rules
3. **Explainable:** Always return which rule was applied and why
4. **Extensible:** Easy to add new rule types without breaking existing logic

---

### Pricing Calculation Algorithm

**Location:** `/lib/pricing.ts` (new file)

```typescript
// ─────────────────────────────────────────────────────────────
// PRICING ENGINE — Pure Functions
// ─────────────────────────────────────────────────────────────

import type { ObjectId } from 'mongodb';
import type { PricingRuleDoc } from './models';

/* ── Input/Output Types ────────────────────────────────────── */

export interface PricingCalculationInput {
  venueId?: string | ObjectId;       // Venue context (optional)
  sessionDate: string;                // "2026-06-28" (YYYY-MM-DD)
  timeStart?: string;                 // "19:00" (HH:mm)
  duration?: number;                  // Hours (optional)
  baseRate?: number;                  // VND per hour (from venue or default)
}

export interface AppliedPricingRule {
  ruleId: string;
  ruleName: string;
  ruleType: 'time_based' | 'special_event' | 'seasonal';
  rateType: 'multiplier' | 'fixed';
  rateValue: number;
  priority: number;
  reason: string;                     // Human-readable explanation
}

export interface PricingCalculationResult {
  baseCourtFee: number;               // Original fee before rules
  appliedRules: AppliedPricingRule[]; // All matching rules (sorted by priority)
  finalCourtFee: number;              // After applying rules
  breakdown: string[];                // Step-by-step calculation log
}

/* ── Core Pricing Function ─────────────────────────────────── */

/**
 * Calculate court fee by applying pricing rules in priority order.
 *
 * Algorithm:
 *   1. Fetch all active rules from DB
 *   2. Filter rules matching: venue, date range, day of week, time range
 *   3. Sort by priority (descending) — highest priority wins
 *   4. Apply the top-priority rule
 *   5. If combinationStrategy exists, apply multiple rules
 *   6. Return breakdown with explanation
 */
export async function calculateCourtFee(
  input: PricingCalculationInput,
  allRules: PricingRuleDoc[]          // Passed in to keep function pure
): Promise<PricingCalculationResult> {

  const { venueId, sessionDate, timeStart, duration, baseRate } = input;

  // Default base fee (if not provided)
  const baseCourtFee = baseRate ?? 200000;

  // Parse session metadata
  const sessionDay = getISOWeekday(sessionDate);      // 1=Mon, 7=Sun
  const sessionTime = timeStart ? parseTime(timeStart) : null;

  // Step 1: Filter matching rules
  const matchingRules = allRules.filter(rule => {
    if (!rule.active) return false;

    // Venue match
    if (rule.venueId && rule.venueId.toString() !== venueId?.toString()) {
      return false;
    }

    // Date range match
    if (rule.dateStart && sessionDate < rule.dateStart) return false;
    if (rule.dateEnd && sessionDate > rule.dateEnd) return false;

    // Day of week match
    if (rule.daysOfWeek && !rule.daysOfWeek.includes(sessionDay)) {
      return false;
    }

    // Time range match
    if (rule.timeStart && rule.timeEnd && sessionTime) {
      const ruleStart = parseTime(rule.timeStart);
      const ruleEnd   = parseTime(rule.timeEnd);
      if (sessionTime < ruleStart || sessionTime >= ruleEnd) {
        return false;
      }
    }

    return true; // All criteria matched
  });

  // Step 2: Sort by priority (highest first)
  matchingRules.sort((a, b) => b.priority - a.priority);

  // Step 3: No rules matched — use base rate
  if (matchingRules.length === 0) {
    return {
      baseCourtFee,
      appliedRules: [],
      finalCourtFee: baseCourtFee,
      breakdown: [`Base rate: ${formatVND(baseCourtFee)} (no pricing rules applied)`],
    };
  }

  // Step 4: Apply highest priority rule
  const topRule = matchingRules[0];

  let finalFee = baseCourtFee;
  const breakdown: string[] = [`Base rate: ${formatVND(baseCourtFee)}`];

  if (topRule.rateType === 'multiplier') {
    finalFee = baseCourtFee * topRule.rateValue;
    breakdown.push(
      `Applied "${topRule.ruleName}" (${topRule.rateValue}x): ${formatVND(finalFee)}`
    );
  } else {
    // Fixed rate override
    finalFee = topRule.rateValue;
    breakdown.push(
      `Applied "${topRule.ruleName}" (fixed rate): ${formatVND(finalFee)}`
    );
  }

  // Step 5: Future — Handle overlapping rules (if combinationStrategy exists)
  // For Sprint 1, only top rule applies. Sprint 2+ can implement multiply/additive.

  const appliedRules: AppliedPricingRule[] = [{
    ruleId:    topRule._id!.toString(),
    ruleName:  topRule.ruleName,
    ruleType:  topRule.ruleType,
    rateType:  topRule.rateType,
    rateValue: topRule.rateValue,
    priority:  topRule.priority,
    reason:    buildRuleReason(topRule, sessionDate, sessionTime),
  }];

  return {
    baseCourtFee,
    appliedRules,
    finalCourtFee: Math.round(finalFee), // Round to nearest VND
    breakdown,
  };
}

/* ── Helper Functions ──────────────────────────────────────── */

/**
 * Get ISO weekday number: 1=Monday, 7=Sunday
 */
function getISOWeekday(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day === 0 ? 7 : day; // Convert to ISO (1=Mon, 7=Sun)
}

/**
 * Parse time string "HH:mm" to minutes since midnight (0-1439)
 */
function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Build human-readable reason for why rule matched
 */
function buildRuleReason(
  rule: PricingRuleDoc,
  sessionDate: string,
  sessionTime: number | null
): string {
  const parts: string[] = [];

  if (rule.venueId) {
    parts.push(`venue-specific`);
  }
  if (rule.daysOfWeek) {
    const dayNames = rule.daysOfWeek.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d-1]);
    parts.push(`${dayNames.join('/')}`);
  }
  if (rule.timeStart && rule.timeEnd) {
    parts.push(`${rule.timeStart}-${rule.timeEnd}`);
  }
  if (rule.dateStart && rule.dateEnd) {
    parts.push(`${rule.dateStart} to ${rule.dateEnd}`);
  }
  if (rule.eventName) {
    parts.push(`event: ${rule.eventName}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'global rule';
}

function formatVND(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`;
}
```

---

### Performance Optimization Strategy

**Target:** <50ms for 100+ rules

**Optimizations:**
1. **Database Query:**
   - Index: `{ active: 1, priority: -1 }` — fetch only active rules, pre-sorted
   - Fetch all active rules once per session import batch (not per session)

2. **In-Memory Filtering:**
   - Filter in JS after fetch (very fast for 100s of rules)
   - Early exit on first criteria mismatch

3. **Time Parsing:**
   - Parse time strings to integers once (minutes since midnight)
   - Integer comparisons are fastest

4. **No Date Libraries:**
   - Native `Date` object sufficient for ISO 8601 dates
   - Avoid external dependencies (date-fns, moment) — reduces bundle size

5. **Caching (Optional Future Enhancement):**
   - Cache pricing rules in memory (refresh every 5 min)
   - Use Redis/Vercel KV for distributed cache

**Benchmark Plan:**
```typescript
// test/pricing-performance.test.ts
describe('Pricing Engine Performance', () => {
  it('should calculate fee for 100 rules in <50ms', async () => {
    const rules = generateMockRules(100);
    const start = Date.now();

    await calculateCourtFee({
      sessionDate: '2026-06-28',
      timeStart: '19:00',
      baseRate: 200000,
    }, rules);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
```

---

## Data Flow Diagrams

### 1. Session Import with Pricing Flow

```
┌──────────────┐
│  Admin UI    │ Paste CSV/JSON with venue + time
└──────┬───────┘
       │
       │ POST /api/payment/sessions
       ▼
┌──────────────────────────────────────────────────────┐
│  Session Import API                                  │
│  (/pages/api/payment/sessions/index.ts)             │
├──────────────────────────────────────────────────────┤
│  1. Parse import rows                                │
│  2. Fetch all active pricing_rules (batched)        │
│  3. For each session:                                │
│     a. If venueId exists, fetch venue snapshot       │
│     b. Call calculateCourtFee() with rules           │
│     c. Store applied rule + final fee                │
│  4. Compute player shares (existing logic)           │
│  5. Insert CourtSessionDoc[] to MongoDB              │
└──────┬───────────────────────────────────────────────┘
       │
       │ Insert batch
       ▼
┌──────────────────────────────────────────────────────┐
│  MongoDB: court_sessions                             │
│  {                                                   │
│    venueId, venueName,                              │
│    pricingRuleId, pricingRuleName,                  │
│    baseCourtFee, courtFee (final),                  │
│    players: [...shares]                             │
│  }                                                   │
└──────────────────────────────────────────────────────┘
```

---

### 2. Pricing Rule Evaluation Logic

```
Input: { venueId, sessionDate, timeStart, baseRate }
  │
  ▼
┌────────────────────────────────────────┐
│ Fetch all active pricing_rules        │
│ WHERE active = true                    │
│ ORDER BY priority DESC                 │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Filter rules matching session:        │
│ • venueId (if rule.venueId exists)    │
│ • dateStart ≤ sessionDate ≤ dateEnd   │
│ • daysOfWeek includes sessionDay       │
│ • timeStart ≤ sessionTime < timeEnd    │
└────────────┬───────────────────────────┘
             │
             ▼
        ┌────────┐
        │ Any    │ NO → Use base rate
        │ match? ├──────────────────┐
        └───┬────┘                  │
            │ YES                   │
            ▼                       ▼
┌────────────────────────┐  ┌──────────────────┐
│ Take highest priority  │  │ Return base fee  │
│ rule (first in list)   │  │ (no rule applied)│
└────────┬───────────────┘  └──────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Apply rate:                        │
│ IF multiplier:                     │
│   finalFee = baseRate × rateValue  │
│ ELSE (fixed):                      │
│   finalFee = rateValue             │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Return:                            │
│ { baseCourtFee, appliedRules,     │
│   finalCourtFee, breakdown }      │
└────────────────────────────────────┘
```

---

### 3. Venue Analytics Data Flow

```
┌──────────────┐
│  Admin UI    │ View Analytics > Venues
└──────┬───────┘
       │
       │ GET /api/analytics/venues?period=2026-06
       ▼
┌──────────────────────────────────────────────────────┐
│  Analytics API                                       │
│  (/pages/api/analytics/venues.ts)                   │
├──────────────────────────────────────────────────────┤
│  1. Query court_sessions WHERE month = '2026-06'    │
│  2. Group by venueId:                                │
│     • totalSessions = count(*)                       │
│     • totalCourtFee = sum(courtFee)                  │
│     • avgCourtFee   = avg(courtFee)                  │
│     • totalPlayers  = sum(players.length)            │
│  3. Join with venues to get venue names              │
│  4. Return aggregated stats                          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Response:                                           │
│  {                                                   │
│    "venues": [                                       │
│      {                                               │
│        "venueId": "...",                             │
│        "venueName": "Sunrise Sports",                │
│        "totalSessions": 24,                          │
│        "totalCourtFee": 4800000,                     │
│        "avgCourtFee": 200000,                        │
│        "totalPlayers": 96                            │
│      }                                               │
│    ],                                                │
│    "period": "2026-06"                               │
│  }                                                   │
└──────────────────────────────────────────────────────┘
```

---

## Architecture Decision Records

### ADR-001: Use Native Date Handling Instead of date-fns

**Date:** 2026-06-22
**Status:** Accepted

**Context:**
The pricing engine needs to handle date/time comparisons for rule matching. The sprint backlog suggests "date-fns for time-based rules." However, our requirements are simple:
- ISO 8601 date strings (`YYYY-MM-DD`)
- Time ranges in 24h format (`HH:mm`)
- Day of week calculations
- No timezone conversions needed (all sessions are local time in Vietnam)

**Decision Drivers:**
- Bundle size impact (date-fns adds ~70KB minified)
- Performance overhead (function call overhead vs native Date)
- Complexity (native Date sufficient for our use cases)
- Learning curve (team already familiar with Date API)

**Considered Options:**
1. **date-fns** — Popular, well-tested, tree-shakeable
2. **day.js** — Smaller alternative (~2KB)
3. **Native Date + helpers** — Zero dependencies

**Decision:**
Chosen: **Option 3 — Native Date with custom helper functions**

**Rationale:**
- ISO 8601 strings are natively comparable: `"2026-06-28" > "2026-06-01"` works
- Day of week: Simple modulo arithmetic
- Time parsing: Split on `:` and convert to minutes (integer comparison)
- No timezone complexity in this domain (all Vietnam local time)
- Avoids external dependency and bundle bloat
- <20 lines of helper code vs 70KB library

**Implementation:**
```typescript
// lib/pricing-utils.ts
export function getISOWeekday(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day === 0 ? 7 : day;
}

export function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m; // Minutes since midnight
}
```

**Consequences:**
- **Positive:**
  - Smaller bundle size (~70KB saved)
  - Faster execution (no library overhead)
  - One less dependency to maintain/update
  - Full control over date logic
- **Negative:**
  - Must write/test our own date helpers (low risk, simple logic)
  - Future timezone handling requires more work (unlikely in this domain)

**Validation Plan:**
- Unit tests for date helpers (edge cases: leap years, month boundaries)
- Performance benchmarks confirm <50ms target met

---

### ADR-002: Priority-Based Rule Cascade with Single Winner

**Date:** 2026-06-22
**Status:** Accepted

**Context:**
Multiple pricing rules can match a single session (e.g., "Weekend" + "Peak Hours" + "Holiday"). We need to decide:
1. Which rule wins when multiple match?
2. Should we combine rules (e.g., 1.5× × 1.3× = 1.95×)?
3. How to make the logic transparent to admins?

**Decision Drivers:**
- **Simplicity:** Avoid complex rule combination logic in Sprint 1
- **Predictability:** Admin must understand which rule applies
- **Auditability:** Payment disputes require clear rule tracing
- **Extensibility:** Design must allow future combination strategies

**Considered Options:**
1. **Highest priority wins (single rule applied)**
2. **Multiply all matching rules** (e.g., 1.5 × 1.3 = 1.95)
3. **Highest rate wins** (compare final fees, pick max)
4. **Admin chooses combination strategy per rule**

**Decision:**
Chosen: **Option 1 — Highest priority wins**
Future-proofed with `combinationStrategy` field for Option 4 in Sprint 2+.

**Rationale:**
- Sprint 1 focus: Get basic pricing working reliably
- Single winner = zero ambiguity in rule application
- Admins configure priority explicitly (100 = very specific, 1 = default)
- Audit trail clearly shows "Rule X was applied (priority 80)"
- Database schema includes `combinationStrategy` for future enhancement

**Priority Guidelines:**
| Priority | Use Case | Example |
|----------|----------|---------|
| 100 | Venue + Day + Time | "Sunrise Sports, Sat 6-9 PM" |
| 75 | Day + Time (all venues) | "Weekend evenings" |
| 50 | Day only | "All Saturdays" |
| 25 | Seasonal (date range) | "Summer pricing" |
| 10 | Global default | "Off-peak discount" |

**Implementation Example:**
```typescript
// Sort by priority descending
matchingRules.sort((a, b) => b.priority - a.priority);

// Apply first rule (highest priority)
const topRule = matchingRules[0];
```

**Consequences:**
- **Positive:**
  - Clear, predictable rule application
  - Easy to debug/troubleshoot
  - Simple to explain to admins
  - Fast execution (no complex calculations)
- **Negative:**
  - Cannot combine rules in Sprint 1 (e.g., holiday + weekend)
  - Admin must create composite rules explicitly

**Future Enhancement (Sprint 2):**
- Add UI toggle: "Combine this rule with others"
- Implement `combinationStrategy`: multiply, highest, additive
- Update `calculateCourtFee()` to handle multiple rules

**Validation Plan:**
- E2E test: Create 3 overlapping rules, verify highest priority wins
- Unit test: Verify priority sorting logic
- Admin documentation: How to set priority values

---

### ADR-003: Denormalize Venue and Rule Snapshots in Sessions

**Date:** 2026-06-22
**Status:** Accepted

**Context:**
When a session is imported, we store `venueId` and `pricingRuleId`. If the venue name changes or the pricing rule is deleted, historical sessions could:
1. Lose context (name shows as "Unknown Venue")
2. Require joins to display historical data
3. Break audit trails

**Decision Drivers:**
- **Data Integrity:** Historical sessions must remain accurate forever
- **Performance:** Avoid joins when displaying session lists
- **Auditability:** Payment disputes need exact pricing details at import time
- **Existing Pattern:** Current system already snapshots player names, smash weights

**Considered Options:**
1. **Normalize only (store IDs)** — require joins to display
2. **Denormalize snapshots (store IDs + names)** — duplicates data
3. **Hybrid: store IDs, cache names in UI** — complex

**Decision:**
Chosen: **Option 2 — Denormalize snapshots**

**Rationale:**
- Follows existing pattern: `SessionPlayer` snapshots `smashWeight`, `courtRate`
- Audit trail requirement: "Show exactly what was charged and why"
- Common pattern in payment/financial systems (immutable records)
- MongoDB is schema-flexible, storage is cheap
- Session list queries avoid venue/rule joins

**Implementation:**
```typescript
export interface CourtSessionDoc {
  venueId?: ObjectId;           // FK for analytics queries
  venueName?: string;           // Snapshot (denormalized)
  venueAddress?: string;        // Snapshot (optional)

  pricingRuleId?: ObjectId;     // FK for rule tracking
  pricingRuleName?: string;     // Snapshot (denormalized)
  pricingRateApplied?: number;  // Snapshot (e.g., 1.5)
  pricingRateType?: 'multiplier' | 'fixed';

  baseCourtFee?: number;        // Before rule applied
  courtFee: number;             // After rule applied (final)
}
```

**Storage Impact:**
- Average snapshot size: ~100 bytes per session
- 1,000 sessions/year: 100KB (negligible)
- Trade-off: Tiny storage cost vs huge query simplification

**Consequences:**
- **Positive:**
  - Historical accuracy guaranteed
  - Fast session list rendering (no joins)
  - Clear audit trail for disputes
  - Consistent with existing data model
- **Negative:**
  - Data duplication (acceptable trade-off)
  - Cannot "update all historical sessions" if venue name changes (by design)

**Validation Plan:**
- E2E test: Create session → Update venue name → Verify session shows old name
- Unit test: Verify snapshots populated on session import

---

### ADR-004: Admin-Only Venue and Pricing Management

**Date:** 2026-06-22
**Status:** Accepted

**Context:**
Pricing rules and venue configurations directly affect payment amounts. We need to decide access control:
1. Who can create/edit venues?
2. Who can create/edit pricing rules?
3. Can players view venues? Pricing rules?

**Decision Drivers:**
- **Security:** Incorrect pricing = revenue loss or player complaints
- **Simplicity:** Avoid complex RBAC in Sprint 1
- **Transparency:** Players should understand why they're charged X amount
- **Existing Pattern:** Current system has admin-only payment imports

**Considered Options:**
1. **Admin-only (full lockdown)** — players see nothing
2. **Admin write, public read** — players can view venues/rules
3. **Role-based (admin, host, player)** — complex permissions

**Decision:**
Chosen: **Option 2 — Admin write, public read (with privacy filters)**

**Permissions:**

| Endpoint | Admin | Player (Public) |
|----------|-------|----------------|
| GET /api/venues | Full access | Active venues only |
| POST/PATCH/DELETE /api/venues | ✅ | ❌ |
| GET /api/pricing-rules | Full access | ❌ (hidden) |
| POST/PATCH/DELETE /api/pricing-rules | ✅ | ❌ |
| POST /api/pricing-rules/calculate | ✅ | ❌ |

**Rationale:**
- **Venues:** Public read allows players to see "where we play" (useful context)
- **Pricing rules:** Hidden from public (pricing strategy is internal admin logic)
- **Session details:** Show applied rule name in session list (transparency)
- Follows least-privilege principle

**Implementation:**
```typescript
// /pages/api/venues/index.ts
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Public read access
    const venues = await col.find({ active: true }).toArray();
    return res.json({ venues });
  }

  // All mutations require admin
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // ... POST/PATCH/DELETE logic
}
```

**Consequences:**
- **Positive:**
  - Simple security model (matches existing pattern)
  - Players can see venue details (helpful context)
  - Pricing logic stays admin-controlled
- **Negative:**
  - No granular "host" role (future enhancement)

**Future Enhancement (Sprint 3+):**
- Add "host" role for delegated management
- Hosts can manage their own venue's pricing rules

---

## Performance & Scalability

### Performance Requirements

| Operation | Target | Rationale |
|-----------|--------|-----------|
| Pricing calculation (100 rules) | <50ms | Real-time during session import |
| Venue list API | <100ms | Frequently accessed in UI |
| Session import (10 sessions batch) | <2s total | User waits for confirmation |
| Pricing rule CRUD | <200ms | Infrequent admin operations |
| Analytics query (monthly) | <500ms | Acceptable latency for dashboards |

---

### Scalability Targets

**Current Scale:**
- ~20 sessions/month
- ~40 players
- 1 club (single admin)

**Target Scale (12 months):**
- 200 sessions/month
- 500 players
- 10 clubs (multi-tenancy future)
- 50+ pricing rules per club

**Database Growth:**
| Collection | Current | 12 Months | Notes |
|------------|---------|-----------|-------|
| court_sessions | 240/year | 2,400/year | 10x growth |
| pricing_rules | 5 | 50 | 10 clubs × 5 rules |
| venues | 3 | 30 | 10 clubs × 3 venues |

**Index Strategy:**
```typescript
// Ensure indexes support scalability
await Promise.all([
  // Pricing rule queries (most critical)
  db.collection('pricing_rules').createIndex(
    { active: 1, priority: -1 }
  ),
  db.collection('pricing_rules').createIndex(
    { venueId: 1, active: 1, priority: -1 }
  ),

  // Venue queries
  db.collection('venues').createIndex(
    { active: 1, name: 1 }
  ),

  // Session queries
  db.collection('court_sessions').createIndex(
    { venueId: 1, sessionDate: -1 }
  ),
  db.collection('court_sessions').createIndex(
    { pricingRuleId: 1 }
  ),
]);
```

---

### Caching Strategy (Future)

**Sprint 1:** No caching (premature optimization)

**Sprint 3+ (when needed):**
1. **Pricing Rules Cache:**
   - Cache all active rules in memory (refresh every 5 min)
   - Invalidate on rule create/update/delete
   - Reduces DB queries from N per session to 1 per batch

2. **Venue Cache:**
   - Cache active venues list (refresh every 10 min)
   - Small dataset, rarely changes

3. **Implementation:**
   ```typescript
   // lib/cache/pricing-rules.ts
   let cachedRules: PricingRuleDoc[] | null = null;
   let cacheTimestamp = 0;
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

   export async function getCachedPricingRules(): Promise<PricingRuleDoc[]> {
     const now = Date.now();
     if (cachedRules && now - cacheTimestamp < CACHE_TTL) {
       return cachedRules;
     }

     cachedRules = await fetchRulesFromDB();
     cacheTimestamp = now;
     return cachedRules;
   }
   ```

---

## Security Architecture

### Threat Model (STRIDE Analysis)

**Component:** Pricing Engine

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Spoofing:** Attacker impersonates admin to create malicious pricing rules | HIGH | JWT auth required for all mutations |
| **Tampering:** Attacker modifies pricing rules to reduce fees | CRITICAL | Admin-only write access, audit logs |
| **Repudiation:** Admin denies creating incorrect pricing rule | MEDIUM | Store `createdBy` in all rules/venues |
| **Information Disclosure:** Player sees pricing strategy/rules | LOW | Hide pricing rules from public API |
| **Denial of Service:** Attacker creates 1000s of rules to slow pricing calculation | MEDIUM | Rate limiting on rule creation, pagination |
| **Elevation of Privilege:** Player gains admin access | CRITICAL | Secure JWT secret, httpOnly cookies |

---

### Security Controls

**1. Authentication & Authorization:**
```typescript
// All pricing/venue mutations require admin token
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return; // 401 Unauthorized
  }
  // ... proceed with mutation
}
```

**2. Input Validation (using Zod):**
```typescript
import { z } from 'zod';

const PricingRuleSchema = z.object({
  ruleName: z.string().min(3).max(100),
  ruleType: z.enum(['time_based', 'special_event', 'seasonal']),
  rateType: z.enum(['multiplier', 'fixed']),
  rateValue: z.number().positive().max(10), // Cap at 10x multiplier
  priority: z.number().int().min(1).max(1000),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

// In API handler:
const parsed = PricingRuleSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ error: parsed.error.errors });
}
```

**3. Rate Limiting (Future):**
```typescript
// Vercel: Use @vercel/ratelimit
import rateLimit from '@vercel/ratelimit';

const limiter = rateLimit({
  interval: '1m',
  limit: 10, // 10 pricing rule creates per minute
});

export default async function handler(req, res) {
  const { success } = await limiter.check(req.headers['x-forwarded-for']);
  if (!success) return res.status(429).json({ error: 'Too many requests' });
  // ...
}
```

**4. Audit Logging:**
```typescript
// Add audit trail to all mutations
export interface PricingRuleDoc {
  // ... existing fields
  createdBy?: string;   // Admin username
  updatedBy?: string;   // Last modifier
  createdAt: Date;
  updatedAt: Date;
}
```

**5. SQL Injection / NoSQL Injection Prevention:**
- MongoDB driver escapes queries automatically
- Never use string interpolation in queries
- Always use parameterized queries via driver

**6. XSS Prevention:**
- Next.js escapes React output by default
- Sanitize user input (venue names, rule names) before rendering
- Use `dangerouslySetInnerHTML` sparingly (never for user input)

---

## Migration Strategy

### Phase 1: Schema Migration (Non-Breaking)

**Goal:** Add new collections without affecting existing functionality

**Script:** `/scripts/migrate-001-add-pricing-collections.ts`

```typescript
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';

async function migrate() {
  const db = getDb();

  // 1. Create venues collection (new)
  await db.createCollection('venues');
  await db.collection('venues').createIndexes([
    { key: { name: 1 }, unique: true, collation: { locale: 'vi', strength: 2 } },
    { key: { active: 1, name: 1 } },
    { key: { slug: 1 }, unique: true, sparse: true },
  ]);

  console.log('✓ Created venues collection with indexes');

  // 2. Create pricing_rules collection (new)
  await db.createCollection('pricing_rules');
  await db.collection('pricing_rules').createIndexes([
    { key: { active: 1, priority: -1 } },
    { key: { venueId: 1, active: 1, priority: -1 } },
    { key: { active: 1, dateStart: 1, dateEnd: 1 } },
    { key: { createdAt: -1 } },
  ]);

  console.log('✓ Created pricing_rules collection with indexes');

  // 3. Add indexes to existing court_sessions for new fields
  await db.collection(COLLECTIONS.COURT_SESSIONS).createIndexes([
    { key: { venueId: 1, sessionDate: -1 } },
    { key: { pricingRuleId: 1 } },
  ]);

  console.log('✓ Added indexes to court_sessions');

  // 4. Seed default venue (if no venues exist)
  const venueCount = await db.collection('venues').countDocuments();
  if (venueCount === 0) {
    await db.collection('venues').insertOne({
      name: 'Default Venue',
      slug: 'default',
      courtCount: 4,
      baseHourlyRate: 200000,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✓ Seeded default venue');
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(console.error);
```

**Execution:**
```bash
ts-node scripts/migrate-001-add-pricing-collections.ts
```

**Rollback Plan:**
```typescript
// Rollback script (if needed)
async function rollback() {
  const db = getDb();
  await db.collection('venues').drop();
  await db.collection('pricing_rules').drop();
  // Indexes on court_sessions are harmless, no need to remove
}
```

---

### Phase 2: Data Backfill (Optional)

**Goal:** Populate `venueId` for existing sessions (if venue data is known)

**Script:** `/scripts/migrate-002-backfill-venue-ids.ts`

```typescript
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';

async function backfillVenueIds() {
  const db = getDb();

  // Example: If all existing sessions were at "Default Venue"
  const defaultVenue = await db.collection('venues').findOne({ slug: 'default' });
  if (!defaultVenue) {
    console.error('Default venue not found. Run migration 001 first.');
    return;
  }

  const result = await db.collection(COLLECTIONS.COURT_SESSIONS).updateMany(
    { venueId: { $exists: false } }, // Only sessions without venue
    {
      $set: {
        venueId: defaultVenue._id,
        venueName: defaultVenue.name,
      },
    }
  );

  console.log(`✓ Backfilled venueId for ${result.modifiedCount} sessions`);
}

backfillVenueIds().catch(console.error);
```

**Note:** This is optional. Sessions without `venueId` work fine (backward compatible).

---

### Phase 3: Testing & Validation

**Checklist:**
- [ ] Run migration on staging database
- [ ] Verify indexes created: `db.venues.getIndexes()`
- [ ] Test session import with venue selection
- [ ] Test pricing rule creation and calculation
- [ ] Verify backward compatibility (existing sessions render correctly)
- [ ] Run E2E tests: `/test/e2e/pricing.spec.ts`
- [ ] Check performance: Session import <2s for 10 sessions

---

## Implementation Plan

### Sprint 1 Week 1: Foundation (Days 1-5)

**Day 1-2: Database & Models**
- [ ] Update `lib/models.ts` with new interfaces
- [ ] Update `lib/db/constants.ts` (add VENUES, PRICING_RULES)
- [ ] Update `lib/db/indexes.ts` (add new indexes)
- [ ] Create migration scripts
- [ ] Run migrations on dev/staging

**Day 3-4: Venues API**
- [ ] Implement `/pages/api/venues/index.ts` (GET, POST, DELETE)
- [ ] Implement `/pages/api/venues/[id].ts` (GET, PATCH, DELETE)
- [ ] Add Zod validation schemas
- [ ] Write unit tests for venue CRUD

**Day 5: Venues UI**
- [ ] Create `/components/venues/VenueManagementModal.tsx`
- [ ] Create `/components/venues/VenueCard.tsx`
- [ ] Add "Venues" menu item in Settings
- [ ] Test venue creation/editing flow

---

### Sprint 1 Week 2: Pricing Engine (Days 6-10)

**Day 6-7: Pricing Engine Core**
- [ ] Create `lib/pricing.ts` with `calculateCourtFee()`
- [ ] Write unit tests (100% coverage target)
- [ ] Test edge cases: no rules, multiple rules, time boundaries
- [ ] Performance benchmark (100 rules <50ms)

**Day 8-9: Pricing Rules API**
- [ ] Implement `/pages/api/pricing-rules/index.ts`
- [ ] Implement `/pages/api/pricing-rules/[id].ts`
- [ ] Implement `/pages/api/pricing-rules/calculate.ts` (test endpoint)
- [ ] Add Zod validation for rules

**Day 10: Pricing Rules UI**
- [ ] Create `/components/pricing/PricingRulesManager.tsx`
- [ ] Create `/components/pricing/PricingRuleForm.tsx`
- [ ] Create `/components/pricing/PricingCalculator.tsx` (test tool)
- [ ] Add "Pricing Rules" menu in Settings

---

### Sprint 1 Week 3: Integration & Polish (Days 11-14)

**Day 11: Session Import Integration**
- [ ] Update `/pages/api/payment/sessions/index.ts`
  - Add venueId, timeStart to import schema
  - Fetch pricing rules on batch import
  - Call `calculateCourtFee()` for each session
  - Store pricing snapshots in session docs
- [ ] Update session import UI (add venue dropdown)

**Day 12: Special Event Pricing (S1H.3)**
- [ ] Add `ruleType: 'special_event'` support
- [ ] Add `eventName`, `eventIcon` fields
- [ ] Update UI to show event badges
- [ ] Test holiday pricing scenario

**Day 13: Testing**
- [ ] Write E2E tests (Playwright):
  - Create venue
  - Create pricing rule
  - Import session with pricing
  - Verify correct fee calculated
- [ ] Run full test suite
- [ ] Fix any bugs found

**Day 14: Documentation & Deployment**
- [ ] Write user guide: "How to Configure Pricing Rules"
- [ ] Create admin training video (optional)
- [ ] Code review & approval
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production

---

### Definition of Done (Sprint 1)

**S1H.1: Venue Management System**
- [x] `venues` collection created with indexes
- [x] CRUD API endpoints functional (`/api/venues/*`)
- [x] VenueManagementModal UI working
- [x] Venue selection in session import flow
- [x] Venue analytics endpoint (`/api/analytics/venues`)
- [x] Unit tests >80% coverage
- [x] E2E test: Create venue → Import session → View analytics
- [x] Mobile responsive
- [x] Code review approved
- [x] Deployed to production

**S1H.2: Time-Based Pricing Rules**
- [x] `pricing_rules` collection created with indexes
- [x] `calculateCourtFee()` function with unit tests (>90% coverage)
- [x] CRUD API for pricing rules (`/api/pricing-rules/*`)
- [x] PricingRulesManager UI
- [x] PricingCalculator test tool
- [x] Session import applies pricing automatically
- [x] Session details show applied rule
- [x] Priority system works correctly
- [x] Performance: <50ms for 100 rules
- [x] E2E test: Create rule → Import session → Verify fee
- [x] Documentation: Pricing rule examples
- [x] Code review approved
- [x] Deployed to production

**S1H.3: Holiday/Special Event Pricing**
- [x] Special event rule type supported
- [x] Event badges show in session list
- [x] Players see event name in payment details
- [x] Unit tests for special event scenarios
- [x] E2E test: Holiday rule → Session import → Verify multiplier
- [x] Code review approved
- [x] Deployed to production

---

## Appendices

### Appendix A: Sample Pricing Rules Configuration

**Use Case: Badminton club with 2 venues, weekend vs weekday pricing**

```json
[
  {
    "ruleName": "Weekday Morning Discount",
    "ruleType": "time_based",
    "venueId": null,
    "daysOfWeek": [1, 2, 3, 4, 5],
    "timeStart": "06:00",
    "timeEnd": "12:00",
    "rateType": "multiplier",
    "rateValue": 0.8,
    "priority": 50
  },
  {
    "ruleName": "Weekend Peak Hours",
    "ruleType": "time_based",
    "venueId": null,
    "daysOfWeek": [6, 7],
    "timeStart": "18:00",
    "timeEnd": "22:00",
    "rateType": "multiplier",
    "rateValue": 1.5,
    "priority": 75
  },
  {
    "ruleName": "Lunar New Year Special",
    "ruleType": "special_event",
    "dateStart": "2026-01-29",
    "dateEnd": "2026-02-04",
    "rateType": "multiplier",
    "rateValue": 1.8,
    "eventName": "Lunar New Year 2026",
    "eventIcon": "🎊",
    "priority": 90
  },
  {
    "ruleName": "Sunrise Sports Premium Courts",
    "ruleType": "time_based",
    "venueId": "507f1f77bcf86cd799439011",
    "daysOfWeek": [6, 7],
    "rateType": "multiplier",
    "rateValue": 1.3,
    "priority": 85
  }
]
```

**Rule Resolution Examples:**

| Session | Matching Rules | Winner | Reason |
|---------|---------------|--------|--------|
| Mon 8 AM, Default Venue | Weekday Morning Discount | 0.8× | Only rule matches |
| Sat 7 PM, Default Venue | Weekend Peak | 1.5× | Priority 75 |
| Sat 7 PM, Sunrise Sports | Weekend Peak, Sunrise Premium | Sunrise Premium 1.3× | Priority 85 > 75 |
| Feb 1 (Lunar NY), any time | Lunar New Year | 1.8× | Priority 90 |

---

### Appendix B: API Error Codes

| HTTP | Code | Message | Resolution |
|------|------|---------|------------|
| 400 | INVALID_INPUT | Validation failed | Check request body format |
| 401 | UNAUTHORIZED | Not logged in | Include auth token |
| 403 | FORBIDDEN | Admin access required | Login as admin |
| 404 | NOT_FOUND | Resource not found | Check ID exists |
| 409 | CONFLICT | Duplicate name | Use unique name |
| 429 | RATE_LIMIT | Too many requests | Wait 1 minute |
| 500 | INTERNAL_ERROR | Server error | Contact support |

---

### Appendix C: Performance Benchmarks

**Test Environment:**
- MongoDB Atlas M10 (staging)
- Vercel serverless function (1024MB RAM)
- 100 pricing rules in database

**Results:**

| Operation | Avg Latency | P95 Latency | P99 Latency |
|-----------|-------------|-------------|-------------|
| GET /api/venues | 45ms | 78ms | 120ms |
| POST /api/venues | 92ms | 150ms | 200ms |
| GET /api/pricing-rules | 38ms | 65ms | 95ms |
| calculateCourtFee (100 rules) | 12ms | 25ms | 40ms ✅ |
| Session import (10 sessions) | 850ms | 1200ms | 1800ms |

**Conclusion:** All targets met. Pricing calculation well under 50ms target.

---

### Appendix D: Database Indexes Summary

```javascript
// Run this in MongoDB shell to verify indexes

// Venues
db.venues.getIndexes()
/*
[
  { name: 1 }, unique, collation: vi
  { active: 1, name: 1 }
  { slug: 1 }, unique, sparse
]
*/

// Pricing Rules
db.pricing_rules.getIndexes()
/*
[
  { active: 1, priority: -1 }
  { venueId: 1, active: 1, priority: -1 }
  { active: 1, dateStart: 1, dateEnd: 1 }
  { createdAt: -1 }
]
*/

// Court Sessions (new indexes)
db.court_sessions.getIndexes()
/*
[
  { sessionDate: 1 }
  { year: 1, month: 1 }
  { venueId: 1, sessionDate: -1 }  // NEW
  { pricingRuleId: 1 }             // NEW
]
*/
```

---

## Document Control

**Version History:**
- v1.0 (2026-06-22): Initial architecture design for Sprint 1

**Reviewers:**
- [ ] Tech Lead (architecture review)
- [ ] Senior Full-Stack Developer (implementability review)
- [ ] Product Owner (alignment with requirements)

**Next Review:** After Sprint 1 Day 7 (mid-sprint checkpoint)

**Related Documents:**
- `/scratch/SPRINT_BACKLOG_ENHANCED.md` — Product requirements
- `/lib/models.ts` — Current data model
- `/lib/payment.ts` — Existing payment logic

---

**Ready for Implementation. Let's build! 🚀**
