import React from 'react';

interface BadgeProps {
  group: 'pro' | 'beg';
}

export const Badge: React.FC<BadgeProps> = ({ group }) => {
  return (
    <span className={`badge badge-${group}`}>
      {group === 'pro' ? 'PRO' : 'BEG'}
    </span>
  );
};

export default Badge;
