interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg border p-6 w-80"
        style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-sm font-semibold uppercase tracking-wider mb-2"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
        >
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded border cursor-pointer"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', backgroundColor: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm rounded cursor-pointer"
            style={{ backgroundColor: 'var(--color-danger)', color: '#fff', border: 'none' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
