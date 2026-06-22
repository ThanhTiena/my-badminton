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
  /** Court rate snapshot (default 1.0). e.g. 0.7 = pays 70% of a normal court share. */
  courtRate: number;
  /** Shuttle rate snapshot (default 1.0). e.g. 0.7 = pays 30% less shuttle cost. */
  shuttleRate: number;
  /** Exact VND court share (2 dp) */
  courtShare: number;
  /** Exact VND shuttle share (2 dp) */
  shuttleShare: number;
  /** Exact VND share = courtShare + shuttleShare (2 dp) */
  amountOwed: number;
  /** VND share rounded to nearest 1000 — persisted so all devices agree */
  amountOwedRounded: number;
  /** Whether this player has paid their share for this session */
  paid?: boolean;
}

export interface CourtSessionDoc {
  _id?: ObjectId;
  /** "YYYY-MM-DD" — day the session was played */
  sessionDate: string;
  year: number;
  month: number;   // 1–12
  week: number;    // ISO week number (1–53)

  // NEW Sprint 1: Venue Reference
  venueId?: ObjectId;                // Reference to VenueDoc
  venueName?: string;                // Snapshot of venue name
  venueAddress?: string;             // Snapshot (optional)

  // NEW Sprint 1: Pricing Rule Applied
  pricingRuleId?: ObjectId;          // Which rule was used
  pricingRuleName?: string;          // Snapshot of rule name
  pricingRateApplied?: number;       // e.g., 1.5 or 250000
  pricingRateType?: RateType;        // 'multiplier' or 'fixed'

  // NEW Sprint 1: Pricing Breakdown
  baseCourtFee?: number;             // Before rule applied

  /** Total court rental fee for the session (VND) — after pricing rules applied */
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
  /** If true, this session has a notable event worth drawing attention to */
  highlight?: boolean;
  /** Optional note explaining what the highlight is */
  highlightNote?: string;
  /** Base64 data URLs of invoice images (e.g. ["data:image/jpeg;base64,..."]) */
  invoiceImages?: string[];
  /** Count of invoice images — injected by summary API (invoiceImages excluded for performance) */
  invoiceCount?: number;
  /**
   * True when shuttlecocks were bought as a bulk/tube purchase for the whole month.
   * These sessions contribute session counts to the monthly allocation but their
   * shuttlecock cost is NOT split per-session — it rolls into the monthly pool instead.
   * False/absent = shuttlecocks were bought individually that day (cost split per-session as normal).
   */
  shuttlecocksBulkPurchase?: boolean;

  // NEW Sprint 2: Poll Automation
  draftMode?: boolean;                 // True if created from poll (needs admin review)
  pollId?: ObjectId;                   // Reference to originating SessionPollDoc

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
  /**
   * Multiplier on this player's court share (0–2, default 1.0).
   * e.g. 0.7 = pays 70% of a normal court share.
   */
  courtRate: number;
  /**
   * Multiplier on this player's shuttle share (0–2, default 1.0).
   * e.g. 0.7 = women pay 30% less shuttle cost.
   */
  shuttleRate: number;
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
  /** See CourtSessionDoc.shuttlecocksBulkPurchase */
  shuttlecocksBulkPurchase?: boolean;
  // NEW Sprint 1: Venue and pricing support
  venueId?: string;             // Optional venue reference
  timeStart?: string;           // "HH:mm" format (e.g. "19:00")
  duration?: number;            // Hours (e.g. 2)
}

/* ─────────────────────────────────────────────────────────────
   Bet document  (collection: "bets")

   One document per bet placed on a match.
   A match can have many bets from many bettors.
───────────────────────────────────────────────────────────── */
export interface BetDoc {
  _id?: ObjectId;
  /** The match ID from TournamentState (e.g. "m3") */
  matchId: string;
  /** Human label shown in history, e.g. "Semi-Finals" */
  roundLabel: string;
  /** "Alice & Bob vs Charlie & Dave" — snapshot so history stays readable */
  matchLabel: string;
  /** Name of the person placing the bet */
  bettor: string;
  /** Which team they're betting on — the team name */
  pick: string;
  /** Free-text note: amount, terms, anything they want */
  note: string;
  /** Set once the match completes */
  outcome?: 'won' | 'lost';
  /** The actual winner team name — filled in when match completes */
  actualWinner?: string;
  createdAt: Date;
  settledAt?: Date;
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

