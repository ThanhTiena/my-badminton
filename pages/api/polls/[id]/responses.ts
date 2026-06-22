// GET  /api/polls/[id]/responses — admin only (list all responses)
// POST /api/polls/[id]/responses — public (submit RSVP)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { SessionPollDoc, PollResponseDoc, PlayerDoc } from '@/lib/models';
import { canRespondToPoll } from '@/lib/polls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  const db = getDb();
  const pollsCol = db.collection<SessionPollDoc>(COLLECTIONS.POLLS);
  const responsesCol = db.collection<PollResponseDoc>(COLLECTIONS.POLL_RESPONSES);
  const playersCol = db.collection<PlayerDoc>(COLLECTIONS.PLAYERS);

  const pollId = new ObjectId(id);
  const poll = await pollsCol.findOne({ _id: pollId });

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  // ── GET — list all responses (admin only) ─────────────────────────────────
  if (req.method === 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const responses = await responsesCol
      .find({ pollId })
      .sort({ respondedAt: -1 })
      .toArray();

    return res.status(200).json({ responses, total: responses.length });
  }

  // ── POST — submit RSVP (public) ───────────────────────────────────────────
  if (req.method === 'POST') {
    const { playerId, response, guestCount, note } = req.body as {
      playerId: string;
      response: 'yes' | 'no' | 'maybe';
      guestCount?: number;
      note?: string;
    };

    // Validation
    if (!playerId || !ObjectId.isValid(playerId)) {
      return res.status(400).json({ error: 'Valid player ID is required' });
    }

    if (!response || !['yes', 'no', 'maybe'].includes(response)) {
      return res.status(400).json({ error: 'Response must be "yes", "no", or "maybe"' });
    }

    if (guestCount !== undefined && (typeof guestCount !== 'number' || guestCount < 0 || guestCount > 10)) {
      return res.status(400).json({ error: 'Guest count must be between 0 and 10' });
    }

    // Check if poll is open and accepting responses
    const yesCount = await responsesCol.countDocuments({
      pollId,
      response: 'yes',
    });

    const canRespond = canRespondToPoll(
      poll.status,
      poll.rsvpDeadline,
      poll.maxPlayers,
      yesCount
    );

    if (!canRespond.canRespond) {
      return res.status(403).json({ error: canRespond.reason });
    }

    // Verify player exists
    const playerObjectId = new ObjectId(playerId);
    const player = await playersCol.findOne({ _id: playerObjectId });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if player already responded
    const existingResponse = await responsesCol.findOne({
      pollId,
      playerId: playerObjectId,
    });

    if (existingResponse) {
      return res.status(409).json({
        error: 'You have already responded to this poll. Use PATCH to update your response.',
        responseId: existingResponse._id,
      });
    }

    // Create response
    const pollResponse: PollResponseDoc = {
      pollId,
      playerId: playerObjectId,
      playerName: player.name,
      response,
      guestCount: response === 'yes' ? (guestCount || 0) : undefined,
      note: note?.trim(),
      respondedAt: new Date(),
    };

    const result = await responsesCol.insertOne(pollResponse);

    return res.status(201).json({
      ...pollResponse,
      _id: result.insertedId,
    });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
