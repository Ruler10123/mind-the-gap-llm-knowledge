import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  description?: string
}

let toasts: ToastMessage[] = []
let listeners: Array<(toasts: ToastMessage[]) => void> = []

const notify = (toast: Omit<ToastMessage, 'id'>) => {
  const newToast = { ...toast, id: Math.random().toString(36).substr(2, 9) }
  toasts = [...toasts, newToast]
  listeners.forEach(listener => listener(toasts))

  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== newToast.id)
    listeners.forEach(listener => listener(toasts))
  }, 4000)
}

export const toast = {
  success: (message: string, options?: { description?: string }) => {
    notify({ type: 'success', message, description: options?.description })
  },
  error: (message: string, options?: { description?: string }) => {
    notify({ type: 'error', message, description: options?.description })
  },
  info: (message: string, options?: { description?: string }) => {
    notify({ type: 'info', message, description: options?.description })
  },
  warning: (message: string, options?: { description?: string }) => {
    notify({ type: 'warning', message, description: options?.description })
  },
}

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (newToasts: ToastMessage[]) => setMessages(newToasts)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  const remove = (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    listeners.forEach(listener => listener(toasts))
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
      {messages.map((msg) => {
        const Icon = msg.type === 'success' ? CheckCircle2
                   : msg.type === 'error' ? XCircle
                   : msg.type === 'warning' ? AlertTriangle
                   : Info

        const bgColor = msg.type === 'success' ? 'bg-green-50/95 border-green-200'
                      : msg.type === 'error' ? 'bg-red-50/95 border-red-200'
                      : msg.type === 'warning' ? 'bg-amber-50/95 border-amber-200'
                      : 'bg-blue-50/95 border-blue-200'

        const iconColor = msg.type === 'success' ? 'text-green-600'
                        : msg.type === 'error' ? 'text-red-600'
                        : msg.type === 'warning' ? 'text-amber-600'
                        : 'text-blue-600'

        const textColor = msg.type === 'success' ? 'text-green-900'
                        : msg.type === 'error' ? 'text-red-900'
                        : msg.type === 'warning' ? 'text-amber-900'
                        : 'text-blue-900'

        return (
          <div
            key={msg.id}
            className={`
              pointer-events-auto
              rounded-2xl backdrop-blur-xl border shadow-2xl p-4 min-w-[320px] max-w-md
              animate-in slide-in-from-top-2 fade-in duration-300
              ${bgColor}
            `}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${textColor}`}>{msg.message}</p>
                {msg.description && (
                  <p className={`text-xs mt-1 ${textColor} opacity-80`}>{msg.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(msg.id)}
                className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${textColor} opacity-50 hover:opacity-100`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
