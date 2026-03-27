/**
 * lib/payment.ts
 * ─────────────────────────────────────────────────────────────
 * Pure utility functions for the Payment feature.
 * No I/O, no side-effects — easy to unit-test.
 * ─────────────────────────────────────────────────────────────
 *
 * COST SPLIT FORMULA
 * ──────────────────
 * Given a session with players P₁…Pₙ, court fee C, and
 * shuttlecock total S = numShuttlecocks × unitPrice:
 *
 *   courtShare_i      = C / n                (equal split)
 *   weightSum         = Σ smashWeight_i
 *   shuttleShare_i    = (smashWeight_i / weightSum) × S
 *   amountOwed_i      = courtShare_i + shuttleShare_i
 *
 * Amounts are stored in VND with 2-decimal precision.
 * The "round" button rounds each amount to the nearest 1 000 VND.
 */

import type { ImportRow, SessionPlayer } from './models';

/* ── Rounding helpers ─────────────────────────────────────── */

/** Round a VND amount to the nearest 1 000 */
export function roundVND(amount: number): number {
  return Math.round(amount / 1000) * 1000;
}

/** Round a number to N decimal places (default 2) */
export function toDP(n: number, dp = 2): number {
  const factor = Math.pow(10, dp);
  return Math.round(n * factor) / factor;
}

/* ── ISO week number ──────────────────────────────────────── */

/**
 * Returns the ISO 8601 week number (1–53) for a given date string "YYYY-MM-DD".
 * ISO week starts on Monday; week 1 is the week containing the first Thursday.
 */
export function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  // Thursday of current week determines the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - jan4.getTime()) / 86400000 -
        3 +
        ((jan4.getDay() + 6) % 7)) /
        7
    )
  );
}

/* ── Per-session cost computation ────────────────────────── */

export interface ComputeInput {
  players: { name: string; smashWeight: number }[];
  courtFee: number;
  numShuttlecocks: number;
  shuttlecockUnitPrice: number;
}

export interface ComputeResult {
  shuttlecockTotal: number;
  totalCost: number;
  players: SessionPlayer[];
}

/**
 * Compute each player's exact share (2 dp) and rounded share (nearest 1 000).
 */
export function computeSessionAmounts(input: ComputeInput): ComputeResult {
  const { players, courtFee, numShuttlecocks, shuttlecockUnitPrice } = input;
  const n = players.length;
  if (n === 0) throw new Error('Session must have at least one player');

  const shuttlecockTotal = toDP(numShuttlecocks * shuttlecockUnitPrice);
  const totalCost        = toDP(courtFee + shuttlecockTotal);
  const courtShare       = toDP(courtFee / n);
  const weightSum        = players.reduce((s, p) => s + p.smashWeight, 0);

  const result: SessionPlayer[] = players.map(p => {
    const shuttleShare = toDP((p.smashWeight / weightSum) * shuttlecockTotal);
    const amountOwed   = toDP(courtShare + shuttleShare);
    return {
      name:              p.name,
      smashWeight:       p.smashWeight,
      amountOwed,
      amountOwedRounded: roundVND(amountOwed),
    };
  });

  return { shuttlecockTotal, totalCost, players: result };
}

/* ── Import text parser ──────────────────────────────────── */

export interface ParseError {
  row: number;   // 0-based row index
  message: string;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: ParseError[];
}

/**
 * Parse raw text pasted by the user.
 *
 * Accepts two formats:
 *   • JSON array  — starts with "[", each element matches ImportRow shape
 *   • CSV         — header row + data rows, semicolon or comma delimited
 *
 * CSV expected columns (order matters, header names are case-insensitive):
 *   date | players | court_fee | num_shuttlecocks | shuttlecock_unit_price | note(optional)
 *
 * "players" column: comma-separated names inside the cell,
 *   e.g.  "Alice,Bob,Charlie"  or  "Alice; Bob; Charlie"
 *
 * Returns all successfully parsed rows plus a list of errors.
 */
export function parseImportText(raw: string): ParseResult {
  const text = raw.trim();
  if (!text) return { rows: [], errors: [] };

  if (text.startsWith('[')) {
    return parseJSON(text);
  }
  return parseCSV(text);
}

