import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            t.type === 'success'
              ? 'bg-slate-900 text-white border-teal-500/50 shadow-teal-950/20'
              : 'bg-rose-950 text-white border-rose-600/50 shadow-rose-950/20'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-semibold">{t.type === 'success' ? 'Success' : 'Notice'}</p>
            <p className="text-slate-300 text-[11px] mt-0.5">{t.message}</p>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
