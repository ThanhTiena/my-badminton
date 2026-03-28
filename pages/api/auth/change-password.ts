/**
 * POST /api/auth/change-password
 * Body: { currentPassword: string; newPassword: string }
 * Requires active admin session cookie.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';

const DB  = 'smashtour';
const COL = 'admin_config';

interface AdminDoc { key: 'admin'; username: string; password: string; }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).end(); }

  if (req.cookies['admin_session'] !== '1') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'New password must be at least 4 characters' });

  const col = client.db(DB).collection<AdminDoc>(COL);
  const admin = await col.findOne({ key: 'admin' });
  if (!admin || admin.password !== currentPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  await col.updateOne({ key: 'admin' }, { $set: { password: newPassword } });
  return res.status(200).json({ ok: true });
}
