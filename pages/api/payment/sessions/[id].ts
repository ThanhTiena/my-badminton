/**
 * GET    /api/payment/sessions/[id]   — fetch a single session
 * PATCH  /api/payment/sessions/[id]   — update a session (costs, players, note, highlight)
 * DELETE /api/payment/sessions/[id]   — remove a single session
 */
export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import { put } from '@vercel/blob';
import type { CourtSessionDoc, PaymentConfigDoc, ImportRow } from '@/lib/models';
import { computeSessionAmounts, getISOWeek } from '@/lib/payment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  let oid: ObjectId;
  try { oid = new ObjectId(id); }
  catch { return res.status(400).json({ error: 'Invalid session id' }); }

  const db = getDb();
  const col = db.collection<CourtSessionDoc>(COLLECTIONS.COURT_SESSIONS);

  if (req.method === 'GET') {
    const doc = await col.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json(doc);
  }

  // Auth guard for write operations
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'PATCH') {
    const body = req.body as Partial<ImportRow & {
      highlight?: boolean; highlightNote?: string;
      invoiceImages?: string[] | null;
      shuttlecocksBulkPurchase?: boolean;
      /** Toggle paid for one player: { playerName, paid } */
      playerPaid?: { playerName: string; paid: boolean };
    }>;

    // Build the $set payload — only include fields that were sent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $set: Record<string, any> = {};

    const hasCosts =
      body.courtFee !== undefined ||
      body.numShuttlecocks !== undefined ||
      body.shuttlecockUnitPrice !== undefined ||
      (body.players && body.players.length > 0);

    if (hasCosts) {
      // Fetch the existing doc to fill in any missing fields
      const existing = await col.findOne({ _id: oid });
      if (!existing) return res.status(404).json({ error: 'Session not found' });

      const date            = body.date ?? existing.sessionDate;
      const courtFee        = body.courtFee        ?? existing.courtFee;
      const numShuttlecocks = body.numShuttlecocks ?? existing.numShuttlecocks;
      const shuttlecockUnitPrice = body.shuttlecockUnitPrice ?? existing.shuttlecockUnitPrice;
      const playerNames     = (body.players && body.players.length > 0) ? body.players : existing.players.map(p => p.name);

      // Re-fetch configs
      const cfgCol  = db.collection<PaymentConfigDoc>(COLLECTIONS.PAYMENT_CONFIG);
      const allCfgs = await cfgCol.find({}).toArray();
      const cfgMap  = new Map<string, { smashWeight: number; courtRate: number; shuttleRate: number }>();
      for (const cfg of allCfgs) {
        cfgMap.set(cfg.playerName.toLowerCase(), {
          smashWeight: cfg.smashWeight,
          courtRate:   cfg.courtRate   ?? 1.0,
          shuttleRate: cfg.shuttleRate ?? 1.0,
        });
      }

      const playersWithWeight = playerNames.map((name: string) => {
        const cfg = cfgMap.get(name.toLowerCase());
        return {
          name,
          smashWeight: cfg?.smashWeight ?? 1.0,
          courtRate:   cfg?.courtRate   ?? 1.0,
          shuttleRate: cfg?.shuttleRate ?? 1.0,
        };
      });

      const { shuttlecockTotal, totalCost, players } = computeSessionAmounts({
        players: playersWithWeight,
        courtFee,
        numShuttlecocks,
        shuttlecockUnitPrice,
      });

      const d = new Date(date);
      $set.sessionDate          = date;
      $set.year                 = d.getFullYear();
      $set.month                = d.getMonth() + 1;
      $set.week                 = getISOWeek(date);
      $set.courtFee             = courtFee;
      $set.numShuttlecocks      = numShuttlecocks;
      $set.shuttlecockUnitPrice = shuttlecockUnitPrice;
      $set.shuttlecockTotal     = shuttlecockTotal;
      $set.totalCost            = totalCost;
      $set.players              = players;
    }

    if (body.note !== undefined)                    $set.note                      = body.note;
    if (body.highlight !== undefined)               $set.highlight                 = body.highlight;
    if (body.highlightNote !== undefined)           $set.highlightNote             = body.highlightNote;
    if (body.invoiceImages !== undefined) {
      const urls: string[] = [];
      const images = body.invoiceImages ?? [];
      for (const img of images) {
        if (img.startsWith('data:image/')) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const contentType = match[1];
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, 'base64');
            let ext = 'jpg';
            if (contentType.includes('png')) ext = 'png';
            else if (contentType.includes('webp')) ext = 'webp';
            else if (contentType.includes('gif')) ext = 'gif';
            
            const filename = `invoice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
            const blob = await put(filename, buffer, {
              access: 'public',
              contentType,
            });
            urls.push(blob.url);
          } else {
            urls.push(img);
          }
        } else {
          urls.push(img);
        }
      }
      $set.invoiceImages = urls;
    }
    if (body.shuttlecocksBulkPurchase !== undefined) $set.shuttlecocksBulkPurchase = body.shuttlecocksBulkPurchase;

    // Per-player paid toggle: update a single player's paid flag inside the players array
    if (body.playerPaid !== undefined) {
      const existing = await col.findOne({ _id: oid });
      if (!existing) return res.status(404).json({ error: 'Session not found' });
      const { playerName, paid } = body.playerPaid;
      const updatedPlayers = existing.players.map(p =>
        p.name === playerName ? { ...p, paid } : p
      );
      $set.players = updatedPlayers;
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    await col.updateOne({ _id: oid }, { $set });
    const updated = await col.findOne({ _id: oid });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const result = await col.deleteOne({ _id: oid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json({ deleted: true });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  res.status(405).end();
}
