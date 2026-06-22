// GET  /api/venues — public (active venues only) or admin (all)
// POST /api/venues — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { VenueDoc } from '@/lib/models';
import { generateSlug } from '@/lib/pricing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db  = getDb();
  const col = db.collection<VenueDoc>(COLLECTIONS.VENUES);

  // ── GET — public (active only) or admin (all) ──────────────────────────────
  if (req.method === 'GET') {
    const { all } = req.query as { all?: string };

    // Check if user is admin (but don't fail if not - just restrict access)
    let isAdmin = false;
    try {
      const admin = await requireAdmin(req, res);
      if (admin) isAdmin = true;
    } catch {
      // Not admin, continue as public user
    }

    // If admin and all=true, show all; otherwise show active only
    const filter = isAdmin && all === 'true' ? {} : { active: true };

    const venues = await col.find(filter).sort({ name: 1 }).toArray();
    return res.status(200).json({ venues, total: venues.length });
  }

  // ── POST — admin only ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const {
      name,
      address,
      district,
      courtCount,
      baseHourlyRate,
      facilities,
      contactPerson,
      contactPhone,
      notes,
    } = req.body as Partial<VenueDoc>;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Venue name is required.' });
    }
    if (typeof courtCount !== 'number' || courtCount < 1 || courtCount > 50) {
      return res.status(400).json({ error: 'Court count must be between 1 and 50.' });
    }
    if (typeof baseHourlyRate !== 'number' || baseHourlyRate < 0) {
      return res.status(400).json({ error: 'Base hourly rate must be non-negative.' });
    }

    // Check unique name (case-insensitive)
    const existing = await col.findOne(
      { name: name.trim() },
      { collation: { locale: 'vi', strength: 2 } }
    );
    if (existing) {
      return res.status(409).json({ error: 'Venue name already exists.' });
    }

    const venue: VenueDoc = {
      name: name.trim(),
      slug: generateSlug(name.trim()),
      address: address?.trim(),
      district: district?.trim(),
      courtCount,
      baseHourlyRate,
      facilities: facilities || [],
      contactPerson: contactPerson?.trim(),
      contactPhone: contactPhone?.trim(),
      notes: notes?.trim(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: admin.username,
    };

    const result = await col.insertOne(venue);
    return res.status(201).json({ ...venue, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
