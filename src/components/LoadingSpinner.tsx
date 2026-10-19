interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const dimsBySize = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export default function LoadingSpinner({ label = 'Loading…', size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className={`inline-block animate-spin rounded-full border-denim border-t-transparent ${dimsBySize[size]}`} />
      <span className="text-sm text-ink/70">{label}</span>
    </div>
  )
}
