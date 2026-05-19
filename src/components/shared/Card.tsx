import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export default function Card({ children, title, subtitle, className, actions }: CardProps) {
  return (
    <div className={clsx("bg-white rounded-xl shadow-sm border border-gray-100", className)}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
