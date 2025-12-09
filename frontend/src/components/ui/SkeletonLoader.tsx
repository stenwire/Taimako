import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'circle' | 'rectangle';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  count = 1,
  className
}) => {
  const variantStyles = {
    text: 'h-4 w-full',
    circle: 'h-12 w-12 rounded-full',
    rectangle: 'h-32 w-full'
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('skeleton', variantStyles[variant], className)}
        />
      ))}
    </>
  );
};

export default SkeletonLoader;
