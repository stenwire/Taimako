import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className, headerAction, onClick }) => {
  return (
    <div className={cn('attio-card', onClick && 'cursor-pointer', className)} onClick={onClick}>
      {(title || subtitle || headerAction) && (
        <div className="attio-card-header flex items-center justify-between">
          <div>
            {title && <h3 className="text-h2 text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="text-small text-[var(--text-secondary)] mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
