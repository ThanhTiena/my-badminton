// GET /api/payment/summary — admin only
// Aggregates session data for a period and returns how much each player owes.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { CourtSessionDoc } from '@/lib/models';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { mode = 'monthly', ref, from, to } = req.query as {
    mode?: string; ref?: string; from?: string; to?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  let period = '';

  if (mode === 'range' && from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    filter.sessionDate = { $gte: from, $lte: to };
    const fmt = (d: string) => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };
    period = from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
  } else if (mode === 'weekly' && ref && /^\d{4}-W\d{1,2}$/.test(ref)) {
    const [yearStr, wPart] = ref.split('-W');
    filter.year = Number(yearStr);
    filter.week = Number(wPart);
    period = `Week ${wPart} / ${yearStr}`;
  } else {
    const refStr = (ref && /^\d{4}-\d{2}$/.test(ref)) ? ref : new Date().toISOString().slice(0, 7);
    const [yearStr, monStr] = refStr.split('-');
    filter.year  = Number(yearStr);
    filter.month = Number(monStr);
    period = `${MONTH_NAMES[filter.month - 1]} ${filter.year}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSessions: any[] = await getDb()
    .collection<CourtSessionDoc>(COLLECTIONS.COURT_SESSIONS)
    .aggregate([
      { $match: filter },
      { $sort: { sessionDate: 1 } },
      { $addFields: { invoiceCount: { $size: { $ifNull: ['$invoiceImages', []] } } } },
      { $project: { invoiceImages: 0 } },   // strip base64 blobs from response
    ])
    .toArray();

  const sessions: CourtSessionDoc[] = rawSessions;
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
