import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { DonationStatus, DonationWithDonor } from '../lib/types'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

const TABS: Array<{ key: DonationStatus | 'all'; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'fulfilled', label: 'Fulfilled' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

export default function AdminDashboard() {
  const [donations, setDonations] = useState<DonationWithDonor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<DonationStatus | 'all'>('pending')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function load() {
    setLoading(true)
    setError('')

    let query = supabase
      .from('donations')
      .select('*, profiles:donor_id(full_name, email)')
      .order('created_at', { ascending: false })

    if (tab !== 'all') query = query.eq('status', tab)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError('Could not load donations. ' + fetchError.message)
    } else {
      setDonations((data ?? []) as unknown as DonationWithDonor[])
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: DonationStatus) {
    setActionError('')
    setSavingId(id)
    const admin_notes = notesDraft[id]

    const { error: updateError } = await supabase
      .from('donations')
      .update({ status, admin_notes: admin_notes ?? null })
      .eq('id', id)

    if (updateError) {
      setActionError(`Could not update this donation: ${updateError.message}`)
      setSavingId(null)
      return
    }

    // Reflect the change locally instead of a full refetch, unless the
    // status change means it should leave the current filtered tab.
    setDonations((prev) =>
      tab === 'all'
        ? prev.map((d) => (d.id === id ? { ...d, status, admin_notes: admin_notes ?? d.admin_notes } : d))
        : prev.filter((d) => d.id !== id)
    )
    setSavingId(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-ink/70">Review, approve, and manage donation records.</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-denim text-paper' : 'text-ink/70 hover:bg-denim/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mt-4">
          <Alert kind="error" message={actionError} onDismiss={() => setActionError('')} />
        </div>
      )}

      <div className="mt-6">
        {loading && <LoadingSpinner label="Loading donations…" size="lg" />}
        {!loading && error && <Alert kind="error" message={error} />}
        {!loading && !error && donations.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink/20 px-6 py-12 text-center">
            <p className="text-ink/70">Nothing here right now.</p>
          </div>
        )}

        {!loading && !error && donations.length > 0 && (
          <div className="flex flex-col gap-4">
            {donations.map((donation) => (
              <div key={donation.id} className="rounded-lg border border-ink/10 bg-white/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">{donation.clothing_type}</h3>
                      <StatusBadge status={donation.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink/70">
                      Qty {donation.quantity} · {donation.location}
                    </p>
                    <p className="mt-1 text-sm text-ink/60">
                      From {donation.profiles?.full_name ?? 'Unknown donor'}
                      {donation.profiles?.email ? ` (${donation.profiles.email})` : ''}
                    </p>
                    {donation.description && <p className="mt-2 text-sm text-ink/80">{donation.description}</p>}
                  </div>
                  {donation.photo_urls.length > 0 && (
                    <img
                      src={donation.photo_urls[0]}
                      alt={`${donation.clothing_type} donation`}
                      className="h-20 w-20 shrink-0 rounded object-cover"
                    />
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor={`notes-${donation.id}`} className="mb-1 block text-xs font-medium text-ink/70">
                    Admin note (shown to the donor if rejected)
                  </label>
                  <textarea
                    id={`notes-${donation.id}`}
                    rows={2}
                    defaultValue={donation.admin_notes ?? ''}
                    onChange={(e) => setNotesDraft((prev) => ({ ...prev, [donation.id]: e.target.value }))}
                    className="w-full rounded border border-ink/20 px-3 py-2 text-sm focus:border-denim"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingId === donation.id || donation.status === 'approved'}
                    onClick={() => updateStatus(donation.id, 'approved')}
                    className="rounded bg-sage px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={savingId === donation.id || donation.status === 'rejected'}
                    onClick={() => updateStatus(donation.id, 'rejected')}
                    className="rounded bg-rust px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={savingId === donation.id || donation.status === 'fulfilled'}
                    onClick={() => updateStatus(donation.id, 'fulfilled')}
                    className="rounded bg-denim px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
                  >
                    Mark picked up
                  </button>
                  {savingId === donation.id && <LoadingSpinner label="Saving…" size="sm" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
