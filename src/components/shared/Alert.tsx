import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { clsx } from 'clsx';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function Alert({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  className 
}: AlertProps) {
  const styles = {
    success: {
      bg: 'bg-himgiri-success-light',
      border: 'border-himgiri-success-light',
      text: 'text-himgiri-success-dark',
      icon: CheckCircle2
    },
    error: {
      bg: 'bg-himgiri-danger-light',
      border: 'border-himgiri-danger-light',
      text: 'text-himgiri-danger-dark',
      icon: AlertCircle
    },
    warning: {
      bg: 'bg-himgiri-warning-light',
      border: 'border-himgiri-warning-light',
      text: 'text-himgiri-warning-dark',
      icon: AlertTriangle
    },
    info: {
      bg: 'bg-himgiri-primary-light',
      border: 'border-himgiri-primary-light',
      text: 'text-himgiri-primary-dark',
      icon: Info
    }
  };

  const { bg, border, text, icon: Icon } = styles[type];

  return (
    <div className={clsx(
      "flex p-4 rounded-xl border animate-in fade-in slide-in-from-top-2",
      bg, border, text, className
    )}>
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-3 flex-1">
        {title && <h3 className="text-sm font-bold mb-1">{title}</h3>}
        <div className="text-sm opacity-90">{message}</div>
      </div>
      {onClose && (
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
