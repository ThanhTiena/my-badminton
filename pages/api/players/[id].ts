import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import client from '@/lib/mongodb';
import type { PlayerDoc } from '@/lib/models';

const DB = 'smashtour';
const COL = 'players';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

  const db = client.db(DB);
  const col = db.collection<PlayerDoc>(COL);
  const _id = new ObjectId(id);

  if (req.method === 'PATCH') {
    const { group } = req.body as { group?: 'pro' | 'beg' };
    if (group && !['pro', 'beg'].includes(group)) {
      return res.status(400).json({ error: 'Invalid group' });
    }
    const update: Partial<PlayerDoc> = {};
    if (group) update.group = group;
    await col.updateOne({ _id }, { $set: update });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await col.deleteOne({ _id });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  res.status(405).end();
}
