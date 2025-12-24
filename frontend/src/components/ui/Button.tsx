import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  as?: 'button' | 'span' | 'div';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, children, disabled, as = 'button', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer gap-2';

    const variantStyles = {
      primary: 'bg-[var(--brand-primary)] hover:bg-transparent hover:text-[var(--brand-primary)] hover:border hover:border-[var(--brand-primary)] text-white shadow-[var(--shadow-sm)] border border-transparent transition-all',
      secondary: 'bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
      ghost: 'bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-[13px] rounded-[var(--radius-sm)]',
      md: 'px-4 py-2 text-[14px] rounded-[var(--radius-md)]',
      lg: 'px-6 py-3 text-[14px] rounded-[var(--radius-md)]'
    };

    const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

    // Render as span or div for label usage (file inputs)
    if (as === 'span') {
      return (
        <span className={combinedClassName}>
          {loading && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {children}
        </span>
      );
    }

    if (as === 'div') {
      return (
        <div className={combinedClassName}>
          {loading && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {children}
        </div>
      );
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

