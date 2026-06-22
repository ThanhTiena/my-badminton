/**
 * GET    /api/progress/favorites       — Get user's favorite techniques
 * POST   /api/progress/favorites       — Add technique to favorites
 * DELETE /api/progress/favorites/[id]  — Remove from favorites
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

  // For now, use a default user ID (in production, this would come from auth)
  const defaultUserId = new ObjectId('000000000000000000000001');
  const defaultUserName = 'Guest User';

  // ── GET — fetch favorites ────────────────────────────────────
  if (req.method === 'GET') {
    let progress = await progressCol.findOne({ userId: defaultUserId });

    // Create progress doc if doesn't exist
    if (!progress) {
      const newProgress: UserProgressDoc = {
        userId: defaultUserId,
        userName: defaultUserName,
        favoriteTechniques: [],
        viewHistory: [],
        customTechniques: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await progressCol.insertOne(newProgress);
      progress = await progressCol.findOne({ _id: result.insertedId });
    }

    if (!progress) {
      return res.status(500).json({ error: 'Failed to create progress document' });
    }

    // Fetch technique details for favorites
    const favoriteTechniques = await techniquesCol
      .find({ _id: { $in: progress.favoriteTechniques } })
      .toArray();

    return res.status(200).json({
      favorites: favoriteTechniques,
      favoriteIds: progress.favoriteTechniques.map(id => id.toString()),
    });
  }

  // ── POST — add to favorites ──────────────────────────────────
  if (req.method === 'POST') {
    const { techniqueId } = req.body as { techniqueId: string };

    if (!techniqueId || !ObjectId.isValid(techniqueId)) {
      return res.status(400).json({ error: 'Invalid technique ID' });
    }

    const techOid = new ObjectId(techniqueId);

    // Check if technique exists
    const technique = await techniquesCol.findOne({ _id: techOid });
    if (!technique) {
      return res.status(404).json({ error: 'Technique not found' });
    }

    // Get or create progress doc
    const progress = await progressCol.findOne({ userId: defaultUserId });
    if (!progress) {
      const newProgress: UserProgressDoc = {
        userId: defaultUserId,
        userName: defaultUserName,
        favoriteTechniques: [techOid],
        viewHistory: [],
        customTechniques: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await progressCol.insertOne(newProgress);

      // Increment favorite count on technique
      await techniquesCol.updateOne(
        { _id: techOid },
        { $inc: { favoriteCount: 1 } }
      );

      return res.status(200).json({ success: true, favorited: true });
    }

    // Check if already favorited
    const alreadyFavorited = progress.favoriteTechniques.some(
      id => id.toString() === techniqueId
    );

    if (alreadyFavorited) {
      return res.status(200).json({ success: true, favorited: true });
    }

    // Add to favorites
    await progressCol.updateOne(
      { userId: defaultUserId },
      {
        $push: { favoriteTechniques: techOid },
        $set: { updatedAt: new Date() },
      }
    );

    // Increment favorite count on technique
    await techniquesCol.updateOne(
      { _id: techOid },
      { $inc: { favoriteCount: 1 } }
    );

    return res.status(200).json({ success: true, favorited: true });
  }

  // ── DELETE — remove from favorites ───────────────────────────
  if (req.method === 'DELETE') {
    const { techniqueId } = req.query as { techniqueId: string };

    if (!techniqueId || !ObjectId.isValid(techniqueId)) {
      return res.status(400).json({ error: 'Invalid technique ID' });
    }

    const techOid = new ObjectId(techniqueId);

    const result = await progressCol.updateOne(
      { userId: defaultUserId },
      {
        $pull: { favoriteTechniques: techOid },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount > 0) {
      // Decrement favorite count on technique
      await techniquesCol.updateOne(
        { _id: techOid },
        { $inc: { favoriteCount: -1 } }
      );
    }

    return res.status(200).json({ success: true, favorited: false });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end();
}