  // NEW Sprint 2: Poll Automation
  draftMode?: boolean;                 // True if created from poll (needs admin review)
  pollId?: ObjectId;                   // Reference to originating SessionPollDoc

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
  active?: boolean;
  archivedAt?: Date;
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

/* ─────────────────────────────────────────────────────────────
   VENUE MANAGEMENT — VenueDoc  (collection: "venues")

   Multi-venue support for pricing and analytics.
   Sprint 1: S1H.1 — Venue Management System
───────────────────────────────────────────────────────────── */
export interface VenueDoc {
  _id?: ObjectId;

  // Identity
  name: string;                      // "Sunrise Sports Complex"
  slug: string;                      // "sunrise-sports" (URL-friendly)

  // Location
  address?: string;                  // "123 Main St, District 1, HCMC"
  district?: string;                 // "District 1" (for filtering)

  // Capacity
  courtCount: number;                // 8 courts available

  // Base Pricing (VND)
  baseHourlyRate: number;            // 200,000 VND/hour (default)

  // Facilities
  facilities?: string[];             // ["Parking", "Shower", "AC", "Lockers"]

  // Contact
  contactPerson?: string;            // "Mr. Nguyen"
  contactPhone?: string;             // "+84 901 234 567"

  // Admin notes
  notes?: string;                    // "Booking requires 24h notice"

  // Soft delete
  active: boolean;                   // true = available, false = archived

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                // Admin username
}

/* ─────────────────────────────────────────────────────────────
   PRICING RULES — PricingRuleDoc  (collection: "pricing_rules")

   Dynamic pricing based on time, day, date, and venue.
   Sprint 1: S1H.2 — Time-Based Pricing Rules
   Sprint 1: S1H.3 — Holiday/Special Event Pricing
───────────────────────────────────────────────────────────── */

export type RuleType = 'time_based' | 'special_event' | 'seasonal';
export type RateType = 'multiplier' | 'fixed';
export type CombinationStrategy = 'multiply' | 'highest' | 'additive';

export interface PricingRuleDoc {
  _id?: ObjectId;

  // Rule Identity
  ruleName: string;                    // "Weekend Peak Hours"
  ruleType: RuleType;

  // Scope — null = applies globally
  venueId?: ObjectId;                  // Restrict to specific venue
  venueName?: string;                  // Snapshot for audit trail

  // Day Pattern (ISO 8601 weekday: 1=Mon, 7=Sun)
  daysOfWeek?: number[];               // [6, 7] = Saturday & Sunday
                                        // null = all days

  // Time Range (24-hour format HH:mm)
  timeStart?: string;                  // "18:00" (6 PM)
  timeEnd?: string;                    // "21:00" (9 PM)
                                        // null = all day

  // Date Range (for seasonal/event pricing)
  dateStart?: string;                  // "2026-06-01" (ISO 8601)
  dateEnd?: string;                    // "2026-08-31"
                                        // null = always active

  // Pricing Adjustment
  rateType: RateType;                  // How to apply rate
  rateValue: number;                   // 1.5 = 50% more (multiplier)
                                        // 250000 = fixed price (VND)

  // Special Event Metadata (optional)
  eventName?: string;                  // "Lunar New Year 2026"
  eventIcon?: string;                  // "🎉" or "🎊"

  // Overlapping Rule Strategy (future use)
  combinationStrategy?: CombinationStrategy;
                                        // multiply: 1.5 × 1.3 = 1.95x
                                        // highest: max(1.5, 1.3) = 1.5x
                                        // additive: 1.5 + 1.3 - 1 = 1.8x

  // Priority (for rule resolution)
  priority: number;                    // 1-1000 (higher = more specific)
                                        // 100: venue + time + day
                                        // 50:  time + day only
                                        // 10:  day only
                                        // 1:   global default

  // Lifecycle
  active: boolean;                     // Enable/disable rule
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                  // Admin username
}

/* ─────────────────────────────────────────────────────────────
   SESSION POLLS — SessionPollDoc  (collection: "session_polls")

   Attendance polling system for reducing no-shows and improving
   RSVP rates.  Sprint 2: S2H.1 — Polling System Foundation
───────────────────────────────────────────────────────────── */
export interface SessionPollDoc {
  _id?: ObjectId;

