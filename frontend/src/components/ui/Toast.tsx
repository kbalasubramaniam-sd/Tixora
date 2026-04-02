import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timersRef.current.delete(id)
    }, 5000)
    timersRef.current.set(id, timer)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'glass rounded-lg px-4 py-3 shadow-ambient text-sm font-medium',
              'animate-[slideIn_300ms_ease-out]',
              t.type === 'success' && 'bg-success-container/80 text-success',
              t.type === 'error' && 'bg-error-container/80 text-error',
              t.type === 'info' && 'bg-secondary-container/80 text-on-secondary-container',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
