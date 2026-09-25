import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let globalToastHandler = null;

// Standalone toast helper callable anywhere without needing hooks
export const toast = {
  success: (message, options) => globalToastHandler?.('success', message, options),
  error: (message, options) => globalToastHandler?.('error', message, options),
  warning: (message, options) => globalToastHandler?.('warning', message, options),
  info: (message, options) => globalToastHandler?.('info', message, options),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const duration = options.duration || 4500;
    const title = options.title || (
      type === 'success' ? 'Success' :
      type === 'error' ? 'Notice / Error' :
      type === 'warning' ? 'Attention Required' : 'Information'
    );

    const newToast = { id, type, title, message: String(message), duration };
    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalToastHandler = addToast;

    // Safely override native window.alert to guarantee no ugly browser popups
    const originalAlert = window.alert;
    window.alert = (msg) => {
      const text = String(msg || '');
      const lower = text.toLowerCase();
      if (lower.includes('success') || lower.includes('approved') || lower.includes('sanctioned')) {
        addToast('success', text);
      } else if (lower.includes('fail') || lower.includes('error') || lower.includes('rejected')) {
        addToast('error', text);
      } else if (lower.includes('check') || lower.includes('require') || lower.includes('please') || lower.includes('warning')) {
        addToast('warning', text);
      } else {
        addToast('info', text);
      }
    };

    return () => {
      globalToastHandler = null;
      window.alert = originalAlert;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}

      {/* Modern Stitch Floating Toaster Container */}
      <div 
        aria-live="polite" 
        className="fixed top-20 right-4 z-[9999] flex flex-col space-y-3 max-w-sm sm:max-w-md w-full pointer-events-none px-2 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 flex items-start space-x-3 p-4 rounded-xl shadow-xl border bg-white/95 backdrop-blur-md ${
                isSuccess
                  ? 'border-emerald-200 border-l-4 border-l-emerald-600 text-slate-800'
                  : isError
                  ? 'border-red-200 border-l-4 border-l-red-600 text-slate-800'
                  : isWarning
                  ? 'border-amber-200 border-l-4 border-l-amber-500 text-slate-800'
                  : 'border-blue-200 border-l-4 border-l-blue-600 text-slate-800'
              }`}
              style={{
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)'
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <XCircle className="w-5 h-5 text-red-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#00142f]">
                    {t.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-display">just now</span>
                </div>
                <div className="text-xs text-slate-700 mt-1 font-body leading-relaxed break-words whitespace-pre-line">
                  {t.message}
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast };
  }
  return ctx;
}
