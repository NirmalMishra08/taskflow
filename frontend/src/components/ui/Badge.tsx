import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        {
          'border-transparent bg-surface-100 text-surface-900': variant === 'default',
          'border-transparent bg-green-100 text-green-800': variant === 'success',
          'border-transparent bg-yellow-100 text-yellow-800': variant === 'warning',
          'border-transparent bg-red-100 text-red-800': variant === 'danger',
          'border-transparent bg-blue-100 text-blue-800': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}
