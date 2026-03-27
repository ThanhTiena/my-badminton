import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { TournamentHistoryDoc, PlayerDoc } from '@/lib/models';
import { computeDeltas, computeRankScore } from '@/lib/scoring';

const DB          = 'smashtour';
const COL         = 'tournament_history';
const PLAYERS_COL = 'players';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db  = client.db(DB);
  const col = db.collection<TournamentHistoryDoc>(COL);

  /* ── GET — list tournaments ── */
  if (req.method === 'GET') {
    const limit   = Math.min(Number(req.query.limit ?? 20), 100);
    const skip    = Number(req.query.skip ?? 0);
    const history = await col.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total   = await col.countDocuments();
    return res.status(200).json({ history, total });
  }

  /* ── POST — save completed tournament & update all player scores ── */
  if (req.method === 'POST') {
    const body = req.body as TournamentHistoryDoc;

    const doc: TournamentHistoryDoc = {
      ...body,
      createdAt:   new Date(),
      completedAt: new Date(),
    };
    const result = await col.insertOne(doc);

    // ── Compute per-player stat deltas ──
    const deltas = computeDeltas(
      body.matches,
      body.champion,
      body.runnerUp,
      body.participants,
    );

    // ── Apply deltas to each player in MongoDB ──
    const playerCol = db.collection<PlayerDoc>(PLAYERS_COL);

    for (const [name, delta] of Array.from(deltas.entries())) {
      // Fetch current stats so we can recompute rankScore
      const player = await playerCol.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
      if (!player) continue;

      const newStats: PlayerDoc['stats'] = {
        tournamentsPlayed: (player.stats?.tournamentsPlayed ?? 0) + delta.tournamentsPlayed,
        wins:              (player.stats?.wins              ?? 0) + delta.wins,
        losses:            (player.stats?.losses            ?? 0) + delta.losses,
        titles:            (player.stats?.titles            ?? 0) + delta.titles,
        runnerUps:         (player.stats?.runnerUps         ?? 0) + delta.runnerUps,
        pointsScored:      (player.stats?.pointsScored      ?? 0) + delta.pointsScored,
        pointsConceded:    (player.stats?.pointsConceded    ?? 0) + delta.pointsConceded,
      };

      const rankScore = computeRankScore(newStats);

      await playerCol.updateOne(
        { name: { $regex: `^${name}$`, $options: 'i' } },
        {
          $set: {
            stats:          newStats,
            rankScore,
            rankUpdatedAt:  new Date(),
          },
        },
      );
    }

    return res.status(201).json({ _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
