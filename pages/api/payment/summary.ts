/**
 * GET /api/payment/summary
 *
 * Aggregates session data for a given period and returns how much
 * each player owes in total.
 *
 * Query params:
 *   mode = "monthly" | "weekly" | "range"   (default: "monthly")
 *   ref  = "YYYY-MM"              for monthly  (e.g. "2026-03")
 *        = "YYYY-Www"             for weekly   (e.g. "2026-W13")
 *   from = "YYYY-MM-DD"           for range (inclusive start)
 *   to   = "YYYY-MM-DD"           for range (inclusive end)
 *
 * Response:
 * {
 *   period: string;             // human label e.g. "March 2026" or "Week 13 / 2026"
 *   totalCost: number;          // sum of all session totalCosts in period
 *   sessions: CourtSessionDoc[];
 *   players: {
 *     name: string;
 *     totalOwed: number;        // sum of amountOwed across sessions
 *     totalOwedRounded: number; // sum of amountOwedRounded
 *     sessionCount: number;
 *   }[];
 * }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/lib/mongodb';
import type { CourtSessionDoc } from '@/lib/models';

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

  const { mode = 'monthly', ref, from, to } = req.query as { mode?: string; ref?: string; from?: string; to?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  let period = '';

  if (mode === 'range' && from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    // Date-range filter: sessionDate >= from, sessionDate <= to
    filter.sessionDate = { $gte: from, $lte: to };
    const fmt = (d: string) => {
      const [y, m, day] = d.split('-');
      return `${day}/${m}/${y}`;
    };
    period = from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  } else if (mode === 'weekly' && ref && /^\d{4}-W\d{1,2}$/.test(ref)) {
    const [yearStr, wPart] = ref.split('-W');
    filter.year = Number(yearStr);
    filter.week = Number(wPart);
    period = `Week ${wPart} / ${yearStr}`;
  } else {
    // Monthly (default) — fall back to current month if ref absent
    const refStr = (ref && /^\d{4}-\d{2}$/.test(ref)) ? ref : new Date().toISOString().slice(0, 7);
    const [yearStr, monStr] = refStr.split('-');
    filter.year  = Number(yearStr);
    filter.month = Number(monStr);
    period = `${MONTH_NAMES[filter.month - 1]} ${filter.year}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSessions: any[] = await client
    .db(DB)
    .collection<CourtSessionDoc>(COL)
    .aggregate([
      { $match: filter },
      { $sort: { sessionDate: 1 } },
      { $addFields: { invoiceCount: { $size: { $ifNull: ['$invoiceImages', []] } } } },
      { $project: { invoiceImages: 0 } },
    ])
    .toArray();
  const sessions: CourtSessionDoc[] = rawSessions;

  // Aggregate per-player totals
  const playerMap = new Map<string, { totalOwed: number; totalOwedRounded: number; sessionCount: number }>();

  let totalCost = 0;
  for (const s of sessions) {
    totalCost += s.totalCost;
    for (const p of s.players) {
      const existing = playerMap.get(p.name) ?? { totalOwed: 0, totalOwedRounded: 0, sessionCount: 0 };
      existing.totalOwed        = Math.round((existing.totalOwed + p.amountOwed) * 100) / 100;
      existing.totalOwedRounded += p.amountOwedRounded;
      existing.sessionCount     += 1;
      playerMap.set(p.name, existing);
    }
  }

  const players = Array.from(playerMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalOwed - a.totalOwed);

  return res.status(200).json({ period, totalCost, sessions, players });
}
