/**
 * GET    /api/payment/sessions/[id]   — fetch a single session
 * DELETE /api/payment/sessions/[id]   — remove a single session
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import client from '@/lib/mongodb';
import type { CourtSessionDoc } from '@/lib/models';

const DB  = 'smashtour';
const COL = 'court_sessions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  let oid: ObjectId;
  try { oid = new ObjectId(id); }
  catch { return res.status(400).json({ error: 'Invalid session id' }); }

  const col = client.db(DB).collection<CourtSessionDoc>(COL);

  if (req.method === 'GET') {
    const doc = await col.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json(doc);
  }

  if (req.method === 'DELETE') {
    const result = await col.deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json({ deleted: true });
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  res.status(405).end();
}
