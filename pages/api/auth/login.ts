// POST /api/auth/login
// Body: { username: string; password: string }
// Rate-limited: max 5 attempts per 15 minutes per IP.

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { signToken, setTokenCookie } from '@/lib/auth/session';
import { createIndexes } from '@/lib/db/indexes';

// ── In-memory rate limiter (per-IP, resets on cold start) ──────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 15 * 60 * 1000; // 15 min

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= MAX_ATTEMPTS) return false; // blocked
  entry.count++;
  return true;
}

function clearRateLimit(ip: string) {
  attempts.delete(ip);
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
          ?? req.socket?.remoteAddress
          ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  }

  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    // Ensure indexes on first login (cheap no-op if already created)
    await createIndexes().catch(() => {});

    const db   = getDb();
    const user = await db.collection(COLLECTIONS.USERS).findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Support both legacy plain-text (migration path) and bcrypt hashes
    let valid = false;
    if (user.passwordHash) {
      valid = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      // Legacy plain-text — compare and immediately upgrade to hash
      valid = user.password === password;
      if (valid) {
        const hash = await bcrypt.hash(password, 12);
        await db.collection(COLLECTIONS.USERS).updateOne(
          { _id: user._id },
          { $set: { passwordHash: hash, migratedAt: new Date() }, $unset: { password: '' } }
        );
      }
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    clearRateLimit(ip);

    // Update last login
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const token = await signToken(String(username));
    setTokenCookie(res, token);

    return res.status(200).json({ ok: true, username });
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
