/**
 * GET  /api/payment/configs
 *   Returns all smash-weight configs, sorted by playerName.
 *
 * POST /api/payment/configs
 *   Body: { playerName: string; smashWeight: number }
 *   Upserts the config for one player.  Returns the saved doc.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { PaymentConfigDoc } from '@/lib/models';

const DB  = 'smashtour';
const COL = 'payment_configs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = client.db(DB).collection<PaymentConfigDoc>(COL);

  /* ── GET — list all configs ─────────────────────────────── */
  if (req.method === 'GET') {
    const configs = await col.find({}).sort({ playerName: 1 }).toArray();
    return res.status(200).json(configs);
  }

  /* ── POST — upsert one player's payment config ──────────── */
  if (req.method === 'POST') {
    const { playerName, smashWeight, courtRate, shuttleRate } =
      req.body as { playerName?: string; smashWeight?: number; courtRate?: number; shuttleRate?: number };

    if (!playerName?.trim()) {
      return res.status(400).json({ error: '"playerName" is required' });
    }
    if (typeof smashWeight !== 'number' || smashWeight <= 0) {
      return res.status(400).json({ error: '"smashWeight" must be a positive number' });
    }
    if (courtRate !== undefined && (typeof courtRate !== 'number' || courtRate < 0)) {
      return res.status(400).json({ error: '"courtRate" must be a non-negative number' });
    }
    if (shuttleRate !== undefined && (typeof shuttleRate !== 'number' || shuttleRate < 0)) {
      return res.status(400).json({ error: '"shuttleRate" must be a non-negative number' });
    }

    const doc: Omit<PaymentConfigDoc, '_id'> = {
      playerName:  playerName.trim(),
      smashWeight,
      courtRate:   courtRate   ?? 1.0,
      shuttleRate: shuttleRate ?? 1.0,
      updatedAt:   new Date(),
    };

    await col.updateOne(
      { playerName: playerName.trim() },
      { $set: doc },
      { upsert: true },
    );

    const saved = await col.findOne({ playerName: playerName.trim() });
    return res.status(200).json(saved);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
