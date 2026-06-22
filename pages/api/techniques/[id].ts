/**
 * GET    /api/techniques/[id]   — fetch a single technique (public)
 * PATCH  /api/techniques/[id]   — update a technique (admin only)
 * DELETE /api/techniques/[id]   — remove a technique (admin only)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { TechniqueDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: 'Invalid technique id' });
  }

  const db = getDb();
  const col = db.collection<TechniqueDoc>(COLLECTIONS.TECHNIQUES);

  // ── GET — fetch technique (public) ──────────────────────────
  if (req.method === 'GET') {
    const doc = await col.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Technique not found' });

    // Increment view count
    await col.updateOne({ _id: oid }, { $inc: { viewCount: 1 } });

    return res.status(200).json(doc);
  }

  // Auth guard for write operations
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // ── PATCH — update technique ────────────────────────────────
  if (req.method === 'PATCH') {
    const body = req.body as Partial<TechniqueDoc>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $set: Record<string, any> = {};

    // Update allowed fields
    if (body.name !== undefined) $set.name = body.name;
    if (body.category !== undefined) $set.category = body.category;
    if (body.difficulty !== undefined) $set.difficulty = body.difficulty;
    if (body.description !== undefined) $set.description = body.description;
    if (body.keyPoints !== undefined) $set.keyPoints = body.keyPoints;
    if (body.poses !== undefined) $set.poses = body.poses;
    if (body.thumbnailUrl !== undefined) $set.thumbnailUrl = body.thumbnailUrl;
    if (body.videoUrl !== undefined) $set.videoUrl = body.videoUrl;
    if (body.tags !== undefined) $set.tags = body.tags;
    if (body.isPublished !== undefined) $set.isPublished = body.isPublished;

    // Always update timestamp
    $set.updatedAt = new Date();

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    await col.updateOne({ _id: oid }, { $set });
    const updated = await col.findOne({ _id: oid });
    return res.status(200).json(updated);
  }

  // ── DELETE — remove technique ───────────────────────────────
  if (req.method === 'DELETE') {
    const result = await col.deleteOne({ _id: oid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Technique not found' });
    }
    return res.status(200).json({ deleted: true });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  res.status(405).end();
}
