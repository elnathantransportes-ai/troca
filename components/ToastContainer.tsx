import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, X } from './IconComponents';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-top-5 fade-in duration-300 ${
              toast.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-100' 
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-100'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100'
            }`}
          >
            <div className={`p-1 rounded-full ${
                toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
            }`}>
                {toast.type === 'success' ? <CheckCircle className="w-3 h-3 text-black" /> : <AlertCircle className="w-3 h-3 text-black" />}
            </div>
            <p className="text-xs font-bold flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};