import React from 'react';

interface TruncNameProps {
  name: string;
  maxWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const TruncName: React.FC<TruncNameProps> = ({
  name,
  className = '',
  style
}) => {
  return (
    <span
      className={className}
      style={{ wordBreak: 'break-word', whiteSpace: 'normal', ...style }}
    >
      {name}
    </span>
  );
};

export default TruncName;
