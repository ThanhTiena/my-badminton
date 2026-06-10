// GET /api/payment/outstanding-debt
// Query parameters:
//   playerName?: string — if provided, gets detailed outstanding debt for a single player (public)
//   rounded?:    string — "true" to use amountOwedRounded (default: false)
// If playerName is omitted, lists outstanding debt for all players (requires admin auth).

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';

interface AggregatedOwed {
  _id: { playerName: string; period: string };
  owed: number;
  owedRounded: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { playerName, rounded } = req.query as { playerName?: string; rounded?: string };
  const useRounded = rounded === 'true';

  // If no playerName requested, this is a bulk audit list — require admin
  if (!playerName) {
    const admin = await requireAdmin(req, res);
    if (!admin) return; // response already sent
  }

  try {
    const db = getDb();

    // 1. Aggregate total amount owed by player and period (YYYY-MM)
    const pipeline = [
      { $unwind: '$players' },
      {
        $group: {
          _id: {
            playerName: '$players.name',
            period: {
              $concat: [
                { $toString: '$year' },
                '-',
                {
                  $cond: {
                    if: { $lt: ['$month', 10] },
                    then: { $concat: ['0', { $toString: '$month' }] },
                    else: { $toString: '$month' },
                  },
                },
              ],
            },
          },
          owed: { $sum: '$players.amountOwed' },
          owedRounded: { $sum: '$players.amountOwedRounded' },
        },
      },
    ];

    const rawOwedList = await db
      .collection(COLLECTIONS.COURT_SESSIONS)
      .aggregate(pipeline)
      .toArray() as AggregatedOwed[];

    // 2. Fetch all payment records
    // payment_paid structure: { period, playerName, paid, paidAmount, snapshotTotal }
    const paidRecords = await db
      .collection(COLLECTIONS.PAYMENT_PAID)
      .find({})
      .toArray();

    // Map paid records by playerName and period for fast lookup
    const paidMap = new Map<string, number>(); // key: "playerName|period" -> paidAmount
    for (const r of paidRecords) {
      if (r.playerName && r.period) {
        const key = `${r.playerName.toLowerCase()}|${r.period}`;
        paidMap.set(key, r.paidAmount ?? 0);
      }
    }

    // 3. Process remaining debt per player per period
    // Map of: playerName -> { totalDebt, details: { period, owed, paid, remaining }[] }
    const playerDebts = new Map<string, {
      playerName: string;
      totalOutstanding: number;
      breakdown: { period: string; owed: number; paid: number; remaining: number }[];
    }>();

    for (const row of rawOwedList) {
      const pName = row._id.playerName;
      const period = row._id.period;
      const owed = useRounded ? row.owedRounded : row.owed;
      const key = `${pName.toLowerCase()}|${period}`;
      const paid = paidMap.get(key) ?? 0;
      const remaining = Math.max(0, owed - paid);

      if (!playerDebts.has(pName)) {
        playerDebts.set(pName, {
          playerName: pName,
          totalOutstanding: 0,
          breakdown: [],
        });
      }

      const entry = playerDebts.get(pName)!;
      entry.totalOutstanding = Math.round((entry.totalOutstanding + remaining) * 100) / 100;
      entry.breakdown.push({ period, owed, paid, remaining });
    }

    // Sort breakdowns by period descending
    playerDebts.forEach(val => {
      val.breakdown.sort((a, b) => b.period.localeCompare(a.period));
    });

    // Case 1: single player details requested
    if (playerName) {
      const normalizedQuery = playerName.trim().toLowerCase();
      // Match case-insensitively
      const matchedKey = Array.from(playerDebts.keys()).find(k => k.toLowerCase() === normalizedQuery);
      if (!matchedKey) {
        return res.status(200).json({
          playerName: playerName.trim(),
          totalOutstanding: 0,
          breakdown: [],
        });
      }
      return res.status(200).json(playerDebts.get(matchedKey));
    }

    // Case 2: bulk list of all outstanding debts for admin
    const list = Array.from(playerDebts.values())
      .filter(p => p.totalOutstanding > 0)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return res.status(200).json(list);

  } catch (err) {
    console.error('[/api/payment/outstanding-debt]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
