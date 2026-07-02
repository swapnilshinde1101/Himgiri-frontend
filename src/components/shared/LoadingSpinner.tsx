import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ className = '', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-himgiri-primary border-r-transparent border-b-transparent border-l-transparent border-solid ${sizeClasses[size]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
