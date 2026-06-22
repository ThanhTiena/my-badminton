// ─── Poll utilities ───────────────────────────────────────────────────────
// Sprint 2: S2H.3 — Court Booking Suggestion

export interface CourtSuggestion {
  suggestedCourts: number;
  totalPlayers: number;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  guestCount: number;
  reasoning: string;
}

/**
 * Calculate suggested court count based on RSVP responses.
 *
 * Strategy:
 * - Confirmed players (Yes) + guests = guaranteed attendees
 * - Maybe responses counted at 50% probability
 * - Divide by players per court (default 4 for doubles)
 * - Always round up to ensure capacity
 *
 * @param yesCount - Number of "Yes" responses
 * @param maybeCount - Number of "Maybe" responses
 * @param guestCount - Total guests from all "Yes" responses
 * @param playersPerCourt - Players per court (default 4)
 * @returns Court suggestion with reasoning
 */
export function calculateCourtSuggestion(
  yesCount: number,
  maybeCount: number,
  noCount: number,
  guestCount: number,
  playersPerCourt: number = 4
): CourtSuggestion {
  // Guaranteed attendees: confirmed players + their guests
  const guaranteedPlayers = yesCount + guestCount;

  // Include 50% of maybe responses for conservative estimate
  const maybeEstimate = Math.ceil(maybeCount * 0.5);

  // Total expected players
  const totalPlayers = guaranteedPlayers + maybeEstimate;

  // Calculate courts needed (always round up)
  const suggestedCourts = totalPlayers > 0
    ? Math.ceil(totalPlayers / playersPerCourt)
    : 0;

  // Build reasoning string
  let reasoning = '';
  if (totalPlayers === 0) {
    reasoning = 'No confirmed players yet';
  } else {
    const parts: string[] = [];

    if (yesCount > 0) {
      parts.push(`${yesCount} confirmed`);
    }

    if (guestCount > 0) {
      parts.push(`${guestCount} guest${guestCount === 1 ? '' : 's'}`);
    }

    if (maybeEstimate > 0) {
      parts.push(`~${maybeEstimate} maybe${maybeEstimate === 1 ? '' : 's'}`);
    }

    reasoning = `${parts.join(' + ')} = ${totalPlayers} players ÷ ${playersPerCourt} = ${suggestedCourts} court${suggestedCourts === 1 ? '' : 's'}`;
  }

  return {
    suggestedCourts,
    totalPlayers,
    yesCount,
    maybeCount,
    noCount,
    guestCount,
    reasoning,
  };
}

/**
 * Validate poll deadline is in the future
 */
export function validateDeadline(deadline: Date): { valid: boolean; error?: string } {
  const now = new Date();

  if (deadline <= now) {
    return {
      valid: false,
      error: 'RSVP deadline must be in the future',
    };
  }

  return { valid: true };
}

/**
 * Check if a poll can be edited based on status and responses
 */
export function canEditPoll(
  status: 'draft' | 'open' | 'closed' | 'cancelled',
  hasResponses: boolean
): { canEdit: boolean; reason?: string } {
  // Drafts can always be edited
  if (status === 'draft') {
    return { canEdit: true };
  }

  // Published polls with responses cannot be edited (data integrity)
  if (hasResponses) {
    return {
      canEdit: false,
      reason: 'Cannot edit poll with existing responses',
    };
  }

  // Published polls without responses can still be edited
  if (status === 'open') {
    return { canEdit: true };
  }

  // Closed/cancelled polls cannot be edited
  return {
    canEdit: false,
    reason: `Cannot edit ${status} poll`,
  };
}

/**
 * Check if a player can respond to a poll
 */
export function canRespondToPoll(
  pollStatus: 'draft' | 'open' | 'closed' | 'cancelled',
  deadline: Date,
  maxPlayers?: number,
  currentYesCount?: number
): { canRespond: boolean; reason?: string } {
  // Poll must be open
  if (pollStatus !== 'open') {
    return {
      canRespond: false,
      reason: `Poll is ${pollStatus}`,
    };
  }

  // Deadline must not have passed
  const now = new Date();
  if (deadline < now) {
    return {
      canRespond: false,
      reason: 'RSVP deadline has passed',
    };
  }

  // Check capacity if maxPlayers is set
  if (maxPlayers && currentYesCount && currentYesCount >= maxPlayers) {
    return {
      canRespond: false,
      reason: 'Poll is at capacity',
    };
  }

  return { canRespond: true };
}
