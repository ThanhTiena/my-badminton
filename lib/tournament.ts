export type Group = 'pro' | 'beg';
export type GameType = 'singles' | 'doubles';
export type TourneyFormat = 'elimination' | 'roundrobin';

export interface Player {
  name: string;
  group: Group;
}

export interface Team {
  id: string;
  name: string;
  players: string[];
  playerObjs: Player[];
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team | null;
  scoreA: number;
  scoreB: number;
  winner: Team | null;
  bye: boolean;
  completed: boolean;
}

export interface Round {
  name: string;
  matches: Match[];
}

export interface RRStats {
  wins: number;
  losses: number;
  pts: number;
  scoreFor: number;
  scoreAgainst: number;
}

export interface HistoryEntry {
  round: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: string;
}

export interface TournamentState {
  pros: Player[];
  beginners: Player[];
  teams: Team[];
  gameType: GameType;
  tourneyFormat: TourneyFormat;
  currentScreen: 'setup' | 'tournament' | 'champion';
  rounds: Round[];
  currentRoundIdx: number;
  history: HistoryEntry[];
  champion: Team | null;
  rrStandings: Record<string, RRStats>;
}

export function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export function makeBalancedDoubleTeams(pros: Player[], beginners: Player[]): Player[][] {
  const prosQ = [...pros];
  const begsQ = [...beginners];
  const teams: Player[][] = [];

  // Pair pros with beginners first for balance
  while (prosQ.length > 0 && begsQ.length > 0) {
    teams.push([prosQ.pop()!, begsQ.pop()!]);
  }

  const remaining = [...prosQ, ...begsQ];
  while (remaining.length >= 2) {
    teams.push([remaining.pop()!, remaining.pop()!]);
  }

  // If one player is left over (odd total), rotate them into existing teams
  // so every match has 2v2. The odd player joins whichever team currently has 1.
  // If all teams already have 2, the last player joins the first team (3v2 avoided
  // by the caller ensuring at least 4 players — this is just a safety net).
  if (remaining.length === 1) {
    const odd = remaining[0];
    // Find a team with only 1 player (shouldn't happen if total >= 4, but guard anyway)
    const solo = teams.find(t => t.length === 1);
    if (solo) {
      solo.push(odd);
    } else {
      // All teams are pairs — append as a 3rd member of first team rather than
      // creating a singleton, so we never generate a 1-player team.
      // Caller (buildTeams) should prevent this via minimum player validation.
      teams[0].push(odd);
    }
  }
  return teams;
}

/**
 * Reshuffle only the unstarted matches within the active rounds.
 * Completed matches stay exactly as-is.
 * Teams are re-paired randomly among the teams whose matches haven't started.
 */
export function reshuffleUnstartedMatches(rounds: Round[]): Round[] {
  return rounds.map(round => {
    const started   = round.matches.filter(m => m.completed || m.scoreA > 0 || m.scoreB > 0);
    const unstarted = round.matches.filter(m => !m.completed && m.scoreA === 0 && m.scoreB === 0 && !m.bye);

    if (unstarted.length < 2) return round; // nothing to shuffle

    // Collect all teams from unstarted matches and re-pair them randomly
    const teams: Team[] = [];
    for (const m of unstarted) {
      teams.push(m.teamA);
      if (m.teamB) teams.push(m.teamB);
    }
    const shuffled = shuffleArr(teams);

    const newUnstarted: Match[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newUnstarted.push({
        ...unstarted[Math.floor(i / 2)],   // keep same match id slot
        teamA: shuffled[i],
        teamB: shuffled[i + 1],
        scoreA: 0, scoreB: 0,
        winner: null, completed: false,
      });
    }
    // If odd teams (shouldn't happen in normal flow), append leftover as bye
    if (shuffled.length % 2 !== 0) {
      const leftover = shuffled[shuffled.length - 1];
      newUnstarted.push({
        id: `m${++matchIdCounter}`,
        teamA: leftover, teamB: null,
        scoreA: 0, scoreB: 0,
        winner: leftover, bye: true, completed: true,
      });
    }

    return { ...round, matches: [...started, ...newUnstarted] };
  });
}

export function interleaveGroups(pros: Player[], beginners: Player[]): Player[] {
  const result: Player[] = [];
  const prosQ = [...pros];
  const begsQ = [...beginners];
  while (prosQ.length > 0 || begsQ.length > 0) {
    if (prosQ.length > 0) result.push(prosQ.shift()!);
    if (begsQ.length > 0) result.push(begsQ.shift()!);
  }
  return result;
}

let matchIdCounter = 0;

export function resetMatchCounter() {
  matchIdCounter = 0;
}

export function getNextMatchId(): string {
  return `m${++matchIdCounter}`;
}

