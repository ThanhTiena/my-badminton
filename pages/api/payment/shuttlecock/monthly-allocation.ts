/**
 * GET /api/payment/shuttlecock/monthly-allocation
 *
 * Splits a fixed monthly shuttlecock purchase cost among players based on
 * how many sessions each player attended that month. Uses square-root
 * weighting so heavy attendees pay more, but the gap isn't extreme.
 *
 * Query params:
 *   ref              = "YYYY-MM"   (default: current month)
 *   totalCost        = number      VND spent on shuttlecocks this month
 *                                  (omit to auto-sum from session records)
 *
 * Response:
 * {
 *   period: string;
 *   totalShuttlecockCost: number;
 *   totalSessions: number;         // total player-session appearances
 *   players: {
 *     name: string;
 *     sessions: number;
 *     weight: number;              // √sessions, for transparency
 *     shuttleShare: number;        // exact VND (2 dp)
 *     shuttleShareRounded: number; // rounded to 1 000 VND
 *   }[];
 * }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { CourtSessionDoc } from '@/lib/models';
import { allocateMonthlyShuttlecocks } from '@/business/shuttlecock-allocation';

const DB  = 'smashtour';
const COL = 'court_sessions';

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

  const sessions: CourtSessionDoc[] = await client
    .db(DB)
    .collection<CourtSessionDoc>(COL)
    .find({ year, month }, { projection: { players: 1, shuttlecockTotal: 1 } })
    .toArray();

  // Count how many sessions each player attended
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
