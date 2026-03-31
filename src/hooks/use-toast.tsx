"use client"

import * as React from "react"

type Toast = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const ToastContext = React.createContext<{
  toast: (props: Toast) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  function toast(props: Toast) {
    setToasts((prev) => [...prev, props])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t, i) => (
          <div
            key={i}
            className={`rounded-lg px-4 py-3 shadow text-white ${
              t.variant === "destructive"
                ? "bg-red-600"
                : "bg-slate-900"
            }`}
          >
            <p className="font-semibold">{t.title}</p>
            <p className="text-sm">{t.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside ToastProvider")
  return context
}