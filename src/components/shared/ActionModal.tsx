import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  CheckCircle2, 
  Info, 
  X,
  AlertCircle 
} from 'lucide-react';
import Button from './Button';

type ModalVariant = 'delete' | 'confirm' | 'warning' | 'info' | 'success';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant?: ModalVariant;
  title: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
}

export default function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  variant = 'confirm',
  title,
  message,
  confirmText,
  isLoading
}: ActionModalProps) {
  if (!isOpen) return null;

  const configs = {
    delete: {
      icon: Trash2,
      iconBg: 'bg-himgiri-danger-light',
      iconColor: 'text-himgiri-danger',
      btnVariant: 'danger' as const,
      defaultText: 'Delete'
    },
    confirm: {
      icon: CheckCircle2,
      iconBg: 'bg-himgiri-primary-light',
      iconColor: 'text-himgiri-primary',
      btnVariant: 'primary' as const,
      defaultText: 'Confirm'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-himgiri-warning-light',
      iconColor: 'text-himgiri-warning',
      btnVariant: 'warning' as const,
      defaultText: 'Proceed'
    },
    info: {
      icon: Info,
      iconBg: 'bg-himgiri-primary-light',
      iconColor: 'text-himgiri-primary',
      btnVariant: 'primary' as const,
      defaultText: 'Okay'
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-himgiri-success-light',
      iconColor: 'text-himgiri-success',
      btnVariant: 'success' as const,
      defaultText: 'Great!'
    }
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-himgiri-secondary-dark/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-2xl ${config.iconBg} ${config.iconColor} flex items-center justify-center mb-6`}>
            <Icon className="h-8 w-8" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-himgiri-secondary-dark/70 text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="bg-gray-50/80 px-8 py-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            variant={config.btnVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 order-1 sm:order-2 shadow-lg"
          >
            {confirmText || config.defaultText}
          </Button>
        </div>
      </div>
    </div>
  );
}
