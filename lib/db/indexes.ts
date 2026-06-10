// ─── MongoDB index bootstrap ──────────────────────────────────────────────
// Call createIndexes() once at startup (e.g. from a Next.js instrumentation
// file or the first API call).  Idempotent — safe to call repeatedly.

import { getDb } from './client';
import { COLLECTIONS } from './constants';

export async function createIndexes() {
  const db = getDb();

  await Promise.all([
    // players
    db.collection(COLLECTIONS.PLAYERS).createIndex(
      { name: 1 },
      { unique: true, collation: { locale: 'vi', strength: 2 } }
    ),
    db.collection(COLLECTIONS.PLAYERS).createIndex({ rankScore: -1 }),
    db.collection(COLLECTIONS.PLAYERS).createIndex({ group: 1 }),

    // court_sessions
    db.collection(COLLECTIONS.COURT_SESSIONS).createIndex({ sessionDate: 1 }),
    db.collection(COLLECTIONS.COURT_SESSIONS).createIndex({ year: 1, month: 1 }),
    db.collection(COLLECTIONS.COURT_SESSIONS).createIndex({ year: 1, week: 1 }),

    // payment_paid
    db.collection(COLLECTIONS.PAYMENT_PAID).createIndex(
      { period: 1, playerName: 1 },
      { unique: true }
    ),

    // bets
    db.collection(COLLECTIONS.BETS).createIndex({ matchId: 1 }),
    db.collection(COLLECTIONS.BETS).createIndex({ bettor: 1 }),
    db.collection(COLLECTIONS.BETS).createIndex({ createdAt: -1 }),

    // tournament history
    db.collection(COLLECTIONS.TOURNAMENT_HISTORY).createIndex({ createdAt: -1 }),

    // users (auth)
    db.collection(COLLECTIONS.USERS).createIndex({ username: 1 }, { unique: true }),
  ]);
}