function parseJSON(text: string): ParseResult {
  const errors: ParseError[] = [];
  let parsed: unknown[];
  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: [], errors: [{ row: 0, message: 'Invalid JSON — must be an array of objects' }] };
  }
  if (!Array.isArray(parsed)) {
    return { rows: [], errors: [{ row: 0, message: 'JSON must be an array' }] };
  }

  const rows: ImportRow[] = [];
  parsed.forEach((item, i) => {
    const r = item as Record<string, unknown>;
    const err = validateRawRow(r, i);
    if (err) { errors.push(err); return; }
    rows.push(normaliseRow(r, i));
  });
  return { rows, errors };
}

function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] };

  // Detect delimiter: semicolon wins if header contains ";"
  const delim = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delim).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  const idx = (name: string) => headers.indexOf(name);
  const COL = {
    date:       idx('date'),
    players:    idx('players'),
    courtFee:   idx('court_fee'),
    numShut:    idx('num_shuttlecocks'),
    unitPrice:  idx('shuttlecock_unit_price'),
    note:       idx('note'),
  };

  const required = ['date', 'players', 'court_fee', 'num_shuttlecocks', 'shuttlecock_unit_price'] as const;
  const missing = required.filter(k => {
    const key = k as keyof typeof COL;
    return COL[key] === -1;
  });
  if (missing.length) {
    return { rows: [], errors: [{ row: 0, message: `Missing required columns: ${missing.join(', ')}` }] };
  }

  const rows: ImportRow[] = [];
  const errors: ParseError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delim).map(c => c.trim().replace(/^"|"$/g, ''));
    const raw: Record<string, unknown> = {
      date:                     cells[COL.date],
      players:                  cells[COL.players],
      court_fee:                cells[COL.courtFee],
      num_shuttlecocks:         cells[COL.numShut],
      shuttlecock_unit_price:   cells[COL.unitPrice],
      note:                     COL.note >= 0 ? cells[COL.note] : undefined,
    };
    const err = validateRawRow(raw, i);
    if (err) { errors.push(err); continue; }
    rows.push(normaliseRow(raw, i));
  }
  return { rows, errors };
}

function validateRawRow(r: Record<string, unknown>, i: number): ParseError | null {
  if (!r.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.date))) {
    return { row: i, message: `Row ${i + 1}: "date" must be YYYY-MM-DD` };
  }
  const playersRaw = r.players;
  const names = typeof playersRaw === 'string'
    ? playersRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : Array.isArray(playersRaw) ? (playersRaw as string[]).map(String) : [];
  if (names.length === 0) {
    return { row: i, message: `Row ${i + 1}: "players" must list at least one name` };
  }
  if (isNaN(Number(r.court_fee)) || Number(r.court_fee) < 0) {
    return { row: i, message: `Row ${i + 1}: "court_fee" must be a non-negative number` };
  }
  if (isNaN(Number(r.num_shuttlecocks)) || Number(r.num_shuttlecocks) < 0) {
    return { row: i, message: `Row ${i + 1}: "num_shuttlecocks" must be a non-negative number` };
  }
  if (isNaN(Number(r.shuttlecock_unit_price)) || Number(r.shuttlecock_unit_price) < 0) {
    return { row: i, message: `Row ${i + 1}: "shuttlecock_unit_price" must be a non-negative number` };
  }
  return null;
}

function normaliseRow(r: Record<string, unknown>, _i: number): ImportRow {
  const playersRaw = r.players;
  const players = typeof playersRaw === 'string'
    ? playersRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : Array.isArray(playersRaw) ? (playersRaw as string[]).map(String) : [];
  return {
    date:                 String(r.date),
    players,
    courtFee:             Number(r.court_fee),
    numShuttlecocks:      Number(r.num_shuttlecocks),
    shuttlecockUnitPrice: Number(r.shuttlecock_unit_price),
    note:                 r.note ? String(r.note) : undefined,
  };
}

/* ── VND formatter ───────────────────────────────────────── */

/** Format a VND amount with thousand separators, e.g. 125000 → "125,000 ₫" */
export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' ₫';
}
