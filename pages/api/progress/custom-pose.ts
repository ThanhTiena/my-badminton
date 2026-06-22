import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';
import { DB_NAME, COLLECTIONS } from '../../../lib/db/constants';
import { UserProgressDoc } from '../../../lib/models';

/**
 * POST /api/progress/custom-pose
 * Save a custom technique pose created by the user
 *
 * Body:
 * {
 *   "name": "My Custom Smash",
 *   "description": "A powerful variation I created",
 *   "joints": { ... 16 joints with x,y,z coordinates ... }
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, description, joints } = req.body;

      // Validate required fields
      if (!name || !joints) {
        return res.status(400).json({ error: 'Missing required fields: name and joints' });
      }

      // Validate joints structure (should have 16 joints with x, y, z)
      const requiredJoints = [
        'head', 'neck', 'torso', 'hips',
        'leftShoulder', 'leftElbow', 'leftHand',
        'rightShoulder', 'rightElbow', 'rightHand', 'racket',
        'leftHip', 'leftKnee', 'leftFoot',
        'rightHip', 'rightKnee', 'rightFoot'
      ];

      const hasAllJoints = requiredJoints.every(joint => {
        const j = joints[joint];
        return j && typeof j.x === 'number' && typeof j.y === 'number' && typeof j.z === 'number';
      });

      if (!hasAllJoints) {
        return res.status(400).json({ error: 'Invalid joints data. Must include all 16 joints with x, y, z coordinates.' });
      }

      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const progressCol = db.collection<UserProgressDoc>(COLLECTIONS.USER_PROGRESS);

      // For now, use a default userId (later integrate with auth)
      // We'll use a fixed ObjectId for the default user
      const DEFAULT_USER_ID = new ObjectId('000000000000000000000001');
      const userName = 'Default User';

      // Find or create user progress document
      let progress = await progressCol.findOne({ userId: DEFAULT_USER_ID });

      const customTechnique = {
        name,
        description: description || '',
        poses: [{
          name: 'Custom Pose',
          description: description || '',
          duration: 1000,
          joints,
        }],
        createdAt: new Date(),
      };

      if (!progress) {
        // Create new progress document with custom technique
        const newProgress: UserProgressDoc = {
          userId: DEFAULT_USER_ID,
          userName,
          favoriteTechniques: [],
          viewHistory: [],
          customTechniques: [customTechnique],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await progressCol.insertOne(newProgress);
        progress = await progressCol.findOne({ _id: result.insertedId });
      } else {
        // Add custom technique to existing progress
        await progressCol.updateOne(
          { userId: DEFAULT_USER_ID },
          {
            $push: { customTechniques: customTechnique },
            $set: { updatedAt: new Date() },
          }
        );

        progress = await progressCol.findOne({ userId: DEFAULT_USER_ID });
      }

      return res.status(200).json({
        success: true,
        message: 'Custom pose saved successfully',
        technique: customTechnique,
        totalCustomPoses: progress?.customTechniques?.length || 0,
      });
    } catch (error) {
      console.error('Error saving custom pose:', error);
      return res.status(500).json({ error: 'Failed to save custom pose' });
    }
  } else if (req.method === 'GET') {
    // GET /api/progress/custom-pose
    // Fetch all custom poses for the user
    try {
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const progressCol = db.collection<UserProgressDoc>(COLLECTIONS.USER_PROGRESS);

      const DEFAULT_USER_ID = new ObjectId('000000000000000000000001');
      const progress = await progressCol.findOne({ userId: DEFAULT_USER_ID });

      return res.status(200).json({
        customTechniques: progress?.customTechniques || [],
      });
    } catch (error) {
      console.error('Error fetching custom poses:', error);
      return res.status(500).json({ error: 'Failed to fetch custom poses' });
    }
  } else if (req.method === 'DELETE') {
    // DELETE /api/progress/custom-pose?techniqueId=xxx
    // Delete a custom pose
    try {
      const { techniqueId } = req.query;

      if (!techniqueId || typeof techniqueId !== 'string') {
        return res.status(400).json({ error: 'Missing techniqueId query parameter' });
      }

      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const progressCol = db.collection<UserProgressDoc>(COLLECTIONS.USER_PROGRESS);

      const DEFAULT_USER_ID = new ObjectId('000000000000000000000001');

      await progressCol.updateOne(
        { userId: DEFAULT_USER_ID },
        {
          $pull: { customTechniques: { name: techniqueId } } as any,
          $set: { updatedAt: new Date() },
        }
      );

      const progress = await progressCol.findOne({ userId: DEFAULT_USER_ID });

      return res.status(200).json({
        success: true,
        message: 'Custom pose deleted successfully',
        totalCustomPoses: progress?.customTechniques?.length || 0,
      });
    } catch (error) {
      console.error('Error deleting custom pose:', error);
      return res.status(500).json({ error: 'Failed to delete custom pose' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
