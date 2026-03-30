/**
 * GET  /api/payment/paid?period=YYYY-MM
 *   Response: { [playerName]: { paid: boolean; paidAmount: number } }
 *
 * POST /api/payment/paid
 *   Body: { period: string; playerName: string; paid: boolean; paidAmount?: number }
 *   paidAmount = how much the player has paid so far (remaining = grandTotal - paidAmount)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';

const DB  = 'smashtour';
const COL = 'payment_paid';

interface PaidDoc {
  period: string;
  playerName: string;
  paid: boolean;
  paidAmount: number;
  updatedAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = client.db(DB).collection<PaidDoc>(COL);

  if (req.method === 'GET') {
    const { period } = req.query as { period?: string };
    if (!period) return res.status(400).json({ error: '"period" query param required' });
    const docs = await col.find({ period }).toArray();
    const map: Record<string, { paid: boolean; paidAmount: number }> = {};
    for (const doc of docs) map[doc.playerName] = { paid: doc.paid, paidAmount: doc.paidAmount ?? 0 };
    return res.status(200).json(map);
  }

  if (req.method === 'POST') {
    const { period, playerName, paid, paidAmount } = req.body as {
      period?: string; playerName?: string; paid?: boolean; paidAmount?: number;
    };
    if (!period || !playerName || typeof paid !== 'boolean') {
      return res.status(400).json({ error: '"period", "playerName", and "paid" are required' });
    }
    await col.updateOne(
      { period, playerName },
      { $set: { period, playerName, paid, paidAmount: paidAmount ?? 0, updatedAt: new Date() } },
      { upsert: true },
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
