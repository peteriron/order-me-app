import { useEffect, useRef } from 'react'
import { useFocusTrap } from './useFocusTrap.ts'

export interface Confirmation {
  text: string
  confirmLabel: string
  onConfirm: () => void
}

interface ConfirmDialogProps extends Confirmation {
  cancelLabel: string
  /** `danger` (the default) for destructive actions: a red button; `primary` for others, like Update. */
  tone?: 'danger' | 'primary'
  onClose: () => void
}

/**
 * In-app "are you sure?", mostly for destructive actions. Cancel is focused first, so an accidental Enter never
 * deletes. (Native confirm() is avoided: it looks foreign in an installed app and is blocked in some embedded views.)
 */
export function ConfirmDialog({ text, confirmLabel, cancelLabel, tone = 'danger', onConfirm, onClose }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  // Cancel is focused first (and Tab stays inside), so an accidental Enter never deletes.
  useFocusTrap(boxRef, cancelRef)

  useEffect(() => {
    // Capture phase + stopPropagation: Escape closes only this dialog, not a sheet it was opened over.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-text" tabIndex={-1}>
        <p id="confirm-text">{text}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-quiet" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
