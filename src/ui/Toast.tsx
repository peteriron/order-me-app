import { useEffect } from 'react'

export interface ToastMessage {
  id: number
  text: string
  action?: { label: string; run: () => void }
}

/** How long a toast (and its Undo) stays up. */
export const TOAST_MS = 5000

/** One short message at a time, above the bottom bar, gone after 5 s. */
export function Toast({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  return (
    <div className="toast" role="status">
      <span>{toast.text}</span>
      {toast.action && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            toast.action!.run()
            onDone()
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