export function buildTeams(state: TournamentState): Team[] {
  const shuffledPros = shuffleArr([...state.pros]);
  const shuffledBegs = shuffleArr([...state.beginners]);

  if (state.gameType === 'doubles') {
    const pairs = makeBalancedDoubleTeams(shuffledPros, shuffledBegs);
    return pairs.map((pair, i) => ({
      id: `t${i}`,
      name: pair.map(p => p.name).join(' & '),
      players: pair.map(p => p.name),
      playerObjs: pair,
    }));
  } else {
    const seeded = interleaveGroups(shuffledPros, shuffledBegs);
    return seeded.map((p, i) => ({
      id: `t${i}`,
      name: p.name,
      players: [p.name],
      playerObjs: [p],
    }));
  }
}

export function buildEliminationRounds(teams: Team[]): Round[] {
  const n = teams.length;
  const size = nextPow2(n);
  const byes = size - n;

  const playingTeams = teams.slice(0, n - byes);
  const byeTeams = teams.slice(n - byes);

  const firstRound: Round = { name: 'Round 1', matches: [] };

  for (let i = 0; i < playingTeams.length; i += 2) {
    firstRound.matches.push({
      id: `m${++matchIdCounter}`,
      teamA: playingTeams[i],
      teamB: playingTeams[i + 1],
      scoreA: 0, scoreB: 0,
      winner: null, bye: false, completed: false,
    });
  }

  for (const team of byeTeams) {
    firstRound.matches.push({
      id: `m${++matchIdCounter}`,
      teamA: team, teamB: null,
      scoreA: 0, scoreB: 0,
      winner: team, bye: true, completed: true,
    });
  }

  return [firstRound];
}

export function advanceElimination(rounds: Round[], currentRoundIdx: number): { rounds: Round[]; newIdx: number; champion: Team | null } {
  const currentRound = rounds[currentRoundIdx];
  const winners = currentRound.matches.map(m => m.winner).filter(Boolean) as Team[];

  if (winners.length === 1) {
    return { rounds, newIdx: currentRoundIdx, champion: winners[0] };
  }

  const nextRoundNum = currentRoundIdx + 2;
  const nextRound: Round = {
    name: winners.length === 2 ? 'Final' :
          winners.length === 4 ? 'Semi-Finals' :
          winners.length === 8 ? 'Quarter-Finals' : `Round ${nextRoundNum}`,
    matches: [],
  };

  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1] || null;
    const bye = !b;
    nextRound.matches.push({
      id: `m${++matchIdCounter}`,
      teamA: a,
      teamB: bye ? null : b,
      scoreA: 0, scoreB: 0,
      winner: bye ? a : null,
      bye, completed: bye,
    });
  }

  const newRounds = [...rounds, nextRound];
  return { rounds: newRounds, newIdx: currentRoundIdx + 1, champion: null };
}

export function buildRoundRobin(teams: Team[]): { rounds: Round[]; rrStandings: Record<string, RRStats> } {
  const rrStandings: Record<string, RRStats> = {};
  teams.forEach(t => {
    rrStandings[t.id] = { wins: 0, losses: 0, pts: 0, scoreFor: 0, scoreAgainst: 0 };
  });

  let list: (Team | null)[] = [...teams];
  if (list.length % 2 !== 0) list.push(null);

  const totalRounds = list.length - 1;
  const rounds: Round[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const roundMatches: Match[] = [];
    for (let i = 0; i < list.length / 2; i++) {
      const a = list[i];
      const b = list[list.length - 1 - i];
      if (a && b) {
        roundMatches.push({
          id: `m${++matchIdCounter}`,
          teamA: a, teamB: b,
          scoreA: 0, scoreB: 0,
          winner: null, bye: false, completed: false,
        });
      }
    }
    rounds.push({ name: `Round ${r + 1}`, matches: roundMatches });

    const fixed = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop()!);
    list = [fixed, ...rest];
  }

  return { rounds, rrStandings };
}

export function getRoundLabelForMatch(rounds: Round[], matchId: string): string {
  for (const round of rounds) {
    if (round.matches.some(m => m.id === matchId)) return round.name;
  }
  return '';
}

export function findMatch(rounds: Round[], id: string): Match | null {
  for (const round of rounds) {
    const m = round.matches.find(m => m.id === id);
    if (m) return m;
  }
  return null;
}

export function getRRSorted(teams: Team[], rrStandings: Record<string, RRStats>): { team: Team; stats: RRStats }[] {
  return teams
    .map(t => ({ team: t, stats: rrStandings[t.id] || { wins: 0, losses: 0, pts: 0, scoreFor: 0, scoreAgainst: 0 } }))
    .sort((a, b) => {
      if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
      const aDiff = a.stats.scoreFor - a.stats.scoreAgainst;
      const bDiff = b.stats.scoreFor - b.stats.scoreAgainst;
      return bDiff - aDiff;
    });
}

export function getCurrentRound(state: TournamentState): Round | null {
  if (state.tourneyFormat === 'elimination') {
    if (state.champion) return null;
    return state.rounds[state.currentRoundIdx] || null;
  } else {
    return state.rounds.find(r => r.matches.some(m => !m.completed)) || null;
  }
}
