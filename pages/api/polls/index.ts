// GET  /api/polls — public (published polls) or admin (all polls)
// POST /api/polls — admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { SessionPollDoc } from '@/lib/models';
import { validateDeadline } from '@/lib/polls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  const pollsCol = db.collection<SessionPollDoc>(COLLECTIONS.POLLS);

  // ── GET — list polls ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { all, status, upcoming } = req.query as {
      all?: string;
      status?: string;
      upcoming?: string;
    };

    // Check if user is admin
    let isAdmin = false;
    try {
      const admin = await requireAdmin(req, res);
      if (admin) isAdmin = true;
    } catch {
      // Not admin, continue as public user
    }

    // Build filter
    const filter: any = {};

    // Admin sees all, public sees only open polls
    if (!isAdmin) {
      filter.status = 'open';
    } else if (status) {
      filter.status = status;
    }

    // Optional: only upcoming sessions (sessionDate >= today)
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      filter.sessionDate = { $gte: today };
    }

    const polls = await pollsCol
      .find(filter)
      .sort({ sessionDate: 1, createdAt: -1 })
      .toArray();

    // For each poll, get response counts
    const responsesCol = db.collection(COLLECTIONS.POLL_RESPONSES);
    const pollsWithCounts = await Promise.all(
      polls.map(async (poll) => {
        const responses = await responsesCol
          .find({ pollId: poll._id })
          .toArray();

        const yesCount = responses.filter((r: any) => r.response === 'yes').length;
        const maybeCount = responses.filter((r: any) => r.response === 'maybe').length;
        const noCount = responses.filter((r: any) => r.response === 'no').length;
        const guestCount = responses
          .filter((r: any) => r.response === 'yes')
          .reduce((sum: number, r: any) => sum + (r.guestCount || 0), 0);

        return {
          ...poll,
          responseCount: responses.length,
          yesCount,
          maybeCount,
          noCount,
          guestCount,
        };
      })
    );

    return res.status(200).json({ polls: pollsWithCounts, total: pollsWithCounts.length });
  }

  // ── POST — create poll (admin only) ───────────────────────────────────────
  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

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

    // Validation
    if (!sessionDate?.trim()) {
      return res.status(400).json({ error: 'Session date is required' });
    }

    if (!pollTitle?.trim()) {
      return res.status(400).json({ error: 'Poll title is required' });
    }

    if (!rsvpDeadline) {
      return res.status(400).json({ error: 'RSVP deadline is required' });
    }

    const deadlineDate = new Date(rsvpDeadline);
    const deadlineValidation = validateDeadline(deadlineDate);
    if (!deadlineValidation.valid) {
      return res.status(400).json({ error: deadlineValidation.error });
    }

    if (!targetPlayers || !['all_active', 'pro_only', 'beg_only', 'custom'].includes(targetPlayers)) {
      return res.status(400).json({ error: 'Invalid target players value' });
    }

    if (targetPlayers === 'custom' && (!customPlayerIds || customPlayerIds.length === 0)) {
      return res.status(400).json({ error: 'Custom player IDs required when targetPlayers is "custom"' });
    }

    // Validate session date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sessionDate)) {
      return res.status(400).json({ error: 'Session date must be in YYYY-MM-DD format' });
    }

    // Build poll document
    const poll: SessionPollDoc = {
      sessionDate: sessionDate.trim(),
      sessionTime: sessionTime?.trim(),
      venueId: venueId ? new ObjectId(venueId) : undefined,
      venueName: venueName?.trim(),
      pollTitle: pollTitle.trim(),
      pollDescription: pollDescription?.trim(),
      rsvpDeadline: deadlineDate,
      maxPlayers,
      targetPlayers,
      customPlayerIds: customPlayerIds?.map((id) => new ObjectId(id)),
      status: status || 'draft',
      createdBy: admin.username,
      createdAt: new Date(),
      publishedAt: status === 'open' ? new Date() : undefined,
    };

    const result = await pollsCol.insertOne(poll);
    return res.status(201).json({ ...poll, _id: result.insertedId });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
