/**
 * GET  /api/bets?matchId=m3          — bets for one match
 * GET  /api/bets                     — all bets (for history screen), sorted newest first
 * POST /api/bets                     — place a new bet
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { BetDoc } from '@/lib/models';

const DB  = 'smashtour';
const COL = 'bets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const col = client.db(DB).collection<BetDoc>(COL);

  if (req.method === 'GET') {
    const { matchId } = req.query as { matchId?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = matchId ? { matchId } : {};
    const bets = await col.find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(bets);
  }

  if (req.method === 'POST') {
    const { matchId, roundLabel, matchLabel, bettor, pick, note } =
      req.body as Partial<BetDoc>;

    if (!matchId?.trim() || !bettor?.trim() || !pick?.trim()) {
      return res.status(400).json({ error: 'matchId, bettor, and pick are required' });
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
  res.status(405).end();
}
