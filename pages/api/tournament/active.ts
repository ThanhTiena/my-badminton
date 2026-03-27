/**
 * /api/tournament/active
 * ─────────────────────────────────────────────────────────────
 * Singleton endpoint for the live tournament state.
 * At most one document exists in the "active_tournament" collection
 * (identified by the fixed key "current").
 *
 * GET    — return the active tournament, or null if none
 * PUT    — upsert (create or replace) the active tournament state
 * DELETE — remove the active tournament (cancel or completion)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { ActiveTournamentDoc } from '@/lib/models';

const DB  = 'smashtour';
const COL = 'active_tournament';
const KEY = 'current' as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = client.db(DB).collection<ActiveTournamentDoc>(COL);

  /* ── GET — load current tournament ─────────────────────── */
  if (req.method === 'GET') {
    const doc = await col.findOne({ key: KEY });
    // Return null (not 404) so the client can distinguish "none" from errors
    return res.status(200).json(doc ?? null);
  }

  /* ── PUT — save / update tournament state ───────────────── */
  if (req.method === 'PUT') {
    const state = req.body;
    if (!state || typeof state !== 'object') {
      return res.status(400).json({ error: 'Body must be a tournament state object' });
    }

    const doc: Omit<ActiveTournamentDoc, '_id'> = {
      key:       KEY,
      updatedAt: new Date(),
      state,
    };

    await col.updateOne(
      { key: KEY },
      { $set: doc },
      { upsert: true },
    );

    return res.status(200).json({ ok: true });
  }

  /* ── DELETE — clear (cancel / complete) ────────────────── */
  if (req.method === 'DELETE') {
    await col.deleteOne({ key: KEY });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}
