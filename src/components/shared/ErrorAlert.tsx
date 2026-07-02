import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorAlert({ message, onRetry, className = '' }: ErrorAlertProps) {
  return (
    <div className={`p-6 bg-red-50/50 border border-red-100 rounded-3xl flex flex-col items-center justify-center text-center ${className}`}>
      <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
      <h3 className="text-base font-bold text-red-800 mb-1">Load Failed</h3>
      <p className="text-sm text-red-600 font-medium max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="px-4 py-1.5 text-xs bg-white text-red-700 border-red-200 hover:bg-red-50">
          Try Again
        </Button>
      )}
    </div>
  );
}
