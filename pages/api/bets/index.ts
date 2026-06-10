// GET  /api/bets?matchId=xyz  — public (visitors can view bets)
// GET  /api/bets              — public (all bets)
// POST /api/bets              — public (visitors can place bets — confirmed decision)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { BetDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = getDb().collection<BetDoc>(COLLECTIONS.BETS);

  if (req.method === 'GET') {
    const { matchId } = req.query as { matchId?: string };
    const filter = matchId ? { matchId } : {};
    const bets   = await col.find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(bets);
  }

  if (req.method === 'POST') {
    const { matchId, roundLabel, matchLabel, bettor, pick, note } =
      req.body as Partial<BetDoc>;

    if (!matchId?.trim() || !bettor?.trim() || !pick?.trim()) {
      return res.status(400).json({ error: 'matchId, bettor, and pick are required.' });
    }

    const doc: Omit<BetDoc, '_id'> = {
      matchId:    matchId.trim(),
      roundLabel: roundLabel?.trim() ?? '',
      matchLabel: matchLabel?.trim() ?? '',
      bettor:     bettor.trim(),
      pick:       pick.trim(),
      note:       note?.trim() ?? '',
      createdAt:  new Date(),
    };

    const result = await col.insertOne(doc);
    return res.status(201).json({ ...doc, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
