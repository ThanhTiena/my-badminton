import { ObjectId } from 'mongodb';

/* ─────────────────────────────────────────────────────────────
   Player document  (collection: "players")
───────────────────────────────────────────────────────────── */
export interface PlayerDoc {
  _id?: ObjectId;
  name: string;
  group: 'pro' | 'beg';
  createdAt: Date;

  /** Raw career counters — incremented after every tournament */
  stats: {
    tournamentsPlayed: number;
    wins: number;           // match wins
    losses: number;         // match losses
    titles: number;         // tournament 1st places
    runnerUps: number;      // tournament 2nd places
    pointsScored: number;   // total shuttle-points scored across all matches
    pointsConceded: number; // total shuttle-points conceded
  };

  /**
   * Computed ranking score — recalculated and stored whenever a
   * tournament finishes.  Formula (see lib/scoring.ts):
   *
   *   score = wins×10 + losses×1 + titles×25 + runnerUps×10
   *         + pointsScored×1 − pointsConceded×0.5
   */
  rankScore: number;

  /** Snapshot of the last time rankScore was recalculated */
  rankUpdatedAt?: Date;
}

/* ─────────────────────────────────────────────────────────────
   TournamentHistory document  (collection: "tournament_history")
───────────────────────────────────────────────────────────── */
export interface TournamentHistoryDoc {
  _id?: ObjectId;
  createdAt: Date;
  completedAt?: Date;
  gameType: 'singles' | 'doubles';
  format: 'elimination' | 'roundrobin';
  participants: { name: string; group: 'pro' | 'beg' }[];
  champion: string;
  runnerUp?: string;    // 2nd place (final loser or RR rank-2 team)
  matches: {
    round: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    winner: string;
  }[];
  standings?: {
    rank: number;
    name: string;
    wins: number;
    losses: number;
    pts: number;
    scoreFor: number;
    scoreAgainst: number;
  }[];
}
