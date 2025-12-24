import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[var(--text-secondary)] text-[13px] font-medium mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-3 py-2 text-[14px] appearance-none',
              'bg-[var(--bg-primary)] text-[var(--text-primary)]',
              'border border-[var(--border-subtle)] rounded-[var(--radius-sm)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-0',
              'transition-all duration-200',
              error && 'border-[var(--error)]',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom arrow indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {error && (
          <p className="mt-1.5 text-[12px] text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