  // Session Details
  sessionDate: string;                 // "2026-06-25" (ISO 8601 date)
  sessionTime?: string;                // "18:00-20:00" (optional)
  venueId?: ObjectId;                  // Reference to VenueDoc
  venueName?: string;                  // Snapshot of venue name

  // Poll Configuration
  pollTitle: string;                   // "Friday Night Badminton - June 25"
  pollDescription?: string;            // "Join us for an exciting session!"
  rsvpDeadline: Date;                  // When poll closes (ISO timestamp)
  maxPlayers?: number;                 // Optional capacity limit

  // Targeting
  targetPlayers: 'all_active' | 'pro_only' | 'beg_only' | 'custom';
  customPlayerIds?: ObjectId[];        // Used when targetPlayers = 'custom'

  // State
  status: 'draft' | 'open' | 'closed' | 'cancelled';

  // NEW Sprint 2: Poll Automation Flags
  autoCreateTournament?: boolean;      // Auto-create tournament when poll closes
  autoCreatePayment?: boolean;         // Auto-create payment session when poll closes
  tournamentCreated?: boolean;         // True if tournament draft created
  paymentCreated?: boolean;            // True if payment session draft created
  tournamentId?: ObjectId;             // Reference to created ActiveTournamentDoc
  paymentSessionId?: ObjectId;         // Reference to created CourtSessionDoc

  // Audit
  createdBy: string;                   // Admin username
  createdAt: Date;
  publishedAt?: Date;                  // When poll went live
  closedAt?: Date;                     // When poll was closed
}

/* ─────────────────────────────────────────────────────────────
   POLL RESPONSES — PollResponseDoc  (collection: "poll_responses")

   Individual player responses to session polls.
   Sprint 2: S2H.1 — Polling System Foundation
───────────────────────────────────────────────────────────── */
export interface PollResponseDoc {
  _id?: ObjectId;
  pollId: ObjectId;                    // Reference to SessionPollDoc

  // Player
  playerId: ObjectId;                  // Reference to PlayerDoc
  playerName: string;                  // Snapshot for display

  // Response
  response: 'yes' | 'no' | 'maybe';
  guestCount?: number;                 // How many guests they're bringing
  note?: string;                       // Optional comment from player

  // Audit
  respondedAt: Date;                   // First response timestamp
  updatedAt?: Date;                    // Last update timestamp
}

/* ─────────────────────────────────────────────────────────────
   3D TRAINING LAB — TechniqueDoc  (collection: "techniques")

   Professional badminton techniques with 3D pose data.
   Sprint 3: 3D Training Lab — Technique Library & Persistence
───────────────────────────────────────────────────────────── */

export type TechniqueCategory = 'offensive' | 'defensive' | 'serve' | 'footwork' | 'net_play' | 'specialty';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Joint3D {
  x: number;        // Canvas X coordinate (or 3D world X)
  y: number;        // Canvas Y coordinate (or 3D world Y)
  z: number;        // Depth (-30 to +30 for 2.5D, or 3D world Z)
}

export interface TechniquePose {
  name: string;                        // "Ready Position", "Wind-Up", "Contact Point"
  description: string;                 // "Balanced stance, racket up"
  durationMs?: number;                 // How long to hold this pose (animation)
  joints: Record<string, Joint3D>;     // Joint ID → 3D position
}

export interface TechniqueDoc {
  _id?: ObjectId;

  // Identity
  techniqueId: string;                 // "power-smash" (slug)
  name: string;                        // "Power Smash"
  category: TechniqueCategory;
  difficulty: DifficultyLevel;

  // Content
  description: string;                 // Short description (1-2 sentences)
  keyPoints: string[];                 // Coaching tips (3-7 bullet points)
  poses: TechniquePose[];              // Sequence of poses (2-5 typically)

  // Metadata
  thumbnailUrl?: string;               // Preview image URL
  videoUrl?: string;                   // Optional demo video
  tags?: string[];                     // ["overhead", "power", "finishing"]

