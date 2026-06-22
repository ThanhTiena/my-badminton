/**
 * lib/pricing.ts
 * ───────────────────────────────────────────────────────────────
 * Pricing calculation engine — pure functions, zero side effects.
 * Sprint 1: S1H.2 — Time-Based Pricing Rules
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
