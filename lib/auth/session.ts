// ─── JWT session helpers ──────────────────────────────────────────────────
// Signs and verifies admin sessions using HMAC-SHA256 (jose library).
// Cookie is HttpOnly + Secure + SameSite=Strict — not forgeable from JS.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { type NextApiRequest, type NextApiResponse } from 'next';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production-32chars'
);
const COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AdminPayload extends JWTPayload {
  role: 'admin';
  username: string;
}

// ── Sign ────────────────────────────────────────────────────────────────────
export async function signToken(username: string): Promise<string> {
  return new SignJWT({ role: 'admin', username } satisfies Omit<AdminPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

// ── Verify ──────────────────────────────────────────────────────────────────
export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== 'admin') return null;
    return payload as AdminPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ───────────────────────────────────────────────────────────
export function getTokenFromRequest(req: NextApiRequest): string | null {
  return req.cookies[COOKIE_NAME] ?? null;
}

export function setTokenCookie(res: NextApiResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    [
      `${COOKIE_NAME}=${token}`,
      `Max-Age=${COOKIE_MAX_AGE}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      ...(isProd ? ['Secure'] : []),
    ].join('; ')
  );
}

export function clearTokenCookie(res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`
  );
}
