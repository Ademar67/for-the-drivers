'use client';

import { createContext, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning';

type Toast = {
  id: number;
  title: string;
  description?: string;
  type?: ToastType;
};

type ToastContextType = {
  toast: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (t: Omit<Toast, 'id'>) => {
    const id = Date.now();

    setToasts((prev) => [...prev, { ...t, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl px-4 py-3 shadow-lg text-white min-w-[250px]
              ${
                t.type === 'success'
                  ? 'bg-green-600'
                  : t.type === 'error'
                  ? 'bg-red-600'
                  : t.type === 'warning'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-blue-600'
              }
            `}
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-sm opacity-90">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}