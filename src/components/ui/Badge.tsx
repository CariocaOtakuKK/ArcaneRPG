import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-accent/20 text-accent border-accent/40',
    success: 'bg-status-success/20 text-status-success border-status-success/40',
    warning: 'bg-status-warning/20 text-status-warning border-status-warning/40',
    danger: 'bg-status-danger/20 text-status-danger border-status-danger/40',
    info: 'bg-status-info/20 text-status-info border-status-info/40',
    neutral: 'bg-bg-tertiary text-text-secondary border-border-subtle',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
