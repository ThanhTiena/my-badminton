// POST /api/polls/[id]/close — close poll and trigger automation
// Admin only

import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/client';
import { COLLECTIONS } from '@/lib/db/constants';
import { requireAdmin } from '@/lib/auth/middleware';
import type { SessionPollDoc, PollResponseDoc } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid poll ID' });
  }

  const db = getDb();
  const pollsCol = db.collection<SessionPollDoc>(COLLECTIONS.POLLS);
  const responsesCol = db.collection<PollResponseDoc>(COLLECTIONS.POLL_RESPONSES);

  const pollId = new ObjectId(id);
  const poll = await pollsCol.findOne({ _id: pollId });

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  if (poll.status === 'closed') {
    return res.status(400).json({ error: 'Poll is already closed' });
  }

  if (poll.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot close a cancelled poll' });
  }

  // Update poll status to closed
  await pollsCol.updateOne(
    { _id: pollId },
    {
      $set: {
        status: 'closed',
        closedAt: new Date(),
      },
    }
  );

  // Get all responses for automation
  const responses = await responsesCol.find({ pollId }).toArray();

  const result: {
    success: true;
    pollId: string;
    tournamentCreated?: boolean;
    tournamentId?: string;
    paymentCreated?: boolean;
    paymentSessionId?: string;
    message: string;
  } = {
    success: true,
    pollId: id,
    message: 'Poll closed successfully',
  };

  // Trigger automation if enabled
  if (poll.autoCreateTournament && !poll.tournamentCreated) {
    const tournamentId = await createTournamentDraft(poll, responses);
    if (tournamentId) {
      await pollsCol.updateOne(
        { _id: pollId },
        {
          $set: {
            tournamentCreated: true,
            tournamentId,
          },
        }
      );
      result.tournamentCreated = true;
      result.tournamentId = tournamentId.toString();
    }
  }

  if (poll.autoCreatePayment && !poll.paymentCreated) {
    const paymentSessionId = await createPaymentSessionDraft(poll, responses);
    if (paymentSessionId) {
      await pollsCol.updateOne(
        { _id: pollId },
        {
          $set: {
            paymentCreated: true,
            paymentSessionId,
          },
        }
      );
      result.paymentCreated = true;
      result.paymentSessionId = paymentSessionId.toString();
    }
  }

  return res.status(200).json(result);
}

/**
 * Create tournament draft from poll responses
 * Returns the tournament ID if successful
 */
async function createTournamentDraft(
  poll: SessionPollDoc,
  responses: PollResponseDoc[]
): Promise<ObjectId | null> {
  // Get all "yes" responses
  const confirmedPlayers = responses
    .filter(r => r.response === 'yes')
    .map(r => r.playerName);

  if (confirmedPlayers.length === 0) {
    // No players confirmed - skip tournament creation
    return null;
  }

  const db = getDb();
  const playersCol = db.collection(COLLECTIONS.PLAYERS);

  // Fetch player objects to get their groups (pro/beg)
  const playerDocs = await playersCol
    .find({ name: { $in: confirmedPlayers }, active: true })
    .toArray();

  const playerMap = new Map(playerDocs.map(p => [p.name, p]));

  const participants = confirmedPlayers
    .filter(name => playerMap.has(name))
    .map(name => {
      const player = playerMap.get(name)!;
      return {
        name: player.name,
        group: player.group as 'pro' | 'beg',
      };
    });

  if (participants.length === 0) {
    return null;
  }

  // Create tournament state in draft mode
  const activeTournamentCol = db.collection(COLLECTIONS.ACTIVE_TOURNAMENT);

  // Check if there's already an active tournament
  const existingTournament = await activeTournamentCol.findOne({ key: 'current' });
  if (existingTournament) {
    // Don't overwrite existing tournament - return null
    return null;
  }

  const pros = participants.filter(p => p.group === 'pro');
  const beginners = participants.filter(p => p.group === 'beg');

  // Create minimal tournament state (setup screen)
  const tournamentState = {
    key: 'current' as const,
    updatedAt: new Date(),
    state: {
      pros,
      beginners,
      gameType: 'doubles' as const,
      tourneyFormat: 'elimination' as const,
      currentRoundIdx: 0,
      teams: [],
      rounds: [],
      history: [],
      champion: null,
      rrStandings: {},
      currentScreen: 'setup' as const,
    },
    // Mark as draft (created from poll)
    draftMode: true,
    pollId: poll._id,
  };

  const result = await activeTournamentCol.insertOne(tournamentState as any);
  return result.insertedId;
}

/**
 * Create payment session draft from poll responses
 * Returns the session ID if successful
 */
async function createPaymentSessionDraft(
  poll: SessionPollDoc,
  responses: PollResponseDoc[]
): Promise<ObjectId | null> {
  // Get all "yes" responses
  const confirmedPlayers = responses
    .filter(r => r.response === 'yes')
    .map(r => r.playerName);

  // Include guests
  let guestCount = 0;
  responses.forEach(r => {
    if (r.response === 'yes' && r.guestCount) {
      guestCount += r.guestCount;
    }
  });

  if (confirmedPlayers.length === 0) {
    // No players confirmed - skip payment creation
    return null;
  }

  const db = getDb();
  const sessionsCol = db.collection(COLLECTIONS.COURT_SESSIONS);
  const paymentConfigCol = db.collection(COLLECTIONS.PAYMENT_CONFIG);

  // Fetch payment configs for players
  const allConfigs = await paymentConfigCol.find({}).toArray();
  const cfgMap = new Map<string, { smashWeight: number; courtRate: number; shuttleRate: number }>();
  for (const cfg of allConfigs) {
    cfgMap.set(cfg.playerName.toLowerCase(), {
      smashWeight: cfg.smashWeight,
      courtRate: cfg.courtRate ?? 1.0,
      shuttleRate: cfg.shuttleRate ?? 1.0,
    });
  }

  // Create draft payment session
  const date = new Date(poll.sessionDate);

  const playersWithWeight = confirmedPlayers.map(name => {
    const cfg = cfgMap.get(name.toLowerCase());
    return {
      name,
      smashWeight: cfg?.smashWeight ?? 1.0,
      courtRate: cfg?.courtRate ?? 1.0,
      shuttleRate: cfg?.shuttleRate ?? 1.0,
      courtShare: 0,
      shuttleShare: 0,
      amountOwed: 0,
      amountOwedRounded: 0,
    };
  });

  // Add guest placeholders if needed
  for (let i = 0; i < guestCount; i++) {
    playersWithWeight.push({
      name: `Guest ${i + 1}`,
      smashWeight: 1.0,
      courtRate: 1.0,
      shuttleRate: 1.0,
      courtShare: 0,
      shuttleShare: 0,
      amountOwed: 0,
      amountOwedRounded: 0,
    });
  }

  const sessionDoc = {
    sessionDate: poll.sessionDate,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    week: getISOWeek(poll.sessionDate),
    venueId: poll.venueId,
    venueName: poll.venueName,
    // Costs to be filled in by admin
    courtFee: 0,
    numShuttlecocks: 0,
    shuttlecockUnitPrice: 0,
    shuttlecockTotal: 0,
    totalCost: 0,
    players: playersWithWeight,
    note: `Created from poll: ${poll.pollTitle}`,
    // Mark as draft
    draftMode: true,
    pollId: poll._id,
    importedAt: new Date(),
  };

  const result = await sessionsCol.insertOne(sessionDoc as any);
  return result.insertedId;
}

/**
 * Get ISO week number from date string
 */
function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr);
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
