// POST /api/payment/sessions/recalculate — admin only
// Re-reads every session and rewrites player shares using current smash-weight configs.

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { CourtSessionDoc, PaymentConfigDoc } from '@/lib/models';
import { computeSessionAmounts, getISOWeek } from '@/lib/payment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db     = getDb();
  const col    = db.collection<CourtSessionDoc>(COLLECTIONS.COURT_SESSIONS);
  const cfgCol = db.collection<PaymentConfigDoc>(COLLECTIONS.PAYMENT_CONFIG);

  const allConfigs = await cfgCol.find({}).toArray();
  const cfgMap = new Map<string, { smashWeight: number; courtRate: number; shuttleRate: number }>();
  for (const cfg of allConfigs) {
    cfgMap.set(cfg.playerName.toLowerCase(), {
      smashWeight: cfg.smashWeight,
      courtRate:   cfg.courtRate   ?? 1.0,
      shuttleRate: cfg.shuttleRate ?? 1.0,
    });
  }

  const sessions = await col.find({}).toArray();
  let updated = 0;

  for (const session of sessions) {
    const playerNames         = session.players.map(p => p.name);
    const playersWithWeight   = playerNames.map((name: string) => {
      const cfg = cfgMap.get(name.toLowerCase());
      return {
        name,
        smashWeight: cfg?.smashWeight ?? 1.0,
        courtRate:   cfg?.courtRate   ?? 1.0,
        shuttleRate: cfg?.shuttleRate ?? 1.0,
      };
    });
    const { shuttlecockTotal, totalCost, players } = computeSessionAmounts({
      players:              playersWithWeight,
      courtFee:             session.courtFee,
      numShuttlecocks:      session.numShuttlecocks,
      shuttlecockUnitPrice: session.shuttlecockUnitPrice,
    });
    const d = new Date(session.sessionDate);
    await col.updateOne(
      { _id: session._id as ObjectId },
      { $set: { year: d.getFullYear(), month: d.getMonth() + 1, week: getISOWeek(session.sessionDate), shuttlecockTotal, totalCost, players } }
    );
    updated++;
  }

  return res.status(200).json({ updated });
}
