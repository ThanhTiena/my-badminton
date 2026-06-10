// GET    /api/tournament/active — public (view current tournament)
// PUT    /api/tournament/active — admin only (save/update state)
// DELETE /api/tournament/active — admin only (cancel / complete)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { ActiveTournamentDoc } from '@/lib/models';

const KEY = 'current' as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = getDb().collection<ActiveTournamentDoc>(COLLECTIONS.ACTIVE_TOURNAMENT);

  // ── GET — public ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const doc = await col.findOne({ key: KEY });
    return res.status(200).json(doc ?? null);
  }

  // ── PUT / DELETE — admin only ─────────────────────────────────────────────
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'PUT') {
    const state = req.body;
    if (!state || typeof state !== 'object') {
      return res.status(400).json({ error: 'Body must be a tournament state object.' });
    }

    const doc: Omit<ActiveTournamentDoc, '_id'> = {
      key:       KEY,
      updatedAt: new Date(),
      state,
    };

    await col.updateOne({ key: KEY }, { $set: doc }, { upsert: true });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await col.deleteOne({ key: KEY });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).end();
}
