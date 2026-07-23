import React from 'react';

interface EmptyStateProps {
  icon: string;
  text: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, text }) => {
  return (
    <div className="empty-state">
      <span className="icon">{icon}</span>
      <p>{text}</p>
    </div>
  );
};

export default EmptyState;
