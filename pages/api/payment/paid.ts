/**
 * GET  /api/payment/paid?period=YYYY-MM
 *   Returns all paid records for the given period.
 *   Response: { [playerName]: boolean }
 *
 * POST /api/payment/paid
 *   Body: { period: string; playerName: string; paid: boolean }
 *   Upserts one player's paid status for the period.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';

const DB  = 'smashtour';
const COL = 'payment_paid';

interface PaidDoc {
  period: string;      // e.g. "2026-03"
  playerName: string;
  paid: boolean;
  updatedAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = client.db(DB).collection<PaidDoc>(COL);

  if (req.method === 'GET') {
    const { period } = req.query as { period?: string };
    if (!period) return res.status(400).json({ error: '"period" query param required' });
    const docs = await col.find({ period }).toArray();
    const map: Record<string, boolean> = {};
    for (const doc of docs) map[doc.playerName] = doc.paid;
    return res.status(200).json(map);
  }

  if (req.method === 'POST') {
    const { period, playerName, paid } = req.body as { period?: string; playerName?: string; paid?: boolean };
    if (!period || !playerName || typeof paid !== 'boolean') {
      return res.status(400).json({ error: '"period", "playerName", and "paid" are required' });
    }
    await col.updateOne(
      { period, playerName },
      { $set: { period, playerName, paid, updatedAt: new Date() } },
      { upsert: true },
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
