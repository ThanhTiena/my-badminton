/**
 * POST /api/bets/settle
 * Called automatically when a match winner is declared.
 * Marks all bets for that match as won/lost.
 *
 * Body: { matchId: string; winner: string }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { BetDoc } from '@/lib/models';

const DB  = 'smashtour';
const COL = 'bets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { matchId, winner } = req.body as { matchId?: string; winner?: string };
  if (!matchId || !winner) {
    return res.status(400).json({ error: 'matchId and winner are required' });
  }

  const col = client.db(DB).collection<BetDoc>(COL);

  await col.updateMany(
    { matchId, outcome: { $exists: false } },
    {
      $set: {
        actualWinner: winner,
        settledAt: new Date(),
      },
    },
  );

  // Set outcome per bet based on pick vs winner
  const bets = await col.find({ matchId }).toArray();
  await Promise.all(
    bets.map(b =>
      col.updateOne(
        { _id: b._id },
        { $set: { outcome: b.pick === winner ? 'won' : 'lost' } },
      )
    )
  );

  return res.status(200).json({ settled: bets.length });
}
