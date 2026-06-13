import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon: Icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-himgiri-primary text-white hover:bg-himgiri-primary-dark shadow-blue-100 focus:ring-himgiri-primary',
    secondary: 'bg-himgiri-secondary-light text-himgiri-secondary-dark hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-himgiri-danger text-white hover:bg-himgiri-danger-dark shadow-red-100 focus:ring-himgiri-danger',
    success: 'bg-himgiri-success text-white hover:bg-himgiri-success-dark shadow-emerald-100 focus:ring-himgiri-success',
    warning: 'bg-himgiri-warning text-white hover:bg-himgiri-warning-dark shadow-amber-100 focus:ring-himgiri-warning',
    ghost: 'bg-transparent text-himgiri-secondary hover:bg-himgiri-secondary-light focus:ring-gray-500',
    outline: 'bg-transparent border border-gray-300 text-himgiri-secondary-dark hover:bg-gray-50 focus:ring-gray-500',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        !isLoading && "shadow-sm",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children && <span>Loading...</span>}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {Icon && iconPosition === 'left' && <Icon className={clsx(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={clsx(size === 'xs' ? 'h-3 w-3' : 'h-4 w-4')} />}
        </span>
      )}
    </button>
  );
}
