import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-lg border border-border-subtle p-4 transition-colors ${
        elevated ? 'bg-bg-elevated shadow-card' : 'bg-bg-secondary'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
