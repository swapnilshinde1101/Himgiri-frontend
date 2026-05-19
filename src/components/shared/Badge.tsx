import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  const variants = {
    success: 'bg-himgiri-success-light text-himgiri-success-dark border-himgiri-success-light',
    warning: 'bg-himgiri-warning-light text-himgiri-warning-dark border-himgiri-warning-light',
    danger: 'bg-himgiri-danger-light text-himgiri-danger-dark border-himgiri-danger-light',
    info: 'bg-himgiri-primary-light text-himgiri-primary-dark border-himgiri-primary-light',
    gray: 'bg-himgiri-secondary-light text-himgiri-secondary-dark border-himgiri-secondary-light',
  };

  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
