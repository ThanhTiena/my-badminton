// GET    /api/pricing-rules/:id — public
// PATCH  /api/pricing-rules/:id — admin only
// DELETE /api/pricing-rules/:id — admin only (soft delete)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PricingRuleDoc, RuleType, RateType, CombinationStrategy } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid pricing rule ID format.' });
  }

  const db  = getDb();
  const col = db.collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES);

  // ── GET — public ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const rule = await col.findOne({ _id: new ObjectId(id) });
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found.' });
    }
    return res.status(200).json(rule);
  }

  // ── PATCH — admin only ────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const updates = req.body as Partial<PricingRuleDoc>;

    // Sanitize: only allow specific fields to be updated
    const sanitizedUpdates: Partial<PricingRuleDoc> = {};

    if (updates.ruleName !== undefined) sanitizedUpdates.ruleName = updates.ruleName;
    if (updates.ruleType !== undefined) sanitizedUpdates.ruleType = updates.ruleType;
    if (updates.venueId !== undefined) {
      sanitizedUpdates.venueId = updates.venueId ? new ObjectId(updates.venueId) : undefined;
    }
    if (updates.venueName !== undefined) sanitizedUpdates.venueName = updates.venueName;
    if (updates.daysOfWeek !== undefined) sanitizedUpdates.daysOfWeek = updates.daysOfWeek;
    if (updates.timeStart !== undefined) sanitizedUpdates.timeStart = updates.timeStart;
    if (updates.timeEnd !== undefined) sanitizedUpdates.timeEnd = updates.timeEnd;
    if (updates.dateStart !== undefined) sanitizedUpdates.dateStart = updates.dateStart;
    if (updates.dateEnd !== undefined) sanitizedUpdates.dateEnd = updates.dateEnd;
    if (updates.rateType !== undefined) sanitizedUpdates.rateType = updates.rateType;
    if (updates.rateValue !== undefined) sanitizedUpdates.rateValue = updates.rateValue;
    if (updates.eventName !== undefined) sanitizedUpdates.eventName = updates.eventName;
    if (updates.eventIcon !== undefined) sanitizedUpdates.eventIcon = updates.eventIcon;
    if (updates.combinationStrategy !== undefined) sanitizedUpdates.combinationStrategy = updates.combinationStrategy;
    if (updates.priority !== undefined) sanitizedUpdates.priority = updates.priority;
    if (updates.active !== undefined) sanitizedUpdates.active = updates.active;

    // Validate ruleType if provided
    if (sanitizedUpdates.ruleType !== undefined) {
      if (!['time_based', 'special_event', 'seasonal'].includes(sanitizedUpdates.ruleType)) {
        return res.status(400).json({ error: 'Rule type must be one of: time_based, special_event, seasonal.' });
      }
    }

    // Validate rateType if provided
    if (sanitizedUpdates.rateType !== undefined) {
      if (!['multiplier', 'fixed'].includes(sanitizedUpdates.rateType)) {
        return res.status(400).json({ error: 'Rate type must be either "multiplier" or "fixed".' });
      }
    }

    // Validate rateValue if provided
    if (sanitizedUpdates.rateValue !== undefined) {
      if (typeof sanitizedUpdates.rateValue !== 'number' || sanitizedUpdates.rateValue <= 0) {
        return res.status(400).json({ error: 'Rate value must be a positive number.' });
      }

      // Get current rule to check rateType
      const currentRule = await col.findOne({ _id: new ObjectId(id) });
      if (!currentRule) {
        return res.status(404).json({ error: 'Pricing rule not found.' });
      }

      const effectiveRateType = sanitizedUpdates.rateType || currentRule.rateType;
      if (effectiveRateType === 'multiplier' && (sanitizedUpdates.rateValue < 0.1 || sanitizedUpdates.rateValue > 10)) {
        return res.status(400).json({ error: 'Multiplier rate must be between 0.1 and 10.' });
      }
    }

    // Validate priority if provided
    if (sanitizedUpdates.priority !== undefined) {
      if (typeof sanitizedUpdates.priority !== 'number' ||
          sanitizedUpdates.priority < 1 ||
          sanitizedUpdates.priority > 1000) {
        return res.status(400).json({ error: 'Priority must be between 1 and 1000.' });
      }
    }

    // Validate time format if provided
    if (sanitizedUpdates.timeStart && !/^\d{2}:\d{2}$/.test(sanitizedUpdates.timeStart)) {
      return res.status(400).json({ error: 'Time start must be in HH:mm format (e.g., "19:00").' });
    }
    if (sanitizedUpdates.timeEnd && !/^\d{2}:\d{2}$/.test(sanitizedUpdates.timeEnd)) {
      return res.status(400).json({ error: 'Time end must be in HH:mm format (e.g., "21:00").' });
    }

    // Validate date format if provided
    if (sanitizedUpdates.dateStart && !/^\d{4}-\d{2}-\d{2}$/.test(sanitizedUpdates.dateStart)) {
      return res.status(400).json({ error: 'Date start must be in YYYY-MM-DD format.' });
    }
    if (sanitizedUpdates.dateEnd && !/^\d{4}-\d{2}-\d{2}$/.test(sanitizedUpdates.dateEnd)) {
      return res.status(400).json({ error: 'Date end must be in YYYY-MM-DD format.' });
    }

    // Validate days of week if provided
    if (sanitizedUpdates.daysOfWeek) {
      if (!Array.isArray(sanitizedUpdates.daysOfWeek) ||
          !sanitizedUpdates.daysOfWeek.every(d => Number.isInteger(d) && d >= 1 && d <= 7)) {
        return res.status(400).json({ error: 'Days of week must be an array of integers 1-7 (Monday=1, Sunday=7).' });
      }
    }

    // Validate combination strategy if provided
    if (sanitizedUpdates.combinationStrategy &&
        !['multiply', 'highest', 'additive'].includes(sanitizedUpdates.combinationStrategy)) {
      return res.status(400).json({ error: 'Combination strategy must be one of: multiply, highest, additive.' });
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...sanitizedUpdates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Pricing rule not found.' });
    }

    return res.status(200).json(result);
  }

  // ── DELETE (Soft) — admin only ────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    // Check if any sessions reference this rule
    const sessionCount = await db
      .collection(COLLECTIONS.COURT_SESSIONS)
      .countDocuments({ pricingRuleId: new ObjectId(id) });

    if (sessionCount > 0) {
      return res.status(400).json({
        error: `Cannot delete pricing rule: ${sessionCount} sessions reference it. Consider marking it as inactive instead.`,
      });
    }

    // Soft delete: set active = false
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { active: false, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Pricing rule not found.' });
    }

    return res.status(200).json({
      deleted: true,
      ruleId: id,
      message: 'Pricing rule marked as inactive.'
    });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).end();
}
