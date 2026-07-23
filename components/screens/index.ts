/**
 * Screen Components Export
 *
 * This file provides both eager and lazy-loaded exports of all screen components.
 * Use lazy exports for code-splitting in production.
 */

// Eager exports (for non-lazy imports)
export { default as RosterScreen } from './RosterScreen';
export { default as SetupScreen } from './SetupScreen';
export { default as ChampionScreen } from './ChampionScreen';
export { default as TrainingScreen } from './TrainingScreen';

// Lazy exports for code-splitting (use with React.Suspense)
export { default as RosterScreenLazy } from './RosterScreen';
export { default as SetupScreenLazy } from './SetupScreen';
export { default as ChampionScreenLazy } from './ChampionScreen';
export { default as TrainingScreenLazy } from './TrainingScreen';

// TODO: Extract these complex screens from pages/index.tsx
// export { default as TournamentScreen } from './TournamentScreen';
// export { default as HistoryScreen } from './HistoryScreen';
// export { default as RankingsScreen } from './RankingsScreen';
// export { default as PaymentScreen } from './PaymentScreen';
// export { default as BetsScreen } from './BetsScreen';
// export { default as AttendanceScreen } from './AttendanceScreen';
// export { default as AnalyticsScreen } from './AnalyticsScreen';
// export { default as VenuesScreen } from './VenuesScreen';
// export { default as PricingRulesScreen } from './PricingRulesScreen';
