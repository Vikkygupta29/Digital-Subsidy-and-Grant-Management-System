import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center p-4 max-w-md rounded-xl shadow-lg border ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
          : 'bg-rose-50 text-rose-900 border-rose-200'
      }`}
    >
      <div className="mr-3">
        {isSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-600" />
        )}
      </div>
      <div className="text-sm font-medium pr-2">{message}</div>
      <button
        onClick={onClose}
        className="ml-auto text-gray-400 hover:text-gray-600 p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
