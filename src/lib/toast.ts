import { create } from 'zustand'
import type { ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type Toast = {
  key: string
  tone: ToastTone
  title: ReactNode
  description?: ReactNode
  action?: { label: string; onClick: () => void }
  // Seconds
  duration: number
}

type ToastState = { toasts: Toast[] }

export const useToasts = create<ToastState>(() => ({ toasts: [] }))

const timers = new Map<string, ReturnType<typeof setTimeout>>()
let seq = 0

const dismiss = (key: string) => {
  clearTimeout(timers.get(key))
  timers.delete(key)
  useToasts.setState(s => ({ toasts: s.toasts.filter(t => t.key !== key) }))
}

// A toast with the key of a toast on screen takes its place (and its timer starts again)
const show = (toast: Partial<Toast> & Pick<Toast, 'title'>) => {
  const item: Toast = { key: `toast-${++seq}`, tone: 'info', duration: 4, ...toast }

  clearTimeout(timers.get(item.key))
  useToasts.setState(s => {
    const exists = s.toasts.some(t => t.key === item.key)
    return { toasts: exists ? s.toasts.map(t => (t.key === item.key ? item : t)) : [...s.toasts, item] }
  })
  if (item.duration > 0) {
    timers.set(item.key, setTimeout(() => dismiss(item.key), item.duration * 1000))
  }

  return item.key
}

export const toast = {
  show,
  dismiss,
  success: (title: ReactNode, description?: ReactNode) => show({ tone: 'success', title, description }),
  error: (title: ReactNode, description?: ReactNode) => show({ tone: 'error', title, description, duration: 7 }),
  info: (title: ReactNode, description?: ReactNode) => show({ tone: 'info', title, description }),
}
