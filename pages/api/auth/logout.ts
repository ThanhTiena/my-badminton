/**
 * POST /api/auth/logout
 * Clears the admin session cookie.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).end(); }
  res.setHeader('Set-Cookie', `admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  return res.status(200).json({ ok: true });
}