  // Analytics
  viewCount: number;                   // How many times viewed
  favoriteCount: number;               // How many users favorited

  // Content Management
  author?: string;                     // "Coach Carlos" or "System"
  isOfficial: boolean;                 // True for curated content
  isPublished: boolean;                // False = draft mode

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                  // Admin username
}

/* ─────────────────────────────────────────────────────────────
   USER PROGRESS — UserProgressDoc  (collection: "user_progress")

   Tracks user training progress and favorites.
   Sprint 3: 3D Training Lab — Progress Tracking
───────────────────────────────────────────────────────────── */

export interface UserProgressDoc {
  _id?: ObjectId;

  // User Identity
  userId: ObjectId;                    // Reference to PlayerDoc
  userName: string;                    // Snapshot

  // Favorites
  favoriteTechniques: ObjectId[];      // Array of TechniqueDoc IDs

  // View History
  viewHistory: {
    techniqueId: ObjectId;
    viewedAt: Date;
    viewCount: number;                 // How many times they've viewed it
  }[];

  // Custom Techniques
  customTechniques: {
    name: string;
    description?: string;
    poses: TechniquePose[];
    createdAt: Date;
  }[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/* ─────────────────────────────────────────────────────────────
   MATCH SIMULATION — MatchSimulationDoc  (collection: "match_simulations")

   4-player match simulation with rally sequences.
   Sprint 3: 3D Training Lab — Match Simulation & Visualization
───────────────────────────────────────────────────────────── */

export type PlayerPosition = 'team1_left' | 'team1_right' | 'team2_left' | 'team2_right';
export type ShotType = 'serve' | 'return' | 'smash' | 'drop' | 'clear' | 'net' | 'drive';

export interface PlayerInMatch {
  playerId?: ObjectId;           // Reference to PlayerDoc (optional)
  playerName: string;            // "Alice"
  position: PlayerPosition;      // Court position
  techniqueId?: ObjectId;        // Default technique for this player
}

export interface ShotAction {
  shotId: string;                // "shot_1", "shot_2", etc.
  frameStart: number;            // Animation frame when shot starts (0-based)
  frameDuration: number;         // How many frames this shot takes (e.g., 60 = 1 second)

  // Who hits
  playerPosition: PlayerPosition;

  // What shot
  shotType: ShotType;
  techniqueId: ObjectId;         // Which technique animation to use

  // Shuttlecock trajectory
  trajectory: {
    startX: number;              // Starting 3D position
    startY: number;
    startZ: number;
    endX: number;                // Ending 3D position
    endY: number;
    endZ: number;
    peakHeight: number;          // Maximum height during arc
    spinRotations: number;       // Visual spin effect (0-3)
  };

  // Impact
  landingResult: 'in_bounds' | 'out' | 'net' | 'winner';
  pointWinner?: 'team1' | 'team2'; // Who won the point (if rally ended)
}

export interface RallySequence {
  rallyId: string;               // "rally_1", "rally_2", etc.
  rallyNumber: number;           // 1, 2, 3... (for display)
  server: PlayerPosition;        // Who serves
  shots: ShotAction[];           // Sequence of shots in this rally
  pointWinner: 'team1' | 'team2';
  scoreAfter: {
    team1: number;
    team2: number;
  };
}

export interface MatchSimulationDoc {
  _id?: ObjectId;

  // Match Info
  matchTitle: string;            // "Pro Doubles Championship"
  matchDescription?: string;     // Optional notes

  // Players (4 for doubles)
  team1: {
    teamName: string;            // "Team A"
    player1: PlayerInMatch;      // Left side
    player2: PlayerInMatch;      // Right side
  };

  team2: {
    teamName: string;            // "Team B"
    player1: PlayerInMatch;      // Left side
    player2: PlayerInMatch;      // Right side
  };

  // Match Sequence
  rallies: RallySequence[];      // All rallies in order

  // Final Score
  finalScore: {
    team1: number;
    team2: number;
  };

  winner: 'team1' | 'team2';

  // Metadata
  duration: number;              // Total animation frames
  isOfficial: boolean;           // Official demo vs user-created
  isPublished: boolean;          // Public visibility

  // Analytics
  viewCount: number;
  favoriteCount: number;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
