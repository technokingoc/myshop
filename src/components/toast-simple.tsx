'use client';

import { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function SimpleToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const { message, type = 'info' } = event.detail;
      const id = Date.now().toString();
      
      setToasts(prev => [...prev, { id, message, type }]);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 3000);
    };

    window.addEventListener('show-toast' as any, handleToast);
    return () => window.removeEventListener('show-toast' as any, handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'success' ? 'bg-green-600 text-white' :
            toast.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          } animate-in slide-in-from-right-full`}
        >
          {toast.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}