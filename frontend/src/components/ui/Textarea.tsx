import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[var(--text-secondary)] text-[13px] font-medium mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-[14px]',
            'bg-[var(--bg-primary)] text-[var(--text-primary)]',
            'border border-[var(--border-subtle)] rounded-[var(--radius-sm)]',
            'placeholder:text-[var(--text-tertiary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-0',
            'transition-all duration-200 resize-y',
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

Textarea.displayName = 'Textarea';

export default Textarea;
