'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rounded' | 'circular' | 'rectangular';
  style?: React.CSSProperties;
}

/**
 * Skeleton component for showing loading placeholders
 * Displays animated shimmer effect while content is loading
 */
export function Skeleton({
  className = '',
  width,
  height,
  variant = 'rounded',
  style,
}: SkeletonProps) {
  const borderRadius =
    variant === 'circular'
      ? '50%'
      : variant === 'rounded'
      ? '10px'
      : '4px';

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        backgroundColor: 'var(--bg-soft)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="skeleton-shimmer" />
    </div>
  );
}

export interface SkeletonCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton card wrapper - provides card styling around skeleton elements
 */
export function SkeletonCard({ children, className = '', style }: SkeletonCardProps) {
  return (
    <div className={`card ${className}`} style={{ padding: 24, ...style }}>
      {children}
    </div>
  );
}
