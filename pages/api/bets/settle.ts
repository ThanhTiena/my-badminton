// POST /api/bets/settle — admin only
// Body: { matchId: string; winner: string }
// Called automatically when a match winner is declared.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { BetDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { matchId, winner } = req.body as { matchId?: string; winner?: string };
  if (!matchId || !winner) {
    return res.status(400).json({ error: 'matchId and winner are required.' });
  }

  const col = getDb().collection<BetDoc>(COLLECTIONS.BETS);

  // Stamp actual winner + settled time on all open bets
  await col.updateMany(
    { matchId, outcome: { $exists: false } },
    { $set: { actualWinner: winner, settledAt: new Date() } }
  );

  // Resolve outcome per bet
  const bets = await col.find({ matchId }).toArray();
  await Promise.all(
    bets.map(b =>
      col.updateOne(
        { _id: b._id },
        { $set: { outcome: b.pick === winner ? 'won' : 'lost' } }
      )
    )
  );

  return res.status(200).json({ settled: bets.length });
}
