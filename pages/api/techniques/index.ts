// GET    /api/techniques — list published techniques (public)
// POST   /api/techniques — create new technique (admin only)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { TechniqueDoc, TechniqueCategory, DifficultyLevel } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  const col = db.collection<TechniqueDoc>(COLLECTIONS.TECHNIQUES);

  // ── GET — list techniques ─────────────────────────────────────
  if (req.method === 'GET') {
    const {
      category,
      difficulty,
      published = 'true',
      skip = '0',
      limit = '50',
    } = req.query as Record<string, string>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Only show published techniques for public access
    if (published === 'true') {
      filter.isPublished = true;
    } else if (published === 'false') {
      filter.isPublished = false;
    }

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const total = await col.countDocuments(filter);
    const techniques = await col
      .find(filter)
      .sort({ category: 1, difficulty: 1, name: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    return res.status(200).json({ techniques, total });
  }

  // ── POST — create technique (admin only) ─────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const body = req.body as {
      techniqueId: string;
      name: string;
      category: TechniqueCategory;
      difficulty: DifficultyLevel;
      description: string;
      keyPoints: string[];
      poses: TechniqueDoc['poses'];
      thumbnailUrl?: string;
      videoUrl?: string;
      tags?: string[];
      isOfficial?: boolean;
      isPublished?: boolean;
    };

    const {
      techniqueId,
      name,
      category,
      difficulty,
      description,
      keyPoints,
      poses,
      thumbnailUrl,
      videoUrl,
      tags,
      isOfficial = true,
      isPublished = false,
    } = body;

    // Validation
    if (!techniqueId || !name || !category || !difficulty || !description) {
      return res.status(400).json({
        error: 'Missing required fields: techniqueId, name, category, difficulty, description',
      });
    }

    if (!keyPoints || keyPoints.length === 0) {
      return res.status(400).json({ error: 'At least one key point is required' });
    }

    if (!poses || poses.length === 0) {
      return res.status(400).json({ error: 'At least one pose is required' });
    }

    // Check for duplicate techniqueId
    const existing = await col.findOne({ techniqueId });
    if (existing) {
      return res.status(409).json({ error: 'Technique with this ID already exists' });
    }

    const doc: TechniqueDoc = {
      techniqueId,
      name,
      category,
      difficulty,
      description,
      keyPoints,
      poses,
      thumbnailUrl,
      videoUrl,
      tags: tags || [],
      viewCount: 0,
      favoriteCount: 0,
      author: admin.username,
      isOfficial,
      isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin.username,
    };

    const result = await col.insertOne(doc);
    const inserted = await col.findOne({ _id: result.insertedId });

    return res.status(201).json(inserted);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
