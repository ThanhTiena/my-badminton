// ─── Admin auth middleware ────────────────────────────────────────────────
// Usage in any API route:
//
//   export default async function handler(req, res) {
//     const admin = await requireAdmin(req, res);
//     if (!admin) return;           // ← response already sent (401)
//     // ... your protected logic
//   }

import { type NextApiRequest, type NextApiResponse } from 'next';
import { getTokenFromRequest, verifyToken, type AdminPayload } from './session';

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AdminPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized — not logged in' });
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    return null;
  }

  return payload;
}
