/**
 * POST /api/auth/login
 * Body: { username: string; password: string }
 * Response: { ok: true } | { error: string }
 *
 * Uses HTTP-only cookie "admin_session" = "1" as the session token.
 * Credentials are stored in MongoDB collection "admin_config" (singleton doc).
 * Default: admin / admin  (created on first login attempt if doc missing).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';

const DB  = 'smashtour';
const COL = 'admin_config';

interface AdminDoc {
  key: 'admin';
  username: string;
  password: string;   // plain text (small internal app, no public exposure)
}

async function getOrCreateAdmin(): Promise<AdminDoc> {
  const col = client.db(DB).collection<AdminDoc>(COL);
  const existing = await col.findOne({ key: 'admin' });
  if (existing) return existing;
  // Seed defaults
  const doc: AdminDoc = { key: 'admin', username: 'admin', password: 'admin' };
  await col.insertOne(doc);
  return doc;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).end(); }

  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const admin = await getOrCreateAdmin();
  if (username !== admin.username || password !== admin.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.setHeader('Set-Cookie', `admin_session=1; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
  return res.status(200).json({ ok: true });
}
