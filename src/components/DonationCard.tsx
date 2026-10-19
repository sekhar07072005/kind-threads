import type { ReactNode } from 'react'
import type { Donation } from '../lib/types'
import StatusBadge from './StatusBadge'

interface DonationCardProps {
  donation: Donation
  footer?: ReactNode
}

export default function DonationCard({ donation, footer }: DonationCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink/10 bg-white/60 p-4">
      {donation.photo_urls.length > 0 && (
        <img
          src={donation.photo_urls[0]}
          alt={`${donation.clothing_type} donation`}
          className="h-40 w-full rounded object-cover"
          loading="lazy"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl font-semibold leading-tight">{donation.clothing_type}</h3>
        <StatusBadge status={donation.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-ink/70">
        <dt className="font-medium text-ink">Quantity</dt>
        <dd>{donation.quantity}</dd>
        <dt className="font-medium text-ink">Location</dt>
        <dd className="truncate">{donation.location}</dd>
      </dl>
      {donation.description && <p className="text-sm text-ink/70">{donation.description}</p>}
      {donation.admin_notes && donation.status === 'rejected' && (
        <p className="rounded border border-rust/30 bg-rust/5 px-3 py-2 text-sm text-rust">
          Admin note: {donation.admin_notes}
        </p>
      )}
      {footer}
    </div>
  )
}
