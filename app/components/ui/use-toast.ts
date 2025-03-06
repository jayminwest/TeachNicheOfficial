"use client"

import { useState, useCallback } from "react"

type ToastVariant = 'default' | 'destructive'

type ToastProps = {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Toast = ToastProps & {
  id: string
  visible: boolean
  action?: React.ReactNode
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    setToasts(prev => [...prev, { id, title, description, variant, duration, visible: true }])
    
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 300) // Animation duration
    }, duration)
    
    return id
  }, [])
  
  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300) // Animation duration
  }, [])

  return { toast, dismiss, toasts }
}
