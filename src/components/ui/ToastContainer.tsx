import React from 'react';
import { useAppStore } from '@/core/store/appStore';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-status-info flex-shrink-0" />,
        };

        const borderMap = {
          success: 'border-status-success/60',
          error: 'border-status-danger/60',
          warning: 'border-status-warning/60',
          info: 'border-status-info/60',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-bg-secondary border ${borderMap[toast.type]} shadow-card rounded-lg p-3.5 flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-5 duration-200`}
          >
            {iconMap[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-text-primary capitalize">{toast.title}</h4>
              <p className="text-xs text-text-secondary mt-0.5 break-words leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
              aria-label="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
