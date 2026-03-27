import { ObjectId } from 'mongodb';

/* ─────────────────────────────────────────────────────────────
   Player document  (collection: "players")
   Stores every player ever registered in the system.
   Re-used across tournaments — the user picks who joins each time.
───────────────────────────────────────────────────────────── */
export interface PlayerDoc {
  _id?: ObjectId;
  name: string;           // display name, unique
  group: 'pro' | 'beg';  // skill group
  createdAt: Date;
  // cumulative career stats updated after every tournament
  stats: {
    tournamentsPlayed: number;
    wins: number;
    losses: number;
    titles: number;       // tournaments won
  };
}

/* ─────────────────────────────────────────────────────────────
   TournamentHistory document  (collection: "tournament_history")
   One document per completed tournament.
───────────────────────────────────────────────────────────── */
export interface TournamentHistoryDoc {
  _id?: ObjectId;
  createdAt: Date;
  completedAt?: Date;
  gameType: 'singles' | 'doubles';
  format: 'elimination' | 'roundrobin';
  // snapshot of participants (names + groups at time of play)
  participants: { name: string; group: 'pro' | 'beg' }[];
  champion: string;       // winning team/player name
  // full match log
  matches: {
    round: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    winner: string;
  }[];
  // final RR standings (null for elimination)
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
