/**
 * GET  /api/payment/paid?period=YYYY-MM
 *   Response: { [playerName]: { paid: boolean; paidAmount: number; snapshotTotal: number } }
 *
 * POST /api/payment/paid
 *   Body: { period: string; playerName: string; paid: boolean; paidAmount?: number; snapshotTotal?: number }
 *
 *   snapshotTotal = the player's grandTotal at the time payment was recorded.
 *   remaining = snapshotTotal - paidAmount  (stable even if new sessions are added later)
 *   If new sessions add to grandTotal after snapshot, a "⚠ +X more" indicator appears.
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
  snapshotTotal: number;  // grandTotal at time of payment record
  updatedAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = client.db(DB).collection<PaidDoc>(COL);

  if (req.method === 'GET') {
    const { period } = req.query as { period?: string };
    if (!period) return res.status(400).json({ error: '"period" query param required' });
    const docs = await col.find({ period }).toArray();
    const map: Record<string, { paid: boolean; paidAmount: number; snapshotTotal: number }> = {};
    for (const doc of docs) {
      map[doc.playerName] = {
        paid:          doc.paid,
        paidAmount:    doc.paidAmount    ?? 0,
        snapshotTotal: doc.snapshotTotal ?? 0,
      };
    }
    return res.status(200).json(map);
  }

  if (req.method === 'POST') {
    const { period, playerName, paid, paidAmount, snapshotTotal } = req.body as {
      period?: string; playerName?: string; paid?: boolean;
      paidAmount?: number; snapshotTotal?: number;
    };
    if (!period || !playerName || typeof paid !== 'boolean') {
      return res.status(400).json({ error: '"period", "playerName", and "paid" are required' });
    }
    await col.updateOne(
      { period, playerName },
      { $set: {
        period, playerName, paid,
        paidAmount:    paidAmount    ?? 0,
        snapshotTotal: snapshotTotal ?? 0,
        updatedAt: new Date(),
      }},
      { upsert: true },
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
