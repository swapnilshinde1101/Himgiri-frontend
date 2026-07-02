import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onActionClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white border border-gray-100 rounded-3xl ${className}`}>
      <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 font-medium max-w-sm mb-6">{description}</p>
      {actionLabel && onActionClick && (
        <Button onClick={onActionClick} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
