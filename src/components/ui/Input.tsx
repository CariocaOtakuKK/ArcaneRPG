import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-bg-tertiary border border-border-default text-text-primary placeholder-text-muted rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-border-focus transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          error ? 'border-status-danger' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-status-danger">{error}</span>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`bg-bg-tertiary border border-border-default text-text-primary placeholder-text-muted rounded-md p-3 text-sm focus:outline-none focus:border-border-focus transition-colors resize-y disabled:opacity-60 ${
          error ? 'border-status-danger' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-status-danger">{error}</span>}
    </div>
  );
};
