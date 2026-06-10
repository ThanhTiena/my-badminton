// GET  /api/history — public (tournament history)
// POST /api/history — admin only (save completed tournament + update player stats)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import { computeDeltas, computeRankScore } from '@/lib/scoring';
import type { TournamentHistoryDoc, PlayerDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db  = getDb();
  const col = db.collection<TournamentHistoryDoc>(COLLECTIONS.TOURNAMENT_HISTORY);

  // ── GET — public ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const limit   = Math.min(Number(req.query.limit ?? 20), 100);
    const skip    = Number(req.query.skip ?? 0);
    const history = await col.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total   = await col.countDocuments();
    return res.status(200).json({ history, total });
  }

  // ── POST — admin only ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const body = req.body as TournamentHistoryDoc;
    const doc: TournamentHistoryDoc = {
      ...body,
      createdAt:   new Date(),
      completedAt: new Date(),
    };
    const result = await col.insertOne(doc);

    // Compute per-player stat deltas and update scores
    const deltas      = computeDeltas(body.matches, body.champion, body.runnerUp, body.participants);
    const playerCol   = db.collection<PlayerDoc>(COLLECTIONS.PLAYERS);

    for (const [name, delta] of Array.from(deltas.entries())) {
      // ReDoS-safe lookup using collation
      const player = await playerCol.findOne(
        { name },
        { collation: { locale: 'vi', strength: 2 } }
      );
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

      await playerCol.updateOne(
        { name },
        {
          $set: {
            stats:         newStats,
            rankScore:     computeRankScore(newStats),
            rankUpdatedAt: new Date(),
          },
        },
        { collation: { locale: 'vi', strength: 2 } }
      );
    }

    return res.status(201).json({ _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
