import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { Donation } from '../lib/types'
import DonationCard from '../components/DonationCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'

export default function DonorDashboard() {
  const { user, profile } = useAuth()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      const { data, error: fetchError } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', user!.id)
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (fetchError) {
        setError('Could not load your donations. ' + fetchError.message)
      } else {
        setDonations((data ?? []) as Donation[])
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user])

  const counts = {
    pending: donations.filter((d) => d.status === 'pending').length,
    approved: donations.filter((d) => d.status === 'approved').length,
    fulfilled: donations.filter((d) => d.status === 'fulfilled').length,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink/70">Here is everything you have submitted.</p>
        </div>
        <Link
          to="/donate"
          className="rounded bg-denim px-5 py-2.5 text-sm font-medium text-paper hover:bg-denim-dark"
        >
          Submit a donation
        </Link>
      </div>

      {!loading && donations.length > 0 && (
        <dl className="mt-8 grid grid-cols-3 gap-4 text-center sm:max-w-md">
          <div className="rounded border border-ink/10 py-3">
            <dt className="text-xs text-ink/60">Pending</dt>
            <dd className="font-display text-2xl font-bold text-mustard">{counts.pending}</dd>
          </div>
          <div className="rounded border border-ink/10 py-3">
            <dt className="text-xs text-ink/60">Approved</dt>
            <dd className="font-display text-2xl font-bold text-sage">{counts.approved}</dd>
          </div>
          <div className="rounded border border-ink/10 py-3">
            <dt className="text-xs text-ink/60">Picked up</dt>
            <dd className="font-display text-2xl font-bold text-denim">{counts.fulfilled}</dd>
          </div>
        </dl>
      )}

      <div className="mt-10">
        {loading && <LoadingSpinner label="Loading your donations…" size="lg" />}

        {!loading && error && <Alert kind="error" message={error} />}

        {!loading && !error && donations.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink/20 px-6 py-12 text-center">
            <p className="text-ink/70">You have not submitted a donation yet.</p>
            <Link to="/donate" className="mt-3 inline-block font-medium text-denim underline">
              Submit your first donation
            </Link>
          </div>
        )}

        {!loading && !error && donations.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
