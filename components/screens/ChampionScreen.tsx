import React from 'react';
import type { Team, GameType } from '@/lib/tournament';
import { Btn, Confetti } from '@/components/ui';

interface ChampionScreenProps {
  champion: Team;
  gameType: GameType;
  onNew: () => void;
  onViewHistory: () => void;
}

export const ChampionScreen: React.FC<ChampionScreenProps> = ({
  champion,
  gameType,
  onNew,
  onViewHistory,
}) => {
  return (
    <>
      <Confetti active />
      <div className="champion-wrap anim-fade">
        <span className="champion-trophy anim-trophy">🏆</span>
        <p className="champion-title">Tournament Champion</p>
        <p className="champion-name">{champion.name}</p>
        <p className="champion-sub">
          {gameType === 'doubles'
            ? `🎉 ${champion.players.join(' & ')} — Doubles Champions!`
            : '🎉 Congratulations on winning the tournament!'}
        </p>
        <div className="champion-btns">
          <Btn variant="primary" size="lg" onClick={onNew}>
            🏸 New Tournament
          </Btn>
          <Btn variant="secondary" size="lg" onClick={onViewHistory}>
            📜 Tournament History
          </Btn>
        </div>
      </div>
    </>
  );
};

export default ChampionScreen;
