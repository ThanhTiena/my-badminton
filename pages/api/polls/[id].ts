// GET    /api/polls/[id] — public if published, admin always
// PATCH  /api/polls/[id] — admin only, can't edit published polls with responses
// DELETE /api/polls/[id] — admin only, only if no responses

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { SessionPollDoc } from '@/lib/models';
import { canEditPoll, validateDeadline } from '@/lib/polls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  const db = getDb();
  const pollsCol = db.collection<SessionPollDoc>(COLLECTIONS.POLLS);
  const responsesCol = db.collection(COLLECTIONS.POLL_RESPONSES);

  const pollId = new ObjectId(id);
  const poll = await pollsCol.findOne({ _id: pollId });

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  // ── GET — view poll details ───────────────────────────────────────────────
  if (req.method === 'GET') {
    // Check if user is admin
    let isAdmin = false;
    try {
      const admin = await requireAdmin(req, res);
      if (admin) isAdmin = true;
    } catch {
      // Not admin
    }

    // Public users can only see published polls
    if (!isAdmin && poll.status !== 'open') {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get response counts
    const responses = await responsesCol.find({ pollId }).toArray();

    const yesCount = responses.filter((r: any) => r.response === 'yes').length;
    const maybeCount = responses.filter((r: any) => r.response === 'maybe').length;
    const noCount = responses.filter((r: any) => r.response === 'no').length;
    const guestCount = responses
      .filter((r: any) => r.response === 'yes')
      .reduce((sum: number, r: any) => sum + (r.guestCount || 0), 0);

    return res.status(200).json({
      ...poll,
      responseCount: responses.length,
      yesCount,
      maybeCount,
      noCount,
      guestCount,
    });
  }

  // ── PATCH — update poll (admin only) ──────────────────────────────────────
  if (req.method === 'PATCH') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    // Check if poll can be edited
    const responseCount = await responsesCol.countDocuments({ pollId });
    const hasResponses = responseCount > 0;

    const editCheck = canEditPoll(poll.status, hasResponses);
    if (!editCheck.canEdit) {
      return res.status(403).json({ error: editCheck.reason });
    }

    const {
      sessionDate,
      sessionTime,
      venueId,
      venueName,
      pollTitle,
      pollDescription,
      rsvpDeadline,
      maxPlayers,
      targetPlayers,
      customPlayerIds,
      status,
    } = req.body as Partial<SessionPollDoc>;

    const updates: Partial<SessionPollDoc> = {};

    if (sessionDate !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(sessionDate)) {
        return res.status(400).json({ error: 'Session date must be in YYYY-MM-DD format' });
      }
      updates.sessionDate = sessionDate.trim();
    }

    if (sessionTime !== undefined) {
      updates.sessionTime = sessionTime?.trim();
    }

    if (venueId !== undefined) {
      updates.venueId = venueId ? new ObjectId(venueId) : undefined;
    }

    if (venueName !== undefined) {
      updates.venueName = venueName?.trim();
    }

    if (pollTitle !== undefined) {
      if (!pollTitle.trim()) {
        return res.status(400).json({ error: 'Poll title cannot be empty' });
      }
      updates.pollTitle = pollTitle.trim();
    }

    if (pollDescription !== undefined) {
      updates.pollDescription = pollDescription?.trim();
    }

    if (rsvpDeadline !== undefined) {
      const deadlineDate = new Date(rsvpDeadline);
      const deadlineValidation = validateDeadline(deadlineDate);
      if (!deadlineValidation.valid) {
        return res.status(400).json({ error: deadlineValidation.error });
      }
      updates.rsvpDeadline = deadlineDate;
    }

    if (maxPlayers !== undefined) {
      updates.maxPlayers = maxPlayers;
    }

    if (targetPlayers !== undefined) {
      if (!['all_active', 'pro_only', 'beg_only', 'custom'].includes(targetPlayers)) {
        return res.status(400).json({ error: 'Invalid target players value' });
      }
      updates.targetPlayers = targetPlayers;
    }

    if (customPlayerIds !== undefined) {
      updates.customPlayerIds = customPlayerIds?.map((id) => new ObjectId(id));
    }

    // Handle status changes
    if (status !== undefined && status !== poll.status) {
      updates.status = status;

      // Track when poll was published
      if (status === 'open' && !poll.publishedAt) {
        updates.publishedAt = new Date();
      }

      // Track when poll was closed
      if (status === 'closed' && !poll.closedAt) {
        updates.closedAt = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const result = await pollsCol.findOneAndUpdate(
      { _id: pollId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return res.status(200).json(result);
  }

  // ── DELETE — delete poll (admin only, no responses) ───────────────────────
  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    // Check for existing responses
    const responseCount = await responsesCol.countDocuments({ pollId });
    if (responseCount > 0) {
      return res.status(403).json({
        error: `Cannot delete poll with ${responseCount} existing response(s)`,
      });
    }

    await pollsCol.deleteOne({ _id: pollId });
    return res.status(200).json({ message: 'Poll deleted successfully' });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).end();
}
