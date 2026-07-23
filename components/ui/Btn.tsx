import React from 'react';

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'orange' | 'ghost' | 'pro' | 'beg';
  size?: 'sm' | 'lg';
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export const Btn: React.FC<BtnProps> = ({
  children,
  variant = 'primary',
  size,
  full,
  disabled,
  onClick,
  className = '',
  ariaLabel,
}) => {
  return (
    <button
      className={`btn btn-${variant}${size ? ` btn-${size}` : ''}${full ? ' btn-full' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Btn;
