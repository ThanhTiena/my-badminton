import type { PlayerDoc } from './models';

/* ══════════════════════════════════════════════════════════════
   SCORING FORMULA
   ──────────────────────────────────────────────────────────────
   Every match you play contributes to your lifetime rank score.

   Per match:
     Win               +10 pts   (rewards winning)
     Loss               +1 pt    (rewards participation)
     Point scored       +1 pt    (per shuttle-point you scored)
     Point conceded    −0.5 pt   (small penalty for conceding)

   Per tournament:
     1st place (title) +25 pts   (big bonus for winning it all)
     2nd place         +10 pts   (runner-up recognition)

   The score is always ≥ 0.
══════════════════════════════════════════════════════════════ */

export const SCORE_WIN            = 10;
export const SCORE_LOSS           =  1;
export const SCORE_TITLE          = 25;
export const SCORE_RUNNER_UP      = 10;
export const SCORE_PER_PT_SCORED  =  1;
export const SCORE_PER_PT_CONCEDE = -0.5;

export function computeRankScore(stats: PlayerDoc['stats']): number {
  const raw =
    stats.wins            * SCORE_WIN +
    stats.losses          * SCORE_LOSS +
    stats.titles          * SCORE_TITLE +
    stats.runnerUps       * SCORE_RUNNER_UP +
    stats.pointsScored    * SCORE_PER_PT_SCORED +
    stats.pointsConceded  * SCORE_PER_PT_CONCEDE;
  return Math.max(0, Math.round(raw * 10) / 10);
}

/* ── Delta object returned for a single tournament's contribution ── */
export interface StatDelta {
  wins: number;
  losses: number;
  titles: number;
  runnerUps: number;
  tournamentsPlayed: number;
  pointsScored: number;
  pointsConceded: number;
}

/**
 * Given the finished tournament data, compute every participant's
 * stat delta.  Doubles teams split points scored/conceded equally.
 *
 * @param matches    - completed match log (teamA/teamB are team name strings)
 * @param champion   - winning team name string (may be "A & B" for doubles)
 * @param runnerUp   - runner-up team name string (optional)
 * @param participants - all players who joined (name + group)
 */
export function computeDeltas(
  matches: { teamA: string; teamB: string; scoreA: number; scoreB: number; winner: string }[],
  champion: string,
  runnerUp: string | undefined,
  participants: { name: string }[],
): Map<string, StatDelta> {
  const map = new Map<string, StatDelta>();

  const init = (): StatDelta => ({
    wins: 0, losses: 0, titles: 0, runnerUps: 0,
    tournamentsPlayed: 1, pointsScored: 0, pointsConceded: 0,
  });

  const get = (name: string) => {
    if (!map.has(name)) map.set(name, init());
    return map.get(name)!;
  };

  // Make sure every participant gets at least tournamentsPlayed: 1
  for (const p of participants) get(p.name);

  for (const m of matches) {
    const winnersRaw = m.winner;
    const loserRaw   = m.winner === m.teamA ? m.teamB : m.teamA;

    // Split team names (doubles = "Alice & Bob")
    const winnerNames = winnersRaw.split('&').map(n => n.trim()).filter(Boolean);
    const loserNames  = loserRaw.split('&').map(n => n.trim()).filter(Boolean);

    const winScore  = m.winner === m.teamA ? m.scoreA : m.scoreB;
    const loseScore = m.winner === m.teamA ? m.scoreB : m.scoreA;

    // Divide shuttle-points equally among team members
    const winPtsEach  = winScore  / winnerNames.length;
    const losePtsEach = loseScore / loserNames.length;

    for (const name of winnerNames) {
      const d = get(name);
      d.wins++;
      d.pointsScored    += winPtsEach;
      d.pointsConceded  += losePtsEach;
    }
    for (const name of loserNames) {
      const d = get(name);
      d.losses++;
      d.pointsScored    += losePtsEach;
      d.pointsConceded  += winPtsEach;
    }
  }

  // Title & runner-up bonuses — split across doubles team
  const champNames   = champion.split('&').map(n => n.trim()).filter(Boolean);
  const runnerNames  = (runnerUp ?? '').split('&').map(n => n.trim()).filter(Boolean);

  for (const name of champNames)  get(name).titles++;
  for (const name of runnerNames) get(name).runnerUps++;

  // Round pointsScored / pointsConceded to 1 decimal
  for (const d of map.values()) {
    d.pointsScored   = Math.round(d.pointsScored   * 10) / 10;
    d.pointsConceded = Math.round(d.pointsConceded * 10) / 10;
  }

  return map;
}
