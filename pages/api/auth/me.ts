// GET /api/auth/me
// Returns current admin info if authenticated, 401 otherwise.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ authenticated: false });

  const payload = await verifyToken(token);
  if (!payload)  return res.status(401).json({ authenticated: false });

  return res.status(200).json({ authenticated: true, username: payload.username });
}
