/**
 * GET  /api/progress/history — Get user's view history
 * POST /api/progress/history — Record technique view
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { UserProgressDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  const progressCol = db.collection<UserProgressDoc>(COLLECTIONS.USER_PROGRESS);
  const techniquesCol = db.collection(COLLECTIONS.TECHNIQUES);

  // Default user (in production, use real auth)
  const defaultUserId = new ObjectId('000000000000000000000001');
  const defaultUserName = 'Guest User';

  // ── GET — fetch view history ─────────────────────────────────
  if (req.method === 'GET') {
    const { limit = '10' } = req.query as Record<string, string>;

    const progress = await progressCol.findOne({ userId: defaultUserId });

    if (!progress || progress.viewHistory.length === 0) {
      return res.status(200).json({ history: [] });
    }

    // Get most recent views
    const recentViews = progress.viewHistory
      .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
      .slice(0, Number(limit));

    // Fetch technique details
    const techniqueIds = recentViews.map(v => v.techniqueId);
    const techniques = await techniquesCol
      .find({ _id: { $in: techniqueIds } })
      .toArray();

    const techniqueMap = new Map(
      techniques.map(t => [t._id!.toString(), t])
    );

    const history = recentViews.map(view => ({
      technique: techniqueMap.get(view.techniqueId.toString()),
      viewedAt: view.viewedAt,
      viewCount: view.viewCount,
    }));

    return res.status(200).json({ history });
  }

  // ── POST — record view ───────────────────────────────────────
  if (req.method === 'POST') {
    const { techniqueId } = req.body as { techniqueId: string };

    if (!techniqueId || !ObjectId.isValid(techniqueId)) {
      return res.status(400).json({ error: 'Invalid technique ID' });
    }

    const techOid = new ObjectId(techniqueId);

    // Get or create progress doc
    let progress = await progressCol.findOne({ userId: defaultUserId });

    if (!progress) {
      const newProgress: UserProgressDoc = {
        userId: defaultUserId,
        userName: defaultUserName,
        favoriteTechniques: [],
        viewHistory: [
          {
            techniqueId: techOid,
            viewedAt: new Date(),
            viewCount: 1,
          },
        ],
        customTechniques: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await progressCol.insertOne(newProgress);
      return res.status(200).json({ success: true });
    }

    // Check if technique already in history
    const existingIndex = progress.viewHistory.findIndex(
      v => v.techniqueId.toString() === techniqueId
    );

    if (existingIndex >= 0) {
      // Update existing entry
      const updated = [...progress.viewHistory];
      updated[existingIndex] = {
        ...updated[existingIndex],
        viewedAt: new Date(),
        viewCount: updated[existingIndex].viewCount + 1,
      };

      await progressCol.updateOne(
        { userId: defaultUserId },
        {
          $set: {
            viewHistory: updated,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Add new entry
      await progressCol.updateOne(
        { userId: defaultUserId },
        {
          $push: {
            viewHistory: {
              techniqueId: techOid,
              viewedAt: new Date(),
              viewCount: 1,
            },
          },
          $set: { updatedAt: new Date() },
        }
      );
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
