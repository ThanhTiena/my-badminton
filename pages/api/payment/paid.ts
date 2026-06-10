// GET  /api/payment/paid?period=YYYY-MM — admin only
// POST /api/payment/paid               — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';

interface PaidDoc {
  period: string;
  playerName: string;
  paid: boolean;
  paidAmount: number;
  snapshotTotal: number;
  updatedAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const col = getDb().collection<PaidDoc>(COLLECTIONS.PAYMENT_PAID);

  if (req.method === 'GET') {
    const { period } = req.query as { period?: string };
    if (!period) return res.status(400).json({ error: '"period" query param required.' });
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
      return res.status(400).json({ error: '"period", "playerName", and "paid" are required.' });
    }
    await col.updateOne(
      { period, playerName },
      { $set: { period, playerName, paid, paidAmount: paidAmount ?? 0, snapshotTotal: snapshotTotal ?? 0, updatedAt: new Date() } },
      { upsert: true }
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
