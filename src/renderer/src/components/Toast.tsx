interface ToastProps {
  messages: string[]
  onDismiss: () => void
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  if (messages.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 100,
        maxWidth: '380px',
        backgroundColor: 'var(--color-surface-raised)',
        border: '1px solid var(--color-danger)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-danger)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}
          >
            launch warning
          </p>
          {messages.map((msg, i) => (
            <p key={i} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
              {msg}
            </p>
          ))}
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontSize: '16px',
            lineHeight: 1,
            padding: '0',
            flexShrink: 0
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
