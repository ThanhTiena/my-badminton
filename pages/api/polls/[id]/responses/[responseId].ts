// PATCH /api/polls/[id]/responses/[responseId] — update RSVP (player who created it, before deadline)

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import type { SessionPollDoc, PollResponseDoc } from '@/lib/models';
import { canRespondToPoll } from '@/lib/polls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, responseId } = req.query as { id: string; responseId: string };

  if (!ObjectId.isValid(id) || !ObjectId.isValid(responseId)) {
    return res.status(400).json({ error: 'Invalid poll or response ID' });
  }

  const db = getDb();
  const pollsCol = db.collection<SessionPollDoc>(COLLECTIONS.POLLS);
  const responsesCol = db.collection<PollResponseDoc>(COLLECTIONS.POLL_RESPONSES);

  const pollId = new ObjectId(id);
  const responseObjectId = new ObjectId(responseId);

  // Fetch poll and response
  const [poll, existingResponse] = await Promise.all([
    pollsCol.findOne({ _id: pollId }),
    responsesCol.findOne({ _id: responseObjectId, pollId }),
  ]);

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  if (!existingResponse) {
    return res.status(404).json({ error: 'Response not found' });
  }

  // ── PATCH — update response ───────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { response, guestCount, note, playerId } = req.body as {
      response?: 'yes' | 'no' | 'maybe';
      guestCount?: number;
      note?: string;
      playerId?: string;
    };

    // Optional: verify the request is from the player who created the response
    // For now, we allow updates as long as poll is still accepting responses
    if (playerId && playerId !== existingResponse.playerId.toString()) {
      return res.status(403).json({ error: 'You can only update your own response' });
    }

    // Check if poll is still accepting responses
    const yesCount = await responsesCol.countDocuments({
      pollId,
      response: 'yes',
      _id: { $ne: responseObjectId }, // Exclude current response from count
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

    // Build update
    const updates: Partial<PollResponseDoc> = {
      updatedAt: new Date(),
    };

    if (response !== undefined) {
      if (!['yes', 'no', 'maybe'].includes(response)) {
        return res.status(400).json({ error: 'Response must be "yes", "no", or "maybe"' });
      }
      updates.response = response;
    }

    if (guestCount !== undefined) {
      if (typeof guestCount !== 'number' || guestCount < 0 || guestCount > 10) {
        return res.status(400).json({ error: 'Guest count must be between 0 and 10' });
      }
      // Only allow guest count for "yes" responses
      const finalResponse = response || existingResponse.response;
      updates.guestCount = finalResponse === 'yes' ? guestCount : undefined;
    }

    if (note !== undefined) {
      updates.note = note?.trim();
    }

    const result = await responsesCol.findOneAndUpdate(
      { _id: responseObjectId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return res.status(200).json(result);
  }

  res.setHeader('Allow', ['PATCH']);
  return res.status(405).end();
}
