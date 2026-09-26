import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation built on the native <dialog>: showModal() brings focus
 * trapping, Escape to close and the right semantics for screen readers.
 */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        // Escape: let React state close the dialog so it stays the single source of truth.
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        // A click on the dialog element itself (not its content) hit the backdrop.
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="dialog-body">
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        <p id={messageId} className="dialog-message">
          {message}
        </p>
        <div className="dialog-actions">
          <Button autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="dangerSolid" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
