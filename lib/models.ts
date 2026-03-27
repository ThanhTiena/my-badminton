import { ObjectId } from 'mongodb';

/* ─────────────────────────────────────────────────────────────
   PAYMENT — CourtSessionDoc  (collection: "court_sessions")

   One document = one physical court booking (a single day).
   Stores the raw costs and every player's computed share.
   Amounts are in VND, stored as exact numbers (2 dp precision).
───────────────────────────────────────────────────────────── */
export interface SessionPlayer {
  name: string;
  /** Smash-weight snapshot at import time (1.0 = normal, 1.5 = heavy smasher).
   *  Snapshotted so past records are stable if weights change later. */
  smashWeight: number;
  /** Exact VND share = courtShare + shuttleShare (2 dp) */
  amountOwed: number;
  /** VND share rounded to nearest 1000 — persisted so all devices agree */
  amountOwedRounded: number;
}

export interface CourtSessionDoc {
  _id?: ObjectId;
  /** "YYYY-MM-DD" — day the session was played */
  sessionDate: string;
  year: number;
  month: number;   // 1–12
  week: number;    // ISO week number (1–53)
  /** Total court rental fee for the session (VND) */
  courtFee: number;
  numShuttlecocks: number;
  shuttlecockUnitPrice: number;
  /** numShuttlecocks × shuttlecockUnitPrice */
  shuttlecockTotal: number;
  /** courtFee + shuttlecockTotal */
  totalCost: number;
  players: SessionPlayer[];
  /** Optional free-text memo (e.g. "Court 3, Saturday session") */
  note?: string;
  importedAt: Date;
}

/* ─────────────────────────────────────────────────────────────
   PAYMENT — PaymentConfigDoc  (collection: "payment_configs")

   One document per player.  Stores the smash-weight multiplier
   used when splitting shuttlecock costs.  Kept in its own
   collection so the tournament PlayerDoc stays clean.
───────────────────────────────────────────────────────────── */
export interface PaymentConfigDoc {
  _id?: ObjectId;
  /** Matches PlayerDoc.name — used as the lookup key (unique index) */
  playerName: string;
  /** 1.0 = standard share; >1 = pays proportionally more shuttlecock cost */
  smashWeight: number;
  updatedAt: Date;
}

/* ─────────────────────────────────────────────────────────────
   PAYMENT — ImportRow  (client-only, never persisted directly)

   Shape of each row the user imports via CSV or JSON paste.
───────────────────────────────────────────────────────────── */
export interface ImportRow {
  date: string;                 // "YYYY-MM-DD"
  players: string[];            // player names
  courtFee: number;             // total court rental VND
  numShuttlecocks: number;
  shuttlecockUnitPrice: number; // VND per shuttlecock
  note?: string;
}

/* ─────────────────────────────────────────────────────────────
   ActiveTournament document  (collection: "active_tournament")

   A singleton collection — at most ONE document exists at a time.
   Stores the full live TournamentState so the app can resume
   across page refreshes, device switches, or server restarts.

   Lifecycle:
     • Created/replaced (upsert) when a tournament is started or
       any match state changes (score update, winner declared, etc.)
     • Deleted when the tournament is cancelled or completes.
───────────────────────────────────────────────────────────── */
export interface ActiveTournamentDoc {
  _id?: ObjectId;
  /** Singleton key — always "current". Used for the upsert filter. */
  key: 'current';
  /** ISO timestamp of the last state change */
  updatedAt: Date;
  /** The full serialised TournamentState from lib/tournament.ts */
  state: {
    pros:            { name: string; group: 'pro' | 'beg' }[];
    beginners:       { name: string; group: 'pro' | 'beg' }[];
    gameType:        'singles' | 'doubles';
    tourneyFormat:   'elimination' | 'roundrobin';
    currentRoundIdx: number;
    teams: {
      id: string;
      name: string;
      players: string[];
      playerObjs: { name: string; group: 'pro' | 'beg' }[];
    }[];
    rounds: {
      name: string;
      matches: {
        id: string;
        teamA: {
          id: string; name: string;
          players: string[];
          playerObjs: { name: string; group: 'pro' | 'beg' }[];
        };
        teamB: {
          id: string; name: string;
          players: string[];
          playerObjs: { name: string; group: 'pro' | 'beg' }[];
        } | null;
        scoreA: number;
        scoreB: number;
        winner: {
          id: string; name: string;
          players: string[];
          playerObjs: { name: string; group: 'pro' | 'beg' }[];
        } | null;
        bye: boolean;
        completed: boolean;
      }[];
    }[];
    history: {
      round: string;
      teamA: string; teamB: string;
      scoreA: number; scoreB: number;
      winner: string;
    }[];
    champion: {
      id: string; name: string;
      players: string[];
      playerObjs: { name: string; group: 'pro' | 'beg' }[];
    } | null;
    rrStandings: Record<string, {
      wins: number; losses: number; pts: number;
      scoreFor: number; scoreAgainst: number;
    }>;
    currentScreen: 'setup' | 'tournament' | 'champion';
  };
}

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
