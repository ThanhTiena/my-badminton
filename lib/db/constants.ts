// ─── Database constants ───────────────────────────────────────────────────
// Single source of truth for DB name and collection names.
// Import from here — never hardcode "smashtour" in API files.

export const DB_NAME = 'smashtour';

export const COLLECTIONS = {
  PLAYERS:           'players',
  COURT_SESSIONS:    'court_sessions',
  PAYMENT_CONFIG:    'payment_config',
  PAYMENT_PAID:      'payment_paid',
  ACTIVE_TOURNAMENT: 'active_tournament',
  TOURNAMENT_HISTORY:'tournament_history',
  BETS:              'bets',
  USERS:             'users',          // replaces admin_config
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
