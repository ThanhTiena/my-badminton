// POST /api/auth/change-password
// Body: { currentPassword: string; newPassword: string }
// Requires: admin JWT cookie

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  try {
    const db   = getDb();
    const user = await db.collection(COLLECTIONS.USERS).findOne({ username: admin.username });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Verify current password
    const valid = user.passwordHash
      ? await bcrypt.compare(currentPassword, user.passwordHash)
      : user.password === currentPassword; // legacy fallback

    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: user._id },
      { $set: { passwordHash: newHash, updatedAt: new Date() }, $unset: { password: '' } }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[/api/auth/change-password]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
