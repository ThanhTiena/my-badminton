import React, { useState, useEffect } from 'react';

interface ConfettiProps {
  active: boolean;
}

export const Confetti: React.FC<ConfettiProps> = ({ active }) => {
  const [pieces, setPieces] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = [
      '#7C3AED', '#EC4899', '#0EA5E9', '#06B6D4',
      '#F59E0B', '#10B981', '#FF6B6B', '#ffffff'
    ];

    setPieces(
      Array.from({ length: 120 }, () => ({
        left: `${Math.random() * 100}vw`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        width: `${Math.random() * 8 + 5}px`,
        height: `${Math.random() * 8 + 5}px`,
        animationDuration: `${Math.random() * 3 + 2}s`,
        animationDelay: `${Math.random() * 2}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }))
    );

    const t = setTimeout(() => setPieces([]), 6500);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div className="confetti-layer">
      {pieces.map((s, i) => (
        <div key={i} className="confetti-piece anim-fall" style={s} />
      ))}
    </div>
  );
};

export default Confetti;
