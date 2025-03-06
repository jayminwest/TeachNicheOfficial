"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { ToastProps } from "./use-toast"

type Toast = ToastProps & {
  id: string
  visible: boolean
}

interface ToastDisplayProps {
  toasts: Array<Toast>
  dismiss: (id: string) => void
}

export function ToastDisplay({ toasts, dismiss }: ToastDisplayProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`
            p-4 rounded-md shadow-lg border 
            ${toast.visible ? 'animate-in slide-in-from-right' : 'animate-out slide-out-to-right'} 
            ${toast.variant === 'destructive' 
              ? 'bg-destructive text-destructive-foreground border-destructive/20' 
              : 'bg-background border-border'
            }
          `}
        >
          {toast.title && (
            <div className="font-semibold mb-1">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
          <button 
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
            aria-label="Close toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
