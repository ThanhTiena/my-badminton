// GET /api/rankings — public
// Returns all players sorted by rankScore (desc), wins (desc), titles (desc)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { PlayerDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const raw = await getDb()
    .collection<PlayerDoc>(COLLECTIONS.PLAYERS)
    .find({ active: { $ne: false } })
    .sort({ rankScore: -1, 'stats.wins': -1, 'stats.titles': -1 })
    .toArray();

  const players = raw.map(p => ({
    ...p,
    rankScore: p.rankScore ?? 0,
    stats: {
      tournamentsPlayed: p.stats?.tournamentsPlayed ?? 0,
      wins:              p.stats?.wins              ?? 0,
      losses:            p.stats?.losses            ?? 0,
      titles:            p.stats?.titles            ?? 0,
      runnerUps:         p.stats?.runnerUps         ?? 0,
      pointsScored:      p.stats?.pointsScored      ?? 0,
      pointsConceded:    p.stats?.pointsConceded     ?? 0,
    },
  }));

  return res.status(200).json(players);
}
