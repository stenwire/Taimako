import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[var(--text-secondary)] text-[13px] font-medium mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-[14px]',
            'bg-[var(--bg-primary)] text-[var(--text-primary)]',
            'border border-[var(--border-subtle)] rounded-[var(--radius-sm)]',
            'placeholder:text-[var(--text-tertiary)]',
            'focus-ring',
            'transition-all duration-200',
            error && 'border-[var(--error)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[12px] text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
