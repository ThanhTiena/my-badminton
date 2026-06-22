# Sprint 1 Implementation Guide
**Practical Code Examples for Senior Full-Stack Developer**

**Date:** 2026-06-22
**Version:** 1.0

---

## Overview

This guide provides copy-paste-ready code examples for implementing Sprint 1 features. All code follows the existing SmashTour patterns and conventions.

**Prerequisite Reading:**
- `/scratch/SPRINT1_ARCHITECTURE_DESIGN.md` — Architecture decisions
- `/scratch/SPRINT1_C4_DIAGRAMS.md` — System diagrams

---

## Table of Contents

1. [Database Schema Updates](#1-database-schema-updates)
2. [Migration Scripts](#2-migration-scripts)
3. [Core Pricing Engine](#3-core-pricing-engine)
4. [API Endpoints](#4-api-endpoints)
5. [UI Components](#5-ui-components)
6. [Testing Examples](#6-testing-examples)

---

## 1. Database Schema Updates

### Step 1.1: Update `lib/models.ts`

Add these interfaces to `/lib/models.ts`:

```typescript
// ───────────────────────────────────────────────────────────────
// VENUE MANAGEMENT — VenueDoc (collection: "venues")
// ───────────────────────────────────────────────────────────────

export interface VenueDoc {
  _id?: ObjectId;
  name: string;                      // "Sunrise Sports Complex"
  slug: string;                      // "sunrise-sports" (URL-friendly)
  address?: string;                  // "123 Main St, District 1, HCMC"
  district?: string;                 // "District 1"
  courtCount: number;                // 8 courts available
  baseHourlyRate: number;            // 200,000 VND/hour (default)
  facilities?: string[];             // ["Parking", "Shower", "AC"]
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                // Admin username
}

// ───────────────────────────────────────────────────────────────
// PRICING RULES — PricingRuleDoc (collection: "pricing_rules")
// ───────────────────────────────────────────────────────────────

export type RuleType = 'time_based' | 'special_event' | 'seasonal';
export type RateType = 'multiplier' | 'fixed';
export type CombinationStrategy = 'multiply' | 'highest' | 'additive';

export interface PricingRuleDoc {
  _id?: ObjectId;

  // Rule Identity
  ruleName: string;
  ruleType: RuleType;

  // Scope
  venueId?: ObjectId;                // null = all venues
  venueName?: string;                // Snapshot

  // Day Pattern (ISO weekday: 1=Mon, 7=Sun)
  daysOfWeek?: number[];             // [6, 7] = Sat/Sun

  // Time Range (24-hour format HH:mm)
  timeStart?: string;                // "18:00"
  timeEnd?: string;                  // "21:00"

  // Date Range
  dateStart?: string;                // "2026-06-01" (ISO 8601)
  dateEnd?: string;                  // "2026-08-31"

  // Pricing
  rateType: RateType;
  rateValue: number;                 // 1.5 (multiplier) or 250000 (VND)

  // Special Event Metadata
  eventName?: string;                // "Lunar New Year 2026"
  eventIcon?: string;                // "🎊"

  // Overlapping Rules
  combinationStrategy?: CombinationStrategy;

  // Priority
  priority: number;                  // 1-1000 (higher = more specific)

  // Lifecycle
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// ───────────────────────────────────────────────────────────────
// UPDATE EXISTING CourtSessionDoc
// ───────────────────────────────────────────────────────────────

export interface CourtSessionDoc {
  // ... existing fields

  // NEW: Venue Reference
  venueId?: ObjectId;
  venueName?: string;                // Snapshot
  venueAddress?: string;

  // NEW: Pricing Rule Applied
  pricingRuleId?: ObjectId;
  pricingRuleName?: string;
  pricingRateApplied?: number;
  pricingRateType?: RateType;

  // NEW: Pricing Breakdown
  baseCourtFee?: number;             // Before rule
  // courtFee (existing) = final fee after rule

  // ... rest of existing fields
}
```

---

### Step 1.2: Update `lib/db/constants.ts`

```typescript
// Add new collections
export const COLLECTIONS = {
  PLAYERS:           'players',
  COURT_SESSIONS:    'court_sessions',
  PAYMENT_CONFIG:    'payment_config',
  PAYMENT_PAID:      'payment_paid',
  ACTIVE_TOURNAMENT: 'active_tournament',
  TOURNAMENT_HISTORY:'tournament_history',
  BETS:              'bets',
  USERS:             'users',

  // NEW Sprint 1:
  VENUES:            'venues',
  PRICING_RULES:     'pricing_rules',
} as const;
```

---

### Step 1.3: Update `lib/db/indexes.ts`

```typescript
export async function createIndexes() {
  const db = getDb();

  await Promise.all([
    // ... existing indexes

    // NEW: venues
    db.collection(COLLECTIONS.VENUES).createIndex(
      { name: 1 },
      { unique: true, collation: { locale: 'vi', strength: 2 } }
    ),
    db.collection(COLLECTIONS.VENUES).createIndex(
      { active: 1, name: 1 }
    ),
    db.collection(COLLECTIONS.VENUES).createIndex(
      { slug: 1 },
      { unique: true, sparse: true }
    ),

    // NEW: pricing_rules
    db.collection(COLLECTIONS.PRICING_RULES).createIndex(
      { active: 1, priority: -1 }
    ),
    db.collection(COLLECTIONS.PRICING_RULES).createIndex(
      { venueId: 1, active: 1, priority: -1 }
    ),
    db.collection(COLLECTIONS.PRICING_RULES).createIndex(
      { active: 1, dateStart: 1, dateEnd: 1 }
    ),
    db.collection(COLLECTIONS.PRICING_RULES).createIndex(
      { createdAt: -1 }
    ),

    // NEW: court_sessions (additional indexes)
    db.collection(COLLECTIONS.COURT_SESSIONS).createIndex(
      { venueId: 1, sessionDate: -1 }
    ),
    db.collection(COLLECTIONS.COURT_SESSIONS).createIndex(
      { pricingRuleId: 1 }
    ),
  ]);
}
```

---

## 2. Migration Scripts

### Script 2.1: Create Collections and Indexes

**File:** `/scripts/migrate-001-add-pricing-collections.ts`

```typescript
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { VenueDoc } from '@/lib/models';

async function migrate() {
  console.log('🚀 Migration 001: Adding pricing collections...\n');

  const db = getDb();

  // 1. Create venues collection
  try {
    await db.createCollection(COLLECTIONS.VENUES);
    console.log('✓ Created venues collection');
  } catch (err) {
    if ((err as Error).message.includes('already exists')) {
      console.log('⚠ venues collection already exists (skipping)');
    } else {
      throw err;
    }
  }

  // 2. Create venues indexes
  await db.collection(COLLECTIONS.VENUES).createIndexes([
    {
      key: { name: 1 },
      unique: true,
      collation: { locale: 'vi', strength: 2 },
      name: 'name_unique',
    },
    {
      key: { active: 1, name: 1 },
      name: 'active_name',
    },
    {
      key: { slug: 1 },
      unique: true,
      sparse: true,
      name: 'slug_unique',
    },
  ]);
  console.log('✓ Created venues indexes');

  // 3. Create pricing_rules collection
  try {
    await db.createCollection(COLLECTIONS.PRICING_RULES);
    console.log('✓ Created pricing_rules collection');
  } catch (err) {
    if ((err as Error).message.includes('already exists')) {
      console.log('⚠ pricing_rules collection already exists (skipping)');
    } else {
      throw err;
    }
  }

  // 4. Create pricing_rules indexes
  await db.collection(COLLECTIONS.PRICING_RULES).createIndexes([
    {
      key: { active: 1, priority: -1 },
      name: 'active_priority',
    },
    {
      key: { venueId: 1, active: 1, priority: -1 },
      name: 'venue_active_priority',
    },
    {
      key: { active: 1, dateStart: 1, dateEnd: 1 },
      name: 'active_daterange',
    },
    {
      key: { createdAt: -1 },
      name: 'created_desc',
    },
  ]);
  console.log('✓ Created pricing_rules indexes');

  // 5. Add new indexes to court_sessions
  await db.collection(COLLECTIONS.COURT_SESSIONS).createIndexes([
    {
      key: { venueId: 1, sessionDate: -1 },
      name: 'venue_date',
    },
    {
      key: { pricingRuleId: 1 },
      name: 'pricing_rule',
    },
  ]);
  console.log('✓ Added indexes to court_sessions');

  // 6. Seed default venue (if no venues exist)
  const venueCount = await db.collection(COLLECTIONS.VENUES).countDocuments();
  if (venueCount === 0) {
    const defaultVenue: VenueDoc = {
      name: 'Default Venue',
      slug: 'default',
      courtCount: 4,
      baseHourlyRate: 200000,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTIONS.VENUES).insertOne(defaultVenue);
    console.log('✓ Seeded default venue');
  } else {
    console.log(`⚠ Skipped venue seed (${venueCount} venues exist)`);
  }

  console.log('\n✅ Migration 001 complete!\n');
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
```

**Run migration:**
```bash
npx ts-node scripts/migrate-001-add-pricing-collections.ts
```

---

## 3. Core Pricing Engine

### File 3.1: `/lib/pricing.ts`

```typescript
/**
 * lib/pricing.ts
 * ───────────────────────────────────────────────────────────────
 * Pricing calculation engine — pure functions, zero side effects.
 * ───────────────────────────────────────────────────────────────
 */

import type { ObjectId } from 'mongodb';
import type { PricingRuleDoc } from './models';

/* ── Input/Output Types ────────────────────────────────────── */

export interface PricingCalculationInput {
  venueId?: string | ObjectId;
  sessionDate: string;                // "2026-06-28" (YYYY-MM-DD)
  timeStart?: string;                 // "19:00" (HH:mm)
  duration?: number;                  // Hours (optional)
  baseRate?: number;                  // VND per hour
}

export interface AppliedPricingRule {
  ruleId: string;
  ruleName: string;
  ruleType: 'time_based' | 'special_event' | 'seasonal';
  rateType: 'multiplier' | 'fixed';
  rateValue: number;
  priority: number;
  reason: string;
}

export interface PricingCalculationResult {
  baseCourtFee: number;
  appliedRules: AppliedPricingRule[];
  finalCourtFee: number;
  breakdown: string[];
}

/* ── Core Pricing Function ─────────────────────────────────── */

/**
 * Calculate court fee by applying pricing rules.
 *
 * Algorithm:
 *   1. Filter rules matching venue, date, day, time
 *   2. Sort by priority (descending)
 *   3. Apply highest priority rule
 *   4. Return breakdown
 */
export function calculateCourtFee(
  input: PricingCalculationInput,
  allRules: PricingRuleDoc[]
): PricingCalculationResult {
  const { venueId, sessionDate, timeStart, baseRate = 200000 } = input;

  const baseCourtFee = baseRate;

  // Parse session metadata
  const sessionDay = getISOWeekday(sessionDate);
  const sessionTime = timeStart ? parseTime(timeStart) : null;

  // Step 1: Filter matching rules
  const matchingRules = allRules.filter((rule) => {
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
    if (rule.timeStart && rule.timeEnd && sessionTime !== null) {
      const ruleStart = parseTime(rule.timeStart);
      const ruleEnd = parseTime(rule.timeEnd);
      if (sessionTime < ruleStart || sessionTime >= ruleEnd) {
        return false;
      }
    }

    return true;
  });

  // Step 2: Sort by priority (highest first)
  matchingRules.sort((a, b) => b.priority - a.priority);

  // Step 3: No rules matched
  if (matchingRules.length === 0) {
    return {
      baseCourtFee,
      appliedRules: [],
      finalCourtFee: baseCourtFee,
      breakdown: [`Base rate: ${formatVND(baseCourtFee)} (no rules applied)`],
    };
  }

  // Step 4: Apply highest priority rule
  const topRule = matchingRules[0];

  let finalFee = baseCourtFee;
  const breakdown: string[] = [`Base rate: ${formatVND(baseCourtFee)}`];

  if (topRule.rateType === 'multiplier') {
    finalFee = baseCourtFee * topRule.rateValue;
    breakdown.push(
      `Applied "${topRule.ruleName}" (×${topRule.rateValue}): ${formatVND(finalFee)}`
    );
  } else {
    finalFee = topRule.rateValue;
    breakdown.push(
      `Applied "${topRule.ruleName}" (fixed rate): ${formatVND(finalFee)}`
    );
  }

  const appliedRules: AppliedPricingRule[] = [
    {
      ruleId: topRule._id!.toString(),
      ruleName: topRule.ruleName,
      ruleType: topRule.ruleType,
      rateType: topRule.rateType,
      rateValue: topRule.rateValue,
      priority: topRule.priority,
      reason: buildRuleReason(topRule, sessionDate, sessionTime),
    },
  ];

  return {
    baseCourtFee,
    appliedRules,
    finalCourtFee: Math.round(finalFee),
    breakdown,
  };
}

/* ── Helper Functions ──────────────────────────────────────── */

/**
 * Get ISO weekday: 1=Monday, 7=Sunday
 */
function getISOWeekday(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day === 0 ? 7 : day;
}

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Build human-readable reason
 */
function buildRuleReason(
  rule: PricingRuleDoc,
  sessionDate: string,
  sessionTime: number | null
): string {
  const parts: string[] = [];

  if (rule.venueId) parts.push('venue-specific');
  if (rule.daysOfWeek) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = rule.daysOfWeek.map((d) => days[d - 1]);
    parts.push(dayNames.join('/'));
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

/* ── Slug Generator ────────────────────────────────────────── */

/**
 * Generate URL-friendly slug from venue name
 * "Sunrise Sports Complex" → "sunrise-sports-complex"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Spaces to hyphens
    .replace(/-+/g, '-');     // Collapse multiple hyphens
}
```

---

## 4. API Endpoints

### Endpoint 4.1: Venues CRUD

**File:** `/pages/api/venues/index.ts`

```typescript
// GET    /api/venues — public (active venues only) or admin (all)
// POST   /api/venues — admin only
// DELETE /api/venues — admin only (soft delete)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { VenueDoc } from '@/lib/models';
import { generateSlug } from '@/lib/pricing';
import { z } from 'zod';

const VenueSchema = z.object({
  name: z.string().min(3).max(100),
  address: z.string().optional(),
  district: z.string().optional(),
  courtCount: z.number().int().min(1).max(50),
  baseHourlyRate: z.number().min(0),
  facilities: z.array(z.string()).optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  const col = db.collection<VenueDoc>(COLLECTIONS.VENUES);

  // ── GET ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { all } = req.query as { all?: string };

    // Admin can see all venues; public sees active only
    const isAdmin = await requireAdmin(req, res, { skipResponse: true });
    const filter = isAdmin && all === 'true' ? {} : { active: true };

    const venues = await col.find(filter).sort({ name: 1 }).toArray();
    return res.status(200).json({ venues, total: venues.length });
  }

  // ── POST ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const parsed = VenueSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const data = parsed.data;

    // Check unique name (case-insensitive)
    const existing = await col.findOne(
      { name: data.name },
      { collation: { locale: 'vi', strength: 2 } }
    );
    if (existing) {
      return res.status(409).json({ error: 'Venue name already exists' });
    }

    const venue: VenueDoc = {
      ...data,
      slug: generateSlug(data.name),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin.username,
    };

    const result = await col.insertOne(venue);
    return res.status(201).json({ ...venue, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}

// Extend requireAdmin to support skipResponse
declare module '@/lib/auth/middleware' {
  export function requireAdmin(
    req: NextApiRequest,
    res: NextApiResponse,
    options?: { skipResponse?: boolean }
  ): Promise<any>;
}
```

---

**File:** `/pages/api/venues/[id].ts`

```typescript
// GET    /api/venues/:id — public
// PATCH  /api/venues/:id — admin only
// DELETE /api/venues/:id — admin only (soft delete)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { VenueDoc } from '@/lib/models';
import { z } from 'zod';

const VenueUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  address: z.string().optional(),
  courtCount: z.number().int().min(1).max(50).optional(),
  baseHourlyRate: z.number().min(0).optional(),
  facilities: z.array(z.string()).optional(),
  notes: z.string().optional(),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid venue ID' });
  }

  const db = getDb();
  const col = db.collection<VenueDoc>(COLLECTIONS.VENUES);

  // ── GET ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const venue = await col.findOne({ _id: new ObjectId(id) });
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    return res.status(200).json(venue);
  }

  // ── PATCH ────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const parsed = VenueUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const updates = parsed.data;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    return res.status(200).json(result.value);
  }

  // ── DELETE (Soft) ────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    // Check if any active sessions reference this venue
    const sessionCount = await db
      .collection(COLLECTIONS.COURT_SESSIONS)
      .countDocuments({ venueId: new ObjectId(id) });

    if (sessionCount > 0) {
      return res.status(400).json({
        error: `Cannot delete venue: ${sessionCount} sessions reference it`,
      });
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { active: false, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    return res.status(200).json({ deleted: true, venueId: id });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).end();
}
```

---

### Endpoint 4.2: Pricing Rules CRUD

**File:** `/pages/api/pricing-rules/index.ts`

```typescript
// GET  /api/pricing-rules — admin only
// POST /api/pricing-rules — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PricingRuleDoc } from '@/lib/models';
import { z } from 'zod';

const PricingRuleSchema = z.object({
  ruleName: z.string().min(3).max(100),
  ruleType: z.enum(['time_based', 'special_event', 'seasonal']),
  venueId: z.string().optional(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rateType: z.enum(['multiplier', 'fixed']),
  rateValue: z.number().positive().max(10),
  eventName: z.string().optional(),
  eventIcon: z.string().optional(),
  priority: z.number().int().min(1).max(1000).default(50),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();
  const col = db.collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES);

  // ── GET ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { venueId, active } = req.query as { venueId?: string; active?: string };

    const filter: Record<string, any> = {};
    if (venueId) filter.venueId = new ObjectId(venueId);
    if (active === 'true') filter.active = true;
    if (active === 'false') filter.active = false;

    const rules = await col
      .find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .toArray();

    return res.status(200).json({ rules, total: rules.length });
  }

  // ── POST ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const parsed = PricingRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const data = parsed.data;

    // Fetch venue snapshot if venueId provided
    let venueName: string | undefined;
    if (data.venueId) {
      const venue = await db
        .collection(COLLECTIONS.VENUES)
        .findOne({ _id: new ObjectId(data.venueId) });
      if (!venue) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      venueName = venue.name;
    }

    const rule: PricingRuleDoc = {
      ...data,
      venueId: data.venueId ? new ObjectId(data.venueId) : undefined,
      venueName,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin.username,
    };

    const result = await col.insertOne(rule);
    return res.status(201).json({ ...rule, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
```

---

### Endpoint 4.3: Pricing Calculator (Test Endpoint)

**File:** `/pages/api/pricing-rules/calculate.ts`

```typescript
// POST /api/pricing-rules/calculate — admin only (dry-run test)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PricingRuleDoc } from '@/lib/models';
import { calculateCourtFee } from '@/lib/pricing';
import { z } from 'zod';

const CalculateInputSchema = z.object({
  venueId: z.string().optional(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  duration: z.number().positive().optional(),
  baseRate: z.number().positive().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const parsed = CalculateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }

  const input = parsed.data;

  const db = getDb();

  // Fetch all active rules
  const allRules = await db
    .collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES)
    .find({ active: true })
    .sort({ priority: -1 })
    .toArray();

  // Calculate
  const result = calculateCourtFee(
    {
      venueId: input.venueId,
      sessionDate: input.sessionDate,
      timeStart: input.timeStart,
      baseRate: input.baseRate,
    },
    allRules
  );

  return res.status(200).json(result);
}
```

---

### Endpoint 4.4: Update Session Import

**Modify existing:** `/pages/api/payment/sessions/index.ts`

Add pricing integration to the POST handler:

```typescript
// ... existing imports
import { calculateCourtFee } from '@/lib/pricing';
import type { PricingRuleDoc, VenueDoc } from '@/lib/models';

// In POST handler, after parsing import rows:

if (req.method === 'POST') {
  const body = req.body as (ImportRow & {
    venueId?: string;
    timeStart?: string;
    duration?: number;
  })[];

  // ... existing validation

  // NEW: Fetch all active pricing rules once
  const allRules = await db
    .collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES)
    .find({ active: true })
    .sort({ priority: -1 })
    .toArray();

  const allConfigs = await cfgCol.find({}).toArray();
  const cfgMap = new Map<string, { smashWeight: number; courtRate: number; shuttleRate: number }>();
  for (const cfg of allConfigs) {
    cfgMap.set(cfg.playerName.toLowerCase(), {
      smashWeight: cfg.smashWeight,
      courtRate: cfg.courtRate ?? 1.0,
      shuttleRate: cfg.shuttleRate ?? 1.0,
    });
  }

  const docs: CourtSessionDoc[] = [];

  for (const row of body) {
    const date = new Date(row.date);

    // NEW: Fetch venue snapshot if venueId provided
    let venueName: string | undefined;
    let venueAddress: string | undefined;
    let baseRate = row.courtFee; // Default to provided courtFee

    if (row.venueId) {
      const venue = await db
        .collection<VenueDoc>(COLLECTIONS.VENUES)
        .findOne({ _id: new ObjectId(row.venueId) });

      if (venue) {
        venueName = venue.name;
        venueAddress = venue.address;
        baseRate = venue.baseHourlyRate * (row.duration ?? 2); // Default 2 hours
      }
    }

    // NEW: Calculate pricing if venue and time provided
    let pricingResult;
    let finalCourtFee = row.courtFee;

    if (row.venueId && row.timeStart) {
      pricingResult = calculateCourtFee(
        {
          venueId: row.venueId,
          sessionDate: row.date,
          timeStart: row.timeStart,
          baseRate,
        },
        allRules
      );

      finalCourtFee = pricingResult.finalCourtFee;
    }

    // Prepare player data
    const playersWithWeight = row.players.map((name) => {
      const cfg = cfgMap.get(name.toLowerCase());
      return {
        name,
        smashWeight: cfg?.smashWeight ?? 1.0,
        courtRate: cfg?.courtRate ?? 1.0,
        shuttleRate: cfg?.shuttleRate ?? 1.0,
      };
    });

    // Compute session amounts
    const { shuttlecockTotal, totalCost, players } = computeSessionAmounts({
      players: playersWithWeight,
      courtFee: finalCourtFee,
      numShuttlecocks: row.numShuttlecocks,
      shuttlecockUnitPrice: row.shuttlecockUnitPrice,
    });

    // Build session doc
    const session: CourtSessionDoc = {
      sessionDate: row.date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      week: getISOWeek(row.date),

      // Venue data (NEW)
      venueId: row.venueId ? new ObjectId(row.venueId) : undefined,
      venueName,
      venueAddress,

      // Pricing data (NEW)
      pricingRuleId: pricingResult?.appliedRules[0]?.ruleId
        ? new ObjectId(pricingResult.appliedRules[0].ruleId)
        : undefined,
      pricingRuleName: pricingResult?.appliedRules[0]?.ruleName,
      pricingRateApplied: pricingResult?.appliedRules[0]?.rateValue,
      pricingRateType: pricingResult?.appliedRules[0]?.rateType,
      baseCourtFee: pricingResult?.baseCourtFee ?? row.courtFee,

      courtFee: finalCourtFee,
      numShuttlecocks: row.numShuttlecocks,
      shuttlecockUnitPrice: row.shuttlecockUnitPrice,
      shuttlecockTotal,
      totalCost,
      players,
      note: row.note,
      shuttlecocksBulkPurchase: row.shuttlecocksBulkPurchase ?? false,
      importedAt: new Date(),
    };

    docs.push(session);
  }

  const result = await col.insertMany(docs);
  const ids = Object.values(result.insertedIds);
  const sessions = await col.find({ _id: { $in: ids } }).sort({ sessionDate: 1 }).toArray();

  return res.status(201).json({ inserted: result.insertedCount, sessions });
}
```

---

## 5. UI Components

### Component 5.1: Venue Management Modal

**File:** `/components/venues/VenueManagementModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { VenueDoc } from '@/lib/models';

export default function VenueManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [venues, setVenues] = useState<VenueDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVenues();
    }
  }, [isOpen]);

  async function fetchVenues() {
    setLoading(true);
    const res = await fetch('/api/venues');
    const data = await res.json();
    setVenues(data.venues || []);
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Venue Management</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>

        {loading ? (
          <p>Loading venues...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues.map((venue) => (
              <VenueCard key={venue._id?.toString()} venue={venue} onUpdate={fetchVenues} />
            ))}
          </div>
        )}

        <button
          onClick={() => {/* Open VenueForm modal */}}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Venue
        </button>
      </div>
    </div>
  );
}

function VenueCard({ venue, onUpdate }: { venue: VenueDoc; onUpdate: () => void }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="text-lg font-bold">{venue.name}</h3>
      <p className="text-sm text-gray-600">{venue.address}</p>
      <div className="mt-2 flex gap-2">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {venue.courtCount} courts
        </span>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          {venue.baseHourlyRate.toLocaleString()} ₫/hr
        </span>
      </div>
      <div className="mt-2">
        {venue.facilities?.map((f) => (
          <span key={f} className="text-xs bg-gray-200 px-2 py-1 rounded mr-1">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

### Component 5.2: Pricing Calculator

**File:** `/components/pricing/PricingCalculator.tsx`

```typescript
'use client';

import { useState } from 'react';
import type { PricingCalculationResult } from '@/lib/pricing';

export default function PricingCalculator() {
  const [venueId, setVenueId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [baseRate, setBaseRate] = useState('200000');
  const [result, setResult] = useState<PricingCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCalculate() {
    setLoading(true);

    const res = await fetch('/api/pricing-rules/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: venueId || undefined,
        sessionDate,
        timeStart: timeStart || undefined,
        baseRate: Number(baseRate),
      }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Pricing Calculator</h3>

      <div className="space-y-3">
        <input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Session Date"
        />

        <input
          type="time"
          value={timeStart}
          onChange={(e) => setTimeStart(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Start Time"
        />

        <input
          type="number"
          value={baseRate}
          onChange={(e) => setBaseRate(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Base Rate (VND)"
        />

        <button
          onClick={handleCalculate}
          disabled={!sessionDate || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Fee'}
        </button>
      </div>

      {result && (
        <div className="mt-6 border-t pt-4">
          <h4 className="font-bold mb-2">Result:</h4>
          <div className="space-y-2">
            <p>Base Fee: {result.baseCourtFee.toLocaleString()} ₫</p>
            <p className="text-xl font-bold text-green-600">
              Final Fee: {result.finalCourtFee.toLocaleString()} ₫
            </p>
            {result.appliedRules.length > 0 && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold">Applied Rule:</p>
                <p>{result.appliedRules[0].ruleName}</p>
                <p className="text-sm text-gray-600">{result.appliedRules[0].reason}</p>
              </div>
            )}
            <div className="text-sm text-gray-700">
              {result.breakdown.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Testing Examples

### Test 6.1: Pricing Engine Unit Tests

**File:** `/tests/unit/pricing.test.ts`

```typescript
import { calculateCourtFee } from '@/lib/pricing';
import type { PricingRuleDoc } from '@/lib/models';
import { ObjectId } from 'mongodb';

describe('Pricing Engine', () => {
  const mockRules: PricingRuleDoc[] = [
    {
      _id: new ObjectId(),
      ruleName: 'Weekend Peak',
      ruleType: 'time_based',
      daysOfWeek: [6, 7], // Sat, Sun
      timeStart: '18:00',
      timeEnd: '22:00',
      rateType: 'multiplier',
      rateValue: 1.5,
      priority: 75,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new ObjectId(),
      ruleName: 'Weekday Discount',
      ruleType: 'time_based',
      daysOfWeek: [1, 2, 3, 4, 5],
      rateType: 'multiplier',
      rateValue: 0.8,
      priority: 50,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('should apply weekend peak pricing', () => {
    const result = calculateCourtFee(
      {
        sessionDate: '2026-06-27', // Saturday
        timeStart: '19:00',
        baseRate: 200000,
      },
      mockRules
    );

    expect(result.finalCourtFee).toBe(300000); // 200k × 1.5
    expect(result.appliedRules[0].ruleName).toBe('Weekend Peak');
  });

  it('should apply weekday discount', () => {
    const result = calculateCourtFee(
      {
        sessionDate: '2026-06-23', // Monday
        timeStart: '19:00',
        baseRate: 200000,
      },
      mockRules
    );

    expect(result.finalCourtFee).toBe(160000); // 200k × 0.8
    expect(result.appliedRules[0].ruleName).toBe('Weekday Discount');
  });

  it('should return base rate if no rules match', () => {
    const result = calculateCourtFee(
      {
        sessionDate: '2026-06-27', // Saturday
        timeStart: '10:00', // Outside peak hours
        baseRate: 200000,
      },
      mockRules
    );

    expect(result.finalCourtFee).toBe(200000);
    expect(result.appliedRules).toHaveLength(0);
  });

  it('should prioritize higher priority rules', () => {
    const highPriorityRule: PricingRuleDoc = {
      _id: new ObjectId(),
      ruleName: 'VIP Event',
      ruleType: 'special_event',
      dateStart: '2026-06-27',
      dateEnd: '2026-06-27',
      rateType: 'multiplier',
      rateValue: 2.0,
      priority: 100, // Highest
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = calculateCourtFee(
      {
        sessionDate: '2026-06-27', // Matches both weekend and VIP
        timeStart: '19:00',
        baseRate: 200000,
      },
      [...mockRules, highPriorityRule]
    );

    expect(result.finalCourtFee).toBe(400000); // 200k × 2.0 (VIP wins)
    expect(result.appliedRules[0].ruleName).toBe('VIP Event');
  });
});
```

---

### Test 6.2: E2E Test (Playwright)

**File:** `/tests/e2e/pricing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pricing System E2E', () => {
  test('should create venue and pricing rule, then import session', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[name=username]', 'admin');
    await page.fill('input[name=password]', 'admin123');
    await page.click('button:has-text("Login")');

    // 2. Create venue
    await page.click('text=Settings');
    await page.click('text=Venues');
    await page.click('text=Add Venue');
    await page.fill('input[name=name]', 'Test Venue');
    await page.fill('input[name=courtCount]', '4');
    await page.fill('input[name=baseHourlyRate]', '250000');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Test Venue')).toBeVisible();

    // 3. Create pricing rule
    await page.click('text=Pricing Rules');
    await page.click('text=Add Rule');
    await page.fill('input[name=ruleName]', 'Weekend Test');
    await page.selectOption('select[name=ruleType]', 'time_based');
    await page.selectOption('select[name=daysOfWeek]', ['6', '7']);
    await page.fill('input[name=rateValue]', '1.5');
    await page.fill('input[name=priority]', '80');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Weekend Test')).toBeVisible();

    // 4. Import session with pricing
    await page.click('text=Payments');
    await page.click('text=Import Sessions');
    const csv = `date,players,court_fee,num_shuttlecocks,shuttlecock_unit_price,venue_id,time_start
2026-06-28,Alice,Bob,Charlie,Dave,200000,10,15000,<VENUE_ID>,19:00`;
    await page.fill('textarea[name=importData]', csv);
    await page.click('button:has-text("Import")');

    // 5. Verify session has correct fee
    await expect(page.locator('text=300,000 ₫')).toBeVisible(); // 200k × 1.5
    await expect(page.locator('text=Weekend Test')).toBeVisible();
  });
});
```

---

## Summary

This implementation guide provides:

1. **Complete database schema** with TypeScript interfaces
2. **Migration scripts** for creating collections and indexes
3. **Core pricing engine** (`lib/pricing.ts`) with pure functions
4. **RESTful API endpoints** for venues and pricing rules
5. **UI components** for venue management and pricing calculator
6. **Unit and E2E tests** to validate functionality

**Next Steps:**
1. Run migration: `npx ts-node scripts/migrate-001-add-pricing-collections.ts`
2. Implement API endpoints (copy-paste from Section 4)
3. Implement UI components (copy-paste from Section 5)
4. Write tests (use Section 6 as templates)
5. Test end-to-end in staging
6. Deploy to production

**Code Quality Checklist:**
- [ ] All TypeScript types match `lib/models.ts`
- [ ] API routes use `requireAdmin` middleware
- [ ] Input validated with Zod schemas
- [ ] Database queries use indexed fields
- [ ] Pure functions in `lib/pricing.ts` (no side effects)
- [ ] Error handling with proper HTTP status codes
- [ ] Unit tests achieve >80% coverage
- [ ] E2E tests cover critical user flows

---

**Ready to implement Sprint 1! 🚀**
