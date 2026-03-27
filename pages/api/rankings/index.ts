import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { PlayerDoc } from '@/lib/models';

const DB  = 'smashtour';
const COL = 'players';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const db  = client.db(DB);
  const col = db.collection<PlayerDoc>(COL);

  // Return all players sorted by rankScore desc, then wins desc as tie-break
  const raw = await col
    .find({})
    .sort({ rankScore: -1, 'stats.wins': -1, 'stats.titles': -1 })
    .toArray();

  // Back-fill missing fields for players created before the ranking update
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
