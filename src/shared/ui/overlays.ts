import type { Confirmation } from './ConfirmDialog.tsx'
import type { ToastMessage } from './Toast.tsx'

/** App-wide overlays a feature can raise without owning them: a confirm dialog, or a short toast. */
export interface Overlays {
  confirm: (confirmation: Confirmation) => void
  notify: (text: string, action?: ToastMessage['action']) => void
}
