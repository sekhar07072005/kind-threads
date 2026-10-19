import type { DonationStatus } from '../lib/types'

const labels: Record<DonationStatus, string> = {
  pending: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Not approved',
  fulfilled: 'Picked up',
}

const styles: Record<DonationStatus, string> = {
  pending: 'border-mustard/40 bg-mustard/15 text-mustard',
  approved: 'border-sage/40 bg-sage/15 text-sage',
  rejected: 'border-rust/40 bg-rust/15 text-rust',
  fulfilled: 'border-denim/40 bg-denim/15 text-denim',
}

export default function StatusBadge({ status }: { status: DonationStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
