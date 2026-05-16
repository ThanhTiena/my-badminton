/**
 * business/shuttlecock-allocation.ts
 *
 * Monthly shuttlecock cost allocation by session attendance.
 *
 * Problem: you buy a tube of shuttlecocks for the whole month without
 * tracking per-session usage. Players who attend more sessions should
 * pay more, but the gap shouldn't be extreme (attending 4× as many
 * sessions shouldn't mean paying 4× as much).
 *
 * Formula — square-root weighted allocation:
 *
 *   weight_i  = √(sessions_i)
 *   share_i   = (weight_i / Σ weight_j) × totalShuttlecockCost
 *
 * Effect: a player with 4 sessions pays 2× a player with 1 session
 * (not 4×), compressing the gap naturally while still rewarding
 * lighter attendees with a lower bill.
 */

import { toDP, roundVND } from '../lib/payment';

export interface PlayerAttendance {
  name: string;
  sessions: number;
}

export interface PlayerAllocation {
  name: string;
  sessions: number;
  weight: number;
  shuttleShare: number;
  shuttleShareRounded: number;
}

export interface MonthlyShuttlecockAllocation {
  totalShuttlecockCost: number;
  totalSessions: number;
  players: PlayerAllocation[];
}

/**
 * Allocate a fixed monthly shuttlecock cost across players proportionally
 * to the square root of their session attendance.
 *
 * @param players - Each player's name and how many sessions they attended
 * @param totalShuttlecockCost - Total VND spent on shuttlecocks for the month
 */
export function allocateMonthlyShuttlecocks(
  players: PlayerAttendance[],
  totalShuttlecockCost: number
): MonthlyShuttlecockAllocation {
  if (players.length === 0) {
    return { totalShuttlecockCost, totalSessions: 0, players: [] };
  }

  const active = players.filter(p => p.sessions > 0);
  if (active.length === 0) {
    return { totalShuttlecockCost, totalSessions: 0, players: players.map(p => ({
      name: p.name,
      sessions: 0,
      weight: 0,
      shuttleShare: 0,
      shuttleShareRounded: 0,
    })) };
  }

  const weights = active.map(p => Math.sqrt(p.sessions));
  const weightSum = weights.reduce((s, w) => s + w, 0);

  // Allocate shares, then adjust last player to absorb rounding error
  const allocated: PlayerAllocation[] = active.map((p, i) => {
    const weight = weights[i];
    const shuttleShare = toDP((weight / weightSum) * totalShuttlecockCost);
    return {
      name: p.name,
      sessions: p.sessions,
      weight: toDP(weight, 4),
      shuttleShare,
      shuttleShareRounded: roundVND(shuttleShare),
    };
  });

  // Absorb floating-point rounding error into the player with the most sessions
  const totalAllocated = allocated.reduce((s, p) => s + p.shuttleShare, 0);
  const drift = toDP(totalShuttlecockCost - totalAllocated);
  if (drift !== 0) {
    const heaviest = allocated.reduce((max, p) => p.weight > max.weight ? p : max, allocated[0]);
    heaviest.shuttleShare = toDP(heaviest.shuttleShare + drift);
    heaviest.shuttleShareRounded = roundVND(heaviest.shuttleShare);
  }

  // Include zero-session players (they pay nothing)
  const zeroPlayers: PlayerAllocation[] = players
    .filter(p => p.sessions === 0)
    .map(p => ({ name: p.name, sessions: 0, weight: 0, shuttleShare: 0, shuttleShareRounded: 0 }));

  const allPlayers = [
    ...allocated.sort((a, b) => b.sessions - a.sessions),
    ...zeroPlayers,
  ];

  const totalSessions = players.reduce((s, p) => s + p.sessions, 0);

  return { totalShuttlecockCost, totalSessions, players: allPlayers };
}
