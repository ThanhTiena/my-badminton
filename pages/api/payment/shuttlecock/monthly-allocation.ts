/**
 * GET /api/payment/shuttlecock/monthly-allocation
 *
 * Splits a fixed monthly shuttlecock tube cost among players weighted by
 * how many bulk-purchase sessions each player attended (square-root weighting).
 *
 * "Bulk-purchase" sessions = days where you bought a whole tube for the month
 * (shuttlecocksBulkPurchase: true). Sessions where you bought shuttlecocks
 * individually are excluded — those are already split per-session in the
 * normal payment flow.
 *
 * Square-root weighting: attending 4× as many sessions → pay 2× as much
 * (not 4×), so the gap stays real but not extreme.
 *
 * Query params:
 *   ref        = "YYYY-MM"   (default: current month)
 *   totalCost  = number      VND spent on the bulk tube purchase.
 *                            If omitted, auto-sums shuttlecockTotal from
 *                            bulk-purchase sessions in the period.
 *
 * Response:
 * {
 *   period: string;
 *   totalShuttlecockCost: number;
 *   totalSessions: number;
 *   players: {
 *     name: string;
 *     sessions: number;            // sessions attended (bulk-purchase days only)
 *     weight: number;              // √sessions — shown for transparency
 *     shuttleShare: number;        // exact VND (2 dp)
 *     shuttleShareRounded: number; // rounded to nearest 1 000 VND
 *   }[];
 * }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { CourtSessionDoc } from '@/lib/models';
import { allocateMonthlyShuttlecocks } from '@/business/shuttlecock-allocation';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { ref, totalCost: totalCostParam } = req.query as { ref?: string; totalCost?: string };

  const refStr = ref && /^\d{4}-\d{2}$/.test(ref) ? ref : new Date().toISOString().slice(0, 7);
  const [yearStr, monStr] = refStr.split('-');
  const year  = Number(yearStr);
  const month = Number(monStr);
  const period = `${MONTH_NAMES[month - 1]} ${year}`;

  // Only consider sessions flagged as bulk-purchase
  const sessions: CourtSessionDoc[] = await getDb()
    .collection<CourtSessionDoc>(COLLECTIONS.COURT_SESSIONS)
    .find(
      { year, month, shuttlecocksBulkPurchase: true },
      { projection: { players: 1, shuttlecockTotal: 1 } }
    )
    .toArray();

  // Count attendance and auto-sum cost from bulk sessions
  const sessionCountMap = new Map<string, number>();
  let autoShuttlecockTotal = 0;

  for (const s of sessions) {
    autoShuttlecockTotal += s.shuttlecockTotal ?? 0;
    for (const p of s.players) {
      sessionCountMap.set(p.name, (sessionCountMap.get(p.name) ?? 0) + 1);
    }
  }

  const totalShuttlecockCost = totalCostParam && !isNaN(Number(totalCostParam))
    ? Number(totalCostParam)
    : autoShuttlecockTotal;

  const players = Array.from(sessionCountMap.entries()).map(([name, sessions]) => ({
    name,
    sessions,
  }));

  const allocation = allocateMonthlyShuttlecocks(players, totalShuttlecockCost);

  return res.status(200).json({ period, ...allocation });
}
