// GET  /api/payment/configs — admin only
// POST /api/payment/configs — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PaymentConfigDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const col = getDb().collection<PaymentConfigDoc>(COLLECTIONS.PAYMENT_CONFIG);

  if (req.method === 'GET') {
    const configs = await col.find({}).sort({ playerName: 1 }).toArray();
    return res.status(200).json(configs);
  }

  if (req.method === 'POST') {
    const { playerName, smashWeight, courtRate, shuttleRate } = req.body as PaymentConfigDoc;
    if (!playerName?.trim() || typeof smashWeight !== 'number') {
      return res.status(400).json({ error: 'playerName and smashWeight are required.' });
    }
    const doc = {
      playerName:  playerName.trim(),
      smashWeight,
      courtRate:   courtRate   ?? 1.0,
      shuttleRate: shuttleRate ?? 1.0,
      updatedAt:   new Date(),
    };
    await col.updateOne({ playerName: playerName.trim() }, { $set: doc }, { upsert: true });
    const saved = await col.findOne({ playerName: playerName.trim() });
    return res.status(200).json(saved);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
