// PATCH /api/players/:id  — admin only (rename, toggle group)
// DELETE /api/players/:id — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { PlayerDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id.' });

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = getDb();
  const col = db.collection<PlayerDoc>(COLLECTIONS.PLAYERS);
  const _id = new ObjectId(id);

  if (req.method === 'PATCH') {
    const { group, name } = req.body as { group?: 'pro' | 'beg'; name?: string };
    if (group && !['pro', 'beg'].includes(group)) {
      return res.status(400).json({ error: 'Invalid group.' });
    }
    const update: Partial<PlayerDoc> = {};
    if (group) update.group = group;
    if (name?.trim()) update.name = name.trim();
    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }
    await col.updateOne({ _id }, { $set: update });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await col.updateOne({ _id }, { $set: { active: false, archivedAt: new Date() } });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).end();
}
