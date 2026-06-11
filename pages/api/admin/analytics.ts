import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';

interface AggregatedOwed {
  _id: { playerName: string; period: string };
  owed: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = getDb();

    // 1. Players Aggregation
    const [totalPlayers, proPlayers, begPlayers] = await Promise.all([
      db.collection(COLLECTIONS.PLAYERS).countDocuments({ active: { $ne: false } }),
      db.collection(COLLECTIONS.PLAYERS).countDocuments({ active: { $ne: false }, group: 'pro' }),
      db.collection(COLLECTIONS.PLAYERS).countDocuments({ active: { $ne: false }, group: 'beg' }),
    ]);

    // 2. Tournaments Aggregation
    const [totalTourneys, singlesTourneys, doublesTourneys] = await Promise.all([
      db.collection(COLLECTIONS.TOURNAMENT_HISTORY).countDocuments(),
      db.collection(COLLECTIONS.TOURNAMENT_HISTORY).countDocuments({ gameType: 'singles' }),
      db.collection(COLLECTIONS.TOURNAMENT_HISTORY).countDocuments({ gameType: 'doubles' }),
    ]);

    // Match count across history
    const matchCountResult = await db.collection(COLLECTIONS.TOURNAMENT_HISTORY).aggregate([
      { $project: { numMatches: { $cond: { if: { $isArray: "$matches" }, then: { $size: "$matches" }, else: 0 } } } },
      { $group: { _id: null, total: { $sum: "$numMatches" } } }
    ]).toArray();
    const totalMatches = matchCountResult[0]?.total ?? 0;

    // 3. Court Sessions financials
    const sessionsFinancials = await db.collection(COLLECTIONS.COURT_SESSIONS).aggregate([
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$totalCost" },
          courtFee: { $sum: "$courtFee" },
          shuttleTotal: { $sum: "$shuttlecockTotal" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    const totalCost = sessionsFinancials[0]?.totalCost ?? 0;
    const courtFee = sessionsFinancials[0]?.courtFee ?? 0;
    const shuttleTotal = sessionsFinancials[0]?.shuttleTotal ?? 0;
    const sessionCount = sessionsFinancials[0]?.count ?? 0;

    // 4. Payments collected
    const paymentPaidResult = await db.collection(COLLECTIONS.PAYMENT_PAID).aggregate([
      { $group: { _id: null, totalPaid: { $sum: "$paidAmount" } } }
    ]).toArray();
    const totalPaid = paymentPaidResult[0]?.totalPaid ?? 0;

    // 5. Calculate precise Outstanding Debt
    // Aggregate total amount owed by player and period
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
        },
      },
    ];
    const owedList = await db.collection(COLLECTIONS.COURT_SESSIONS).aggregate(pipeline).toArray() as AggregatedOwed[];

    // Fetch all paid amounts
    const paidRecords = await db.collection(COLLECTIONS.PAYMENT_PAID).find({}).toArray();
    const paidMap = new Map<string, number>();
    for (const r of paidRecords) {
      if (r.playerName && r.period) {
        const key = `${r.playerName.toLowerCase()}|${r.period}`;
        paidMap.set(key, r.paidAmount ?? 0);
      }
    }

    let totalOutstanding = 0;
    for (const row of owedList) {
      const pName = row._id.playerName;
      const period = row._id.period;
      const owed = row.owed;
      const key = `${pName.toLowerCase()}|${period}`;
      const paid = paidMap.get(key) ?? 0;
      const remaining = Math.max(0, owed - paid);
      totalOutstanding += remaining;
    }

    // 6. Bets counts
    const [totalBets, settledBets] = await Promise.all([
      db.collection(COLLECTIONS.BETS).countDocuments(),
      db.collection(COLLECTIONS.BETS).countDocuments({ outcome: { $exists: true } }),
    ]);

    // Return all items
    return res.status(200).json({
      players: {
        total: totalPlayers,
        pro: proPlayers,
        beg: begPlayers,
      },
      tournaments: {
        total: totalTourneys,
        singles: singlesTourneys,
        doubles: doublesTourneys,
        matches: totalMatches,
      },
      financials: {
        totalCost,
        courtFee,
        shuttleTotal,
        sessionCount,
        totalPaid,
        totalOutstanding: Math.round(totalOutstanding),
      },
      bets: {
        total: totalBets,
        settled: settledBets,
      }
    });

  } catch (err) {
    console.error('[/api/admin/analytics]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
