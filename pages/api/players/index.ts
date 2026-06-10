// GET  /api/players       — public (all players list)
// POST /api/players       — admin only (add player)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PlayerDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db  = getDb();
  const col = db.collection<PlayerDoc>(COLLECTIONS.PLAYERS);

  // ── GET — public ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { all } = req.query as { all?: string };
    const filter = all === 'true' ? {} : { active: { $ne: false } };
    const players = await col.find(filter).sort({ name: 1 }).toArray();
    return res.status(200).json(players);
  }

  // ── POST — admin only ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { name, group } = req.body as { name: string; group: 'pro' | 'beg' };
    if (!name?.trim() || !['pro', 'beg'].includes(group)) {
      return res.status(400).json({ error: 'Invalid name or group.' });
    }

    // ReDoS-safe duplicate check: use collation instead of $regex
    const existing = await col.findOne(
      { name: name.trim() },
      { collation: { locale: 'vi', strength: 2 } }
    );
    if (existing) return res.status(409).json({ error: 'Player already exists.' });

    const doc: PlayerDoc = {
      name: name.trim(),
      group,
      active: true,
      createdAt: new Date(),
      stats: {
        tournamentsPlayed: 0,
        wins: 0,
        losses: 0,
        titles: 0,
        runnerUps: 0,
        pointsScored: 0,
        pointsConceded: 0,
      },
      rankScore: 0,
    };
    const result = await col.insertOne(doc);
    return res.status(201).json({ ...doc, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
