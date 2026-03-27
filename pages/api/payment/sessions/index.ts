/**
 * GET  /api/payment/sessions
 *   Query params (all optional):
 *     month=YYYY-MM      filter by year+month
 *     week=YYYY-Www      filter by year+ISO week  (e.g. 2026-W13)
 *     skip=0  limit=50
 *   Returns: { sessions: CourtSessionDoc[]; total: number }
 *
 * POST /api/payment/sessions
 *   Body: ImportRow[]  (parsed by the client, validated here)
 *   Fetches smash-weight configs, computes amounts, persists all rows.
 *   Returns: { inserted: number; sessions: CourtSessionDoc[] }
 *
 * DELETE /api/payment/sessions
 *   Body: { ids: string[] }
 *   Bulk-delete sessions by ID (undo import).
 *   Returns: { deleted: number }
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import client from '@/lib/mongodb';
import type { CourtSessionDoc, PaymentConfigDoc, ImportRow } from '@/lib/models';
import { computeSessionAmounts, getISOWeek } from '@/lib/payment';

const DB      = 'smashtour';
const COL     = 'court_sessions';
const CFG_COL = 'payment_configs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db      = client.db(DB);
  const col     = db.collection<CourtSessionDoc>(COL);
  const cfgCol  = db.collection<PaymentConfigDoc>(CFG_COL);

  /* ── GET ─────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    const { month, week, skip = '0', limit = '50' } = req.query as Record<string, string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      filter.year  = y;
      filter.month = m;
    } else if (week && /^\d{4}-W\d{1,2}$/.test(week)) {
      const [y, wPart] = week.split('-W');
      filter.year = Number(y);
      filter.week = Number(wPart);
    }

    const total    = await col.countDocuments(filter);
    const sessions = await col
      .find(filter)
      .sort({ sessionDate: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    return res.status(200).json({ sessions, total });
  }

  /* ── POST — import rows ──────────────────────────────────── */
  if (req.method === 'POST') {
    const body = req.body as ImportRow[];
    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).json({ error: 'Body must be a non-empty array of import rows' });
    }

    // Load all smash-weight configs into a map for O(1) lookup
    const allConfigs = await cfgCol.find({}).toArray();
    const weightMap  = new Map<string, number>();
    for (const cfg of allConfigs) {
      weightMap.set(cfg.playerName.toLowerCase(), cfg.smashWeight);
    }

    const docs: CourtSessionDoc[] = body.map(row => {
      const date = new Date(row.date);

      const playersWithWeight = row.players.map(name => ({
        name,
        smashWeight: weightMap.get(name.toLowerCase()) ?? 1.0,  // default = 1.0
      }));

      const { shuttlecockTotal, totalCost, players } = computeSessionAmounts({
        players:             playersWithWeight,
        courtFee:            row.courtFee,
        numShuttlecocks:     row.numShuttlecocks,
        shuttlecockUnitPrice: row.shuttlecockUnitPrice,
      });

      return {
        sessionDate:          row.date,
        year:                 date.getFullYear(),
        month:                date.getMonth() + 1,
        week:                 getISOWeek(row.date),
        courtFee:             row.courtFee,
        numShuttlecocks:      row.numShuttlecocks,
        shuttlecockUnitPrice: row.shuttlecockUnitPrice,
        shuttlecockTotal,
        totalCost,
        players,
        note:                 row.note,
        importedAt:           new Date(),
      };
    });

    const result   = await col.insertMany(docs);
    const inserted = result.insertedCount;

    // Return the freshly inserted docs (with _id)
    const ids      = Object.values(result.insertedIds);
    const sessions = await col.find({ _id: { $in: ids } }).sort({ sessionDate: 1 }).toArray();

    return res.status(201).json({ inserted, sessions });
  }

  /* ── DELETE — bulk remove ────────────────────────────────── */
  if (req.method === 'DELETE') {
    const { ids } = req.body as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '"ids" must be a non-empty string array' });
    }
    const objectIds = ids.map(id => new ObjectId(id));
    const result    = await col.deleteMany({ _id: { $in: objectIds } });
    return res.status(200).json({ deleted: result.deletedCount });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end();
}
