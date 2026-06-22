// GET    /api/payment/sessions — admin only (payment data is private)
// POST   /api/payment/sessions — admin only (import rows)
// DELETE /api/payment/sessions — admin only (bulk delete)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { CourtSessionDoc, PaymentConfigDoc, ImportRow, VenueDoc, PricingRuleDoc } from '@/lib/models';
import { computeSessionAmounts, getISOWeek } from '@/lib/payment';
import { calculateCourtFee } from '@/lib/pricing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db     = getDb();
  const col    = db.collection<CourtSessionDoc>(COLLECTIONS.COURT_SESSIONS);
  const cfgCol = db.collection<PaymentConfigDoc>(COLLECTIONS.PAYMENT_CONFIG);

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { month, week, draftMode, skip = '0', limit = '50' } = req.query as Record<string, string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      filter.year  = y;
      filter.month = m;
    } else if (week && /^\d{4}-W\d{1,2}$/.test(week)) {
      const [y, wPart] = week.split('-W');
      filter.year = Number(y);
      filter.week = Number(wPart);
    }

    // Filter by draft mode
    if (draftMode === 'true') {
      filter.draftMode = true;
    } else if (draftMode === 'false') {
      filter.draftMode = { $ne: true }; // Exclude drafts
    }

    const total    = await col.countDocuments(filter);
    const sessions = await col
      .find(filter)
      .sort({ sessionDate: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    return res.status(200).json({ sessions, total });
  }

  // ── POST — import rows ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body as ImportRow[];
    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).json({ error: 'Body must be a non-empty array of import rows.' });
    }

    const allConfigs = await cfgCol.find({}).toArray();
    const cfgMap = new Map<string, { smashWeight: number; courtRate: number; shuttleRate: number }>();
    for (const cfg of allConfigs) {
      cfgMap.set(cfg.playerName.toLowerCase(), {
        smashWeight: cfg.smashWeight,
        courtRate:   cfg.courtRate   ?? 1.0,
        shuttleRate: cfg.shuttleRate ?? 1.0,
      });
    }

    // Fetch all active pricing rules once (for performance)
    const rulesCol = db.collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES);
    const allRules = await rulesCol.find({ active: true }).toArray();

    // Fetch venue data if needed (for snapshots)
    const venueCol = db.collection<VenueDoc>(COLLECTIONS.VENUES);
    const venueIds = body
      .map(row => row.venueId)
      .filter((id): id is string => !!id);
    const uniqueVenueIds = Array.from(new Set(venueIds));
    const venues = await venueCol
      .find({ _id: { $in: uniqueVenueIds.map(id => new ObjectId(id)) } })
      .toArray();
    const venueMap = new Map(venues.map(v => [v._id!.toString(), v]));

    const docs: CourtSessionDoc[] = body.map(row => {
      const date = new Date(row.date);
      const playersWithWeight = row.players.map(name => {
        const cfg = cfgMap.get(name.toLowerCase());
        return {
          name,
          smashWeight: cfg?.smashWeight ?? 1.0,
          courtRate:   cfg?.courtRate   ?? 1.0,
          shuttleRate: cfg?.shuttleRate ?? 1.0,
        };
      });

      // NEW: Calculate pricing if venue and time provided
      let finalCourtFee = row.courtFee;
      let baseCourtFee: number | undefined;
      let pricingRuleId: ObjectId | undefined;
      let pricingRuleName: string | undefined;
      let pricingRateApplied: number | undefined;
      let pricingRateType: 'multiplier' | 'fixed' | undefined;
      let appliedPricingRule: {
        ruleId: string;
        ruleName: string;
        rateApplied: number;
        rateType: 'multiplier' | 'fixed';
        baseCourtFee?: number;
      } | undefined;

      if (row.venueId && row.timeStart) {
        const venue = venueMap.get(row.venueId);
        const calculationResult = calculateCourtFee(
          {
            venueId: row.venueId,
            sessionDate: row.date,
            timeStart: row.timeStart,
            duration: row.duration,
            baseRate: venue?.baseHourlyRate,
          },
          allRules
        );

        // Use calculated court fee
        finalCourtFee = calculationResult.finalCourtFee;
        baseCourtFee = calculationResult.baseCourtFee;

        // Store pricing rule metadata if a rule was applied
        if (calculationResult.appliedRules.length > 0) {
          const topRule = calculationResult.appliedRules[0];
          pricingRuleId = new ObjectId(topRule.ruleId);
          pricingRuleName = topRule.ruleName;
          pricingRateApplied = topRule.rateValue;
          pricingRateType = topRule.rateType;

          appliedPricingRule = {
            ruleId: topRule.ruleId,
            ruleName: topRule.ruleName,
            rateApplied: topRule.rateValue,
            rateType: topRule.rateType,
            baseCourtFee,
          };
        }
      }

      const { shuttlecockTotal, totalCost, players } = computeSessionAmounts({
        players:              playersWithWeight,
        courtFee:             finalCourtFee,
        numShuttlecocks:      row.numShuttlecocks,
        shuttlecockUnitPrice: row.shuttlecockUnitPrice,
        appliedPricingRule,
      });

      // Venue snapshot data
      const venue = row.venueId ? venueMap.get(row.venueId) : undefined;

      return {
        sessionDate:              row.date,
        year:                     date.getFullYear(),
        month:                    date.getMonth() + 1,
        week:                     getISOWeek(row.date),
        // Venue reference
        venueId:                  venue?._id,
        venueName:                venue?.name,
        venueAddress:             venue?.address,
        // Pricing data
        pricingRuleId,
        pricingRuleName,
        pricingRateApplied,
        pricingRateType,
        baseCourtFee,
        // Session costs
        courtFee:                 finalCourtFee,
        numShuttlecocks:          row.numShuttlecocks,
        shuttlecockUnitPrice:     row.shuttlecockUnitPrice,
        shuttlecockTotal,
        totalCost,
        players,
        note:                     row.note,
        shuttlecocksBulkPurchase: row.shuttlecocksBulkPurchase ?? false,
        importedAt:               new Date(),
      };
    });

    const result   = await col.insertMany(docs);
    const ids      = Object.values(result.insertedIds);
    const sessions = await col.find({ _id: { $in: ids } }).sort({ sessionDate: 1 }).toArray();

    return res.status(201).json({ inserted: result.insertedCount, sessions });
  }

  // ── DELETE — bulk remove ─────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { ids } = req.body as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '"ids" must be a non-empty string array.' });
    }
    const objectIds = ids.map(id => new ObjectId(id));
    const result    = await col.deleteMany({ _id: { $in: objectIds } });
    return res.status(200).json({ deleted: result.deletedCount });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end();
}
