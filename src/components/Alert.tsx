interface AlertProps {
  kind: 'success' | 'error' | 'info'
  message: string
  onDismiss?: () => void
}

const styles: Record<AlertProps['kind'], string> = {
  success: 'border-sage bg-sage/10 text-sage',
  error: 'border-rust bg-rust/10 text-rust',
  info: 'border-denim bg-denim/10 text-denim',
}

export default function Alert({ kind, message, onDismiss }: AlertProps) {
  if (!message) return null
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${styles[kind]}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-current opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}
