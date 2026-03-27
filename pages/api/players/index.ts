import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { PlayerDoc } from '@/lib/models';

const DB = 'smashtour';
const COL = 'players';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = client.db(DB);
  const col = db.collection<PlayerDoc>(COL);

  if (req.method === 'GET') {
    const players = await col.find({}).sort({ name: 1 }).toArray();
    return res.status(200).json(players);
  }

  if (req.method === 'POST') {
    const { name, group } = req.body as { name: string; group: 'pro' | 'beg' };
    if (!name?.trim() || !['pro', 'beg'].includes(group)) {
      return res.status(400).json({ error: 'Invalid name or group' });
    }
    // Prevent duplicate names (case-insensitive)
    const existing = await col.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) return res.status(409).json({ error: 'Player already exists' });

    const doc: PlayerDoc = {
      name: name.trim(),
      group,
      createdAt: new Date(),
      stats: { tournamentsPlayed: 0, wins: 0, losses: 0, titles: 0 },
    };
    const result = await col.insertOne(doc);
    return res.status(201).json({ ...doc, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
