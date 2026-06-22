// GET  /api/pricing-rules — public (active rules only) or admin (all)
// POST /api/pricing-rules — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PricingRuleDoc, RuleType, RateType, CombinationStrategy } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db  = getDb();
  const col = db.collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES);

  // ── GET — public (active only) or admin (all) ──────────────────────────────
  if (req.method === 'GET') {
    const { all, venueId } = req.query as { all?: string; venueId?: string };

    // Check if user is admin (but don't fail if not - just restrict access)
    let isAdmin = false;
    try {
      const admin = await requireAdmin(req, res);
      if (admin) isAdmin = true;
    } catch {
      // Not admin, continue as public user
    }

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // If admin and all=true, show all; otherwise show active only
    if (!isAdmin || all !== 'true') {
      filter.active = true;
    }

    // Filter by venue if provided
    if (venueId) {
      filter.venueId = new ObjectId(venueId);
    }

    const rules = await col.find(filter).sort({ priority: -1, ruleName: 1 }).toArray();
    return res.status(200).json({ rules, total: rules.length });
  }

  // ── POST — admin only ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const {
      ruleName,
      ruleType,
      venueId,
      venueName,
      daysOfWeek,
      timeStart,
      timeEnd,
      dateStart,
      dateEnd,
      rateType,
      rateValue,
      eventName,
      eventIcon,
      combinationStrategy,
      priority,
    } = req.body as Partial<PricingRuleDoc>;

    // Validation
    if (!ruleName?.trim()) {
      return res.status(400).json({ error: 'Rule name is required.' });
    }

    if (!ruleType || !['time_based', 'special_event', 'seasonal'].includes(ruleType)) {
      return res.status(400).json({ error: 'Rule type must be one of: time_based, special_event, seasonal.' });
    }

    if (!rateType || !['multiplier', 'fixed'].includes(rateType)) {
      return res.status(400).json({ error: 'Rate type must be either "multiplier" or "fixed".' });
    }

    if (typeof rateValue !== 'number' || rateValue <= 0) {
      return res.status(400).json({ error: 'Rate value must be a positive number.' });
    }

    if (rateType === 'multiplier' && (rateValue < 0.1 || rateValue > 10)) {
      return res.status(400).json({ error: 'Multiplier rate must be between 0.1 and 10.' });
    }

    if (typeof priority !== 'number' || priority < 1 || priority > 1000) {
      return res.status(400).json({ error: 'Priority must be between 1 and 1000.' });
    }

    // Validate time format if provided
    if (timeStart && !/^\d{2}:\d{2}$/.test(timeStart)) {
      return res.status(400).json({ error: 'Time start must be in HH:mm format (e.g., "19:00").' });
    }
    if (timeEnd && !/^\d{2}:\d{2}$/.test(timeEnd)) {
      return res.status(400).json({ error: 'Time end must be in HH:mm format (e.g., "21:00").' });
    }

    // Validate date format if provided
    if (dateStart && !/^\d{4}-\d{2}-\d{2}$/.test(dateStart)) {
      return res.status(400).json({ error: 'Date start must be in YYYY-MM-DD format.' });
    }
    if (dateEnd && !/^\d{4}-\d{2}-\d{2}$/.test(dateEnd)) {
      return res.status(400).json({ error: 'Date end must be in YYYY-MM-DD format.' });
    }

    // Validate days of week
    if (daysOfWeek) {
      if (!Array.isArray(daysOfWeek) || !daysOfWeek.every(d => Number.isInteger(d) && d >= 1 && d <= 7)) {
        return res.status(400).json({ error: 'Days of week must be an array of integers 1-7 (Monday=1, Sunday=7).' });
      }
    }

    // Validate venueId if provided
    if (venueId && !ObjectId.isValid(venueId)) {
      return res.status(400).json({ error: 'Invalid venue ID format.' });
    }

    // Validate combination strategy if provided
    if (combinationStrategy && !['multiply', 'highest', 'additive'].includes(combinationStrategy)) {
      return res.status(400).json({ error: 'Combination strategy must be one of: multiply, highest, additive.' });
    }

    const rule: PricingRuleDoc = {
      ruleName: ruleName.trim(),
      ruleType: ruleType as RuleType,
      venueId: venueId ? new ObjectId(venueId) : undefined,
      venueName: venueName?.trim(),
      daysOfWeek,
      timeStart: timeStart?.trim(),
      timeEnd: timeEnd?.trim(),
      dateStart: dateStart?.trim(),
      dateEnd: dateEnd?.trim(),
      rateType: rateType as RateType,
      rateValue,
      eventName: eventName?.trim(),
      eventIcon: eventIcon?.trim(),
      combinationStrategy: combinationStrategy as CombinationStrategy | undefined,
      priority,
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
