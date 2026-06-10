// GET /api/bets/leaderboard — public
// Returns a leaderboard list of bettors sorted by wins (desc) and win rate (desc)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';

interface BettorStatsAggregate {
  _id: string;
  totalBets: number;
  wins: number;
  losses: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    const db = getDb();
    const col = db.collection(COLLECTIONS.BETS);

    // Group only settled bets (outcome is 'won' or 'lost')
    const leaderboard = await col.aggregate<BettorStatsAggregate>([
      { $match: { outcome: { $in: ['won', 'lost'] } } },
      {
        $group: {
          _id: '$bettor',
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$outcome', 'won'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$outcome', 'lost'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          bettor: '$_id',
          totalBets: 1,
          wins: 1,
          losses: 1,
          winRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$wins', { $cond: [{ $eq: ['$totalBets', 0] }, 1, '$totalBets'] }] },
                  100,
                ],
              },
              1, // round to 1 decimal place
            ],
          },
        },
      },
      {
        $sort: {
          wins: -1,
          winRate: -1,
          totalBets: -1,
        },
      },
    ]).toArray();

    return res.status(200).json(leaderboard);

  } catch (err) {
    console.error('[/api/bets/leaderboard]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
