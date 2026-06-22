// GET    /api/venues/:id — public
// PATCH  /api/venues/:id — admin only
// DELETE /api/venues/:id — admin only (soft delete)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { VenueDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid venue ID format.' });
  }

  const db  = getDb();
  const col = db.collection<VenueDoc>(COLLECTIONS.VENUES);

  // ── GET — public ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const venue = await col.findOne({ _id: new ObjectId(id) });
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found.' });
    }
    return res.status(200).json(venue);
  }

  // ── PATCH — admin only ────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const updates = req.body as Partial<VenueDoc>;

    // Sanitize: only allow specific fields to be updated
    const sanitizedUpdates: Partial<VenueDoc> = {};

    if (updates.name !== undefined) sanitizedUpdates.name = updates.name;
    if (updates.address !== undefined) sanitizedUpdates.address = updates.address;
    if (updates.district !== undefined) sanitizedUpdates.district = updates.district;
    if (updates.courtCount !== undefined) sanitizedUpdates.courtCount = updates.courtCount;
    if (updates.baseHourlyRate !== undefined) sanitizedUpdates.baseHourlyRate = updates.baseHourlyRate;
    if (updates.facilities !== undefined) sanitizedUpdates.facilities = updates.facilities;
    if (updates.contactPerson !== undefined) sanitizedUpdates.contactPerson = updates.contactPerson;
    if (updates.contactPhone !== undefined) sanitizedUpdates.contactPhone = updates.contactPhone;
    if (updates.notes !== undefined) sanitizedUpdates.notes = updates.notes;
    if (updates.active !== undefined) sanitizedUpdates.active = updates.active;

    // Validate courtCount and baseHourlyRate if provided
    if (sanitizedUpdates.courtCount !== undefined) {
      if (typeof sanitizedUpdates.courtCount !== 'number' ||
          sanitizedUpdates.courtCount < 1 ||
          sanitizedUpdates.courtCount > 50) {
        return res.status(400).json({ error: 'Court count must be between 1 and 50.' });
      }
    }

    if (sanitizedUpdates.baseHourlyRate !== undefined) {
      if (typeof sanitizedUpdates.baseHourlyRate !== 'number' ||
          sanitizedUpdates.baseHourlyRate < 0) {
        return res.status(400).json({ error: 'Base hourly rate must be non-negative.' });
      }
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...sanitizedUpdates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Venue not found.' });
    }

    return res.status(200).json(result);
  }

  // ── DELETE (Soft) — admin only ────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    // Check if any sessions reference this venue
    const sessionCount = await db
      .collection(COLLECTIONS.COURT_SESSIONS)
      .countDocuments({ venueId: new ObjectId(id) });

    if (sessionCount > 0) {
      return res.status(400).json({
        error: `Cannot delete venue: ${sessionCount} sessions reference it. Consider marking it as inactive instead.`,
      });
    }

    // Soft delete: set active = false
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { active: false, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Venue not found.' });
    }

    return res.status(200).json({
      deleted: true,
      venueId: id,
      message: 'Venue marked as inactive.'
    });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).end();
}
