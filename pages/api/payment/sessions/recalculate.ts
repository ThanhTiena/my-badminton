/**
 * POST /api/payment/sessions/recalculate
 *
 * Re-reads every session in the database, looks up the current
 * payment configs, and rewrites each session's player shares using
 * the latest smashWeight / courtRate / shuttleRate values.
 *
 * Use this after finalising weights in the Weights tab so that the
 * Summary tab reflects the updated rates.
 *
 * Returns: { updated: number }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import client from '@/lib/mongodb';
import type { CourtSessionDoc, PaymentConfigDoc } from '@/lib/models';
import { computeSessionAmounts, getISOWeek } from '@/lib/payment';

const DB      = 'smashtour';
const COL     = 'court_sessions';
const CFG_COL = 'payment_configs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const db     = client.db(DB);
  const col    = db.collection<CourtSessionDoc>(COL);
  const cfgCol = db.collection<PaymentConfigDoc>(CFG_COL);

  // Load all configs into a lookup map
  const allConfigs = await cfgCol.find({}).toArray();
  const cfgMap = new Map<string, { smashWeight: number; courtRate: number; shuttleRate: number }>();
  for (const cfg of allConfigs) {
    cfgMap.set(cfg.playerName.toLowerCase(), {
      smashWeight: cfg.smashWeight,
      courtRate:   cfg.courtRate   ?? 1.0,
      shuttleRate: cfg.shuttleRate ?? 1.0,
    });
  }

  // Fetch every session
  const sessions = await col.find({}).toArray();

  let updated = 0;

  for (const session of sessions) {
    const playerNames = session.players.map(p => p.name);

    const playersWithWeight = playerNames.map((name: string) => {
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
      {
        $set: {
          year:             d.getFullYear(),
          month:            d.getMonth() + 1,
          week:             getISOWeek(session.sessionDate),
          shuttlecockTotal,
          totalCost,
          players,
        },
      },
    );

    updated++;
  }

  return res.status(200).json({ updated });
}
