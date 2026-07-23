import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`card ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => {
  return <div className="card-title" style={style}>{children}</div>;
};

export default Card;
