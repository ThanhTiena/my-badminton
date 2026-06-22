// POST /api/pricing-rules/calculate — public (dry-run calculation)
//
// Accepts pricing calculation input and returns the calculated court fee
// without persisting anything. Useful for previewing pricing before import.

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { PricingRuleDoc, VenueDoc } from '@/lib/models';
import { calculateCourtFee, type PricingCalculationInput } from '@/lib/pricing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const {
    venueId,
    sessionDate,
    timeStart,
    duration,
    baseRate,
  } = req.body as Partial<PricingCalculationInput>;

  // Validation
  if (!sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    return res.status(400).json({ error: 'Session date is required in YYYY-MM-DD format.' });
  }

  if (timeStart && !/^\d{2}:\d{2}$/.test(timeStart)) {
    return res.status(400).json({ error: 'Time start must be in HH:mm format (e.g., "19:00").' });
  }

  if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
    return res.status(400).json({ error: 'Duration must be a positive number (hours).' });
  }

  const db = getDb();

  // Determine base rate
  let effectiveBaseRate = baseRate;

  // If venueId is provided, fetch the venue's base rate
  if (venueId && !baseRate) {
    const venueCol = db.collection<VenueDoc>(COLLECTIONS.VENUES);
    const venueObjectId = typeof venueId === 'string' ? new ObjectId(venueId) : venueId;
    const venue = await venueCol.findOne({ _id: venueObjectId });
    if (venue) {
      effectiveBaseRate = venue.baseHourlyRate;
    }
  }

  // Fetch all active pricing rules
  const rulesCol = db.collection<PricingRuleDoc>(COLLECTIONS.PRICING_RULES);
  const allRules = await rulesCol.find({ active: true }).toArray();

  // Calculate pricing
  const result = calculateCourtFee(
    {
      venueId,
      sessionDate,
      timeStart,
      duration,
      baseRate: effectiveBaseRate,
    },
    allRules
  );

  return res.status(200).json(result);
}
