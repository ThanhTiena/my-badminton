/**
 * GET /api/auth/me
 * Returns { isAdmin: true } if the session cookie is valid, else { isAdmin: false }.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', ['GET']); return res.status(405).end(); }
  const cookie = req.cookies['admin_session'];
  return res.status(200).json({ isAdmin: cookie === '1' });
}
